import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, Text, View } from 'react-native';

type Gender = 'male' | 'female';

interface Props {
  value: Gender | null;
  onChange: (value: Gender) => void;
  maleLabel: string;
  femaleLabel: string;
}

function ToggleOption({
  selected,
  icon,
  label,
  onPress,
}: {
  selected: boolean;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`flex-1 flex-row items-center justify-center py-2.5 rounded-2xl border mx-1 ${
        selected ? 'bg-coral-500 border-coral-500' : 'bg-white border-cream-300'
      }`}
      style={
        selected
          ? undefined
          : {
              shadowColor: '#3D2618',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.06,
              shadowRadius: 4,
              elevation: 1,
            }
      }
    >
      <Ionicons name={icon} size={18} color={selected ? '#FFFFFF' : '#7A5640'} />
      <Text
        className={`font-semibold text-base ml-2 ${selected ? 'text-white' : 'text-ink-700'}`}
      >
        {label}
      </Text>
      {selected ? (
        <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" style={{ marginLeft: 6 }} />
      ) : null}
    </Pressable>
  );
}

export function GenderToggle({ value, onChange, maleLabel, femaleLabel }: Props) {
  return (
    <View className="flex-row mb-4 -mx-1">
      <ToggleOption
        selected={value === 'male'}
        icon="male-outline"
        label={maleLabel}
        onPress={() => onChange('male')}
      />
      <ToggleOption
        selected={value === 'female'}
        icon="female-outline"
        label={femaleLabel}
        onPress={() => onChange('female')}
      />
    </View>
  );
}
