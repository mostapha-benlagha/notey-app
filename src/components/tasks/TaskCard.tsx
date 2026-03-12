import { Link2, NotebookTabs } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { TaskStatusToggle } from "@/components/tasks/TaskStatusToggle";
import type { Project } from "@/types/project.types";
import type { Task } from "@/types/task.types";

export function TaskCard({
  task,
  project,
  notePreview,
  onToggle,
}: {
  task: Task;
  project?: Project;
  notePreview?: string;
  onToggle: () => void;
}) {
  return (
    <Card className="rounded-[28px] p-5">
      <div className="flex items-start gap-4">
        <TaskStatusToggle checked={task.status === "completed"} onChange={onToggle} />
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className={task.status === "completed" ? "text-sm line-through text-muted-foreground" : "text-sm font-semibold"}>
              {task.title}
            </h3>
            <Badge variant={task.status === "completed" ? "outline" : "default"}>{task.status}</Badge>
          </div>
          <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
            {project && (
              <span className="inline-flex items-center gap-1">
                <NotebookTabs className="h-3.5 w-3.5" />
                {project.name}
              </span>
            )}
            {notePreview && (
              <span className="inline-flex items-center gap-1">
                <Link2 className="h-3.5 w-3.5" />
                {notePreview}
              </span>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
