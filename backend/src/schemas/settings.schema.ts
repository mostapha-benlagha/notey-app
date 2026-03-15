import { z } from 'zod';

export const settingsSchema = z.object({
  twoFactorEnabled: z.boolean(),
  twoFactorMethod: z.enum(['email', 'authenticator']),
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
  includeLinkedTodosInExports: z.boolean(),
});

export const updateSettingsSchema = settingsSchema.partial();

export const verifyAuthenticatorSetupSchema = z.object({
  code: z.string().trim().min(6).max(8),
});

export type SettingsInput = z.infer<typeof settingsSchema>;
export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;
