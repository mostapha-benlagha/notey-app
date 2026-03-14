import { useEffect, useMemo } from "react";
import { FileText, ImageIcon, Mic, Paperclip } from "lucide-react";
import type { NoteAttachment } from "@/types/note.types";
import { cn } from "@/lib/utils";

const iconMap = {
  file: FileText,
  image: ImageIcon,
  audio: Mic,
};

export function AttachmentPreview({
  attachment,
  compact = false,
}: {
  attachment: NoteAttachment;
  compact?: boolean;
}) {
  const Icon = iconMap[attachment.kind] ?? Paperclip;
  const localAudioUrl = useMemo(() => {
    if (attachment.kind !== "audio" || !attachment.file) {
      return null;
    }

    return URL.createObjectURL(attachment.file);
  }, [attachment.file, attachment.kind]);

  useEffect(() => {
    return () => {
      if (localAudioUrl) {
        URL.revokeObjectURL(localAudioUrl);
      }
    };
  }, [localAudioUrl]);

  const audioUrl = attachment.kind === "audio" ? attachment.url ?? localAudioUrl ?? undefined : undefined;

  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-white/70 px-3 py-2",
        compact ? "min-w-[220px]" : "w-full",
      )}
    >
      {attachment.kind === "audio" && audioUrl ? (
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-secondary p-2 text-foreground">
            <Icon className="h-4 w-4" />
          </div>
          <audio controls className="h-10 min-w-0 flex-1" preload="metadata" src={audioUrl} />
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-secondary p-2 text-foreground">
            <Icon className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{attachment.name}</p>
            <p className="text-xs text-muted-foreground">{attachment.sizeLabel}</p>
          </div>
        </div>
      )}
    </div>
  );
}
