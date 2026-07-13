import { AppState } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Match, Message } from '../api/types';
import { getActiveConversationId } from '../services/activeConversation';
import { syncRecentMatchPopups } from '../services/matchSync';
import { showMessageNotification } from '../services/notifications';
import { connectSocket } from '../services/socket';
import { useAuthStore } from '../store/auth';
import { MatchPopupPayload, useMatchPopup } from '../store/matchPopup';

function previewForMessage(message: Message, t: (k: string) => string): string {
  if (message.type === 'text' && message.text?.trim()) {
    return message.text.trim();
  }
  if (message.type === 'image') return t('chat.pushPreviewImage');
  if (message.type === 'audio') return t('chat.pushPreviewAudio');
  return t('chat.pushPreviewGeneric');
}

function senderNameForConversation(
  matches: Match[] | undefined,
  conversationId: string,
  fallback: string,
): string {
  const match = matches?.find((m) => m.conversationId === conversationId);
  return match?.otherUser.firstName?.trim() || fallback;
}

/**
 * Global, app-wide socket listener that keeps the matches/chat list in sync
 * with the server. Without this, the matches query is only refetched when the
 * user manually pulls to refresh, so new conversations / unread counts / last
 * message previews don't appear after sending or receiving messages.
 *
 * Also shows a local notification when a message, like, or super like arrives
 * while the app is open (FCM alone is unreliable in the Android foreground).
 * Every user-facing string is routed through i18n so the notifications match
 * the rest of the (Spanish) app.
 */
export function useChatSync() {
  const qc = useQueryClient();
  const { t } = useTranslation();
  const showMatchPopup = useMatchPopup((s) => s.show);

  useEffect(() => {
    let active = true;
    let cleanup: (() => void) | null = null;

    const attachListeners = async () => {
      const s = await connectSocket();
      if (!active || !s) return;

      const onMessage = (m: Message & { conversationId?: string }) => {
        qc.invalidateQueries({ queryKey: ['matches'] });

        const myId = useAuthStore.getState().user?.id;
        const conversationId = m.conversationId;
        if (!myId || !conversationId || m.senderId === myId) return;
        if (conversationId === getActiveConversationId()) return;
        // Background delivery is handled by FCM; socket only drives foreground banners.
        if (AppState.currentState !== 'active') return;

        const matches = qc.getQueryData<Match[]>(['matches']);
        const title = senderNameForConversation(
          matches,
          conversationId,
          t('chat.pushDefaultSenderTitle'),
        );
        const body = previewForMessage(m, t);
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

        if (AppState.currentState !== 'active') return;

        const name = payload.fromName?.trim();
        void showMessageNotification(
          t('chat.pushLikeTitle'),
          name ? t('chat.pushLikeBody', { name }) : t('chat.pushLikeBodyAnonymous'),
          {
            type: 'new_like',
            fromUserId: payload.fromUserId,
          },
        );
      };
      const onSuperLike = (payload: { fromUserId?: string; fromName?: string | null }) => {
        if (!payload?.fromUserId) return;
        const myId = useAuthStore.getState().user?.id;
        if (myId && payload.fromUserId === myId) return;

        qc.invalidateQueries({ queryKey: ['matches'] });
        qc.invalidateQueries({ queryKey: ['feed'] });
        qc.invalidateQueries({ queryKey: ['likes'] });

        if (AppState.currentState !== 'active') return;

        void showMessageNotification(
          t('chat.pushSuperLikeTitle'),
          t('chat.pushSuperLikeBody'),
          {
            type: 'super_like',
            fromUserId: payload.fromUserId,
          },
        );
      };
      const onMatch = (payload: MatchPopupPayload) => {
        if (!payload?.matchId || !payload.otherUser) return;
        qc.invalidateQueries({ queryKey: ['matches'] });
        qc.invalidateQueries({ queryKey: ['feed'] });
        showMatchPopup(payload);

        if (AppState.currentState !== 'active') return;
        const name = payload.otherUser.firstName?.trim();
        void showMessageNotification(
          t('chat.pushMatchTitle'),
          name ? t('chat.pushMatchBody', { name }) : t('chat.pushMatchBodyAnonymous'),
          {
            type: 'new_match',
            matchId: payload.matchId,
          },
        );
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

    const appStateSub = AppState.addEventListener('change', (state) => {
      if (state !== 'active') return;
      cleanup?.();
      void attachListeners();
    });

    return () => {
      active = false;
      appStateSub.remove();
      cleanup?.();
    };
  }, [qc, showMatchPopup, t]);
}
