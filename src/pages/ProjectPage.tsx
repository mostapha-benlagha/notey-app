import { useParams } from "react-router-dom";
import { ChatContainer } from "@/components/chat/ChatContainer";
import { ProjectOverview } from "@/components/projects/ProjectOverview";
import { TaskList } from "@/components/tasks/TaskList";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNotesStore } from "@/store/useNotesStore";
import { useProjectsStore } from "@/store/useProjectsStore";
import { useTasksStore } from "@/store/useTasksStore";

export function ProjectPage() {
  const { id } = useParams();
  const notes = useNotesStore((state) => state.notes);
  const deleteNote = useNotesStore((state) => state.deleteNote);
  const projects = useProjectsStore((state) => state.projects);
  const tasks = useTasksStore((state) => state.tasks);
  const toggleTask = useTasksStore((state) => state.toggleTask);

  const project = projects.find((item) => item.id === id);
  const projectNotes = notes.filter((note) => note.projectId === id);
  const projectTasks = tasks.filter((task) => task.projectId === id);

  if (!project) {
    return (
      <Card className="rounded-[32px]">
        <CardContent className="p-10">
          <p className="text-sm text-muted-foreground">Project not found.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <ProjectOverview project={project} notes={projectNotes} tasks={projectTasks} />
      <Card className="rounded-[32px]">
        <CardHeader>
          <CardDescription>Project conversation</CardDescription>
          <CardTitle className="text-2xl">{project.name} notes</CardTitle>
        </CardHeader>
        <CardContent>
          <ChatContainer notes={projectNotes} projects={projects} onDeleteNote={deleteNote} />
        </CardContent>
      </Card>
      <Card className="rounded-[32px]">
        <CardHeader>
          <CardDescription>Project tasks</CardDescription>
          <CardTitle className="text-2xl">Extracted actions</CardTitle>
        </CardHeader>
        <CardContent>
          <TaskList tasks={projectTasks} notes={notes} projects={projects} onToggle={toggleTask} />
        </CardContent>
      </Card>
    </div>
  );
}
