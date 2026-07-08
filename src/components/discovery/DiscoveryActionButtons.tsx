import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { colors } from '../../theme/colors';

interface Props {
  onPass: () => void;
  onLike: () => void;
  onSuperLike: () => void;
  /** Remaining weekly Super Likes for Premium users; null/undefined hides the badge. */
  superLikeRemaining?: number | null;
  /** When false, the Super Like star is shown locked (non-Premium users). */
  superLikeEnabled?: boolean;
  likeLoading?: boolean;
  superLikeLoading?: boolean;
  disabled?: boolean;
}

export function DiscoveryActionButtons({
  onPass,
  onLike,
  onSuperLike,
  superLikeRemaining,
  superLikeEnabled = true,
  likeLoading = false,
  superLikeLoading = false,
  disabled = false,
}: Props) {
  const blocked = disabled || likeLoading || superLikeLoading;

  return (
    <View className="flex-row items-center justify-center mt-5 mb-2">
      <Pressable
        onPress={blocked ? undefined : onPass}
        disabled={blocked}
        className="w-14 h-14 rounded-full bg-white border border-cream-300 items-center justify-center"
        style={{
          shadowColor: '#3D2618',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 6,
          elevation: 3,
          opacity: blocked ? 0.5 : 1,
        }}
      >
        <Text className="text-coral-500 text-2xl font-bold leading-none">×</Text>
      </Pressable>

      <Pressable
        onPress={blocked ? undefined : onLike}
        disabled={blocked}
        accessibilityRole="button"
        className="w-[72px] h-[72px] rounded-full bg-coral-500 items-center justify-center mx-6"
        style={{
          shadowColor: '#E8554E',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.35,
          shadowRadius: 8,
          elevation: 6,
          opacity: blocked && !likeLoading ? 0.7 : 1,
        }}
      >
        {likeLoading ? (
          <ActivityIndicator color="#FFFFFF" size="small" />
        ) : (
          <Ionicons name="heart" size={30} color="#FFFFFF" />
        )}
      </Pressable>

      <Pressable
        onPress={blocked ? undefined : onSuperLike}
        disabled={blocked}
        accessibilityRole="button"
        className="w-14 h-14 rounded-full bg-white border border-cream-300 items-center justify-center"
        style={{
          shadowColor: '#3D2618',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 6,
          elevation: 3,
          opacity: blocked && !superLikeLoading ? 0.5 : 1,
        }}
      >
        {superLikeLoading ? (
          <ActivityIndicator color="#F5B301" size="small" />
        ) : (
          <Ionicons name="star" size={26} color="#F5B301" />
        )}
        {!superLikeEnabled ? (
          <View className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-coral-500 items-center justify-center">
            <Ionicons name="lock-closed" size={11} color="#FFFFFF" />
          </View>
        ) : superLikeRemaining != null ? (
          <View className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 rounded-full bg-coral-500 items-center justify-center">
            <Text className="text-white text-[11px] font-bold">{superLikeRemaining}</Text>
          </View>
        ) : null}
      </Pressable>
    </View>
  );
}

interface TagProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
}

export function ProfileInfoTag({ icon, label }: TagProps) {
  return (
    <View className="flex-row items-center px-3 py-1.5 rounded-pill border border-white/50 bg-black/20 mr-2 mb-2">
      <Ionicons name={icon} size={12} color="#FFFFFF" style={{ marginRight: 5 }} />
      <Text className="text-white text-xs font-semibold">{label}</Text>
    </View>
  );
}
