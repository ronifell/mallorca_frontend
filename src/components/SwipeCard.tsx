import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Dimensions, Image, Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { FeedCandidate } from '../api/types';
import { colors } from '../theme/colors';
import { resolveMediaUrl } from '../utils/mediaUrl';

interface Props {
  candidate: FeedCandidate;
  onSwipe: (dir: 'left' | 'right') => void;
  onInfoPress?: () => void;
  onCardPress?: () => void;
  swipeable?: boolean;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25;

export function SwipeCard({ candidate, onSwipe, onInfoPress, onCardPress, swipeable = true }: Props) {
  const { t } = useTranslation();
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
    // Short fly-out animation. We schedule the deck-advance callback for
    // right when the card leaves the visible viewport so the next profile
    // fades into place without any perceptible wait.
    const duration = 180;
    x.value = withTiming(dir === 'right' ? SCREEN_WIDTH * 1.5 : -SCREEN_WIDTH * 1.5, {
      duration,
    });
    rotate.value = withTiming(dir === 'right' ? 0.3 : -0.3, { duration });
    setTimeout(() => onSwipe(dir), duration);
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

  const locationLine = candidate.city
    ? `${candidate.city}${candidate.city.toLowerCase().includes('mallorca') ? '' : ', Mallorca'}`
    : null;

  return (
    <GestureDetector gesture={pan}>
      <Animated.View
        style={[{ width: '100%', aspectRatio: 3 / 4 }, cardStyle]}
        className="rounded-3xl overflow-hidden bg-cream-300"
      >
        {photo ? (
          <Pressable
            onPress={onCardPress}
            disabled={!onCardPress}
            style={{ width: '100%', height: '100%' }}
          >
            <Image source={{ uri: photo }} className="w-full h-full" resizeMode="cover" />
          </Pressable>
        ) : (
          <Pressable
            onPress={onCardPress}
            disabled={!onCardPress}
            className="w-full h-full items-center justify-center bg-cream-300"
          >
            <Text className="text-5xl text-coral-500">♥</Text>
          </Pressable>
        )}

        {photoCount > 0 ? (
          <View className="absolute top-3 left-3 right-3 flex-row gap-1">
            {candidate.photos.map((_, i) => (
              <View
                key={i}
                className={`flex-1 h-1 rounded-full ${i === photoIdx ? 'bg-white' : 'bg-white/35'}`}
              />
            ))}
          </View>
        ) : null}

        <View
          className="absolute top-10 right-3 flex-row items-center"
          pointerEvents="none"
        >
          {candidate.isPremium ? (
            <View
              className="flex-row items-center rounded-full px-2.5 py-1 mr-2"
              style={{ backgroundColor: colors.coral[500] }}
            >
              <Ionicons name="ribbon" size={11} color="#FFFFFF" />
              <Text className="text-white text-[10px] font-bold ml-1">
                {t('profile.premiumBadge')}
              </Text>
            </View>
          ) : null}
          {photoCount > 0 ? (
            <View className="flex-row items-center bg-black/45 rounded-full px-2.5 py-1">
              <Ionicons name="camera-outline" size={12} color="#FFFFFF" />
              <Text className="text-white text-xs font-semibold ml-1">
                {photoIdx + 1}/{photoCount}
              </Text>
            </View>
          ) : null}
        </View>

        {photoCount > 1 ? (
          <>
            <Pressable
              onPress={() => setPhotoIdx((i) => Math.max(0, i - 1))}
              className="absolute top-0 bottom-32 left-0 w-1/3"
            />
            <Pressable
              onPress={() => setPhotoIdx((i) => Math.min(photoCount - 1, i + 1))}
              className="absolute top-0 bottom-32 right-0 w-1/3"
            />
          </>
        ) : null}

        {/* Minimal identity overlay: only name/age + city, no dark full-width
            background so the photo stays the protagonist. A soft gradient
            keeps the text readable without hiding the picture. */}
        <LinearGradient
          colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.55)']}
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            height: 150,
          }}
        />
        <View
          className="absolute bottom-0 left-0 right-0 px-4 pb-4 pt-8"
          pointerEvents="box-none"
        >
          <View className="flex-row items-end justify-between">
            <View className="flex-1 pr-3">
              <View className="flex-row items-center">
                <Text
                  className="text-white text-3xl font-bold"
                  numberOfLines={1}
                  style={{
                    textShadowColor: 'rgba(0,0,0,0.35)',
                    textShadowOffset: { width: 0, height: 1 },
                    textShadowRadius: 4,
                  }}
                >
                  {candidate.firstName ?? '—'}, {candidate.age}
                </Text>
                <View className="ml-2 w-6 h-6 rounded-full bg-coral-500 items-center justify-center">
                  <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                </View>
              </View>

              {locationLine ? (
                <View className="flex-row items-center mt-1">
                  <Ionicons name="location-outline" size={14} color="#FFFFFF" style={{ marginRight: 4 }} />
                  <Text
                    className="text-white text-sm"
                    numberOfLines={1}
                    style={{
                      textShadowColor: 'rgba(0,0,0,0.35)',
                      textShadowOffset: { width: 0, height: 1 },
                      textShadowRadius: 4,
                    }}
                  >
                    {locationLine}
                  </Text>
                </View>
              ) : null}
            </View>

            {onInfoPress ? (
              <Pressable
                onPress={onInfoPress}
                accessibilityRole="button"
                accessibilityLabel={t('profile.viewFullProfile')}
                className="w-10 h-10 rounded-full bg-white/95 items-center justify-center"
                style={{
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.2,
                  shadowRadius: 4,
                  elevation: 3,
                }}
              >
                <Ionicons name="information" size={20} color={colors.ink[700]} />
              </Pressable>
            ) : null}
          </View>
        </View>

        <Animated.View
          style={likeStyle}
          className="absolute top-16 right-6 px-4 py-2 border-4 border-success rounded-2xl rotate-[-12deg]"
        >
          <Text className="text-success font-bold text-2xl">LIKE</Text>
        </Animated.View>
        <Animated.View
          style={passStyle}
          className="absolute top-16 left-6 px-4 py-2 border-4 border-coral-500 rounded-2xl rotate-[12deg]"
        >
          <Text className="text-coral-500 font-bold text-2xl">PASS</Text>
        </Animated.View>
      </Animated.View>
    </GestureDetector>
  );
}
