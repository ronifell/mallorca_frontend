import React from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import { Logo } from '../Logo';

export function PremiumHero() {
  const { t } = useTranslation();

  return (
    <View className="mb-5">
      <Logo size={56} />
      <View className="mt-3">
        <Text className="text-ink-700 font-bold text-xl">
          {t('auth.appNameCitas')} {t('auth.appNameMallorca')}
        </Text>
        <Text className="text-coral-500 font-bold text-[32px] leading-9 mt-0.5">
          {t('premium.premiumLabel')}
        </Text>
        <Text className="text-ink-400 text-sm mt-1.5 leading-5">{t('premium.subtitle')}</Text>
      </View>
    </View>
  );
}
