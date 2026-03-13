export type DigestCadence = "off" | "daily" | "weekly";
export type DefaultNoteMode = "chat" | "full";
export type AppStartPage = "chat" | "tasks" | "account";

export interface Settings {
  twoFactorEnabled: boolean;
  loginAlertsEnabled: boolean;
  sessionLockEnabled: boolean;
  aiTaggingEnabled: boolean;
  taskExtractionEnabled: boolean;
  reminderEmailsEnabled: boolean;
  digestCadence: DigestCadence;
  defaultNoteMode: DefaultNoteMode;
  appStartPage: AppStartPage;
  compactBoardEnabled: boolean;
  autoOpenLastProject: boolean;
  fullWidthWorkspaceEnabled: boolean;
}
