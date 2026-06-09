import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Text, View } from 'react-native';
import { discoveryApi, chatApi } from '../../api/endpoints';
import { FeedCandidate } from '../../api/types';
import { Button } from '../../components/Button';
import { DiscoveryActionButtons } from '../../components/discovery/DiscoveryActionButtons';
import { DiscoveryHeader } from '../../components/discovery/DiscoveryHeader';
import {
  DiscoveryMode,
  DiscoveryModeToggle,
} from '../../components/discovery/DiscoveryModeToggle';
import { Screen } from '../../components/Screen';
import { SwipeCard } from '../../components/SwipeCard';
import { RootStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function DiscoveryScreen() {
  const { t } = useTranslation();
  const nav = useNavigation<Nav>();
  const qc = useQueryClient();
  const [mode, setMode] = useState<DiscoveryMode>('discover');
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['feed'],
    queryFn: () => discoveryApi.feed(20),
  });

  const [deck, setDeck] = useState<FeedCandidate[]>([]);
  const [isRetrying, setIsRetrying] = useState(false);
  const [matchPopup, setMatchPopup] = useState<{ id: string; name: string | null; matchId: string } | null>(
    null,
  );

  useEffect(() => {
    if (data) setDeck(data);
  }, [data]);

  const top = deck[0];
  const next = deck[1];

  const advance = () => setDeck((prev) => prev.slice(1));

  const handleSwipe = async (dir: 'left' | 'right') => {
    if (!top) return;
    const candidate = top;
    advance();
    Haptics.impactAsync(
      dir === 'right' ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light,
    ).catch(() => undefined);
    try {
      if (dir === 'right') {
        const res = await discoveryApi.like(candidate.id);
        if (res.matched && res.matchId) {
          setMatchPopup({ id: candidate.id, name: candidate.firstName, matchId: res.matchId });
          qc.invalidateQueries({ queryKey: ['matches'] });
        }
      } else {
        await discoveryApi.pass(candidate.id);
      }
    } catch {
      // Networking failures are non-fatal here: the next call will resync.
    }
    if (deck.length <= 3) refetch();
  };

  const openChat = async () => {
    if (!matchPopup) return;
    const conv = await chatApi.ensureConversation(matchPopup.matchId);
    setMatchPopup(null);
    nav.navigate('Conversation', {
      conversationId: conv.id,
      otherName: matchPopup.name,
      otherUserId: matchPopup.id,
      otherUserAge: null,
      otherUserPhoto: null,
    });
  };

  const openCandidateProfile = (candidate: FeedCandidate) => {
    nav.navigate('CandidateProfile', { candidate });
  };

  const handleSuperLike = () => {
    Alert.alert(t('discovery.superLike'), t('discovery.superLikeComingSoon'));
  };

  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      await discoveryApi.resetFeed();
      setDeck([]);
      const { data: users } = await refetch();
      if (users) setDeck(users);
    } catch {
      Alert.alert(t('common.error'), t('discovery.retryFailed'));
    } finally {
      setIsRetrying(false);
    }
  };

  return (
    <Screen padded={false}>
      <DiscoveryHeader />
      <DiscoveryModeToggle mode={mode} onChange={setMode} />

      <View className="flex-1 px-5">
        {mode === 'likedYou' ? (
          <View className="flex-1 items-center justify-center px-4">
            <Text className="text-ink-700 text-center text-lg font-semibold mb-2">
              {t('discovery.likedYou')}
            </Text>
            <Text className="text-ink-400 text-center">{t('discovery.likedYouEmpty')}</Text>
          </View>
        ) : isLoading ? (
          <View className="flex-1 items-center justify-center">
            <Text className="text-ink-400">{t('discovery.loading')}</Text>
          </View>
        ) : top ? (
          <View className="flex-1 items-center justify-center">
            <View className="w-full max-w-md relative">
              {next ? (
                <View
                  className="absolute inset-0 opacity-50"
                  style={{ transform: [{ scale: 0.96 }] }}
                  pointerEvents="none"
                >
                  <SwipeCard candidate={next} onSwipe={() => undefined} swipeable={false} />
                </View>
              ) : null}
              <SwipeCard
                candidate={top}
                onSwipe={handleSwipe}
                onInfoPress={() => openCandidateProfile(top)}
                onCardPress={() => openCandidateProfile(top)}
              />
            </View>

            <DiscoveryActionButtons
              onPass={() => handleSwipe('left')}
              onLike={() => handleSwipe('right')}
              onSuperLike={handleSuperLike}
            />
          </View>
        ) : (
          <View className="flex-1 items-center justify-center">
            <Text className="text-ink-700 text-center text-lg">{t('discovery.empty')}</Text>
            <View className="h-4" />
            <Button
              label={t('common.retry')}
              variant="secondary"
              onPress={handleRetry}
              disabled={isRetrying}
            />
          </View>
        )}
      </View>

      {matchPopup ? (
        <View className="absolute inset-0 bg-ink-900/70 items-center justify-center px-8">
          <View className="bg-cream-100 rounded-3xl p-6 w-full max-w-md items-center">
            <Text className="text-coral-500 text-5xl mb-2">♥</Text>
            <Text className="text-ink-700 font-serif text-3xl mb-1">{t('discovery.matched')}</Text>
            <Text className="text-ink-400 mb-5 text-center">
              {matchPopup.name ? `${matchPopup.name}` : ''}
            </Text>
            <Button
              label={t('discovery.sayHi')}
              onPress={openChat}
              fullWidth
              className="bg-coral-500 active:bg-coral-600"
            />
            <View className="h-2" />
            <Button
              label={t('discovery.keepSwiping')}
              variant="ghost"
              onPress={() => setMatchPopup(null)}
              fullWidth
            />
          </View>
        </View>
      ) : null}
    </Screen>
  );
}
