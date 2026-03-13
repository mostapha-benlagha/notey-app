import type { NextFunction, Request, Response } from 'express';
import { UserModel } from '../models/user.model.js';
import { verifyAccessToken } from '../utils/token.js';

export async function requireAuth(request: Request, _response: Response, next: NextFunction) {
  try {
    const authorization = request.headers.authorization;

    if (!authorization?.startsWith('Bearer ')) {
      const error = new Error('Authentication required') as Error & { statusCode?: number };
      error.statusCode = 401;
      throw error;
    }

    const token = authorization.replace('Bearer ', '').trim();
    const payload = verifyAccessToken(token);
    const user = await UserModel.findById(payload.sub);

    if (!user) {
      const error = new Error('User not found') as Error & { statusCode?: number };
      error.statusCode = 401;
      throw error;
    }

    request.user = user;
    next();
  } catch {
    const error = new Error('Invalid or expired token') as Error & { statusCode?: number };
    error.statusCode = 401;
    next(error);
  }
}
