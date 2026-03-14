import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ImagePlus, Paperclip, Save } from "lucide-react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { AttachmentPreview } from "@/components/chat/AttachmentPreview";
import { VoiceRecorderButton } from "@/components/chat/VoiceRecorderButton";
import { RichNoteEditor } from "@/components/notes/RichNoteEditor";
import { ProjectSelector } from "@/components/projects/ProjectSelector";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { uploadNoteAttachments } from "@/services/api";
import { useNotesStore } from "@/store/useNotesStore";
import type { NoteAttachment } from "@/types/note.types";
import { audioBlobToAttachment, toAttachment } from "@/utils/attachments";
import { plainTextToHtml } from "@/utils/noteContent";

interface DraftState {
  attachments?: NoteAttachment[];
  content?: string;
  projectId?: string;
  returnTo?: string;
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
  const returnTo = draftState?.returnTo ?? "/app";

  const [projectId, setProjectId] = useState(initialProjectId);
  const [attachments, setAttachments] = useState<NoteAttachment[]>(initialAttachments);
  const [content, setContent] = useState(initialHtml);
  const [isSaving, setIsSaving] = useState(false);
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

  const handleSave = async () => {
    if (isSaving) {
      return;
    }

    setIsSaving(true);

    try {
      const uploadedAttachments = await uploadNoteAttachments(attachments);

      if (isNew) {
        const note = await addNote({
          attachments: uploadedAttachments,
          content: draftState?.content?.trim() || "Untitled note",
          projectId,
          richContent: content,
        });
        navigate(returnTo, { replace: false, state: { focusNoteId: note.id } });
        return;
      }

      if (!id) {
        return;
      }

      await updateNote({
        attachments: uploadedAttachments,
        id,
        projectId,
        richContent: content,
      });
      navigate(returnTo, { replace: false, state: { focusNoteId: id } });
    } finally {
      setIsSaving(false);
    }
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
            <Link to={returnTo}>
              <ArrowLeft className="h-4 w-4" />
              Back
            </Link>
          </Button>
          <Button className="rounded-2xl" onClick={() => void handleSave()} disabled={isSaving}>
            <Save className="h-4 w-4" />
            {isSaving ? "Saving..." : "Save note"}
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
              <VoiceRecorderButton
                className="rounded-2xl"
                onRecorded={(blob) => {
                  setAttachments((current) => [...current, audioBlobToAttachment(blob)]);
                }}
              />
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
