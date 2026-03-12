import { TaskCard } from "@/components/tasks/TaskCard";
import type { Note } from "@/types/note.types";
import type { Project } from "@/types/project.types";
import type { Task } from "@/types/task.types";

export function TaskList({
  tasks,
  notes,
  projects,
  onToggle,
}: {
  tasks: Task[];
  notes: Note[];
  projects: Project[];
  onToggle: (taskId: string) => void;
}) {
  return (
    <div className="space-y-4">
      {tasks.map((task) => {
        const project = projects.find((item) => item.id === task.projectId);
        const note = notes.find((item) => item.id === task.noteId);
        return (
          <TaskCard
            key={task.id}
            task={task}
            project={project}
            notePreview={note?.content.slice(0, 64)}
            onToggle={() => onToggle(task.id)}
          />
        );
      })}
    </div>
  );
}
