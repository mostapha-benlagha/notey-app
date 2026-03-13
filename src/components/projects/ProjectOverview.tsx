import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Note } from "@/types/note.types";
import type { Project } from "@/types/project.types";
import type { Task } from "@/types/task.types";

export function ProjectOverview({
  project,
  notes,
  tasks,
}: {
  project: Project;
  notes: Note[];
  tasks: Task[];
}) {
  const completed = tasks.filter((task) => task.statusId === "done" && !task.deletedAt).length;

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card>
        <CardHeader>
          <CardDescription>Project</CardDescription>
          <CardTitle>{project.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{project.description}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardDescription>Notes captured</CardDescription>
          <CardTitle>{notes.length}</CardTitle>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader>
          <CardDescription>Tasks completed</CardDescription>
          <CardTitle>
            {completed}/{tasks.length || 0}
          </CardTitle>
        </CardHeader>
      </Card>
    </div>
  );
}
