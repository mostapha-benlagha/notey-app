export type TaskStatusId = string;
export type TaskSource = "manual" | "note_ai";

export interface TaskStatus {
  id: TaskStatusId;
  label: string;
  colorClass: string;
  kind: "system" | "custom";
}

export interface Task {
  id: string;
  title: string;
  description: string;
  statusId: TaskStatusId;
  projectId: string;
  noteId: string | null;
  evidenceNoteIds: string[];
  source: TaskSource;
  tags: string[];
  order: number;
  deletedAt: string | null;
}
