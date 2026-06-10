import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { extractErrorMessage } from '../../api/client';
import { discoveryApi } from '../../api/endpoints';
import { CandidateActionBar } from '../../components/discovery/CandidateActionBar';
import { CandidateIdentityRow } from '../../components/discovery/CandidateIdentityRow';
import { CandidateInfoCard } from '../../components/discovery/CandidateInfoCard';
import { CandidatePhotoHero } from '../../components/discovery/CandidatePhotoHero';
import { CandidatePhotoThumbnails } from '../../components/discovery/CandidatePhotoThumbnails';
import { CandidateProfileHeader } from '../../components/discovery/CandidateProfileHeader';
import { useTopScreenPadding } from '../../hooks/useTopScreenPadding';
import { RootStackParamList } from '../../navigation/types';
import { resolveMediaUrl } from '../../utils/mediaUrl';

type Props = NativeStackScreenProps<RootStackParamList, 'CandidateProfile'>;

const ACTION_BAR_HEIGHT = 96;

export function CandidateProfileScreen({ route, navigation }: Props) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const candidate = route.params.candidate;
  const distanceKm = route.params.distanceKm;
  const topPadding = useTopScreenPadding();

  const [photoIndex, setPhotoIndex] = useState(0);
  const [busy, setBusy] = useState(false);

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
      Alert.alert(t('discovery.matched'), candidate.firstName ?? '', [
        { text: t('common.ok'), onPress: () => navigation.goBack() },
      ]);
    } else {
      navigation.goBack();
    }
  };

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

  const handleSuperLike = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
    Alert.alert(t('discovery.superLike'), t('discovery.superLikeComingSoon'));
  };

  const handleMenu = () => {
    Alert.alert(t('profile.openMenu'), undefined, [
      { text: t('profile.report'), onPress: () => Alert.alert(t('profile.reportComingSoon')) },
      { text: t('profile.block'), style: 'destructive' as const },
      { text: t('common.cancel'), style: 'cancel' as const },
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
            onMenuPress={handleMenu}
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
        </ScrollView>

        <CandidateActionBar
          onPass={handlePass}
          onLike={handleLike}
          onSuperLike={handleSuperLike}
          disabled={busy}
        />
      </View>
    </SafeAreaView>
  );
}
