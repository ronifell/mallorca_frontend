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
import { useSuperLikeAccess } from '../../hooks/useSuperLikeAccess';
import {
  ensureSuperLikeAllowed,
  handleSuperLikeApiError,
} from '../../utils/superLikeActions';

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
  const { quota: superLikeQuota, unlocked: superLikeUnlocked, remaining: superLikeRemaining, refetch: refetchQuota, authIsPremium } =
    useSuperLikeAccess();

  const [deck, setDeck] = useState<FeedCandidate[]>([]);
  const [isRetrying, setIsRetrying] = useState(false);
  // Track in-flight super-like — the star button still waits for its API
  // response to update the quota badge. Regular like / pass are optimistic
  // (see below) so we no longer track a "likeLoading" state.
  const [superLikeLoading, setSuperLikeLoading] = useState(false);
  // Count of in-flight optimistic like/pass calls. When the deck becomes
  // empty because we advanced ahead of the server, we keep showing the
  // "loading" placeholder instead of the empty state until the network
  // resolves and we can decide whether to replenish or truly show empty.
  const [pendingCount, setPendingCount] = useState(0);
  const pendingAction = pendingCount > 0;

  useEffect(() => {
    // Only seed the deck from the server response when we don't have any
    // cards locally. If the user has been swiping, we don't want the query
    // refetching to reset their queue.
    if (!data) return;
    setDeck((prev) => (prev.length === 0 && pendingCount === 0 ? data : prev));
  }, [data, pendingCount]);

  const top = deck[0];
  const next = deck[1];

  const replenishIfNeeded = async (remainingCount: number) => {
    if (remainingCount > 3) return;
    const { data: fresh } = await refetch();
    if (!fresh?.length) return;
    setDeck((prev) => {
      const ids = new Set(prev.map((c) => c.id));
      const append = fresh.filter((c) => !ids.has(c.id));
      return append.length ? [...prev, ...append] : prev;
    });
  };

  const advanceDeck = (): number => {
    let remaining = 0;
    setDeck((prev) => {
      const nextDeck = prev.slice(1);
      remaining = nextDeck.length;
      return nextDeck;
    });
    return remaining;
  };

  /**
   * Optimistic like: we advance the deck synchronously so the next profile
   * appears immediately, and fire the API call in the background. If the
   * response reports a match we still surface the celebration popup.
   */
  const runLike = (candidate: FeedCandidate) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => undefined);
    const remaining = advanceDeck();
    setPendingCount((n) => n + 1);
    void (async () => {
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
        }
        await replenishIfNeeded(remaining);
      } catch {
        // Non-fatal: the feed will resync on the next interaction.
      } finally {
        setPendingCount((n) => Math.max(0, n - 1));
      }
    })();
  };

  const runPass = (candidate: FeedCandidate) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
    const remaining = advanceDeck();
    setPendingCount((n) => n + 1);
    void (async () => {
      try {
        await discoveryApi.pass(candidate.id);
      } catch {
        // Non-fatal: the feed will resync on the next interaction.
      } finally {
        setPendingCount((n) => Math.max(0, n - 1));
      }
      await replenishIfNeeded(remaining);
    })();
  };

  const handleSwipe = (dir: 'left' | 'right') => {
    if (!top) return;
    if (dir === 'right') {
      runLike(top);
    } else {
      runPass(top);
    }
  };

  const handleLikePress = () => {
    if (!top) return;
    runLike(top);
  };

  const handlePassPress = () => {
    if (!top) return;
    runPass(top);
  };

  const openCandidateProfile = (candidate: FeedCandidate) => {
    nav.navigate('CandidateProfile', { candidate });
  };

  const handleSuperLike = async () => {
    if (!top || superLikeLoading) return;
    if (!ensureSuperLikeAllowed(superLikeQuota, nav, t, authIsPremium)) return;

    const candidate = top;
    setSuperLikeLoading(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
    // Advance the deck optimistically for a snappy feel; if the API rejects
    // the super-like we still show the error but keep the queue moving.
    const remaining = advanceDeck();
    setPendingCount((n) => n + 1);
    try {
      const res = await discoveryApi.superLike(candidate.id);
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
      await replenishIfNeeded(remaining);
    } catch (e) {
      handleSuperLikeApiError(e, nav, t, superLikeQuota?.limit ?? 5);
    } finally {
      setSuperLikeLoading(false);
      setPendingCount((n) => Math.max(0, n - 1));
      refetchQuota();
    }
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
                onPass={handlePassPress}
                onLike={handleLikePress}
                onSuperLike={handleSuperLike}
                superLikeEnabled={superLikeUnlocked}
                superLikeRemaining={superLikeRemaining}
                superLikeLoading={superLikeLoading}
                disabled={superLikeLoading}
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
