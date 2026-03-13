import { z } from 'zod';

export const settingsSchema = z.object({
  twoFactorEnabled: z.boolean(),
  loginAlertsEnabled: z.boolean(),
  sessionLockEnabled: z.boolean(),
  aiTaggingEnabled: z.boolean(),
  taskExtractionEnabled: z.boolean(),
  reminderEmailsEnabled: z.boolean(),
  digestCadence: z.enum(['off', 'daily', 'weekly']),
  defaultNoteMode: z.enum(['chat', 'full']),
  appStartPage: z.enum(['chat', 'tasks', 'account']),
  compactBoardEnabled: z.boolean(),
  autoOpenLastProject: z.boolean(),
  fullWidthWorkspaceEnabled: z.boolean(),
});

export const updateSettingsSchema = settingsSchema.partial();

export type SettingsInput = z.infer<typeof settingsSchema>;
export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;
