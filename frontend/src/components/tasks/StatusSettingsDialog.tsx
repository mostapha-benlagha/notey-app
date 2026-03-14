import { useEffect, useState } from "react";
import { ArrowDown, ArrowUp, Plus, Settings2, Trash2 } from "lucide-react";
import { taskStatusColorOptions } from "@/components/tasks/statusOptions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { TaskStatus } from "@/types/task.types";

interface EditableStatus extends TaskStatus {
}

export function StatusSettingsDialog({
  statuses,
  onSave,
}: {
  statuses: TaskStatus[];
  onSave: (statuses: TaskStatus[]) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [draftStatuses, setDraftStatuses] = useState<EditableStatus[]>(statuses);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setDraftStatuses(statuses);
    }
  }, [open, statuses]);

  const updateStatus = (statusId: string, updater: (status: EditableStatus) => EditableStatus) => {
    setDraftStatuses((current) => current.map((status) => (status.id === statusId ? updater(status) : status)));
  };

  const moveStatus = (statusId: string, direction: "up" | "down") => {
    setDraftStatuses((current) => {
      const next = [...current];
      const index = next.findIndex((status) => status.id === statusId);
      const swapIndex = direction === "up" ? index - 1 : index + 1;

      if (index < 0 || swapIndex < 0 || swapIndex >= next.length) {
        return current;
      }

      [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
      return next;
    });
  };

  const addDraftStatus = () => {
    setDraftStatuses((current) => [
      ...current,
      {
        id: `custom-${Date.now()}`,
        label: "New status",
        colorClass: "bg-violet-100 text-violet-700",
        kind: "custom",
      },
    ]);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="rounded-2xl">
          <Settings2 className="h-4 w-4" />
          Manage statuses
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Status settings</DialogTitle>
          <DialogDescription>
            Rename statuses, change their colors, reorder the board, or create new columns. If you delete a status, its tasks move to the previous available column.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {draftStatuses.map((status, index) => {
            return (
              <div key={status.id} className="rounded-[28px] border border-white/80 bg-secondary/40 p-4">
                <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px_auto]">
                  <Input
                    value={status.label}
                    onChange={(event) =>
                      updateStatus(status.id, (current) => ({
                        ...current,
                        label: event.target.value,
                      }))
                    }
                  />
                  <Select
                    value={status.colorClass}
                    onChange={(event) =>
                      updateStatus(status.id, (current) => ({
                        ...current,
                        colorClass: event.target.value,
                      }))
                    }
                  >
                    {taskStatusColorOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Select>
                  <div className="flex gap-2">
                    <Button type="button" variant="ghost" size="icon" className="h-10 w-10 rounded-2xl" onClick={() => moveStatus(status.id, "up")} disabled={index === 0}>
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 rounded-2xl"
                      onClick={() => moveStatus(status.id, "down")}
                      disabled={index === draftStatuses.length - 1}
                    >
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 rounded-2xl text-rose-600 hover:bg-rose-50"
                      onClick={() => setDraftStatuses((current) => current.filter((item) => item.id !== status.id))}
                      disabled={draftStatuses.length <= 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="mt-4">
                  <Badge className={status.colorClass}>{status.label || "Unnamed status"}</Badge>
                </div>
              </div>
            );
          })}
        </div>
        <DialogFooter className="justify-between">
          <Button type="button" variant="ghost" className="rounded-2xl" onClick={addDraftStatus}>
            <Plus className="h-4 w-4" />
            Add status in dialog
          </Button>
          <div className="flex gap-2">
            <Button type="button" variant="ghost" className="rounded-2xl" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              className="rounded-2xl"
              disabled={isSaving}
              onClick={async () => {
                setIsSaving(true);
                try {
                  await onSave(
                  draftStatuses.map((status) => ({
                    colorClass: status.colorClass,
                    id: status.id,
                    kind: status.kind,
                    label: status.label.trim() || "Untitled status",
                  })),
                  );
                  setOpen(false);
                } finally {
                  setIsSaving(false);
                }
              }}
            >
              {isSaving ? "Saving..." : "Save statuses"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
