import axios from "axios";
import { noteSchema } from "@/schemas/note.schema";
import { projectSchema } from "@/schemas/project.schema";
import { taskSchema } from "@/schemas/task.schema";
import { mockNotes, mockProjects, mockTasks } from "@/services/mockData";

export const apiClient = axios.create({
  baseURL: "/api",
  timeout: 600,
});

export async function fetchNotes() {
  return Promise.resolve(mockNotes.map((note) => noteSchema.parse(note)));
}

export async function fetchProjects() {
  return Promise.resolve(mockProjects.map((project) => projectSchema.parse(project)));
}

export async function fetchTasks() {
  return Promise.resolve(mockTasks.map((task) => taskSchema.parse(task)));
}
