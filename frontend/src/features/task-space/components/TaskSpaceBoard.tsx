import { TaskKanbanBoard } from "@/components/tasks/TaskKanbanBoard";
import { TaskListBoard } from "@/components/tasks/TaskListBoard";
import { Card, CardContent } from "@/components/ui/card";
import { useTaskSpaceContext } from "@/features/task-space/TaskSpaceContext";

interface TaskSpaceBoardProps {}

export function TaskSpaceBoard({}: TaskSpaceBoardProps) {
  const { createStatus, filteredTasks, isLoading, moveTask, notes, projects, saveStatuses, setSelectedTaskId, statuses, toggleTask, trashTask, view } =
    useTaskSpaceContext();

  return (
    <Card className="flex min-h-0 flex-1 flex-col rounded-[32px]">
      <CardContent className="flex min-h-0 flex-1 flex-col p-6">
        {isLoading ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Loading tasks...</div>
        ) : view === "kanban" ? (
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
            onOpenTask={setSelectedTaskId}
          />
        ) : (
          <TaskListBoard
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
            onOpenTask={setSelectedTaskId}
          />
        )}
      </CardContent>
    </Card>
  );
}
