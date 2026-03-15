import { createContext, useContext, type ReactNode } from "react";
import { useTaskSpace } from "@/features/task-space/useTaskSpace";

type TaskSpaceValue = ReturnType<typeof useTaskSpace>;

const TaskSpaceContext = createContext<TaskSpaceValue | null>(null);

export function TaskSpaceProvider({ children, value }: { children: ReactNode; value: TaskSpaceValue }) {
  return <TaskSpaceContext.Provider value={value}>{children}</TaskSpaceContext.Provider>;
}

export function useTaskSpaceContext() {
  const value = useContext(TaskSpaceContext);
  if (!value) {
    throw new Error("useTaskSpaceContext must be used inside TaskSpaceProvider");
  }

  return value;
}
