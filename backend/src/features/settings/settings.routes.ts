import { Router } from 'express';
import { getSettings, updateSettings } from './settings.controller.js';
import { requireAuth } from '../../middleware/require-auth.js';
import { asyncHandler } from '../../utils/async-handler.js';

export const settingsRouter = Router();

settingsRouter.use(requireAuth);
settingsRouter.get('/', asyncHandler(getSettings));
settingsRouter.patch('/', asyncHandler(updateSettings));
