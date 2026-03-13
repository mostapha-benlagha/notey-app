import { Router } from 'express';
import { completeOnboarding } from './onboarding.controller.js';
import { requireAuth } from '../../middleware/require-auth.js';
import { asyncHandler } from '../../utils/async-handler.js';

export const onboardingRouter = Router();

onboardingRouter.use(requireAuth);
onboardingRouter.post('/complete', asyncHandler(completeOnboarding));
