import { Ionicons } from '@expo/vector-icons';
import React, { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../../theme/colors';

interface Props {
  photoUri: string | null;
  photoIndex: number;
  photoCount: number;
  /** Forces Image remount when the candidate or photo changes (avoids stale cache). */
  photoKey?: string;
  online?: boolean;
  isPremium?: boolean;
  onPrev?: () => void;
  onNext?: () => void;
  /** Optional control rendered on the top-right of the photo (e.g. options menu). */
  topRightSlot?: ReactNode;
}

const BORDER_RADIUS = 24;

/**
 * Large hero photo for profile screens. Uses an outer shadow wrapper plus an
 * inner clip container so aspectRatio + elevation stay centred on Android.
 */
export function CandidatePhotoHero({
  photoUri,
  photoIndex,
  photoCount,
  photoKey,
  online = true,
  isPremium = false,
  onPrev,
  onNext,
  topRightSlot,
}: Props) {
  const { t } = useTranslation();

  return (
    <View style={styles.outer}>
      <View style={styles.shadowShell}>
        <View style={styles.clipShell}>
          {photoUri ? (
            <Image
              key={photoKey ?? photoUri}
              source={{ uri: photoUri }}
              style={styles.photo}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.empty}>
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

          {topRightSlot ? (
            <View className="absolute top-3 right-3">{topRightSlot}</View>
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
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    width: '100%',
    marginBottom: 16,
    alignSelf: 'center',
  },
  shadowShell: {
    width: '100%',
    borderRadius: BORDER_RADIUS,
    backgroundColor: colors.cream[300],
    shadowColor: '#3D2618',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14,
    shadowRadius: 14,
    elevation: 6,
  },
  clipShell: {
    width: '100%',
    aspectRatio: 1 / 1.08,
    borderRadius: BORDER_RADIUS,
    overflow: 'hidden',
    backgroundColor: colors.cream[300],
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.cream[300],
  },
});
