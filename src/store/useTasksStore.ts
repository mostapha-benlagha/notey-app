import { create } from "zustand";
import { mockTasks } from "@/services/mockData";
import type { Task } from "@/types/task.types";

interface TasksState {
  tasks: Task[];
  addTask: (task: Task) => void;
  toggleTask: (taskId: string) => void;
  filterByProject: (projectId?: string | null) => Task[];
}

export const useTasksStore = create<TasksState>((set, get) => ({
  tasks: mockTasks,
  addTask: (task) =>
    set((state) => ({
      tasks: [task, ...state.tasks],
    })),
  toggleTask: (taskId) =>
    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === taskId
          ? { ...task, status: task.status === "pending" ? "completed" : "pending" }
          : task,
      ),
    })),
  filterByProject: (projectId) =>
    get().tasks.filter((task) => !projectId || task.projectId === projectId),
}));
