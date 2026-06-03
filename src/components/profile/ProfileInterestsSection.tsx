import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import { ProfileInterestItem } from '../../utils/profileDisplay';
import { colors } from '../../theme/colors';

interface Props {
  interests: ProfileInterestItem[];
}

export function ProfileInterestsSection({ interests }: Props) {
  const { t } = useTranslation();

  if (!interests.length) return null;

  return (
    <View className="mb-6">
      <Text className="text-ink-700 text-lg font-bold mb-3">{t('profile.interests')}</Text>
      <View className="flex-row flex-wrap">
        {interests.map((interest) => (
          <View
            key={interest.label}
            className="flex-row items-center px-3.5 py-2 rounded-pill border border-cream-300 bg-white mr-2 mb-2"
          >
            <Ionicons name={interest.icon} size={14} color={colors.coral[500]} />
            <Text className="text-ink-700 text-sm font-semibold ml-1.5">{interest.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}
