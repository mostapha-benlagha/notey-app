import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "@/types/user.types";

interface AuthPayload {
  email: string;
  firstName?: string;
  lastName?: string;
}

interface ProfileUpdateInput {
  email: string;
  firstName: string;
  lastName: string;
}

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  login: (payload: AuthPayload) => void;
  signup: (payload: Required<AuthPayload>) => void;
  logout: () => void;
  updateProfile: (payload: ProfileUpdateInput) => void;
  deleteAccount: () => void;
}

function buildUser(payload: Required<AuthPayload>): User {
  return {
    id: "user-demo",
    email: payload.email,
    firstName: payload.firstName,
    lastName: payload.lastName,
    joinedAt: "2026-03-01T09:00:00.000Z",
    plan: "Pro Trial",
    role: "Founder",
  };
}

const defaultUser = buildUser({
  email: "alex@notey.app",
  firstName: "Alex",
  lastName: "Morgan",
});

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      user: null,
      login: ({ email, firstName, lastName }) =>
        set({
          isAuthenticated: true,
          user: buildUser({
            email,
            firstName: firstName || defaultUser.firstName,
            lastName: lastName || defaultUser.lastName,
          }),
        }),
      signup: ({ email, firstName, lastName }) =>
        set({
          isAuthenticated: true,
          user: buildUser({ email, firstName, lastName }),
        }),
      logout: () =>
        set({
          isAuthenticated: false,
          user: null,
        }),
      updateProfile: ({ email, firstName, lastName }) =>
        set((state) => ({
          user: state.user
            ? {
                ...state.user,
                email,
                firstName,
                lastName,
              }
            : null,
        })),
      deleteAccount: () =>
        set({
          isAuthenticated: false,
          user: null,
        }),
    }),
    {
      name: "notey-auth",
    },
  ),
);
