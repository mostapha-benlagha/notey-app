import { useMemo, useState } from "react";
import { PlusCircle } from "lucide-react";
import { NoteyLogoMark } from "@/components/brand/NoteyLogo";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { Note } from "@/types/note.types";
import type { Project } from "@/types/project.types";
import type { TaskStatus } from "@/types/task.types";

export function CreateTaskDialog({
  notes,
  projects,
  selectedProjectId,
  statuses,
  onSubmit,
}: {
  notes: Note[];
  projects: Project[];
  selectedProjectId: string | null;
  statuses: TaskStatus[];
  onSubmit: (payload: { title: string; projectId: string; noteId: string | null; statusId: string }) => Promise<void>;
}) {
  const defaultProjectId = selectedProjectId ?? projects[0]?.id ?? "work";
  const defaultStatusId = statuses[0]?.id ?? "draft";
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [projectId, setProjectId] = useState(defaultProjectId);
  const [noteId, setNoteId] = useState<string>("");
  const [statusId, setStatusId] = useState(defaultStatusId);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const projectNotes = useMemo(
    () => notes.filter((note) => note.projectId === projectId),
    [notes, projectId],
  );

  const reset = () => {
    setTitle("");
    setProjectId(selectedProjectId ?? projects[0]?.id ?? "work");
    setNoteId("");
    setStatusId(statuses[0]?.id ?? "draft");
    setIsSubmitting(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) {
          reset();
        }
      }}
    >
      <DialogTrigger asChild>
        <Button className="rounded-2xl">
          <PlusCircle className="h-4 w-4" />
          Create task
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create a task</DialogTitle>
          <DialogDescription>
            Manual tasks live in the same board as AI-generated ones. You can assign a project, choose a starting column, and optionally link the task to an existing note.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <label className="grid gap-2">
            <span className="text-sm font-medium text-foreground">Task title</span>
            <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Outline the Q2 launch checklist" />
          </label>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2">
              <span className="text-sm font-medium text-foreground">Project</span>
              <Select value={projectId} onChange={(event) => setProjectId(event.target.value)} aria-label="Task project">
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </Select>
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-medium text-foreground">Starting status</span>
              <Select value={statusId} onChange={(event) => setStatusId(event.target.value)} aria-label="Task status">
                {statuses.map((status) => (
                  <option key={status.id} value={status.id}>
                    {status.label}
                  </option>
                ))}
              </Select>
            </label>
          </div>
          <label className="grid gap-2">
            <span className="text-sm font-medium text-foreground">Link to a note</span>
            <Select value={noteId} onChange={(event) => setNoteId(event.target.value)} aria-label="Linked note">
              <option value="">No note linked</option>
              {projectNotes.map((note) => (
                <option key={note.id} value={note.id}>
                  {note.content.slice(0, 72)}
                </option>
              ))}
            </Select>
          </label>
          <div className="rounded-[24px] border border-white/80 bg-secondary/35 p-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2 font-medium text-foreground">
              <NoteyLogoMark className="h-5 w-auto" aria-hidden />
              Shared task system
            </div>
            <p className="mt-2 leading-7">
              AI-created tasks and manual tasks now use the same pipeline, which means drag-and-drop, trash, and status customization work the same way for both.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="ghost" className="rounded-2xl" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            className="rounded-2xl"
            disabled={!title.trim() || isSubmitting}
            onClick={async () => {
              setIsSubmitting(true);
              try {
                await onSubmit({
                  title: title.trim(),
                  projectId,
                  noteId: noteId || null,
                  statusId,
                });
                setOpen(false);
                reset();
              } finally {
                setIsSubmitting(false);
              }
            }}
          >
            {isSubmitting ? "Creating..." : "Create task"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
