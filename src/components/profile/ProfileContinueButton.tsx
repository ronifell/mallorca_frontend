import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

interface Props {
  label: string;
  onPress?: () => void;
  loading?: boolean;
  disabled?: boolean;
}

export function ProfileContinueButton({ label, onPress, loading, disabled }: Props) {
  return (
    <Pressable
      onPress={loading || disabled ? undefined : onPress}
      className={`flex-row items-center justify-center bg-coral-500 active:bg-coral-600 rounded-2xl py-4 px-6 w-full ${
        disabled ? 'opacity-50' : ''
      }`}
    >
      {loading ? (
        <ActivityIndicator color="#FFFFFF" />
      ) : (
        <>
          <Text className="text-white font-bold text-base flex-1 text-center">{label}</Text>
          <View className="absolute right-6">
            <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
          </View>
        </>
      )}
    </Pressable>
  );
}
