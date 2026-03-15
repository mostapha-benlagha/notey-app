import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useFlowSpaceContext } from "@/features/flow-space/FlowSpaceContext";

type CreateKind = "project" | "tag" | "task";

export function FlowCreateDialog() {
  const {
    createPanelOpen,
    createProjectNode,
    createTagNode,
    createTaskNode,
    notes,
    projects,
    setCreatePanelOpen,
    statuses,
  } = useFlowSpaceContext();

  const [kind, setKind] = useState<CreateKind>("project");
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [tagLabel, setTagLabel] = useState("");
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [taskProjectId, setTaskProjectId] = useState("");
  const [taskStatusId, setTaskStatusId] = useState("");
  const [taskNoteId, setTaskNoteId] = useState("");

  const noteOptions = useMemo(
    () => notes.filter((note) => !taskProjectId || note.projectId === taskProjectId),
    [notes, taskProjectId],
  );

  useEffect(() => {
    if (createPanelOpen) {
      setTaskProjectId((current) => current || projects[0]?.id || "");
      setTaskStatusId((current) => current || statuses[0]?.id || "draft");
      return;
    }

    setKind("project");
    setProjectName("");
    setProjectDescription("");
    setTagLabel("");
    setTaskTitle("");
    setTaskDescription("");
    setTaskProjectId(projects[0]?.id || "");
    setTaskStatusId(statuses[0]?.id || "draft");
    setTaskNoteId("");
  }, [createPanelOpen, projects, statuses]);

  return (
    <Dialog open={createPanelOpen} onOpenChange={setCreatePanelOpen}>
      <DialogContent className="left-auto right-0 top-0 h-dvh max-h-dvh overflow-y-auto translate-x-0 translate-y-0 rounded-none border-y-0 border-r-0 border-l border-white/80 p-0 sm:max-w-[480px]">
        <div className="flex h-full flex-col bg-white/96">
          <DialogHeader className="border-b border-border/70 px-6 py-5">
            <DialogTitle className="text-2xl">Add to Flow</DialogTitle>
            <DialogDescription>
              Create a project, a tag, or a to-do directly from the workspace, then keep shaping the graph from there.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 space-y-6 px-6 py-6">
            <label className="grid gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Item type</span>
              <Select value={kind} onChange={(event) => setKind(event.target.value as CreateKind)}>
                <option value="project">Project</option>
                <option value="tag">Tag</option>
                <option value="task">To-do</option>
              </Select>
            </label>

            {kind === "project" ? (
              <section className="grid gap-4 rounded-[24px] border border-border bg-secondary/25 p-4">
                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-foreground">Project name</span>
                  <Input value={projectName} onChange={(event) => setProjectName(event.target.value)} placeholder="Platform rollout" />
                </label>
                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-foreground">Description</span>
                  <Textarea
                    value={projectDescription}
                    onChange={(event) => setProjectDescription(event.target.value)}
                    placeholder="Add a short summary so the project card has context in Flow."
                  />
                </label>
              </section>
            ) : null}

            {kind === "tag" ? (
              <section className="grid gap-4 rounded-[24px] border border-border bg-secondary/25 p-4">
                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-foreground">Tag label</span>
                  <Input value={tagLabel} onChange={(event) => setTagLabel(event.target.value)} placeholder="deployment" />
                </label>
                <p className="text-sm leading-7 text-muted-foreground">
                  Standalone tags stay in Flow so you can attach them to notes or to-dos later by drawing links.
                </p>
              </section>
            ) : null}

            {kind === "task" ? (
              <section className="grid gap-4 rounded-[24px] border border-border bg-secondary/25 p-4">
                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-foreground">To-do title</span>
                  <Input value={taskTitle} onChange={(event) => setTaskTitle(event.target.value)} placeholder="Prepare rollout checklist" />
                </label>
                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-foreground">Description</span>
                  <Textarea
                    value={taskDescription}
                    onChange={(event) => setTaskDescription(event.target.value)}
                    placeholder="Optional context for the task details."
                  />
                </label>
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="grid gap-2">
                    <span className="text-sm font-semibold text-foreground">Project</span>
                    <Select value={taskProjectId} onChange={(event) => setTaskProjectId(event.target.value)}>
                      <option value="">No project</option>
                      {projects.map((project) => (
                        <option key={project.id} value={project.id}>
                          {project.name}
                        </option>
                      ))}
                    </Select>
                  </label>
                  <label className="grid gap-2">
                    <span className="text-sm font-semibold text-foreground">Status</span>
                    <Select value={taskStatusId} onChange={(event) => setTaskStatusId(event.target.value)}>
                      {statuses.map((status) => (
                        <option key={status.id} value={status.id}>
                          {status.label}
                        </option>
                      ))}
                    </Select>
                  </label>
                </div>
                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-foreground">Linked note</span>
                  <Select value={taskNoteId} onChange={(event) => setTaskNoteId(event.target.value)}>
                    <option value="">No note linked yet</option>
                    {noteOptions.map((note) => (
                      <option key={note.id} value={note.id}>
                        {note.content.slice(0, 72)}
                      </option>
                    ))}
                  </Select>
                </label>
              </section>
            ) : null}
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-border/70 px-6 py-4">
            <Button type="button" variant="ghost" className="rounded-2xl" onClick={() => setCreatePanelOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              className="rounded-2xl"
              disabled={
                (kind === "project" && !projectName.trim()) ||
                (kind === "tag" && !tagLabel.trim()) ||
                (kind === "task" && !taskTitle.trim())
              }
              onClick={async () => {
                if (kind === "project") {
                  await createProjectNode({
                    name: projectName.trim(),
                    description: projectDescription.trim(),
                  });
                }

                if (kind === "tag") {
                  createTagNode(tagLabel.trim());
                }

                if (kind === "task") {
                  await createTaskNode({
                    title: taskTitle.trim(),
                    description: taskDescription.trim(),
                    projectId: taskProjectId,
                    noteId: taskNoteId || null,
                    statusId: taskStatusId,
                  });
                }

                setCreatePanelOpen(false);
              }}
            >
              Create {kind === "task" ? "to-do" : kind}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
