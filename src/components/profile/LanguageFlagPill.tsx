import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, Text } from 'react-native';
import { colors } from '../../theme/colors';

interface Props {
  flag: string;
  label: string;
  selected?: boolean;
  onPress?: () => void;
}

export function LanguageFlagPill({ flag, label, selected, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      className={`flex-row items-center px-3.5 py-2.5 rounded-pill mr-2 mb-2 border ${
        selected ? 'bg-white border-2 border-coral-500' : 'bg-white border border-cream-300'
      }`}
      style={{
        shadowColor: '#3D2618',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 1,
      }}
    >
      <Text className="text-base mr-1.5">{flag}</Text>
      <Text className={`font-semibold text-sm ${selected ? 'text-coral-500' : 'text-ink-700'}`}>
        {label}
      </Text>
      {selected ? (
        <Ionicons
          name="checkmark-circle"
          size={15}
          color={colors.coral[500]}
          style={{ marginLeft: 5 }}
        />
      ) : null}
    </Pressable>
  );
}
