import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { uploadNoteAttachments } from "@/services/api";
import { useNotesStore } from "@/store/useNotesStore";
import { useNotificationsStore } from "@/store/useNotificationsStore";
import { useProjectsStore } from "@/store/useProjectsStore";
import { useSettingsStore } from "@/store/useSettingsStore";
import { useTasksStore } from "@/store/useTasksStore";
import type { NoteAttachment } from "@/types/note.types";
import { audioBlobToAttachment, toAttachment } from "@/utils/attachments";
import { htmlToPlainText, plainTextToHtml } from "@/utils/noteContent";
import { formatExportHeading } from "@/features/note-editor/export-utils";

export interface DraftState {
  attachments?: NoteAttachment[];
  content?: string;
  projectId?: string;
  returnTo?: string;
}

export function useNoteEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const draftState = (location.state as DraftState | null) ?? null;
  const addNote = useNotesStore((state) => state.addNote);
  const notes = useNotesStore((state) => state.notes);
  const updateNote = useNotesStore((state) => state.updateNote);
  const getNoteById = useNotesStore((state) => state.getNoteById);
  const markNoteSeen = useNotificationsStore((state) => state.markNoteSeen);
  const projects = useProjectsStore((state) => state.projects);
  const tasks = useTasksStore((state) => state.tasks);
  const statuses = useTasksStore((state) => state.statuses);
  const updateTaskDetails = useTasksStore((state) => state.updateTaskDetails);
  const includeLinkedTodosInExports = useSettingsStore((state) => state.includeLinkedTodosInExports);
  const existingNote = id ? getNoteById(id) : undefined;
  const isNew = !id;

  const initialHtml = useMemo(() => {
    if (existingNote) {
      return existingNote.richContent;
    }

    return draftState?.content?.trim() ? plainTextToHtml(draftState.content) : "<p></p>";
  }, [draftState?.content, existingNote]);
  const initialProjectId = useMemo(() => existingNote?.projectId ?? draftState?.projectId ?? "", [draftState?.projectId, existingNote?.projectId]);
  const initialAttachments = useMemo(() => existingNote?.attachments ?? draftState?.attachments ?? [], [draftState?.attachments, existingNote?.attachments]);
  const returnTo = draftState?.returnTo ?? "/app";

  const [projectId, setProjectId] = useState(initialProjectId);
  const [attachments, setAttachments] = useState<NoteAttachment[]>(initialAttachments);
  const [content, setContent] = useState(initialHtml);
  const [isSaving, setIsSaving] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [isPdfPreviewOpen, setIsPdfPreviewOpen] = useState(false);
  const [isLinkedTasksOpen, setIsLinkedTasksOpen] = useState(false);
  const [selectedLinkedTaskId, setSelectedLinkedTaskId] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const exportMenuRef = useRef<HTMLDivElement>(null);
  const pdfPreviewRef = useRef<HTMLDivElement>(null);
  const pdfExportRef = useRef<HTMLDivElement>(null);

  const exportText = useMemo(() => htmlToPlainText(content), [content]);
  const exportParagraphs = useMemo(() => exportText.split(/\n{2,}/).map((paragraph) => paragraph.trim()).filter(Boolean), [exportText]);
  const exportProjectName = useMemo(() => {
    if (!projectId) {
      return "No project";
    }
    return projects.find((project) => project.id === projectId)?.name ?? projectId;
  }, [projectId, projects]);
  const exportTitle = useMemo(() => formatExportHeading(existingNote ? new Date(existingNote.createdAt) : new Date(), exportProjectName), [existingNote, exportProjectName]);
  const linkedTasks = useMemo(() => {
    if (isNew || !id) {
      return [];
    }
    return tasks.filter((task) => !task.deletedAt && (task.noteId === id || task.evidenceNoteIds.includes(id)));
  }, [id, isNew, tasks]);
  const selectedLinkedTask = useMemo(
    () => linkedTasks.find((task) => task.id === selectedLinkedTaskId) ?? null,
    [linkedTasks, selectedLinkedTaskId],
  );
  const taskStatusLabels = useMemo(() => Object.fromEntries(statuses.map((status) => [status.id, status.label])), [statuses]);
  const exportNoteMeta = useMemo(() => {
    const createdAt = existingNote ? new Date(existingNote.createdAt) : new Date();
    const meta = [
      { label: "Project", value: exportProjectName },
      { label: "Created", value: createdAt.toLocaleString() },
      { label: "Tags", value: existingNote?.tags?.length ? existingNote.tags.map((tag) => `#${tag}`).join(", ") : "No tags" },
      { label: "Attachments", value: `${attachments.length}` },
      { label: "Analysis", value: existingNote?.analysis?.status ? existingNote.analysis.status : "Not analyzed yet" },
      { label: "Linked to-dos", value: `${linkedTasks.length}` },
    ];

    if (existingNote?.analysis?.summary) {
      meta.push({ label: "Analysis summary", value: existingNote.analysis.summary });
    }

    return meta;
  }, [attachments.length, existingNote, exportProjectName, linkedTasks.length]);

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

  const handleRecordedAudio = (blob: Blob) => {
    setAttachments((current) => [...current, audioBlobToAttachment(blob)]);
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

  return {
    attachments,
    content,
    existingNote,
    exportMenuRef,
    exportNoteMeta,
    exportParagraphs,
    exportProjectName,
    exportText,
    exportTitle,
    fileInputRef,
    handleFileSelect,
    handleRecordedAudio,
    handleSave,
    imageInputRef,
    includeLinkedTodosInExports,
    initialHtml,
    isExportMenuOpen,
    isExportingPdf,
    isLinkedTasksOpen,
    isNew,
    isPdfPreviewOpen,
    isSaving,
    linkedTasks,
    navigate,
    notes,
    pdfExportRef,
    pdfPreviewRef,
    projects,
    projectId,
    returnTo,
    selectedLinkedTask,
    setContent,
    setIsExportMenuOpen,
    setIsExportingPdf,
    setIsLinkedTasksOpen,
    setIsPdfPreviewOpen,
    setProjectId,
    setSelectedLinkedTaskId,
    taskStatusLabels,
    statuses,
    updateTaskDetails,
  };
}
