import { Settings2, Sparkles, SquareCheckBig } from "lucide-react";
import { Link, NavLink } from "react-router-dom";
import { ProjectList } from "@/components/projects/ProjectList";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useProjects } from "@/hooks/useProjects";
import { cn } from "@/lib/utils";

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    "flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium transition hover:bg-white/70",
    isActive && "bg-white text-foreground shadow-soft",
  );

export function Sidebar() {
  const { projects, selectedProjectId, selectProject } = useProjects();

  return (
    <Card className="surface-grid flex h-full flex-col rounded-[32px] p-5">
      <Link to="/" className="flex items-center gap-3 px-2">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
          <Sparkles className="h-5 w-5" />
        </div>
        <div>
          <p className="text-lg font-extrabold">Notey</p>
          <p className="text-sm text-muted-foreground">AI note assistant</p>
        </div>
      </Link>
      <nav className="mt-8 space-y-1">
        <NavLink to="/" end className={navLinkClass}>
          <Sparkles className="h-4 w-4" />
          Chat
        </NavLink>
        <NavLink to="/tasks" className={navLinkClass}>
          <SquareCheckBig className="h-4 w-4" />
          Tasks
        </NavLink>
        <NavLink to="/settings" className={navLinkClass}>
          <Settings2 className="h-4 w-4" />
          Settings
        </NavLink>
      </nav>
      <Separator className="my-6" />
      <div className="flex-1">
        <div className="mb-3 px-2">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Projects</p>
        </div>
        <ProjectList projects={projects} selectedProjectId={selectedProjectId} onSelect={selectProject} />
      </div>
    </Card>
  );
}
