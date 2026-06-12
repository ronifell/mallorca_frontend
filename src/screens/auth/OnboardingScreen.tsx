import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthBackground, onboardingBackground } from '../../components/auth/AuthBackground';
import { OnboardingFeature } from '../../components/auth/OnboardingFeature';
import { Button } from '../../components/Button';
import { Logo } from '../../components/Logo';
import { AuthStackParamList } from '../../navigation/types';
import { useTopScreenPadding } from '../../hooks/useTopScreenPadding';
import { colors } from '../../theme/colors';

type Props = NativeStackScreenProps<AuthStackParamList, 'Onboarding'>;

/** Italic display font for the onboarding headline. */
const DISPLAY_FONT = 'PlayfairDisplay_400Regular_Italic';

export function OnboardingScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const topPadding = useTopScreenPadding();

  return (
    <AuthBackground source={onboardingBackground}>
      <SafeAreaView
        className="flex-1"
        edges={['bottom']}
        style={{ flex: 1, backgroundColor: 'transparent' }}
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 28, paddingTop: topPadding }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View className="items-center pt-6 pb-4">
            <Logo size={100} />

            <Text
              className="text-ink-700 text-[28px] leading-9 text-center mt-8 px-2"
              style={{ fontFamily: DISPLAY_FONT }}
            >
              {t('onboarding.headlineBefore')}{' '}
              <Text className="text-coral-500" style={{ fontFamily: DISPLAY_FONT }}>
                {t('onboarding.headlineAccent')}
              </Text>
              <Text style={{ fontFamily: DISPLAY_FONT }}>.</Text>
            </Text>

            <View
              className="mt-4 mb-3 rounded-full"
              style={{ width: 48, height: 3, backgroundColor: colors.coral[500] }}
            />

            <Text className="text-ink-400 text-[15px] leading-[22px] text-center px-4 max-w-[320px]">
              {t('onboarding.subtitle')}
            </Text>
          </View>

          <View className="gap-5 mt-2 mb-6">
            <OnboardingFeature
              icon="shield-checkmark-outline"
              title={t('onboarding.feature1Title')}
              description={t('onboarding.feature1Desc')}
            />
            <OnboardingFeature
              icon="chatbubble-outline"
              title={t('onboarding.feature2Title')}
              description={t('onboarding.feature2Desc')}
            />
            <OnboardingFeature
              icon="lock-closed-outline"
              title={t('onboarding.feature3Title')}
              description={t('onboarding.feature3Desc')}
            />
          </View>
        </ScrollView>

        <View className="px-7 pb-4 pt-2">
          <View
            style={{
              shadowColor: colors.coral[600],
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.28,
              shadowRadius: 10,
              elevation: 5,
            }}
          >
            <Button
              label={t('auth.register')}
              onPress={() => navigation.navigate('Register')}
              fullWidth
              className="bg-coral-500 active:bg-coral-600"
            />
          </View>

          <Pressable
            onPress={() => navigation.navigate('Login')}
            accessibilityRole="button"
            accessibilityLabel={t('auth.login')}
            className="items-center py-4 mt-1"
          >
            <Text className="text-coral-500 font-semibold text-base">
              {t('onboarding.loginLink')}
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </AuthBackground>
  );
}
