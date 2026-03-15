import "@xyflow/react/dist/style.css";
import { useEffect, useMemo } from "react";
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNotesStore } from "@/store/useNotesStore";
import { useProjectsStore } from "@/store/useProjectsStore";
import { useTasksStore } from "@/store/useTasksStore";
import type { Note } from "@/types/note.types";
import type { Project } from "@/types/project.types";
import type { Task, TaskStatus } from "@/types/task.types";

function truncate(value: string, maxLength: number) {
  return value.length <= maxLength ? value : `${value.slice(0, maxLength - 1)}...`;
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
                {project?.name ?? note.projectId}
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
                {project?.name ?? task.projectId}
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
  return notes.map((note) => ({
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

  const activeTasks = useMemo(() => tasks.filter((task) => !task.deletedAt), [tasks]);
  const graphNodes = useMemo(
    () => [
      ...createProjectNodes(projects),
      ...createNoteNodes({ notes, projects }),
      ...createTaskNodes({ tasks: activeTasks, statuses, projects }),
    ],
    [activeTasks, notes, projects, statuses],
  );
  const graphEdges = useMemo(
    () => [...createProjectEdges(notes), ...createTaskEdges(activeTasks)],
    [activeTasks, notes],
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(graphNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(graphEdges);

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
        <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <CardDescription>Flow workspace</CardDescription>
            <CardTitle className="text-3xl">Map projects, notes, and to-dos visually</CardTitle>
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="inline-flex rounded-full bg-amber-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">
              {projects.length} projects
            </div>
            <div className="inline-flex rounded-full bg-secondary px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              {notes.length} notes
            </div>
            <div className="inline-flex rounded-full bg-sky-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">
              {activeTasks.length} to-dos
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
                  <h2 className="text-lg font-semibold">Nothing on the canvas yet</h2>
                  <p className="mt-2 max-w-md text-sm leading-7 text-muted-foreground">
                    Projects, notes, and to-dos will appear here together. Connect notes to other projects to move them there, and connect to-dos to notes to link them.
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
    </div>
  );
}
