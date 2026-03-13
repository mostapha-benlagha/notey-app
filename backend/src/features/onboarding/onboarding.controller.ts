import type { Request, Response } from 'express';
import { UserModel } from '../../models/user.model.js';

export async function completeOnboarding(request: Request, response: Response) {
  if (!request.user) {
    const error = new Error('Authentication required') as Error & { statusCode?: number };
    error.statusCode = 401;
    throw error;
  }

  const user = await UserModel.findByIdAndUpdate(
    request.user._id,
    { $set: { onboardingCompleted: true } },
    { new: true }
  );

  if (!user) {
    const error = new Error('User not found') as Error & { statusCode?: number };
    error.statusCode = 404;
    throw error;
  }

  response.json({
    ok: true,
    onboardingCompleted: user.onboardingCompleted,
  });
}
