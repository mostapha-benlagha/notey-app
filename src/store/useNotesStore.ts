import { create } from "zustand";
import { createNoteSchema } from "@/schemas/note.schema";
import { mockNotes } from "@/services/mockData";
import { useTasksStore } from "@/store/useTasksStore";
import type { Note, NoteAttachment } from "@/types/note.types";
import { extractTasks, generateTags } from "@/utils/tagGenerator";

interface AddNoteInput {
  content: string;
  projectId: string;
  attachments?: NoteAttachment[];
}

interface NotesState {
  notes: Note[];
  searchTerm: string;
  addNote: (input: AddNoteInput) => Note;
  deleteNote: (noteId: string) => void;
  filterByProject: (projectId?: string | null) => Note[];
  setSearchTerm: (term: string) => void;
}

export const useNotesStore = create<NotesState>((set, get) => ({
  notes: mockNotes,
  searchTerm: "",
  addNote: (input) => {
    const parsed = createNoteSchema.parse({
      attachments: input.attachments ?? [],
      content: input.content,
      projectId: input.projectId,
    });

    const note: Note = {
      id: `note-${Date.now()}`,
      content: parsed.content,
      projectId: parsed.projectId,
      tags: generateTags(parsed.content),
      createdAt: new Date().toISOString(),
      attachments: parsed.attachments,
    };

    const taskTitles = extractTasks(parsed.content);
    if (taskTitles.length) {
      const addTask = useTasksStore.getState().addTask;
      taskTitles.forEach((title, index) =>
        addTask({
          id: `task-${note.id}-${index}`,
          title,
          status: "pending",
          projectId: note.projectId,
          noteId: note.id,
        }),
      );
    }

    set((state) => ({
      notes: [note, ...state.notes],
    }));

    return note;
  },
  deleteNote: (noteId) =>
    set((state) => ({
      notes: state.notes.filter((note) => note.id !== noteId),
    })),
  filterByProject: (projectId) =>
    get().notes.filter((note) => !projectId || note.projectId === projectId),
  setSearchTerm: (term) =>
    set({
      searchTerm: term,
    }),
}));
