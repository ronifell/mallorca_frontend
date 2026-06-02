import React from 'react';
import { Pressable, Text } from 'react-native';

interface Props {
  label: string;
  selected?: boolean;
  onPress?: () => void;
}

export function Chip({ label, selected, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      className={`px-4 py-2 rounded-pill mr-2 mb-2 border ${
        selected
          ? 'bg-brand-500 border-brand-500'
          : 'bg-white border-cream-400'
      }`}
    >
      <Text
        className={`font-semibold ${selected ? 'text-white' : 'text-ink-700'}`}
      >
        {label}
      </Text>
    </Pressable>
  );
}
