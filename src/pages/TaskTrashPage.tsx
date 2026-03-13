import { ArrowLeft, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { TaskTrashPanel } from "@/components/tasks/TaskTrashPanel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNotesStore } from "@/store/useNotesStore";
import { useProjectsStore } from "@/store/useProjectsStore";
import { useTasksStore } from "@/store/useTasksStore";

export function TaskTrashPage() {
  const notes = useNotesStore((state) => state.notes);
  const projects = useProjectsStore((state) => state.projects);
  const selectedProjectId = useProjectsStore((state) => state.selectedProjectId);
  const statuses = useTasksStore((state) => state.statuses);
  const tasks = useTasksStore((state) => state.tasks);
  const restoreTask = useTasksStore((state) => state.restoreTask);
  const permanentlyDeleteTask = useTasksStore((state) => state.permanentlyDeleteTask);
  const emptyTrash = useTasksStore((state) => state.emptyTrash);

  const trashTasks = tasks.filter((task) => (!selectedProjectId || task.projectId === selectedProjectId) && !!task.deletedAt);

  return (
    <div className="space-y-6">
      <Card className="rounded-[32px] bg-white/78">
        <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <CardDescription>Task recovery</CardDescription>
            <CardTitle className="text-3xl">Trash</CardTitle>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
              Deleted tasks stay here until you restore them or permanently clear them. This keeps the board focused on active work.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild variant="ghost" className="rounded-2xl">
              <Link to="/app/tasks">
                <ArrowLeft className="h-4 w-4" />
                Back to board
              </Link>
            </Button>
            <Button
              variant="outline"
              className="rounded-2xl border-rose-200 text-rose-700 hover:bg-rose-50"
              onClick={() => emptyTrash(selectedProjectId)}
              disabled={!trashTasks.length}
            >
              <Trash2 className="h-4 w-4" />
              Empty trash
            </Button>
          </div>
        </CardHeader>
      </Card>
      <TaskTrashPanel
        tasks={trashTasks}
        statuses={statuses}
        notes={notes}
        projects={projects}
        onRestore={restoreTask}
        onPermanentDelete={permanentlyDeleteTask}
      />
      {!trashTasks.length ? (
        <Card className="rounded-[32px]">
          <CardContent className="p-8 text-sm leading-7 text-muted-foreground">
            There is nothing in trash right now. When you delete tasks from the board, they will appear here first.
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
