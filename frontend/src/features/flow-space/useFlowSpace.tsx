import { useEffect, useMemo, useRef, useState } from "react";
import {
  addEdge,
  type Connection,
  type Edge,
  type Node,
  Position,
  useEdgesState,
  useNodesState,
} from "@xyflow/react";
import { TagChip } from "@/components/ui/tag-chip";
import type { Note } from "@/types/note.types";
import type { Project } from "@/types/project.types";
import type { Task, TaskStatus } from "@/types/task.types";
import { FLOW_NODE_POSITIONS_STORAGE_KEY, type StoredNodePositions, type TimelinePreset } from "@/features/flow-space/constants";
import { useNotesStore } from "@/store/useNotesStore";
import { useProjectsStore } from "@/store/useProjectsStore";
import { useTasksStore } from "@/store/useTasksStore";

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

function readStoredNodePositions(): StoredNodePositions {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const raw = window.localStorage.getItem(FLOW_NODE_POSITIONS_STORAGE_KEY);
    if (!raw) {
      return {};
    }

    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") {
      return {};
    }

    return Object.fromEntries(
      Object.entries(parsed).filter((entry): entry is [string, { x: number; y: number }] => {
        const [, value] = entry;
        return !!value && typeof value === "object" && typeof value.x === "number" && typeof value.y === "number";
      }),
    );
  } catch {
    return {};
  }
}

function writeStoredNodePositions(positions: StoredNodePositions) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(FLOW_NODE_POSITIONS_STORAGE_KEY, JSON.stringify(positions));
}

function applyStoredPositions(nodes: Node[], storedPositions: StoredNodePositions) {
  return nodes.map((node) => {
    const savedPosition = storedPositions[node.id];
    return savedPosition ? { ...node, position: savedPosition } : node;
  });
}

function createProjectNodes(projects: Project[]) {
  return projects.map((project, index) => ({
    id: `project:${project.id}`,
    type: "default",
    position: { x: 70, y: 90 + index * 170 },
    data: {
      label: (
        <div className="w-[220px]">
          <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Project</span>
          <p className="mt-3 text-base font-semibold text-foreground">{project.name}</p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{truncate(project.description, 90)}</p>
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

function createNoteNodes(input: { notes: Note[]; projects: Project[] }) {
  return input.notes.map((note, index) => {
    const column = index % 2;
    const row = Math.floor(index / 2);
    const project = input.projects.find((item) => item.id === note.projectId);

    return {
      id: `note:${note.id}`,
      type: "default",
      position: { x: 430 + column * 340, y: 80 + row * 230 },
      data: {
        label: (
          <div className="w-[220px]">
            <div className="flex items-center justify-between gap-3">
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                {(project?.name ?? note.projectId) || "No project"}
              </span>
              <span className="text-[11px] text-muted-foreground">{new Date(note.createdAt).toLocaleDateString()}</span>
            </div>
            <p className="mt-3 text-sm font-semibold leading-6 text-foreground">{truncate(note.content, 140)}</p>
            {note.tags.length ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {note.tags.slice(0, 3).map((tag) => (
                  <TagChip key={tag} tag={tag} className="rounded-full bg-secondary px-2.5 py-1 text-[11px] font-medium text-secondary-foreground" />
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

function createTaskNodes(input: { tasks: Task[]; statuses: TaskStatus[]; projects: Project[] }) {
  return input.tasks.map((task, index) => {
    const column = index % 2;
    const row = Math.floor(index / 2);
    const status = input.statuses.find((item) => item.id === task.statusId);
    const project = input.projects.find((item) => item.id === task.projectId);

    return {
      id: `task:${task.id}`,
      type: "default",
      position: { x: 1170 + column * 290, y: 100 + row * 190 },
      data: {
        label: (
          <div className="w-[200px]">
            <div className="flex items-center justify-between gap-3">
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-700">To-do</span>
              <span className="text-[11px] text-muted-foreground">{(project?.name ?? task.projectId) || "No project"}</span>
            </div>
            <p className="mt-3 text-sm font-semibold leading-6 text-foreground">{truncate(task.title, 100)}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="rounded-full bg-sky-50 px-2.5 py-1 text-[11px] font-medium text-sky-700">{status?.label ?? task.statusId}</span>
              {task.noteId ? (
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700">linked</span>
              ) : (
                <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-medium text-amber-700">unlinked</span>
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
      style: { stroke: "#c0cad9", strokeWidth: 1.25 },
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
      style: { stroke: "#6d7e97", strokeWidth: 1.5 },
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

export function useFlowSpace() {
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
  const storedPositionsRef = useRef<StoredNodePositions>(readStoredNodePositions());

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
      new Set([...filteredNotes.map((note) => note.projectId).filter(Boolean), ...filteredTasks.map((task) => task.projectId).filter(Boolean)]),
    [filteredNotes, filteredTasks],
  );
  const filteredProjects = useMemo(() => projects.filter((project) => visibleProjectIds.has(project.id)), [projects, visibleProjectIds]);

  const graphNodes = useMemo(
    () => [...createProjectNodes(filteredProjects), ...createNoteNodes({ notes: filteredNotes, projects }), ...(showTodos ? createTaskNodes({ tasks: filteredTasks, statuses, projects }) : [])],
    [filteredNotes, filteredProjects, filteredTasks, projects, showTodos, statuses],
  );
  const graphEdges = useMemo(() => [...createProjectEdges(filteredNotes), ...(showTodos ? createTaskEdges(filteredTasks) : [])], [filteredNotes, filteredTasks, showTodos]);

  const [nodes, setNodes, onNodesChange] = useNodesState(applyStoredPositions(graphNodes, storedPositionsRef.current));
  const [edges, setEdges, onEdgesChange] = useEdgesState(graphEdges);

  const activeFilterCount = (timelinePreset !== "week" ? 1 : 0) + (projectFilter ? 1 : 0) + (statusFilter ? 1 : 0) + (showTodos ? 0 : 1);
  const dateRangeLabel =
    timelinePreset === "today"
      ? "Today"
      : timelinePreset === "week"
        ? "Last 7 days"
        : timelinePreset === "month"
          ? "Last month"
          : `${activeDateRange.dateFrom || "Any start"} -> ${activeDateRange.dateTo || "Any end"}`;

  useEffect(() => {
    setNodes((currentNodes) => {
      const currentPositions = Object.fromEntries(currentNodes.map((node) => [node.id, node.position]));
      const mergedPositions = { ...storedPositionsRef.current, ...currentPositions };
      return applyStoredPositions(graphNodes, mergedPositions);
    });
  }, [graphNodes, setNodes]);

  useEffect(() => {
    setEdges(graphEdges);
  }, [graphEdges, setEdges]);

  useEffect(() => {
    const nextStoredPositions = { ...storedPositionsRef.current, ...Object.fromEntries(nodes.map((node) => [node.id, node.position])) };
    storedPositionsRef.current = nextStoredPositions;
    writeStoredNodePositions(nextStoredPositions);
  }, [nodes]);

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
            style: { stroke: "#6d7e97", strokeWidth: 1.5 },
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
            style: { stroke: "#c0cad9", strokeWidth: 1.25 },
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

  function resetFilters() {
    setTimelinePreset("week");
    setDateFrom("");
    setDateTo("");
    setProjectFilter(null);
    setStatusFilter(null);
    setShowTodos(true);
  }

  return {
    activeFilterCount,
    allProjectIds,
    allStatusIds,
    dateFrom,
    dateRangeLabel,
    dateTo,
    edges,
    filteredNotes,
    filteredProjects,
    filteredTasks,
    filtersOpen,
    handleConnect,
    handleEdgesDelete,
    isLoading,
    nodes,
    onEdgesChange,
    onNodesChange,
    projects,
    resetFilters,
    selectedProjectIds,
    selectedStatusIds,
    setDateFrom,
    setDateTo,
    setFiltersOpen,
    setProjectFilter,
    setShowTodos,
    setStatusFilter,
    setTimelinePreset,
    showTodos,
    statusFilter,
    statuses,
    timelinePreset,
    toggleSelection,
  };
}
