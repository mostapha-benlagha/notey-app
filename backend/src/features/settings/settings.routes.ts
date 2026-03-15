import { Router } from 'express';
import { createAuthenticatorSetup, getSettings, updateSettings, verifyAuthenticatorSetup } from './settings.controller.js';
import { requireAuth } from '../../middleware/require-auth.js';
import { asyncHandler } from '../../utils/async-handler.js';

export const settingsRouter = Router();

settingsRouter.use(requireAuth);
settingsRouter.get('/', asyncHandler(getSettings));
settingsRouter.patch('/', asyncHandler(updateSettings));
settingsRouter.post('/two-factor/authenticator/setup', asyncHandler(createAuthenticatorSetup));
settingsRouter.post('/two-factor/authenticator/verify', asyncHandler(verifyAuthenticatorSetup));
