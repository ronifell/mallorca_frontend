import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Text, View } from 'react-native';
import { discoveryApi } from '../../api/endpoints';
import { FeedCandidate } from '../../api/types';
import { Button } from '../../components/Button';
import { DiscoveryActionButtons } from '../../components/discovery/DiscoveryActionButtons';
import { DiscoveryHeader } from '../../components/discovery/DiscoveryHeader';
import {
  DiscoveryMode,
  DiscoveryModeToggle,
} from '../../components/discovery/DiscoveryModeToggle';
import { LikesView } from '../../components/discovery/LikesView';
import { Screen } from '../../components/Screen';
import { SwipeCard } from '../../components/SwipeCard';
import { RootStackParamList } from '../../navigation/types';
import { useMatchPopup } from '../../store/matchPopup';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function DiscoveryScreen() {
  const { t } = useTranslation();
  const nav = useNavigation<Nav>();
  const qc = useQueryClient();
  const showMatchPopup = useMatchPopup((s) => s.show);
  const matchOpen = useMatchPopup((s) => s.current != null);
  const [mode, setMode] = useState<DiscoveryMode>('discover');
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['feed'],
    queryFn: () => discoveryApi.feed(20),
  });

  const [deck, setDeck] = useState<FeedCandidate[]>([]);
  const [isRetrying, setIsRetrying] = useState(false);
  // True while an in-flight like / super-like / pass call is awaiting the
  // backend. Used to suppress the "no compatible profiles" empty state
  // from flashing when the user swipes the very last card and a match is
  // about to be celebrated (otherwise the empty screen briefly appears
  // behind the match modal between the swipe and the API response).
  const [pendingAction, setPendingAction] = useState(false);

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
    setPendingAction(true);
    Haptics.impactAsync(
      dir === 'right' ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light,
    ).catch(() => undefined);
    try {
      if (dir === 'right') {
        const res = await discoveryApi.like(candidate.id);
        if (res.matched && res.matchId) {
          showMatchPopup({
            matchId: res.matchId,
            otherUser: {
              id: candidate.id,
              firstName: candidate.firstName,
              photo: candidate.photos[0]?.url ?? null,
            },
          });
          qc.invalidateQueries({ queryKey: ['matches'] });
        }
      } else {
        await discoveryApi.pass(candidate.id);
      }
    } catch {
      // Networking failures are non-fatal here: the next call will resync.
    } finally {
      setPendingAction(false);
    }
    if (deck.length <= 3) refetch();
  };

  const openCandidateProfile = (candidate: FeedCandidate) => {
    nav.navigate('CandidateProfile', { candidate });
  };

  const handleSuperLike = async () => {
    if (!top) return;
    const candidate = top;
    advance();
    setPendingAction(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
    try {
      const res = await discoveryApi.like(candidate.id);
      if (res.matched && res.matchId) {
        showMatchPopup({
          matchId: res.matchId,
          otherUser: {
            id: candidate.id,
            firstName: candidate.firstName,
            photo: candidate.photos[0]?.url ?? null,
          },
        });
        qc.invalidateQueries({ queryKey: ['matches'] });
      } else {
        Alert.alert(
          t('discovery.superLike'),
          t('discovery.superLikeSent', { name: candidate.firstName ?? '' }),
        );
      }
    } catch {
      Alert.alert(t('common.error'), t('discovery.superLikeError'));
    } finally {
      setPendingAction(false);
    }
    if (deck.length <= 3) refetch();
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

      {mode === 'likedYou' ? (
        <LikesView />
      ) : (
        <View className="flex-1 px-5">
          {isLoading ? (
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
          ) : pendingAction || matchOpen ? (
            <View className="flex-1 items-center justify-center">
              <Text className="text-ink-400">{t('discovery.loading')}</Text>
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
      )}

    </Screen>
  );
}
