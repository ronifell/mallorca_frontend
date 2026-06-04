import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { colors } from '../../theme/colors';

interface RowProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  onPress?: () => void;
  detail?: string;
  accentTitle?: boolean;
  isLast?: boolean;
}

export function SettingsRow({
  icon,
  title,
  description,
  onPress,
  detail,
  accentTitle,
  isLast,
}: RowProps) {
  const borderClass = isLast ? '' : 'border-b border-cream-200';

  const inner = (
    <>
      <View className="w-11 h-11 rounded-full bg-coral-50 items-center justify-center mr-3">
        <Ionicons name={icon} size={20} color={colors.coral[500]} />
      </View>

      <View className="flex-1 pr-2">
        <Text
          className={`font-bold text-base ${
            accentTitle ? 'text-coral-500' : 'text-ink-700'
          }`}
        >
          {title}
        </Text>
        <Text className="text-ink-400 text-sm mt-0.5">{description}</Text>
      </View>

      <View className="flex-row items-center">
        {detail ? (
          <Text className="text-coral-500 font-semibold text-sm mr-1">{detail}</Text>
        ) : null}
        <Ionicons name="chevron-forward" size={18} color={colors.ink[400]} />
      </View>
    </>
  );

  if (!onPress) {
    return <View className={`flex-row items-center px-4 py-4 ${borderClass}`}>{inner}</View>;
  }

  return (
    <Pressable
      onPress={onPress}
      className={`flex-row items-center px-4 py-4 active:bg-cream-50 ${borderClass}`}
    >
      {inner}
    </Pressable>
  );
}
