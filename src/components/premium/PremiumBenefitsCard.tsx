import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import { colors } from '../../theme/colors';

const benefits = [
  { icon: 'chatbubble' as const, titleKey: 'benefit1Title', descKey: 'benefit1Desc' },
  { icon: 'close-circle' as const, titleKey: 'benefit2Title', descKey: 'benefit2Desc' },
  { icon: 'star' as const, titleKey: 'benefit3Title', descKey: 'benefit3Desc' },
];

export function PremiumBenefitsCard() {
  const { t } = useTranslation();

  return (
    <View
      className="bg-white rounded-2xl p-5 mb-5"
      style={{
        shadowColor: '#3D2618',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
      }}
    >
      <Text className="text-ink-700 font-bold text-base mb-4">{t('premium.benefitsTitle')}</Text>

      {benefits.map((item, index) => (
        <View
          key={item.titleKey}
          className={`flex-row items-start ${index < benefits.length - 1 ? 'mb-4' : ''}`}
        >
          <View className="w-11 h-11 rounded-full bg-coral-50 items-center justify-center mr-3">
            <Ionicons name={item.icon} size={20} color={colors.coral[500]} />
          </View>
          <View className="flex-1 pt-0.5">
            <Text className="text-ink-700 font-bold text-sm">{t(`premium.${item.titleKey}`)}</Text>
            <Text className="text-ink-400 text-sm mt-0.5 leading-5">{t(`premium.${item.descKey}`)}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}
