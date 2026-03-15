export const TASK_BOARD_VIEWS = [
  { label: "Kanban", value: "kanban" },
  { label: "List", value: "list" },
] as const;

export type TaskBoardView = (typeof TASK_BOARD_VIEWS)[number]["value"];
