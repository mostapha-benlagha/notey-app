import axios from "axios";
import { noteSchema } from "@/schemas/note.schema";
import { projectSchema } from "@/schemas/project.schema";
import { taskSchema } from "@/schemas/task.schema";
import { mockNotes, mockProjects, mockTasks } from "@/services/mockData";
import type { Note, NoteAttachment } from "@/types/note.types";
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

interface OnboardingResponse {
  ok: true;
  onboardingCompleted: boolean;
}

interface NotesResponse {
  ok: true;
  notes: Note[];
}

interface NoteResponse {
  ok: true;
  note: Note;
}

interface UploadAttachmentsResponse {
  ok: true;
  attachments: NoteAttachment[];
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

export async function completeOnboarding() {
  const { data } = await apiClient.post<OnboardingResponse>("/onboarding/complete");
  return data;
}

export async function fetchNotes() {
  const { data } = await apiClient.get<NotesResponse>("/notes");
  return data.notes.map((note) => noteSchema.parse(note));
}

export async function createNote(input: {
  content: string;
  richContent: string;
  projectId: string;
  tags: string[];
  attachments: NoteAttachment[];
}) {
  const { data } = await apiClient.post<NoteResponse>("/notes", input);
  return noteSchema.parse(data.note);
}

export async function updateNote(input: {
  id: string;
  content: string;
  richContent: string;
  projectId: string;
  tags: string[];
  attachments: NoteAttachment[];
}) {
  const { id, ...payload } = input;
  const { data } = await apiClient.patch<NoteResponse>(`/notes/${id}`, payload);
  return noteSchema.parse(data.note);
}

export async function deleteNote(noteId: string) {
  await apiClient.delete(`/notes/${noteId}`);
}

export async function uploadNoteAttachments(attachments: NoteAttachment[]) {
  const existingAttachments = attachments
    .filter((attachment) => !attachment.file)
    .map(({ file, ...attachment }) => attachment);
  const files = attachments
    .map((attachment) => attachment.file)
    .filter((file): file is File => !!file);

  if (!files.length) {
    return existingAttachments;
  }

  const formData = new FormData();
  files.forEach((file) => {
    formData.append("files", file);
  });

  const { data } = await apiClient.post<UploadAttachmentsResponse>("/notes/attachments/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  const uploadedAttachments = data.attachments.map((attachment) => noteSchema.shape.attachments.element.parse(attachment));
  return [...existingAttachments, ...uploadedAttachments];
}

export async function fetchProjects() {
  return Promise.resolve(mockProjects.map((project) => projectSchema.parse(project)));
}

export async function fetchTasks() {
  return Promise.resolve(mockTasks.map((task) => taskSchema.parse(task)));
}
