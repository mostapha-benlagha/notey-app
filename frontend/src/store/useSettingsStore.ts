import { create } from "zustand";
import { fetchSettings, updateSettings } from "@/services/api";
import type { AppStartPage, DefaultNoteMode, DigestCadence, Settings, TwoFactorMethod } from "@/types/settings.types";

const defaultSettings: Settings = {
  twoFactorEnabled: false,
  twoFactorMethod: "email",
  authenticatorAppEnabled: false,
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
  setTwoFactorMethod: (value: TwoFactorMethod) => Promise<void>;
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
    } catch (error) {
      set({ [key]: previous } as Pick<SettingsState, typeof key>);
      throw error;
    }
  },
  setDigestCadence: async (value) => {
    const previous = get().digestCadence;
    set({ digestCadence: value });
    try {
      const settings = await persistSettingsPatch({ digestCadence: value });
      set({ ...settings });
    } catch (error) {
      set({ digestCadence: previous });
      throw error;
    }
  },
  setTwoFactorMethod: async (value) => {
    const previous = get().twoFactorMethod;
    set({ twoFactorMethod: value });
    try {
      const settings = await persistSettingsPatch({ twoFactorMethod: value });
      set({ ...settings });
    } catch (error) {
      set({ twoFactorMethod: previous });
      throw error;
    }
  },
  setDefaultNoteMode: async (value) => {
    const previous = get().defaultNoteMode;
    set({ defaultNoteMode: value });
    try {
      const settings = await persistSettingsPatch({ defaultNoteMode: value });
      set({ ...settings });
    } catch (error) {
      set({ defaultNoteMode: previous });
      throw error;
    }
  },
  setAppStartPage: async (value) => {
    const previous = get().appStartPage;
    set({ appStartPage: value });
    try {
      const settings = await persistSettingsPatch({ appStartPage: value });
      set({ ...settings });
    } catch (error) {
      set({ appStartPage: previous });
      throw error;
    }
  },
}));

export type { AppStartPage, DefaultNoteMode, DigestCadence, TwoFactorMethod };
