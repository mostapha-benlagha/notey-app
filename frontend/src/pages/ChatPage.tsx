import { useNotes } from "@/hooks/useNotes";
import { Workflow } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
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
          <div className="flex w-full max-w-xl items-center gap-3">
            <div className="min-w-0 flex-1">
              <SearchBar value={searchTerm} onChange={setSearchTerm} />
            </div>
            <Button asChild variant="outline" size="icon" className="shrink-0 rounded-2xl" aria-label="Open flow view">
              <Link to="/app/flow">
                <Workflow className="h-4 w-4" />
              </Link>
            </Button>
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
          autoFocus
          onSubmit={async (payload) => {
            await addNote(payload);
          }}
        />
      </div>
    </div>
  );
}
