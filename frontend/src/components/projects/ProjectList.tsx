import type { Project } from "@/types/project.types";
import { ProjectItem } from "@/components/projects/ProjectItem";

export function ProjectList({
  projects,
  selectedProjectId,
  onSelect,
}: {
  projects: Project[];
  selectedProjectId: string | null;
  onSelect: (projectId: string | null) => void;
}) {
  return (
    <div className="space-y-2">
      <ProjectItem
        project={{
          id: "all",
          name: "All notes",
          description: "Every project",
          color: "bg-slate-400",
        }}
        selected={selectedProjectId === null}
        onSelect={() => onSelect(null)}
      />
      {projects.map((project) => (
        <ProjectItem
          key={project.id}
          project={project}
          selected={selectedProjectId === project.id}
          onSelect={(projectId) => onSelect(projectId)}
        />
      ))}
    </div>
  );
}
