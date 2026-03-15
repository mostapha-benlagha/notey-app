import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function ProjectPageDialogs({
  confirmDeleteNoteId,
  confirmDeleteProject,
  onDeleteNote,
  onDeleteProject,
  onOpenDeleteNoteChange,
  onOpenDeleteProjectChange,
}: {
  confirmDeleteNoteId: string | null;
  confirmDeleteProject: boolean;
  onDeleteNote: () => Promise<void>;
  onDeleteProject: () => Promise<void>;
  onOpenDeleteNoteChange: (open: boolean) => void;
  onOpenDeleteProjectChange: (open: boolean) => void;
}) {
  return (
    <>
      <AlertDialog open={confirmDeleteProject} onOpenChange={onOpenDeleteProjectChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this project?</AlertDialogTitle>
            <AlertDialogDescription>
              The project will be removed from your workspace. Notes and tasks currently inside it will stay in the app, but they will become unassigned.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction tone="destructive" onClick={() => void onDeleteProject()}>
              Delete project
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!confirmDeleteNoteId} onOpenChange={onOpenDeleteNoteChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this note?</AlertDialogTitle>
            <AlertDialogDescription>This will remove the note from your workspace and from this project view.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction tone="destructive" onClick={() => void onDeleteNote()}>
              Delete note
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
