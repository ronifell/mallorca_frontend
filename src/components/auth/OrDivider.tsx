import React from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

export function OrDivider() {
  const { t } = useTranslation();

  return (
    <View className="flex-row items-center my-5">
      <View className="flex-1 h-px bg-cream-300" />
      <Text className="mx-4 text-ink-400 text-xs font-semibold tracking-widest uppercase">
        {t('common.or')}
      </Text>
      <View className="flex-1 h-px bg-cream-300" />
    </View>
  );
}
