import type { NoteAttachment } from "@/types/note.types";

function formatSize(size: number) {
  return size > 1024 * 1024 ? `${(size / (1024 * 1024)).toFixed(1)} MB` : `${Math.max(1, Math.round(size / 1024))} KB`;
}

export function toAttachment(file: File): NoteAttachment {
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  const kind = file.type.startsWith("audio/")
    ? "audio"
    : ["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(extension)
      ? "image"
      : ["mp3", "wav", "ogg", "m4a", "aac", "webm"].includes(extension)
        ? "audio"
        : "file";

  return {
    id: `attachment-${file.name}-${file.lastModified}`,
    file,
    kind,
    mimeType: file.type || undefined,
    name: file.name,
    sizeLabel: formatSize(file.size),
  };
}

export function audioBlobToAttachment(blob: Blob) {
  const timestamp = Date.now();
  const extension = blob.type.includes("ogg") ? "ogg" : blob.type.includes("mpeg") ? "mp3" : "webm";
  const file = new File([blob], `voice-note-${timestamp}.${extension}`, {
    type: blob.type || "audio/webm",
    lastModified: timestamp,
  });

  return toAttachment(file);
}
