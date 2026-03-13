import type { Request, Response } from 'express';
import { UserModel } from '../../models/user.model.js';
import { SettingsModel } from '../../models/settings.model.js';
import { updateProfileSchema } from '../../schemas/account.schema.js';

function serializeProfile(user: NonNullable<Request['user']>) {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    plan: user.plan,
    onboardingCompleted: Boolean(user.onboardingCompleted),
    joinedAt: user.createdAt.toISOString(),
  };
}

export async function getProfile(request: Request, response: Response) {
  if (!request.user) {
    const error = new Error('Authentication required') as Error & { statusCode?: number };
    error.statusCode = 401;
    throw error;
  }

  response.json({
    ok: true,
    profile: serializeProfile(request.user),
  });
}

export async function updateProfile(request: Request, response: Response) {
  if (!request.user) {
    const error = new Error('Authentication required') as Error & { statusCode?: number };
    error.statusCode = 401;
    throw error;
  }

  const payload = updateProfileSchema.parse(request.body);
  const emailOwner = await UserModel.findOne({
    email: payload.email.toLowerCase(),
    _id: { $ne: request.user._id },
  });

  if (emailOwner) {
    const error = new Error('Email is already used by another account') as Error & { statusCode?: number };
    error.statusCode = 409;
    throw error;
  }

  request.user.email = payload.email.toLowerCase();
  request.user.firstName = payload.firstName;
  request.user.lastName = payload.lastName;
  await request.user.save();

  response.json({
    ok: true,
    profile: serializeProfile(request.user),
  });
}

export async function deleteProfile(request: Request, response: Response) {
  if (!request.user) {
    const error = new Error('Authentication required') as Error & { statusCode?: number };
    error.statusCode = 401;
    throw error;
  }

  await SettingsModel.deleteOne({ userId: request.user._id });
  await UserModel.deleteOne({ _id: request.user._id });

  response.json({
    ok: true,
    message: 'Account deleted',
  });
}
