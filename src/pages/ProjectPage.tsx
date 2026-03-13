import { ArrowLeft, FilePenLine, FolderSearch, Sparkles } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ChatContainer } from "@/components/chat/ChatContainer";
import { ProjectOverview } from "@/components/projects/ProjectOverview";
import { TaskTrashPanel } from "@/components/tasks/TaskTrashPanel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNotesStore } from "@/store/useNotesStore";
import { useProjectsStore } from "@/store/useProjectsStore";
import { useTasksStore } from "@/store/useTasksStore";

export function ProjectPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const notes = useNotesStore((state) => state.notes);
  const deleteNote = useNotesStore((state) => state.deleteNote);
  const projects = useProjectsStore((state) => state.projects);
  const statuses = useTasksStore((state) => state.statuses);
  const tasks = useTasksStore((state) => state.tasks);
  const restoreTask = useTasksStore((state) => state.restoreTask);
  const permanentlyDeleteTask = useTasksStore((state) => state.permanentlyDeleteTask);

  const project = projects.find((item) => item.id === id);
  const projectNotes = notes.filter((note) => note.projectId === id);
  const projectTasks = tasks.filter((task) => task.projectId === id && !task.deletedAt);
  const trashedProjectTasks = tasks.filter((task) => task.projectId === id && !!task.deletedAt);
  const openNewProjectNote = () =>
    navigate("/app/notes/new", {
      state: {
        projectId: project?.id ?? "work",
        returnTo: project ? `/app/projects/${project.id}` : "/app",
      },
    });

  if (!project) {
    return (
      <Card className="flex h-full min-h-[420px] items-center justify-center rounded-[32px]">
        <CardContent className="max-w-xl p-10 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[24px] bg-accent text-accent-foreground shadow-soft">
            <FolderSearch className="h-8 w-8" />
          </div>
          <h1 className="mt-6 text-3xl font-bold tracking-tight">Project not found</h1>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">
            This project link does not match anything in your workspace. It may have been removed or the URL may be incomplete.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild variant="ghost" className="rounded-2xl">
              <Link to="/app">
                <ArrowLeft className="h-4 w-4" />
                Back to chat
              </Link>
            </Button>
            <Button className="rounded-2xl" onClick={() => navigate("/app")}>
              <Sparkles className="h-4 w-4" />
              Browse active projects
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="rounded-[32px] bg-white/75">
        <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <CardDescription>Project workspace</CardDescription>
            <CardTitle className="text-3xl">{project.name}</CardTitle>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">{project.description}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild variant="ghost" className="rounded-2xl">
              <Link to="/app">
                <ArrowLeft className="h-4 w-4" />
                Back to chat
              </Link>
            </Button>
            <Button className="rounded-2xl" onClick={openNewProjectNote}>
              <FilePenLine className="h-4 w-4" />
              Create note
            </Button>
          </div>
        </CardHeader>
      </Card>
      <ProjectOverview project={project} notes={projectNotes} tasks={projectTasks} />
      <Card className="rounded-[32px]">
        <CardHeader>
          <CardDescription>Project conversation</CardDescription>
          <CardTitle className="text-2xl">{project.name} notes</CardTitle>
        </CardHeader>
        <CardContent>
          {projectNotes.length ? (
            <ChatContainer
              notes={projectNotes}
              projects={projects}
              onDeleteNote={deleteNote}
              onOpenNote={(noteId) => navigate(`/app/notes/${noteId}`, { state: { returnTo: `/app/projects/${project.id}` } })}
            />
          ) : (
            <div className="flex min-h-[280px] flex-col items-center justify-center rounded-[28px] border border-dashed border-border bg-white/45 px-6 py-10 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-[22px] bg-primary/10 text-primary">
                <FilePenLine className="h-6 w-6" />
              </div>
              <h3 className="mt-5 text-xl font-semibold">Start this project with a first note</h3>
              <p className="mt-3 max-w-lg text-sm leading-7 text-muted-foreground">
                Capture a meeting recap, working draft, or research update here. The note will be linked directly to {project.name}.
              </p>
              <Button className="mt-6 rounded-2xl" onClick={openNewProjectNote}>
                <FilePenLine className="h-4 w-4" />
                Create note for {project.name}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      <Card className="rounded-[32px]">
        <CardHeader>
          <CardDescription>Project tasks</CardDescription>
          <CardTitle className="text-2xl">Task pipeline lives in the board</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-[28px] border border-dashed border-border bg-white/45 px-6 py-8 text-sm leading-7 text-muted-foreground">
            Tasks for this project now live in the kanban board. Use the board to move tasks across statuses, create custom columns, and manage trash.
          </div>
        </CardContent>
      </Card>
      {!!trashedProjectTasks.length && (
        <TaskTrashPanel
          tasks={trashedProjectTasks}
          statuses={statuses}
          notes={notes}
          projects={projects}
          onRestore={restoreTask}
          onPermanentDelete={permanentlyDeleteTask}
        />
      )}
    </div>
  );
}
