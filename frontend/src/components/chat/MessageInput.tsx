import { useRef, useState } from "react";
import { Expand, ImagePlus, Paperclip, SendHorizontal } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import type { NoteAttachment } from "@/types/note.types";
import { AttachmentPreview } from "@/components/chat/AttachmentPreview";
import { ProjectSelector } from "@/components/projects/ProjectSelector";
import { uploadNoteAttachments } from "@/services/api";
import { toAttachment } from "@/utils/attachments";

export function MessageInput({
  onSubmit,
}: {
  onSubmit: (payload: { content: string; projectId: string; attachments: NoteAttachment[] }) => Promise<void>;
}) {
  const navigate = useNavigate();
  const [content, setContent] = useState("");
  const [projectId, setProjectId] = useState("work");
  const [attachments, setAttachments] = useState<NoteAttachment[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (files: FileList | null) => {
    if (!files?.length) {
      return;
    }

    setAttachments((current) => [...current, ...Array.from(files).map(toAttachment)]);
  };

  const openFullEditor = () => {
    navigate("/app/notes/new", {
      state: {
        attachments,
        content,
        projectId,
        returnTo: "/app",
      },
    });
  };

  const submit = async () => {
    if (!content.trim() || isSubmitting) {
      return;
    }

    setIsSubmitting(true);

    try {
      const uploadedAttachments = await uploadNoteAttachments(attachments);
      await onSubmit({
        content,
        projectId,
        attachments: uploadedAttachments,
      });
      setContent("");
      setAttachments([]);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="rounded-[32px] border-white/90 p-4">
      <div className="flex flex-col gap-4">
        <Textarea
          aria-label="Message input"
          placeholder="Write a note like you would message your AI assistant..."
          value={content}
          onChange={(event) => setContent(event.target.value)}
        />
        {!!attachments.length && (
          <div className="flex flex-wrap gap-2">
            {attachments.map((attachment) => (
              <AttachmentPreview key={attachment.id} attachment={attachment} compact />
            ))}
          </div>
        )}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
            <ProjectSelector value={projectId} onChange={setProjectId} />
            <div className="flex gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={openFullEditor}>
                <Expand className="h-4 w-4" />
                Full note
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => imageInputRef.current?.click()}>
                <ImagePlus className="h-4 w-4" />
                Image
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                <Paperclip className="h-4 w-4" />
                File
              </Button>
            </div>
          </div>
          <Button type="button" onClick={() => void submit()} disabled={isSubmitting}>
            <SendHorizontal className="h-4 w-4" />
            {isSubmitting ? "Saving..." : "Save note"}
          </Button>
        </div>
      </div>
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
