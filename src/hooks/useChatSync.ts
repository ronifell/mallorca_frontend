import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { syncRecentMatchPopups } from '../services/matchSync';
import { connectSocket } from '../services/socket';
import { MatchPopupPayload, useMatchPopup } from '../store/matchPopup';

/**
 * Global, app-wide socket listener that keeps the matches/chat list in sync
 * with the server. Without this, the matches query is only refetched when the
 * user manually pulls to refresh, so new conversations / unread counts / last
 * message previews don't appear after sending or receiving messages.
 *
 * Push banners (foreground, background, and killed) are delivered via FCM;
 * the notification handler in notifications.ts shows them even while the app is open.
 */
export function useChatSync() {
  const qc = useQueryClient();
  const showMatchPopup = useMatchPopup((s) => s.show);

  useEffect(() => {
    let active = true;
    let cleanup: (() => void) | null = null;

    const attachListeners = async () => {
      const s = await connectSocket();
      if (!active || !s) return;

      const onMessage = () => {
        qc.invalidateQueries({ queryKey: ['matches'] });
      };
      const onRead = () => {
        qc.invalidateQueries({ queryKey: ['matches'] });
      };
      const onNewLike = (payload: { fromUserId?: string; fromName?: string | null }) => {
        if (!payload?.fromUserId) return;

        qc.invalidateQueries({ queryKey: ['likes'] });
        qc.invalidateQueries({ queryKey: ['feed'] });
      };
      const onSuperLike = (payload: { fromUserId?: string; fromName?: string | null }) => {
        if (!payload?.fromUserId) return;

        qc.invalidateQueries({ queryKey: ['matches'] });
        qc.invalidateQueries({ queryKey: ['feed'] });
        qc.invalidateQueries({ queryKey: ['likes'] });
      };
      const onMatch = (payload: MatchPopupPayload) => {
        if (!payload?.matchId || !payload.otherUser) return;
        qc.invalidateQueries({ queryKey: ['matches'] });
        qc.invalidateQueries({ queryKey: ['feed'] });
        showMatchPopup(payload);
      };
      const onConnect = () => {
        void syncRecentMatchPopups();
      };

      s.on('message:new', onMessage);
      s.on('message:read', onRead);
      s.on('like:new', onNewLike);
      s.on('super_like:new', onSuperLike);
      s.on('match:new', onMatch);
      s.on('connect', onConnect);

      cleanup = () => {
        s.off('message:new', onMessage);
        s.off('message:read', onRead);
        s.off('like:new', onNewLike);
        s.off('super_like:new', onSuperLike);
        s.off('match:new', onMatch);
        s.off('connect', onConnect);
      };

      if (s.connected) {
        void syncRecentMatchPopups();
      }
    };

    void attachListeners();

    return () => {
      active = false;
      cleanup?.();
    };
  }, [qc, showMatchPopup]);
}
