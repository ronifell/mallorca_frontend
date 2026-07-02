import { AppState } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { Match, Message } from '../api/types';
import { getActiveConversationId } from '../services/activeConversation';
import { showMessageNotification } from '../services/notifications';
import { connectSocket } from '../services/socket';
import { useAuthStore } from '../store/auth';
import { MatchPopupPayload, useMatchPopup } from '../store/matchPopup';

function previewForMessage(message: Message): string {
  if (message.type === 'text' && message.text?.trim()) {
    return message.text.trim();
  }
  if (message.type === 'image') return 'Sent a photo';
  if (message.type === 'audio') return 'Sent a voice message';
  return 'You received a new message.';
}

function senderNameForConversation(
  matches: Match[] | undefined,
  conversationId: string,
): string {
  const match = matches?.find((m) => m.conversationId === conversationId);
  return match?.otherUser.firstName?.trim() || 'Citas Mallorca';
}

function superLikeBody(fromName: string | null | undefined): string {
  const name = fromName?.trim();
  return name
    ? `${name} sent you a Super Like.`
    : 'Someone sent you a Super Like.';
}

function newLikeBody(fromName: string | null | undefined): string {
  const name = fromName?.trim();
  return name ? `${name} liked you.` : 'Someone liked you.';
}

/**
 * Global, app-wide socket listener that keeps the matches/chat list in sync
 * with the server. Without this, the matches query is only refetched when the
 * user manually pulls to refresh, so new conversations / unread counts / last
 * message previews don't appear after sending or receiving messages.
 *
 * Also shows a local notification when a message, like, or super like arrives
 * while the app is open (FCM alone is unreliable in the Android foreground).
 */
export function useChatSync() {
  const qc = useQueryClient();
  const showMatchPopup = useMatchPopup((s) => s.show);

  useEffect(() => {
    let active = true;
    let cleanup: (() => void) | null = null;

    const attachListeners = async () => {
      const s = await connectSocket();
      if (!active || !s) return null;

      const onMessage = (m: Message & { conversationId?: string }) => {
        qc.invalidateQueries({ queryKey: ['matches'] });

        const myId = useAuthStore.getState().user?.id;
        const conversationId = m.conversationId;
        if (!myId || !conversationId || m.senderId === myId) return;
        if (conversationId === getActiveConversationId()) return;

        const matches = qc.getQueryData<Match[]>(['matches']);
        const title = senderNameForConversation(matches, conversationId);
        const body = previewForMessage(m);
        void showMessageNotification(title, body, {
          type: 'new_message',
          conversationId,
        });
      };
      const onRead = () => {
        qc.invalidateQueries({ queryKey: ['matches'] });
      };
      const onNewLike = (payload: { fromUserId?: string; fromName?: string | null }) => {
        if (!payload?.fromUserId) return;
        const myId = useAuthStore.getState().user?.id;
        if (myId && payload.fromUserId === myId) return;

        qc.invalidateQueries({ queryKey: ['likes'] });
        qc.invalidateQueries({ queryKey: ['feed'] });

        void showMessageNotification('💖 New Like!', newLikeBody(payload.fromName), {
          type: 'new_like',
          fromUserId: payload.fromUserId,
        });
      };
      const onSuperLike = (payload: { fromUserId?: string; fromName?: string | null }) => {
        if (!payload?.fromUserId) return;
        const myId = useAuthStore.getState().user?.id;
        if (myId && payload.fromUserId === myId) return;

        qc.invalidateQueries({ queryKey: ['matches'] });
        qc.invalidateQueries({ queryKey: ['feed'] });
        qc.invalidateQueries({ queryKey: ['likes'] });

        void showMessageNotification('⭐ Super Like!', superLikeBody(payload.fromName), {
          type: 'super_like',
          fromUserId: payload.fromUserId,
        });
      };
      const onMatch = (payload: MatchPopupPayload) => {
        if (!payload?.matchId || !payload.otherUser) return;
        qc.invalidateQueries({ queryKey: ['matches'] });
        qc.invalidateQueries({ queryKey: ['feed'] });
        showMatchPopup(payload);
      };

      s.on('message:new', onMessage);
      s.on('message:read', onRead);
      s.on('like:new', onNewLike);
      s.on('super_like:new', onSuperLike);
      s.on('match:new', onMatch);

      cleanup = () => {
        s.off('message:new', onMessage);
        s.off('message:read', onRead);
        s.off('like:new', onNewLike);
        s.off('super_like:new', onSuperLike);
        s.off('match:new', onMatch);
      };

      return cleanup;
    };

    void attachListeners();

    const appStateSub = AppState.addEventListener('change', (state) => {
      if (state !== 'active') return;
      cleanup?.();
      cleanup = null;
      void attachListeners();
    });

    return () => {
      active = false;
      appStateSub.remove();
      cleanup?.();
    };
  }, [qc, showMatchPopup]);
}
