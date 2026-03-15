import { ImagePlus, Paperclip } from "lucide-react";
import { AttachmentPreview } from "@/components/chat/AttachmentPreview";
import { VoiceRecorderButton } from "@/components/chat/VoiceRecorderButton";
import { RichNoteEditor } from "@/components/notes/RichNoteEditor";
import { ProjectSelector } from "@/components/projects/ProjectSelector";
import { Button } from "@/components/ui/button";
import { CardContent } from "@/components/ui/card";
import { useNoteEditorContext } from "@/features/note-editor/NoteEditorContext";

export function NoteEditorBody() {
  const { attachments, content, fileInputRef, handleRecordedAudio, imageInputRef, setContent, projectId, setProjectId } = useNoteEditorContext();

  return (
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
            <VoiceRecorderButton className="rounded-2xl" onRecorded={handleRecordedAudio} />
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
  );
}
