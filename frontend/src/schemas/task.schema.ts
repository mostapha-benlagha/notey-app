import { z } from "zod";

export const taskStatusSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  colorClass: z.string().min(1),
  kind: z.enum(["system", "custom"]),
});

export const taskSchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  description: z.string().default(""),
  statusId: z.string().min(1),
  projectId: z.string().min(1),
  noteId: z.string().nullable(),
  source: z.enum(["manual", "note_ai"]),
  tags: z.array(z.string()).default([]),
  order: z.number().int().nonnegative(),
  deletedAt: z.string().nullable(),
});

export type TaskSchema = z.infer<typeof taskSchema>;
