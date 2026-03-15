import { TaskDetailsDialog } from "@/components/tasks/TaskDetailsDialog";
import { useTaskSpaceContext } from "@/features/task-space/TaskSpaceContext";

interface TaskSpaceDialogsProps {}

export function TaskSpaceDialogs({}: TaskSpaceDialogsProps) {
  const { notes, projects, selectedTask, setSelectedTaskId, statuses, updateTaskDetails } = useTaskSpaceContext();

  return (
    <TaskDetailsDialog
      open={!!selectedTask}
      task={selectedTask}
      statuses={statuses}
      notes={notes}
      projects={projects}
      onOpenChange={(open) => {
        if (!open) {
          setSelectedTaskId(null);
        }
      }}
      onSave={updateTaskDetails}
    />
  );
}
