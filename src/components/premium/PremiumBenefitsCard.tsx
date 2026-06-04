import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import { colors } from '../../theme/colors';

const benefits = [
  { icon: 'chatbubble-outline' as const, titleKey: 'benefit1Title', descKey: 'benefit1Desc' },
  { icon: 'close-circle-outline' as const, titleKey: 'benefit2Title', descKey: 'benefit2Desc' },
  { icon: 'star-outline' as const, titleKey: 'benefit3Title', descKey: 'benefit3Desc' },
];

export function PremiumBenefitsCard() {
  const { t } = useTranslation();

  return (
    <View className="bg-white rounded-3xl px-5 py-5 mb-4" style={cardShadow}>
      <Text className="text-ink-700 font-bold text-base mb-1">{t('premium.benefitsTitle')}</Text>

      {benefits.map((item, index) => (
        <View key={item.titleKey}>
          <View className="flex-row items-start py-4">
            <View
              className="w-11 h-11 rounded-full items-center justify-center mr-3"
              style={{ backgroundColor: colors.coral[50] }}
            >
              <Ionicons name={item.icon} size={20} color={colors.coral[500]} />
            </View>
            <View className="flex-1 pt-0.5">
              <Text className="text-ink-700 font-bold text-sm">{t(`premium.${item.titleKey}`)}</Text>
              <Text className="text-ink-400 text-sm mt-1 leading-5">{t(`premium.${item.descKey}`)}</Text>
            </View>
          </View>
          {index < benefits.length - 1 ? (
            <View className="h-px bg-cream-300" />
          ) : null}
        </View>
      ))}
    </View>
  );
}

const cardShadow = {
  shadowColor: '#3D2618',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.08,
  shadowRadius: 10,
  elevation: 3,
};
