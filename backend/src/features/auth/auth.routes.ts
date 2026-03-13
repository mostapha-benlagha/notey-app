import { Router } from 'express';
import { login, me, signup } from './auth.controller.js';
import { asyncHandler } from '../../utils/async-handler.js';
import { requireAuth } from '../../middleware/require-auth.js';

export const authRouter = Router();

authRouter.post('/signup', asyncHandler(signup));
authRouter.post('/login', asyncHandler(login));
authRouter.get('/me', requireAuth, asyncHandler(me));
