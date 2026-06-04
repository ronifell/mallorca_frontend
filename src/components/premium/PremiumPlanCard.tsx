import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';
import { SubscriptionPlan } from '../../api/types';
import { colors } from '../../theme/colors';

interface Props {
  plan: SubscriptionPlan;
  selected: boolean;
  onSelect: () => void;
}

export function PremiumPlanCard({ plan, selected, onSelect }: Props) {
  const { t } = useTranslation();
  const periodLabel = plan.period === 'year' ? t('premium.perYear') : t('premium.perMonth');

  return (
    <Pressable
      onPress={onSelect}
      className={`rounded-2xl p-4 mb-3 border-2 flex-row items-center ${
        selected ? 'border-coral-500 bg-coral-50' : 'border-cream-300 bg-white'
      }`}
    >
      <View className="flex-1 pr-3">
        <Text className="text-ink-700 font-bold text-base">{plan.name}</Text>
        <Text className="text-ink-400 text-sm mt-0.5">{plan.description}</Text>
        {plan.id === 'annual_premium' ? (
          <View className="self-start bg-coral-500 mt-2 px-2.5 py-1 rounded-md">
            <Text className="text-white text-xs font-bold">{t('premium.save')}</Text>
          </View>
        ) : null}
      </View>

      <View className="items-end mr-3">
        <Text className="text-ink-700 font-bold text-lg">{plan.price}</Text>
        <Text className="text-ink-400 text-xs">{periodLabel}</Text>
      </View>

      <View
        className={`w-6 h-6 rounded-full items-center justify-center border-2 ${
          selected ? 'bg-coral-500 border-coral-500' : 'border-cream-400 bg-white'
        }`}
      >
        {selected ? <Ionicons name="checkmark" size={14} color={colors.white} /> : null}
      </View>
    </Pressable>
  );
}
