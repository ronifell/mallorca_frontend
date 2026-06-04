import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';
import { ProfileDisplayData } from '../../api/types';
import { Logo } from '../Logo';
import { StackedPhotoDeck } from './StackedPhotoDeck';
import { colors } from '../../theme/colors';
import { buildProfileDetails, formatProfileLocation } from '../../utils/profileDisplay';
import { resolveMediaUrl } from '../../utils/mediaUrl';

interface Props {
  profile: ProfileDisplayData;
  onActionPress?: () => void;
  actionIcon?: keyof typeof Ionicons.glyphMap;
  showVerified?: boolean;
  /** Slightly shorter photo area (own profile tab). */
  compactPhoto?: boolean;
}

export function ProfileHeroCard({
  profile,
  onActionPress,
  actionIcon = 'heart',
  showVerified = true,
  compactPhoto = false,
}: Props) {
  const { t } = useTranslation();
  const cover = resolveMediaUrl(profile.photos[0]?.url);
  const backPhotoOne = resolveMediaUrl(profile.photos[1]?.url);
  const backPhotoTwo = resolveMediaUrl(profile.photos[2]?.url);
  const photoCount = profile.photos.length;
  const details = buildProfileDetails(profile, t);
  const locationLine = formatProfileLocation(profile.city, t);

  const photoAspect = compactPhoto ? 'aspect-[3/4]' : 'aspect-[4/5]';

  return (
    <View
      className={`mx-5 rounded-3xl bg-white ${compactPhoto ? 'mb-4' : 'mb-6'}`}
      style={{
        shadowColor: '#3D2618',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 4,
      }}
    >
      <View className={`px-3 pt-5 ${compactPhoto ? 'pb-2' : 'pb-3'}`}>
        <View className={`relative w-full ${photoAspect}`} style={{ overflow: 'visible' }}>
          <StackedPhotoDeck
            coverUri={cover}
            backUris={[backPhotoOne, backPhotoTwo]}
            placeholder={<Logo size="lg" />}
          />

          <View
            className="absolute top-3 left-3 flex-row items-center bg-black/55 rounded-full px-3 py-1.5"
            style={{ zIndex: 10 }}
          >
            <View className="w-2 h-2 rounded-full bg-green-400 mr-2" />
            <Text className="text-white text-xs font-semibold">{t('profile.online')}</Text>
          </View>

          {photoCount > 0 ? (
            <View
              className="absolute bottom-3 right-3 flex-row items-center bg-black/55 rounded-full px-2.5 py-1.5"
              style={{ zIndex: 10 }}
            >
              <Ionicons name="camera-outline" size={12} color="#FFFFFF" />
              <Text className="text-white text-xs font-semibold ml-1">
                1 / {photoCount}
              </Text>
            </View>
          ) : null}
        </View>
      </View>

      <View className={`px-4 ${compactPhoto ? 'pt-3 pb-3' : 'pt-4 pb-4'}`}>
        <View className="flex-row items-start justify-between">
          <View className="flex-1 pr-3">
            <View className="flex-row items-center flex-wrap">
              <Text className="text-ink-700 text-2xl font-bold">
                {profile.firstName ?? '—'}
                {profile.age ? `, ${profile.age}` : ''}
              </Text>
              {showVerified ? (
                <View className="ml-2 w-6 h-6 rounded-full bg-coral-500 items-center justify-center">
                  <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                </View>
              ) : null}
            </View>

            {locationLine ? (
              <View className="flex-row items-center mt-1.5">
                <Ionicons name="location-outline" size={14} color={colors.ink[400]} />
                <Text className="text-ink-400 text-sm ml-1">{locationLine}</Text>
              </View>
            ) : null}
          </View>

          {onActionPress ? (
            <Pressable
              onPress={onActionPress}
              className="w-11 h-11 rounded-full bg-coral-50 items-center justify-center"
            >
              <Ionicons name={actionIcon} size={22} color={colors.coral[500]} />
            </Pressable>
          ) : null}
        </View>

        {details.length ? (
          <View className="flex-row mt-4 pt-3 border-t border-cream-200">
            {details.map((item, index) => (
              <View
                key={`${item.icon}-${item.label}`}
                className={`flex-1 flex-row items-center justify-center px-1 ${
                  index > 0 ? 'border-l border-cream-200' : ''
                }`}
              >
                <Ionicons name={item.icon} size={14} color={colors.coral[500]} />
                <Text className="text-ink-700 text-xs font-semibold ml-1" numberOfLines={1}>
                  {item.label}
                </Text>
              </View>
            ))}
          </View>
        ) : null}
      </View>
    </View>
  );
}
