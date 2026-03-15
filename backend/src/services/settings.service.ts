import type { SettingsDocument, SettingsModelShape } from '../models/settings.model.js';

type SettingsLike = SettingsDocument | (SettingsModelShape & { _id?: unknown; createdAt?: Date; updatedAt?: Date });

export function serializeSettings(settings: SettingsLike) {
  return {
    twoFactorEnabled: settings.twoFactorEnabled,
    twoFactorMethod: settings.twoFactorMethod ?? 'email',
    authenticatorAppEnabled: Boolean(settings.authenticatorSecret),
    loginAlertsEnabled: settings.loginAlertsEnabled,
    sessionLockEnabled: settings.sessionLockEnabled,
    aiTaggingEnabled: settings.aiTaggingEnabled,
    taskExtractionEnabled: settings.taskExtractionEnabled,
    reminderEmailsEnabled: settings.reminderEmailsEnabled,
    digestCadence: settings.digestCadence,
    defaultNoteMode: settings.defaultNoteMode,
    appStartPage: settings.appStartPage,
    compactBoardEnabled: settings.compactBoardEnabled,
    autoOpenLastProject: settings.autoOpenLastProject,
    fullWidthWorkspaceEnabled: settings.fullWidthWorkspaceEnabled,
    includeLinkedTodosInExports: settings.includeLinkedTodosInExports,
  };
}
