import React, { useEffect, useState } from 'react';
import { Dimensions, Image, Pressable, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { FeedCandidate } from '../api/types';
import { resolveMediaUrl } from '../utils/mediaUrl';

interface Props {
  candidate: FeedCandidate;
  onSwipe: (dir: 'left' | 'right') => void;
  swipeable?: boolean;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25;

export function SwipeCard({ candidate, onSwipe, swipeable = true }: Props) {
  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const rotate = useSharedValue(0);
  const [photoIdx, setPhotoIdx] = useState(0);

  useEffect(() => {
    setPhotoIdx(0);
    x.value = 0;
    y.value = 0;
    rotate.value = 0;
  }, [candidate.id]);

  const fly = (dir: 'left' | 'right') => {
    x.value = withTiming(dir === 'right' ? SCREEN_WIDTH * 1.5 : -SCREEN_WIDTH * 1.5, {
      duration: 250,
    });
    rotate.value = withTiming(dir === 'right' ? 0.3 : -0.3, { duration: 250 });
    setTimeout(() => onSwipe(dir), 250);
  };

  const pan = Gesture.Pan()
    .enabled(swipeable)
    .onUpdate((e) => {
      x.value = e.translationX;
      y.value = e.translationY;
      rotate.value = e.translationX / SCREEN_WIDTH;
    })
    .onEnd(() => {
      if (x.value > SWIPE_THRESHOLD) {
        runOnJS(fly)('right');
      } else if (x.value < -SWIPE_THRESHOLD) {
        runOnJS(fly)('left');
      } else {
        x.value = withSpring(0);
        y.value = withSpring(0);
        rotate.value = withSpring(0);
      }
    });

  const cardStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: x.value },
      { translateY: y.value },
      { rotateZ: `${rotate.value * 15}deg` },
    ],
  }));

  const likeStyle = useAnimatedStyle(() => ({
    opacity: interpolate(x.value, [0, SWIPE_THRESHOLD], [0, 1], 'clamp'),
  }));
  const passStyle = useAnimatedStyle(() => ({
    opacity: interpolate(x.value, [-SWIPE_THRESHOLD, 0], [1, 0], 'clamp'),
  }));

  const photo = resolveMediaUrl(candidate.photos[photoIdx]?.url);
  const photoCount = candidate.photos.length;

  return (
    <GestureDetector gesture={pan}>
      <Animated.View
        style={[
          { width: '100%', aspectRatio: 3 / 4 },
          cardStyle,
        ]}
        className="rounded-3xl overflow-hidden bg-cream-300 shadow-lg"
      >
        {photo ? (
          <Image source={{ uri: photo }} className="w-full h-full" />
        ) : (
          <View className="w-full h-full items-center justify-center">
            <Text className="text-5xl">♥</Text>
          </View>
        )}

        {/* photo paging indicators */}
        {photoCount > 1 ? (
          <View className="absolute top-3 left-3 right-3 flex-row gap-1">
            {candidate.photos.map((_, i) => (
              <View
                key={i}
                className={`flex-1 h-1 rounded-full ${i === photoIdx ? 'bg-white' : 'bg-white/40'}`}
              />
            ))}
          </View>
        ) : null}

        {/* invisible touch zones to advance photos */}
        {photoCount > 1 ? (
          <>
            <Pressable
              onPress={() => setPhotoIdx((i) => Math.max(0, i - 1))}
              className="absolute top-0 bottom-0 left-0 w-1/3"
            />
            <Pressable
              onPress={() => setPhotoIdx((i) => Math.min(photoCount - 1, i + 1))}
              className="absolute top-0 bottom-0 right-0 w-1/3"
            />
          </>
        ) : null}

        {/* Dark scrim behind the bottom labels. A flat semi-transparent overlay
            avoids the platform-specific gradient setup while keeping the text
            readable over any photo. */}
        <View
          className="absolute bottom-0 left-0 right-0 p-5"
          style={{ backgroundColor: 'rgba(26, 14, 7, 0.55)' }}
        >
          <Text className="text-white text-3xl font-bold">
            {candidate.firstName ?? '—'}, {candidate.age}
          </Text>
          {candidate.city ? <Text className="text-white">{candidate.city}</Text> : null}
          {candidate.bio ? (
            <Text className="text-white/90 mt-2" numberOfLines={3}>
              {candidate.bio}
            </Text>
          ) : null}
        </View>

        <Animated.View
          style={likeStyle}
          className="absolute top-8 right-6 px-4 py-2 border-4 border-success rounded-2xl rotate-[-12deg]"
        >
          <Text className="text-success font-bold text-2xl">LIKE</Text>
        </Animated.View>
        <Animated.View
          style={passStyle}
          className="absolute top-8 left-6 px-4 py-2 border-4 border-brand-500 rounded-2xl rotate-[12deg]"
        >
          <Text className="text-brand-500 font-bold text-2xl">PASS</Text>
        </Animated.View>
      </Animated.View>
    </GestureDetector>
  );
}
