import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Image, Pressable, Text, View } from 'react-native';
import { colors } from '../../theme/colors';

interface Props {
  photoUri: string | null;
  photoIndex: number;
  photoCount: number;
  online?: boolean;
  isPremium?: boolean;
  onPrev?: () => void;
  onNext?: () => void;
  onMenuPress?: () => void;
}

/**
 * Large hero photo for the candidate profile screen. Contains:
 *  - the active photo (rounded card with soft shadow)
 *  - top-left "Online" pill
 *  - top-right "ellipsis" menu trigger
 *  - bottom-right photo counter (1 / N)
 *  - optional premium pill (right of online pill)
 *  - invisible tap zones on the left/right thirds to step between photos
 */
export function CandidatePhotoHero({
  photoUri,
  photoIndex,
  photoCount,
  online = true,
  isPremium = false,
  onPrev,
  onNext,
  onMenuPress,
}: Props) {
  const { t } = useTranslation();

  return (
    <View
      className="mx-5 mb-4 rounded-3xl bg-cream-300 overflow-hidden"
      style={{
        aspectRatio: 1 / 1.08,
        shadowColor: '#3D2618',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.14,
        shadowRadius: 14,
        elevation: 6,
      }}
    >
      {photoUri ? (
        <Image
          source={{ uri: photoUri }}
          className="w-full h-full"
          resizeMode="cover"
        />
      ) : (
        <View className="w-full h-full items-center justify-center bg-cream-300">
          <Ionicons name="image-outline" size={48} color={colors.cream[400]} />
        </View>
      )}

      <View
        className="absolute top-3 left-3 flex-row items-center bg-black/55 rounded-full px-3 py-1.5"
        pointerEvents="none"
      >
        {online ? (
          <View className="w-2 h-2 rounded-full bg-green-400 mr-2" />
        ) : null}
        <Text className="text-white text-xs font-semibold">
          {online ? t('profile.online') : t('chat.online')}
        </Text>
      </View>

      {isPremium ? (
        <View
          className="absolute top-3 left-28 flex-row items-center rounded-full px-2.5 py-1.5"
          style={{ backgroundColor: colors.coral[500] }}
          pointerEvents="none"
        >
          <Ionicons name="ribbon" size={11} color="#FFFFFF" />
          <Text className="text-white text-[10px] font-bold ml-1">
            {t('profile.premiumBadge')}
          </Text>
        </View>
      ) : null}

      {onMenuPress ? (
        <Pressable
          onPress={onMenuPress}
          accessibilityRole="button"
          accessibilityLabel={t('profile.openMenu')}
          className="absolute top-3 right-3 w-8 h-8 items-center justify-center"
          hitSlop={8}
        >
          <Ionicons name="ellipsis-vertical" size={20} color="#FFFFFF" />
        </Pressable>
      ) : null}

      {photoCount > 0 ? (
        <View
          className="absolute bottom-3 right-3 flex-row items-center bg-black/55 rounded-md px-2 py-1"
          pointerEvents="none"
        >
          <Ionicons name="image-outline" size={12} color="#FFFFFF" />
          <Text className="text-white text-xs font-semibold ml-1.5">
            {photoIndex + 1}/{photoCount}
          </Text>
        </View>
      ) : null}

      {photoCount > 1 ? (
        <>
          {onPrev ? (
            <Pressable
              onPress={onPrev}
              accessibilityRole="button"
              accessibilityLabel={t('common.back')}
              className="absolute top-0 bottom-16 left-0 w-1/3"
            />
          ) : null}
          {onNext ? (
            <Pressable
              onPress={onNext}
              accessibilityRole="button"
              accessibilityLabel={t('common.continue')}
              className="absolute top-0 bottom-16 right-0 w-1/3"
            />
          ) : null}
        </>
      ) : null}
    </View>
  );
}
