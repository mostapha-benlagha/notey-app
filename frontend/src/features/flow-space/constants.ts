export type TimelinePreset = "today" | "week" | "month" | "custom";
export type StoredNodePositions = Record<string, { x: number; y: number }>;

export const FLOW_NODE_POSITIONS_STORAGE_KEY = "notey-flow-node-positions";
export const FLOW_MANUAL_TAGS_STORAGE_KEY = "notey-flow-manual-tags";
