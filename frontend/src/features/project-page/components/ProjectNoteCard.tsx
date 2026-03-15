import { Trash2 } from "lucide-react";
import { useProjectPageContext } from "@/features/project-page/ProjectPageContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TagChip } from "@/components/ui/tag-chip";
import type { Note } from "@/types/note.types";

export function ProjectNoteCard({
  note,
}: {
  note: Note;
}) {
  const { navigate, projects, project, setConfirmDeleteNoteId } = useProjectPageContext();
  const noteProject = projects.find((item) => item.id === note.projectId);

  return (
    <Card className="flex h-full flex-col rounded-[28px] border-white/80 bg-white/92">
      <CardHeader className="gap-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex rounded-full bg-secondary px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              {(noteProject?.name ?? note.projectId) || "No project"}
            </span>
            <span className="inline-flex rounded-full bg-white px-3 py-1 text-xs text-muted-foreground">
              {new Date(note.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>
        <div>
          <CardTitle className="text-lg leading-7">{note.content.slice(0, 90)}</CardTitle>
          <CardDescription className="mt-2 line-clamp-2 text-sm leading-7 text-muted-foreground">{note.content}</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4">
        {note.tags.length ? (
          <div className="flex flex-wrap gap-2">
            {note.tags.slice(0, 4).map((tag) => (
              <TagChip key={tag} tag={tag} className="rounded-full bg-secondary/70 text-xs font-medium text-secondary-foreground" />
            ))}
          </div>
        ) : (
          <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">No tags yet</p>
        )}

        <div className="mt-auto flex gap-2">
          <Button
            type="button"
            className="flex-1 rounded-2xl"
            onClick={() => navigate(`/app/notes/${note.id}`, { state: { returnTo: `/app/projects/${project?.id}` } })}
          >
            Open note
          </Button>
          <Button type="button" variant="ghost" className="rounded-2xl" onClick={() => setConfirmDeleteNoteId(note.id)}>
            <Trash2 className="h-4 w-4" />
            Remove
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
