import { create } from "zustand";
import {
  completeOnboarding,
  deleteProfile,
  fetchMe,
  getStoredToken,
  login,
  resendTwoFactor,
  resendVerification,
  setStoredToken,
  signup,
  updateProfile,
  verifyEmail,
  verifyTwoFactor,
} from "@/services/api";
import { useNotesStore } from "@/store/useNotesStore";
import { useNotificationsStore } from "@/store/useNotificationsStore";
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

interface SignupResult {
  email: string;
  verificationRequired: true;
}

interface PendingTwoFactorChallenge {
  challengeId: string;
  method: "email" | "authenticator";
  email?: string;
}

interface AuthState {
  isAuthenticated: boolean;
  isHydrating: boolean;
  isSubmitting: boolean;
  user: User | null;
  pendingTwoFactorChallenge: PendingTwoFactorChallenge | null;
  initialize: () => Promise<void>;
  login: (payload: LoginInput) => Promise<void>;
  verifyTwoFactor: (code: string) => Promise<void>;
  resendTwoFactor: () => Promise<{ email?: string }>;
  clearPendingTwoFactor: () => void;
  signup: (payload: SignupInput) => Promise<SignupResult>;
  verifyEmail: (token: string) => Promise<void>;
  resendVerification: (email: string) => Promise<SignupResult>;
  completeOnboarding: () => Promise<void>;
  logout: () => void;
  updateProfile: (payload: ProfileUpdateInput) => Promise<void>;
  deleteAccount: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  isAuthenticated: false,
  isHydrating: true,
  isSubmitting: false,
  user: null,
  pendingTwoFactorChallenge: null,
  initialize: async () => {
    const token = getStoredToken();

    if (!token) {
      useNotesStore.getState().clear();
      useTasksStore.getState().clear();
      set({ isAuthenticated: false, user: null, pendingTwoFactorChallenge: null, isHydrating: false });
      return;
    }

    try {
      const { user } = await fetchMe();
      set({ isAuthenticated: true, user, pendingTwoFactorChallenge: null, isHydrating: false });
      await useSettingsStore.getState().initialize();
    } catch {
      setStoredToken(null);
      useNotesStore.getState().clear();
      useTasksStore.getState().clear();
      useNotificationsStore.getState().clear();
      useSettingsStore.getState().clear();
      set({ isAuthenticated: false, user: null, pendingTwoFactorChallenge: null, isHydrating: false });
    }
  },
  login: async (payload) => {
    set({ isSubmitting: true });
    try {
      const response = await login(payload);

      if ("twoFactorRequired" in response) {
        set({
          isAuthenticated: false,
          user: null,
          pendingTwoFactorChallenge: {
            challengeId: response.challengeId,
            method: response.method,
            email: response.email,
          },
          isSubmitting: false,
        });
        return;
      }

      setStoredToken(response.token);
      set({ isAuthenticated: true, user: response.user, pendingTwoFactorChallenge: null, isSubmitting: false });
      await useSettingsStore.getState().initialize();
    } catch (error) {
      set({ isSubmitting: false });
      throw error;
    }
  },
  verifyTwoFactor: async (code) => {
    const challenge = get().pendingTwoFactorChallenge;
    if (!challenge) {
      throw new Error("No pending two-factor challenge.");
    }

    set({ isSubmitting: true });
    try {
      const response = await verifyTwoFactor({ challengeId: challenge.challengeId, code });
      setStoredToken(response.token);
      set({ isAuthenticated: true, user: response.user, pendingTwoFactorChallenge: null, isSubmitting: false });
      await useSettingsStore.getState().initialize();
    } catch (error) {
      set({ isSubmitting: false });
      throw error;
    }
  },
  resendTwoFactor: async () => {
    const challenge = get().pendingTwoFactorChallenge;
    if (!challenge || challenge.method !== "email") {
      throw new Error("No email two-factor challenge to resend.");
    }

    set({ isSubmitting: true });
    try {
      const response = await resendTwoFactor(challenge.challengeId);
      set({
        pendingTwoFactorChallenge: {
          challengeId: response.challengeId,
          method: response.method,
          email: response.email,
        },
        isSubmitting: false,
      });
      return { email: response.email };
    } catch (error) {
      set({ isSubmitting: false });
      throw error;
    }
  },
  clearPendingTwoFactor: () => {
    set({ pendingTwoFactorChallenge: null });
  },
  signup: async (payload) => {
    set({ isSubmitting: true });
    try {
      const response = await signup(payload);
      set({ isSubmitting: false, isAuthenticated: false, user: null, pendingTwoFactorChallenge: null });
      return response;
    } catch (error) {
      set({ isSubmitting: false });
      throw error;
    }
  },
  verifyEmail: async (token) => {
    set({ isSubmitting: true });
    try {
      const response = await verifyEmail(token);
      setStoredToken(response.token);
      set({ isAuthenticated: true, user: response.user, pendingTwoFactorChallenge: null, isSubmitting: false });
      await useSettingsStore.getState().initialize();
    } catch (error) {
      set({ isSubmitting: false });
      throw error;
    }
  },
  resendVerification: async (email) => {
    set({ isSubmitting: true });
    try {
      const response = await resendVerification(email);
      set({ isSubmitting: false });
      return response;
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
    useNotificationsStore.getState().clear();
    useSettingsStore.getState().clear();
    set({ isAuthenticated: false, user: null, pendingTwoFactorChallenge: null, isHydrating: false, isSubmitting: false });
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
      useNotificationsStore.getState().clear();
      useSettingsStore.getState().clear();
      set({ isAuthenticated: false, user: null, pendingTwoFactorChallenge: null, isHydrating: false, isSubmitting: false });
    } catch (error) {
      set({ isSubmitting: false });
      throw error;
    }
  },
}));
