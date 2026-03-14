import { z } from 'zod';

export const noteAttachmentSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  kind: z.enum(['image', 'file']),
  sizeLabel: z.string().min(1),
  objectKey: z.string().min(1),
  url: z.string().min(1),
  mimeType: z.string().min(1).optional(),
});

export const createNoteSchema = z.object({
  content: z.string().trim().min(1, 'Note content is required'),
  richContent: z.string().trim().min(1, 'Rich note content is required'),
  projectId: z.string().trim().min(1, 'Project is required'),
  tags: z.array(z.string().trim().min(1)).default([]),
  attachments: z.array(noteAttachmentSchema).default([]),
});

export const updateNoteSchema = createNoteSchema.partial().refine(
  (payload) =>
    payload.content !== undefined ||
    payload.richContent !== undefined ||
    payload.projectId !== undefined ||
    payload.tags !== undefined ||
    payload.attachments !== undefined,
  {
    message: 'At least one field must be provided',
  }
);
