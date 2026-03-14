import { useState } from "react";
import { Search, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { CreateTaskDialog } from "@/components/tasks/CreateTaskDialog";
import { TaskKanbanBoard } from "@/components/tasks/TaskKanbanBoard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useNotesStore } from "@/store/useNotesStore";
import { useProjectsStore } from "@/store/useProjectsStore";
import { useTasksStore } from "@/store/useTasksStore";

export function TasksPage() {
  const [query, setQuery] = useState("");
  const notes = useNotesStore((state) => state.notes);
  const projects = useProjectsStore((state) => state.projects);
  const selectedProjectId = useProjectsStore((state) => state.selectedProjectId);
  const statuses = useTasksStore((state) => state.statuses);
  const tasks = useTasksStore((state) => state.tasks);
  const isLoading = useTasksStore((state) => state.isLoading);
  const addTask = useTasksStore((state) => state.addTask);
  const createStatus = useTasksStore((state) => state.createStatus);
  const saveStatuses = useTasksStore((state) => state.saveStatuses);
  const moveTask = useTasksStore((state) => state.moveTask);
  const toggleTask = useTasksStore((state) => state.toggleTask);
  const trashTask = useTasksStore((state) => state.trashTask);
  const getTrash = useTasksStore((state) => state.getTrash);

  const normalizedQuery = query.trim().toLowerCase();
  const filteredTasks = tasks.filter((task) => {
    if (task.deletedAt) {
      return false;
    }

    const matchesProject = !selectedProjectId || task.projectId === selectedProjectId;
    if (!matchesProject) {
      return false;
    }

    if (!normalizedQuery) {
      return true;
    }

    const note = notes.find((item) => item.id === task.noteId);
    const status = statuses.find((item) => item.id === task.statusId);
    return (
      task.title.toLowerCase().includes(normalizedQuery) ||
      note?.content.toLowerCase().includes(normalizedQuery) ||
      status?.label.toLowerCase().includes(normalizedQuery)
    );
  });
  const trashCount = getTrash(selectedProjectId).length;

  return (
    <div className="flex h-full min-h-0 flex-col gap-6">
      <Card className="flex min-h-0 flex-1 flex-col rounded-[32px]">
        <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <CardDescription>Unified task board</CardDescription>
            <CardTitle className="text-3xl">Move manual and AI-generated work across your pipeline</CardTitle>
          </div>
          <div className="flex w-full max-w-2xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
            <div className="relative w-full max-w-md">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input className="pl-10" placeholder="Filter tasks, notes, or statuses..." value={query} onChange={(event) => setQuery(event.target.value)} />
            </div>
            <CreateTaskDialog
              notes={notes}
              projects={projects}
              selectedProjectId={selectedProjectId}
              statuses={statuses}
              onSubmit={async (payload) => {
                await addTask(payload);
              }}
            />
            <Button asChild variant="outline" className="rounded-2xl">
              <Link to="/app/tasks/trash">
                <Trash2 className="h-4 w-4" />
                Trash {trashCount ? `(${trashCount})` : ""}
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex min-h-0 flex-1 flex-col">
          {isLoading ? (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Loading tasks...</div>
          ) : (
            <TaskKanbanBoard
              statuses={statuses}
              tasks={filteredTasks}
              notes={notes}
              projects={projects}
              onMoveTask={moveTask}
              onToggleDone={toggleTask}
              onTrashTask={trashTask}
              onCreateStatus={async (label) => {
                await createStatus(label);
              }}
              onSaveStatuses={saveStatuses}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
