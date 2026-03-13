import { Schema, model, type InferSchemaType, type HydratedDocument } from 'mongoose';

const userSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      default: 'Founder',
    },
    plan: {
      type: String,
      default: 'Pro Trial',
    },
    onboardingCompleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export type UserModelShape = InferSchemaType<typeof userSchema>;
export type UserDocument = HydratedDocument<UserModelShape>;

export const UserModel = model<UserModelShape>('User', userSchema);
