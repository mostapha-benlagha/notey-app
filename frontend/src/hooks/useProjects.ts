import { useProjectsStore } from "@/store/useProjectsStore";

export function useProjects() {
  const projects = useProjectsStore((state) => state.projects);
  const selectedProjectId = useProjectsStore((state) => state.selectedProjectId);
  const selectProject = useProjectsStore((state) => state.selectProject);

  const selectedProject = projects.find((project) => project.id === selectedProjectId) ?? null;

  return {
    projects,
    selectedProject,
    selectedProjectId,
    selectProject,
  };
}
