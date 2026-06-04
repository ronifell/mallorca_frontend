import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { TextInput, View } from 'react-native';
import { colors } from '../../theme/colors';

interface Props {
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
}

export function SocialSearchBar({ value, onChangeText, placeholder }: Props) {
  return (
    <View className="flex-row items-center bg-white rounded-2xl px-4 py-3 border border-cream-300 mb-4">
      <Ionicons name="search-outline" size={18} color={colors.ink[400]} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.ink[400]}
        className="flex-1 ml-2 text-ink-700 text-base"
        autoCapitalize="none"
        autoCorrect={false}
      />
    </View>
  );
}
