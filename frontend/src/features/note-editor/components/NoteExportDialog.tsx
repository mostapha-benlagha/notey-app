import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useNoteEditorContext } from "@/features/note-editor/NoteEditorContext";
import { buildExportFileName, exportPreviewAsPdf, NoteExportPreview } from "@/features/note-editor/export-utils";

export function NoteExportDialog() {
  const {
    exportNoteMeta,
    exportParagraphs,
    exportTitle,
    includeLinkedTodosInExports,
    isExportingPdf,
    isPdfPreviewOpen,
    linkedTasks,
    pdfExportRef,
    pdfPreviewRef,
    setIsExportingPdf,
    setIsPdfPreviewOpen,
    taskStatusLabels,
  } = useNoteEditorContext();

  return (
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
                noteMeta={exportNoteMeta}
                taskStatusLabels={taskStatusLabels}
              />
            </div>
            <div aria-hidden="true" className="pointer-events-none fixed left-[-10000px] top-0 opacity-0">
              <div ref={pdfExportRef}>
                <NoteExportPreview
                  title={exportTitle}
                  paragraphs={exportParagraphs}
                  linkedTasks={linkedTasks}
                  includeLinkedTodos={includeLinkedTodosInExports}
                  density="pdf"
                  noteMeta={exportNoteMeta}
                  taskStatusLabels={taskStatusLabels}
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
  );
}
