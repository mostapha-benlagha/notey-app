import { createApp } from './app.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { connectToDatabase } from './db/mongoose.js';
import { authenticateRealtimeRequest, createRealtimeServer } from './services/realtime.service.js';
import { createServer } from 'node:http';

async function bootstrap() {
  await connectToDatabase();

  const app = createApp();
  const server = createServer(app);
  const realtimeServer = createRealtimeServer();

  server.on('upgrade', async (request, socket, head) => {
    if (!request.url?.startsWith('/ws')) {
      socket.destroy();
      return;
    }

    const userId = await authenticateRealtimeRequest(request);
    if (!userId) {
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
      socket.destroy();
      return;
    }

    realtimeServer.handleUpgrade(request, socket, head, (client) => {
      const authenticatedClient = client as typeof client & { userId?: string };
      authenticatedClient.userId = userId;
      realtimeServer.emit('connection', authenticatedClient, request);
    });
  });

  server.listen(env.PORT, () => {
    logger.info(`Notey backend listening on http://127.0.0.1:${env.PORT}`);
  });
}

bootstrap().catch((error) => {
  logger.error({ err: error }, 'Failed to start backend');
  process.exit(1);
});
