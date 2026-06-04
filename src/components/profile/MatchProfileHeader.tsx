import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, Text, View } from 'react-native';
import { RootStackParamList } from '../../navigation/types';
import { colors } from '../../theme/colors';

type Nav = NativeStackNavigationProp<RootStackParamList>;

interface Props {
  onUnmatch?: () => void;
  onReport?: () => void;
  onBlock?: () => void;
}

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

export function MatchProfileHeader({ onUnmatch, onReport, onBlock }: Props) {
  const { t } = useTranslation();
  const nav = useNavigation<Nav>();

  const openMenu = () => {
    Alert.alert(t('profile.openMenu'), undefined, [
      ...(onReport ? [{ text: t('profile.report'), onPress: onReport }] : []),
      ...(onBlock ? [{ text: t('profile.block'), onPress: onBlock }] : []),
      ...(onUnmatch ? [{ text: t('matches.unmatch'), style: 'destructive' as const, onPress: onUnmatch }] : []),
      { text: t('common.cancel'), style: 'cancel' as const },
    ]);
  };

  return (
    <View className="flex-row items-center justify-between px-5 pt-2 pb-3">
      <CircleIconButton
        icon="chevron-back"
        accessibilityLabel={t('common.back')}
        onPress={() => nav.goBack()}
      />

      <View className="flex-row items-baseline">
        <Text className="text-ink-700 font-serif text-xl">{t('auth.appNameCitas')} </Text>
        <Text className="text-coral-500 font-serif text-xl">{t('auth.appNameMallorca')}</Text>
      </View>

      <CircleIconButton
        icon="ellipsis-horizontal"
        accessibilityLabel={t('profile.openMenu')}
        onPress={openMenu}
      />
    </View>
  );
}
