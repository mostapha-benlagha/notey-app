import type { Project } from "@/types/project.types";

export const ALL_NOTES_PROJECT: Project = {
  id: "all",
  name: "All notes",
  description: "Browse every note across your workspace, no matter which project it belongs to.",
  color: "bg-slate-400",
};

export const PROJECT_SORT_OPTIONS = [
  { label: "Newest first", value: "newest" },
  { label: "Oldest first", value: "oldest" },
] as const;

export type ProjectSortOrder = (typeof PROJECT_SORT_OPTIONS)[number]["value"];
