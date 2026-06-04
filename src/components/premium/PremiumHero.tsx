import React from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import { Logo } from '../Logo';

export function PremiumHero() {
  const { t } = useTranslation();

  return (
    <View className="mb-3">
      <Logo size={50} />
      <View className="mt-2">
        <Text className="text-ink-700 font-bold text-lg">
          {t('auth.appNameCitas')} {t('auth.appNameMallorca')}
        </Text>
        <Text className="text-coral-500 font-bold text-[28px] leading-8 mt-0.5">
          {t('premium.premiumLabel')}
        </Text>
        <Text className="text-ink-400 text-sm mt-1 leading-5">{t('premium.subtitle')}</Text>
      </View>
    </View>
  );
}
