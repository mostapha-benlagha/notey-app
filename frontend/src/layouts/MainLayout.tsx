import { useEffect } from "react";
import { NotificationsOverlay } from "@/components/notifications/NotificationsOverlay";
import { Outlet } from "react-router-dom";
import { Sidebar } from "@/components/layout/Sidebar";
import { cn } from "@/lib/utils";
import { connectRealtime } from "@/services/realtime";
import { useAuthStore } from "@/store/useAuthStore";
import { useNotesStore } from "@/store/useNotesStore";
import { useNotificationsStore } from "@/store/useNotificationsStore";
import { useSettingsStore } from "@/store/useSettingsStore";
import { useTasksStore } from "@/store/useTasksStore";

export function MainLayout() {
  const fullWidthWorkspaceEnabled = useSettingsStore((state) => state.fullWidthWorkspaceEnabled);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const notes = useNotesStore((state) => state.notes);
  const initializeNotes = useNotesStore((state) => state.initialize);
  const applyServerNote = useNotesStore((state) => state.applyServerNote);
  const initializeTasks = useTasksStore((state) => state.initialize);
  const applyServerTasks = useTasksStore((state) => state.applyServerTasks);
  const reconcileNotes = useNotificationsStore((state) => state.reconcileNotes);

  useEffect(() => {
    void initializeNotes();
    void initializeTasks();
  }, [initializeNotes, initializeTasks]);

  useEffect(() => {
    reconcileNotes(notes);
  }, [notes, reconcileNotes]);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    return connectRealtime({
      onAnalysisUpdated: ({ note, tasks }) => {
        applyServerNote(note);
        applyServerTasks(tasks);
      },
    });
  }, [applyServerNote, applyServerTasks, isAuthenticated]);

  return (
    <div className="h-screen overflow-hidden p-4 md:p-6">
      <NotificationsOverlay />
      <div
        className={cn(
          "mx-auto grid h-full gap-6 lg:grid-cols-[340px_minmax(0,1fr)]",
          fullWidthWorkspaceEnabled ? "max-w-none" : "max-w-[1600px]",
        )}
      >
        <aside className="h-full min-h-[240px]">
          <Sidebar />
        </aside>
        <main className="min-h-0 min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
