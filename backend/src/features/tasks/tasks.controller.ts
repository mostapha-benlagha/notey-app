import type { Request, Response } from 'express';
import { TaskModel } from '../../models/task.model.js';
import { TaskStatusModel } from '../../models/task-status.model.js';
import {
  createExtractedTasksSchema,
  createTaskSchema,
  saveTaskStatusesSchema,
  updateTaskSchema,
} from '../../schemas/task.schema.js';
import { ensureTaskStatuses } from '../../services/task-status.service.js';
import { serializeTask, serializeTaskStatus } from './task.serializer.js';

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

export async function listTasks(request: Request, response: Response) {
  const user = requireUser(request);
  const [statuses, tasks] = await Promise.all([
    ensureTaskStatuses(user._id),
    TaskModel.find({ userId: user._id }).sort({ createdAt: -1 }).lean(),
  ]);

  response.json({
    ok: true,
    statuses: statuses.map(serializeTaskStatus),
    tasks: tasks.map(serializeTask),
  });
}

export async function createTask(request: Request, response: Response) {
  const user = requireUser(request);
  const payload = createTaskSchema.parse(request.body);
  const statuses = await ensureTaskStatuses(user._id);
  const statusIds = new Set(statuses.map((status) => status.id));
  const statusId = statusIds.has(payload.statusId) ? payload.statusId : statuses[0]?.id ?? 'draft';

  const task = await TaskModel.create({
    userId: user._id,
    title: payload.title,
    statusId,
    projectId: payload.projectId,
    noteId: payload.noteId,
    source: 'manual',
  });

  response.status(201).json({
    ok: true,
    task: serializeTask(task),
  });
}

export async function createExtractedTasks(request: Request, response: Response) {
  const user = requireUser(request);
  const payload = createExtractedTasksSchema.parse(request.body);
  const statuses = await ensureTaskStatuses(user._id);
  const defaultStatusId = statuses[0]?.id ?? 'draft';

  const created = await TaskModel.insertMany(
    payload.titles.map((title) => ({
      userId: user._id,
      title,
      statusId: defaultStatusId,
      projectId: payload.projectId,
      noteId: payload.noteId,
      source: 'note_ai' as const,
    }))
  );

  response.status(201).json({
    ok: true,
    tasks: created.map(serializeTask),
  });
}

export async function updateTask(request: Request, response: Response) {
  const user = requireUser(request);
  const payload = updateTaskSchema.parse(request.body);

  const update: Record<string, unknown> = {};
  if (payload.title !== undefined) {
    update.title = payload.title;
  }
  if (payload.statusId !== undefined) {
    update.statusId = payload.statusId;
  }
  if (payload.projectId !== undefined) {
    update.projectId = payload.projectId;
  }
  if (payload.noteId !== undefined) {
    update.noteId = payload.noteId;
  }
  if (payload.deletedAt !== undefined) {
    update.deletedAt = payload.deletedAt ? new Date(payload.deletedAt) : null;
  }

  const task = await TaskModel.findOneAndUpdate(
    { _id: request.params.taskId, userId: user._id },
    { $set: update },
    { new: true }
  );

  if (!task) {
    throw createHttpError('Task not found', 404);
  }

  response.json({
    ok: true,
    task: serializeTask(task),
  });
}

export async function deleteTask(request: Request, response: Response) {
  const user = requireUser(request);
  const task = await TaskModel.findOneAndDelete({ _id: request.params.taskId, userId: user._id });

  if (!task) {
    throw createHttpError('Task not found', 404);
  }

  response.status(204).send();
}

export async function emptyTrash(request: Request, response: Response) {
  const user = requireUser(request);
  const projectIdParam = request.query.projectId;
  const projectId = typeof projectIdParam === 'string' && projectIdParam.trim() ? projectIdParam : null;

  await TaskModel.deleteMany({
    userId: user._id,
    deletedAt: { $ne: null },
    ...(projectId ? { projectId } : {}),
  });

  response.status(204).send();
}

export async function saveTaskStatuses(request: Request, response: Response) {
  const user = requireUser(request);
  const payload = saveTaskStatusesSchema.parse(request.body);

  const nextStatuses = payload.statuses.map((status, index) => ({
    ...status,
    order: index,
    userId: user._id,
  }));

  const previousStatuses = await ensureTaskStatuses(user._id);
  const nextIds = new Set(nextStatuses.map((status) => status.id));
  const previousById = new Map(previousStatuses.map((status) => [status.id, status]));

  await TaskStatusModel.deleteMany({ userId: user._id });
  await TaskStatusModel.insertMany(nextStatuses);

  const tasks = await TaskModel.find({ userId: user._id });
  await Promise.all(
    tasks.map(async (task) => {
      if (nextIds.has(task.statusId)) {
        return;
      }

      const removedIndex = previousStatuses.findIndex((status) => status.id === task.statusId);
      const fallback =
        nextStatuses[Math.max(0, Math.min(removedIndex - 1, nextStatuses.length - 1))] ||
        nextStatuses[Math.max(0, Math.min(removedIndex, nextStatuses.length - 1))] ||
        nextStatuses[0];

      if (!fallback) {
        throw createHttpError('At least one status is required', 400);
      }

      task.statusId = fallback.id;
      await task.save();
    })
  );

  const statuses = await TaskStatusModel.find({ userId: user._id }).sort({ order: 1 }).lean();
  const persistedTasks = await TaskModel.find({ userId: user._id }).sort({ createdAt: -1 }).lean();

  response.json({
    ok: true,
    statuses: statuses.map(serializeTaskStatus),
    tasks: persistedTasks.map(serializeTask),
    previousStatuses: Array.from(previousById.values()).map(serializeTaskStatus),
  });
}
