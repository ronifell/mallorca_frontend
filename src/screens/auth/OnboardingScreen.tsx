import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthBackground, onboardingBackground } from '../../components/auth/AuthBackground';
import { Button } from '../../components/Button';
import { Logo } from '../../components/Logo';
import { AuthStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'Onboarding'>;

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <View className="flex-row items-center mb-3">
      <Text className="text-brand-500 text-lg mr-3">✓</Text>
      <Text className="text-ink-700 text-base flex-1">{children}</Text>
    </View>
  );
}

export function OnboardingScreen({ navigation }: Props) {
  const { t } = useTranslation();
  return (
    <AuthBackground source={onboardingBackground}>
      <SafeAreaView className="flex-1 px-6" edges={['top', 'bottom']} style={{ flex: 1, backgroundColor: 'transparent' }}>
        <View className="flex-1 items-center justify-center">
          <Logo size="lg" />
          <Text className="text-ink-700 font-serif text-3xl mt-6 text-center">
            {t('auth.tagline')}
          </Text>
          <Text className="text-ink-400 text-base mt-3 text-center max-w-xs">
            {t('auth.subtitle')}
          </Text>

          <View className="mt-10 w-full max-w-sm">
            <Bullet>{t('onboarding.feature1')}</Bullet>
            <Bullet>{t('onboarding.feature2')}</Bullet>
            <Bullet>{t('onboarding.feature3')}</Bullet>
          </View>
        </View>

        <View className="pb-2">
          <Button
            label={t('auth.register')}
            onPress={() => navigation.navigate('Register')}
            fullWidth
          />
          <View className="h-3" />
          <Button
            label={t('auth.login')}
            variant="ghost"
            onPress={() => navigation.navigate('Login')}
            fullWidth
          />
        </View>
      </SafeAreaView>
    </AuthBackground>
  );
}
