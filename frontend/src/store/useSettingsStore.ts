import { create } from "zustand";
import { fetchSettings, updateSettings } from "@/services/api";
import type { AppStartPage, DefaultNoteMode, DigestCadence, Settings } from "@/types/settings.types";

const defaultSettings: Settings = {
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
  fullWidthWorkspaceEnabled: false,
};

type BooleanSettingKey =
  | "twoFactorEnabled"
  | "loginAlertsEnabled"
  | "sessionLockEnabled"
  | "aiTaggingEnabled"
  | "taskExtractionEnabled"
  | "reminderEmailsEnabled"
  | "compactBoardEnabled"
  | "autoOpenLastProject"
  | "fullWidthWorkspaceEnabled";

interface SettingsState extends Settings {
  isLoading: boolean;
  isInitialized: boolean;
  initialize: () => Promise<void>;
  clear: () => void;
  setBooleanSetting: (key: BooleanSettingKey, value: boolean) => Promise<void>;
  setDigestCadence: (value: DigestCadence) => Promise<void>;
  setDefaultNoteMode: (value: DefaultNoteMode) => Promise<void>;
  setAppStartPage: (value: AppStartPage) => Promise<void>;
}

async function persistSettingsPatch(patch: Partial<Settings>) {
  const { settings } = await updateSettings(patch);
  return settings;
}

export const useSettingsStore = create<SettingsState>()((set, get) => ({
  ...defaultSettings,
  isLoading: false,
  isInitialized: false,
  initialize: async () => {
    if (get().isLoading) return;

    set({ isLoading: true });
    try {
      const { settings } = await fetchSettings();
      set({ ...defaultSettings, ...settings, isInitialized: true, isLoading: false });
    } catch {
      set({ ...defaultSettings, isInitialized: true, isLoading: false });
    }
  },
  clear: () => {
    set({ ...defaultSettings, isInitialized: false, isLoading: false });
  },
  setBooleanSetting: async (key, value) => {
    const previous = get()[key];
    set({ [key]: value } as Pick<SettingsState, typeof key>);
    try {
      const settings = await persistSettingsPatch({ [key]: value });
      set({ ...settings });
    } catch {
      set({ [key]: previous } as Pick<SettingsState, typeof key>);
    }
  },
  setDigestCadence: async (value) => {
    const previous = get().digestCadence;
    set({ digestCadence: value });
    try {
      const settings = await persistSettingsPatch({ digestCadence: value });
      set({ ...settings });
    } catch {
      set({ digestCadence: previous });
    }
  },
  setDefaultNoteMode: async (value) => {
    const previous = get().defaultNoteMode;
    set({ defaultNoteMode: value });
    try {
      const settings = await persistSettingsPatch({ defaultNoteMode: value });
      set({ ...settings });
    } catch {
      set({ defaultNoteMode: previous });
    }
  },
  setAppStartPage: async (value) => {
    const previous = get().appStartPage;
    set({ appStartPage: value });
    try {
      const settings = await persistSettingsPatch({ appStartPage: value });
      set({ ...settings });
    } catch {
      set({ appStartPage: previous });
    }
  },
}));

export type { AppStartPage, DefaultNoteMode, DigestCadence };
