import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

interface Props {
  size?: number;
}

/** Heart-shaped brand mark with a simplified Mallorca skyline silhouette. */
export function BrandHeartLogo({ size = 72 }: Props) {
  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox="0 0 72 72">
        <Path
          d="M36 62 C18 46 8 34 8 22 C8 13 14 7 22 7 C28 7 33 10 36 15 C39 10 44 7 50 7 C58 7 64 13 64 22 C64 34 54 46 36 62 Z"
          fill="#E8554E"
        />
        {/* Palm trunk */}
        <Rect x="33.5" y="30" width="2.5" height="14" rx="1" fill="#FEF0EE" opacity={0.95} />
        {/* Palm fronds */}
        <Path
          d="M34.5 30 C28 26 24 22 22 18 C26 24 30 27 34.5 30 Z"
          fill="#FEF0EE"
          opacity={0.9}
        />
        <Path
          d="M34.5 30 C41 26 45 22 47 18 C43 24 39 27 34.5 30 Z"
          fill="#FEF0EE"
          opacity={0.9}
        />
        <Path
          d="M34.5 30 C34.5 24 34.5 19 34.5 15 C36 20 36 25 34.5 30 Z"
          fill="#FEF0EE"
          opacity={0.85}
        />
        {/* Cathedral / skyline */}
        <Path
          d="M18 44 L22 36 L24 40 L26 34 L28 40 L30 36 L32 44 Z"
          fill="#FEF0EE"
          opacity={0.92}
        />
        <Rect x="17" y="44" width="16" height="3" rx="0.5" fill="#FEF0EE" opacity={0.88} />
        {/* Water line */}
        <Path
          d="M16 48 C24 46 32 50 40 47 C48 44 54 49 58 47"
          stroke="#FEF0EE"
          strokeWidth="1.2"
          fill="none"
          opacity={0.75}
        />
        <Circle cx="52" cy="47" r="1.2" fill="#FEF0EE" opacity={0.7} />
      </Svg>
    </View>
  );
}
