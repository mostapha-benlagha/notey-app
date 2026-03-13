import { Trash2 } from "lucide-react";
import { KanbanTaskCard } from "@/components/tasks/KanbanTaskCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Note } from "@/types/note.types";
import type { Project } from "@/types/project.types";
import type { Task, TaskStatus } from "@/types/task.types";

export function TaskTrashPanel({
  tasks,
  statuses,
  notes,
  projects,
  onRestore,
  onPermanentDelete,
}: {
  tasks: Task[];
  statuses: TaskStatus[];
  notes: Note[];
  projects: Project[];
  onRestore: (taskId: string) => void;
  onPermanentDelete: (taskId: string) => void;
}) {
  return (
    <Card className="rounded-[32px]">
      <CardHeader>
        <CardDescription>Task trash</CardDescription>
        <CardTitle className="flex items-center gap-2 text-2xl">
          <Trash2 className="h-5 w-5 text-rose-600" />
          Deleted tasks
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {tasks.length ? (
          tasks.map((task) => {
            const project = projects.find((item) => item.id === task.projectId);
            const note = notes.find((item) => item.id === task.noteId);
            const status = statuses.find((item) => item.id === task.statusId);

            return (
              <KanbanTaskCard
                key={task.id}
                draggable={false}
                task={task}
                project={project}
                notePreview={note?.content.slice(0, 64)}
                status={status}
                onRestore={() => onRestore(task.id)}
                onPermanentDelete={() => onPermanentDelete(task.id)}
              />
            );
          })
        ) : (
          <div className="rounded-[24px] border border-dashed border-border bg-white/55 p-5 text-sm leading-7 text-muted-foreground">
            Your task trash is empty. Deleted tasks will land here first so you can restore them before removing them permanently.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
