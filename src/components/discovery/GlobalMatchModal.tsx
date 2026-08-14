import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import React, { useMemo, useState } from 'react';
import { Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { chatApi, matchesApi, usersApi } from '../../api/endpoints';
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
  // Keep "my" profile warm so the match modal can render my photo instantly
  // instead of flashing initials while a fetch resolves.
  const { data: me } = useQuery({
    queryKey: ['me'],
    queryFn: () => usersApi.me(),
    staleTime: 5 * 60 * 1000,
  });
  const { data: matches } = useQuery({
    queryKey: ['matches'],
    queryFn: () => matchesApi.list(),
    enabled: current != null,
    staleTime: 30_000,
  });
  const [sending, setSending] = useState(false);

  const { myPhoto, otherPhoto } = useMemo(() => {
    if (!current) {
      return { myPhoto: null as string | null, otherPhoto: null as string | null };
    }
    const match = matches?.find((m) => m.matchId === current.matchId);
    return {
      myPhoto: me?.photos?.[0]?.url ?? null,
      otherPhoto: match?.otherUser.coverPhoto ?? current.otherUser.photo,
    };
  }, [current, matches, me?.photos]);

  const onSendMessage = async () => {
    if (!current || sending) return;
    const popup = current;
    setSending(true);
    try {
      const conv = await chatApi.ensureConversation(popup.matchId);
      // Navigate FIRST — the new screen slides in on top of the celebration
      // modal, so we get a clean "Match → Chat" sequence with no flash of
      // any intermediate empty screen. We then dismiss the modal so it
      // fades out behind the new Conversation view.
      nav.navigate('Conversation', {
        conversationId: conv.id,
        otherName: popup.otherUser.firstName,
        otherUserId: popup.otherUser.id,
        otherUserAge: null,
        otherUserPhoto: popup.otherUser.photo,
        matchId: popup.matchId,
      });
      hide();
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
      otherPhoto={otherPhoto}
      myPhoto={myPhoto}
      myName={me?.firstName ?? null}
      onSendMessage={onSendMessage}
      onClose={hide}
      sending={sending}
    />
  );
}
