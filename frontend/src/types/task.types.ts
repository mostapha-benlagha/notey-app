export type TaskStatusId = string;

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
  noteId: string;
  deletedAt: string | null;
}
