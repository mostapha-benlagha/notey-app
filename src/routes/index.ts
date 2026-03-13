import { Router } from 'express';
import { healthRouter } from './health.js';

export const apiRouter = Router();

apiRouter.get('/', (_request, response) => {
  response.json({
    ok: true,
    message: 'Notey API is running',
  });
});

apiRouter.use('/health', healthRouter);
