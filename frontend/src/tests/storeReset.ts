import { mockNotes, mockProjects, mockTasks, mockTaskStatuses } from "@/services/mockData";
import { useNotesStore } from "@/store/useNotesStore";
import { useProjectsStore } from "@/store/useProjectsStore";
import { useTasksStore } from "@/store/useTasksStore";

export function resetAllStores() {
  useProjectsStore.setState({
    projects: [...mockProjects],
    selectedProjectId: null,
  });

  useTasksStore.setState({
    isLoading: false,
    statuses: [...mockTaskStatuses],
    tasks: [...mockTasks],
  });

  useNotesStore.setState({
    isLoading: false,
    notes: [...mockNotes],
    searchTerm: "",
  });
}
