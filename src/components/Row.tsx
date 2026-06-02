import React, { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';

interface Props {
  label: string;
  detail?: ReactNode;
  onPress?: () => void;
  destructive?: boolean;
  chevron?: boolean;
}

export function Row({ label, detail, onPress, destructive, chevron = true }: Props) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center bg-white px-4 py-4 border-b border-cream-200"
    >
      <Text className={`flex-1 ${destructive ? 'text-brand-500' : 'text-ink-700'} font-semibold`}>
        {label}
      </Text>
      {typeof detail === 'string' ? <Text className="text-ink-400 mr-2">{detail}</Text> : detail}
      {onPress && chevron ? <Text className="text-ink-400">›</Text> : null}
    </Pressable>
  );
}

export function SectionCard({ children }: { children: ReactNode }) {
  return <View className="rounded-2xl overflow-hidden mb-5 bg-white">{children}</View>;
}
