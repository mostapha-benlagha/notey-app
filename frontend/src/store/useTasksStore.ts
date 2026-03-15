import { create } from "zustand";
import {
  createExtractedTasks as createExtractedTasksRequest,
  createTask as createTaskRequest,
  deleteTask as deleteTaskRequest,
  emptyTaskTrash,
  fetchTasks,
  moveTask as moveTaskRequest,
  saveTaskStatuses as saveTaskStatusesRequest,
  updateTask as updateTaskRequest,
} from "@/services/api";
import type { Task, TaskStatus } from "@/types/task.types";

interface CreateManualTaskInput {
  title: string;
  description?: string;
  projectId: string;
  noteId: string | null;
  statusId?: string;
  tags?: string[];
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
  moveTask: (taskId: string, statusId: string, position: number) => Promise<void>;
  updateTaskDetails: (input: {
    id: string;
    title: string;
    description: string;
    projectId: string;
    noteId: string | null;
    statusId: string;
    tags: string[];
  }) => Promise<void>;
  setTaskNoteLink: (taskId: string, noteId: string | null) => Promise<void>;
  syncTasksProjectForNote: (noteId: string, projectId: string) => Promise<void>;
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
    } catch (error) {
      console.error("Failed to initialize tasks", error);
      set({ isLoading: false, statuses: [], tasks: [] });
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
      description: input.description ?? "",
      projectId: input.projectId,
      noteId: input.noteId,
      statusId: defaultStatusId,
      tags: input.tags ?? [],
    });

    set((state) => ({
      tasks: [...state.tasks.filter((existing) => existing.id !== task.id), task],
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
      tasks: [...state.tasks.filter((existing) => !tasks.some((task) => task.id === existing.id)), ...tasks],
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
  moveTask: async (taskId, statusId, position) => {
    const currentTask = get().tasks.find((task) => task.id === taskId);
    if (!currentTask) {
      return;
    }

    const updated = await moveTaskRequest({ id: taskId, statusId, position });
    set((state) => ({
      tasks: state.tasks
        .map((task) => (task.id === taskId ? updated : task))
        .sort((left, right) => {
          if (left.statusId === right.statusId) {
            return left.order - right.order;
          }

          return left.statusId.localeCompare(right.statusId);
        }),
    }));
  },
  updateTaskDetails: async (input) => {
    const updated = await updateTaskRequest(input);
    set((state) => ({
      tasks: state.tasks.map((task) => (task.id === input.id ? updated : task)),
    }));
  },
  setTaskNoteLink: async (taskId, noteId) => {
    const updated = await updateTaskRequest({ id: taskId, noteId });
    set((state) => ({
      tasks: state.tasks.map((task) => (task.id === taskId ? updated : task)),
    }));
  },
  syncTasksProjectForNote: async (noteId, projectId) => {
    const linkedTasks = get().tasks.filter((task) => task.noteId === noteId && task.projectId !== projectId);
    if (!linkedTasks.length) {
      return;
    }

    const updatedTasks = await Promise.all(
      linkedTasks.map((task) =>
        updateTaskRequest({
          id: task.id,
          projectId,
        }),
      ),
    );

    const updatedById = new Map(updatedTasks.map((task) => [task.id, task]));
    set((state) => ({
      tasks: state.tasks.map((task) => updatedById.get(task.id) ?? task),
    }));
  },
  toggleTask: async (taskId) => {
    const currentTask = get().tasks.find((task) => task.id === taskId);
    if (!currentTask) {
      return;
    }

    const nextStatusId = currentTask.statusId === "done" ? get().statuses[0]?.id ?? "draft" : "done";
    const nextPosition = get().tasks.filter((task) => task.statusId === nextStatusId && !task.deletedAt && task.id !== taskId).length;
    const updated = await moveTaskRequest({
      id: taskId,
      statusId: nextStatusId,
      position: nextPosition,
    });

    set((state) => ({
      tasks: state.tasks
        .map((task) => (task.id === taskId ? updated : task))
        .sort((left, right) => {
          if (left.statusId === right.statusId) {
            return left.order - right.order;
          }

          return left.statusId.localeCompare(right.statusId);
        }),
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
