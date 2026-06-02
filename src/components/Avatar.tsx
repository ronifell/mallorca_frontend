import React from 'react';
import { Image, Text, View } from 'react-native';

interface Props {
  uri?: string | null;
  name?: string | null;
  size?: number;
}

export function Avatar({ uri, name, size = 56 }: Props) {
  const initial = (name ?? '?').trim().charAt(0).toUpperCase();
  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={{ width: size, height: size, borderRadius: size / 2 }}
        className="bg-cream-300"
      />
    );
  }
  return (
    <View
      style={{ width: size, height: size, borderRadius: size / 2 }}
      className="bg-brand-100 items-center justify-center"
    >
      <Text className="text-brand-600 font-bold" style={{ fontSize: size * 0.4 }}>
        {initial}
      </Text>
    </View>
  );
}
