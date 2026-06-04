import React from 'react';
import { Text, View } from 'react-native';

interface Props {
  label: string;
}

export function ChatDateSeparator({ label }: Props) {
  return (
    <View className="items-center my-4">
      <Text className="text-ink-400 text-xs font-medium">{label}</Text>
    </View>
  );
}
