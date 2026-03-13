import { Link2, NotebookTabs, RotateCcw, Trash2, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { Project } from "@/types/project.types";
import type { Task, TaskStatus } from "@/types/task.types";

export function KanbanTaskCard({
  task,
  project,
  notePreview,
  status,
  draggable = true,
  onToggleDone,
  onTrash,
  onRestore,
  onPermanentDelete,
}: {
  task: Task;
  project?: Project;
  notePreview?: string;
  status?: TaskStatus;
  draggable?: boolean;
  onToggleDone?: () => void;
  onTrash?: () => void;
  onRestore?: () => void;
  onPermanentDelete?: () => void;
}) {
  return (
    <Card
      draggable={draggable}
      className="rounded-[28px] border-white/85 bg-white/95 p-4 transition hover:-translate-y-0.5"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold leading-6 text-foreground/95">{task.title}</h3>
            {status ? <Badge className={status.colorClass}>{status.label}</Badge> : null}
          </div>
          <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
            {project ? (
              <span className="inline-flex items-center gap-1">
                <NotebookTabs className="h-3.5 w-3.5" />
                {project.name}
              </span>
            ) : null}
            {notePreview ? (
              <span className="inline-flex items-center gap-1">
                <Link2 className="h-3.5 w-3.5" />
                {notePreview}
              </span>
            ) : null}
          </div>
        </div>
        <div className="flex gap-1">
          {onToggleDone ? (
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={onToggleDone}>
              <CheckCircle2 className="h-4 w-4" />
            </Button>
          ) : null}
          {onTrash ? (
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-rose-600 hover:bg-rose-50" onClick={onTrash}>
              <Trash2 className="h-4 w-4" />
            </Button>
          ) : null}
          {onRestore ? (
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={onRestore}>
              <RotateCcw className="h-4 w-4" />
            </Button>
          ) : null}
          {onPermanentDelete ? (
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-rose-600 hover:bg-rose-50" onClick={onPermanentDelete}>
              <Trash2 className="h-4 w-4" />
            </Button>
          ) : null}
        </div>
      </div>
    </Card>
  );
}
