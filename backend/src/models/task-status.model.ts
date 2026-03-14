import { Schema, model, type HydratedDocument, type InferSchemaType, type Types } from 'mongoose';

const taskStatusSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    id: {
      type: String,
      required: true,
      trim: true,
    },
    label: {
      type: String,
      required: true,
      trim: true,
    },
    colorClass: {
      type: String,
      required: true,
      trim: true,
    },
    kind: {
      type: String,
      enum: ['system', 'custom'],
      required: true,
    },
    order: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

taskStatusSchema.index({ userId: 1, id: 1 }, { unique: true });

export type TaskStatusModelShape = InferSchemaType<typeof taskStatusSchema> & {
  userId: Types.ObjectId;
};
export type TaskStatusDocument = HydratedDocument<TaskStatusModelShape>;

export const TaskStatusModel = model<TaskStatusModelShape>('TaskStatus', taskStatusSchema);
