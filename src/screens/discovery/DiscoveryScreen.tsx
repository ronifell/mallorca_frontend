import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Text, View } from 'react-native';
import { useSharedValue, withTiming } from 'react-native-reanimated';
import { discoveryApi } from '../../api/endpoints';
import { FeedCandidate } from '../../api/types';
import { Button } from '../../components/Button';
import { DiscoveryActionButtons } from '../../components/discovery/DiscoveryActionButtons';
import { BACK_SCALE_MIN, DiscoveryCardStack } from '../../components/discovery/DiscoveryCardStack';
import { DiscoveryHeader } from '../../components/discovery/DiscoveryHeader';
import {
  DiscoveryMode,
  DiscoveryModeToggle,
} from '../../components/discovery/DiscoveryModeToggle';
import { LikesView } from '../../components/discovery/LikesView';
import { Screen } from '../../components/Screen';
import { SwipeCardHandle } from '../../components/SwipeCard';
import { MainTabParamList, RootStackParamList } from '../../navigation/types';
import { useMatchPopup } from '../../store/matchPopup';
import { useAuthStore } from '../../store/auth';
import { useSuperLikeAccess } from '../../hooks/useSuperLikeAccess';
import {
  ensureSuperLikeAllowed,
  handleSuperLikeApiError,
} from '../../utils/superLikeActions';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function DiscoveryScreen() {
  const { t } = useTranslation();
  const nav = useNavigation<Nav>();
  const route = useRoute<RouteProp<MainTabParamList, 'Discover'>>();
  const qc = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);
  const showMatchPopup = useMatchPopup((s) => s.show);
  const matchOpen = useMatchPopup((s) => s.current != null);
  const [mode, setMode] = useState<DiscoveryMode>(route.params?.mode ?? 'discover');
  const [likesTab, setLikesTab] = useState<'received' | 'sent'>(
    route.params?.likesTab ?? 'received',
  );

  useEffect(() => {
    if (route.params?.mode === 'likedYou' || route.params?.mode === 'discover') {
      setMode(route.params.mode);
    }
    if (route.params?.likesTab === 'received' || route.params?.likesTab === 'sent') {
      setLikesTab(route.params.likesTab);
    }
  }, [route.params?.mode, route.params?.likesTab]);
  const { data, isLoading, refetch } = useQuery<FeedCandidate[]>({
    queryKey: ['feed', userId],
    queryFn: () => discoveryApi.feed(20),
    enabled: !!userId,
  });
  const { quota: superLikeQuota, unlocked: superLikeUnlocked, remaining: superLikeRemaining, refetch: refetchQuota, authIsPremium } =
    useSuperLikeAccess();

  const [deck, setDeck] = useState<FeedCandidate[]>([]);
  /** Photo-only cover shown until the new top card image has decoded. */
  const [coverCandidate, setCoverCandidate] = useState<FeedCandidate | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  // Track in-flight super-like — the star button still waits for its API
  // response to update the quota badge. Regular like / pass are optimistic
  // (see below) so we no longer track a "likeLoading" state.
  const [superLikeLoading, setSuperLikeLoading] = useState(false);
  // True while the top card is mid fly-out — blocks action buttons so Super
  // Like cannot target deck[0] while the under-card is already visible.
  const [cardAnimating, setCardAnimating] = useState(false);
  // Count of in-flight optimistic like/pass calls. When the deck becomes
  // empty because we advanced ahead of the server, we keep showing the
  // "loading" placeholder instead of the empty state until the network
  // resolves and we can decide whether to replenish or truly show empty.
  const [pendingCount, setPendingCount] = useState(0);
  const pendingAction = pendingCount > 0;
  const deckRef = useRef(deck);
  deckRef.current = deck;
  const mainCardRef = useRef<SwipeCardHandle>(null);
  const backScale = useSharedValue(BACK_SCALE_MIN);
  const coverCandidateRef = useRef<FeedCandidate | null>(null);
  coverCandidateRef.current = coverCandidate;
  /** Candidate id pinned when a gesture fly-out starts (handleSwipe guard). */
  const swipingIdRef = useRef<string | null>(null);
  /** Profiles already liked/passed/super-liked this session — never show again locally. */
  const actionedIdsRef = useRef(new Set<string>());
  /** Whether the deck has been seeded from the feed query (avoid stale re-seed). */
  const deckSeededRef = useRef(false);
  /** In-flight like requests keyed by candidate id (started on fly-out for snappier matches). */
  const inflightLikesRef = useRef<Map<string, ReturnType<typeof discoveryApi.like>>>(new Map());

  useEffect(() => {
    setDeck([]);
    setCoverCandidate(null);
    setPendingCount(0);
    setCardAnimating(false);
    backScale.value = BACK_SCALE_MIN;
    swipingIdRef.current = null;
    actionedIdsRef.current.clear();
    deckSeededRef.current = false;
    inflightLikesRef.current.clear();
  }, [userId]);

  const filterActioned = (candidates: FeedCandidate[]) =>
    candidates.filter((c) => !actionedIdsRef.current.has(c.id));

  const markActioned = (candidateId: string) => {
    actionedIdsRef.current.add(candidateId);
    qc.setQueryData<FeedCandidate[]>(['feed', userId], (old) =>
      old?.filter((c) => c.id !== candidateId) ?? old,
    );
  };

  useEffect(() => {
    // Seed the deck once from the server. Never re-seed from stale cached `data`
    // after swipes — that resurrected profiles the user had already passed.
    if (!data?.length || deckSeededRef.current || pendingCount > 0) return;
    setDeck((prev) => {
      if (prev.length > 0) {
        deckSeededRef.current = true;
        return prev;
      }
      deckSeededRef.current = true;
      return filterActioned(data);
    });
  }, [data, pendingCount]);

  const top = deck[0];

  const beginLikeRequest = (candidateId: string) => {
    let pending = inflightLikesRef.current.get(candidateId);
    if (!pending) {
      pending = discoveryApi.like(candidateId);
      inflightLikesRef.current.set(candidateId, pending);
    }
    return pending;
  };

  const handleDragProgress = useCallback(
    (progress: number) => {
      backScale.value = BACK_SCALE_MIN + progress * (1 - BACK_SCALE_MIN);
    },
    [backScale],
  );

  const handlePhotoLoad = useCallback(() => {
    if (coverCandidateRef.current) {
      setCoverCandidate(null);
      backScale.value = BACK_SCALE_MIN;
    }
  }, [backScale]);

  useEffect(() => {
    if (!coverCandidate) return;
    const timer = setTimeout(() => {
      setCoverCandidate(null);
      backScale.value = BACK_SCALE_MIN;
    }, 350);
    return () => clearTimeout(timer);
  }, [coverCandidate, top?.id, backScale]);

  const handleFlyStart = useCallback(
    (dir: 'left' | 'right') => {
      const current = deckRef.current[0];
      if (!current) return;
      swipingIdRef.current = current.id;
      setCardAnimating(true);
      backScale.value = withTiming(1, { duration: 120 });
      if (dir === 'right') {
        beginLikeRequest(current.id);
      }
    },
    [backScale],
  );

  const replenishIfNeeded = async (remainingCount: number) => {
    if (remainingCount > 3) return;
    const { data: fresh } = await refetch();
    if (!fresh?.length) return;
    setDeck((prev) => {
      const ids = new Set(prev.map((c) => c.id));
      const append = filterActioned(fresh).filter((c: FeedCandidate) => !ids.has(c.id));
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
    markActioned(candidate.id);
    const remaining = advanceDeck();
    setPendingCount((n) => n + 1);
    const likePromise = beginLikeRequest(candidate.id);
    void (async () => {
      try {
        const res = await likePromise;
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
        qc.invalidateQueries({ queryKey: ['likes'] });
        await replenishIfNeeded(remaining);
      } catch {
        // Non-fatal: the feed will resync on the next interaction.
      } finally {
        inflightLikesRef.current.delete(candidate.id);
        setPendingCount((n) => Math.max(0, n - 1));
      }
    })();
  };

  const runPass = (candidate: FeedCandidate) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
    markActioned(candidate.id);
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

  const handleSwipe = (dir: 'left' | 'right', candidateId: string) => {
    const actionId = swipingIdRef.current ?? candidateId;
    swipingIdRef.current = null;
    setCardAnimating(false);
    const snapshot = deckRef.current;
    const candidate =
      snapshot.find((c) => c.id === actionId) ?? null;
    if (!candidate) return;

    const incoming = snapshot[1];
    if (incoming) {
      setCoverCandidate(incoming);
    }

    if (dir === 'right') {
      runLike(candidate);
    } else {
      runPass(candidate);
    }
  };

  const handleLikePress = () => {
    if (!top || cardAnimating || superLikeLoading) return;
    mainCardRef.current?.flyOut('right');
  };

  const handlePassPress = () => {
    if (!top || cardAnimating || superLikeLoading) return;
    mainCardRef.current?.flyOut('left');
  };

  const openCandidateProfile = (candidateId: string) => {
    const candidate = deckRef.current.find((c) => c.id === candidateId);
    if (!candidate) return;
    nav.navigate({
      name: 'CandidateProfile',
      params: { candidate: { ...candidate } },
      key: `candidate-${candidateId}`,
    });
  };

  const handleSuperLike = async () => {
    if (!top || superLikeLoading || cardAnimating) return;
    if (!ensureSuperLikeAllowed(superLikeQuota, nav, t, authIsPremium)) return;

    // Bind to the visible top card for the whole request. Do NOT advance the
    // deck before the confirmation — advancing first made the next profile
    // appear while the Alert still named the previous person (QA: Carlos
    // visible, Alert said "Kamal").
    const candidate = top;
    setSuperLikeLoading(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
    setPendingCount((n) => n + 1);
    try {
      const res = await discoveryApi.superLike(candidate.id);
      markActioned(candidate.id);
      const incoming = deckRef.current[1];
      if (incoming) setCoverCandidate(incoming);
      const remaining = advanceDeck();
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
      actionedIdsRef.current.clear();
      deckSeededRef.current = false;
      setDeck([]);
      setCoverCandidate(null);
      backScale.value = BACK_SCALE_MIN;
      const { data: users } = await refetch();
      if (users) {
        const seeded = filterActioned(users);
        setDeck(seeded);
        deckSeededRef.current = true;
      }
    } catch {
      Alert.alert(t('common.error'), t('discovery.retryFailed'));
    } finally {
      setIsRetrying(false);
    }
  };

  return (
    <Screen padded={false}>
      <DiscoveryHeader
        onFiltersApplied={() => {
          actionedIdsRef.current.clear();
          deckSeededRef.current = false;
          setDeck([]);
          setCoverCandidate(null);
          backScale.value = BACK_SCALE_MIN;
          void refetch();
        }}
      />
      <DiscoveryModeToggle mode={mode} onChange={setMode} />

      {mode === 'likedYou' ? (
        <LikesView initialTab={likesTab} />
      ) : (
        <View className="flex-1 px-5">
          {isLoading ? (
            <View className="flex-1 items-center justify-center">
              <Text className="text-ink-400">{t('discovery.loading')}</Text>
            </View>
          ) : top ? (
            <View className="flex-1 items-center justify-center">
              <View className="w-full max-w-md">
                <DiscoveryCardStack
                  deck={deck}
                  coverCandidate={coverCandidate}
                  backScale={backScale}
                  mainRef={mainCardRef}
                  swipeable={!superLikeLoading && !cardAnimating}
                  onSwipe={handleSwipe}
                  onFlyStart={handleFlyStart}
                  onDragProgress={handleDragProgress}
                  onPhotoLoad={handlePhotoLoad}
                  onInfoPress={openCandidateProfile}
                  onCardPress={openCandidateProfile}
                />
              </View>

              <DiscoveryActionButtons
                onPass={handlePassPress}
                onLike={handleLikePress}
                onSuperLike={handleSuperLike}
                superLikeEnabled={superLikeUnlocked}
                superLikeRemaining={superLikeRemaining}
                superLikeLoading={superLikeLoading}
                disabled={superLikeLoading || cardAnimating}
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
