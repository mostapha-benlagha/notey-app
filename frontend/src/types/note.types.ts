export type AttachmentKind = "image" | "file" | "audio";

export interface NoteAttachment {
  id: string;
  name: string;
  kind: AttachmentKind;
  sizeLabel: string;
  objectKey?: string;
  url?: string;
  mimeType?: string;
  file?: File;
}

export interface Note {
  id: string;
  content: string;
  richContent: string;
  projectId: string;
  tags: string[];
  createdAt: string;
  attachments: NoteAttachment[];
}
