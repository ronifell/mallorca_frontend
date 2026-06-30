import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';

interface Props {
  onPass: () => void;
  onLike: () => void;
  onSuperLike: () => void;
  disabled?: boolean;
  superLikeRemaining?: number | null;
  superLikeEnabled?: boolean;
}

/**
 * Fixed bottom action bar shown over the candidate profile screen. Contains
 * three circular buttons: a smaller "pass" (×) on the left, the prominent
 * coral "like" (♥) in the centre, and a smaller "super like" (★) on the
 * right. The bar honours the bottom safe-area inset so it sits flush with
 * the device's gesture indicator.
 */
export function CandidateActionBar({
  onPass,
  onLike,
  onSuperLike,
  disabled = false,
  superLikeRemaining,
  superLikeEnabled = true,
}: Props) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  return (
    <View
      className="absolute left-0 right-0 bottom-0 bg-white"
      style={{
        paddingBottom: Math.max(insets.bottom, 14),
        paddingTop: 14,
        paddingHorizontal: 32,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: colors.cream[300],
        shadowColor: '#3D2618',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.06,
        shadowRadius: 10,
        elevation: 12,
      }}
    >
      <View className="flex-row items-center justify-between">
        <Pressable
          onPress={onPass}
          disabled={disabled}
          accessibilityRole="button"
          accessibilityLabel={t('discovery.pass')}
          className="w-12 h-12 rounded-full bg-white items-center justify-center"
          style={{
            opacity: disabled ? 0.5 : 1,
            shadowColor: '#3D2618',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 6,
            elevation: 3,
          }}
        >
          <Ionicons name="close" size={24} color={colors.ink[700]} />
        </Pressable>

        <Pressable
          onPress={onLike}
          disabled={disabled}
          accessibilityRole="button"
          accessibilityLabel={t('discovery.like')}
          className="w-16 h-16 rounded-full items-center justify-center"
          style={{
            backgroundColor: colors.coral[500],
            opacity: disabled ? 0.6 : 1,
            shadowColor: colors.coral[500],
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.35,
            shadowRadius: 12,
            elevation: 8,
          }}
        >
          <Ionicons name="heart" size={28} color="#FFFFFF" />
        </Pressable>

        <Pressable
          onPress={onSuperLike}
          disabled={disabled}
          accessibilityRole="button"
          accessibilityLabel={t('discovery.superLike')}
          className="w-12 h-12 rounded-full bg-white items-center justify-center"
          style={{
            opacity: disabled ? 0.5 : 1,
            shadowColor: '#3D2618',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 6,
            elevation: 3,
          }}
        >
          <Ionicons name="star-outline" size={24} color="#F5B301" />
          {!superLikeEnabled ? (
            <View className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-coral-500 items-center justify-center">
              <Ionicons name="lock-closed" size={11} color="#FFFFFF" />
            </View>
          ) : superLikeRemaining != null ? (
            <View className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 rounded-full bg-coral-500 items-center justify-center">
              <Text className="text-white text-[10px] font-bold">{superLikeRemaining}</Text>
            </View>
          ) : null}
        </Pressable>
      </View>
    </View>
  );
}
