import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { Message } from '../api/types';
import { connectSocket } from '../services/socket';

/**
 * Global, app-wide socket listener that keeps the matches/chat list in sync
 * with the server. Without this, the matches query is only refetched when the
 * user manually pulls to refresh, so new conversations / unread counts / last
 * message previews don't appear after sending or receiving messages.
 *
 * Should be mounted once for the lifetime of the authenticated session.
 */
export function useChatSync() {
  const qc = useQueryClient();

  useEffect(() => {
    let active = true;
    let cleanup: (() => void) | null = null;

    (async () => {
      const s = await connectSocket();
      if (!active || !s) return;

      const onMessage = (_m: Message & { conversationId?: string }) => {
        qc.invalidateQueries({ queryKey: ['matches'] });
      };
      const onRead = () => {
        qc.invalidateQueries({ queryKey: ['matches'] });
      };

      s.on('message:new', onMessage);
      s.on('message:read', onRead);

      cleanup = () => {
        s.off('message:new', onMessage);
        s.off('message:read', onRead);
      };
    })();

    return () => {
      active = false;
      cleanup?.();
    };
  }, [qc]);
}
