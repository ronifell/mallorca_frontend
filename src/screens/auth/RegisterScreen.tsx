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
import { extractErrorMessage } from '../../api/client';
import { authApi } from '../../api/endpoints';
import { LegalCheckbox } from '../../components/auth/LegalCheckbox';
import { LoginBrandHeader } from '../../components/auth/LoginBrandHeader';
import { OrDivider } from '../../components/auth/OrDivider';
import { SocialAuthButton } from '../../components/auth/SocialAuthButton';
import { Input } from '../../components/Input';
import { useGoogleSignIn } from '../../hooks/useGoogleSignIn';
import { AuthStackParamList } from '../../navigation/types';
import { useAuthStore } from '../../store/auth';
import { colors } from '../../theme/colors';
import { LEGAL_LINKS } from '../../config/legal';
import { authHeroImage, authScreenStyles as styles } from './authScreenStyles';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

export function RegisterScreen({ navigation }: Props) {
  const { t, i18n } = useTranslation();
  const setSession = useAuthStore((s) => s.setSession);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { onGooglePress, googleLoading, showGoogleButton } = useGoogleSignIn({
    requireConsent: true,
    acceptedTerms,
    acceptedPrivacy,
    onError: setError,
  });

  const onSubmit = async () => {
    if (!acceptedTerms) {
      setError(t('auth.termsRequired'));
      return;
    }
    if (!acceptedPrivacy) {
      setError(t('auth.privacyRequired'));
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await authApi.register({
        email: email.trim(),
        password,
        acceptedTerms: true,
        acceptedPrivacy: true,
        language: (i18n.language as 'en' | 'es') ?? 'es',
      });
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
              <Text className="text-ink-700 text-[26px] font-bold mb-1">{t('auth.register')}</Text>
              <Text className="text-ink-700 text-base font-medium opacity-90 leading-5">
                {t('auth.registerSubtitle')}
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
                  hint={t('auth.passwordHint')}
                />

                <View className="mt-1 mb-2">
                  <LegalCheckbox
                    checked={acceptedTerms}
                    onToggle={() => setAcceptedTerms((v) => !v)}
                    intro={t('auth.termsAcceptIntro')}
                    linkLabel={t('auth.termsOfService')}
                    linkUrl={LEGAL_LINKS.terms}
                    testID="register-terms-checkbox"
                  />
                  <LegalCheckbox
                    checked={acceptedPrivacy}
                    onToggle={() => setAcceptedPrivacy((v) => !v)}
                    intro={t('auth.privacyAcceptIntro')}
                    linkLabel={t('auth.privacyPolicy')}
                    linkUrl={LEGAL_LINKS.privacy}
                    testID="register-privacy-checkbox"
                  />
                </View>

                {error ? (
                  <View className="bg-coral-50 rounded-2xl p-3 mb-3">
                    <Text className="text-coral-600 text-center">{error}</Text>
                  </View>
                ) : null}

                <Pressable
                  onPress={loading ? undefined : onSubmit}
                  accessibilityRole="button"
                  accessibilityLabel={t('auth.register')}
                  className={`flex-row items-center justify-center bg-coral-500 active:bg-coral-600 rounded-2xl py-4 px-6 ${
                    loading ? 'opacity-70' : ''
                  }`}
                  style={styles.primaryButton}
                >
                  {loading ? (
                    <ActivityIndicator color={colors.white} />
                  ) : (
                    <>
                      <Text className="text-white font-semibold text-base">{t('auth.register')}</Text>
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
                  </>
                ) : null}

                <View className="mt-6 flex-row justify-center">
                  <Text className="text-ink-400">{t('auth.haveAccount')} </Text>
                  <Pressable onPress={() => navigation.replace('Login')}>
                    <Text className="text-coral-500 font-semibold">{t('auth.signIn')}</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
