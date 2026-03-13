import type { Note } from "@/types/note.types";
import type { Project } from "@/types/project.types";
import type { Task, TaskStatus } from "@/types/task.types";

export const mockProjects: Project[] = [
  {
    id: "personal",
    name: "Personal",
    description: "Life admin, journaling, and side quests.",
    color: "bg-emerald-500",
  },
  {
    id: "work",
    name: "Work",
    description: "Meetings, deliverables, and team coordination.",
    color: "bg-sky-500",
  },
  {
    id: "startup",
    name: "Startup",
    description: "Product bets, experiments, and go-to-market notes.",
    color: "bg-amber-500",
  },
  {
    id: "research",
    name: "Research",
    description: "Reading queue, hypotheses, and technical exploration.",
    color: "bg-fuchsia-500",
  },
];

export const mockNotes: Note[] = [
  {
    id: "note1",
    content: "Prepare slides for security meeting. Send final agenda to the ops team before Friday.",
    richContent:
      "<p>Prepare slides for security meeting.</p><p>Send final agenda to the ops team before Friday.</p>",
    projectId: "work",
    tags: ["meeting", "security", "task"],
    createdAt: "2026-03-11T10:00:00.000Z",
    attachments: [{ id: "attachment1", name: "threat-model.png", kind: "image", sizeLabel: "1.2 MB" }],
  },
  {
    id: "note2",
    content: "Prototype onboarding flow for beta launch and review activation metrics with the startup advisor.",
    richContent:
      "<p>Prototype onboarding flow for beta launch and review activation metrics with the startup advisor.</p>",
    projectId: "startup",
    tags: ["product", "research", "task"],
    createdAt: "2026-03-11T12:30:00.000Z",
    attachments: [{ id: "attachment2", name: "activation-brief.pdf", kind: "file", sizeLabel: "340 KB" }],
  },
  {
    id: "note3",
    content: "Research local-first sync patterns and compare CRDT tradeoffs for note collaboration.",
    richContent:
      "<p>Research local-first sync patterns and compare CRDT tradeoffs for note collaboration.</p>",
    projectId: "research",
    tags: ["research", "insight"],
    createdAt: "2026-03-11T15:45:00.000Z",
    attachments: [],
  },
];

export const mockTasks: Task[] = [
  {
    id: "task1",
    title: "Prepare slides for security meeting",
    statusId: "draft",
    projectId: "work",
    noteId: "note1",
    deletedAt: null,
  },
  {
    id: "task2",
    title: "Send final agenda to the ops team before Friday",
    statusId: "in-progress",
    projectId: "work",
    noteId: "note1",
    deletedAt: null,
  },
  {
    id: "task3",
    title: "Prototype onboarding flow for beta launch",
    statusId: "done",
    projectId: "startup",
    noteId: "note2",
    deletedAt: null,
  },
];

export const mockTaskStatuses: TaskStatus[] = [
  { id: "draft", label: "Draft", colorClass: "bg-slate-200 text-slate-700", kind: "system" },
  { id: "todo", label: "To-do", colorClass: "bg-sky-100 text-sky-700", kind: "system" },
  { id: "in-progress", label: "In progress", colorClass: "bg-amber-100 text-amber-700", kind: "system" },
  { id: "done", label: "Done", colorClass: "bg-emerald-100 text-emerald-700", kind: "system" },
];
