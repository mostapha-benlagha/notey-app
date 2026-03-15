import { useMemo, useState } from "react";
import { useNotesStore } from "@/store/useNotesStore";
import { useProjectsStore } from "@/store/useProjectsStore";
import { useTasksStore } from "@/store/useTasksStore";
import { type TaskBoardView } from "@/features/task-space/constants";

export function useTaskSpace() {
  const [query, setQuery] = useState("");
  const [view, setView] = useState<TaskBoardView>("kanban");
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const notes = useNotesStore((state) => state.notes);
  const projects = useProjectsStore((state) => state.projects);
  const selectedProjectId = useProjectsStore((state) => state.selectedProjectId);
  const statuses = useTasksStore((state) => state.statuses);
  const tasks = useTasksStore((state) => state.tasks);
  const isLoading = useTasksStore((state) => state.isLoading);
  const addTask = useTasksStore((state) => state.addTask);
  const updateTaskDetails = useTasksStore((state) => state.updateTaskDetails);
  const createStatus = useTasksStore((state) => state.createStatus);
  const saveStatuses = useTasksStore((state) => state.saveStatuses);
  const moveTask = useTasksStore((state) => state.moveTask);
  const toggleTask = useTasksStore((state) => state.toggleTask);
  const trashTask = useTasksStore((state) => state.trashTask);
  const getTrash = useTasksStore((state) => state.getTrash);

  const filteredTasks = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return tasks.filter((task) => {
      if (task.deletedAt) {
        return false;
      }

      if (selectedProjectId && task.projectId !== selectedProjectId) {
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
  }, [notes, query, selectedProjectId, statuses, tasks]);

  const selectedTask = tasks.find((task) => task.id === selectedTaskId) ?? null;
  const trashCount = getTrash(selectedProjectId).length;

  return {
    addTask,
    createStatus,
    filteredTasks,
    isLoading,
    notes,
    projects,
    query,
    saveStatuses,
    selectedProjectId,
    selectedTask,
    setQuery,
    setSelectedTaskId,
    setView,
    statuses,
    tasks,
    toggleTask,
    trashCount,
    trashTask,
    updateTaskDetails,
    view,
    moveTask,
  };
}
