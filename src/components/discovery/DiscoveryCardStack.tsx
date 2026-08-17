import React, { useEffect } from 'react';
import { Image as RNImage, StyleSheet, View } from 'react-native';
import Animated, {
  SharedValue,
  useAnimatedStyle,
} from 'react-native-reanimated';
import { FeedCandidate } from '../../api/types';
import { SwipeCard, SwipeCardHandle } from '../SwipeCard';
import { DiscoveryCardPhotoPreview } from './DiscoveryCardPhotoPreview';
import { resolveMediaUrl } from '../../utils/mediaUrl';

const BACK_SCALE_MIN = 0.96;

interface Props {
  deck: FeedCandidate[];
  coverCandidate: FeedCandidate | null;
  backScale: SharedValue<number>;
  mainRef: React.RefObject<SwipeCardHandle>;
  swipeable: boolean;
  onSwipe: (dir: 'left' | 'right', candidateId: string) => void;
  onFlyStart: (dir: 'left' | 'right') => void;
  onDragProgress: (progress: number) => void;
  onPhotoLoad: () => void;
  onInfoPress: (candidateId: string) => void;
  onCardPress: (candidateId: string) => void;
}

function prefetchPhotos(candidates: FeedCandidate[]) {
  for (const c of candidates) {
    const uri = resolveMediaUrl(c.photos[0]?.url);
    if (uri) void RNImage.prefetch(uri);
  }
}

export function DiscoveryCardStack({
  deck,
  coverCandidate,
  backScale,
  mainRef,
  swipeable,
  onSwipe,
  onFlyStart,
  onDragProgress,
  onPhotoLoad,
  onInfoPress,
  onCardPress,
}: Props) {
  const top = deck[0];

  useEffect(() => {
    prefetchPhotos(deck.slice(0, 3));
  }, [deck]);

  const backAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: backScale.value }],
  }));

  if (!top) return null;

  return (
    <View style={styles.stack}>
      {deck[1] ? (
        <Animated.View
          style={[styles.layer, styles.backLayer, backAnimatedStyle]}
          pointerEvents="none"
        >
          <DiscoveryCardPhotoPreview candidate={deck[1]} />
        </Animated.View>
      ) : null}

      <View style={[styles.layer, styles.mainLayer]}>
        <SwipeCard
          ref={mainRef}
          candidate={top}
          onSwipe={onSwipe}
          onFlyStart={onFlyStart}
          onDragProgress={onDragProgress}
          onPhotoLoad={onPhotoLoad}
          onInfoPress={() => onInfoPress(top.id)}
          onCardPress={() => onCardPress(top.id)}
          swipeable={swipeable}
        />
      </View>

      {coverCandidate ? (
        <View style={[styles.layer, styles.coverLayer]} pointerEvents="none">
          <DiscoveryCardPhotoPreview candidate={coverCandidate} />
        </View>
      ) : null}
    </View>
  );
}

export { BACK_SCALE_MIN };

const styles = StyleSheet.create({
  stack: {
    width: '100%',
    aspectRatio: 3 / 4,
  },
  layer: {
    ...StyleSheet.absoluteFillObject,
  },
  backLayer: {
    zIndex: 1,
    elevation: 1,
  },
  mainLayer: {
    zIndex: 2,
    elevation: 2,
  },
  coverLayer: {
    zIndex: 3,
    elevation: 3,
  },
});
