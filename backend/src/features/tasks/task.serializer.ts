import type { TaskModelShape } from '../../models/task.model.js';
import type { TaskStatusModelShape } from '../../models/task-status.model.js';

type SerializableTask = TaskModelShape & { _id: { toString(): string } };
type SerializableTaskStatus = TaskStatusModelShape & { _id: { toString(): string } };

export function serializeTask(task: SerializableTask) {
  return {
    id: task._id.toString(),
    title: task.title,
    statusId: task.statusId,
    projectId: task.projectId,
    noteId: task.noteId ?? null,
    source: task.source,
    deletedAt: task.deletedAt ? task.deletedAt.toISOString() : null,
  };
}

export function serializeTaskStatus(status: SerializableTaskStatus) {
  return {
    id: status.id,
    label: status.label,
    colorClass: status.colorClass,
    kind: status.kind,
  };
}
