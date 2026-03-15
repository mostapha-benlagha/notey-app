import { create } from "zustand";
import { createNoteSchema } from "@/schemas/note.schema";
import { createNote as createNoteRequest, deleteNote as deleteNoteRequest, fetchNotes, updateNote as updateNoteRequest } from "@/services/api";
import { useSettingsStore } from "@/store/useSettingsStore";
import { useTasksStore } from "@/store/useTasksStore";
import type { Note, NoteAttachment } from "@/types/note.types";
import { generateTags } from "@/utils/tagGenerator";
import { htmlToPlainText, plainTextToHtml, summarizeNoteContent } from "@/utils/noteContent";

interface AddNoteInput {
  content: string;
  richContent?: string;
  projectId: string;
  attachments?: NoteAttachment[];
}

interface UpdateNoteInput {
  id: string;
  richContent: string;
  projectId: string;
  attachments?: NoteAttachment[];
}

interface NotesState {
  notes: Note[];
  isLoading: boolean;
  searchTerm: string;
  initialize: () => Promise<void>;
  clear: () => void;
  addNote: (input: AddNoteInput) => Promise<Note>;
  updateNote: (input: UpdateNoteInput) => Promise<Note | null>;
  setNoteProjectLink: (noteId: string, projectId: string) => Promise<Note | null>;
  clearProjectFromNotes: (projectId: string) => Promise<void>;
  deleteNote: (noteId: string) => Promise<void>;
  applyServerNote: (note: Note) => void;
  getNoteById: (noteId: string) => Note | undefined;
  filterByProject: (projectId?: string | null) => Note[];
  setSearchTerm: (term: string) => void;
}

export const useNotesStore = create<NotesState>((set, get) => ({
  notes: [],
  isLoading: false,
  searchTerm: "",
  initialize: async () => {
    set({ isLoading: true });

    try {
      const notes = await fetchNotes();
      set({ isLoading: false, notes });
    } catch {
      set({ isLoading: false, notes: [] });
      throw new Error("Unable to load notes");
    }
  },
  clear: () =>
    set({
      isLoading: false,
      notes: [],
      searchTerm: "",
    }),
  addNote: async (input) => {
    const richContent = input.richContent?.trim() || plainTextToHtml(input.content);
    const plainText = summarizeNoteContent(htmlToPlainText(richContent));

    const parsed = createNoteSchema.parse({
      attachments: input.attachments ?? [],
      content: plainText,
      richContent,
      projectId: input.projectId,
    });

    const note = await createNoteRequest({
      attachments: parsed.attachments,
      content: parsed.content,
      projectId: parsed.projectId,
      richContent: parsed.richContent,
      tags: [],
    });

    set((state) => ({
      notes: [note, ...state.notes.filter((existing) => existing.id !== note.id)],
    }));

    return note;
  },
  updateNote: async (input) => {
    const { aiTaggingEnabled } = useSettingsStore.getState();
    const plainText = summarizeNoteContent(htmlToPlainText(input.richContent));
    const parsed = createNoteSchema.parse({
      attachments: input.attachments ?? [],
      content: plainText,
      richContent: input.richContent,
      projectId: input.projectId,
    });

    const existing = get().notes.find((note) => note.id === input.id);
    if (!existing) {
      return null;
    }

    const updated = await updateNoteRequest({
      attachments: parsed.attachments,
      content: parsed.content,
      id: input.id,
      projectId: parsed.projectId,
      richContent: parsed.richContent,
      tags: aiTaggingEnabled ? generateTags(parsed.content) : [],
    });

    set((state) => ({
      notes: state.notes.map((note) => (note.id === input.id ? updated : note)),
    }));

    return updated;
  },
  setNoteProjectLink: async (noteId, projectId) => {
    const existing = get().notes.find((note) => note.id === noteId);
    if (!existing || existing.projectId === projectId) {
      return existing ?? null;
    }

    const updated = await updateNoteRequest({
      id: existing.id,
      content: existing.content,
      richContent: existing.richContent,
      projectId,
      tags: existing.tags,
      attachments: existing.attachments,
    });

    set((state) => ({
      notes: state.notes.map((note) => (note.id === noteId ? updated : note)),
    }));

    return updated;
  },
  clearProjectFromNotes: async (projectId) => {
    const linkedNotes = get().notes.filter((note) => note.projectId === projectId);
    if (!linkedNotes.length) {
      return;
    }

    const updatedNotes = await Promise.all(
      linkedNotes.map((note) =>
        updateNoteRequest({
          id: note.id,
          content: note.content,
          richContent: note.richContent,
          projectId: "",
          tags: note.tags,
          attachments: note.attachments,
        }),
      ),
    );

    const updatedById = new Map(updatedNotes.map((note) => [note.id, note]));
    set((state) => ({
      notes: state.notes.map((note) => updatedById.get(note.id) ?? note),
    }));
  },
  deleteNote: async (noteId) => {
    await deleteNoteRequest(noteId);
    useTasksStore.getState().handleNoteDeleted(noteId);

    set((state) => ({
      notes: state.notes.filter((note) => note.id !== noteId),
    }));
  },
  applyServerNote: (note) =>
    set((state) => ({
      notes: [note, ...state.notes.filter((existing) => existing.id !== note.id)].sort(
        (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
      ),
    })),
  getNoteById: (noteId) => get().notes.find((note) => note.id === noteId),
  filterByProject: (projectId) =>
    get().notes.filter((note) => !projectId || note.projectId === projectId),
  setSearchTerm: (term) =>
    set({
      searchTerm: term,
    }),
}));
