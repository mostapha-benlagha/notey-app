import { z } from "zod";

export const taskSchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  statusId: z.string().min(1),
  projectId: z.string().min(1),
  noteId: z.string().min(1),
  deletedAt: z.string().nullable(),
});

export type TaskSchema = z.infer<typeof taskSchema>;
