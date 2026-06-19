import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import React, { useState } from 'react';
import { Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { chatApi, usersApi } from '../../api/endpoints';
import { extractErrorMessage } from '../../api/client';
import { RootStackParamList } from '../../navigation/types';
import { useMatchPopup } from '../../store/matchPopup';
import { MatchModal } from './MatchModal';

type Nav = NativeStackNavigationProp<RootStackParamList>;

/**
 * Single instance of the "It's a match!" modal, mounted once at the root of
 * the authenticated app. It reads from `useMatchPopup` so that any source —
 * the local API response when the user taps the heart, OR the `match:new`
 * socket event when the OTHER user reciprocates — can trigger the same
 * celebration UI without duplicating render logic.
 */
export function GlobalMatchModal() {
  const { t } = useTranslation();
  const nav = useNavigation<Nav>();
  const current = useMatchPopup((s) => s.current);
  const hide = useMatchPopup((s) => s.hide);
  const { data: me } = useQuery({ queryKey: ['me'], queryFn: () => usersApi.me() });
  const [sending, setSending] = useState(false);

  const onSendMessage = async () => {
    if (!current || sending) return;
    const popup = current;
    setSending(true);
    try {
      const conv = await chatApi.ensureConversation(popup.matchId);
      nav.navigate('Conversation', {
        conversationId: conv.id,
        otherName: popup.otherUser.firstName,
        otherUserId: popup.otherUser.id,
        otherUserAge: null,
        otherUserPhoto: popup.otherUser.photo,
      });
    } catch (e) {
      Alert.alert(t('common.error'), extractErrorMessage(e));
    } finally {
      setSending(false);
    }
  };

  return (
    <MatchModal
      visible={current != null}
      name={current?.otherUser.firstName ?? null}
      otherPhoto={current?.otherUser.photo ?? null}
      myPhoto={me?.photos?.[0]?.url ?? null}
      myName={me?.firstName ?? null}
      onSendMessage={onSendMessage}
      onClose={hide}
      sending={sending}
    />
  );
}
