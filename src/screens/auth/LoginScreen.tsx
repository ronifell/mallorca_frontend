import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { authApi } from '../../api/endpoints';
import { extractErrorMessage } from '../../api/client';
import { LoginBrandHeader } from '../../components/auth/LoginBrandHeader';
import { OrDivider } from '../../components/auth/OrDivider';
import { SocialAuthButton } from '../../components/auth/SocialAuthButton';
import { Input } from '../../components/Input';
import { useGoogleSignIn } from '../../hooks/useGoogleSignIn';
import { AuthStackParamList } from '../../navigation/types';
import { useAuthStore } from '../../store/auth';
import { colors } from '../../theme/colors';
import { authHeroImage, authScreenStyles as styles } from './authScreenStyles';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export function LoginScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const setSession = useAuthStore((s) => s.setSession);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { onGooglePress, googleLoading, showGoogleButton } = useGoogleSignIn({ onError: setError });

  const onSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await authApi.login({ email: email.trim(), password });
      await setSession({
        user: result.user,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      });
    } catch (e) {
      setError(extractErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <ImageBackground
        source={authHeroImage}
        resizeMode="cover"
        style={StyleSheet.absoluteFillObject}
        imageStyle={styles.backgroundImage}
      />

      <View pointerEvents="none" style={styles.heroFade}>
        <View style={[styles.fadeLayer, { height: 120, opacity: 0.12 }]} />
        <View style={[styles.fadeLayer, { height: 80, opacity: 0.35 }]} />
        <View style={[styles.fadeLayer, { height: 48, opacity: 0.7 }]} />
      </View>

      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <LoginBrandHeader />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardView}
        >
          <ScrollView
            style={styles.body}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.topSpacer} />

            <View style={styles.welcomeBlock}>
              <Text className="text-ink-700 text-[26px] font-bold mb-1">{t('auth.welcomeBack')}</Text>
              <Text className="text-ink-700 text-base font-medium opacity-90 leading-5">
                {t('auth.loginSubtitle')}
              </Text>
            </View>

            <View style={styles.formCard}>
              <View style={styles.formContent}>
                <Input
                  label={t('auth.email')}
                  autoCapitalize="none"
                  autoComplete="email"
                  keyboardType="email-address"
                  value={email}
                  onChangeText={setEmail}
                  placeholder={t('auth.emailPlaceholder')}
                  leftIcon="mail-outline"
                  elevated
                  accentIcon
                />
                <Input
                  label={t('auth.password')}
                  secureTextEntry
                  showPasswordToggle
                  value={password}
                  onChangeText={setPassword}
                  placeholder={t('auth.passwordPlaceholder')}
                  leftIcon="lock-closed-outline"
                  elevated
                  accentIcon
                />

                <Pressable
                  onPress={() => navigation.navigate('ForgotPassword')}
                  className="self-end mb-4 -mt-1"
                >
                  <Text className="text-coral-500 font-semibold text-sm">{t('auth.forgotPassword')}</Text>
                </Pressable>

                {error ? (
                  <View className="bg-coral-50 rounded-2xl p-3 mb-3">
                    <Text className="text-coral-600 text-center">{error}</Text>
                  </View>
                ) : null}

                <Pressable
                  onPress={loading ? undefined : onSubmit}
                  accessibilityRole="button"
                  accessibilityLabel={t('auth.login')}
                  className={`flex-row items-center justify-center bg-coral-500 active:bg-coral-600 rounded-2xl py-4 px-6 ${
                    loading ? 'opacity-70' : ''
                  }`}
                  style={styles.primaryButton}
                >
                  {loading ? (
                    <ActivityIndicator color={colors.white} />
                  ) : (
                    <>
                      <Text className="text-white font-semibold text-base">{t('auth.login')}</Text>
                      <Ionicons
                        name="arrow-forward"
                        size={20}
                        color={colors.white}
                        style={styles.primaryButtonArrow}
                      />
                    </>
                  )}
                </Pressable>

                {showGoogleButton ? (
                  <>
                    <OrDivider />
                    <SocialAuthButton
                      provider="google"
                      label={t('auth.continueWithGoogle')}
                      onPress={() => {
                        setError(null);
                        onGooglePress();
                      }}
                      loading={googleLoading}
                    />
                    <Text className="text-ink-400 text-xs text-center leading-5 px-1 -mt-1 mb-2">
                      {t('auth.googleExplanation')}
                    </Text>
                  </>
                ) : null}

                <View className="mt-4 flex-row justify-center">
                  <Text className="text-ink-400">{t('auth.noAccount')} </Text>
                  <Pressable onPress={() => navigation.replace('Register')}>
                    <Text className="text-coral-500 font-semibold">{t('auth.signUp')}</Text>
                  </Pressable>
                </View>

                <Text className="text-ink-400 text-xs text-center mt-5 leading-5 px-2">
                  {t('auth.legalPrefix')}
                  <Text className="text-coral-500">{t('auth.termsOfService')}</Text>
                  {t('auth.legalJoiner')}
                  <Text className="text-coral-500">{t('auth.privacyPolicy')}</Text>
                  {t('auth.legalSuffix')}
                </Text>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
