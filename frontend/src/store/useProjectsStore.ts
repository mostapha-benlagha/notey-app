import { create } from "zustand";
import { mockProjects } from "@/services/mockData";
import type { Project } from "@/types/project.types";

const PROJECTS_STORAGE_KEY = "notey-projects";

interface ProjectsState {
  projects: Project[];
  selectedProjectId: string | null;
  createProject: (project: Project) => void;
  deleteProject: (projectId: string) => void;
  selectProject: (projectId: string | null) => void;
}

function readStoredProjects() {
  if (typeof window === "undefined") {
    return mockProjects;
  }

  try {
    const raw = window.localStorage.getItem(PROJECTS_STORAGE_KEY);
    if (!raw) {
      return mockProjects;
    }

    const parsed = JSON.parse(raw) as { projects?: unknown };
    if (!Array.isArray(parsed.projects)) {
      return mockProjects;
    }

    const storedProjects = parsed.projects.filter(
      (project): project is Project =>
        !!project &&
        typeof project === "object" &&
        typeof (project as Project).id === "string" &&
        typeof (project as Project).name === "string" &&
        typeof (project as Project).description === "string" &&
        typeof (project as Project).color === "string",
    );

    return storedProjects.length ? storedProjects : mockProjects;
  } catch {
    return mockProjects;
  }
}

function writeStoredProjects(projects: Project[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify({ projects }));
}

export const useProjectsStore = create<ProjectsState>((set) => ({
  projects: readStoredProjects(),
  selectedProjectId: null,
  createProject: (project) =>
    set((state) => {
      if (state.projects.some((existing) => existing.id === project.id)) {
        return state;
      }

      const projects = [...state.projects, project];
      writeStoredProjects(projects);
      return {
        projects,
      };
    }),
  deleteProject: (projectId) =>
    set((state) => {
      const projects = state.projects.filter((project) => project.id !== projectId);
      writeStoredProjects(projects);
      return {
        projects,
        selectedProjectId: state.selectedProjectId === projectId ? null : state.selectedProjectId,
      };
    }),
  selectProject: (projectId) =>
    set({
      selectedProjectId: projectId,
    }),
}));
