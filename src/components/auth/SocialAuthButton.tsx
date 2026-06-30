import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { colors } from '../../theme/colors';

type Provider = 'google' | 'apple';

interface Props {
  provider: Provider;
  label: string;
  onPress?: () => void;
  loading?: boolean;
  disabled?: boolean;
}

export function SocialAuthButton({ provider, label, onPress, loading, disabled }: Props) {
  const isDisabled = disabled || loading;
  return (
    <Pressable
      onPress={isDisabled ? undefined : onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!isDisabled, busy: !!loading }}
      className={`flex-row items-center justify-center bg-white border border-cream-300 rounded-2xl py-3.5 px-4 mb-3 active:bg-cream-50 ${
        isDisabled ? 'opacity-60' : ''
      }`}
    >
      <View className="w-6 items-center mr-3">
        {loading ? (
          <ActivityIndicator size="small" color={colors.ink[400]} />
        ) : provider === 'google' ? (
          <Ionicons name="logo-google" size={20} color="#4285F4" />
        ) : (
          <Ionicons name="logo-apple" size={22} color="#1A0E07" />
        )}
      </View>
      <Text className="text-ink-700 font-semibold text-base">{label}</Text>
    </Pressable>
  );
}
