import { Types } from 'mongoose';
import { SettingsModel } from '../models/settings.model.js';

export async function ensureUserSettings(userId: string | Types.ObjectId) {
  const normalizedUserId = typeof userId === 'string' ? new Types.ObjectId(userId) : userId;

  const settings = await SettingsModel.findOneAndUpdate(
    { userId: normalizedUserId },
    { $setOnInsert: { userId: normalizedUserId } },
    { new: true, upsert: true }
  ).lean();

  return settings;
}
