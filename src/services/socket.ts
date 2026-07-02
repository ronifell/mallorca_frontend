import { io, Socket } from 'socket.io-client';
import { env } from '../config/env';
import { tokenStorage } from './storage';

let socket: Socket | null = null;
let connectPromise: Promise<Socket | null> | null = null;

function waitForConnect(sock: Socket, timeoutMs = 15_000): Promise<void> {
  if (sock.connected) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      cleanup();
      reject(new Error('Socket connect timeout'));
    }, timeoutMs);

    const onConnect = () => {
      cleanup();
      resolve();
    };

    const onError = (err: Error) => {
      cleanup();
      reject(err);
    };

    const cleanup = () => {
      clearTimeout(timer);
      sock.off('connect', onConnect);
      sock.off('connect_error', onError);
    };

    sock.on('connect', onConnect);
    sock.on('connect_error', onError);
  });
}

export async function connectSocket(): Promise<Socket | null> {
  const token = await tokenStorage.getAccess();
  if (!token) return null;

  if (socket?.connected) return socket;

  if (connectPromise) return connectPromise;

  connectPromise = (async () => {
    try {
      if (!socket) {
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
      } else {
        socket.auth = { token };
        if (!socket.connected) {
          socket.connect();
        }
      }

      await waitForConnect(socket);
      return socket;
    } catch (err) {
      console.warn('[socket] connect failed', err);
      return null;
    } finally {
      connectPromise = null;
    }
  })();

  return connectPromise;
}

export function getSocket(): Socket | null {
  return socket;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
  connectPromise = null;
}
