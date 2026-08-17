import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';
import { colors } from '../../theme/colors';

interface Props {
  onRightPress?: () => void;
  showNotificationDot?: boolean;
}

export function SocialBrandHeader({ onRightPress, showNotificationDot }: Props) {
  const { t } = useTranslation();

  return (
    <View className="flex-row items-center justify-between px-5 pt-2 pb-2">
      <View style={{ width: 40 }} />

      <View className="flex-row items-baseline">
        <Text className="text-ink-700 font-serif text-xl">{t('auth.appNameCitas')} </Text>
        <Text className="text-coral-500 font-serif text-xl">{t('auth.appNameMallorca')}</Text>
      </View>

      <View>
        <Pressable
          onPress={onRightPress}
          accessibilityRole="button"
          accessibilityLabel={t('matches.openMessages')}
          hitSlop={8}
          className="w-10 h-10 items-center justify-center"
        >
          <Ionicons name="chatbubble-outline" size={22} color={colors.coral[500]} />
        </Pressable>
        {showNotificationDot ? (
          <View className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-coral-500" />
        ) : null}
      </View>
    </View>
  );
}
