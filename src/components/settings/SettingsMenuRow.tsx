import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { colors } from '../../theme/colors';

interface Props {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  onPress?: () => void;
  showDivider?: boolean;
  trailing?: React.ReactNode;
}

export function SettingsMenuRow({
  icon,
  title,
  description,
  onPress,
  showDivider = false,
  trailing,
}: Props) {
  return (
    <>
      <Pressable
        onPress={onPress}
        disabled={!onPress}
        className="flex-row items-center px-4 py-4 active:bg-cream-50"
        accessibilityRole="button"
      >
        <View
          className="w-10 h-10 rounded-xl items-center justify-center mr-3.5"
          style={{ backgroundColor: colors.coral[50] }}
        >
          <Ionicons name={icon} size={20} color={colors.coral[500]} />
        </View>

        <View className="flex-1 pr-3">
          <Text className="text-ink-700 font-bold text-base">{title}</Text>
          <Text className="text-ink-400 text-sm mt-0.5 leading-5">{description}</Text>
        </View>

        {trailing ?? (
          <Ionicons name="chevron-forward" size={20} color={colors.ink[400]} />
        )}
      </Pressable>
      {showDivider ? <View className="h-px bg-cream-300 mx-4" /> : null}
    </>
  );
}
