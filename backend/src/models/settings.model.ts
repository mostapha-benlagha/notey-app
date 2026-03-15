import { Schema, model, type InferSchemaType, type HydratedDocument, Types } from 'mongoose';

const settingsSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    twoFactorEnabled: { type: Boolean, default: false },
    twoFactorMethod: { type: String, enum: ['email', 'authenticator'], default: 'email' },
    authenticatorSecret: { type: String },
    authenticatorPendingSecret: { type: String },
    loginAlertsEnabled: { type: Boolean, default: true },
    sessionLockEnabled: { type: Boolean, default: true },
    aiTaggingEnabled: { type: Boolean, default: true },
    taskExtractionEnabled: { type: Boolean, default: true },
    reminderEmailsEnabled: { type: Boolean, default: true },
    digestCadence: { type: String, enum: ['off', 'daily', 'weekly'], default: 'weekly' },
    defaultNoteMode: { type: String, enum: ['chat', 'full'], default: 'chat' },
    appStartPage: { type: String, enum: ['chat', 'tasks', 'account'], default: 'chat' },
    compactBoardEnabled: { type: Boolean, default: false },
    autoOpenLastProject: { type: Boolean, default: true },
    fullWidthWorkspaceEnabled: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

export type SettingsModelShape = InferSchemaType<typeof settingsSchema> & {
  userId: Types.ObjectId;
};
export type SettingsDocument = HydratedDocument<SettingsModelShape>;

export const SettingsModel = model<SettingsModelShape>('UserSettings', settingsSchema);
