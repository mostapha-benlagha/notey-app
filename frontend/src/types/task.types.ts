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
  statusId: TaskStatusId;
  projectId: string;
  noteId: string | null;
  source: TaskSource;
  deletedAt: string | null;
}
