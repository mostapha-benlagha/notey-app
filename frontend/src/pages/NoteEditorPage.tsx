import { Card, CardContent } from "@/components/ui/card";
import { NoteEditorProvider } from "@/features/note-editor/NoteEditorContext";
import { NoteEditorBody } from "@/features/note-editor/components/NoteEditorBody";
import { NoteEditorHeader } from "@/features/note-editor/components/NoteEditorHeader";
import { NoteExportDialog } from "@/features/note-editor/components/NoteExportDialog";
import { useNoteEditor } from "@/features/note-editor/useNoteEditor";

export function NoteEditorPage() {
  const editor = useNoteEditor();

  if (!editor.isNew && !editor.existingNote) {
    return (
      <Card className="rounded-[32px]">
        <CardContent className="p-10 text-sm text-muted-foreground">This note could not be found.</CardContent>
      </Card>
    );
  }

  return (
    <NoteEditorProvider value={editor}>
      <Card className="flex h-full min-h-0 flex-col rounded-[32px]">
        <NoteEditorHeader />
        <NoteEditorBody />
        <input ref={editor.imageInputRef} hidden multiple accept="image/*" type="file" onChange={(event) => editor.handleFileSelect(event.target.files)} />
        <input ref={editor.fileInputRef} hidden multiple type="file" onChange={(event) => editor.handleFileSelect(event.target.files)} />
        <NoteExportDialog />
      </Card>
    </NoteEditorProvider>
  );
}
