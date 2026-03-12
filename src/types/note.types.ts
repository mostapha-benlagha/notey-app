export type AttachmentKind = "image" | "file";

export interface NoteAttachment {
  id: string;
  name: string;
  kind: AttachmentKind;
  sizeLabel: string;
}

export interface Note {
  id: string;
  content: string;
  projectId: string;
  tags: string[];
  createdAt: string;
  attachments: NoteAttachment[];
}
