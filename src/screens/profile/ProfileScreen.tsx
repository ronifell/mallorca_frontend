import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { Text, View, Pressable } from 'react-native';
import { colors } from '../../theme/colors';
import { usersApi } from '../../api/endpoints';
import { Button } from '../../components/Button';
import { ProfileAboutSection } from '../../components/profile/ProfileAboutSection';
import { ProfileHeroCard } from '../../components/profile/ProfileHeroCard';
import { ProfileInterestsSection } from '../../components/profile/ProfileInterestsSection';
import { ProfilePageHeader } from '../../components/profile/ProfilePageHeader';
import { ProfilePhotosGallery } from '../../components/profile/ProfilePhotosGallery';
import { Screen } from '../../components/Screen';
import { RootStackParamList } from '../../navigation/types';
import { extractInterestsFromBio } from '../../utils/profileDisplay';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function ProfileScreen() {
  const { t, i18n } = useTranslation();
  const nav = useNavigation<Nav>();
  const { data: me, isLoading } = useQuery({
    queryKey: ['me'],
    queryFn: () => usersApi.me(),
  });

  if (isLoading || !me) {
    return (
      <Screen>
        <View className="flex-1 items-center justify-center">
          <Text className="text-ink-400">{t('common.loading')}</Text>
        </View>
      </Screen>
    );
  }

  const interests = extractInterestsFromBio(me.bio, i18n.language);
  const goEdit = () => nav.navigate('EditProfile');
  const goSettings = () => nav.navigate('Settings');
  const goPremium = () => nav.navigate('Premium');

  return (
    <Screen scroll padded={false}>
      <ProfilePageHeader />

      <ProfileHeroCard
        profile={me}
        onActionPress={goEdit}
        actionIcon="heart"
        compactPhoto
      />

      <View className="px-5 pb-8">
        <ProfileAboutSection bio={me.bio} />
        <ProfileInterestsSection interests={interests} />
        <ProfilePhotosGallery photos={me.photos} onEdit={goEdit} />

        <Pressable
          onPress={goEdit}
          className="w-full border-2 border-coral-500 rounded-2xl py-3.5 items-center bg-white active:bg-coral-50"
        >
          <Text className="text-coral-500 font-semibold text-base">{t('profile.editProfile')}</Text>
        </Pressable>

        <Pressable
          onPress={goSettings}
          className="w-full flex-row items-center justify-center border border-cream-300 rounded-2xl py-3.5 mt-3 bg-white active:bg-cream-50"
        >
          <Ionicons name="settings-outline" size={20} color={colors.ink[700]} />
          <Text className="text-ink-700 font-semibold text-base ml-2">{t('settings.title')}</Text>
        </Pressable>

        {me.isPremium ? (
          <View className="mt-4 bg-coral-50 rounded-2xl py-3.5 items-center border border-coral-100">
            <Text className="text-coral-600 font-semibold">{t('premium.active')}</Text>
          </View>
        ) : (
          <>
            <View className="h-3" />
            <Button
              label={t('premium.subscribe')}
              onPress={goPremium}
              fullWidth
              className="bg-coral-500 active:bg-coral-600"
            />
          </>
        )}
      </View>
    </Screen>
  );
}
