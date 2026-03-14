import { z } from 'zod';

export const taskSourceSchema = z.enum(['manual', 'note_ai']);

export const taskSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string(),
  statusId: z.string().min(1),
  projectId: z.string().min(1),
  noteId: z.string().nullable(),
  source: taskSourceSchema,
  tags: z.array(z.string()),
  order: z.number().int().nonnegative(),
  deletedAt: z.string().nullable(),
});

export const taskStatusSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  colorClass: z.string().min(1),
  kind: z.enum(['system', 'custom']),
});

export const createTaskSchema = z.object({
  title: z.string().trim().min(1, 'Task title is required'),
  description: z.string().trim().default(''),
  statusId: z.string().trim().min(1).default('draft'),
  projectId: z.string().trim().min(1, 'Project is required'),
  noteId: z.string().trim().min(1).nullable().default(null),
  tags: z.array(z.string().trim().min(1)).default([]),
});

export const createExtractedTasksSchema = z.object({
  noteId: z.string().trim().min(1),
  projectId: z.string().trim().min(1),
  titles: z.array(z.string().trim().min(1)).min(1),
});

export const updateTaskSchema = z
  .object({
    title: z.string().trim().min(1).optional(),
    description: z.string().trim().optional(),
    statusId: z.string().trim().min(1).optional(),
    projectId: z.string().trim().min(1).optional(),
    noteId: z.string().trim().min(1).nullable().optional(),
    tags: z.array(z.string().trim().min(1)).optional(),
    order: z.number().int().nonnegative().optional(),
    deletedAt: z.string().datetime().nullable().optional(),
  })
  .refine(
    (payload) =>
      payload.title !== undefined ||
      payload.description !== undefined ||
      payload.statusId !== undefined ||
      payload.projectId !== undefined ||
      payload.noteId !== undefined ||
      payload.tags !== undefined ||
      payload.order !== undefined ||
      payload.deletedAt !== undefined,
    { message: 'At least one field must be provided' }
  );

export const moveTaskSchema = z.object({
  statusId: z.string().trim().min(1),
  position: z.number().int().nonnegative(),
});

export const saveTaskStatusesSchema = z.object({
  statuses: z.array(taskStatusSchema).min(1),
});
