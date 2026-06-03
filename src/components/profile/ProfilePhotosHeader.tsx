import React from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

export function ProfilePhotosHeader() {
  const { t } = useTranslation();

  return (
    <View className="mb-6">
      <View className="flex-row items-end flex-wrap">
        <View>
          <Text className="text-ink-700 font-serif text-3xl">{t('profile.photosTitlePrefix')}</Text>
          <View className="h-1 w-14 bg-coral-500 rounded-full mt-1.5 opacity-80" />
        </View>
        <Text className="text-coral-500 font-serif text-3xl ml-2 mb-0.5">
          {t('profile.photosTitleAccent')}
        </Text>
      </View>
      <Text className="text-ink-400 text-sm mt-3 leading-5">{t('profile.photosHint')}</Text>
    </View>
  );
}
