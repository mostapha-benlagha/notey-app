import { Schema, model, type HydratedDocument, type InferSchemaType, type Types } from 'mongoose';

const noteAttachmentSchema = new Schema(
  {
    id: {
      type: String,
      required: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    kind: {
      type: String,
      enum: ['image', 'file', 'audio'],
      required: true,
    },
    sizeLabel: {
      type: String,
      required: true,
      trim: true,
    },
    objectKey: {
      type: String,
      required: true,
      trim: true,
    },
    url: {
      type: String,
      required: true,
      trim: true,
    },
    mimeType: {
      type: String,
      trim: true,
    },
  },
  {
    _id: false,
  }
);

const noteSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'User',
      index: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    richContent: {
      type: String,
      required: true,
      trim: true,
    },
    projectId: {
      type: String,
      required: true,
      trim: true,
    },
    tags: {
      type: [String],
      default: [],
    },
    attachments: {
      type: [noteAttachmentSchema],
      default: [],
    },
    analysis: {
      status: {
        type: String,
        enum: ['idle', 'pending', 'completed', 'failed'],
        default: 'idle',
      },
      summary: {
        type: String,
        default: '',
        trim: true,
      },
      lastAnalyzedAt: {
        type: Date,
        default: null,
      },
    },
  },
  {
    timestamps: true,
  }
);

export type NoteModelShape = InferSchemaType<typeof noteSchema>;
export type NoteDocument = HydratedDocument<NoteModelShape>;
export type NoteLean = NoteModelShape & { _id: Types.ObjectId; createdAt: Date; updatedAt: Date };

export const NoteModel = model<NoteModelShape>('Note', noteSchema);
