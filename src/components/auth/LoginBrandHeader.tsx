import React from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import { useTopScreenPadding } from '../../hooks/useTopScreenPadding';
import { Logo } from '../Logo';

/** Brand block over the login hero: logo with name and tagline stacked below. */
export function LoginBrandHeader() {
  const { t } = useTranslation();
  const topPadding = useTopScreenPadding(12);

  return (
    <View className="px-6" style={{ paddingTop: topPadding }}>
      <Logo size={104} />
      <View className="mt-3">
        <View className="flex-row items-baseline flex-wrap">
          <Text className="text-ink-700 font-bold text-3xl">{t('auth.appNameCitas')} </Text>
          <Text className="text-coral-500 font-bold text-3xl">{t('auth.appNameMallorca')}</Text>
        </View>
        <Text className="text-ink-700 text-sm font-semibold mt-1.5 leading-5">
          {t('auth.brandTaglineLine1')}
          {'\n'}
          {t('auth.brandTaglineLine2')}
        </Text>
      </View>
    </View>
  );
}
