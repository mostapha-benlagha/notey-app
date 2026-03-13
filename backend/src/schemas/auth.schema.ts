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

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
