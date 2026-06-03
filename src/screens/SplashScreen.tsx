import React from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { Logo } from '../components/Logo';
import { colors } from '../theme/colors';

export function SplashScreen() {
  return (
    <View className="flex-1 bg-cream-200 items-center justify-center" style={{ flex: 1, backgroundColor: colors.cream[200] }}>
      <Logo size="lg" />
      <Text className="text-ink-700 text-2xl mt-6">Citas Mallorca</Text>
      <ActivityIndicator color={colors.brand[500]} className="mt-8" />
    </View>
  );
}
