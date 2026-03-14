import crypto from 'node:crypto';
import type { Request, Response } from 'express';
import { env } from '../../config/env.js';
import { logger } from '../../config/logger.js';
import { UserModel } from '../../models/user.model.js';
import { loginSchema, resendVerificationSchema, signupSchema, verifyEmailSchema } from '../../schemas/auth.schema.js';
import { sendEmailVerificationEmail } from '../../services/mail.service.js';
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
  emailVerified: boolean;
  onboardingCompleted: boolean;
  createdAt?: Date;
}) {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    plan: user.plan,
    emailVerified: Boolean(user.emailVerified),
    onboardingCompleted: Boolean(user.onboardingCompleted),
    joinedAt: user.createdAt?.toISOString() ?? new Date().toISOString(),
  };
}

function createHttpError(message: string, statusCode: number, code?: string) {
  const error = new Error(message) as Error & { statusCode?: number; code?: string };
  error.statusCode = statusCode;
  error.code = code;
  return error;
}

function createVerificationToken() {
  const token = crypto.randomBytes(32).toString('hex');
  return {
    token,
    tokenHash: crypto.createHash('sha256').update(token).digest('hex'),
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
  };
}

function getVerificationUrl(token: string) {
  return `${env.CLIENT_URL}/verify-email?token=${encodeURIComponent(token)}`;
}

async function issueVerificationForUser(user: { _id: unknown; email: string; firstName: string }) {
  const verification = createVerificationToken();
  await UserModel.updateOne(
    { _id: user._id },
    {
      $set: {
        emailVerificationTokenHash: verification.tokenHash,
        emailVerificationExpiresAt: verification.expiresAt,
      },
    }
  );

  const verificationUrl = getVerificationUrl(verification.token);
  const emailSent = await sendEmailVerificationEmail({
    to: user.email,
    firstName: user.firstName,
    verificationUrl,
  });

  logger.info(
    {
      email: user.email,
      verificationUrl,
      emailSent,
      expiresAt: verification.expiresAt.toISOString(),
    },
    'Email verification link generated'
  );

  return {
    verificationUrl,
    expiresAt: verification.expiresAt,
  };
}

export async function signup(request: Request, response: Response) {
  const payload = signupSchema.parse(request.body);
  const existingUser = await UserModel.findOne({ email: payload.email.toLowerCase() });

  if (existingUser) {
    throw createHttpError('An account already exists for this email', 409, 'EMAIL_ALREADY_EXISTS');
  }

  const passwordHash = await hashPassword(payload.password);
  const user = await UserModel.create({
    email: payload.email.toLowerCase(),
    passwordHash,
    firstName: payload.firstName,
    lastName: payload.lastName,
  });

  await ensureUserSettings(user._id);
  await issueVerificationForUser(user);

  response.status(201).json({
    ok: true,
    email: user.email,
    verificationRequired: true,
  });
}

export async function login(request: Request, response: Response) {
  const payload = loginSchema.parse(request.body);
  const user = await UserModel.findOne({ email: payload.email.toLowerCase() });

  if (!user || !(await verifyPassword(payload.password, user.passwordHash))) {
    throw createHttpError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
  }

  if (!user.emailVerified) {
    throw createHttpError('Verify your email before logging in.', 403, 'EMAIL_NOT_VERIFIED');
  }

  await ensureUserSettings(user._id);

  response.json({
    ok: true,
    token: signAccessToken({ sub: user.id }),
    user: serializeUser(user),
  });
}

export async function verifyEmail(request: Request, response: Response) {
  const payload = verifyEmailSchema.parse(request.body);
  const tokenHash = crypto.createHash('sha256').update(payload.token).digest('hex');
  const user = await UserModel.findOne({
    emailVerificationTokenHash: tokenHash,
    emailVerificationExpiresAt: { $gt: new Date() },
  });

  if (!user) {
    throw createHttpError('This verification link is invalid or has expired.', 400, 'INVALID_VERIFICATION_TOKEN');
  }

  user.emailVerified = true;
  user.emailVerificationTokenHash = undefined;
  user.emailVerificationExpiresAt = undefined;
  await user.save();
  await ensureUserSettings(user._id);

  response.json({
    ok: true,
    token: signAccessToken({ sub: user.id }),
    user: serializeUser(user),
  });
}

export async function resendVerification(request: Request, response: Response) {
  const payload = resendVerificationSchema.parse(request.body);
  const user = await UserModel.findOne({ email: payload.email.toLowerCase() });

  if (!user) {
    throw createHttpError('No account exists for this email.', 404, 'ACCOUNT_NOT_FOUND');
  }

  if (user.emailVerified) {
    throw createHttpError('This email is already verified.', 409, 'EMAIL_ALREADY_VERIFIED');
  }

  await issueVerificationForUser(user);

  response.json({
    ok: true,
    email: user.email,
    verificationRequired: true,
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
