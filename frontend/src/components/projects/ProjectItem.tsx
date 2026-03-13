import { FolderKanban } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Project } from "@/types/project.types";

export function ProjectItem({
  project,
  selected,
  onSelect,
}: {
  project: Project;
  selected: boolean;
  onSelect: (projectId: string | null) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <Button
        variant={selected ? "secondary" : "ghost"}
        className={cn("h-auto flex-1 justify-start rounded-2xl px-3 py-3", selected && "border border-white/60")}
        onClick={() => onSelect(project.id)}
      >
        <span className={cn("h-2.5 w-2.5 rounded-full", project.color)} />
        <span className="truncate">{project.name}</span>
      </Button>
      <Button asChild variant="ghost" size="icon" className="h-10 w-10 rounded-2xl">
        <Link to={`/app/projects/${project.id}`} aria-label={`Open ${project.name}`}>
          <FolderKanban className="h-4 w-4" />
        </Link>
      </Button>
    </div>
  );
}
