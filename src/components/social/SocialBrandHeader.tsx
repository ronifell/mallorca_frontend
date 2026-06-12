import { Ionicons } from '@expo/vector-icons';
import React, { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';
import { colors } from '../../theme/colors';

function CircleIconButton({
  children,
  onPress,
  accessibilityLabel,
  outlined,
}: {
  children: ReactNode;
  onPress?: () => void;
  accessibilityLabel: string;
  outlined?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      className={`w-10 h-10 rounded-full items-center justify-center ${
        outlined ? 'border-2 border-coral-500 bg-white' : 'bg-white border border-cream-300'
      }`}
      style={{
        shadowColor: '#3D2618',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: outlined ? 0 : 0.08,
        shadowRadius: 4,
        elevation: 2,
      }}
    >
      {children}
    </Pressable>
  );
}

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
        <CircleIconButton
          outlined
          onPress={onRightPress}
          accessibilityLabel={t('matches.openMessages')}
        >
          <Ionicons name="chatbubble-outline" size={18} color={colors.coral[500]} />
        </CircleIconButton>
        {showNotificationDot ? (
          <View className="absolute top-0 right-0 w-2.5 h-2.5 rounded-full bg-coral-500 border-2 border-cream-200" />
        ) : null}
      </View>
    </View>
  );
}
