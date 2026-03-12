import { Outlet } from "react-router-dom";
import { Sidebar } from "@/components/layout/Sidebar";

export function MainLayout() {
  return (
    <div className="h-screen overflow-hidden p-4 md:p-6">
      <div className="mx-auto grid h-full max-w-[1600px] gap-6 lg:grid-cols-[340px_minmax(0,1fr)]">
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
