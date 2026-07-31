import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';
import { usersApi } from '../../api/endpoints';
import { RootStackParamList } from '../../navigation/types';
import { colors } from '../../theme/colors';
import { DiscoveryFiltersSheet } from './DiscoveryFiltersSheet';

type Nav = NativeStackNavigationProp<RootStackParamList>;

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

interface Props {
  onFiltersApplied?: () => void;
}

export function DiscoveryHeader({ onFiltersApplied }: Props) {
  const { t } = useTranslation();
  const nav = useNavigation<Nav>();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const { data: me } = useQuery({ queryKey: ['me'], queryFn: () => usersApi.me() });

  return (
    <>
      <View className="flex-row items-center justify-between px-5 pt-2 pb-2">
        <CircleIconButton
          icon="menu-outline"
          accessibilityLabel={t('discovery.openMenu')}
          onPress={() => nav.navigate('Settings')}
        />

        <View className="flex-row items-baseline">
          <Text className="text-ink-700 font-serif text-xl">{t('auth.appNameCitas')} </Text>
          <Text className="text-coral-500 font-serif text-xl">{t('auth.appNameMallorca')}</Text>
        </View>

        <CircleIconButton
          icon="options-outline"
          accessibilityLabel={t('discovery.openFilters')}
          onPress={() => setFiltersOpen(true)}
        />
      </View>

      <DiscoveryFiltersSheet
        visible={filtersOpen}
        profile={me}
        onClose={() => setFiltersOpen(false)}
        onApplied={() => {
          onFiltersApplied?.();
          setFiltersOpen(false);
        }}
      />
    </>
  );
}
