import { getStoredToken } from "@/services/api";
import { noteSchema } from "@/schemas/note.schema";
import { taskSchema } from "@/schemas/task.schema";
import type { Note } from "@/types/note.types";
import type { Task } from "@/types/task.types";

interface AnalysisUpdatedMessage {
  type: "analysis.updated";
  note: Note;
  tasks: Task[];
}

interface RealtimeConnectedMessage {
  type: "realtime.connected";
}

type RealtimeMessage = AnalysisUpdatedMessage | RealtimeConnectedMessage;

function getRealtimeUrl() {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL as string | undefined;
  const token = getStoredToken();
  if (!apiBaseUrl || !token) {
    return null;
  }

  const url = new URL(apiBaseUrl);
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  url.pathname = "/ws";
  url.search = "";
  url.searchParams.set("token", token);
  return url.toString();
}

function parseRealtimeMessage(raw: string): RealtimeMessage | null {
  const parsed = JSON.parse(raw) as { type?: unknown; note?: unknown; tasks?: unknown };

  if (parsed.type === "realtime.connected") {
    return { type: "realtime.connected" };
  }

  if (parsed.type === "analysis.updated") {
    return {
      type: "analysis.updated",
      note: noteSchema.parse(parsed.note),
      tasks: Array.isArray(parsed.tasks) ? parsed.tasks.map((task) => taskSchema.parse(task)) : [],
    };
  }

  return null;
}

export function connectRealtime(input: {
  onAnalysisUpdated: (payload: { note: Note; tasks: Task[] }) => void;
}) {
  const url = getRealtimeUrl();
  if (!url || typeof window === "undefined") {
    return () => undefined;
  }

  let socket: WebSocket | null = null;
  let reconnectTimer: number | null = null;
  let closedManually = false;

  const connect = () => {
    socket = new window.WebSocket(url);

    socket.addEventListener("message", (event) => {
      if (typeof event.data !== "string") {
        return;
      }

      try {
        const message = parseRealtimeMessage(event.data);
        if (!message || message.type !== "analysis.updated") {
          return;
        }

        input.onAnalysisUpdated({
          note: message.note,
          tasks: message.tasks,
        });
      } catch (error) {
        console.warn("Failed to parse realtime message", error);
      }
    });

    socket.addEventListener("close", () => {
      if (closedManually) {
        return;
      }

      reconnectTimer = window.setTimeout(() => {
        connect();
      }, 2000);
    });
  };

  connect();

  return () => {
    closedManually = true;
    if (reconnectTimer) {
      window.clearTimeout(reconnectTimer);
    }
    socket?.close();
  };
}
