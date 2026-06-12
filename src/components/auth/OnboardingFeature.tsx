import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, View } from 'react-native';
import { colors } from '../../theme/colors';

interface Props {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
}

export function OnboardingFeature({ icon, title, description }: Props) {
  return (
    <View className="flex-row items-start">
      <View
        className="w-11 h-11 rounded-full items-center justify-center mr-4"
        style={{ backgroundColor: colors.coral[50] }}
      >
        <Ionicons name={icon} size={22} color={colors.coral[500]} />
      </View>
      <View className="flex-1 pt-0.5">
        <Text
          className="text-ink-700 text-[18px] mb-1"
          style={{ fontFamily: 'PlayfairDisplay_700Bold_Italic' }}
        >
          {title}
        </Text>
        <Text className="text-ink-400 text-sm leading-5">{description}</Text>
      </View>
    </View>
  );
}
