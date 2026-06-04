import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React, { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthBackground, onboardingBackground } from '../auth/AuthBackground';
import { colors } from '../../theme/colors';

interface Props {
  children: ReactNode;
}

export function SettingsShell({ children }: Props) {
  const { t } = useTranslation();
  const nav = useNavigation();

  return (
    <AuthBackground source={onboardingBackground}>
      <SafeAreaView className="flex-1" edges={['top', 'bottom']} style={{ flex: 1, backgroundColor: 'transparent' }}>
        <View className="flex-row items-center justify-between px-5 pt-2 pb-1">
          <Pressable
            onPress={() => nav.goBack()}
            className="w-10 h-10 rounded-full bg-white items-center justify-center border border-cream-300"
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

          <View className="flex-row items-baseline">
            <Text className="text-ink-700 font-serif text-xl">{t('auth.appNameCitas')} </Text>
            <Text className="text-coral-500 font-serif text-xl">{t('auth.appNameMallorca')}</Text>
          </View>

          <View className="w-10" />
        </View>

        <ScrollView
          className="flex-1 px-5"
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      </SafeAreaView>
    </AuthBackground>
  );
}
