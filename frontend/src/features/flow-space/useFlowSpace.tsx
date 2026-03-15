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
import {
  FLOW_MANUAL_TAGS_STORAGE_KEY,
  FLOW_NODE_POSITIONS_STORAGE_KEY,
  type StoredNodePositions,
  type TimelinePreset,
} from "@/features/flow-space/constants";
import { useNotesStore } from "@/store/useNotesStore";
import { useProjectsStore } from "@/store/useProjectsStore";
import { useTasksStore } from "@/store/useTasksStore";
import type { Note } from "@/types/note.types";
import type { Project } from "@/types/project.types";
import type { Task, TaskStatus } from "@/types/task.types";

interface FlowTag {
  id: string;
  label: string;
  noteCount: number;
  taskCount: number;
  isManualOnly: boolean;
}

function truncate(value: string, maxLength: number) {
  return value.length <= maxLength ? value : `${value.slice(0, maxLength - 1)}...`;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

function normalizeTagValue(value: string) {
  return slugify(value);
}

function titleCase(value: string) {
  return value
    .split(/[-\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function uniqueStrings(values: string[]) {
  return [...new Set(values.filter(Boolean))];
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

function readStoredManualTags() {
  if (typeof window === "undefined") {
    return [] as string[];
  }

  try {
    const raw = window.localStorage.getItem(FLOW_MANUAL_TAGS_STORAGE_KEY);
    if (!raw) {
      return [] as string[];
    }

    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [] as string[];
    }

    return uniqueStrings(parsed.filter((value): value is string => typeof value === "string").map(normalizeTagValue));
  } catch {
    return [] as string[];
  }
}

function writeStoredManualTags(tags: string[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(FLOW_MANUAL_TAGS_STORAGE_KEY, JSON.stringify(tags));
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

function createTagNodes(input: { tags: FlowTag[]; showTodos: boolean }) {
  const startX = input.showTodos ? 1510 : 1170;

  return input.tags.map((tag, index) => {
    const column = index % 2;
    const row = Math.floor(index / 2);

    return {
      id: `tag:${tag.id}`,
      type: "default",
      position: { x: startX + column * 240, y: 90 + row * 130 },
      data: {
        label: (
          <div className="w-[180px]">
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700">Tag</span>
            <div className="mt-3">
              <TagChip tag={tag.label} className="rounded-full bg-emerald-50 px-3 py-1.5 text-[12px] font-medium text-emerald-800" />
            </div>
            <p className="mt-3 text-xs leading-6 text-muted-foreground">
              {tag.noteCount} note{tag.noteCount === 1 ? "" : "s"} • {tag.taskCount} to-do{tag.taskCount === 1 ? "" : "s"}
              {tag.isManualOnly ? " • ready to link" : ""}
            </p>
          </div>
        ),
      },
      draggable: true,
      selectable: true,
      sourcePosition: Position.Left,
      targetPosition: Position.Left,
      style: {
        borderRadius: 22,
        border: "1px solid rgba(167, 243, 208, 0.95)",
        background: "rgba(244, 253, 248, 0.98)",
        boxShadow: "0 14px 32px rgba(16, 185, 129, 0.08)",
        padding: 16,
        width: 220,
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

function createTagEdges(input: { notes: Note[]; tasks: Task[]; tags: FlowTag[]; showTodos: boolean }) {
  const visibleTagIds = new Set(input.tags.map((tag) => tag.id));
  const noteEdges = input.notes.flatMap((note) =>
    note.tags
      .map(normalizeTagValue)
      .filter((tagId) => visibleTagIds.has(tagId))
      .map((tagId) => ({
        id: `note-tag:${note.id}:${tagId}`,
        source: `note:${note.id}`,
        target: `tag:${tagId}`,
        animated: false,
        deletable: true,
        selectable: true,
        style: { stroke: "#34d399", strokeWidth: 1.35 },
      })),
  );

  if (!input.showTodos) {
    return noteEdges satisfies Edge[];
  }

  const taskEdges = input.tasks.flatMap((task) =>
    task.tags
      .map(normalizeTagValue)
      .filter((tagId) => visibleTagIds.has(tagId))
      .map((tagId) => ({
        id: `task-tag:${task.id}:${tagId}`,
        source: `task:${task.id}`,
        target: `tag:${tagId}`,
        animated: false,
        deletable: true,
        selectable: true,
        style: { stroke: "#10b981", strokeWidth: 1.35 },
      })),
  );

  return [...noteEdges, ...taskEdges] satisfies Edge[];
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

function getTagIdFromNodeId(nodeId: string) {
  return nodeId.startsWith("tag:") ? nodeId.slice(4) : null;
}

function buildTagMap(input: { notes: Note[]; tasks: Task[]; manualTags: string[]; showTodos: boolean }) {
  const tagMap = new Map<string, FlowTag>();

  input.manualTags.forEach((tagLabel) => {
    if (!tagLabel) {
      return;
    }

    tagMap.set(tagLabel, {
      id: tagLabel,
      label: tagLabel,
      noteCount: 0,
      taskCount: 0,
      isManualOnly: true,
    });
  });

  input.notes.forEach((note) => {
    note.tags.forEach((tag) => {
      const normalized = normalizeTagValue(tag);
      if (!normalized) {
        return;
      }

      const existing = tagMap.get(normalized);
      tagMap.set(normalized, {
        id: normalized,
        label: normalized,
        noteCount: (existing?.noteCount ?? 0) + 1,
        taskCount: existing?.taskCount ?? 0,
        isManualOnly: false,
      });
    });
  });

  if (input.showTodos) {
    input.tasks.forEach((task) => {
      task.tags.forEach((tag) => {
        const normalized = normalizeTagValue(tag);
        if (!normalized) {
          return;
        }

        const existing = tagMap.get(normalized);
        tagMap.set(normalized, {
          id: normalized,
          label: normalized,
          noteCount: existing?.noteCount ?? 0,
          taskCount: (existing?.taskCount ?? 0) + 1,
          isManualOnly: false,
        });
      });
    });
  }

  return Array.from(tagMap.values()).sort((left, right) => {
    if (left.isManualOnly !== right.isManualOnly) {
      return left.isManualOnly ? 1 : -1;
    }

    return left.label.localeCompare(right.label);
  });
}

const flowProjectColors = ["bg-sky-500", "bg-emerald-500", "bg-amber-500", "bg-fuchsia-500", "bg-rose-500", "bg-cyan-500"];

export function useFlowSpace() {
  const notes = useNotesStore((state) => state.notes);
  const notesLoading = useNotesStore((state) => state.isLoading);
  const setNoteProjectLink = useNotesStore((state) => state.setNoteProjectLink);
  const updateNoteTags = useNotesStore((state) => state.updateNoteTags);
  const tasks = useTasksStore((state) => state.tasks);
  const tasksLoading = useTasksStore((state) => state.isLoading);
  const statuses = useTasksStore((state) => state.statuses);
  const addTask = useTasksStore((state) => state.addTask);
  const setTaskNoteLink = useTasksStore((state) => state.setTaskNoteLink);
  const syncTasksProjectForNote = useTasksStore((state) => state.syncTasksProjectForNote);
  const updateTaskTags = useTasksStore((state) => state.updateTaskTags);
  const projects = useProjectsStore((state) => state.projects);
  const createProject = useProjectsStore((state) => state.createProject);

  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [timelinePreset, setTimelinePreset] = useState<TimelinePreset>("week");
  const [showTodos, setShowTodos] = useState(true);
  const [showTags, setShowTags] = useState(true);
  const [projectFilter, setProjectFilter] = useState<string[] | null>(null);
  const [statusFilter, setStatusFilter] = useState<string[] | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [createPanelOpen, setCreatePanelOpen] = useState(false);
  const [manualTags, setManualTags] = useState<string[]>(readStoredManualTags());
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

  const filteredProjects = useMemo(
    () => projects.filter((project) => selectedProjectIds.includes(project.id)),
    [projects, selectedProjectIds],
  );

  const filteredTags = useMemo(
    () => (showTags ? buildTagMap({ notes: filteredNotes, tasks: filteredTasks, manualTags, showTodos }) : []),
    [filteredNotes, filteredTasks, manualTags, showTags, showTodos],
  );

  const graphNodes = useMemo(
    () => [
      ...createProjectNodes(filteredProjects),
      ...createNoteNodes({ notes: filteredNotes, projects }),
      ...(showTodos ? createTaskNodes({ tasks: filteredTasks, statuses, projects }) : []),
      ...(showTags ? createTagNodes({ tags: filteredTags, showTodos }) : []),
    ],
    [filteredNotes, filteredProjects, filteredTags, filteredTasks, projects, showTags, showTodos, statuses],
  );

  const graphEdges = useMemo(
    () => [
      ...createProjectEdges(filteredNotes),
      ...(showTodos ? createTaskEdges(filteredTasks) : []),
      ...(showTags ? createTagEdges({ notes: filteredNotes, tasks: filteredTasks, tags: filteredTags, showTodos }) : []),
    ],
    [filteredNotes, filteredTags, filteredTasks, showTags, showTodos],
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(applyStoredPositions(graphNodes, storedPositionsRef.current));
  const [edges, setEdges, onEdgesChange] = useEdgesState(graphEdges);

  const activeFilterCount =
    (timelinePreset !== "week" ? 1 : 0) + (projectFilter ? 1 : 0) + (statusFilter ? 1 : 0) + (showTodos ? 0 : 1) + (showTags ? 0 : 1);
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

  useEffect(() => {
    writeStoredManualTags(manualTags);
  }, [manualTags]);

  const isLoading = notesLoading || tasksLoading;

  async function createProjectNode(input: { name: string; description: string }) {
    const baseId = slugify(input.name);
    if (!baseId) {
      return;
    }

    let nextId = baseId;
    let suffix = 2;
    while (projects.some((project) => project.id === nextId)) {
      nextId = `${baseId}-${suffix}`;
      suffix += 1;
    }

    createProject({
      id: nextId,
      name: input.name.trim(),
      description: input.description.trim() || "Created in the Flow workspace.",
      color: flowProjectColors[projects.length % flowProjectColors.length],
    });
  }

  async function createTaskNode(input: { title: string; description: string; projectId: string; noteId: string | null; statusId: string }) {
    await addTask({
      title: input.title.trim(),
      description: input.description.trim(),
      projectId: input.projectId,
      noteId: input.noteId,
      statusId: input.statusId,
      tags: [],
    });
  }

  function createTagNode(label: string) {
    const normalized = normalizeTagValue(label);
    if (!normalized) {
      return;
    }

    setManualTags((current) => uniqueStrings([...current, normalized]));
  }

  async function handleConnect(connection: Connection) {
    const source = connection.source ?? "";
    const target = connection.target ?? "";
    const taskId = getTaskIdFromNodeId(source) ?? getTaskIdFromNodeId(target);
    const noteId = getNoteIdFromNodeId(target) ?? getNoteIdFromNodeId(source);
    const projectId = getProjectIdFromNodeId(target) ?? getProjectIdFromNodeId(source);
    const tagId = getTagIdFromNodeId(target) ?? getTagIdFromNodeId(source);

    if (taskId && noteId && !tagId) {
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
      return;
    }

    if (tagId && noteId) {
      const note = notes.find((item) => item.id === noteId);
      if (!note) {
        return;
      }

      const nextTags = uniqueStrings([...note.tags.map(normalizeTagValue), tagId]);
      await updateNoteTags(noteId, nextTags);
      setManualTags((current) => uniqueStrings([...current, tagId]));
      return;
    }

    if (tagId && taskId) {
      const task = tasks.find((item) => item.id === taskId);
      if (!task) {
        return;
      }

      const nextTags = uniqueStrings([...task.tags.map(normalizeTagValue), tagId]);
      await updateTaskTags(taskId, nextTags);
      setManualTags((current) => uniqueStrings([...current, tagId]));
    }
  }

  async function handleEdgesDelete(deletedEdges: Edge[]) {
    await Promise.all(
      deletedEdges.map(async (edge) => {
        const taskId = getTaskIdFromNodeId(edge.source) ?? getTaskIdFromNodeId(edge.target);
        const noteId = getNoteIdFromNodeId(edge.source) ?? getNoteIdFromNodeId(edge.target);
        const edgeTagId = getTagIdFromNodeId(edge.source) ?? getTagIdFromNodeId(edge.target);

        if (edge.id.startsWith("task-link:") && taskId) {
          await setTaskNoteLink(taskId, null);
          return;
        }

        if (edgeTagId && noteId) {
          const note = notes.find((item) => item.id === noteId);
          if (!note) {
            return;
          }

          await updateNoteTags(
            noteId,
            note.tags.map(normalizeTagValue).filter((tag) => tag !== edgeTagId),
          );
          return;
        }

        if (edgeTagId && taskId) {
          const task = tasks.find((item) => item.id === taskId);
          if (!task) {
            return;
          }

          await updateTaskTags(
            taskId,
            task.tags.map(normalizeTagValue).filter((tag) => tag !== edgeTagId),
          );
        }
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
    setShowTags(true);
  }

  return {
    activeFilterCount,
    allProjectIds,
    allStatusIds,
    createPanelOpen,
    createProjectNode,
    createTagNode,
    createTaskNode,
    dateFrom,
    dateRangeLabel,
    dateTo,
    edges,
    filteredNotes,
    filteredProjects,
    filteredTags,
    filteredTasks,
    filtersOpen,
    handleConnect,
    handleEdgesDelete,
    isLoading,
    nodes,
    notes,
    onEdgesChange,
    onNodesChange,
    projects,
    resetFilters,
    selectedProjectIds,
    selectedStatusIds,
    setCreatePanelOpen,
    setDateFrom,
    setDateTo,
    setFiltersOpen,
    setProjectFilter,
    setShowTags,
    setShowTodos,
    setStatusFilter,
    setTimelinePreset,
    showTags,
    showTodos,
    statusFilter,
    statuses,
    timelinePreset,
    toggleSelection,
  };
}
