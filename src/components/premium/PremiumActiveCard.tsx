import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import { colors } from '../../theme/colors';

interface Props {
  expiryDate?: string | null;
}

export function PremiumActiveCard({ expiryDate }: Props) {
  const { t } = useTranslation();

  return (
    <View
      className="rounded-2xl px-4 py-4 mb-4 flex-row items-center"
      style={{ backgroundColor: colors.coral[50] }}
    >
      <View
        className="w-11 h-11 rounded-full items-center justify-center mr-3"
        style={{ backgroundColor: colors.coral[100] }}
      >
        <Ionicons name="ribbon" size={22} color={colors.coral[500]} />
      </View>
      <View className="flex-1">
        <Text className="text-coral-500 font-bold text-base">{t('premium.active')}</Text>
        {expiryDate ? (
          <Text className="text-ink-400 text-sm mt-0.5">
            {t('premium.until')}: {new Date(expiryDate).toLocaleDateString()}
          </Text>
        ) : null}
      </View>
    </View>
  );
}
