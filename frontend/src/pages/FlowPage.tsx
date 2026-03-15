import "@xyflow/react/dist/style.css";
import { useEffect, useMemo, useState } from "react";
import { Settings2 } from "lucide-react";
import {
  addEdge,
  Background,
  Controls,
  type Connection,
  type Edge,
  type Node,
  Position,
  ReactFlow,
  useEdgesState,
  useNodesState,
} from "@xyflow/react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useNotesStore } from "@/store/useNotesStore";
import { useProjectsStore } from "@/store/useProjectsStore";
import { useTasksStore } from "@/store/useTasksStore";
import type { Note } from "@/types/note.types";
import type { Project } from "@/types/project.types";
import type { Task, TaskStatus } from "@/types/task.types";

function truncate(value: string, maxLength: number) {
  return value.length <= maxLength ? value : `${value.slice(0, maxLength - 1)}...`;
}

function toggleSelection(current: string[] | null, value: string, allValues: string[]) {
  const next = new Set(current ?? allValues);
  if (next.has(value)) {
    next.delete(value);
  } else {
    next.add(value);
  }

  return next.size === allValues.length ? null : Array.from(next);
}

function isWithinDateRange(createdAt: string, dateFrom: string, dateTo: string) {
  const timestamp = new Date(createdAt).getTime();
  if (Number.isNaN(timestamp)) {
    return false;
  }

  if (dateFrom) {
    const fromTimestamp = new Date(`${dateFrom}T00:00:00`).getTime();
    if (timestamp < fromTimestamp) {
      return false;
    }
  }

  if (dateTo) {
    const toTimestamp = new Date(`${dateTo}T23:59:59.999`).getTime();
    if (timestamp > toTimestamp) {
      return false;
    }
  }

  return true;
}

type TimelinePreset = "today" | "week" | "month" | "custom";

function toDateInputValue(value: Date) {
  return value.toISOString().slice(0, 10);
}

function getTimelineRange(preset: TimelinePreset, customFrom: string, customTo: string) {
  const now = new Date();

  if (preset === "today") {
    const today = toDateInputValue(now);
    return { dateFrom: today, dateTo: today };
  }

  if (preset === "week") {
    const from = new Date(now);
    from.setDate(now.getDate() - 7);
    return { dateFrom: toDateInputValue(from), dateTo: toDateInputValue(now) };
  }

  if (preset === "month") {
    const from = new Date(now);
    from.setMonth(now.getMonth() - 1);
    return { dateFrom: toDateInputValue(from), dateTo: toDateInputValue(now) };
  }

  return { dateFrom: customFrom, dateTo: customTo };
}

function createProjectNodes(projects: Project[]) {
  return projects.map((project, index) => ({
    id: `project:${project.id}`,
    type: "default",
    position: {
      x: 70,
      y: 90 + index * 170,
    },
    data: {
      label: (
        <div className="w-[220px]">
          <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Project
          </span>
          <p className="mt-3 text-base font-semibold text-foreground">{project.name}</p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {truncate(project.description, 90)}
          </p>
        </div>
      ),
    },
    draggable: true,
    selectable: true,
    targetPosition: Position.Right,
    style: {
      borderRadius: 24,
      border: "1px solid rgba(209, 219, 234, 0.95)",
      background: "rgba(252, 251, 247, 0.98)",
      boxShadow: "0 14px 30px rgba(22, 32, 51, 0.06)",
      padding: 18,
      width: 250,
    },
  })) satisfies Node[];
}

function createNoteNodes(input: {
  notes: Note[];
  projects: Project[];
}) {
  return input.notes.map((note, index) => {
    const column = index % 2;
    const row = Math.floor(index / 2);
    const project = input.projects.find((item) => item.id === note.projectId);

    return {
      id: `note:${note.id}`,
      type: "default",
      position: {
        x: 430 + column * 340,
        y: 80 + row * 230,
      },
      data: {
        label: (
          <div className="w-[220px]">
            <div className="flex items-center justify-between gap-3">
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                {(project?.name ?? note.projectId) || "No project"}
              </span>
              <span className="text-[11px] text-muted-foreground">
                {new Date(note.createdAt).toLocaleDateString()}
              </span>
            </div>
            <p className="mt-3 text-sm font-semibold leading-6 text-foreground">
              {truncate(note.content, 140)}
            </p>
            {note.tags.length ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {note.tags.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-secondary px-2.5 py-1 text-[11px] font-medium text-secondary-foreground"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        ),
      },
      draggable: true,
      selectable: true,
      sourcePosition: Position.Left,
      targetPosition: Position.Right,
      style: {
        borderRadius: 24,
        border: "1px solid rgba(214, 225, 240, 0.95)",
        background: "rgba(255,255,255,0.96)",
        boxShadow: "0 18px 36px rgba(22, 32, 51, 0.08)",
        padding: 18,
        width: 260,
      },
    } satisfies Node;
  });
}

function createTaskNodes(input: {
  tasks: Task[];
  statuses: TaskStatus[];
  projects: Project[];
}) {
  return input.tasks.map((task, index) => {
    const column = index % 2;
    const row = Math.floor(index / 2);
    const status = input.statuses.find((item) => item.id === task.statusId);
    const project = input.projects.find((item) => item.id === task.projectId);

    return {
      id: `task:${task.id}`,
      type: "default",
      position: {
        x: 1170 + column * 290,
        y: 100 + row * 190,
      },
      data: {
        label: (
          <div className="w-[200px]">
            <div className="flex items-center justify-between gap-3">
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-700">
                To-do
              </span>
              <span className="text-[11px] text-muted-foreground">
                {(project?.name ?? task.projectId) || "No project"}
              </span>
            </div>
            <p className="mt-3 text-sm font-semibold leading-6 text-foreground">
              {truncate(task.title, 100)}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="rounded-full bg-sky-50 px-2.5 py-1 text-[11px] font-medium text-sky-700">
                {status?.label ?? task.statusId}
              </span>
              {task.noteId ? (
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700">
                  linked
                </span>
              ) : (
                <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-medium text-amber-700">
                  unlinked
                </span>
              )}
            </div>
          </div>
        ),
      },
      draggable: true,
      selectable: true,
      sourcePosition: Position.Left,
      targetPosition: Position.Left,
      style: {
        borderRadius: 22,
        border: "1px solid rgba(191, 219, 254, 0.95)",
        background: "rgba(247, 251, 255, 0.98)",
        boxShadow: "0 16px 34px rgba(22, 32, 51, 0.07)",
        padding: 16,
        width: 240,
      },
    } satisfies Node;
  });
}

function createProjectEdges(notes: Note[]) {
  return notes
    .filter((note) => !!note.projectId)
    .map((note) => ({
      id: `project-link:${note.id}:${note.projectId}`,
      source: `note:${note.id}`,
      target: `project:${note.projectId}`,
      animated: false,
      deletable: false,
      selectable: false,
      style: {
        stroke: "#c0cad9",
        strokeWidth: 1.25,
      },
    })) satisfies Edge[];
}

function createTaskEdges(tasks: Task[]) {
  return tasks
    .filter((task) => task.noteId)
    .map((task) => ({
      id: `task-link:${task.id}:${task.noteId}`,
      source: `task:${task.id}`,
      target: `note:${task.noteId}`,
      animated: false,
      deletable: true,
      selectable: true,
      style: {
        stroke: "#6d7e97",
        strokeWidth: 1.5,
      },
    })) satisfies Edge[];
}

function getTaskIdFromNodeId(nodeId: string) {
  return nodeId.startsWith("task:") ? nodeId.slice(5) : null;
}

function getNoteIdFromNodeId(nodeId: string) {
  return nodeId.startsWith("note:") ? nodeId.slice(5) : null;
}

function getProjectIdFromNodeId(nodeId: string) {
  return nodeId.startsWith("project:") ? nodeId.slice(8) : null;
}

export function FlowPage() {
  const notes = useNotesStore((state) => state.notes);
  const notesLoading = useNotesStore((state) => state.isLoading);
  const setNoteProjectLink = useNotesStore((state) => state.setNoteProjectLink);
  const tasks = useTasksStore((state) => state.tasks);
  const tasksLoading = useTasksStore((state) => state.isLoading);
  const statuses = useTasksStore((state) => state.statuses);
  const setTaskNoteLink = useTasksStore((state) => state.setTaskNoteLink);
  const syncTasksProjectForNote = useTasksStore((state) => state.syncTasksProjectForNote);
  const projects = useProjectsStore((state) => state.projects);

  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [timelinePreset, setTimelinePreset] = useState<TimelinePreset>("week");
  const [showTodos, setShowTodos] = useState(true);
  const [projectFilter, setProjectFilter] = useState<string[] | null>(null);
  const [statusFilter, setStatusFilter] = useState<string[] | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const allProjectIds = useMemo(() => projects.map((project) => project.id), [projects]);
  const allStatusIds = useMemo(() => statuses.map((status) => status.id), [statuses]);
  const selectedProjectIds = projectFilter ?? allProjectIds;
  const selectedStatusIds = statusFilter ?? allStatusIds;
  const activeDateRange = useMemo(() => getTimelineRange(timelinePreset, dateFrom, dateTo), [dateFrom, dateTo, timelinePreset]);

  const filteredNotes = useMemo(
    () =>
      notes.filter((note) => {
        const matchesProject = !note.projectId || selectedProjectIds.includes(note.projectId);
        return matchesProject && isWithinDateRange(note.createdAt, activeDateRange.dateFrom, activeDateRange.dateTo);
      }),
    [activeDateRange.dateFrom, activeDateRange.dateTo, notes, selectedProjectIds],
  );

  const visibleNoteIds = useMemo(() => new Set(filteredNotes.map((note) => note.id)), [filteredNotes]);

  const filteredTasks = useMemo(
    () =>
      tasks.filter((task) => {
        if (task.deletedAt || !showTodos) {
          return false;
        }

        const matchesProject = !task.projectId || selectedProjectIds.includes(task.projectId);
        const matchesStatus = selectedStatusIds.includes(task.statusId);
        const matchesLinkedNote = !task.noteId || visibleNoteIds.has(task.noteId);

        return matchesProject && matchesStatus && matchesLinkedNote;
      }),
    [selectedProjectIds, selectedStatusIds, showTodos, tasks, visibleNoteIds],
  );

  const visibleProjectIds = useMemo(
    () =>
      new Set(
        [
          ...filteredNotes.map((note) => note.projectId).filter(Boolean),
          ...filteredTasks.map((task) => task.projectId).filter(Boolean),
        ],
      ),
    [filteredNotes, filteredTasks],
  );

  const filteredProjects = useMemo(
    () => projects.filter((project) => visibleProjectIds.has(project.id)),
    [projects, visibleProjectIds],
  );

  const graphNodes = useMemo(
    () => [
      ...createProjectNodes(filteredProjects),
      ...createNoteNodes({ notes: filteredNotes, projects }),
      ...(showTodos ? createTaskNodes({ tasks: filteredTasks, statuses, projects }) : []),
    ],
    [filteredNotes, filteredProjects, filteredTasks, projects, showTodos, statuses],
  );
  const graphEdges = useMemo(
    () => [
      ...createProjectEdges(filteredNotes),
      ...(showTodos ? createTaskEdges(filteredTasks) : []),
    ],
    [filteredNotes, filteredTasks, showTodos],
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(graphNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(graphEdges);

  const activeFilterCount =
    (timelinePreset !== "week" ? 1 : 0) +
    (projectFilter ? 1 : 0) +
    (statusFilter ? 1 : 0) +
    (showTodos ? 0 : 1);

  const dateRangeLabel =
    timelinePreset === "today"
      ? "Today"
      : timelinePreset === "week"
        ? "Last 7 days"
        : timelinePreset === "month"
          ? "Last month"
          : `${activeDateRange.dateFrom || "Any start"} -> ${activeDateRange.dateTo || "Any end"}`;

  useEffect(() => {
    setNodes(graphNodes);
  }, [graphNodes, setNodes]);

  useEffect(() => {
    setEdges(graphEdges);
  }, [graphEdges, setEdges]);

  const isLoading = notesLoading || tasksLoading;

  async function handleConnect(connection: Connection) {
    const taskId = getTaskIdFromNodeId(connection.source ?? "") ?? getTaskIdFromNodeId(connection.target ?? "");
    const noteId = getNoteIdFromNodeId(connection.target ?? "") ?? getNoteIdFromNodeId(connection.source ?? "");
    const projectId = getProjectIdFromNodeId(connection.target ?? "") ?? getProjectIdFromNodeId(connection.source ?? "");

    if (taskId && noteId) {
      await setTaskNoteLink(taskId, noteId);
      setEdges((current) =>
        addEdge(
          {
            id: `task-link:${taskId}:${noteId}`,
            source: `task:${taskId}`,
            target: `note:${noteId}`,
            animated: false,
            deletable: true,
            selectable: true,
            style: {
              stroke: "#6d7e97",
              strokeWidth: 1.5,
            },
          },
          current.filter((edge) => !edge.id.startsWith("task-link:") || edge.source !== `task:${taskId}`),
        ),
      );
      return;
    }

    if (noteId && projectId) {
      await setNoteProjectLink(noteId, projectId);
      await syncTasksProjectForNote(noteId, projectId);
      setEdges((current) =>
        addEdge(
          {
            id: `project-link:${noteId}:${projectId}`,
            source: `note:${noteId}`,
            target: `project:${projectId}`,
            animated: false,
            deletable: false,
            selectable: false,
            style: {
              stroke: "#c0cad9",
              strokeWidth: 1.25,
            },
          },
          current.filter((edge) => !edge.id.startsWith("project-link:") || edge.source !== `note:${noteId}`),
        ),
      );
    }
  }

  async function handleEdgesDelete(deletedEdges: Edge[]) {
    await Promise.all(
      deletedEdges.map(async (edge) => {
        const taskId = getTaskIdFromNodeId(edge.source);
        if (!taskId) {
          return;
        }

        await setTaskNoteLink(taskId, null);
      }),
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-6 overflow-hidden">
      <Card className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[32px]">
        <CardHeader className="gap-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <CardDescription>Flow workspace</CardDescription>
              <CardTitle className="text-3xl">Map projects, notes, and to-dos visually</CardTitle>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex rounded-full border border-border bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                {dateRangeLabel}
              </div>
              <div className="inline-flex rounded-full bg-amber-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">
                {filteredProjects.length} projects
              </div>
              <div className="inline-flex rounded-full bg-secondary px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                {filteredNotes.length} notes
              </div>
              <div className="inline-flex rounded-full bg-sky-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">
                {showTodos ? filteredTasks.length : 0} to-dos
              </div>
              <Button type="button" variant="outline" className="rounded-2xl" onClick={() => setFiltersOpen(true)}>
                <Settings2 className="h-4 w-4" />
                Filters {activeFilterCount ? `(${activeFilterCount})` : ""}
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="min-h-0 flex-1 p-0">
          <div className="relative h-full min-h-[560px] bg-[radial-gradient(circle_at_top,rgba(22,99,199,0.07),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.98),rgba(245,248,252,0.96))]">
            {isLoading ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                Loading projects, notes, and to-dos...
              </div>
            ) : null}
            {!isLoading && !nodes.length ? (
              <div className="absolute inset-0 z-10 flex items-center justify-center px-6 text-center">
                <div className="rounded-[28px] border border-dashed border-border bg-white/80 px-8 py-10 shadow-soft">
                  <h2 className="text-lg font-semibold">Nothing matches these filters</h2>
                  <p className="mt-2 max-w-md text-sm leading-7 text-muted-foreground">
                    Expand the timeline, re-enable more projects or task statuses, or show to-dos again to bring items back into view.
                  </p>
                </div>
              </div>
            ) : null}
            {!isLoading && nodes.length ? (
              <div className="absolute right-5 top-5 z-10 rounded-2xl border border-white/80 bg-white/90 px-4 py-3 text-xs leading-6 text-muted-foreground shadow-soft backdrop-blur">
                Drag nodes to organize them.
                <br />
                Connect a note to a project to change its project.
                <br />
                Connect a to-do to a note to link it.
                <br />
                Select a task edge and press Delete to unlink it.
              </div>
            ) : null}
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={(connection) => {
                void handleConnect(connection);
              }}
              onEdgesDelete={(deletedEdges) => {
                void handleEdgesDelete(deletedEdges);
              }}
              panOnDrag
              zoomOnScroll
              zoomOnPinch
              zoomOnDoubleClick
              fitView={nodes.length > 0}
              fitViewOptions={{ padding: 0.18 }}
              nodesConnectable
              proOptions={{ hideAttribution: true }}
              deleteKeyCode={["Backspace", "Delete"]}
            >
              <Background gap={20} size={1} color="#dbe4ef" />
              <Controls showInteractive={false} />
            </ReactFlow>
          </div>
        </CardContent>
      </Card>

      <Dialog open={filtersOpen} onOpenChange={setFiltersOpen}>
        <DialogContent className="left-auto right-0 top-0 h-dvh max-h-dvh overflow-y-auto translate-x-0 translate-y-0 rounded-none border-y-0 border-r-0 border-l border-white/80 p-0 sm:max-w-[460px]">
          <div className="flex h-full flex-col bg-white/96">
            <DialogHeader className="border-b border-border/70 px-6 py-5">
              <DialogTitle className="text-2xl">Flow filters</DialogTitle>
              <DialogDescription>
                Narrow the workspace without crowding the canvas. Adjust the timeline, visible projects, and task visibility here.
              </DialogDescription>
            </DialogHeader>

            <div className="flex-1 space-y-6 px-6 py-6">
              <section className="grid gap-4 rounded-[24px] border border-border bg-secondary/25 p-4">
                <div>
                  <p className="text-sm font-semibold text-foreground">Timeline</p>
                  <p className="mt-1 text-xs leading-6 text-muted-foreground">
                    Show only notes created inside this date range.
                  </p>
                </div>
                <label className="grid gap-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Range</span>
                  <Select value={timelinePreset} onChange={(event) => setTimelinePreset(event.target.value as TimelinePreset)}>
                    <option value="today">Today</option>
                    <option value="week">Week</option>
                    <option value="month">Month</option>
                    <option value="custom">Custom</option>
                  </Select>
                </label>
                {timelinePreset === "custom" ? (
                  <>
                    <label className="grid gap-2">
                      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">From</span>
                      <Input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} />
                    </label>
                    <label className="grid gap-2">
                      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">To</span>
                      <Input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} />
                    </label>
                  </>
                ) : null}
              </section>

              <section className="grid gap-4 rounded-[24px] border border-border bg-white p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">Projects</p>
                    <p className="mt-1 text-xs leading-6 text-muted-foreground">
                      Include only the projects you want to see in the graph.
                    </p>
                  </div>
                  <button type="button" className="text-xs font-semibold text-primary" onClick={() => setProjectFilter(null)}>
                    Select all
                  </button>
                </div>
                <div className="flex flex-wrap gap-3">
                  {projects.map((project) => {
                    const checked = selectedProjectIds.includes(project.id);
                    return (
                      <label key={project.id} className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary/35 px-3 py-2 text-sm text-foreground">
                        <Checkbox
                          checked={checked}
                          onChange={() => setProjectFilter((current) => toggleSelection(current, project.id, allProjectIds))}
                        />
                        <span>{project.name}</span>
                      </label>
                    );
                  })}
                </div>
              </section>

              <section className="grid gap-4 rounded-[24px] border border-border bg-white p-4">
                <div className="flex items-center justify-between gap-4 rounded-[20px] border border-border bg-secondary/25 px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">Show to-dos</p>
                    <p className="mt-1 text-xs leading-6 text-muted-foreground">
                      Hide task nodes and links if you only want project and note relationships.
                    </p>
                  </div>
                  <Switch checked={showTodos} onCheckedChange={setShowTodos} />
                </div>

                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">Task statuses</p>
                    <p className="mt-1 text-xs leading-6 text-muted-foreground">
                      Filter which task columns appear in the graph.
                    </p>
                  </div>
                  <button type="button" className="text-xs font-semibold text-primary" onClick={() => setStatusFilter(null)}>
                    Select all
                  </button>
                </div>

                <div className="flex flex-wrap gap-3">
                  {statuses.map((status) => {
                    const checked = selectedStatusIds.includes(status.id);
                    return (
                      <label key={status.id} className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary/35 px-3 py-2 text-sm text-foreground">
                        <Checkbox
                          checked={checked}
                          onChange={() => setStatusFilter((current) => toggleSelection(current, status.id, allStatusIds))}
                          disabled={!showTodos}
                        />
                        <span>{status.label}</span>
                      </label>
                    );
                  })}
                </div>
              </section>
            </div>

            <div className="flex items-center justify-between gap-3 border-t border-border/70 px-6 py-4">
              <button
                type="button"
                className="text-sm font-semibold text-muted-foreground"
                onClick={() => {
                  setTimelinePreset("week");
                  setDateFrom("");
                  setDateTo("");
                  setProjectFilter(null);
                  setStatusFilter(null);
                  setShowTodos(true);
                }}
              >
                Reset filters
              </button>
              <Button type="button" className="rounded-2xl" onClick={() => setFiltersOpen(false)}>
                Apply and close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
