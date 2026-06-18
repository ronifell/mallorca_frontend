import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';
import { isSpecialCityValue, resolveCityLabel } from '../../config/cityOptions';
import { colors } from '../../theme/colors';

interface Props {
  name: string;
  age: number | null;
  city: string | null;
  distanceKm?: number;
  verified?: boolean;
  actionIcon?: keyof typeof Ionicons.glyphMap;
  actionAccessibilityLabel?: string;
  onActionPress?: () => void;
}

function formatCity(
  city: string | null,
  t: (key: string) => string,
): string | null {
  if (!city) return null;
  const label = resolveCityLabel(city, t);
  if (!label) return null;
  // Translated catch-all tags already describe a location semantically —
  // don't append ", Mallorca" to "Outside Spain" etc.
  if (isSpecialCityValue(city)) return label;
  return label.toLowerCase().includes('mallorca') ? label : `${label}, Mallorca`;
}

/**
 * Identity row that sits directly on the page background underneath the hero
 * photo. Shows the candidate's name + age with a verified checkmark, a
 * location line ("City, Mallorca · 5 km away") and a circular action button
 * on the right (heart for swipe flows, pencil for the own profile, etc.).
 */
export function CandidateIdentityRow({
  name,
  age,
  city,
  distanceKm,
  verified = true,
  actionIcon = 'heart',
  actionAccessibilityLabel,
  onActionPress,
}: Props) {
  const { t } = useTranslation();
  const cityLine = formatCity(city, t);
  const hasDistance = typeof distanceKm === 'number' && Number.isFinite(distanceKm);
  const distanceLabel = hasDistance
    ? t('discovery.kmAway', { count: Math.max(1, Math.round(distanceKm as number)) })
    : t('discovery.nearby');

  return (
    <View className="flex-row items-center justify-between px-5 mb-5">
      <View className="flex-1 pr-3">
        <View className="flex-row items-center flex-wrap">
          <Text className="text-ink-700 text-2xl font-bold">
            {name}
            {age != null ? `, ${age}` : ''}
          </Text>
          {verified ? (
            <View className="ml-2 w-5 h-5 rounded-full bg-coral-500 items-center justify-center">
              <Ionicons name="checkmark" size={12} color="#FFFFFF" />
            </View>
          ) : null}
        </View>

        {cityLine ? (
          <View className="flex-row items-center mt-1.5">
            <Ionicons
              name="location-outline"
              size={13}
              color={colors.ink[400]}
            />
            <Text className="text-ink-400 text-[13px] ml-1">
              {cityLine}
              <Text className="text-ink-400"> · {distanceLabel}</Text>
            </Text>
          </View>
        ) : null}
      </View>

      {onActionPress ? (
        <Pressable
          onPress={onActionPress}
          accessibilityRole="button"
          accessibilityLabel={actionAccessibilityLabel ?? t('discovery.like')}
          className="w-11 h-11 rounded-full items-center justify-center"
          style={{ backgroundColor: colors.coral[50] }}
        >
          <Ionicons name={actionIcon} size={20} color={colors.coral[500]} />
        </Pressable>
      ) : null}
    </View>
  );
}
