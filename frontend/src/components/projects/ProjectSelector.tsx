import { ChevronDown, Sparkles } from "lucide-react";
import { useProjectsStore } from "@/store/useProjectsStore";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ProjectSelectorProps {
  value: string;
  onChange: (value: string) => void;
  includeAutoOption?: boolean;
  includeNoProjectOption?: boolean;
}

interface ProjectOption {
  id: string;
  label: string;
  color?: string;
  kind: "auto" | "empty" | "project";
}

function ProjectOptionLabel({ option }: { option: ProjectOption }) {
  if (option.kind === "auto") {
    return (
      <span className="inline-flex items-center gap-2">
        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-amber-100 text-amber-700">
          <Sparkles className="h-3.5 w-3.5" />
        </span>
        <span>{option.label}</span>
      </span>
    );
  }

  if (option.kind === "empty") {
    return (
      <span className="inline-flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
        <span>{option.label}</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-2">
      <span className={cn("h-2.5 w-2.5 rounded-full", option.color)} />
      <span>{option.label}</span>
    </span>
  );
}

export function ProjectSelector({
  value,
  onChange,
  includeAutoOption = false,
  includeNoProjectOption = true,
}: ProjectSelectorProps) {
  const projects = useProjectsStore((state) => state.projects);

  const options: ProjectOption[] = [
    ...(includeAutoOption ? [{ id: "auto", label: "Auto", kind: "auto" as const }] : []),
    ...(includeNoProjectOption ? [{ id: "", label: "No project", kind: "empty" as const }] : []),
    ...projects.map((project) => ({
      id: project.id,
      label: project.name,
      color: project.color,
      kind: "project" as const,
    })),
  ];

  const selectedOption = options.find((option) => option.id === value) ?? options[0];
  if (!selectedOption) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Project selector"
          className="flex h-11 w-full items-center justify-between gap-3 rounded-2xl border border-border bg-white px-4 text-sm font-medium text-foreground shadow-soft transition hover:border-border hover:bg-white sm:max-w-[240px]"
        >
          <span className="min-w-0 truncate">
            <ProjectOptionLabel option={selectedOption} />
          </span>
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" sideOffset={10} className="w-[var(--radix-dropdown-menu-trigger-width)] min-w-[240px]">
        {options.map((option) => {
          const selected = option.id === value;
          return (
            <DropdownMenuItem
              key={`${option.kind}:${option.id || "empty"}`}
              className={cn(selected && "bg-secondary/70")}
              onSelect={() => onChange(option.id)}
            >
              <div className="flex w-full items-center gap-3">
                <ProjectOptionLabel option={option} />
              </div>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
