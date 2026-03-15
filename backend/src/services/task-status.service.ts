import type { Types } from 'mongoose';
import { TaskStatusModel } from '../models/task-status.model.js';

const defaultTaskStatuses = [
  { id: 'draft', label: 'Draft', colorClass: 'bg-slate-200 text-slate-700', kind: 'system' as const },
  { id: 'todo', label: 'To-do', colorClass: 'bg-sky-100 text-sky-700', kind: 'system' as const },
  { id: 'in-progress', label: 'In progress', colorClass: 'bg-amber-100 text-amber-700', kind: 'system' as const },
  { id: 'done', label: 'Done', colorClass: 'bg-emerald-100 text-emerald-700', kind: 'system' as const },
];

export { defaultTaskStatuses };

export async function ensureTaskStatuses(userId: Types.ObjectId) {
  const existing = await TaskStatusModel.find({ userId }).sort({ order: 1 }).lean();

  if (existing.length) {
    return existing;
  }

  await TaskStatusModel.insertMany(
    defaultTaskStatuses.map((status, index) => ({
      ...status,
      userId,
      order: index,
    }))
  );

  return TaskStatusModel.find({ userId }).sort({ order: 1 }).lean();
}

export async function ensureTaskStatus(userId: Types.ObjectId, statusId: string) {
  const existing = await TaskStatusModel.findOne({ userId, id: statusId }).lean();
  if (existing) {
    return existing;
  }

  const fallback = defaultTaskStatuses.find((status) => status.id === statusId);
  if (!fallback) {
    throw new Error(`Unknown task status: ${statusId}`);
  }

  const order = await TaskStatusModel.countDocuments({ userId });
  await TaskStatusModel.create({
    ...fallback,
    userId,
    order,
  });

  return TaskStatusModel.findOne({ userId, id: statusId }).lean();
}
