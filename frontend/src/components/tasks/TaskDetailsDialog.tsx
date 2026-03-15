import { useEffect, useMemo, useState } from "react";
import { Bot, Link2, NotebookTabs, SquarePen } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { NoteyLogoMark } from "@/components/brand/NoteyLogo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { Note } from "@/types/note.types";
import type { Project } from "@/types/project.types";
import type { Task, TaskStatus } from "@/types/task.types";

interface TaskDetailsDialogSaveInput {
  id: string;
  title: string;
  description: string;
  projectId: string;
  noteId: string | null;
  statusId: string;
  tags: string[];
}

interface TaskDetailsDialogProps {
  open: boolean;
  task: Task | null;
  statuses: TaskStatus[];
  notes: Note[];
  projects: Project[];
  onOpenChange: (open: boolean) => void;
  onSave: (input: TaskDetailsDialogSaveInput) => Promise<void>;
}

export function TaskDetailsDialog({
  open,
  task,
  statuses,
  notes,
  projects,
  onOpenChange,
  onSave,
}: TaskDetailsDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [projectId, setProjectId] = useState("");
  const [noteId, setNoteId] = useState("");
  const [statusId, setStatusId] = useState("");
  const [tagsText, setTagsText] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const location = useLocation();

  useEffect(() => {
    if (!task) {
      return;
    }

    setTitle(task.title);
    setDescription(task.description ?? "");
    setProjectId(task.projectId);
    setNoteId(task.noteId ?? "");
    setStatusId(task.statusId);
    setTagsText(task.tags.join(", "));
  }, [task]);

  const projectNotes = useMemo(() => notes.filter((note) => note.projectId === projectId), [notes, projectId]);
  const selectedProject = projects.find((project) => project.id === projectId);
  const linkedNote = notes.find((note) => note.id === noteId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        {task ? (
          <>
            <DialogHeader>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="gap-1 rounded-full">
                  {task.source === "note_ai" ? <Bot className="h-3 w-3" /> : <SquarePen className="h-3 w-3" />}
                  {task.source === "note_ai" ? "AI-created task" : "Manual task"}
                </Badge>
                <Badge className={statuses.find((status) => status.id === task.statusId)?.colorClass}>
                  {statuses.find((status) => status.id === task.statusId)?.label ?? "Task"}
                </Badge>
              </div>
              <DialogTitle className="text-2xl">Task details</DialogTitle>
              <DialogDescription>
                Open the full task context, adjust its status, edit the text, relink it to a note, and add lightweight tags.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-5">
              <label className="grid gap-2">
                <span className="text-sm font-medium text-foreground">Title</span>
                <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Write the task title" />
              </label>
              <label className="grid gap-2">
                <span className="text-sm font-medium text-foreground">Details</span>
                <Textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Add more detail about what needs to happen"
                  className="min-h-[140px]"
                />
              </label>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="grid gap-2">
                  <span className="text-sm font-medium text-foreground">Status</span>
                  <Select value={statusId} onChange={(event) => setStatusId(event.target.value)} aria-label="Task detail status">
                    {statuses.map((status) => (
                      <option key={status.id} value={status.id}>
                        {status.label}
                      </option>
                    ))}
                  </Select>
                </label>
                <label className="grid gap-2">
                  <span className="text-sm font-medium text-foreground">Project</span>
                  <Select value={projectId} onChange={(event) => setProjectId(event.target.value)} aria-label="Task detail project">
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </Select>
                </label>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="grid gap-2">
                  <span className="text-sm font-medium text-foreground">Linked note</span>
                  <Select value={noteId} onChange={(event) => setNoteId(event.target.value)} aria-label="Task detail linked note">
                    <option value="">No note linked</option>
                    {projectNotes.map((note) => (
                      <option key={note.id} value={note.id}>
                        {note.content.slice(0, 72)}
                      </option>
                    ))}
                  </Select>
                </label>
                <label className="grid gap-2">
                  <span className="text-sm font-medium text-foreground">Tags</span>
                  <Input value={tagsText} onChange={(event) => setTagsText(event.target.value)} placeholder="security, follow-up, launch" />
                </label>
              </div>
              <div className="grid gap-3 rounded-[24px] border border-white/80 bg-secondary/35 p-4 text-sm text-muted-foreground md:grid-cols-2">
                <div className="flex items-start gap-3">
                  <NotebookTabs className="mt-1 h-4 w-4 text-primary" />
                  <div>
                    <p className="font-medium text-foreground">Project context</p>
                    <p>{selectedProject ? selectedProject.name : "No project selected"}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Link2 className="mt-1 h-4 w-4 text-primary" />
                  <div>
                    <p className="font-medium text-foreground">Linked note</p>
                    {linkedNote ? (
                      <Button asChild variant="ghost" className="h-auto max-w-full justify-start p-0 text-left text-sm text-primary hover:bg-transparent hover:text-primary/80">
                        <Link
                          to={`/app/notes/${linkedNote.id}`}
                          state={{ returnTo: location.pathname }}
                          onClick={() => onOpenChange(false)}
                          className="block max-w-full overflow-hidden text-wrap break-words"
                          style={{
                            display: "-webkit-box",
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: "vertical",
                          }}
                        >
                          {linkedNote.content.slice(0, 96)}
                        </Link>
                      </Button>
                    ) : (
                      <p>This task is currently standalone.</p>
                    )}
                  </div>
                </div>
              </div>
              {!!tagsText.trim() && (
                <div className="flex flex-wrap gap-2">
                  {tagsText
                    .split(",")
                    .map((tag) => tag.trim())
                    .filter(Boolean)
                    .map((tag) => (
                      <Badge key={tag} variant="outline" className="inline-flex items-center gap-1 rounded-full">
                        <NoteyLogoMark className="h-3 w-auto" aria-hidden />
                        {tag}
                      </Badge>
                    ))}
                </div>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" className="rounded-2xl" onClick={() => onOpenChange(false)}>
                Close
              </Button>
              <Button
                type="button"
                className="rounded-2xl"
                disabled={!title.trim() || isSaving}
                onClick={async () => {
                  setIsSaving(true);
                  try {
                    await onSave({
                      id: task.id,
                      title: title.trim(),
                      description: description.trim(),
                      projectId,
                      noteId: noteId || null,
                      statusId,
                      tags: tagsText
                        .split(",")
                        .map((tag) => tag.trim())
                        .filter(Boolean),
                    });
                    onOpenChange(false);
                  } finally {
                    setIsSaving(false);
                  }
                }}
              >
                {isSaving ? "Saving..." : "Save changes"}
              </Button>
            </DialogFooter>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
