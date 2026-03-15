import { z } from 'zod';

export const signupSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
  firstName: z.string().trim().min(1),
  lastName: z.string().trim().min(1),
});

export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
});

export const verifyTwoFactorSchema = z.object({
  challengeId: z.string().min(1),
  code: z.string().trim().min(6).max(8),
});

export const resendTwoFactorSchema = z.object({
  challengeId: z.string().min(1),
});

export const verifyEmailSchema = z.object({
  token: z.string().min(1),
});

export const resendVerificationSchema = z.object({
  email: z.email(),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
