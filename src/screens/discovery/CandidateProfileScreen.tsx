import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Text, View } from 'react-native';
import { extractErrorMessage } from '../../api/client';
import { discoveryApi } from '../../api/endpoints';
import { Button } from '../../components/Button';
import { MatchProfileHeader } from '../../components/profile/MatchProfileHeader';
import { ProfileAboutSection } from '../../components/profile/ProfileAboutSection';
import { ProfileHeroCard } from '../../components/profile/ProfileHeroCard';
import { ProfileInterestsSection } from '../../components/profile/ProfileInterestsSection';
import { ProfilePhotosGallery } from '../../components/profile/ProfilePhotosGallery';
import { Screen } from '../../components/Screen';
import { RootStackParamList } from '../../navigation/types';
import { extractInterestsFromBio } from '../../utils/profileDisplay';

type Props = NativeStackScreenProps<RootStackParamList, 'CandidateProfile'>;

export function CandidateProfileScreen({ route, navigation }: Props) {
  const { t, i18n } = useTranslation();
  const qc = useQueryClient();
  const candidate = route.params.candidate;
  const [busy, setBusy] = useState(false);

  const interests = extractInterestsFromBio(candidate.bio, i18n.language);

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
      // Non-fatal: feed will resync on next swipe.
    } finally {
      setBusy(false);
      qc.invalidateQueries({ queryKey: ['feed'] });
      navigation.goBack();
    }
  };

  return (
    <Screen scroll padded={false}>
      <MatchProfileHeader />

      <ProfileHeroCard profile={candidate} />

      <View className="px-5 pb-8">
        <ProfileAboutSection bio={candidate.bio} />
        <ProfileInterestsSection interests={interests} />
        <ProfilePhotosGallery photos={candidate.photos} readOnly />

        {candidate.isPremium ? (
          <View className="mb-4 bg-coral-50 rounded-2xl py-3 items-center border border-coral-100">
            <Text className="text-coral-600 font-semibold">
              {t('profile.premiumUserNotice')}
            </Text>
          </View>
        ) : null}

        <View className="flex-row gap-3">
          <View className="flex-1">
            <Button
              label={t('discovery.pass')}
              variant="secondary"
              onPress={handlePass}
              disabled={busy}
              fullWidth
            />
          </View>
          <View className="flex-1">
            <Button
              label={t('discovery.like')}
              onPress={handleLike}
              disabled={busy}
              fullWidth
              className="bg-coral-500 active:bg-coral-600"
            />
          </View>
        </View>
      </View>
    </Screen>
  );
}
