import { create } from "zustand";
import { mockProjects } from "@/services/mockData";
import type { Project } from "@/types/project.types";

interface ProjectsState {
  projects: Project[];
  selectedProjectId: string | null;
  createProject: (project: Project) => void;
  selectProject: (projectId: string | null) => void;
}

export const useProjectsStore = create<ProjectsState>((set) => ({
  projects: mockProjects,
  selectedProjectId: "work",
  createProject: (project) =>
    set((state) => ({
      projects: [...state.projects, project],
    })),
  selectProject: (projectId) =>
    set({
      selectedProjectId: projectId,
    }),
}));
