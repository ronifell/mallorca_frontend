import React from 'react';
import { Image, View } from 'react-native';

const brandIcon = require('../../assets/icon.png');

const SIZE_MAP = { sm: 40, md: 64, lg: 96 } as const;

type SizeProp = keyof typeof SIZE_MAP | number;

function resolveSize(size: SizeProp): number {
  return typeof size === 'number' ? size : SIZE_MAP[size];
}

interface Props {
  size?: SizeProp;
}

/** App brand mark from `assets/icon.png`. */
export function Logo({ size = 'md' }: Props) {
  const dim = resolveSize(size);

  return (
    <View style={{ width: dim, height: dim }}>
      <Image
        source={brandIcon}
        style={{ width: dim, height: dim, borderRadius: dim / 2 }}
        resizeMode="cover"
        accessibilityRole="image"
        accessibilityLabel="Citas Mallorca"
      />
    </View>
  );
}
