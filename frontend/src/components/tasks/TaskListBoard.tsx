import { GripVertical, Plus } from "lucide-react";
import { KanbanTaskCard } from "@/components/tasks/KanbanTaskCard";
import { StatusSettingsDialog } from "@/components/tasks/StatusSettingsDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Note } from "@/types/note.types";
import type { Project } from "@/types/project.types";
import type { Task, TaskStatus } from "@/types/task.types";
import { useState } from "react";

export function TaskListBoard({
  statuses,
  tasks,
  notes,
  projects,
  onMoveTask,
  onToggleDone,
  onTrashTask,
  onCreateStatus,
  onSaveStatuses,
  onOpenTask,
}: {
  statuses: TaskStatus[];
  tasks: Task[];
  notes: Note[];
  projects: Project[];
  onMoveTask: (taskId: string, statusId: string, position: number) => Promise<void>;
  onToggleDone: (taskId: string) => Promise<void>;
  onTrashTask: (taskId: string) => Promise<void>;
  onCreateStatus: (label: string) => Promise<void>;
  onSaveStatuses: (statuses: TaskStatus[]) => Promise<void>;
  onOpenTask: (taskId: string) => void;
}) {
  const [newStatus, setNewStatus] = useState("");
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);

  const handleDrop = (statusId: string, position: number) => {
    if (!draggedTaskId) {
      return;
    }

    void onMoveTask(draggedTaskId, statusId, position);
    setDraggedTaskId(null);
  };

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
      <div className="min-h-0 flex-1 overflow-y-auto pr-2">
        <div className="space-y-4 pb-4">
          {statuses.map((status) => {
            const statusTasks = tasks.filter((task) => task.statusId === status.id);

            return (
              <section key={status.id} className="space-y-3">
                <div className="flex items-center justify-between gap-3 px-1">
                  <div className="flex items-center gap-3 text-lg font-semibold">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${status.colorClass}`}>{status.label}</span>
                    <span className="text-sm font-medium text-muted-foreground">{statusTasks.length} tasks</span>
                  </div>
                </div>
                <div
                  className="space-y-3 rounded-[28px] border border-white/70 bg-white/40 p-3 backdrop-blur-sm transition hover:border-primary/30 hover:bg-white/55"
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={() => handleDrop(status.id, statusTasks.length)}
                >
                  {statusTasks.length ? (
                    <>
                      {statusTasks.map((task, index) => {
                        const project = projects.find((item) => item.id === task.projectId);
                        const note = notes.find((item) => item.id === task.noteId);

                        return (
                          <div key={task.id} className="flex items-start gap-3" onDragStart={() => setDraggedTaskId(task.id)} onDragEnd={() => setDraggedTaskId(null)}>
                            <div className="mt-4 rounded-full bg-secondary p-2 text-muted-foreground">
                              <GripVertical className="h-4 w-4" />
                            </div>
                            <div className="flex-1">
                              <KanbanTaskCard
                                task={task}
                                project={project}
                                notePreview={note?.content.slice(0, 64)}
                                status={status}
                                onOpen={() => onOpenTask(task.id)}
                                onToggleDone={() => void onToggleDone(task.id)}
                                onTrash={() => void onTrashTask(task.id)}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </>
                  ) : (
                    <div className="rounded-[24px] border border-dashed border-border bg-white/55 p-6 text-sm leading-7 text-muted-foreground">
                      Drop a task here to move it into {status.label.toLowerCase()}.
                    </div>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}
