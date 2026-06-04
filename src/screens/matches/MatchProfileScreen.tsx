import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Text, View } from 'react-native';
import { extractErrorMessage } from '../../api/client';
import { chatApi, matchesApi, moderationApi } from '../../api/endpoints';
import { Button } from '../../components/Button';
import { MatchProfileHeader } from '../../components/profile/MatchProfileHeader';
import { ProfileAboutSection } from '../../components/profile/ProfileAboutSection';
import { ProfileHeroCard } from '../../components/profile/ProfileHeroCard';
import { ProfileInterestsSection } from '../../components/profile/ProfileInterestsSection';
import { ProfilePhotosGallery } from '../../components/profile/ProfilePhotosGallery';
import { Screen } from '../../components/Screen';
import { RootStackParamList } from '../../navigation/types';
import { extractInterestsFromBio } from '../../utils/profileDisplay';

type Props = NativeStackScreenProps<RootStackParamList, 'MatchProfile'>;

export function MatchProfileScreen({ route, navigation }: Props) {
  const { t, i18n } = useTranslation();
  const qc = useQueryClient();
  const { matchId } = route.params;

  const { data, isLoading, error } = useQuery({
    queryKey: ['match-profile', matchId],
    queryFn: () => matchesApi.profile(matchId),
  });

  const openChat = async () => {
    if (!data) return;
    try {
      const conv = data.conversationId
        ? { id: data.conversationId }
        : await chatApi.ensureConversation(data.matchId);
      navigation.navigate('Conversation', {
        conversationId: conv.id,
        otherName: data.user.firstName,
        otherUserId: data.user.id,
        otherUserAge: data.user.age,
        otherUserPhoto: data.user.photos[0]?.url ?? null,
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
    if (!data) return;
    Alert.alert(t('profile.block'), t('profile.blockConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('profile.block'),
        style: 'destructive',
        onPress: async () => {
          try {
            await moderationApi.block(data.user.id);
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
    if (!data) return;
    Alert.alert(t('profile.report'), t('profile.reportComingSoon'));
  };

  if (isLoading) {
    return (
      <Screen>
        <View className="flex-1 items-center justify-center">
          <Text className="text-ink-400">{t('common.loading')}</Text>
        </View>
      </Screen>
    );
  }

  if (error || !data) {
    return (
      <Screen>
        <MatchProfileHeader />
        <View className="flex-1 items-center justify-center px-5">
          <Text className="text-ink-400 text-center">
            {error ? extractErrorMessage(error) : t('common.error')}
          </Text>
        </View>
      </Screen>
    );
  }

  const profile = data.user;
  const interests = extractInterestsFromBio(profile.bio, i18n.language);

  return (
    <Screen scroll padded={false}>
      <MatchProfileHeader
        onUnmatch={handleUnmatch}
        onBlock={handleBlock}
        onReport={handleReport}
      />

      <ProfileHeroCard
        profile={profile}
        onActionPress={openChat}
        actionIcon="chatbubble"
      />

      <View className="px-5 pb-8">
        <ProfileAboutSection bio={profile.bio} />
        <ProfileInterestsSection interests={interests} />
        <ProfilePhotosGallery photos={profile.photos} readOnly />

        <Button
          label={t('profile.sendMessage')}
          onPress={openChat}
          fullWidth
          className="bg-coral-500 active:bg-coral-600"
        />

        {profile.isPremium ? (
          <View className="mt-4 bg-coral-50 rounded-2xl py-3.5 items-center border border-coral-100">
            <Text className="text-coral-600 font-semibold">{t('profile.matchIsPremium')}</Text>
          </View>
        ) : null}
      </View>
    </Screen>
  );
}
