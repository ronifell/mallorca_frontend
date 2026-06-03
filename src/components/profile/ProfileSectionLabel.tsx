import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, View } from 'react-native';
import { colors } from '../../theme/colors';

interface Props {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}

export function ProfileSectionLabel({ label, icon }: Props) {
  return (
    <View className="flex-row items-center mb-2 mt-1">
      <View className="w-8 h-8 rounded-full bg-coral-50 items-center justify-center mr-2.5">
        <Ionicons name={icon} size={16} color={colors.coral[500]} />
      </View>
      <Text className="text-ink-700 font-semibold text-base">{label}</Text>
    </View>
  );
}
