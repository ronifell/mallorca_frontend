import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';
import { colors } from '../../theme/colors';

interface Props {
  onPress?: () => void;
}

export function PremiumConversationBanner({ onPress }: Props) {
  const { t } = useTranslation();

  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center px-4 py-3 bg-coral-50 border-b border-coral-100"
    >
      <Ionicons name="ribbon" size={18} color="#C9A227" style={{ marginRight: 8 }} />
      <Text className="flex-1 text-ink-700 text-sm">{t('chat.premiumActive')}</Text>
      <Ionicons name="chevron-forward" size={18} color={colors.coral[500]} />
    </Pressable>
  );
}
