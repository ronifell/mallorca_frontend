import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import { colors } from '../../theme/colors';

/**
 * Side-by-side comparison of what every user gets for Free vs. what unlocks
 * with Premium. Keeps the message simple so the upgrade decision is clear.
 */
export function PremiumBenefitsCard() {
  const { t } = useTranslation();

  return (
    <View className="bg-white rounded-2xl px-4 py-3.5 mb-3" style={cardShadow}>
      <Text className="text-ink-700 font-bold text-base mb-2">{t('premium.benefitsTitle')}</Text>

      <BenefitRow
        icon="chatbubble-outline"
        iconColor={colors.ink[700]}
        iconBg={colors.cream[200]}
        badge={t('premium.benefitFreeBadge')}
        badgeColor={colors.ink[700]}
        badgeBg={colors.cream[300]}
        title={t('premium.benefitFreeTitle')}
      />

      <View className="h-px bg-cream-200 my-2" />

      <BenefitRow
        icon="chatbubble-ellipses"
        iconColor={colors.coral[500]}
        iconBg={colors.coral[50]}
        badge={t('premium.benefitPremiumBadge')}
        badgeColor={colors.white}
        badgeBg={colors.coral[500]}
        title={t('premium.benefitPremiumTitle')}
      />
    </View>
  );
}

interface BenefitRowProps {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  iconColor: string;
  iconBg: string;
  badge: string;
  badgeColor: string;
  badgeBg: string;
  title: string;
}

function BenefitRow({
  icon,
  iconColor,
  iconBg,
  badge,
  badgeColor,
  badgeBg,
  title,
}: BenefitRowProps) {
  return (
    <View className="flex-row items-center py-1.5">
      <View
        className="w-10 h-10 rounded-full items-center justify-center mr-3"
        style={{ backgroundColor: iconBg }}
      >
        <Ionicons name={icon} size={18} color={iconColor} />
      </View>
      <View className="flex-1">
        <View
          className="self-start rounded-full px-2 py-0.5 mb-1"
          style={{ backgroundColor: badgeBg }}
        >
          <Text
            className="text-[10px] font-bold tracking-wide uppercase"
            style={{ color: badgeColor }}
          >
            {badge}
          </Text>
        </View>
        <Text className="text-ink-700 font-bold text-sm">{title}</Text>
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
