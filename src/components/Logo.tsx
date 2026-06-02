import React from 'react';
import { Text, View } from 'react-native';

interface Props {
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Brand mark inspired by the citasmallorca.es circular logo: a red heart in a
 * warm cream rosette. Pure SVG-less implementation keeps the bundle small and
 * works without external assets.
 */
export function Logo({ size = 'md' }: Props) {
  const dim = size === 'sm' ? 40 : size === 'md' ? 64 : 96;
  const heart = size === 'sm' ? 16 : size === 'md' ? 26 : 40;
  return (
    <View
      style={{ width: dim, height: dim }}
      className="rounded-full bg-cream-100 border-2 border-ink-700 items-center justify-center"
    >
      <Text style={{ fontSize: heart }} className="text-brand-500">
        ♥
      </Text>
    </View>
  );
}
