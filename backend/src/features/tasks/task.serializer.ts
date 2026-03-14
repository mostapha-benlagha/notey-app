import type { TaskModelShape } from '../../models/task.model.js';
import type { TaskStatusModelShape } from '../../models/task-status.model.js';

type SerializableTask = TaskModelShape & { _id: { toString(): string } };
type SerializableTaskStatus = TaskStatusModelShape & { _id: { toString(): string } };

export function serializeTask(task: SerializableTask) {
  return {
    id: task._id.toString(),
    title: task.title,
    description: task.description ?? '',
    statusId: task.statusId,
    projectId: task.projectId,
    noteId: task.noteId ?? null,
    source: task.source ?? 'manual',
    tags: Array.isArray(task.tags) ? task.tags : [],
    order: typeof task.order === 'number' ? task.order : 0,
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
