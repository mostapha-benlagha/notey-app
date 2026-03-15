import { type ReactNode } from "react";
import type { Task } from "@/types/task.types";
import {
  EXPORT_PAGE_CHARS_PER_LINE,
  EXPORT_PAGE_MAX_CHARS_PER_CHUNK,
  PDF_FIRST_PAGE_CAPACITY,
  PDF_FOLLOWING_PAGE_CAPACITY,
  PREVIEW_FIRST_PAGE_CAPACITY,
  PREVIEW_FOLLOWING_PAGE_CAPACITY,
  type ExportPageData,
  type ExportPageItem,
} from "@/features/note-editor/constants";
import { summarizeNoteContent } from "@/utils/noteContent";

export function buildExportFileName(text: string) {
  return summarizeNoteContent(text, 32).replace(/[^a-z0-9]+/gi, "-") || "note";
}

export function formatExportHeading(date: Date, projectName: string) {
  return `${date.toLocaleDateString()} - ${projectName}`;
}

export function downloadTextNote(text: string) {
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

export function buildExportPages(
  paragraphs: string[],
  linkedTasks: Task[],
  includeLinkedTodos: boolean,
  density: "preview" | "pdf",
  taskStatusLabels: Record<string, string>,
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
      const taskWeight =
        estimateExportItemWeight(task.title, 1) +
        estimateExportItemWeight(task.description || "", 1) +
        estimateExportItemWeight(`${taskStatusLabels[task.statusId] ?? task.statusId} ${task.source}`, 1);
      pushItem({ kind: "todo", task, taskStatusLabel: taskStatusLabels[task.statusId] ?? task.statusId }, taskWeight);
    });
  }

  return pages;
}

export async function exportPreviewAsPdf(container: HTMLElement, fileName: string) {
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

export interface NoteExportPreviewProps {
  title: string;
  paragraphs: string[];
  linkedTasks: Task[];
  includeLinkedTodos: boolean;
  density: "preview" | "pdf";
  noteMeta: Array<{ label: string; value: string }>;
  taskStatusLabels: Record<string, string>;
}

export function NoteExportPreview({
  title,
  paragraphs,
  linkedTasks,
  includeLinkedTodos,
  density,
  noteMeta,
  taskStatusLabels,
}: NoteExportPreviewProps) {
  const pages = buildExportPages(paragraphs, linkedTasks, includeLinkedTodos, density, taskStatusLabels);
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
              <p className={isPdfDensity ? "mt-2.5 text-[0.65rem] font-semibold tracking-[0.04em] text-muted-foreground" : "mt-3 text-xs font-semibold tracking-[0.04em] text-muted-foreground"}>
                Exported from Notey on {new Date().toLocaleString()}
              </p>
              {!!noteMeta.length ? (
                <div className={isPdfDensity ? "mt-5 space-y-1.5 text-[0.72rem] leading-5 text-muted-foreground" : "mt-6 space-y-2 text-[0.82rem] leading-6 text-muted-foreground"}>
                  {noteMeta.map((item) => (
                    <p key={item.label}>
                      <span className="font-semibold">{item.label}:</span> <span className="text-foreground">{item.value}</span>
                    </p>
                  ))}
                </div>
              ) : null}
            </>
          ) : null}
          <div
            className={
              isPdfDensity
                ? "mt-6 space-y-2.5 text-[0.84rem] leading-6 text-foreground"
                : page.showHeader
                  ? "mt-8 space-y-4 text-[0.98rem] leading-8 text-foreground"
                  : "space-y-4 text-[0.98rem] leading-8 text-foreground"
            }
          >
            {page.items.length ? (
              page.items.map((item, index): ReactNode => {
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
                  const task = item.task;
                  if (!task) {
                    return null;
                  }

                  return (
                    <div key={`item-${pageIndex}-${index}`}>
                      <p className="font-semibold text-foreground">{task.title}</p>
                      <p className={isPdfDensity ? "text-[0.72rem] text-muted-foreground" : "text-[0.78rem] text-muted-foreground"}>
                        Status: {item.taskStatusLabel} | Source: {task.source === "note_ai" ? "Created by AI" : "Created manually"}
                      </p>
                      {task.description ? (
                        <p className={isPdfDensity ? "mt-1 text-[0.78rem] leading-5 text-foreground" : "mt-1 text-[0.88rem] leading-6 text-foreground"}>
                          {task.description}
                        </p>
                      ) : null}
                      {task.tags.length ? (
                        <p className={isPdfDensity ? "mt-1 text-[0.72rem] text-muted-foreground" : "mt-1 text-[0.78rem] text-muted-foreground"}>
                          Tags: {task.tags.map((tag) => `#${tag}`).join(", ")}
                        </p>
                      ) : null}
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
