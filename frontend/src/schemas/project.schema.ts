import { z } from "zod";

export const projectSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  description: z.string().min(1),
  color: z.string().min(1),
});

export type ProjectSchema = z.infer<typeof projectSchema>;
