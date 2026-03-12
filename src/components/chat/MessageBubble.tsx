import { useState } from "react";
import { FilePenLine, ShieldAlert, Trash2 } from "lucide-react";
import { TagBadge } from "@/components/chat/TagBadge";
import { AttachmentPreview } from "@/components/chat/AttachmentPreview";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { Note } from "@/types/note.types";
import type { Project } from "@/types/project.types";
import { formatTimestamp } from "@/utils/date";

export function MessageBubble({
  note,
  project,
  onDelete,
  onOpen,
}: {
  note: Note;
  project?: Project;
  onDelete: (noteId: string) => void;
  onOpen: (noteId: string) => void;
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <>
      <div className="flex gap-4">
        <Avatar label={project?.name ?? "NT"} />
        <Card
          className="flex-1 cursor-pointer rounded-[28px] bg-white/90 p-5 transition hover:-translate-y-0.5 hover:bg-white"
          onClick={() => onOpen(note.id)}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h3 className="text-sm font-semibold">{project?.name ?? "Inbox"}</h3>
                <span className="text-xs text-muted-foreground">{formatTimestamp(note.createdAt)}</span>
              </div>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-foreground/90">{note.content}</p>
            </div>
            <div className="flex gap-1">
              <Button
                aria-label={`Open ${note.id}`}
                size="icon"
                variant="ghost"
                className="h-8 w-8 rounded-full"
                onClick={(event) => {
                  event.stopPropagation();
                  onOpen(note.id);
                }}
              >
                <FilePenLine className="h-4 w-4" />
              </Button>
              <Button
                aria-label={`Delete ${note.id}`}
                size="icon"
                variant="ghost"
                className="h-8 w-8 rounded-full text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                onClick={(event) => {
                  event.stopPropagation();
                  setConfirmOpen(true);
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
          {!!note.attachments.length && (
            <div className="mt-4 flex flex-wrap gap-2">
              {note.attachments.map((attachment) => (
                <AttachmentPreview key={attachment.id} attachment={attachment} compact />
              ))}
            </div>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            {note.tags.map((tag) => (
              <TagBadge key={tag} tag={tag} />
            ))}
          </div>
        </Card>
      </div>
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-start gap-4">
              <div className="rounded-2xl bg-accent p-3 text-accent-foreground">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <div>
                <AlertDialogTitle>Remove this note?</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to remove this note? This action will delete it from the chat timeline.
                </AlertDialogDescription>
              </div>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              tone="destructive"
              onClick={() => {
                onDelete(note.id);
                setConfirmOpen(false);
              }}
            >
              <Trash2 className="h-4 w-4" />
              Delete note
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
