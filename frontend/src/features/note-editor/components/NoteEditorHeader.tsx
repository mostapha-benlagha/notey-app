import { ArrowLeft, Download, Link2, Save } from "lucide-react";
import { useNoteEditorContext } from "@/features/note-editor/NoteEditorContext";
import { downloadTextNote } from "@/features/note-editor/export-utils";
import { Button } from "@/components/ui/button";
import { CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function NoteEditorHeader() {
  const { exportText, isExportMenuOpen, isExportingPdf, isLinkedTasksOpen, isNew, isSaving, linkedTasks, navigate, returnTo, setIsExportMenuOpen, setIsExportingPdf, setIsLinkedTasksOpen, setIsPdfPreviewOpen, handleSave, exportMenuRef } =
    useNoteEditorContext();

  return (
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
        {!isNew ? (
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="rounded-2xl"
            aria-label="Open linked tasks"
            title="Open linked tasks"
            onClick={() => setIsLinkedTasksOpen(true)}
            data-active={isLinkedTasksOpen ? "true" : "false"}
          >
            <Link2 className="h-4 w-4" />
            <span className="sr-only">Linked tasks ({linkedTasks.length})</span>
          </Button>
        ) : null}
        <div className="relative" ref={exportMenuRef}>
          <Button type="button" variant="outline" className="rounded-2xl" onClick={() => setIsExportMenuOpen((current) => !current)} disabled={!exportText}>
            <Download className="h-4 w-4" />
            Export
          </Button>
          {isExportMenuOpen ? <NoteEditorExportMenu /> : null}
        </div>
        <Button className="rounded-2xl" onClick={() => void handleSave()} disabled={isSaving}>
          <Save className="h-4 w-4" />
          {isSaving ? "Saving..." : "Save note"}
        </Button>
      </div>
    </CardHeader>
  );
}

function NoteEditorExportMenu() {
  const { exportText, isExportingPdf, setIsExportMenuOpen, setIsExportingPdf, setIsPdfPreviewOpen } = useNoteEditorContext();

  return (
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
  );
}
