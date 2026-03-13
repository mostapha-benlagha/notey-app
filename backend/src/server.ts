import { createApp } from './app.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { connectToDatabase } from './db/mongoose.js';

async function bootstrap() {
  await connectToDatabase();

  const app = createApp();
  app.listen(env.PORT, () => {
    logger.info(`Notey backend listening on http://127.0.0.1:${env.PORT}`);
  });
}

bootstrap().catch((error) => {
  logger.error({ err: error }, 'Failed to start backend');
  process.exit(1);
});
