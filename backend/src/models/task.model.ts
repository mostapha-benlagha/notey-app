import { Schema, model, type HydratedDocument, type InferSchemaType, type Types } from 'mongoose';

const taskSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'User',
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    statusId: {
      type: String,
      required: true,
      trim: true,
    },
    projectId: {
      type: String,
      default: '',
      trim: true,
    },
    noteId: {
      type: String,
      default: null,
      trim: true,
    },
    source: {
      type: String,
      enum: ['manual', 'note_ai'],
      required: true,
      default: 'manual',
    },
    tags: {
      type: [String],
      default: [],
    },
    evidenceNoteIds: {
      type: [String],
      default: [],
    },
    order: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

export type TaskModelShape = InferSchemaType<typeof taskSchema> & {
  userId: Types.ObjectId;
};
export type TaskDocument = HydratedDocument<TaskModelShape>;

export const TaskModel = model<TaskModelShape>('Task', taskSchema);
