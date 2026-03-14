import type { NoteAttachment } from "@/types/note.types";

export function toAttachment(file: File): NoteAttachment {
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  const kind = ["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(extension) ? "image" : "file";
  const sizeLabel =
    file.size > 1024 * 1024 ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` : `${Math.max(1, Math.round(file.size / 1024))} KB`;

  return {
    id: `attachment-${file.name}-${file.lastModified}`,
    file,
    kind,
    mimeType: file.type || undefined,
    name: file.name,
    sizeLabel,
  };
}
