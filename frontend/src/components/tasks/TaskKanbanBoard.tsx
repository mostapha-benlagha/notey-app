import { useState } from "react";
import { Plus } from "lucide-react";
import { KanbanTaskCard } from "@/components/tasks/KanbanTaskCard";
import { StatusSettingsDialog } from "@/components/tasks/StatusSettingsDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Note } from "@/types/note.types";
import type { Project } from "@/types/project.types";
import type { Task, TaskStatus } from "@/types/task.types";

export function TaskKanbanBoard({
  statuses,
  tasks,
  notes,
  projects,
  onMoveTask,
  onToggleDone,
  onTrashTask,
  onCreateStatus,
  onSaveStatuses,
}: {
  statuses: TaskStatus[];
  tasks: Task[];
  notes: Note[];
  projects: Project[];
  onMoveTask: (taskId: string, statusId: string) => Promise<void>;
  onToggleDone: (taskId: string) => Promise<void>;
  onTrashTask: (taskId: string) => Promise<void>;
  onCreateStatus: (label: string) => Promise<void>;
  onSaveStatuses: (statuses: TaskStatus[]) => Promise<void>;
}) {
  const [newStatus, setNewStatus] = useState("");
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <Input
          value={newStatus}
          onChange={(event) => setNewStatus(event.target.value)}
          placeholder="Create a custom status, e.g. blocked"
          className="max-w-sm"
        />
        <Button
          variant="outline"
          className="rounded-2xl"
          onClick={async () => {
            await onCreateStatus(newStatus);
            setNewStatus("");
          }}
        >
          <Plus className="h-4 w-4" />
          Add status
        </Button>
        <StatusSettingsDialog statuses={statuses} onSave={onSaveStatuses} />
      </div>
      <ScrollArea className="min-h-0 flex-1 p-4">
        <div className="flex min-w-max gap-4 pb-2">
          {statuses.map((status) => {
            const columnTasks = tasks.filter((task) => task.statusId === status.id);
            return (
              <Card
                key={status.id}
                className="w-[320px] shrink-0 rounded-[30px] bg-white/80"
                onDragOver={(event) => event.preventDefault()}
                onDrop={() => {
                  if (draggedTaskId) {
                    void onMoveTask(draggedTaskId, status.id);
                  }
                  setDraggedTaskId(null);
                }}
              >
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between gap-3">
                    <CardTitle className="text-lg">{status.label}</CardTitle>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${status.colorClass}`}>
                      {columnTasks.length}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {columnTasks.length ? (
                    columnTasks.map((task) => {
                      const project = projects.find((item) => item.id === task.projectId);
                      const note = notes.find((item) => item.id === task.noteId);
                      return (
                        <div key={task.id} onDragStart={() => setDraggedTaskId(task.id)} onDragEnd={() => setDraggedTaskId(null)}>
                          <KanbanTaskCard
                            task={task}
                            project={project}
                            notePreview={note?.content.slice(0, 64)}
                            status={status}
                            onToggleDone={() => void onToggleDone(task.id)}
                            onTrash={() => void onTrashTask(task.id)}
                          />
                        </div>
                      );
                    })
                  ) : (
                    <div className="rounded-[24px] border border-dashed border-border bg-white/55 p-4 text-sm leading-7 text-muted-foreground">
                      Drop a task here to move it into {status.label.toLowerCase()}.
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
