import crypto from 'node:crypto';
import path from 'node:path';
import type { Request, Response } from 'express';
import { Client as MinioClient } from 'minio';
import { env } from '../../config/env.js';
import { NoteModel } from '../../models/note.model.js';
import { TaskModel } from '../../models/task.model.js';
import { createNoteSchema, updateNoteSchema } from '../../schemas/note.schema.js';
import { hasGeminiNoteAnalysisConfig, queueNoteAnalysis } from '../../services/gemini-note-analysis.service.js';
import { serializeNote } from './note.serializer.js';

function requireUser(request: Request) {
  if (!request.user) {
    const error = new Error('Authentication required') as Error & { statusCode?: number };
    error.statusCode = 401;
    throw error;
  }

  return request.user;
}

function createHttpError(message: string, statusCode: number) {
  const error = new Error(message) as Error & { statusCode?: number };
  error.statusCode = statusCode;
  return error;
}

const minioClient = new MinioClient({
  endPoint: env.MINIO_ENDPOINT,
  port: env.MINIO_PORT,
  useSSL: env.MINIO_USE_SSL,
  accessKey: env.MINIO_ACCESS_KEY,
  secretKey: env.MINIO_SECRET_KEY,
});

let bucketReadyPromise: Promise<void> | null = null;

function formatSize(size: number) {
  if (size >= 1024 * 1024) {
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  }

  return `${Math.max(1, Math.round(size / 1024))} KB`;
}

async function ensureBucket() {
  if (!bucketReadyPromise) {
    bucketReadyPromise = (async () => {
      const exists = await minioClient.bucketExists(env.MINIO_BUCKET);

      if (!exists) {
        await minioClient.makeBucket(env.MINIO_BUCKET);
      }
    })();
  }

  await bucketReadyPromise;
}

function getAttachmentKind(mimeType: string, originalName: string) {
  if (mimeType.startsWith('image/')) {
    return 'image' as const;
  }

  if (mimeType.startsWith('audio/')) {
    return 'audio' as const;
  }

  const extension = path.extname(originalName).toLowerCase();
  if (['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'].includes(extension)) {
    return 'image' as const;
  }

  if (['.mp3', '.wav', '.ogg', '.m4a', '.aac', '.webm'].includes(extension)) {
    return 'audio' as const;
  }

  return 'file' as const;
}

async function persistUpload(file: Express.Multer.File) {
  await ensureBucket();

  const extension = path.extname(file.originalname);
  const safeBaseName = path
    .basename(file.originalname, extension)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
  const objectKey = `${Date.now()}-${crypto.randomUUID()}-${safeBaseName || 'file'}${extension}`;

  await minioClient.putObject(env.MINIO_BUCKET, objectKey, file.buffer, file.size, {
    'Content-Type': file.mimetype || 'application/octet-stream',
  });

  return {
    id: crypto.randomUUID(),
    name: file.originalname,
    kind: getAttachmentKind(file.mimetype, file.originalname),
    sizeLabel: formatSize(file.size),
    objectKey,
    url: `/api/notes/attachments/${encodeURIComponent(objectKey)}`,
    mimeType: file.mimetype || undefined,
  };
}

async function removeAttachmentObject(objectKey: string) {
  await ensureBucket();

  try {
    await minioClient.removeObject(env.MINIO_BUCKET, objectKey);
  } catch (error) {
    const minioError = error as { code?: string };

    if (minioError.code === 'NoSuchKey' || minioError.code === 'NotFound') {
      return;
    }

    throw error;
  }
}

export async function listNotes(request: Request, response: Response) {
  const user = requireUser(request);
  const notes = await NoteModel.find({ userId: user._id }).sort({ createdAt: -1 }).lean();

  response.json({
    ok: true,
    notes: notes.map(serializeNote),
  });
}

export async function getNote(request: Request, response: Response) {
  const user = requireUser(request);
  const note = await NoteModel.findOne({ _id: request.params.noteId, userId: user._id }).lean();

  if (!note) {
    throw createHttpError('Note not found', 404);
  }

  response.json({
    ok: true,
    note: serializeNote(note),
  });
}

export async function createNote(request: Request, response: Response) {
  const user = requireUser(request);
  const payload = createNoteSchema.parse(request.body);
  const isGeminiEnabled = hasGeminiNoteAnalysisConfig();

  const note = await NoteModel.create({
    userId: user._id,
    content: payload.content,
    richContent: payload.richContent,
    projectId: payload.projectId,
    tags: payload.tags,
    attachments: payload.attachments,
    analysis: {
      status: isGeminiEnabled ? 'pending' : 'idle',
      summary: isGeminiEnabled ? 'Analysis queued.' : '',
      lastAnalyzedAt: null,
    },
  });

  if (isGeminiEnabled) {
    queueNoteAnalysis(note.id, user._id);
  }

  response.status(201).json({
    ok: true,
    note: serializeNote(note),
  });
}

export async function updateNote(request: Request, response: Response) {
  const user = requireUser(request);
  const payload = updateNoteSchema.parse(request.body);
  const existing = await NoteModel.findOne({ _id: request.params.noteId, userId: user._id });

  if (!existing) {
    throw createHttpError('Note not found', 404);
  }

  const update: Record<string, unknown> = {};

  if (payload.content !== undefined) {
    update.content = payload.content;
  }

  if (payload.richContent !== undefined) {
    update.richContent = payload.richContent;
  }

  if (payload.projectId !== undefined) {
    update.projectId = payload.projectId;
  }

  if (payload.tags !== undefined) {
    update.tags = payload.tags;
  }

  if (payload.attachments !== undefined) {
    update.attachments = payload.attachments;

    const nextKeys = new Set(payload.attachments.map((attachment) => attachment.objectKey));
    const removedAttachments = existing.attachments.filter((attachment) => !nextKeys.has(attachment.objectKey));
    await Promise.all(removedAttachments.map((attachment) => removeAttachmentObject(attachment.objectKey)));
  }

  const note = await NoteModel.findOneAndUpdate(
    { _id: request.params.noteId, userId: user._id },
    { $set: update },
    { new: true }
  );

  response.json({
    ok: true,
    note: serializeNote(note!),
  });
}

export async function deleteNote(request: Request, response: Response) {
  const user = requireUser(request);
  const note = await NoteModel.findOneAndDelete({ _id: request.params.noteId, userId: user._id });

  if (!note) {
    throw createHttpError('Note not found', 404);
  }

  await Promise.all(note.attachments.map((attachment) => removeAttachmentObject(attachment.objectKey)));
  await TaskModel.deleteMany({ userId: user._id, noteId: request.params.noteId, source: 'note_ai' });
  await TaskModel.updateMany({ userId: user._id, noteId: request.params.noteId, source: 'manual' }, { $set: { noteId: null } });

  response.status(204).send();
}

export async function uploadAttachments(request: Request, response: Response) {
  requireUser(request);

  const files = request.files;
  if (!Array.isArray(files) || files.length === 0) {
    throw createHttpError('At least one file is required', 400);
  }

  const attachments = await Promise.all(files.map((file) => persistUpload(file)));

  response.status(201).json({
    ok: true,
    attachments,
  });
}

export async function streamAttachment(request: Request, response: Response) {
  const user = requireUser(request);
  const objectKeyParam = request.params.objectKey;
  const objectKey = Array.isArray(objectKeyParam) ? objectKeyParam[0] : objectKeyParam;

  if (!objectKey) {
    throw createHttpError('Attachment not found', 404);
  }

  const note = await NoteModel.findOne({
    userId: user._id,
    'attachments.objectKey': objectKey,
  }).lean();

  if (!note) {
    throw createHttpError('Attachment not found', 404);
  }

  const attachment = note.attachments.find((item) => item.objectKey === objectKey);
  if (!attachment) {
    throw createHttpError('Attachment not found', 404);
  }

  await ensureBucket();
  const stream = await minioClient.getObject(env.MINIO_BUCKET, objectKey);

  response.setHeader('Content-Type', attachment.mimeType || 'application/octet-stream');
  response.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(attachment.name)}"`);
  stream.pipe(response);
}
