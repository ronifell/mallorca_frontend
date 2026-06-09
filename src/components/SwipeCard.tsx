import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useState } from 'react';
import { Dimensions, Image, Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
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
import { colors } from '../theme/colors';
import { resolveMediaUrl } from '../utils/mediaUrl';
import {
  genderIcon,
  genderLabel,
  interestedInIcon,
  interestedInLabel,
  languageLabel,
} from '../utils/profileDisplay';

interface Props {
  candidate: FeedCandidate;
  onSwipe: (dir: 'left' | 'right') => void;
  onInfoPress?: () => void;
  onCardPress?: () => void;
  swipeable?: boolean;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25;

interface QuickFact {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}

function buildQuickFacts(candidate: FeedCandidate, t: (k: string) => string): QuickFact[] {
  const facts: QuickFact[] = [];

  if (candidate.gender) {
    facts.push({
      icon: genderIcon(candidate.gender),
      label: t('profile.iAm'),
      value: genderLabel(candidate.gender, t),
    });
  }

  if (candidate.interestedIn) {
    facts.push({
      icon: interestedInIcon(candidate.interestedIn),
      label: t('profile.lookingFor'),
      value: interestedInLabel(candidate.interestedIn, t),
    });
  }

  if (candidate.languages.length) {
    facts.push({
      icon: 'globe-outline',
      label: t('profile.languages'),
      value: candidate.languages
        .slice(0, 2)
        .map((id) => languageLabel(id, t))
        .join(', '),
    });
  }

  return facts;
}

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
  const facts = useMemo(() => buildQuickFacts(candidate, t), [candidate, t]);

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
              className="absolute top-0 bottom-44 left-0 w-1/3"
            />
            <Pressable
              onPress={() => setPhotoIdx((i) => Math.min(photoCount - 1, i + 1))}
              className="absolute top-0 bottom-44 right-0 w-1/3"
            />
          </>
        ) : null}

        <View
          className="absolute bottom-0 left-0 right-0 px-4 pt-16 pb-4"
          style={{ backgroundColor: 'rgba(26, 14, 7, 0.62)' }}
        >
          <View className="flex-row items-center mb-1">
            <Text className="text-white text-3xl font-bold">
              {candidate.firstName ?? '—'}, {candidate.age}
            </Text>
            <View className="ml-2 w-6 h-6 rounded-full bg-coral-500 items-center justify-center">
              <Ionicons name="checkmark" size={14} color="#FFFFFF" />
            </View>
          </View>

          {locationLine ? (
            <View className="flex-row items-center mb-2.5">
              <Ionicons name="location-outline" size={14} color="#FFFFFF" style={{ marginRight: 4 }} />
              <Text className="text-white text-sm">{locationLine}</Text>
              <Text className="text-white/75 text-sm ml-2">· {t('discovery.nearby')}</Text>
            </View>
          ) : null}

          {facts.length ? (
            <View className="mb-2 gap-1">
              {facts.map((f) => (
                <View key={`${f.label}-${f.value}`} className="flex-row items-center">
                  <Ionicons name={f.icon} size={13} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text className="text-white/70 text-xs mr-1.5">{f.label}:</Text>
                  <Text className="text-white text-xs font-semibold flex-1" numberOfLines={1}>
                    {f.value}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}

          <View className="flex-row items-end">
            {candidate.bio ? (
              <Text className="text-white/95 text-sm flex-1 pr-3" numberOfLines={2}>
                {candidate.bio}
              </Text>
            ) : (
              <View className="flex-1" />
            )}
            {onInfoPress ? (
              <Pressable
                onPress={onInfoPress}
                className="w-9 h-9 rounded-full bg-white/90 items-center justify-center"
              >
                <Ionicons name="open-outline" size={18} color={colors.ink[700]} />
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
