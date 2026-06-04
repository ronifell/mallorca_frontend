import React from 'react';
import { Text, View } from 'react-native';

interface Props {
  title: string;
  count?: number;
}

export function SocialPageTitle({ title, count }: Props) {
  return (
    <View className="flex-row items-center mb-3">
      <Text className="text-ink-700 font-serif text-3xl">{title}</Text>
      {count !== undefined && count > 0 ? (
        <View className="bg-coral-500 rounded-full min-w-[28px] h-7 px-2 items-center justify-center ml-3">
          <Text className="text-white text-sm font-bold">{count}</Text>
        </View>
      ) : null}
    </View>
  );
}
