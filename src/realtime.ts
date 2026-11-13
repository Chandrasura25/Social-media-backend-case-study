import http from 'http';
import { Server } from 'socket.io';
import Notification, { NotificationType } from './models/Notification';
import { verifyJwt } from './utils/authMiddleware';

let io: Server | null = null;

const room = (userId: string) => `user:${userId}`;

/**
 * Socket.IO server. Clients connect with `auth: { token }`; each socket joins its own user room,
 * so notifications are delivered only to the person they're for.
 */
export function attachRealtime(server: http.Server): Server {
  io = new Server(server, { cors: { origin: '*' } });

  io.use((socket, next) => {
    try {
      socket.data.userId = verifyJwt(String(socket.handshake.auth?.token ?? ''));
      next();
    } catch {
      next(new Error('Unauthorized'));
    }
  });

  io.on('connection', async (socket) => {
    const userId: string = socket.data.userId;
    socket.join(room(userId));

    const unread = await Notification.find({ recipient: userId, read: false }).sort({ createdAt: -1 }).lean();
    socket.emit('notifications', unread);
  });

  return io;
}

/** Saves a notification and pushes it to the recipient in real time. Skips self-notifications. */
export async function notify(params: {
  recipient: string;
  actor: string;
  type: NotificationType;
  postId?: string;
}): Promise<void> {
  if (String(params.recipient) === String(params.actor)) return;

  const notification = await Notification.create(params);
  io?.to(room(String(params.recipient))).emit('notification', notification.toObject());
}
