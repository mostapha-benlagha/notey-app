import type { Task } from "@/types/task.types";

export interface ExportPageItem {
  kind: "paragraph" | "todo-heading" | "todo";
  text?: string;
  task?: Task;
  taskStatusLabel?: string;
}

export interface ExportPageData {
  items: ExportPageItem[];
  showHeader: boolean;
}

export const EXPORT_PAGE_CHARS_PER_LINE = 78;
export const EXPORT_PAGE_MAX_CHARS_PER_CHUNK = 420;
export const PREVIEW_FIRST_PAGE_CAPACITY = 30;
export const PREVIEW_FOLLOWING_PAGE_CAPACITY = 36;
export const PDF_FIRST_PAGE_CAPACITY = 38;
export const PDF_FOLLOWING_PAGE_CAPACITY = 46;
