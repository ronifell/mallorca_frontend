import { Ionicons } from '@expo/vector-icons';
import { CompositeNavigationProp, useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';
import { MainTabParamList, RootStackParamList } from '../../navigation/types';
import { colors } from '../../theme/colors';

type Nav = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Profile'>,
  NativeStackNavigationProp<RootStackParamList>
>;

function CircleIconButton({
  icon,
  onPress,
  accessibilityLabel,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  accessibilityLabel: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      className="w-10 h-10 rounded-full bg-white items-center justify-center border border-cream-300"
      style={{
        shadowColor: '#3D2618',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 2,
      }}
    >
      <Ionicons name={icon} size={20} color={colors.ink[700]} />
    </Pressable>
  );
}

export function ProfilePageHeader() {
  const { t } = useTranslation();
  const nav = useNavigation<Nav>();

  return (
    <View className="flex-row items-center justify-between px-5 pt-2 pb-3">
      <CircleIconButton
        icon="chevron-back"
        accessibilityLabel={t('common.back')}
        onPress={() => nav.navigate('Discover')}
      />

      <View className="flex-row items-baseline">
        <Text className="text-ink-700 font-serif text-xl">{t('auth.appNameCitas')} </Text>
        <Text className="text-coral-500 font-serif text-xl">{t('auth.appNameMallorca')}</Text>
      </View>

      <CircleIconButton
        icon="settings-outline"
        accessibilityLabel={t('settings.title')}
        onPress={() => nav.navigate('Settings')}
      />
    </View>
  );
}
