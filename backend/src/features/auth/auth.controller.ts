import type { Request, Response } from 'express';
import { UserModel } from '../../models/user.model.js';
import { signupSchema, loginSchema } from '../../schemas/auth.schema.js';
import { ensureUserSettings } from '../../services/user-settings.service.js';
import { hashPassword, verifyPassword } from '../../utils/password.js';
import { signAccessToken } from '../../utils/token.js';

function serializeUser(user: {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  plan: string;
  createdAt?: Date;
}) {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    plan: user.plan,
    joinedAt: user.createdAt?.toISOString() ?? new Date().toISOString(),
  };
}

export async function signup(request: Request, response: Response) {
  const payload = signupSchema.parse(request.body);
  const existingUser = await UserModel.findOne({ email: payload.email.toLowerCase() });

  if (existingUser) {
    const error = new Error('An account already exists for this email') as Error & { statusCode?: number };
    error.statusCode = 409;
    throw error;
  }

  const passwordHash = await hashPassword(payload.password);
  const user = await UserModel.create({
    email: payload.email.toLowerCase(),
    passwordHash,
    firstName: payload.firstName,
    lastName: payload.lastName,
  });

  await ensureUserSettings(user._id);

  response.status(201).json({
    ok: true,
    token: signAccessToken({ sub: user.id }),
    user: serializeUser(user),
  });
}

export async function login(request: Request, response: Response) {
  const payload = loginSchema.parse(request.body);
  const user = await UserModel.findOne({ email: payload.email.toLowerCase() });

  if (!user || !(await verifyPassword(payload.password, user.passwordHash))) {
    const error = new Error('Invalid email or password') as Error & { statusCode?: number };
    error.statusCode = 401;
    throw error;
  }

  await ensureUserSettings(user._id);

  response.json({
    ok: true,
    token: signAccessToken({ sub: user.id }),
    user: serializeUser(user),
  });
}

export async function me(request: Request, response: Response) {
  const user = request.user;

  if (!user) {
    const error = new Error('Authentication required') as Error & { statusCode?: number };
    error.statusCode = 401;
    throw error;
  }

  response.json({
    ok: true,
    user: serializeUser(user),
  });
}
