import { z } from "zod";

export const noteAttachmentSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  kind: z.enum(["image", "file"]),
  sizeLabel: z.string().min(1),
});

export const noteSchema = z.object({
  id: z.string(),
  content: z.string().min(1),
  projectId: z.string().min(1),
  tags: z.array(z.string()),
  createdAt: z.string().min(1),
  attachments: z.array(noteAttachmentSchema),
});

export const createNoteSchema = z.object({
  content: z.string().trim().min(1, "Note content is required"),
  projectId: z.string().min(1),
  attachments: z.array(noteAttachmentSchema).default([]),
});

export type NoteSchema = z.infer<typeof noteSchema>;
export type CreateNoteSchema = z.infer<typeof createNoteSchema>;
