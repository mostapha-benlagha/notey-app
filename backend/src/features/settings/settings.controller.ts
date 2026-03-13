import type { Request, Response } from 'express';
import { SettingsModel } from '../../models/settings.model.js';
import { updateSettingsSchema } from '../../schemas/settings.schema.js';
import { ensureUserSettings } from '../../services/user-settings.service.js';

export async function getSettings(request: Request, response: Response) {
  if (!request.user) {
    const error = new Error('Authentication required') as Error & { statusCode?: number };
    error.statusCode = 401;
    throw error;
  }

  const settings = await ensureUserSettings(request.user._id);

  response.json({
    ok: true,
    settings,
  });
}

export async function updateSettings(request: Request, response: Response) {
  if (!request.user) {
    const error = new Error('Authentication required') as Error & { statusCode?: number };
    error.statusCode = 401;
    throw error;
  }

  const payload = updateSettingsSchema.parse(request.body);

  const settings = await SettingsModel.findOneAndUpdate(
    { userId: request.user._id },
    { $set: payload, $setOnInsert: { userId: request.user._id } },
    { new: true, upsert: true }
  ).lean();

  response.json({
    ok: true,
    settings,
  });
}
