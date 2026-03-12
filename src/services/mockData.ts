import type { Note } from "@/types/note.types";
import type { Project } from "@/types/project.types";
import type { Task } from "@/types/task.types";

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
    projectId: "work",
    tags: ["meeting", "security", "task"],
    createdAt: "2026-03-11T10:00:00.000Z",
    attachments: [{ id: "attachment1", name: "threat-model.png", kind: "image", sizeLabel: "1.2 MB" }],
  },
  {
    id: "note2",
    content: "Prototype onboarding flow for beta launch and review activation metrics with the startup advisor.",
    projectId: "startup",
    tags: ["product", "research", "task"],
    createdAt: "2026-03-11T12:30:00.000Z",
    attachments: [{ id: "attachment2", name: "activation-brief.pdf", kind: "file", sizeLabel: "340 KB" }],
  },
  {
    id: "note3",
    content: "Research local-first sync patterns and compare CRDT tradeoffs for note collaboration.",
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
    status: "pending",
    projectId: "work",
    noteId: "note1",
  },
  {
    id: "task2",
    title: "Send final agenda to the ops team before Friday",
    status: "completed",
    projectId: "work",
    noteId: "note1",
  },
  {
    id: "task3",
    title: "Prototype onboarding flow for beta launch",
    status: "pending",
    projectId: "startup",
    noteId: "note2",
  },
];
