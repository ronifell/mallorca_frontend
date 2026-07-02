import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { extractErrorMessage } from '../../api/client';
import { discoveryApi, moderationApi } from '../../api/endpoints';
import { CandidateActionBar } from '../../components/discovery/CandidateActionBar';
import { CandidateIdentityRow } from '../../components/discovery/CandidateIdentityRow';
import { CandidateInfoCard } from '../../components/discovery/CandidateInfoCard';
import { CandidatePhotoHero } from '../../components/discovery/CandidatePhotoHero';
import { CandidatePhotoThumbnails } from '../../components/discovery/CandidatePhotoThumbnails';
import { CandidateProfileHeader } from '../../components/discovery/CandidateProfileHeader';
import { ReportUserSheet } from '../../components/moderation/ReportUserSheet';
import { ProfileSafetySection } from '../../components/moderation/ProfileSafetySection';
import { useTopScreenPadding } from '../../hooks/useTopScreenPadding';
import { useSuperLikeAccess } from '../../hooks/useSuperLikeAccess';
import { RootStackParamList } from '../../navigation/types';
import { useMatchPopup } from '../../store/matchPopup';
import {
  ensureSuperLikeAllowed,
  handleSuperLikeApiError,
} from '../../utils/superLikeActions';
import { resolveMediaUrl } from '../../utils/mediaUrl';

type Props = NativeStackScreenProps<RootStackParamList, 'CandidateProfile'>;

const ACTION_BAR_HEIGHT = 96;

export function CandidateProfileScreen({ route, navigation }: Props) {
  const { t } = useTranslation();
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const qc = useQueryClient();
  const candidate = route.params.candidate;
  const distanceKm = route.params.distanceKm;
  const topPadding = useTopScreenPadding();

  const { quota: superLikeQuota, unlocked: superLikeUnlocked, remaining: superLikeRemaining, refetch: refetchQuota, authIsPremium } =
    useSuperLikeAccess();

  const [photoIndex, setPhotoIndex] = useState(0);
  const [busy, setBusy] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const showMatchPopup = useMatchPopup((s) => s.show);
  const matchOpen = useMatchPopup((s) => s.current != null);
  const hadMatchRef = useRef(false);
  const scrollRef = useRef<ScrollView>(null);
  const safetyOffsetRef = useRef(0);

  const photoUris = useMemo(
    () =>
      candidate.photos
        .map((p) => resolveMediaUrl(p.url))
        .filter((url): url is string => Boolean(url)),
    [candidate.photos],
  );

  const photoCount = photoUris.length;
  const safeIndex = photoCount === 0 ? 0 : Math.min(photoIndex, photoCount - 1);
  const activePhoto = photoCount > 0 ? photoUris[safeIndex] : null;

  const goPrev = () => {
    if (photoCount <= 1) return;
    setPhotoIndex((i) => (i - 1 + photoCount) % photoCount);
  };

  const goNext = () => {
    if (photoCount <= 1) return;
    setPhotoIndex((i) => (i + 1) % photoCount);
  };

  const finishSwipe = (matched: boolean, matchId?: string) => {
    qc.invalidateQueries({ queryKey: ['feed'] });
    if (matched && matchId) {
      qc.invalidateQueries({ queryKey: ['matches'] });
      hadMatchRef.current = true;
      showMatchPopup({
        matchId,
        otherUser: {
          id: candidate.id,
          firstName: candidate.firstName,
          photo: candidate.photos[0]?.url ?? null,
        },
      });
      return;
    }
    navigation.goBack();
  };

  useEffect(() => {
    if (hadMatchRef.current && !matchOpen) {
      hadMatchRef.current = false;
      navigation.goBack();
    }
  }, [matchOpen, navigation]);

  const handleLike = async () => {
    if (busy) return;
    setBusy(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => undefined);
    try {
      const res = await discoveryApi.like(candidate.id);
      finishSwipe(res.matched, res.matchId);
    } catch (e) {
      Alert.alert(t('common.error'), extractErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const handlePass = async () => {
    if (busy) return;
    setBusy(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
    try {
      await discoveryApi.pass(candidate.id);
    } catch {
      // Non-fatal: the feed will resync on the next interaction.
    } finally {
      setBusy(false);
      qc.invalidateQueries({ queryKey: ['feed'] });
      navigation.goBack();
    }
  };

  const handleSuperLike = async () => {
    if (busy) return;
    if (!ensureSuperLikeAllowed(superLikeQuota, nav, t, authIsPremium)) return;

    setBusy(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
    try {
      const res = await discoveryApi.superLike(candidate.id);
      refetchQuota();
      if (res.matched && res.matchId) {
        finishSwipe(true, res.matchId);
      } else {
        Alert.alert(
          t('discovery.superLike'),
          t('discovery.superLikeSent', { name: candidate.firstName ?? '' }),
          [{ text: t('common.ok'), onPress: () => navigation.goBack() }],
        );
        qc.invalidateQueries({ queryKey: ['feed'] });
        qc.invalidateQueries({ queryKey: ['likes'] });
      }
    } catch (e) {
      handleSuperLikeApiError(e, nav, t, superLikeQuota?.limit ?? 5);
    } finally {
      setBusy(false);
    }
  };

  const scrollToSafety = () => {
    scrollRef.current?.scrollTo({ y: safetyOffsetRef.current, animated: true });
  };

  const handleBlock = () => {
    Alert.alert(t('profile.block'), t('profile.blockConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('profile.block'),
        style: 'destructive',
        onPress: async () => {
          try {
            await moderationApi.block(candidate.id);
            await qc.invalidateQueries({ queryKey: ['feed'] });
            await qc.invalidateQueries({ queryKey: ['likes'] });
            Alert.alert(t('moderation.block'), t('moderation.blocked'));
            navigation.goBack();
          } catch (e) {
            Alert.alert(t('common.error'), extractErrorMessage(e));
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView
      edges={['bottom']}
      style={{ flex: 1, backgroundColor: 'transparent' }}
    >
      <View style={{ flex: 1, paddingTop: topPadding }}>
        <CandidateProfileHeader />

        <ScrollView
          ref={scrollRef}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: ACTION_BAR_HEIGHT + 24 }}
        >
          <CandidatePhotoHero
            photoUri={activePhoto}
            photoIndex={safeIndex}
            photoCount={photoCount}
            online
            isPremium={candidate.isPremium}
            onPrev={photoCount > 1 ? goPrev : undefined}
            onNext={photoCount > 1 ? goNext : undefined}
            onSafetyPress={scrollToSafety}
          />

          {photoCount > 1 ? (
            <CandidatePhotoThumbnails
              photoUris={photoUris}
              activeIndex={safeIndex}
              onSelect={setPhotoIndex}
            />
          ) : null}

          <CandidateIdentityRow
            name={candidate.firstName ?? '—'}
            age={candidate.age}
            city={candidate.city}
            distanceKm={distanceKm}
            actionIcon="heart"
            actionAccessibilityLabel={t('discovery.like')}
            onActionPress={busy ? undefined : handleLike}
          />

          <CandidateInfoCard
            interestedIn={candidate.interestedIn}
            languages={candidate.languages}
            city={candidate.city}
            relationshipGoals={candidate.relationshipGoals}
            minAge={candidate.minAge}
            maxAge={candidate.maxAge}
          />

          {candidate.bio ? (
            <View
              className="mx-5 mb-6 rounded-2xl bg-white px-4 py-4"
              style={{
                shadowColor: '#3D2618',
                shadowOffset: { width: 0, height: 3 },
                shadowOpacity: 0.08,
                shadowRadius: 10,
                elevation: 3,
              }}
            >
              <Text className="text-ink-700 text-base font-bold mb-2">
                {t('profile.aboutMe')}
              </Text>
              <Text className="text-ink-400 text-sm leading-6">
                {candidate.bio}
              </Text>
            </View>
          ) : null}

          {candidate.isPremium ? (
            <View className="mx-5 mb-6 bg-coral-50 rounded-2xl py-3 items-center border border-coral-100">
              <Text className="text-coral-600 font-semibold">
                {t('profile.premiumUserNotice')}
              </Text>
            </View>
          ) : null}

          <View
            onLayout={(e) => {
              safetyOffsetRef.current = e.nativeEvent.layout.y;
            }}
          >
            <ProfileSafetySection
              onReport={() => setReportOpen(true)}
              onBlock={handleBlock}
            />
          </View>
        </ScrollView>

        <CandidateActionBar
          onPass={handlePass}
          onLike={handleLike}
          onSuperLike={handleSuperLike}
          disabled={busy}
          superLikeEnabled={superLikeUnlocked}
          superLikeRemaining={superLikeRemaining}
        />
      </View>

      <ReportUserSheet
        visible={reportOpen}
        userId={candidate.id}
        onClose={() => setReportOpen(false)}
        onReported={() => {
          qc.invalidateQueries({ queryKey: ['feed'] });
          navigation.goBack();
        }}
      />
    </SafeAreaView>
  );
}
