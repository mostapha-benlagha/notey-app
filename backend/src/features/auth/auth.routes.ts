import { Router } from 'express';
import { login, me, resendTwoFactor, resendVerification, signup, verifyEmail, verifyTwoFactor } from './auth.controller.js';
import { asyncHandler } from '../../utils/async-handler.js';
import { requireAuth } from '../../middleware/require-auth.js';

export const authRouter = Router();

authRouter.post('/signup', asyncHandler(signup));
authRouter.post('/login', asyncHandler(login));
authRouter.post('/2fa/verify', asyncHandler(verifyTwoFactor));
authRouter.post('/2fa/resend', asyncHandler(resendTwoFactor));
authRouter.post('/verify-email', asyncHandler(verifyEmail));
authRouter.post('/resend-verification', asyncHandler(resendVerification));
authRouter.get('/me', requireAuth, asyncHandler(me));
