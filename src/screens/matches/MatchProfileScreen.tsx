import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { extractErrorMessage } from '../../api/client';
import { chatApi, matchesApi, moderationApi } from '../../api/endpoints';
import { Button } from '../../components/Button';
import { CandidateIdentityRow } from '../../components/discovery/CandidateIdentityRow';
import { CandidateInfoCard } from '../../components/discovery/CandidateInfoCard';
import { CandidatePhotoHero } from '../../components/discovery/CandidatePhotoHero';
import { CandidatePhotoThumbnails } from '../../components/discovery/CandidatePhotoThumbnails';
import { CandidateProfileHeader } from '../../components/discovery/CandidateProfileHeader';
import { useTopScreenPadding } from '../../hooks/useTopScreenPadding';
import { RootStackParamList } from '../../navigation/types';
import { colors } from '../../theme/colors';
import { resolveMediaUrl } from '../../utils/mediaUrl';

type Props = NativeStackScreenProps<RootStackParamList, 'MatchProfile'>;

export function MatchProfileScreen({ route, navigation }: Props) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const { matchId } = route.params;
  const topPadding = useTopScreenPadding();

  const [photoIndex, setPhotoIndex] = useState(0);

  const { data, isLoading, error } = useQuery({
    queryKey: ['match-profile', matchId],
    queryFn: () => matchesApi.profile(matchId),
  });

  const profile = data?.user;

  const photoUris = useMemo(
    () =>
      (profile?.photos ?? [])
        .map((p) => resolveMediaUrl(p.url))
        .filter((url): url is string => Boolean(url)),
    [profile?.photos],
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

  const openChat = async () => {
    if (!data || !profile) return;
    try {
      const conv = data.conversationId
        ? { id: data.conversationId }
        : await chatApi.ensureConversation(data.matchId);
      navigation.navigate('Conversation', {
        conversationId: conv.id,
        otherName: profile.firstName,
        otherUserId: profile.id,
        otherUserAge: profile.age,
        otherUserPhoto: profile.photos[0]?.url ?? null,
      });
    } catch (e) {
      Alert.alert(t('common.error'), extractErrorMessage(e));
    }
  };

  const handleUnmatch = () => {
    Alert.alert(t('matches.unmatch'), t('matches.unmatchConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('matches.unmatch'),
        style: 'destructive',
        onPress: async () => {
          try {
            await matchesApi.unmatch(matchId);
            await qc.invalidateQueries({ queryKey: ['matches'] });
            navigation.goBack();
          } catch (e) {
            Alert.alert(t('common.error'), extractErrorMessage(e));
          }
        },
      },
    ]);
  };

  const handleBlock = () => {
    if (!profile) return;
    Alert.alert(t('profile.block'), t('profile.blockConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('profile.block'),
        style: 'destructive',
        onPress: async () => {
          try {
            await moderationApi.block(profile.id);
            await matchesApi.unmatch(matchId);
            await qc.invalidateQueries({ queryKey: ['matches'] });
            navigation.goBack();
          } catch (e) {
            Alert.alert(t('common.error'), extractErrorMessage(e));
          }
        },
      },
    ]);
  };

  const handleReport = () => {
    Alert.alert(t('profile.report'), t('profile.reportComingSoon'));
  };

  const openMenu = () => {
    Alert.alert(t('profile.openMenu'), undefined, [
      { text: t('profile.report'), onPress: handleReport },
      { text: t('profile.block'), style: 'destructive' as const, onPress: handleBlock },
      { text: t('matches.unmatch'), style: 'destructive' as const, onPress: handleUnmatch },
      { text: t('common.cancel'), style: 'cancel' as const },
    ]);
  };

  if (isLoading) {
    return (
      <SafeAreaView
        edges={['bottom']}
        style={{ flex: 1, backgroundColor: colors.cream[200] }}
      >
        <View
          style={{ flex: 1, paddingTop: topPadding }}
          className="items-center justify-center"
        >
          <Text className="text-ink-400">{t('common.loading')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !data || !profile) {
    return (
      <SafeAreaView
        edges={['bottom']}
        style={{ flex: 1, backgroundColor: colors.cream[200] }}
      >
        <View style={{ flex: 1, paddingTop: topPadding }}>
          <CandidateProfileHeader />
          <View className="flex-1 items-center justify-center px-5">
            <Text className="text-ink-400 text-center">
              {error ? extractErrorMessage(error) : t('common.error')}
            </Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      edges={['bottom']}
      style={{ flex: 1, backgroundColor: colors.cream[200] }}
    >
      <View style={{ flex: 1, paddingTop: topPadding }}>
        <CandidateProfileHeader />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 32 }}
        >
          <CandidatePhotoHero
            photoUri={activePhoto}
            photoIndex={safeIndex}
            photoCount={photoCount}
            online
            isPremium={profile.isPremium}
            onPrev={photoCount > 1 ? goPrev : undefined}
            onNext={photoCount > 1 ? goNext : undefined}
            onMenuPress={openMenu}
          />

          {photoCount > 1 ? (
            <CandidatePhotoThumbnails
              photoUris={photoUris}
              activeIndex={safeIndex}
              onSelect={setPhotoIndex}
            />
          ) : null}

          <CandidateIdentityRow
            name={profile.firstName ?? '—'}
            age={profile.age}
            city={profile.city}
            actionIcon="chatbubble-ellipses"
            actionAccessibilityLabel={t('profile.sendMessage')}
            onActionPress={openChat}
          />

          <CandidateInfoCard
            interestedIn={profile.interestedIn}
            languages={profile.languages}
            city={profile.city}
          />

          {profile.bio ? (
            <View
              className="mx-5 mb-5 rounded-2xl bg-white px-4 py-4"
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
                {profile.bio}
              </Text>
            </View>
          ) : null}

          <View className="px-5 mt-1">
            <Button
              label={t('profile.sendMessage')}
              onPress={openChat}
              fullWidth
              className="bg-coral-500 active:bg-coral-600"
            />

            {profile.isPremium ? (
              <View className="mt-4 bg-coral-50 rounded-2xl py-3.5 items-center border border-coral-100">
                <View className="flex-row items-center">
                  <Ionicons name="ribbon" size={18} color={colors.coral[600]} />
                  <Text className="text-coral-600 font-semibold ml-2">
                    {t('profile.matchIsPremium')}
                  </Text>
                </View>
              </View>
            ) : null}
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
