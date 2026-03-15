import { useMemo, useState } from "react";
import { ArrowLeft, FilePenLine, FolderSearch, Search, Trash2 } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { NoteyLogoMark } from "@/components/brand/NoteyLogo";
import { ProjectOverview } from "@/components/projects/ProjectOverview";
import { TaskTrashPanel } from "@/components/tasks/TaskTrashPanel";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useNotesStore } from "@/store/useNotesStore";
import { useProjectsStore } from "@/store/useProjectsStore";
import { useTasksStore } from "@/store/useTasksStore";

function uniqueStrings(values: string[]) {
  return [...new Set(values.filter(Boolean))];
}

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

  const [query, setQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState("all");
  const [selectedProjectFilter, setSelectedProjectFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [confirmDeleteNoteId, setConfirmDeleteNoteId] = useState<string | null>(null);

  const isAllProjectsView = id === "all";
  const syntheticAllProject = {
    id: "all",
    name: "All notes",
    description: "Browse every note across your workspace, no matter which project it belongs to.",
    color: "bg-slate-400",
  };

  const project = isAllProjectsView ? syntheticAllProject : projects.find((item) => item.id === id);
  const scopedNotes = isAllProjectsView ? notes : notes.filter((note) => note.projectId === id);
  const scopedTasks = isAllProjectsView ? tasks.filter((task) => !task.deletedAt) : tasks.filter((task) => task.projectId === id && !task.deletedAt);
  const trashedProjectTasks = isAllProjectsView
    ? tasks.filter((task) => !!task.deletedAt)
    : tasks.filter((task) => task.projectId === id && !!task.deletedAt);

  const availableTags = useMemo(() => uniqueStrings(scopedNotes.flatMap((note) => note.tags)).sort(), [scopedNotes]);
  const availableProjectFilters = useMemo(
    () =>
      isAllProjectsView
        ? [
            { id: "all", name: "All projects" },
            ...projects.map((projectItem) => ({ id: projectItem.id, name: projectItem.name })),
            { id: "none", name: "No project" },
          ]
        : [],
    [isAllProjectsView, projects],
  );

  const filteredNotes = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return [...scopedNotes]
      .filter((note) => {
        const matchesProjectFilter =
          !isAllProjectsView ||
          selectedProjectFilter === "all" ||
          (selectedProjectFilter === "none" ? !note.projectId : note.projectId === selectedProjectFilter);
        const matchesTag = selectedTag === "all" || note.tags.includes(selectedTag);
        const matchesQuery =
          !normalizedQuery ||
          note.content.toLowerCase().includes(normalizedQuery) ||
          note.tags.some((tag) => tag.toLowerCase().includes(normalizedQuery)) ||
          note.projectId.toLowerCase().includes(normalizedQuery);

        return matchesProjectFilter && matchesTag && matchesQuery;
      })
      .sort((left, right) => {
        const leftTime = new Date(left.createdAt).getTime();
        const rightTime = new Date(right.createdAt).getTime();
        return sortOrder === "newest" ? rightTime - leftTime : leftTime - rightTime;
      });
  }, [isAllProjectsView, query, scopedNotes, selectedProjectFilter, selectedTag, sortOrder]);

  const openNewProjectNote = () =>
    navigate("/app/notes/new", {
      state: {
        projectId: isAllProjectsView ? "" : project?.id ?? "",
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
              <NoteyLogoMark className="h-4 w-auto" aria-hidden />
              Browse active projects
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-6">
      <Card className="rounded-[32px] bg-white/75">
        <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <CardDescription>{isAllProjectsView ? "Workspace browser" : "Project workspace"}</CardDescription>
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
              {isAllProjectsView ? "Create note" : `Create note for ${project.name}`}
            </Button>
          </div>
        </CardHeader>
      </Card>

      <div className="min-h-0 flex-1 overflow-y-auto pr-1">
        <div className="space-y-6 pb-6">
          <ProjectOverview project={project} notes={scopedNotes} tasks={scopedTasks} />

          <Card className="rounded-[32px]">
            <CardHeader className="gap-4">
              <div>
                <CardDescription>{isAllProjectsView ? "Workspace notes" : "Project notes"}</CardDescription>
                <CardTitle className="text-2xl">
                  {isAllProjectsView ? "Browse everything in one place" : `${project.name} notes`}
                </CardTitle>
              </div>

              <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_180px_180px_180px]">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    className="pl-10"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search notes, tags, or project names..."
                  />
                </div>
                <Select value={selectedTag} onChange={(event) => setSelectedTag(event.target.value)}>
                  <option value="all">All tags</option>
                  {availableTags.map((tag) => (
                    <option key={tag} value={tag}>
                      #{tag}
                    </option>
                  ))}
                </Select>
                {isAllProjectsView ? (
                  <Select value={selectedProjectFilter} onChange={(event) => setSelectedProjectFilter(event.target.value)}>
                    {availableProjectFilters.map((projectFilter) => (
                      <option key={projectFilter.id} value={projectFilter.id}>
                        {projectFilter.name}
                      </option>
                    ))}
                  </Select>
                ) : (
                  <div className="rounded-xl border border-input bg-secondary/40 px-3 py-2 text-sm text-muted-foreground">
                    Filtering inside {project.name}
                  </div>
                )}
                <Select value={sortOrder} onChange={(event) => setSortOrder(event.target.value as "newest" | "oldest")}>
                  <option value="newest">Newest first</option>
                  <option value="oldest">Oldest first</option>
                </Select>
              </div>
            </CardHeader>

            <CardContent>
              {filteredNotes.length ? (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {filteredNotes.map((note) => {
                    const noteProject = projects.find((item) => item.id === note.projectId);

                    return (
                      <Card key={note.id} className="rounded-[28px] border-white/80 bg-white/92">
                        <CardHeader className="gap-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex flex-wrap gap-2">
                              <span className="inline-flex rounded-full bg-secondary px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                                {(noteProject?.name ?? note.projectId) || "No project"}
                              </span>
                              <span className="inline-flex rounded-full bg-white px-3 py-1 text-xs text-muted-foreground">
                                {new Date(note.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          <div>
                            <CardTitle className="text-lg leading-7">{note.content.slice(0, 90)}</CardTitle>
                            <CardDescription className="mt-2 line-clamp-4 text-sm leading-7 text-muted-foreground">
                              {note.content}
                            </CardDescription>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {note.tags.length ? (
                            <div className="flex flex-wrap gap-2">
                              {note.tags.slice(0, 4).map((tag) => (
                                <span key={tag} className="rounded-full bg-secondary/70 px-2.5 py-1 text-xs font-medium text-secondary-foreground">
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">No tags yet</p>
                          )}

                          <div className="flex gap-2">
                            <Button
                              type="button"
                              className="flex-1 rounded-2xl"
                              onClick={() => navigate(`/app/notes/${note.id}`, { state: { returnTo: `/app/projects/${project.id}` } })}
                            >
                              Open note
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              className="rounded-2xl"
                              onClick={() => {
                                setConfirmDeleteNoteId(note.id);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                              Remove
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <div className="flex min-h-[280px] flex-col items-center justify-center rounded-[28px] border border-dashed border-border bg-white/45 px-6 py-10 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-[22px] bg-primary/10 text-primary">
                    <FilePenLine className="h-6 w-6" />
                  </div>
                  <h3 className="mt-5 text-xl font-semibold">No notes match these filters</h3>
                  <p className="mt-3 max-w-lg text-sm leading-7 text-muted-foreground">
                    Try a broader search, clear the tag or project filters, or create a new note to populate this space.
                  </p>
                  <Button className="mt-6 rounded-2xl" onClick={openNewProjectNote}>
                    <FilePenLine className="h-4 w-4" />
                    Create a new note
                  </Button>
                </div>
              )}
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
      </div>

      <AlertDialog
        open={!!confirmDeleteNoteId}
        onOpenChange={(open) => {
          if (!open) {
            setConfirmDeleteNoteId(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this note?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the note from your workspace and from this project view.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              tone="destructive"
              onClick={() => {
                if (confirmDeleteNoteId) {
                  void deleteNote(confirmDeleteNoteId);
                }
                setConfirmDeleteNoteId(null);
              }}
            >
              Delete note
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
