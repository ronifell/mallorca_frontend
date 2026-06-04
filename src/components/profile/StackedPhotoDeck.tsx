import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Image, StyleSheet, View, ViewStyle } from 'react-native';
import { colors } from '../../theme/colors';

interface Props {
  coverUri?: string | null;
  backUris?: [string | null | undefined, string | null | undefined];
  placeholder?: React.ReactNode;
}

/** Solid ink tones — no alpha; used for opaque monochrome back cards. */
const MONO = {
  rear: {
    base: '#2A1A10',
    tint: '#5C534C',
    shade: '#1A0E07',
  },
  mid: {
    base: '#322018',
    tint: '#6B625A',
    shade: '#241610',
  },
} as const;

const cardShadow: ViewStyle = {
  shadowColor: '#3D2618',
  shadowOffset: { width: 0, height: 3 },
  shadowOpacity: 0.14,
  shadowRadius: 8,
  elevation: 5,
};

const frontShadow: ViewStyle = {
  shadowColor: '#3D2618',
  shadowOffset: { width: 0, height: 6 },
  shadowOpacity: 0.18,
  shadowRadius: 14,
  elevation: 7,
};

function MonochromeBackPhoto({ uri, variant }: { uri: string; variant: 'rear' | 'mid' }) {
  const palette = MONO[variant];

  return (
    <View style={[styles.backPhotoFill, { backgroundColor: palette.base }]}>
      <Image source={{ uri }} style={styles.backPhotoImage} resizeMode="cover" />
      <View
        style={[
          styles.monoBlendLayer,
          { backgroundColor: palette.tint, mixBlendMode: 'saturation' },
        ]}
      />
      <View
        style={[
          styles.monoBlendLayer,
          { backgroundColor: palette.shade, mixBlendMode: 'multiply' },
        ]}
      />
    </View>
  );
}

function BackCard({
  uri,
  variant,
  style,
}: {
  uri?: string | null;
  variant: 'rear' | 'mid';
  style: ViewStyle;
}) {
  const isRear = variant === 'rear';
  const palette = MONO[variant];

  return (
    <View
      style={[
        styles.backCard,
        isRear ? styles.backCardRear : styles.backCardMid,
        cardShadow,
        { backgroundColor: palette.base },
        style,
        isRear
          ? { transform: [{ rotate: '-14deg' }, { translateX: -10 }, { translateY: 4 }] }
          : { transform: [{ rotate: '12deg' }, { translateX: 10 }, { translateY: -2 }] },
      ]}
    >
      {uri ? (
        <MonochromeBackPhoto uri={uri} variant={variant} />
      ) : (
        <View style={[styles.backFallback, { backgroundColor: palette.base }]}>
          <Ionicons
            name={isRear ? 'images-outline' : 'camera-outline'}
            size={isRear ? 40 : 32}
            color={colors.cream[300]}
          />
        </View>
      )}
    </View>
  );
}

export function StackedPhotoDeck({ coverUri, backUris = [null, null], placeholder }: Props) {
  const [rearUri, midUri] = backUris;
  const rearSource = rearUri ?? (coverUri ? coverUri : null);
  const midSource = midUri ?? (coverUri ? coverUri : null);

  return (
    <View style={styles.container}>
      <BackCard uri={rearSource} variant="rear" style={{ zIndex: 0 }} />
      <BackCard uri={midSource} variant="mid" style={{ zIndex: 1 }} />

      <View style={[styles.frontCard, frontShadow]}>
        {coverUri ? (
          <Image source={{ uri: coverUri }} style={styles.frontImage} resizeMode="cover" />
        ) : (
          <View style={styles.frontPlaceholder}>{placeholder}</View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  backCard: {
    position: 'absolute',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.white,
    overflow: 'hidden',
  },
  backCardRear: {
    top: 18,
    left: -10,
    right: 44,
    bottom: 28,
  },
  backCardMid: {
    top: 8,
    left: 38,
    right: -8,
    bottom: 18,
  },
  backPhotoFill: {
    flex: 1,
    overflow: 'hidden',
  },
  backPhotoImage: {
    ...StyleSheet.absoluteFillObject,
  },
  monoBlendLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  backFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  frontCard: {
    position: 'absolute',
    top: 2,
    left: 12,
    right: 12,
    bottom: 4,
    zIndex: 2,
    borderRadius: 16,
    borderWidth: 2.5,
    borderColor: colors.white,
    overflow: 'hidden',
    backgroundColor: colors.cream[200],
  },
  frontImage: {
    width: '100%',
    height: '100%',
  },
  frontPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.cream[200],
  },
});
