import React from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import { BrandHeartLogo } from '../auth/BrandHeartLogo';

export function PremiumHero() {
  const { t } = useTranslation();

  return (
    <View className="items-center mt-2 mb-6">
      <BrandHeartLogo size={88} />
      <View className="items-center mt-5">
        <Text className="text-ink-700 font-serif text-3xl text-center">
          {t('auth.appNameCitas')} {t('auth.appNameMallorca')}{' '}
          <Text className="text-coral-500">{t('premium.premiumLabel')}</Text>
        </Text>
      </View>
      <Text className="text-ink-400 text-sm mt-2 text-center px-4">{t('premium.subtitle')}</Text>
    </View>
  );
}
