import { useNotes } from "@/hooks/useNotes";
import { useNavigate } from "react-router-dom";
import { useProjectsStore } from "@/store/useProjectsStore";
import { useNotesStore } from "@/store/useNotesStore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SearchBar } from "@/components/chat/SearchBar";
import { ChatContainer } from "@/components/chat/ChatContainer";
import { MessageInput } from "@/components/chat/MessageInput";

export function ChatPage() {
  const navigate = useNavigate();
  const projects = useProjectsStore((state) => state.projects);
  const addNote = useNotesStore((state) => state.addNote);
  const deleteNote = useNotesStore((state) => state.deleteNote);
  const isLoading = useNotesStore((state) => state.isLoading);
  const setSearchTerm = useNotesStore((state) => state.setSearchTerm);
  const { filteredNotes, searchTerm } = useNotes();

  return (
    <div className="flex h-full min-h-0 flex-col gap-6 overflow-hidden">
      <Card className="flex min-h-0 flex-1 flex-col rounded-[32px]">
        <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <CardDescription>Chat-based notes</CardDescription>
            <CardTitle className="text-3xl">Capture ideas like a conversation</CardTitle>
          </div>
          <div className="w-full max-w-md">
            <SearchBar value={searchTerm} onChange={setSearchTerm} />
          </div>
        </CardHeader>
        <CardContent className="min-h-0 flex-1">
          {isLoading ? (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Loading notes...</div>
          ) : (
            <ChatContainer
              notes={filteredNotes}
              projects={projects}
              onDeleteNote={(noteId) => {
                void deleteNote(noteId);
              }}
              onOpenNote={(noteId) => navigate(`/app/notes/${noteId}`, { state: { returnTo: "/app" } })}
            />
          )}
        </CardContent>
      </Card>
      <div className="shrink-0">
        <MessageInput
          onSubmit={async (payload) => {
            await addNote(payload);
          }}
        />
      </div>
    </div>
  );
}
