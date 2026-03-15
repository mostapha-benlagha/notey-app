import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Download, ImagePlus, Paperclip, Save } from "lucide-react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { AttachmentPreview } from "@/components/chat/AttachmentPreview";
import { VoiceRecorderButton } from "@/components/chat/VoiceRecorderButton";
import { RichNoteEditor } from "@/components/notes/RichNoteEditor";
import { ProjectSelector } from "@/components/projects/ProjectSelector";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { uploadNoteAttachments } from "@/services/api";
import { useNotesStore } from "@/store/useNotesStore";
import { useNotificationsStore } from "@/store/useNotificationsStore";
import { useProjectsStore } from "@/store/useProjectsStore";
import { useSettingsStore } from "@/store/useSettingsStore";
import { useTasksStore } from "@/store/useTasksStore";
import type { NoteAttachment } from "@/types/note.types";
import type { Task } from "@/types/task.types";
import { audioBlobToAttachment, toAttachment } from "@/utils/attachments";
import { htmlToPlainText, plainTextToHtml, summarizeNoteContent } from "@/utils/noteContent";

interface DraftState {
  attachments?: NoteAttachment[];
  content?: string;
  projectId?: string;
  returnTo?: string;
}

interface ExportPageItem {
  kind: "paragraph" | "todo-heading" | "todo";
  text: string;
}

interface ExportPageData {
  items: ExportPageItem[];
  showHeader: boolean;
}

const EXPORT_PAGE_CHARS_PER_LINE = 78;
const EXPORT_PAGE_MAX_CHARS_PER_CHUNK = 420;
const PREVIEW_FIRST_PAGE_CAPACITY = 30;
const PREVIEW_FOLLOWING_PAGE_CAPACITY = 36;
const PDF_FIRST_PAGE_CAPACITY = 38;
const PDF_FOLLOWING_PAGE_CAPACITY = 46;

function buildExportFileName(text: string) {
  return summarizeNoteContent(text, 32).replace(/[^a-z0-9]+/gi, "-") || "note";
}

function formatExportHeading(date: Date, projectName: string) {
  return `${date.toLocaleDateString()} - ${projectName}`;
}

function downloadTextNote(text: string) {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${buildExportFileName(text)}.txt`;
  anchor.click();
  URL.revokeObjectURL(url);
}

function splitParagraphForExport(text: string, maxChars = EXPORT_PAGE_MAX_CHARS_PER_CHUNK) {
  const words = text.split(/\s+/).filter(Boolean);
  const chunks: string[] = [];
  let current = "";

  words.forEach((word) => {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length > maxChars && current) {
      chunks.push(current);
      current = word;
      return;
    }

    current = candidate;
  });

  if (current) {
    chunks.push(current);
  }

  return chunks.length ? chunks : [text];
}

function estimateExportItemWeight(text: string, extraLines = 0) {
  return Math.max(1, Math.ceil(text.length / EXPORT_PAGE_CHARS_PER_LINE)) + extraLines;
}

function buildExportPages(
  paragraphs: string[],
  linkedTasks: Task[],
  includeLinkedTodos: boolean,
  density: "preview" | "pdf",
) {
  const pages: ExportPageData[] = [{ items: [], showHeader: true }];
  let currentPage = pages[0];
  let remainingCapacity = density === "pdf" ? PDF_FIRST_PAGE_CAPACITY : PREVIEW_FIRST_PAGE_CAPACITY;
  const followingCapacity = density === "pdf" ? PDF_FOLLOWING_PAGE_CAPACITY : PREVIEW_FOLLOWING_PAGE_CAPACITY;

  const pushItem = (item: ExportPageItem, weight: number) => {
    if (weight > remainingCapacity && currentPage.items.length) {
      currentPage = { items: [], showHeader: false };
      pages.push(currentPage);
      remainingCapacity = followingCapacity;
    }

    currentPage.items.push(item);
    remainingCapacity -= weight;
  };

  paragraphs.forEach((paragraph) => {
    splitParagraphForExport(paragraph).forEach((chunk) => {
      pushItem({ kind: "paragraph", text: chunk }, estimateExportItemWeight(chunk, 1));
    });
  });

  if (includeLinkedTodos && linkedTasks.length) {
    pushItem({ kind: "todo-heading", text: "Linked to-dos" }, 2);
    linkedTasks.forEach((task) => {
      pushItem({ kind: "todo", text: task.title }, estimateExportItemWeight(task.title, 1));
    });
  }

  return pages;
}

async function exportPreviewAsPdf(container: HTMLElement, fileName: string) {
  const { jsPDF } = await import("jspdf");
  const html2canvas = (await import("html2canvas")).default;
  const pdf = new jsPDF({
    format: "a4",
    unit: "pt",
  });

  if ("fonts" in document) {
    await document.fonts.ready;
  }

  const pageElements = Array.from(container.querySelectorAll<HTMLElement>("[data-export-page='true']"));
  const exportPages = pageElements.length ? pageElements : [container];

  for (const [index, pageElement] of exportPages.entries()) {
    const canvas = await html2canvas(pageElement, {
      backgroundColor: "#ffffff",
      scale: 2,
      useCORS: true,
    });
    const imageData = canvas.toDataURL("image/png");
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    if (index > 0) {
      pdf.addPage();
    }

    pdf.addImage(imageData, "PNG", 0, 0, pageWidth, pageHeight);
  }

  pdf.save(`${fileName}.pdf`);
}

function NoteExportPreview({
  title,
  paragraphs,
  linkedTasks,
  includeLinkedTodos,
  density,
}: {
  title: string;
  paragraphs: string[];
  linkedTasks: Task[];
  includeLinkedTodos: boolean;
  density: "preview" | "pdf";
}) {
  const pages = buildExportPages(paragraphs, linkedTasks, includeLinkedTodos, density);
  const isPdfDensity = density === "pdf";

  return (
    <div className="mx-auto flex w-full max-w-[794px] flex-col gap-6">
      {pages.map((page, pageIndex) => (
        <div
          key={`export-page-${pageIndex}`}
          data-export-page="true"
          className="min-h-[1123px] w-full rounded-[32px] bg-white p-10 text-foreground shadow-soft sm:p-14"
        >
          {page.showHeader ? (
            <>
              <h1 className={isPdfDensity ? "text-[1.45rem] font-extrabold tracking-tight text-foreground" : "text-[1.8rem] font-extrabold tracking-tight text-foreground"}>
                {title}
              </h1>
              <p className={isPdfDensity ? "mt-2.5 text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground" : "mt-3 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground"}>
                Exported from Notey on {new Date().toLocaleString()}
              </p>
            </>
          ) : null}
          <div
            className={
              isPdfDensity
                ? page.showHeader
                  ? "mt-6 space-y-2.5 text-[0.84rem] leading-6 text-foreground"
                  : "space-y-2.5 text-[0.84rem] leading-6 text-foreground"
                : page.showHeader
                  ? "mt-8 space-y-4 text-[0.98rem] leading-8 text-foreground"
                  : "space-y-4 text-[0.98rem] leading-8 text-foreground"
            }
          >
            {page.items.length ? (
              page.items.map((item, index) => {
                if (item.kind === "todo-heading") {
                  return (
                    <h2
                      key={`item-${pageIndex}-${index}`}
                      className={isPdfDensity ? "pt-3 text-[1.1rem] font-bold tracking-tight text-foreground" : "pt-4 text-[1.35rem] font-bold tracking-tight text-foreground"}
                    >
                      {item.text}
                    </h2>
                  );
                }

                if (item.kind === "todo") {
                  return (
                    <div key={`item-${pageIndex}-${index}`} className="pl-6">
                      <p className="list-item">{item.text}</p>
                    </div>
                  );
                }

                return <p key={`item-${pageIndex}-${index}`}>{item.text}</p>;
              })
            ) : (
              <p>No content yet.</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export function NoteEditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const draftState = (location.state as DraftState | null) ?? null;
  const addNote = useNotesStore((state) => state.addNote);
  const updateNote = useNotesStore((state) => state.updateNote);
  const getNoteById = useNotesStore((state) => state.getNoteById);
  const markNoteSeen = useNotificationsStore((state) => state.markNoteSeen);
  const projects = useProjectsStore((state) => state.projects);
  const tasks = useTasksStore((state) => state.tasks);
  const includeLinkedTodosInExports = useSettingsStore((state) => state.includeLinkedTodosInExports);
  const existingNote = id ? getNoteById(id) : undefined;
  const isNew = !id;

  const initialHtml = useMemo(() => {
    if (existingNote) {
      return existingNote.richContent;
    }

    return draftState?.content?.trim() ? plainTextToHtml(draftState.content) : "<p></p>";
  }, [draftState?.content, existingNote]);

  const initialProjectId = useMemo(
    () => existingNote?.projectId ?? draftState?.projectId ?? "work",
    [draftState?.projectId, existingNote?.projectId],
  );
  const initialAttachments = useMemo(
    () => existingNote?.attachments ?? draftState?.attachments ?? [],
    [draftState?.attachments, existingNote?.attachments],
  );
  const returnTo = draftState?.returnTo ?? "/app";

  const [projectId, setProjectId] = useState(initialProjectId);
  const [attachments, setAttachments] = useState<NoteAttachment[]>(initialAttachments);
  const [content, setContent] = useState(initialHtml);
  const [isSaving, setIsSaving] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [isPdfPreviewOpen, setIsPdfPreviewOpen] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const exportMenuRef = useRef<HTMLDivElement>(null);
  const pdfPreviewRef = useRef<HTMLDivElement>(null);
  const pdfExportRef = useRef<HTMLDivElement>(null);

  const exportText = useMemo(() => htmlToPlainText(content), [content]);
  const exportParagraphs = useMemo(
    () =>
      exportText
        .split(/\n{2,}/)
        .map((paragraph) => paragraph.trim())
        .filter(Boolean),
    [exportText],
  );
  const exportProjectName = useMemo(() => {
    if (!projectId) {
      return "No project";
    }

    return projects.find((project) => project.id === projectId)?.name ?? projectId;
  }, [projectId, projects]);
  const exportTitle = useMemo(() => {
    const noteDate = existingNote ? new Date(existingNote.createdAt) : new Date();
    return formatExportHeading(noteDate, exportProjectName);
  }, [existingNote, exportProjectName]);
  const linkedTasks = useMemo(() => {
    if (isNew || !id) {
      return [];
    }

    return tasks.filter((task) => !task.deletedAt && (task.noteId === id || task.evidenceNoteIds.includes(id)));
  }, [id, isNew, tasks]);

  useEffect(() => {
    setProjectId(initialProjectId);
    setAttachments(initialAttachments);
    setContent(initialHtml);
  }, [initialAttachments, initialHtml, initialProjectId]);

  useEffect(() => {
    if (id) {
      markNoteSeen(id);
    }
  }, [id, markNoteSeen]);

  useEffect(() => {
    if (!isExportMenuOpen) {
      return;
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (!exportMenuRef.current?.contains(event.target as Node)) {
        setIsExportMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isExportMenuOpen]);

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
        navigate(returnTo, { replace: true, state: { focusNoteId: note.id } });
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
      navigate(returnTo, { replace: true, state: { focusNoteId: id } });
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
          <Button variant="ghost" className="rounded-2xl" onClick={() => navigate(returnTo, { replace: true })}>
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div className="relative" ref={exportMenuRef}>
            <Button
              type="button"
              variant="outline"
              className="rounded-2xl"
              onClick={() => setIsExportMenuOpen((current) => !current)}
              disabled={!exportText}
            >
              <Download className="h-4 w-4" />
              Export
            </Button>
            {isExportMenuOpen ? (
              <div className="absolute right-0 top-[calc(100%+0.5rem)] z-20 min-w-[180px] rounded-[20px] border border-slate-200 bg-white p-2 shadow-[0_24px_60px_rgba(15,23,42,0.18)]">
                <button
                  type="button"
                  className="flex w-full rounded-2xl bg-white px-3 py-2 text-left text-sm font-medium text-foreground transition hover:bg-slate-100"
                  onClick={() => {
                    downloadTextNote(exportText);
                    setIsExportMenuOpen(false);
                  }}
                >
                  Export as TXT
                </button>
                <button
                  type="button"
                  className="flex w-full rounded-2xl bg-white px-3 py-2 text-left text-sm font-medium text-foreground transition hover:bg-slate-100"
                  onClick={async () => {
                    if (isExportingPdf) {
                      return;
                    }

                    setIsExportingPdf(true);
                    try {
                      setIsExportMenuOpen(false);
                      setIsPdfPreviewOpen(true);
                    } finally {
                      setIsExportingPdf(false);
                    }
                  }}
                >
                  {isExportingPdf ? "Preparing preview..." : "Export as PDF"}
                </button>
              </div>
            ) : null}
          </div>
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
      <Dialog open={isPdfPreviewOpen} onOpenChange={setIsPdfPreviewOpen}>
        <DialogContent className="max-w-5xl rounded-[36px] p-0">
          <div className="flex max-h-[85vh] flex-col">
            <DialogHeader className="border-b border-border/70 px-6 py-5 sm:px-8">
              <DialogDescription>PDF export preview</DialogDescription>
              <DialogTitle>Review before exporting</DialogTitle>
            </DialogHeader>
            <div className="overflow-y-auto bg-white px-4 py-4 sm:px-6 sm:py-6">
              <div ref={pdfPreviewRef}>
                <NoteExportPreview
                  title={exportTitle}
                  paragraphs={exportParagraphs}
                  linkedTasks={linkedTasks}
                  includeLinkedTodos={includeLinkedTodosInExports}
                  density="preview"
                />
              </div>
              <div
                aria-hidden="true"
                className="pointer-events-none fixed left-[-10000px] top-0 opacity-0"
              >
                <div ref={pdfExportRef}>
                  <NoteExportPreview
                    title={exportTitle}
                    paragraphs={exportParagraphs}
                    linkedTasks={linkedTasks}
                    includeLinkedTodos={includeLinkedTodosInExports}
                    density="pdf"
                  />
                </div>
              </div>
            </div>
            <DialogFooter className="border-t border-border/70 px-6 py-5 sm:px-8">
              <Button type="button" variant="ghost" className="rounded-2xl" onClick={() => setIsPdfPreviewOpen(false)}>
                Close
              </Button>
              <Button
                type="button"
                className="rounded-2xl"
                disabled={isExportingPdf}
                onClick={async () => {
                  if (!pdfExportRef.current || isExportingPdf) {
                    return;
                  }

                  setIsExportingPdf(true);
                  try {
                    await exportPreviewAsPdf(pdfExportRef.current, buildExportFileName(exportTitle));
                    setIsPdfPreviewOpen(false);
                  } finally {
                    setIsExportingPdf(false);
                  }
                }}
              >
                <Download className="h-4 w-4" />
                {isExportingPdf ? "Exporting PDF..." : "Download PDF"}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
