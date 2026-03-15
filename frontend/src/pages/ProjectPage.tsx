import { ProjectPageProvider } from "@/features/project-page/ProjectPageContext";
import { ProjectOverview } from "@/components/projects/ProjectOverview";
import { TaskTrashPanel } from "@/components/tasks/TaskTrashPanel";
import { ProjectPageDialogs } from "@/features/project-page/components/ProjectPageDialogs";
import { ProjectPageHeader } from "@/features/project-page/components/ProjectPageHeader";
import { ProjectPageNotFound } from "@/features/project-page/components/ProjectPageNotFound";
import { ProjectNotesSection } from "@/features/project-page/components/ProjectNotesSection";
import { useProjectPage } from "@/features/project-page/useProjectPage";

export function ProjectPage() {
  const page = useProjectPage();

  if (!page.project) {
    return <ProjectPageNotFound onBrowse={() => page.navigate("/app")} />;
  }

  return (
    <ProjectPageProvider value={page}>
      <div className="flex h-full min-h-0 flex-col gap-6">
        <ProjectPageHeader />
        <div className="min-h-0 flex-1 overflow-y-auto pr-1">
          <div className="space-y-6 pb-6">
            <ProjectOverview project={page.project} notes={page.scopedNotes} tasks={page.scopedTasks} />
            <ProjectNotesSection />
            {!!page.trashedProjectTasks.length && <TaskTrashPanel tasks={page.trashedProjectTasks} statuses={page.statuses} notes={page.notes} projects={page.projects} onRestore={page.restoreTask} onPermanentDelete={page.permanentlyDeleteTask} />}
          </div>
        </div>
        <ProjectPageDialogs
          confirmDeleteNoteId={page.confirmDeleteNoteId}
          confirmDeleteProject={page.confirmDeleteProject}
          onDeleteNote={page.handleDeleteNote}
          onDeleteProject={page.handleDeleteProject}
          onOpenDeleteNoteChange={(open) => page.setConfirmDeleteNoteId(open ? page.confirmDeleteNoteId : null)}
          onOpenDeleteProjectChange={page.setConfirmDeleteProject}
        />
      </div>
    </ProjectPageProvider>
  );
}
