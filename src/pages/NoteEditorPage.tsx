import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ImagePlus, Paperclip, Save } from "lucide-react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { AttachmentPreview } from "@/components/chat/AttachmentPreview";
import { RichNoteEditor } from "@/components/notes/RichNoteEditor";
import { ProjectSelector } from "@/components/projects/ProjectSelector";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNotesStore } from "@/store/useNotesStore";
import type { NoteAttachment } from "@/types/note.types";
import { toAttachment } from "@/utils/attachments";
import { plainTextToHtml } from "@/utils/noteContent";

interface DraftState {
  attachments?: NoteAttachment[];
  content?: string;
  projectId?: string;
}

export function NoteEditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const draftState = (location.state as DraftState | null) ?? null;
  const addNote = useNotesStore((state) => state.addNote);
  const updateNote = useNotesStore((state) => state.updateNote);
  const getNoteById = useNotesStore((state) => state.getNoteById);
  const existingNote = id ? getNoteById(id) : undefined;
  const isNew = !id;

  const initialHtml = useMemo(() => {
    if (existingNote) {
      return existingNote.richContent;
    }

    return draftState?.content?.trim() ? plainTextToHtml(draftState.content) : "<p></p>";
  }, [draftState?.content, existingNote]);

  const initialProjectId = existingNote?.projectId ?? draftState?.projectId ?? "work";
  const initialAttachments = existingNote?.attachments ?? draftState?.attachments ?? [];

  const [projectId, setProjectId] = useState(initialProjectId);
  const [attachments, setAttachments] = useState<NoteAttachment[]>(initialAttachments);
  const [content, setContent] = useState(initialHtml);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setProjectId(initialProjectId);
    setAttachments(initialAttachments);
    setContent(initialHtml);
  }, [initialAttachments, initialHtml, initialProjectId]);

  const handleFileSelect = (files: FileList | null) => {
    if (!files?.length) {
      return;
    }

    setAttachments((current) => [...current, ...Array.from(files).map(toAttachment)]);
  };

  const handleSave = () => {
    if (isNew) {
      const note = addNote({
        attachments,
        content: draftState?.content?.trim() || "Untitled note",
        projectId,
        richContent: content,
      });
      navigate("/", { replace: false, state: { focusNoteId: note.id } });
      return;
    }

    if (!id) {
      return;
    }

    updateNote({
      attachments,
      id,
      projectId,
      richContent: content,
    });
    navigate("/", { replace: false, state: { focusNoteId: id } });
  };

  if (!isNew && !existingNote) {
    return (
      <Card className="rounded-[32px]">
        <CardContent className="p-10 text-sm text-muted-foreground">This note could not be found.</CardContent>
      </Card>
    );
  }

  return (
    <Card className="flex h-full min-h-0 flex-col rounded-[32px]">
      <CardHeader className="flex flex-col gap-4 border-b border-border/70 pb-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <CardDescription>{isNew ? "Full-screen note mode" : "Edit note"}</CardDescription>
          <CardTitle className="text-3xl">{isNew ? "Write a full note" : "Refine your note"}</CardTitle>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="ghost" className="rounded-2xl">
            <Link to="/">
              <ArrowLeft className="h-4 w-4" />
              Back to chat
            </Link>
          </Button>
          <Button className="rounded-2xl" onClick={handleSave}>
            <Save className="h-4 w-4" />
            Save note
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col gap-5 pt-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
            <ProjectSelector value={projectId} onChange={setProjectId} />
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" size="sm" className="rounded-2xl" onClick={() => imageInputRef.current?.click()}>
                <ImagePlus className="h-4 w-4" />
                Image
              </Button>
              <Button type="button" variant="outline" size="sm" className="rounded-2xl" onClick={() => fileInputRef.current?.click()}>
                <Paperclip className="h-4 w-4" />
                File
              </Button>
            </div>
          </div>
        </div>
        {!!attachments.length && (
          <div className="flex flex-wrap gap-2">
            {attachments.map((attachment) => (
              <AttachmentPreview key={attachment.id} attachment={attachment} compact />
            ))}
          </div>
        )}
        <RichNoteEditor content={content} onChange={setContent} />
      </CardContent>
      <input
        ref={imageInputRef}
        hidden
        multiple
        accept="image/*"
        type="file"
        onChange={(event) => handleFileSelect(event.target.files)}
      />
      <input
        ref={fileInputRef}
        hidden
        multiple
        type="file"
        onChange={(event) => handleFileSelect(event.target.files)}
      />
    </Card>
  );
}
