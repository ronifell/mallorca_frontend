import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, Text, View } from 'react-native';

type Provider = 'google' | 'apple';

interface Props {
  provider: Provider;
  label: string;
  onPress?: () => void;
}

export function SocialAuthButton({ provider, label, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center justify-center bg-white border border-cream-300 rounded-2xl py-3.5 px-4 mb-3 active:bg-cream-50"
    >
      <View className="w-6 items-center mr-3">
        {provider === 'google' ? (
          <Ionicons name="logo-google" size={20} color="#4285F4" />
        ) : (
          <Ionicons name="logo-apple" size={22} color="#1A0E07" />
        )}
      </View>
      <Text className="text-ink-700 font-semibold text-base">{label}</Text>
    </Pressable>
  );
}
