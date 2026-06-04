import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, Pressable, Text, View } from 'react-native';
import { colors } from '../../theme/colors';

interface Props {
  onSubscribe: () => void;
  loading?: boolean;
  disabled?: boolean;
}

export function PremiumSubscribeSection({ onSubscribe, loading, disabled }: Props) {
  const { t } = useTranslation();

  const onRestore = () => {
    Alert.alert(t('premium.restore'), t('premium.restoreComingSoon'));
  };

  return (
    <View className="mt-2">
      <Pressable
        onPress={loading || disabled ? undefined : onSubscribe}
        className={`flex-row items-center justify-center bg-coral-500 active:bg-coral-600 rounded-2xl py-4 px-6 w-full ${
          disabled ? 'opacity-50' : ''
        }`}
      >
        {loading ? (
          <ActivityIndicator color={colors.white} />
        ) : (
          <>
            <MaterialCommunityIcons name="crown" size={20} color={colors.white} style={{ marginRight: 8 }} />
            <Text className="text-white font-bold text-base">{t('premium.subscribe')}</Text>
          </>
        )}
      </Pressable>

      <View className="flex-row items-center justify-center mt-4">
        <Ionicons name="lock-closed-outline" size={14} color={colors.ink[400]} />
        <Text className="text-ink-400 text-xs ml-1.5">{t('premium.securePayment')}</Text>
      </View>

      <Pressable onPress={onRestore} className="flex-row items-center justify-center mt-4 py-2">
        <Text className="text-coral-500 font-semibold text-sm">{t('premium.restore')}</Text>
        <Ionicons name="chevron-forward" size={16} color={colors.coral[500]} />
      </Pressable>
    </View>
  );
}
