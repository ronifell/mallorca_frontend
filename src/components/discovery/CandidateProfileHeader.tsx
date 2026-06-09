import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';
import { RootStackParamList } from '../../navigation/types';
import { colors } from '../../theme/colors';

type Nav = NativeStackNavigationProp<RootStackParamList>;

interface Props {
  /** Override the back button behaviour. Defaults to `navigation.goBack()`. */
  onBack?: () => void;
}

/**
 * Header for the full candidate profile screen. Shows a circular back button
 * on the left and the centered "Citas Mallorca" wordmark. The right side is
 * intentionally left empty so the global LanguageSwitcher can float there
 * without overlapping any controls.
 */
export function CandidateProfileHeader({ onBack }: Props = {}) {
  const { t } = useTranslation();
  const nav = useNavigation<Nav>();

  const handleBack = onBack ?? (() => nav.goBack());

  return (
    <View className="flex-row items-center justify-between px-5 pt-1 pb-4">
      <Pressable
        onPress={handleBack}
        accessibilityRole="button"
        accessibilityLabel={t('common.back')}
        className="w-9 h-9 rounded-full bg-white items-center justify-center"
        style={{
          shadowColor: '#3D2618',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08,
          shadowRadius: 6,
          elevation: 2,
        }}
      >
        <Ionicons name="chevron-back" size={20} color={colors.ink[700]} />
      </Pressable>

      <View className="flex-row items-baseline">
        <Text className="text-ink-700 font-serif text-[22px]">
          {t('auth.appNameCitas')}{' '}
        </Text>
        <Text className="text-coral-500 font-serif text-[22px]">
          {t('auth.appNameMallorca')}
        </Text>
      </View>

      <View className="w-9 h-9" />
    </View>
  );
}
