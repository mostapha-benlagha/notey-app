import { Columns3, List, Search, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { CreateTaskDialog } from "@/components/tasks/CreateTaskDialog";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { TASK_BOARD_VIEWS, type TaskBoardView } from "@/features/task-space/constants";
import { useTaskSpaceContext } from "@/features/task-space/TaskSpaceContext";

interface TaskSpaceHeaderProps {}

export function TaskSpaceHeader({}: TaskSpaceHeaderProps) {
  const { addTask, notes, projects, query, selectedProjectId, setQuery, setView, statuses, trashCount, view } = useTaskSpaceContext();

  return (
    <Card className="rounded-[32px]">
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
          <div className="flex rounded-2xl border border-border bg-white/80 p-1">
            {TASK_BOARD_VIEWS.map((option) => (
              <Button
                key={option.value}
                type="button"
                variant={view === option.value ? "default" : "ghost"}
                className="rounded-xl"
                onClick={() => setView(option.value as TaskBoardView)}
              >
                {option.value === "kanban" ? <Columns3 className="h-4 w-4" /> : <List className="h-4 w-4" />}
                {option.label}
              </Button>
            ))}
          </div>
          <Button asChild variant="outline" className="rounded-2xl">
            <Link to="/app/tasks/trash">
              <Trash2 className="h-4 w-4" />
              Trash {trashCount ? `(${trashCount})` : ""}
            </Link>
          </Button>
        </div>
      </CardHeader>
    </Card>
  );
}
