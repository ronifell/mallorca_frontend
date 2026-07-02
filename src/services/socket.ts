import { io, Socket } from 'socket.io-client';
import { env } from '../config/env';
import { tokenStorage } from './storage';

let socket: Socket | null = null;

export async function connectSocket(): Promise<Socket | null> {
  const token = await tokenStorage.getAccess();
  if (!token) return null;

  if (socket?.connected) return socket;

  if (socket) {
    socket.disconnect();
    socket = null;
  }

  socket = io(env.socketUrl, {
    transports: ['websocket'],
    auth: { token },
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1_500,
    reconnectionDelayMax: 10_000,
  });

  socket.on('connect_error', (err) => {
    console.warn('[socket] connect_error', err.message);
  });

  return socket;
}

export function getSocket(): Socket | null {
  return socket;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}
