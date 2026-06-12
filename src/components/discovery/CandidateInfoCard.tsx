import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import { InterestedIn, RelationshipGoal } from '../../api/types';
import { RELATIONSHIP_GOAL_LABEL_KEYS } from '../../config/profileOptions';
import { colors } from '../../theme/colors';
import {
  interestedInIcon,
  interestedInLabel,
  languageLabel,
} from '../../utils/profileDisplay';

interface Props {
  interestedIn: InterestedIn | null;
  languages: string[];
  city: string | null;
  country?: string;
  relationshipGoals?: RelationshipGoal[];
  minAge?: number | null;
  maxAge?: number | null;
}

interface RowProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  divider?: boolean;
}

function Row({ icon, label, value, divider = true }: RowProps) {
  return (
    <View
      className={`flex-row items-start py-3 ${divider ? 'border-b border-cream-200' : ''}`}
    >
      <View
        className="w-10 h-10 rounded-full items-center justify-center mr-3"
        style={{ backgroundColor: colors.coral[50] }}
      >
        <Ionicons name={icon} size={18} color={colors.coral[500]} />
      </View>
      <View className="flex-1">
        <Text className="text-ink-400 text-xs">{label}</Text>
        <Text className="text-ink-700 font-semibold text-sm mt-0.5 leading-5">
          {value}
        </Text>
      </View>
    </View>
  );
}

/**
 * White rounded card showing the three primary "facts" about a candidate:
 * who they are interested in, the languages they speak and the full
 * location. Rows are separated by a soft cream divider.
 */
export function CandidateInfoCard({
  interestedIn,
  languages,
  city,
  country = 'España',
  relationshipGoals,
  minAge,
  maxAge,
}: Props) {
  const { t } = useTranslation();

  const languagesValue = languages
    .map((id) => languageLabel(id, t))
    .filter(Boolean)
    .join(', ');

  const locationValue = (() => {
    if (!city) return null;
    const hasMallorca = city.toLowerCase().includes('mallorca');
    const middle = hasMallorca ? city : `${city}, Mallorca`;
    return `${middle}, ${country}`;
  })();

  const relationshipGoalValue = (relationshipGoals ?? [])
    .map((id) => t(RELATIONSHIP_GOAL_LABEL_KEYS[id]))
    .filter(Boolean)
    .join(' · ');

  const ageRangeValue =
    minAge != null && maxAge != null
      ? t('profile.ageRangeValue', { min: minAge, max: maxAge })
      : null;

  const rows: Array<RowProps & { key: string }> = [];

  if (interestedIn) {
    rows.push({
      key: 'interested',
      icon: interestedInIcon(interestedIn),
      label: t('profile.interestedInLabel'),
      value: interestedInLabel(interestedIn, t),
    });
  }

  if (relationshipGoalValue) {
    rows.push({
      key: 'relationshipGoal',
      icon: 'sparkles-outline',
      label: t('profile.relationshipGoalLabel'),
      value: relationshipGoalValue,
    });
  }

  if (ageRangeValue) {
    rows.push({
      key: 'ageRange',
      icon: 'calendar-number-outline',
      label: t('profile.ageRangeLabel'),
      value: ageRangeValue,
    });
  }

  if (languagesValue) {
    rows.push({
      key: 'languages',
      icon: 'language-outline',
      label: t('profile.languagesLabel'),
      value: languagesValue,
    });
  }

  if (locationValue) {
    rows.push({
      key: 'location',
      icon: 'location-outline',
      label: t('profile.locationLabel'),
      value: locationValue,
    });
  }

  if (rows.length === 0) return null;

  return (
    <View
      className="mx-5 mb-5 rounded-2xl bg-white px-4 py-1"
      style={{
        shadowColor: '#3D2618',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
        elevation: 3,
      }}
    >
      {rows.map((row, index) => (
        <Row
          key={row.key}
          icon={row.icon}
          label={row.label}
          value={row.value}
          divider={index < rows.length - 1}
        />
      ))}
    </View>
  );
}
