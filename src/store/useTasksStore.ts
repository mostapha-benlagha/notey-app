import { create } from "zustand";
import { mockTasks, mockTaskStatuses } from "@/services/mockData";
import type { Task, TaskStatus } from "@/types/task.types";

interface TasksState {
  statuses: TaskStatus[];
  tasks: Task[];
  addTask: (task: Task) => void;
  createStatus: (label: string) => TaskStatus | null;
  moveTask: (taskId: string, statusId: string) => void;
  toggleTask: (taskId: string) => void;
  trashTask: (taskId: string) => void;
  restoreTask: (taskId: string) => void;
  permanentlyDeleteTask: (taskId: string) => void;
  emptyTrash: (projectId?: string | null) => void;
  filterByProject: (projectId?: string | null) => Task[];
  getTrash: (projectId?: string | null) => Task[];
}

export const useTasksStore = create<TasksState>((set, get) => ({
  statuses: mockTaskStatuses,
  tasks: mockTasks,
  addTask: (task) =>
    set((state) => ({
      tasks: [task, ...state.tasks],
    })),
  createStatus: (label) => {
    const normalized = label.trim();
    if (!normalized) {
      return null;
    }

    const status: TaskStatus = {
      id: normalized.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      label: normalized,
      colorClass: "bg-violet-100 text-violet-700",
      kind: "custom",
    };

    const exists = get().statuses.some((item) => item.id === status.id);
    if (exists) {
      return null;
    }

    set((state) => ({
      statuses: [...state.statuses, status],
    }));

    return status;
  },
  moveTask: (taskId, statusId) =>
    set((state) => ({
      tasks: state.tasks.map((task) => (task.id === taskId ? { ...task, statusId } : task)),
    })),
  toggleTask: (taskId) =>
    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === taskId
          ? { ...task, statusId: task.statusId === "done" ? "draft" : "done" }
          : task,
      ),
    })),
  trashTask: (taskId) =>
    set((state) => ({
      tasks: state.tasks.map((task) => (task.id === taskId ? { ...task, deletedAt: new Date().toISOString() } : task)),
    })),
  restoreTask: (taskId) =>
    set((state) => ({
      tasks: state.tasks.map((task) => (task.id === taskId ? { ...task, deletedAt: null } : task)),
    })),
  permanentlyDeleteTask: (taskId) =>
    set((state) => ({
      tasks: state.tasks.filter((task) => task.id !== taskId),
    })),
  emptyTrash: (projectId) =>
    set((state) => ({
      tasks: state.tasks.filter((task) => !task.deletedAt || (!!projectId && task.projectId !== projectId)),
    })),
  filterByProject: (projectId) =>
    get().tasks.filter((task) => (!projectId || task.projectId === projectId) && !task.deletedAt),
  getTrash: (projectId) =>
    get().tasks.filter((task) => (!projectId || task.projectId === projectId) && !!task.deletedAt),
}));
