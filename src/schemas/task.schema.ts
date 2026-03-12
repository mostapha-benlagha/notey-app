import { z } from "zod";

export const taskSchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  status: z.enum(["pending", "completed"]),
  projectId: z.string().min(1),
  noteId: z.string().min(1),
});

export type TaskSchema = z.infer<typeof taskSchema>;
