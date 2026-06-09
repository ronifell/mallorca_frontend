import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';
import { ProfileDisplayData } from '../../api/types';
import { Logo } from '../Logo';
import { StackedPhotoDeck } from './StackedPhotoDeck';
import { colors } from '../../theme/colors';
import {
  formatProfileLocation,
  genderIcon,
  genderLabel,
  interestedInIcon,
  interestedInLabel,
  languageLabel,
} from '../../utils/profileDisplay';
import { resolveMediaUrl } from '../../utils/mediaUrl';

interface Props {
  profile: ProfileDisplayData;
  onActionPress?: () => void;
  actionIcon?: keyof typeof Ionicons.glyphMap;
  showVerified?: boolean;
  /** Slightly shorter photo area (own profile tab). */
  compactPhoto?: boolean;
}

function modIndex(index: number, count: number) {
  if (count <= 0) return 0;
  return ((index % count) + count) % count;
}

interface FactRowProps {
  iconBg: string;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}

function FactRow({ iconBg, icon, label, value }: FactRowProps) {
  return (
    <View className="flex-row items-center py-1.5">
      <View
        className="w-9 h-9 rounded-xl items-center justify-center mr-3"
        style={{ backgroundColor: iconBg }}
      >
        <Ionicons name={icon} size={16} color={colors.coral[500]} />
      </View>
      <View className="flex-1">
        <Text className="text-ink-400 text-[11px] uppercase tracking-wide">{label}</Text>
        <Text className="text-ink-700 font-semibold text-sm" numberOfLines={1}>
          {value}
        </Text>
      </View>
    </View>
  );
}

export function ProfileHeroCard({
  profile,
  onActionPress,
  actionIcon = 'heart',
  showVerified = true,
  compactPhoto = false,
}: Props) {
  const { t } = useTranslation();
  const [photoIndex, setPhotoIndex] = useState(0);
  const photoCount = profile.photos.length;
  const photoKey = useMemo(
    () => profile.photos.map((p) => p.id).join(','),
    [profile.photos],
  );

  const photoUrls = useMemo(
    () =>
      profile.photos
        .map((p) => resolveMediaUrl(p.url))
        .filter((url): url is string => Boolean(url)),
    [profile.photos],
  );

  useEffect(() => {
    setPhotoIndex(0);
  }, [photoKey]);

  const currentIndex = modIndex(photoIndex, photoCount);

  const locationLine = formatProfileLocation(profile.city, t);

  const photoAspect = compactPhoto ? 'aspect-[5/6]' : 'aspect-[4/5]';

  const showLanguages = profile.languages && profile.languages.length > 0;
  const languagesValue = useMemo(
    () => profile.languages.map((id) => languageLabel(id, t)).join(', '),
    [profile.languages, t],
  );

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
      <View className={`px-3 ${compactPhoto ? 'pt-4 pb-2 items-center' : 'pt-5 pb-3'}`}>
        <View
          className={`relative ${photoAspect} ${compactPhoto ? 'w-[88%] self-center' : 'w-full'}`}
          style={{ overflow: 'visible' }}
        >
          <StackedPhotoDeck
            photoUrls={photoUrls}
            activeIndex={currentIndex}
            onIndexChange={setPhotoIndex}
            placeholder={<Logo size="lg" />}
          />

          <View
            className="absolute top-3 left-3 flex-row items-center bg-black/55 rounded-full px-3 py-1.5"
            style={{ zIndex: 10 }}
            pointerEvents="none"
          >
            <View className="w-2 h-2 rounded-full bg-green-400 mr-2" />
            <Text className="text-white text-xs font-semibold">{t('profile.online')}</Text>
          </View>

          {profile.isPremium ? (
            <View
              className="absolute top-3 right-3 flex-row items-center rounded-full px-2.5 py-1.5"
              style={{ backgroundColor: colors.coral[500], zIndex: 10 }}
              pointerEvents="none"
            >
              <Ionicons name="ribbon" size={12} color="#FFFFFF" />
              <Text className="text-white text-xs font-bold ml-1">
                {t('profile.premiumBadge')}
              </Text>
            </View>
          ) : null}

          {photoCount > 0 ? (
            <View
              className="absolute bottom-3 right-3 flex-row items-center bg-black/55 rounded-full px-2.5 py-1.5"
              style={{ zIndex: 10 }}
              pointerEvents="none"
            >
              <Ionicons name="camera-outline" size={12} color="#FFFFFF" />
              <Text className="text-white text-xs font-semibold ml-1">
                {currentIndex + 1} / {photoCount}
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

        <View className="mt-4 pt-3 border-t border-cream-200">
          {profile.gender ? (
            <FactRow
              iconBg={colors.coral[50]}
              icon={genderIcon(profile.gender)}
              label={t('profile.iAm')}
              value={genderLabel(profile.gender, t)}
            />
          ) : null}
          {profile.interestedIn ? (
            <FactRow
              iconBg={colors.coral[50]}
              icon={interestedInIcon(profile.interestedIn)}
              label={t('profile.lookingFor')}
              value={interestedInLabel(profile.interestedIn, t)}
            />
          ) : null}
          {showLanguages ? (
            <FactRow
              iconBg={colors.coral[50]}
              icon="globe-outline"
              label={t('profile.languages')}
              value={languagesValue}
            />
          ) : null}
        </View>
      </View>
    </View>
  );
}
