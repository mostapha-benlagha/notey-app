import { TaskList } from "@/components/tasks/TaskList";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNotesStore } from "@/store/useNotesStore";
import { useProjectsStore } from "@/store/useProjectsStore";
import { useTasksStore } from "@/store/useTasksStore";

export function TasksPage() {
  const notes = useNotesStore((state) => state.notes);
  const projects = useProjectsStore((state) => state.projects);
  const selectedProjectId = useProjectsStore((state) => state.selectedProjectId);
  const tasks = useTasksStore((state) => state.tasks);
  const toggleTask = useTasksStore((state) => state.toggleTask);

  const filteredTasks = tasks.filter((task) => !selectedProjectId || task.projectId === selectedProjectId);

  return (
    <Card className="rounded-[32px]">
      <CardHeader>
        <CardDescription>AI extracted task board</CardDescription>
        <CardTitle className="text-3xl">Tasks generated from notes</CardTitle>
      </CardHeader>
      <CardContent>
        <TaskList tasks={filteredTasks} notes={notes} projects={projects} onToggle={toggleTask} />
      </CardContent>
    </Card>
  );
}
