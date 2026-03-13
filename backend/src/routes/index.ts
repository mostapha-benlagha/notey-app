import { Router } from 'express';
import { accountRouter } from '../features/account/account.routes.js';
import { authRouter } from '../features/auth/auth.routes.js';
import { onboardingRouter } from '../features/onboarding/onboarding.routes.js';
import { settingsRouter } from '../features/settings/settings.routes.js';
import { healthRouter } from './health.js';

export const apiRouter = Router();

apiRouter.get('/', (_request, response) => {
  response.json({
    ok: true,
    message: 'Notey API is running',
  });
});

apiRouter.use('/health', healthRouter);
apiRouter.use('/auth', authRouter);
apiRouter.use('/account', accountRouter);
apiRouter.use('/onboarding', onboardingRouter);
apiRouter.use('/settings', settingsRouter);
