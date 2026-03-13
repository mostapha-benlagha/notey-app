import axios from "axios";
import { noteSchema } from "@/schemas/note.schema";
import { projectSchema } from "@/schemas/project.schema";
import { taskSchema } from "@/schemas/task.schema";
import { mockNotes, mockProjects, mockTasks } from "@/services/mockData";
import type { User } from "@/types/user.types";
import type { Settings } from "@/types/settings.types";

const AUTH_TOKEN_KEY = "notey-access-token";

export const apiClient = axios.create({
  baseURL: "/api",
  timeout: 5000,
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export function getStoredToken() {
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function setStoredToken(token: string | null) {
  if (!token) {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    return;
  }

  localStorage.setItem(AUTH_TOKEN_KEY, token);
}

interface AuthResponse {
  ok: true;
  token: string;
  user: User;
}

interface MeResponse {
  ok: true;
  user: User;
}

interface ProfileResponse {
  ok: true;
  profile: User;
}

interface SettingsResponse {
  ok: true;
  settings: Settings;
}

export async function signup(input: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}) {
  const { data } = await apiClient.post<AuthResponse>("/auth/signup", input);
  return data;
}

export async function login(input: { email: string; password: string }) {
  const { data } = await apiClient.post<AuthResponse>("/auth/login", input);
  return data;
}

export async function fetchMe() {
  const { data } = await apiClient.get<MeResponse>("/auth/me");
  return data;
}

export async function fetchProfile() {
  const { data } = await apiClient.get<ProfileResponse>("/account/profile");
  return data;
}

export async function updateProfile(input: {
  email: string;
  firstName: string;
  lastName: string;
}) {
  const { data } = await apiClient.patch<ProfileResponse>("/account/profile", input);
  return data;
}

export async function deleteProfile() {
  await apiClient.delete("/account/profile");
}

export async function fetchSettings() {
  const { data } = await apiClient.get<SettingsResponse>("/settings");
  return data;
}

export async function updateSettings(input: Partial<Settings>) {
  const { data } = await apiClient.patch<SettingsResponse>("/settings", input);
  return data;
}

export async function fetchNotes() {
  return Promise.resolve(mockNotes.map((note) => noteSchema.parse(note)));
}

export async function fetchProjects() {
  return Promise.resolve(mockProjects.map((project) => projectSchema.parse(project)));
}

export async function fetchTasks() {
  return Promise.resolve(mockTasks.map((task) => taskSchema.parse(task)));
}
