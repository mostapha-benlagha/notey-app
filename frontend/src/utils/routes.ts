import { useSettingsStore, type AppStartPage } from "@/store/useSettingsStore";

const startPageMap: Record<AppStartPage, string> = {
  account: "/app/account",
  chat: "/app",
  tasks: "/app/tasks",
};

export function getDefaultAppRoute() {
  return startPageMap[useSettingsStore.getState().appStartPage ?? "chat"];
}
