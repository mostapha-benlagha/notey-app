import { create } from "zustand";
import { persist } from "zustand/middleware";

export type DigestCadence = "off" | "daily" | "weekly";
export type DefaultNoteMode = "chat" | "full";
export type AppStartPage = "chat" | "tasks" | "account";

interface SettingsState {
  twoFactorEnabled: boolean;
  loginAlertsEnabled: boolean;
  sessionLockEnabled: boolean;
  aiTaggingEnabled: boolean;
  taskExtractionEnabled: boolean;
  reminderEmailsEnabled: boolean;
  digestCadence: DigestCadence;
  defaultNoteMode: DefaultNoteMode;
  appStartPage: AppStartPage;
  compactBoardEnabled: boolean;
  autoOpenLastProject: boolean;
  setBooleanSetting: (
    key:
      | "twoFactorEnabled"
      | "loginAlertsEnabled"
      | "sessionLockEnabled"
      | "aiTaggingEnabled"
      | "taskExtractionEnabled"
      | "reminderEmailsEnabled"
      | "compactBoardEnabled"
      | "autoOpenLastProject",
    value: boolean,
  ) => void;
  setDigestCadence: (value: DigestCadence) => void;
  setDefaultNoteMode: (value: DefaultNoteMode) => void;
  setAppStartPage: (value: AppStartPage) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      twoFactorEnabled: false,
      loginAlertsEnabled: true,
      sessionLockEnabled: true,
      aiTaggingEnabled: true,
      taskExtractionEnabled: true,
      reminderEmailsEnabled: true,
      digestCadence: "weekly",
      defaultNoteMode: "chat",
      appStartPage: "chat",
      compactBoardEnabled: false,
      autoOpenLastProject: true,
      setBooleanSetting: (key, value) =>
        set({
          [key]: value,
        } as Pick<SettingsState, typeof key>),
      setDigestCadence: (value) =>
        set({
          digestCadence: value,
        }),
      setDefaultNoteMode: (value) =>
        set({
          defaultNoteMode: value,
        }),
      setAppStartPage: (value) =>
        set({
          appStartPage: value,
        }),
    }),
    {
      name: "notey-settings",
    },
  ),
);
