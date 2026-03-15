import type { IncomingMessage } from 'node:http';
import { WebSocketServer, type WebSocket } from 'ws';
import { logger } from '../config/logger.js';
import { serializeNote } from '../features/notes/note.serializer.js';
import { serializeTask } from '../features/tasks/task.serializer.js';
import type { NoteDocument } from '../models/note.model.js';
import type { TaskDocument } from '../models/task.model.js';
import { UserModel } from '../models/user.model.js';
import { verifyAccessToken } from '../utils/token.js';

interface AuthenticatedSocket extends WebSocket {
  userId?: string;
}

const socketsByUserId = new Map<string, Set<AuthenticatedSocket>>();

export function createRealtimeServer() {
  const server = new WebSocketServer({ noServer: true });

  server.on('connection', (socket: AuthenticatedSocket, request) => {
    const userId = socket.userId;
    if (!userId) {
      socket.close(1008, 'Authentication required');
      return;
    }

    const connections = socketsByUserId.get(userId) ?? new Set<AuthenticatedSocket>();
    connections.add(socket);
    socketsByUserId.set(userId, connections);

    socket.send(
      JSON.stringify({
        type: 'realtime.connected',
      }),
    );

    socket.on('close', () => {
      const userConnections = socketsByUserId.get(userId);
      if (!userConnections) {
        return;
      }

      userConnections.delete(socket);
      if (userConnections.size === 0) {
        socketsByUserId.delete(userId);
      }
    });

    socket.on('error', (error) => {
      logger.warn({ err: error, userId }, 'Realtime socket error');
    });

    logger.debug({ userId, ip: request.socket.remoteAddress }, 'Realtime socket connected');
  });

  return server;
}

export async function authenticateRealtimeRequest(request: IncomingMessage) {
  const url = new URL(request.url ?? '/', 'http://127.0.0.1');
  const token = url.searchParams.get('token');

  if (!token) {
    return null;
  }

  try {
    const payload = verifyAccessToken(token);
    const user = await UserModel.findById(payload.sub).lean();
    return user?._id.toString() ?? null;
  } catch {
    return null;
  }
}

function broadcastToUser(userId: string, payload: object) {
  const sockets = socketsByUserId.get(userId);
  if (!sockets?.size) {
    return;
  }

  const message = JSON.stringify(payload);
  sockets.forEach((socket) => {
    if (socket.readyState === socket.OPEN) {
      socket.send(message);
    }
  });
}

export function publishNoteAnalysisUpdate(input: {
  userId: string;
  note: NoteDocument;
  tasks: TaskDocument[];
}) {
  broadcastToUser(input.userId, {
    type: 'analysis.updated',
    note: serializeNote(input.note),
    tasks: input.tasks.map(serializeTask),
  });
}
