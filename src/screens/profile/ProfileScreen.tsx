import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View, Pressable } from 'react-native';
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
