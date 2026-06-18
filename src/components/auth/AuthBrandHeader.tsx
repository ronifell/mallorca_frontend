import React from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import { BrandHeartLogo } from './BrandHeartLogo';

export function AuthBrandHeader() {
  const { t } = useTranslation();

  return (
    <View className="items-center mb-8">
      <BrandHeartLogo size={112} />
      <View className="flex-row items-baseline mt-4">
        <Text className="text-ink-700 font-serif text-3xl">{t('auth.appNameCitas')} </Text>
        <Text className="text-coral-500 font-serif text-3xl">{t('auth.appNameMallorca')}</Text>
      </View>
      <Text className="text-ink-400 text-sm mt-2 text-center">{t('auth.brandTagline')}</Text>
    </View>
  );
}
