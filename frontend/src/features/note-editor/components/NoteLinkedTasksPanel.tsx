import { Bot, Link2, ListTodo, SquarePen } from "lucide-react";
import { TaskDetailsDialog } from "@/components/tasks/TaskDetailsDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { TagChip } from "@/components/ui/tag-chip";
import { useNoteEditorContext } from "@/features/note-editor/NoteEditorContext";

export function NoteLinkedTasksPanel() {
  const {
    isLinkedTasksOpen,
    linkedTasks,
    notes,
    projects,
    selectedLinkedTask,
    setIsLinkedTasksOpen,
    setSelectedLinkedTaskId,
    statuses,
    updateTaskDetails,
  } = useNoteEditorContext();

  return (
    <>
      <Dialog open={isLinkedTasksOpen} onOpenChange={setIsLinkedTasksOpen}>
        <DialogContent className="left-auto right-0 top-0 h-dvh max-h-dvh overflow-y-auto translate-x-0 translate-y-0 rounded-none border-y-0 border-r-0 border-l border-white/80 p-0 sm:max-w-[460px]">
          <div className="flex h-full flex-col bg-white/96">
            <DialogHeader className="border-b border-border/70 px-6 py-5">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-secondary/60 text-primary">
                  <ListTodo className="h-5 w-5" />
                </span>
                <div>
                  <DialogTitle className="text-2xl">Linked tasks</DialogTitle>
                  <DialogDescription>
                    Review all to-dos connected to this note, then open one to edit or relink it.
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="flex-1 space-y-4 px-6 py-6">
              {linkedTasks.length ? (
                linkedTasks.map((task) => {
                  const status = statuses.find((item) => item.id === task.statusId);
                  return (
                    <button
                      key={task.id}
                      type="button"
                      className="grid w-full gap-3 rounded-[24px] border border-border bg-white p-4 text-left shadow-soft transition hover:border-primary/30 hover:bg-secondary/20"
                      onClick={() => setSelectedLinkedTaskId(task.id)}
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge className={status?.colorClass}>{status?.label ?? "Task"}</Badge>
                        <Badge variant="outline" className="gap-1 rounded-full">
                          {task.source === "note_ai" ? <Bot className="h-3 w-3" /> : <SquarePen className="h-3 w-3" />}
                          {task.source === "note_ai" ? "AI" : "Manual"}
                        </Badge>
                        {task.noteId ? (
                          <Badge variant="outline" className="gap-1 rounded-full">
                            <Link2 className="h-3 w-3" />
                            Linked
                          </Badge>
                        ) : null}
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-foreground">{task.title}</p>
                        {task.description ? <p className="text-sm leading-6 text-muted-foreground">{task.description}</p> : null}
                      </div>
                      {task.tags.length ? (
                        <div className="flex flex-wrap gap-2">
                          {task.tags.map((tag) => (
                            <TagChip key={`${task.id}-${tag}`} tag={tag} />
                          ))}
                        </div>
                      ) : null}
                    </button>
                  );
                })
              ) : (
                <div className="rounded-[24px] border border-dashed border-border bg-secondary/20 p-5 text-sm text-muted-foreground">
                  This note does not have any linked tasks yet.
                </div>
              )}
            </div>

            <div className="border-t border-border/70 px-6 py-4">
              <Button type="button" className="w-full rounded-2xl" variant="ghost" onClick={() => setIsLinkedTasksOpen(false)}>
                Close panel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <TaskDetailsDialog
        open={!!selectedLinkedTask}
        task={selectedLinkedTask}
        statuses={statuses}
        notes={notes}
        projects={projects}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedLinkedTaskId(null);
          }
        }}
        onSave={updateTaskDetails}
      />
    </>
  );
}
