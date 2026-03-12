import { create } from "zustand";
import { createNoteSchema } from "@/schemas/note.schema";
import { mockNotes } from "@/services/mockData";
import { useTasksStore } from "@/store/useTasksStore";
import type { Note, NoteAttachment } from "@/types/note.types";
import { extractTasks, generateTags } from "@/utils/tagGenerator";
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
  searchTerm: string;
  addNote: (input: AddNoteInput) => Note;
  updateNote: (input: UpdateNoteInput) => Note | null;
  deleteNote: (noteId: string) => void;
  getNoteById: (noteId: string) => Note | undefined;
  filterByProject: (projectId?: string | null) => Note[];
  setSearchTerm: (term: string) => void;
}

export const useNotesStore = create<NotesState>((set, get) => ({
  notes: mockNotes,
  searchTerm: "",
  addNote: (input) => {
    const richContent = input.richContent?.trim() || plainTextToHtml(input.content);
    const plainText = summarizeNoteContent(htmlToPlainText(richContent));

    const parsed = createNoteSchema.parse({
      attachments: input.attachments ?? [],
      content: plainText,
      richContent,
      projectId: input.projectId,
    });

    const note: Note = {
      id: `note-${Date.now()}`,
      content: parsed.content,
      richContent: parsed.richContent,
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
  updateNote: (input) => {
    const plainText = summarizeNoteContent(htmlToPlainText(input.richContent));
    const parsed = createNoteSchema.parse({
      attachments: input.attachments ?? [],
      content: plainText,
      richContent: input.richContent,
      projectId: input.projectId,
    });

    let updated: Note | null = null;

    set((state) => ({
      notes: state.notes.map((note) => {
        if (note.id !== input.id) {
          return note;
        }

        updated = {
          ...note,
          attachments: parsed.attachments,
          content: parsed.content,
          richContent: parsed.richContent,
          projectId: parsed.projectId,
          tags: generateTags(parsed.content),
        };

        return updated;
      }),
    }));

    return updated;
  },
  deleteNote: (noteId) =>
    set((state) => ({
      notes: state.notes.filter((note) => note.id !== noteId),
    })),
  getNoteById: (noteId) => get().notes.find((note) => note.id === noteId),
  filterByProject: (projectId) =>
    get().notes.filter((note) => !projectId || note.projectId === projectId),
  setSearchTerm: (term) =>
    set({
      searchTerm: term,
    }),
}));
