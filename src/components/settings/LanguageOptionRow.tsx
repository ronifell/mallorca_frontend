import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { colors } from '../../theme/colors';

interface Props {
  flag: string;
  title: string;
  subtitle: string;
  selected: boolean;
  onPress: () => void;
  showDivider?: boolean;
}

export function LanguageOptionRow({
  flag,
  title,
  subtitle,
  selected,
  onPress,
  showDivider = false,
}: Props) {
  return (
    <>
      <Pressable
        onPress={onPress}
        accessibilityRole="radio"
        accessibilityState={{ selected }}
        className="flex-row items-center px-4 py-4 active:bg-cream-50"
      >
        <View
          className="w-12 h-9 rounded-lg items-center justify-center overflow-hidden"
          style={{ backgroundColor: colors.cream[100] }}
        >
          <Text className="text-2xl leading-8">{flag}</Text>
        </View>

        <View className="flex-1 ml-3.5">
          <Text className="text-ink-700 font-bold text-base">{title}</Text>
          <Text className="text-ink-400 text-sm mt-0.5">{subtitle}</Text>
        </View>

        <View
          className={`w-6 h-6 rounded-full border-2 items-center justify-center ${
            selected ? 'border-coral-500' : 'border-cream-400'
          }`}
        >
          {selected ? (
            <View className="w-3 h-3 rounded-full" style={{ backgroundColor: colors.coral[500] }} />
          ) : null}
        </View>
      </Pressable>
      {showDivider ? <View className="h-px bg-cream-300 mx-4" /> : null}
    </>
  );
}
