import { create } from "zustand";
import { completeOnboarding, deleteProfile, fetchMe, getStoredToken, login, setStoredToken, signup, updateProfile } from "@/services/api";
import { useNotesStore } from "@/store/useNotesStore";
import { useSettingsStore } from "@/store/useSettingsStore";
import { useTasksStore } from "@/store/useTasksStore";
import type { User } from "@/types/user.types";

interface LoginInput {
  email: string;
  password: string;
}

interface SignupInput extends LoginInput {
  firstName: string;
  lastName: string;
}

interface ProfileUpdateInput {
  email: string;
  firstName: string;
  lastName: string;
}

interface AuthState {
  isAuthenticated: boolean;
  isHydrating: boolean;
  isSubmitting: boolean;
  user: User | null;
  initialize: () => Promise<void>;
  login: (payload: LoginInput) => Promise<void>;
  signup: (payload: SignupInput) => Promise<void>;
  completeOnboarding: () => Promise<void>;
  logout: () => void;
  updateProfile: (payload: ProfileUpdateInput) => Promise<void>;
  deleteAccount: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()((set) => ({
  isAuthenticated: false,
  isHydrating: true,
  isSubmitting: false,
  user: null,
  initialize: async () => {
    const token = getStoredToken();

    if (!token) {
      useNotesStore.getState().clear();
      useTasksStore.getState().clear();
      set({ isAuthenticated: false, user: null, isHydrating: false });
      return;
    }

    try {
      const { user } = await fetchMe();
      set({ isAuthenticated: true, user, isHydrating: false });
      await useSettingsStore.getState().initialize();
    } catch {
      setStoredToken(null);
      useNotesStore.getState().clear();
      useTasksStore.getState().clear();
      useSettingsStore.getState().clear();
      set({ isAuthenticated: false, user: null, isHydrating: false });
    }
  },
  login: async (payload) => {
    set({ isSubmitting: true });
    try {
      const response = await login(payload);
      setStoredToken(response.token);
      set({ isAuthenticated: true, user: response.user, isSubmitting: false });
      await useSettingsStore.getState().initialize();
    } catch (error) {
      set({ isSubmitting: false });
      throw error;
    }
  },
  signup: async (payload) => {
    set({ isSubmitting: true });
    try {
      const response = await signup(payload);
      setStoredToken(response.token);
      set({ isAuthenticated: true, user: response.user, isSubmitting: false });
      await useSettingsStore.getState().initialize();
    } catch (error) {
      set({ isSubmitting: false });
      throw error;
    }
  },
  completeOnboarding: async () => {
    set({ isSubmitting: true });
    try {
      await completeOnboarding();
      set((state) => ({
        user: state.user
          ? {
              ...state.user,
              onboardingCompleted: true,
            }
          : null,
        isSubmitting: false,
      }));
    } catch (error) {
      set({ isSubmitting: false });
      throw error;
    }
  },
  logout: () => {
    setStoredToken(null);
    useNotesStore.getState().clear();
    useTasksStore.getState().clear();
    useSettingsStore.getState().clear();
    set({ isAuthenticated: false, user: null, isHydrating: false, isSubmitting: false });
  },
  updateProfile: async (payload) => {
    set({ isSubmitting: true });
    try {
      const response = await updateProfile(payload);
      set({ user: response.profile, isSubmitting: false });
    } catch (error) {
      set({ isSubmitting: false });
      throw error;
    }
  },
  deleteAccount: async () => {
    set({ isSubmitting: true });
    try {
      await deleteProfile();
      setStoredToken(null);
      useNotesStore.getState().clear();
      useTasksStore.getState().clear();
      useSettingsStore.getState().clear();
      set({ isAuthenticated: false, user: null, isHydrating: false, isSubmitting: false });
    } catch (error) {
      set({ isSubmitting: false });
      throw error;
    }
  },
}));
