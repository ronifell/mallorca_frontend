import React from 'react';
import { Image, View } from 'react-native';

// In-app brand mark uses the original (pre-padding) logo so that the
// emblem actually fills its display box on every screen. The OS launcher
// icon keeps using `assets/icon.png` via `app.json` so the home-screen
// app icon remains untouched.
const brandIcon = require('../../assets/logo-source.png');

const SIZE_MAP = { sm: 56, md: 96, lg: 132 } as const;

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
