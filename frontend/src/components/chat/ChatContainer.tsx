import { NoteyLogoMark } from "@/components/brand/NoteyLogo";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageBubble } from "@/components/chat/MessageBubble";
import type { Note } from "@/types/note.types";
import type { Project } from "@/types/project.types";

export function ChatContainer({
  notes,
  projects,
  onDeleteNote,
  onOpenNote,
}: {
  notes: Note[];
  projects: Project[];
  onDeleteNote: (noteId: string) => void;
  onOpenNote: (noteId: string) => void;
}) {
  if (!notes.length) {
    return (
      <div className="flex h-full min-h-[320px] flex-col items-center justify-center rounded-[32px] border border-dashed border-border bg-white/40 p-10 text-center">
        <NoteyLogoMark className="mb-4 h-12 w-auto" aria-hidden />
        <h2 className="text-lg font-semibold">No notes match this view</h2>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          Adjust the project filter or search query, or write a new note to seed the timeline.
        </p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full p-4 pl-0 rounded-2xl">
      <div className="space-y-5">
        {notes.map((note) => (
          <MessageBubble
            key={note.id}
            note={note}
            project={projects.find((project) => project.id === note.projectId)}
            onDelete={onDeleteNote}
            onOpen={onOpenNote}
          />
        ))}
      </div>
    </ScrollArea>
  );
}
