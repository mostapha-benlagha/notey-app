import { create } from "zustand";
import type { Note } from "@/types/note.types";

interface AppNotification {
  id: string;
  noteId: string;
  title: string;
  message: string;
  createdAt: string;
}

interface NotificationsState {
  items: AppNotification[];
  seenAnalysisKeys: string[];
  hasHydrated: boolean;
  reconcileNotes: (notes: Note[]) => void;
  dismiss: (id: string) => void;
  markNoteSeen: (noteId: string) => void;
  clear: () => void;
}

const STORAGE_KEY = "notey-analysis-notifications";

function readStoredSeenAnalysisKeys() {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as { seenAnalysisKeys?: unknown };
    return Array.isArray(parsed.seenAnalysisKeys)
      ? parsed.seenAnalysisKeys.filter((value): value is string => typeof value === "string")
      : [];
  } catch {
    return [];
  }
}

function writeStoredSeenAnalysisKeys(seenAnalysisKeys: string[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ seenAnalysisKeys }));
}

function playCompletionBeep() {
  if (typeof window === "undefined") {
    return;
  }

  const AudioContextCtor = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextCtor) {
    return;
  }

  const context = new AudioContextCtor();
  const oscillator = context.createOscillator();
  const gainNode = context.createGain();

  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(880, context.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(1320, context.currentTime + 0.12);
  gainNode.gain.setValueAtTime(0.001, context.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.08, context.currentTime + 0.02);
  gainNode.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.24);

  oscillator.connect(gainNode);
  gainNode.connect(context.destination);
  oscillator.start();
  oscillator.stop(context.currentTime + 0.26);
  oscillator.onended = () => {
    void context.close();
  };
}

export const useNotificationsStore = create<NotificationsState>((set, get) => ({
  items: [],
  seenAnalysisKeys: readStoredSeenAnalysisKeys(),
  hasHydrated: false,
  reconcileNotes: (notes) => {
    const seen = new Set(get().seenAnalysisKeys);
    if (!get().hasHydrated) {
      notes.forEach((note) => {
        if (note.analysis.lastAnalyzedAt) {
          seen.add(`${note.id}:${note.analysis.lastAnalyzedAt}`);
        }
      });

      set({
        seenAnalysisKeys: Array.from(seen),
        hasHydrated: true,
      });
      writeStoredSeenAnalysisKeys(Array.from(seen));
      return;
    }

    const nextNotifications: AppNotification[] = [];
    const nextSeen = new Set(seen);

    notes.forEach((note) => {
      if (note.analysis.status !== "completed" || !note.analysis.lastAnalyzedAt) {
        return;
      }

      const analysisKey = `${note.id}:${note.analysis.lastAnalyzedAt}`;
      if (seen.has(analysisKey)) {
        return;
      }

      nextSeen.add(analysisKey);
      nextNotifications.push({
        id: analysisKey,
        noteId: note.id,
        title: "Your note finished analyzing",
        message: note.analysis.summary || "Check your note to review the updated tags and to-dos.",
        createdAt: note.analysis.lastAnalyzedAt,
      });
    });

    if (!nextNotifications.length) {
      return;
    }

    playCompletionBeep();
    set((state) => {
      const seenAnalysisKeys = Array.from(nextSeen);
      writeStoredSeenAnalysisKeys(seenAnalysisKeys);
      return {
        items: [...nextNotifications, ...state.items].slice(0, 6),
        seenAnalysisKeys,
      };
    });
  },
  dismiss: (id) =>
    set((state) => ({
      items: state.items.filter((item) => item.id !== id),
    })),
  markNoteSeen: (noteId) =>
    set((state) => {
      const matchedKeys = state.items.filter((item) => item.noteId === noteId).map((item) => item.id);
      const seenAnalysisKeys = Array.from(new Set([...state.seenAnalysisKeys, ...matchedKeys]));
      writeStoredSeenAnalysisKeys(seenAnalysisKeys);
      return {
        items: state.items.filter((item) => item.noteId !== noteId),
        seenAnalysisKeys,
      };
    }),
  clear: () =>
    {
      writeStoredSeenAnalysisKeys([]);
      set({
        items: [],
        seenAnalysisKeys: [],
        hasHydrated: false,
      });
    },
}));
