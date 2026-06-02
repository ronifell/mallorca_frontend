import { io, Socket } from 'socket.io-client';
import { env } from '../config/env';
import { tokenStorage } from './storage';

let socket: Socket | null = null;

export async function connectSocket(): Promise<Socket | null> {
  if (socket?.connected) return socket;
  const token = await tokenStorage.getAccess();
  if (!token) return null;

  socket = io(env.socketUrl, {
    transports: ['websocket'],
    auth: { token },
    reconnection: true,
    reconnectionAttempts: 8,
    reconnectionDelay: 1_500,
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
