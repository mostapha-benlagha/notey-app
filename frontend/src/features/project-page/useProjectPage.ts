import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ALL_NOTES_PROJECT, type ProjectSortOrder } from "@/features/project-page/constants";
import { useNotesStore } from "@/store/useNotesStore";
import { useProjectsStore } from "@/store/useProjectsStore";
import { useTasksStore } from "@/store/useTasksStore";

function uniqueStrings(values: string[]) {
  return [...new Set(values.filter(Boolean))];
}

export function useProjectPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const notes = useNotesStore((state) => state.notes);
  const clearProjectFromNotes = useNotesStore((state) => state.clearProjectFromNotes);
  const deleteNote = useNotesStore((state) => state.deleteNote);
  const projects = useProjectsStore((state) => state.projects);
  const deleteProject = useProjectsStore((state) => state.deleteProject);
  const selectProject = useProjectsStore((state) => state.selectProject);
  const statuses = useTasksStore((state) => state.statuses);
  const tasks = useTasksStore((state) => state.tasks);
  const clearProjectFromTasks = useTasksStore((state) => state.clearProjectFromTasks);
  const restoreTask = useTasksStore((state) => state.restoreTask);
  const permanentlyDeleteTask = useTasksStore((state) => state.permanentlyDeleteTask);

  const [query, setQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState("all");
  const [selectedProjectFilter, setSelectedProjectFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState<ProjectSortOrder>("newest");
  const [confirmDeleteNoteId, setConfirmDeleteNoteId] = useState<string | null>(null);
  const [confirmDeleteProject, setConfirmDeleteProject] = useState(false);

  const isAllProjectsView = id === ALL_NOTES_PROJECT.id;
  const project = isAllProjectsView ? ALL_NOTES_PROJECT : projects.find((item) => item.id === id);
  const scopedNotes = isAllProjectsView ? notes : notes.filter((note) => note.projectId === id);
  const scopedTasks = isAllProjectsView ? tasks.filter((task) => !task.deletedAt) : tasks.filter((task) => task.projectId === id && !task.deletedAt);
  const trashedProjectTasks = isAllProjectsView
    ? tasks.filter((task) => !!task.deletedAt)
    : tasks.filter((task) => task.projectId === id && !!task.deletedAt);

  const availableTags = useMemo(() => uniqueStrings(scopedNotes.flatMap((note) => note.tags)).sort(), [scopedNotes]);
  const availableProjectFilters = useMemo(
    () =>
      isAllProjectsView
        ? [
            { id: "all", name: "All projects" },
            ...projects.map((projectItem) => ({ id: projectItem.id, name: projectItem.name })),
            { id: "none", name: "No project" },
          ]
        : [],
    [isAllProjectsView, projects],
  );

  const filteredNotes = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return [...scopedNotes]
      .filter((note) => {
        const matchesProjectFilter =
          !isAllProjectsView ||
          selectedProjectFilter === "all" ||
          (selectedProjectFilter === "none" ? !note.projectId : note.projectId === selectedProjectFilter);
        const matchesTag = selectedTag === "all" || note.tags.includes(selectedTag);
        const matchesQuery =
          !normalizedQuery ||
          note.content.toLowerCase().includes(normalizedQuery) ||
          note.tags.some((tag) => tag.toLowerCase().includes(normalizedQuery)) ||
          note.projectId.toLowerCase().includes(normalizedQuery);

        return matchesProjectFilter && matchesTag && matchesQuery;
      })
      .sort((left, right) => {
        const leftTime = new Date(left.createdAt).getTime();
        const rightTime = new Date(right.createdAt).getTime();
        return sortOrder === "newest" ? rightTime - leftTime : leftTime - rightTime;
      });
  }, [isAllProjectsView, query, scopedNotes, selectedProjectFilter, selectedTag, sortOrder]);

  const openNewProjectNote = () =>
    navigate("/app/notes/new", {
      state: {
        projectId: isAllProjectsView ? "" : project?.id ?? "",
        returnTo: project ? `/app/projects/${project.id}` : "/app",
      },
    });

  const handleDeleteProject = async () => {
    if (isAllProjectsView || !project?.id) {
      return;
    }

    await clearProjectFromNotes(project.id);
    await clearProjectFromTasks(project.id);
    deleteProject(project.id);
    selectProject(null);
    navigate("/app/projects/all", { replace: true });
  };

  const handleDeleteNote = async () => {
    if (!confirmDeleteNoteId) {
      return;
    }

    await deleteNote(confirmDeleteNoteId);
    setConfirmDeleteNoteId(null);
  };

  return {
    availableProjectFilters,
    availableTags,
    confirmDeleteNoteId,
    confirmDeleteProject,
    filteredNotes,
    handleDeleteNote,
    handleDeleteProject,
    isAllProjectsView,
    notes,
    openNewProjectNote,
    permanentlyDeleteTask,
    project,
    projects,
    query,
    restoreTask,
    scopedNotes,
    scopedTasks,
    selectedProjectFilter,
    selectedTag,
    setConfirmDeleteNoteId,
    setConfirmDeleteProject,
    setQuery,
    setSelectedProjectFilter,
    setSelectedTag,
    setSortOrder,
    sortOrder,
    statuses,
    tasks,
    trashedProjectTasks,
    navigate,
  };
}
