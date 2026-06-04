import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Image, LayoutChangeEvent, StyleSheet, View, ViewStyle } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { colors } from '../../theme/colors';

interface Props {
  photoUrls: string[];
  activeIndex: number;
  onIndexChange: (index: number) => void;
  placeholder?: React.ReactNode;
}

type SwapSnapshot = {
  dir: -1 | 1;
  outgoing: string;
  incoming: string;
};

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

const SWAP_DURATION_MS = 280;
const SWIPE_COMMIT_RATIO = 0.22;

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

function modIndex(index: number, count: number) {
  if (count <= 0) return 0;
  return ((index % count) + count) % count;
}

function MonochromeOverlay({ variant }: { variant: 'rear' | 'mid' }) {
  const palette = MONO[variant];
  return (
    <>
      <View
        style={[styles.monoBlendLayer, { backgroundColor: palette.tint, mixBlendMode: 'saturation' }]}
      />
      <View
        style={[styles.monoBlendLayer, { backgroundColor: palette.shade, mixBlendMode: 'multiply' }]}
      />
    </>
  );
}

function IdleBackCard({
  uri,
  variant,
}: {
  uri: string | null;
  variant: 'rear' | 'mid';
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
      ]}
    >
      {uri ? (
        <Image source={{ uri }} style={styles.cardImage} resizeMode="cover" />
      ) : (
        <View style={[styles.backFallback, { backgroundColor: palette.base }]}>
          <Ionicons
            name={isRear ? 'images-outline' : 'camera-outline'}
            size={isRear ? 40 : 32}
            color={colors.cream[300]}
          />
        </View>
      )}
      <View style={styles.monoWrap} pointerEvents="none">
        <MonochromeOverlay variant={variant} />
      </View>
    </View>
  );
}

export function StackedPhotoDeck({
  photoUrls,
  activeIndex,
  onIndexChange,
  placeholder,
}: Props) {
  const count = photoUrls.length;
  const index = modIndex(activeIndex, count);

  const currentUri = count > 0 ? photoUrls[index] : null;
  const nextUri = count > 1 ? photoUrls[modIndex(index + 1, count)] : null;
  const prevUri = count > 1 ? photoUrls[modIndex(index - 1, count)] : null;

  const [swap, setSwap] = useState<SwapSnapshot | null>(null);
  const swapRef = useRef<SwapSnapshot | null>(null);

  const containerWidth = useSharedValue(280);
  const progress = useSharedValue(0);
  const swapDir = useSharedValue(0);
  const snapshotLocked = useSharedValue(false);

  const onLayout = useCallback(
    (e: LayoutChangeEvent) => {
      containerWidth.value = e.nativeEvent.layout.width;
    },
    [containerWidth],
  );

  const clearSwap = useCallback(() => {
    swapRef.current = null;
    setSwap(null);
    snapshotLocked.value = false;
  }, [snapshotLocked]);

  const lockSnapshot = useCallback(
    (dir: -1 | 1) => {
      if (swapRef.current?.dir === dir) return;
      const outgoing = photoUrls[index];
      const incoming = photoUrls[modIndex(index + dir, count)];
      if (!outgoing || !incoming) return;

      const snap: SwapSnapshot = { dir, outgoing, incoming };
      swapRef.current = snap;
      setSwap(snap);
    },
    [count, index, photoUrls],
  );

  const finishSwap = useCallback(
    (dir: -1 | 1) => {
      onIndexChange(modIndex(index + dir, count));
      progress.value = 0;
      swapDir.value = 0;
      clearSwap();
    },
    [clearSwap, count, index, onIndexChange, progress, swapDir],
  );

  const cancelSwap = useCallback(() => {
    progress.value = withSpring(0, { damping: 18, stiffness: 220 });
    swapDir.value = 0;
    clearSwap();
  }, [clearSwap, progress, swapDir]);

  const commitSwap = useCallback(
    (dir: -1 | 1) => {
      lockSnapshot(dir);
      swapDir.value = dir;
      const remaining = Math.max(0, 1 - progress.value);
      progress.value = withTiming(
        1,
        { duration: remaining * SWAP_DURATION_MS },
        (done) => {
          if (done) {
            runOnJS(finishSwap)(dir);
          }
        },
      );
    },
    [finishSwap, lockSnapshot, progress, swapDir],
  );

  const pan = useMemo(
    () =>
      Gesture.Pan()
        .enabled(count > 1)
        .activeOffsetX([-20, 20])
        .failOffsetY([-16, 16])
        .onBegin(() => {
          snapshotLocked.value = false;
        })
        .onUpdate((e) => {
          const w = containerWidth.value;
          if (w <= 0) return;

          if (e.translationX < 0) {
            swapDir.value = -1;
            progress.value = Math.min(1, -e.translationX / w);
            if (!snapshotLocked.value && -e.translationX > 8) {
              snapshotLocked.value = true;
              runOnJS(lockSnapshot)(-1);
            }
          } else if (e.translationX > 0) {
            swapDir.value = 1;
            progress.value = Math.min(1, e.translationX / w);
            if (!snapshotLocked.value && e.translationX > 8) {
              snapshotLocked.value = true;
              runOnJS(lockSnapshot)(1);
            }
          }
        })
        .onEnd(() => {
          const p = progress.value;
          const dir = swapDir.value;

          if (dir === -1 && p >= SWIPE_COMMIT_RATIO) {
            runOnJS(commitSwap)(-1);
          } else if (dir === 1 && p >= SWIPE_COMMIT_RATIO) {
            runOnJS(commitSwap)(1);
          } else {
            runOnJS(cancelSwap)();
          }
        }),
    [
      cancelSwap,
      commitSwap,
      containerWidth,
      count,
      lockSnapshot,
      progress,
      snapshotLocked,
      swapDir,
    ],
  );

  const incomingCardStyle = useAnimatedStyle(() => {
    const p = progress.value;
    const dir = swapDir.value;
    const isNext = dir === -1;

    return {
      top: interpolate(p, [0, 1], [isNext ? 8 : 18, 2]),
      left: interpolate(p, [0, 1], [isNext ? 38 : -10, 12]),
      right: interpolate(p, [0, 1], [isNext ? -8 : 44, 12]),
      bottom: interpolate(p, [0, 1], [isNext ? 18 : 28, 4]),
      transform: [
        { rotate: `${interpolate(p, [0, 1], [isNext ? 12 : -14, 0])}deg` },
        { translateX: interpolate(p, [0, 1], [isNext ? 10 : -10, 0]) },
        { translateY: interpolate(p, [0, 1], [isNext ? -2 : 4, 0]) },
      ],
      zIndex: 2,
    };
  });

  const incomingMonoFade = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.72, 1], [1, 0.2, 0], Extrapolation.CLAMP),
  }));

  const outgoingSlideStyle = useAnimatedStyle(() => {
    const p = progress.value;
    const dir = swapDir.value;
    const w = containerWidth.value;

    if (dir === -1) {
      return { transform: [{ translateX: -p * w }], zIndex: 3 };
    }
    if (dir === 1) {
      return { transform: [{ translateX: p * w }], zIndex: 3 };
    }
    return { transform: [{ translateX: 0 }], zIndex: 3 };
  });

  if (count === 0) {
    return (
      <View style={styles.container} onLayout={onLayout}>
        <View style={[styles.frontCard, frontShadow, { zIndex: 2 }]}>
          <View style={styles.frontPlaceholder}>{placeholder}</View>
        </View>
      </View>
    );
  }

  const incomingVariant = swap?.dir === 1 ? 'rear' : 'mid';

  return (
    <GestureDetector gesture={pan}>
      <View style={styles.container} onLayout={onLayout}>
        {!swap ? (
          <>
            <IdleBackCard uri={prevUri} variant="rear" />
            <IdleBackCard uri={nextUri} variant="mid" />
          </>
        ) : null}

        {swap ? (
          <Animated.View
            style={[
              styles.backCard,
              cardShadow,
              { backgroundColor: MONO[incomingVariant].base },
              incomingCardStyle,
            ]}
          >
            <Image source={{ uri: swap.incoming }} style={styles.cardImage} resizeMode="cover" />
            <Animated.View style={[styles.monoWrap, incomingMonoFade]} pointerEvents="none">
              <MonochromeOverlay variant={incomingVariant} />
            </Animated.View>
          </Animated.View>
        ) : null}

        {swap ? (
          <Animated.View style={[styles.frontCard, frontShadow, outgoingSlideStyle]}>
            <Image source={{ uri: swap.outgoing }} style={styles.cardImage} resizeMode="cover" />
          </Animated.View>
        ) : (
          <View style={[styles.frontCard, frontShadow, { zIndex: 3 }]}>
            {currentUri ? (
              <Image source={{ uri: currentUri }} style={styles.cardImage} resizeMode="cover" />
            ) : (
              <View style={styles.frontPlaceholder}>{placeholder}</View>
            )}
          </View>
        )}
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    height: '100%',
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
    zIndex: 0,
    transform: [{ rotate: '-14deg' }, { translateX: -10 }, { translateY: 4 }],
  },
  backCardMid: {
    top: 8,
    left: 38,
    right: -8,
    bottom: 18,
    zIndex: 1,
    transform: [{ rotate: '12deg' }, { translateX: 10 }, { translateY: -2 }],
  },
  backFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monoWrap: {
    ...StyleSheet.absoluteFillObject,
  },
  monoBlendLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  frontCard: {
    position: 'absolute',
    top: 2,
    left: 12,
    right: 12,
    bottom: 4,
    borderRadius: 16,
    borderWidth: 2.5,
    borderColor: colors.white,
    overflow: 'hidden',
    backgroundColor: colors.cream[200],
  },
  frontPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.cream[200],
  },
});
