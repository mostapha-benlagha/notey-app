import { createContext, useContext, type ReactNode } from "react";
import { useNoteEditor } from "@/features/note-editor/useNoteEditor";

type NoteEditorValue = ReturnType<typeof useNoteEditor>;

const NoteEditorContext = createContext<NoteEditorValue | null>(null);

export function NoteEditorProvider({ children, value }: { children: ReactNode; value: NoteEditorValue }) {
  return <NoteEditorContext.Provider value={value}>{children}</NoteEditorContext.Provider>;
}

export function useNoteEditorContext() {
  const value = useContext(NoteEditorContext);
  if (!value) {
    throw new Error("useNoteEditorContext must be used inside NoteEditorProvider");
  }

  return value;
}
