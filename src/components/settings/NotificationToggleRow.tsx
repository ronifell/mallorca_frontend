import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Switch, Text, View } from 'react-native';
import { colors } from '../../theme/colors';

interface Props {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  showDivider?: boolean;
}

export function NotificationToggleRow({
  icon,
  title,
  description,
  value,
  onValueChange,
  showDivider = false,
}: Props) {
  return (
    <>
      <View className="flex-row items-center px-4 py-4">
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

        <Switch
          value={value}
          onValueChange={onValueChange}
          trackColor={{ false: colors.cream[300], true: colors.coral[500] }}
          thumbColor={colors.white}
          ios_backgroundColor={colors.cream[300]}
        />
      </View>
      {showDivider ? <View className="h-px bg-cream-300 mx-4" /> : null}
    </>
  );
}
