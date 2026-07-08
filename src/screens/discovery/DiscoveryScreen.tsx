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
  const [likeLoading, setLikeLoading] = useState(false);
  const [superLikeLoading, setSuperLikeLoading] = useState(false);
  // True while an in-flight like / super-like / pass call is awaiting the
  // backend. Used to suppress the "no compatible profiles" empty state
  // from flashing when the user swipes the very last card and a match is
  // about to be celebrated (otherwise the empty screen briefly appears
  // behind the match modal between the swipe and the API response).
  const [pendingAction, setPendingAction] = useState(false);

  const actionBusy = likeLoading || superLikeLoading || pendingAction;

  useEffect(() => {
    if (!data || actionBusy) return;
    setDeck((prev) => (prev.length === 0 ? data : prev));
  }, [data, actionBusy]);

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

  const runLike = async (candidate: FeedCandidate) => {
    if (likeLoading || superLikeLoading) return;
    setLikeLoading(true);
    setPendingAction(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => undefined);
    try {
      const res = await discoveryApi.like(candidate.id);
      let remaining = 0;
      setDeck((prev) => {
        const next = prev.slice(1);
        remaining = next.length;
        return next;
      });
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
      // Networking failures are non-fatal here: the next call will resync.
    } finally {
      setLikeLoading(false);
      setPendingAction(false);
    }
  };

  const runPass = async (candidate: FeedCandidate) => {
    if (actionBusy) return;
    let remaining = 0;
    setDeck((prev) => {
      const next = prev.slice(1);
      remaining = next.length;
      return next;
    });
    setPendingAction(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
    try {
      await discoveryApi.pass(candidate.id);
    } catch {
      // Non-fatal: the feed will resync on the next interaction.
    } finally {
      setPendingAction(false);
    }
    await replenishIfNeeded(remaining);
  };

  const handleSwipe = async (dir: 'left' | 'right') => {
    if (!top || actionBusy) return;
    if (dir === 'right') {
      await runLike(top);
    } else {
      await runPass(top);
    }
  };

  const handleLikePress = async () => {
    if (!top) return;
    await runLike(top);
  };

  const handlePassPress = async () => {
    if (!top) return;
    await runPass(top);
  };

  const openCandidateProfile = (candidate: FeedCandidate) => {
    nav.navigate('CandidateProfile', { candidate });
  };

  const handleSuperLike = async () => {
    if (!top || actionBusy) return;
    if (!ensureSuperLikeAllowed(superLikeQuota, nav, t, authIsPremium)) return;

    const candidate = top;
    setSuperLikeLoading(true);
    setPendingAction(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
    try {
      const res = await discoveryApi.superLike(candidate.id);
      let remaining = 0;
      setDeck((prev) => {
        const next = prev.slice(1);
        remaining = next.length;
        return next;
      });
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
      setPendingAction(false);
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
                  swipeable={!actionBusy}
                />
              </View>

              <DiscoveryActionButtons
                onPass={handlePassPress}
                onLike={handleLikePress}
                onSuperLike={handleSuperLike}
                superLikeEnabled={superLikeUnlocked}
                superLikeRemaining={superLikeRemaining}
                likeLoading={likeLoading}
                superLikeLoading={superLikeLoading}
                disabled={actionBusy}
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
