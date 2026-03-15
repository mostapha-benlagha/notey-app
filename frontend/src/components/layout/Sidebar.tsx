import {
  LogOut,
  Maximize2,
  Minimize2,
  MessageSquare,
  Settings2,
  SquareCheckBig,
  UserCircle2,
} from "lucide-react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { NoteyLogoMark } from "@/components/brand/NoteyLogo";
import { ProjectList } from "@/components/projects/ProjectList";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useProjects } from "@/hooks/useProjects";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/useAuthStore";
import { useSettingsStore } from "@/store/useSettingsStore";

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    "flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium transition hover:bg-white/70",
    isActive && "bg-white text-foreground shadow-soft",
  );

export function Sidebar() {
  const navigate = useNavigate();
  const { projects, selectedProjectId, selectProject } = useProjects();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const fullWidthWorkspaceEnabled = useSettingsStore(
    (state) => state.fullWidthWorkspaceEnabled,
  );
  const setBooleanSetting = useSettingsStore(
    (state) => state.setBooleanSetting,
  );

  return (
    <Card className="surface-grid flex h-full flex-col rounded-[32px] p-5">
      <div className="flex items-start justify-between gap-3 px-2">
        <Link to="/app" className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl bg-primary">
            <NoteyLogoMark className="h-9 w-9" aria-hidden />
          </div>
          <div>
            <p className="text-lg font-extrabold">Notey</p>
            <p className="text-sm text-muted-foreground">AI note assistant</p>
          </div>
        </Link>
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 rounded-2xl"
          onClick={() =>
            setBooleanSetting(
              "fullWidthWorkspaceEnabled",
              !fullWidthWorkspaceEnabled,
            )
          }
          aria-label={
            fullWidthWorkspaceEnabled
              ? "Restore centered layout"
              : "Expand to full width"
          }
          title={
            fullWidthWorkspaceEnabled
              ? "Restore centered layout"
              : "Expand to full width"
          }
        >
          {fullWidthWorkspaceEnabled ? (
            <Minimize2 className="h-4 w-4" />
          ) : (
            <Maximize2 className="h-4 w-4" />
          )}
        </Button>
      </div>
      <nav className="mt-8 space-y-1">
        <NavLink to="/app" end className={navLinkClass}>
          <MessageSquare className="h-4 w-4" />
          Chat
        </NavLink>
        <NavLink to="/app/tasks" className={navLinkClass}>
          <SquareCheckBig className="h-4 w-4" />
          Tasks
        </NavLink>
        <NavLink to="/app/settings" className={navLinkClass}>
          <Settings2 className="h-4 w-4" />
          Settings
        </NavLink>
        <NavLink to="/app/account" className={navLinkClass}>
          <UserCircle2 className="h-4 w-4" />
          Account
        </NavLink>
      </nav>
      <Separator className="my-6" />
      <div className="flex-1">
        <div className="mb-3 px-2">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Projects
          </p>
        </div>
        <ProjectList
          projects={projects}
          selectedProjectId={selectedProjectId}
          onSelect={selectProject}
        />
      </div>
      {user ? (
        <>
          <Separator className="my-6" />
          <div className="rounded-[28px] border border-white/80 bg-white/82 p-4 shadow-soft">
            <div className="flex items-center gap-3">
              <Avatar
                label={`${user.firstName} ${user.lastName}`}
                className="h-12 w-12 rounded-[18px]"
              />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">
                  {user.firstName} {user.lastName}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {user.email}
                </p>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <Button
                asChild
                variant="secondary"
                size="sm"
                className="flex-1 rounded-2xl"
              >
                <Link to="/app/account">Profile</Link>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="rounded-2xl"
                onClick={() => {
                  logout();
                  navigate("/", { replace: true });
                }}
              >
                <LogOut className="h-4 w-4" />
                Log out
              </Button>
            </div>
          </div>
        </>
      ) : null}
    </Card>
  );
}
