import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, Text, View } from 'react-native';
import { Avatar } from '../Avatar';
import { colors } from '../../theme/colors';

interface Props {
  otherName: string | null;
  otherUserAge?: number | null;
  otherUserPhoto?: string | null;
  onBack: () => void;
}

export function ConversationHeader({
  otherName,
  otherUserAge,
  otherUserPhoto,
  onBack,
}: Props) {
  const { t } = useTranslation();
  const name = otherName ?? '—';
  const displayName = otherUserAge != null ? `${name}, ${otherUserAge}` : name;

  const openMenu = () => {
    Alert.alert(otherName ?? t('chat.title'), undefined, [
      { text: t('common.cancel'), style: 'cancel' },
    ]);
  };

  return (
    <View className="flex-row items-center px-4 pt-2 pb-3 border-b border-cream-300 bg-cream-200">
      <Pressable
        onPress={onBack}
        className="w-10 h-10 rounded-full bg-white items-center justify-center border border-cream-300 mr-2"
        style={{
          shadowColor: '#3D2618',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.08,
          shadowRadius: 4,
          elevation: 2,
        }}
        accessibilityRole="button"
        accessibilityLabel={t('common.back')}
      >
        <Ionicons name="chevron-back" size={22} color={colors.ink[700]} />
      </Pressable>

      <Avatar uri={otherUserPhoto} name={otherName} size={44} />

      <View className="flex-1 ml-3">
        <Text className="text-ink-700 font-bold text-base">{displayName}</Text>
        <View className="flex-row items-center mt-0.5">
          <View className="w-2 h-2 rounded-full bg-success mr-1.5" />
          <Text className="text-ink-400 text-xs">{t('chat.online')}</Text>
        </View>
      </View>

      <Pressable
        onPress={() => Alert.alert(t('chat.safety'), t('chat.safetyComingSoon'))}
        className="w-9 h-9 items-center justify-center mr-1"
        accessibilityRole="button"
        accessibilityLabel={t('chat.safety')}
      >
        <Ionicons name="shield-checkmark-outline" size={22} color={colors.ink[700]} />
      </Pressable>

      <Pressable
        onPress={openMenu}
        className="w-9 h-9 items-center justify-center"
        accessibilityRole="button"
        accessibilityLabel={t('chat.openMenu')}
      >
        <Ionicons name="ellipsis-vertical" size={20} color={colors.ink[700]} />
      </Pressable>
    </View>
  );
}
