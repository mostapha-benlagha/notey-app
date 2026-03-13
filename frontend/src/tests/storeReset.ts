import { mockNotes, mockProjects, mockTasks, mockTaskStatuses } from "@/services/mockData";
import { useNotesStore } from "@/store/useNotesStore";
import { useProjectsStore } from "@/store/useProjectsStore";
import { useTasksStore } from "@/store/useTasksStore";

export function resetAllStores() {
  useProjectsStore.setState({
    projects: [...mockProjects],
    selectedProjectId: "work",
  });

  useTasksStore.setState({
    statuses: [...mockTaskStatuses],
    tasks: [...mockTasks],
  });

  useNotesStore.setState({
    notes: [...mockNotes],
    searchTerm: "",
  });
}
