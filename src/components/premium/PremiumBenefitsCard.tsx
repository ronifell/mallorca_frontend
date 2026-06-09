import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import { colors } from '../../theme/colors';

/**
 * The MVP advertises a single premium benefit (per the product spec):
 *   "You can start conversations".
 * Additional benefits will be added in future iterations.
 */
export function PremiumBenefitsCard() {
  const { t } = useTranslation();

  return (
    <View className="bg-white rounded-2xl px-4 py-3.5 mb-3" style={cardShadow}>
      <Text className="text-ink-700 font-bold text-base mb-1">{t('premium.benefitsTitle')}</Text>

      <View className="flex-row items-start py-2.5">
        <View
          className="w-10 h-10 rounded-full items-center justify-center mr-3"
          style={{ backgroundColor: colors.coral[50] }}
        >
          <Ionicons name="chatbubble-ellipses-outline" size={18} color={colors.coral[500]} />
        </View>
        <View className="flex-1 pt-0.5">
          <Text className="text-ink-700 font-bold text-sm">{t('premium.benefit1Title')}</Text>
          <Text className="text-ink-400 text-xs mt-0.5 leading-4">
            {t('premium.benefit1Desc')}
          </Text>
        </View>
      </View>
    </View>
  );
}

const cardShadow = {
  shadowColor: '#3D2618',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.08,
  shadowRadius: 8,
  elevation: 3,
};
