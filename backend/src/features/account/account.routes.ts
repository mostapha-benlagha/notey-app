import { Router } from 'express';
import { deleteProfile, getProfile, updateProfile } from './account.controller.js';
import { requireAuth } from '../../middleware/require-auth.js';
import { asyncHandler } from '../../utils/async-handler.js';

export const accountRouter = Router();

accountRouter.use(requireAuth);
accountRouter.get('/profile', asyncHandler(getProfile));
accountRouter.patch('/profile', asyncHandler(updateProfile));
accountRouter.delete('/profile', asyncHandler(deleteProfile));
