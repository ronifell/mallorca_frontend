import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';
import { usersApi } from '../../api/endpoints';
import { Button } from '../../components/Button';
import { Logo } from '../../components/Logo';
import { Screen } from '../../components/Screen';
import { RootStackParamList } from '../../navigation/types';
import { resolveMediaUrl } from '../../utils/mediaUrl';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function ProfileScreen() {
  const { t } = useTranslation();
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

  const cover = resolveMediaUrl(me.photos[0]?.url);

  return (
    <Screen scroll padded={false}>
      <View className="bg-cream-300 h-72 w-full overflow-hidden">
        {cover ? (
          <Image source={{ uri: cover }} className="w-full h-full" />
        ) : (
          <View className="w-full h-full items-center justify-center">
            <Logo size="lg" />
          </View>
        )}
        <View
          className="absolute bottom-0 left-0 right-0 p-4 flex-row items-end justify-between"
          style={{ backgroundColor: 'rgba(26, 14, 7, 0.5)' }}
        >
          <View>
            <Text className="text-white text-3xl font-bold">
              {me.firstName ?? '—'}
              {me.age ? `, ${me.age}` : ''}
            </Text>
            {me.city ? <Text className="text-white">{me.city}</Text> : null}
          </View>
          {me.isPremium ? (
            <View className="bg-brand-500 px-3 py-1 rounded-full">
              <Text className="text-white font-bold text-xs">PREMIUM</Text>
            </View>
          ) : null}
        </View>
      </View>

      <View className="px-5 pt-5">
        {me.bio ? (
          <View className="bg-white rounded-2xl p-4 mb-4">
            <Text className="text-ink-700">{me.bio}</Text>
          </View>
        ) : null}

        {me.languages.length ? (
          <View className="mb-5">
            <Text className="text-ink-700 font-semibold mb-2">{t('profile.languages')}</Text>
            <View className="flex-row flex-wrap">
              {me.languages.map((l) => (
                <View key={l} className="bg-cream-300 px-3 py-1 rounded-pill mr-2 mb-2">
                  <Text className="text-ink-700">{l}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        <Button label={t('common.edit')} onPress={() => nav.navigate('EditProfile')} fullWidth />
        <View className="h-3" />
        {!me.isPremium ? (
          <Button
            label={t('premium.subscribe')}
            variant="secondary"
            onPress={() => nav.navigate('Premium')}
            fullWidth
          />
        ) : null}
        <View className="h-3" />
        <Pressable onPress={() => nav.navigate('Settings')} className="py-3">
          <Text className="text-brand-500 text-center font-semibold">{t('settings.title')}</Text>
        </Pressable>
      </View>
      <View className="h-10" />
    </Screen>
  );
}
