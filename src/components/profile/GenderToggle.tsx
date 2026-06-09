import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Gender } from '../../api/types';
import { colors } from '../../theme/colors';

interface Props {
  value: Gender | null;
  onChange: (value: Gender) => void;
  /** Translated labels for the inclusive gender options. */
  labels: Record<Gender, string>;
}

interface OptionConfig {
  id: Gender;
  icon: keyof typeof Ionicons.glyphMap;
}

const OPTIONS: OptionConfig[] = [
  { id: 'male', icon: 'male-outline' },
  { id: 'female', icon: 'female-outline' },
  { id: 'non_binary', icon: 'transgender-outline' },
  { id: 'gender_fluid', icon: 'sparkles-outline' },
  { id: 'other', icon: 'ellipse-outline' },
  { id: 'prefer_not_to_say', icon: 'eye-off-outline' },
];

function GenderOption({
  config,
  selected,
  label,
  onPress,
}: {
  config: OptionConfig;
  selected: boolean;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`flex-row items-center px-3.5 py-2 rounded-pill border mr-2 mb-2 ${
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
      <Ionicons name={config.icon} size={16} color={selected ? '#FFFFFF' : colors.ink[400]} />
      <Text
        className={`font-semibold text-sm ml-2 ${selected ? 'text-white' : 'text-ink-700'}`}
      >
        {label}
      </Text>
      {selected ? (
        <Ionicons name="checkmark-circle" size={15} color="#FFFFFF" style={{ marginLeft: 6 }} />
      ) : null}
    </Pressable>
  );
}

export function GenderToggle({ value, onChange, labels }: Props) {
  return (
    <View className="flex-row flex-wrap mb-4">
      {OPTIONS.map((opt) => (
        <GenderOption
          key={opt.id}
          config={opt}
          selected={value === opt.id}
          label={labels[opt.id]}
          onPress={() => onChange(opt.id)}
        />
      ))}
    </View>
  );
}
