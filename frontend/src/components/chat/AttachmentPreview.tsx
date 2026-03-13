import { FileText, ImageIcon, Paperclip } from "lucide-react";
import type { NoteAttachment } from "@/types/note.types";
import { cn } from "@/lib/utils";

const iconMap = {
  file: FileText,
  image: ImageIcon,
};

export function AttachmentPreview({
  attachment,
  compact = false,
}: {
  attachment: NoteAttachment;
  compact?: boolean;
}) {
  const Icon = iconMap[attachment.kind] ?? Paperclip;

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-2xl border border-border bg-white/70 px-3 py-2",
        compact ? "min-w-[130px]" : "w-full",
      )}
    >
      <div className="rounded-xl bg-secondary p-2 text-foreground">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{attachment.name}</p>
        <p className="text-xs text-muted-foreground">{attachment.sizeLabel}</p>
      </div>
    </div>
  );
}
