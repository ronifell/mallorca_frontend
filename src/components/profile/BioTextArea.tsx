import React from 'react';
import { Text, TextInput, TextInputProps, View } from 'react-native';
import { colors } from '../../theme/colors';

interface Props extends TextInputProps {
  value: string;
  maxLength?: number;
}

export function BioTextArea({ value, maxLength = 500, ...rest }: Props) {
  return (
    <View className="mb-4">
      <TextInput
        placeholderTextColor={colors.ink[400]}
        multiline
        maxLength={maxLength}
        value={value}
        textAlignVertical="top"
        {...rest}
        className="bg-white rounded-2xl border border-cream-300 px-4 py-3.5 text-ink-700 text-base min-h-[120px]"
        style={{
          shadowColor: '#3D2618',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.06,
          shadowRadius: 4,
          elevation: 1,
        }}
      />
      <Text className="text-ink-400 text-xs text-right mt-1.5 mr-1">
        {value.length}/{maxLength}
      </Text>
    </View>
  );
}
