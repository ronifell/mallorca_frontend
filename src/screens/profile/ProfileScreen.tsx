import { Ionicons } from '@expo/vector-icons';
import { CompositeNavigationProp, useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usersApi } from '../../api/endpoints';
import { Button } from '../../components/Button';
import { CandidateIdentityRow } from '../../components/discovery/CandidateIdentityRow';
import { CandidateInfoCard } from '../../components/discovery/CandidateInfoCard';
import { CandidatePhotoHero } from '../../components/discovery/CandidatePhotoHero';
import { CandidatePhotoThumbnails } from '../../components/discovery/CandidatePhotoThumbnails';
import { CandidateProfileHeader } from '../../components/discovery/CandidateProfileHeader';
import { useTopScreenPadding } from '../../hooks/useTopScreenPadding';
import { MainTabParamList, RootStackParamList } from '../../navigation/types';
import { colors } from '../../theme/colors';
import { resolveMediaUrl } from '../../utils/mediaUrl';

type Nav = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Profile'>,
  NativeStackNavigationProp<RootStackParamList>
>;

export function ProfileScreen() {
  const { t } = useTranslation();
  const nav = useNavigation<Nav>();
  const topPadding = useTopScreenPadding();
  const [photoIndex, setPhotoIndex] = useState(0);

  const { data: me, isLoading } = useQuery({
    queryKey: ['me'],
    queryFn: () => usersApi.me(),
  });

  const photoUris = useMemo(
    () =>
      (me?.photos ?? [])
        .map((p) => resolveMediaUrl(p.url))
        .filter((url): url is string => Boolean(url)),
    [me?.photos],
  );

  if (isLoading || !me) {
    return (
      <SafeAreaView
        edges={['bottom']}
        style={{ flex: 1, backgroundColor: 'transparent' }}
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

  const goEdit = () => nav.navigate('EditProfile');
  const goSettings = () => nav.navigate('Settings');
  const goPremium = () => nav.navigate('Premium');
  const goDiscover = () => nav.navigate('Discover');

  return (
    <SafeAreaView
      edges={['bottom']}
      style={{ flex: 1, backgroundColor: 'transparent' }}
    >
      <View style={{ flex: 1, paddingTop: topPadding }}>
        <CandidateProfileHeader onBack={goDiscover} />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 32 }}
        >
          <CandidatePhotoHero
            photoUri={activePhoto}
            photoIndex={safeIndex}
            photoCount={photoCount}
            online
            isPremium={me.isPremium}
            onPrev={photoCount > 1 ? goPrev : undefined}
            onNext={photoCount > 1 ? goNext : undefined}
          />

          {photoCount > 1 ? (
            <CandidatePhotoThumbnails
              photoUris={photoUris}
              activeIndex={safeIndex}
              onSelect={setPhotoIndex}
            />
          ) : null}

          <CandidateIdentityRow
            name={me.firstName ?? '—'}
            age={me.age}
            city={me.city}
            actionIcon="create-outline"
            actionAccessibilityLabel={t('profile.editProfile')}
            onActionPress={goEdit}
          />

          <CandidateInfoCard
            interestedIn={me.interestedIn}
            languages={me.languages}
            city={me.city}
          />

          {me.bio ? (
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
              <Text className="text-ink-400 text-sm leading-6">{me.bio}</Text>
            </View>
          ) : null}

          <View className="px-5 mt-1">
            <Pressable
              onPress={goEdit}
              className="w-full border-2 rounded-2xl py-3.5 items-center bg-white active:bg-coral-50"
              style={{ borderColor: colors.coral[500] }}
            >
              <View className="flex-row items-center">
                <Ionicons name="create-outline" size={18} color={colors.coral[500]} />
                <Text className="text-coral-500 font-semibold text-base ml-2">
                  {t('profile.editProfile')}
                </Text>
              </View>
            </Pressable>

            <Pressable
              onPress={goSettings}
              className="w-full flex-row items-center justify-center border border-cream-300 rounded-2xl py-3.5 mt-3 bg-white active:bg-cream-50"
            >
              <Ionicons name="settings-outline" size={20} color={colors.ink[700]} />
              <Text className="text-ink-700 font-semibold text-base ml-2">
                {t('settings.title')}
              </Text>
            </Pressable>

            {me.isPremium ? (
              <View className="mt-4 bg-coral-50 rounded-2xl py-3.5 items-center border border-coral-100">
                <View className="flex-row items-center">
                  <Ionicons name="ribbon" size={18} color={colors.coral[600]} />
                  <Text className="text-coral-600 font-semibold ml-2">
                    {t('premium.active')}
                  </Text>
                </View>
              </View>
            ) : (
              <View className="mt-4">
                <Button
                  label={t('premium.subscribe')}
                  onPress={goPremium}
                  fullWidth
                  className="bg-coral-500 active:bg-coral-600"
                />
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
