import { Outlet } from "react-router-dom";
import { Sidebar } from "@/components/layout/Sidebar";
import { cn } from "@/lib/utils";
import { useSettingsStore } from "@/store/useSettingsStore";

export function MainLayout() {
  const fullWidthWorkspaceEnabled = useSettingsStore((state) => state.fullWidthWorkspaceEnabled);

  return (
    <div className="h-screen overflow-hidden p-4 md:p-6">
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
