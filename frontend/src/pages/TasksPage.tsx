import { TaskSpaceProvider } from "@/features/task-space/TaskSpaceContext";
import { TaskSpaceBoard } from "@/features/task-space/components/TaskSpaceBoard";
import { TaskSpaceDialogs } from "@/features/task-space/components/TaskSpaceDialogs";
import { TaskSpaceHeader } from "@/features/task-space/components/TaskSpaceHeader";
import { useTaskSpace } from "@/features/task-space/useTaskSpace";

export function TasksPage() {
  const taskSpace = useTaskSpace();

  return (
    <TaskSpaceProvider value={taskSpace}>
      <div className="flex h-full min-h-0 flex-col gap-6">
        <TaskSpaceHeader />
        <TaskSpaceBoard />
      </div>
      <TaskSpaceDialogs />
    </TaskSpaceProvider>
  );
}
