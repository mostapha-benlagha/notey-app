import { create } from "zustand";
import {
  createExtractedTasks as createExtractedTasksRequest,
  createTask as createTaskRequest,
  deleteTask as deleteTaskRequest,
  emptyTaskTrash,
  fetchTasks,
  saveTaskStatuses as saveTaskStatusesRequest,
  updateTask as updateTaskRequest,
} from "@/services/api";
import type { Task, TaskStatus } from "@/types/task.types";

interface CreateManualTaskInput {
  title: string;
  projectId: string;
  noteId: string | null;
  statusId?: string;
}

interface TasksState {
  statuses: TaskStatus[];
  tasks: Task[];
  isLoading: boolean;
  initialize: () => Promise<void>;
  clear: () => void;
  addTask: (input: CreateManualTaskInput) => Promise<Task>;
  createExtractedTasks: (input: { noteId: string; projectId: string; titles: string[] }) => Promise<Task[]>;
  handleNoteDeleted: (noteId: string) => void;
  createStatus: (label: string, colorClass?: string) => Promise<TaskStatus | null>;
  saveStatuses: (statuses: TaskStatus[]) => Promise<void>;
  moveTask: (taskId: string, statusId: string) => Promise<void>;
  toggleTask: (taskId: string) => Promise<void>;
  trashTask: (taskId: string) => Promise<void>;
  restoreTask: (taskId: string) => Promise<void>;
  permanentlyDeleteTask: (taskId: string) => Promise<void>;
  emptyTrash: (projectId?: string | null) => Promise<void>;
  filterByProject: (projectId?: string | null) => Task[];
  getTrash: (projectId?: string | null) => Task[];
}

export const useTasksStore = create<TasksState>((set, get) => ({
  statuses: [],
  tasks: [],
  isLoading: false,
  initialize: async () => {
    set({ isLoading: true });

    try {
      const { statuses, tasks } = await fetchTasks();
      set({ isLoading: false, statuses, tasks });
    } catch {
      set({ isLoading: false, statuses: [], tasks: [] });
      throw new Error("Unable to load tasks");
    }
  },
  clear: () =>
    set({
      statuses: [],
      tasks: [],
      isLoading: false,
    }),
  addTask: async (input) => {
    const defaultStatusId = input.statusId ?? get().statuses[0]?.id ?? "draft";
    const task = await createTaskRequest({
      title: input.title,
      projectId: input.projectId,
      noteId: input.noteId,
      statusId: defaultStatusId,
    });

    set((state) => ({
      tasks: [task, ...state.tasks.filter((existing) => existing.id !== task.id)],
    }));

    return task;
  },
  createExtractedTasks: async (input) => {
    const titles = input.titles.map((title) => title.trim()).filter(Boolean);
    if (!titles.length) {
      return [];
    }

    const tasks = await createExtractedTasksRequest(input);

    set((state) => ({
      tasks: [...tasks, ...state.tasks.filter((existing) => !tasks.some((task) => task.id === existing.id))],
    }));

    return tasks;
  },
  handleNoteDeleted: (noteId) =>
    set((state) => ({
      tasks: state.tasks
        .filter((task) => !(task.noteId === noteId && task.source === "note_ai"))
        .map((task) => (task.noteId === noteId && task.source === "manual" ? { ...task, noteId: null } : task)),
    })),
  createStatus: async (label, colorClass = "bg-violet-100 text-violet-700") => {
    const normalized = label.trim();
    if (!normalized) {
      return null;
    }

    const status: TaskStatus = {
      id: normalized.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      label: normalized,
      colorClass,
      kind: "custom",
    };

    if (get().statuses.some((item) => item.id === status.id)) {
      return null;
    }

    const nextStatuses = [...get().statuses, status];
    const response = await saveTaskStatusesRequest(nextStatuses);
    set({ statuses: response.statuses, tasks: response.tasks });
    return response.statuses.find((item) => item.id === status.id) ?? status;
  },
  saveStatuses: async (statuses) => {
    const response = await saveTaskStatusesRequest(statuses);
    set({ statuses: response.statuses, tasks: response.tasks });
  },
  moveTask: async (taskId, statusId) => {
    const currentTask = get().tasks.find((task) => task.id === taskId);
    if (!currentTask || currentTask.statusId === statusId) {
      return;
    }

    const updated = await updateTaskRequest({ id: taskId, statusId });
    set((state) => ({
      tasks: state.tasks.map((task) => (task.id === taskId ? updated : task)),
    }));
  },
  toggleTask: async (taskId) => {
    const currentTask = get().tasks.find((task) => task.id === taskId);
    if (!currentTask) {
      return;
    }

    const updated = await updateTaskRequest({
      id: taskId,
      statusId: currentTask.statusId === "done" ? get().statuses[0]?.id ?? "draft" : "done",
    });

    set((state) => ({
      tasks: state.tasks.map((task) => (task.id === taskId ? updated : task)),
    }));
  },
  trashTask: async (taskId) => {
    const updated = await updateTaskRequest({ id: taskId, deletedAt: new Date().toISOString() });
    set((state) => ({
      tasks: state.tasks.map((task) => (task.id === taskId ? updated : task)),
    }));
  },
  restoreTask: async (taskId) => {
    const updated = await updateTaskRequest({ id: taskId, deletedAt: null });
    set((state) => ({
      tasks: state.tasks.map((task) => (task.id === taskId ? updated : task)),
    }));
  },
  permanentlyDeleteTask: async (taskId) => {
    await deleteTaskRequest(taskId);
    set((state) => ({
      tasks: state.tasks.filter((task) => task.id !== taskId),
    }));
  },
  emptyTrash: async (projectId) => {
    await emptyTaskTrash(projectId);
    set((state) => ({
      tasks: state.tasks.filter((task) => !task.deletedAt || (!!projectId && task.projectId !== projectId)),
    }));
  },
  filterByProject: (projectId) =>
    get().tasks.filter((task) => (!projectId || task.projectId === projectId) && !task.deletedAt),
  getTrash: (projectId) =>
    get().tasks.filter((task) => (!projectId || task.projectId === projectId) && !!task.deletedAt),
}));
