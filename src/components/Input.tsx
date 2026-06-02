import React from 'react';
import { Text, TextInput, TextInputProps, View } from 'react-native';
import { colors } from '../theme/colors';

interface Props extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
}

export function Input({ label, error, hint, ...rest }: Props) {
  return (
    <View className="w-full mb-3">
      {label ? (
        <Text className="text-ink-700 font-semibold mb-1.5 ml-1">{label}</Text>
      ) : null}
      <TextInput
        placeholderTextColor={colors.ink[400]}
        {...rest}
        className={`bg-white rounded-2xl px-4 py-3.5 text-ink-700 text-base border ${
          error ? 'border-brand-500' : 'border-cream-300'
        }`}
      />
      {error ? (
        <Text className="text-brand-500 text-xs mt-1 ml-1">{error}</Text>
      ) : hint ? (
        <Text className="text-ink-400 text-xs mt-1 ml-1">{hint}</Text>
      ) : null}
    </View>
  );
}
