import { Router } from 'express';
import { accountRouter } from '../features/account/account.routes.js';
import { authRouter } from '../features/auth/auth.routes.js';
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
apiRouter.use('/settings', settingsRouter);
