import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, AppState, Pressable, Text, View } from 'react-native';
import { extractErrorMessage } from '../../api/client';
import { authApi } from '../../api/endpoints';
import { LoginBrandHeader } from '../../components/auth/LoginBrandHeader';
import { Screen } from '../../components/Screen';
import { flushPendingEmailVerification } from '../../services/emailVerificationLinking';
import { useAuthStore } from '../../store/auth';
import { colors } from '../../theme/colors';

export function VerifyEmailScreen() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const refreshVerificationStatus = useAuthStore((s) => s.refreshVerificationStatus);
  const logout = useAuthStore((s) => s.logout);

  const [resending, setResending] = useState(false);
  const [checking, setChecking] = useState(false);
  const [resent, setResent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const email = user?.email ?? '';

  const checkVerification = useCallback(async () => {
    try {
      return await refreshVerificationStatus();
    } catch {
      return false;
    }
  }, [refreshVerificationStatus]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        void checkVerification();
        void flushPendingEmailVerification();
      }
    });
    return () => sub.remove();
  }, [checkVerification]);

  useFocusEffect(
    useCallback(() => {
      void checkVerification();
      void flushPendingEmailVerification();

      const interval = setInterval(() => {
        void checkVerification();
      }, 2500);

      return () => clearInterval(interval);
    }, [checkVerification]),
  );

  const onResend = async () => {
    if (!email) return;
    setResending(true);
    setError(null);
    setResent(false);
    try {
      await authApi.resendVerification(email);
      setResent(true);
    } catch (e) {
      setError(extractErrorMessage(e));
    } finally {
      setResending(false);
    }
  };

  const onContinue = async () => {
    setChecking(true);
    setError(null);
    try {
      const verified = await checkVerification();
      if (!verified) {
        setError(t('auth.verifyEmailNotYet'));
      }
    } catch (e) {
      setError(extractErrorMessage(e));
    } finally {
      setChecking(false);
    }
  };

  return (
    <Screen scroll padded={false}>
      <LoginBrandHeader />

      <View className="flex-1 px-5 pb-8">
        <View className="items-center mt-6 mb-8">
          <View className="w-20 h-20 rounded-full bg-coral-50 items-center justify-center mb-5">
            <Ionicons name="mail-outline" size={36} color={colors.coral[500]} />
          </View>
          <Text className="text-ink-700 text-2xl font-bold text-center mb-3">
            {t('auth.verifyEmailTitle')}
          </Text>
          <Text className="text-ink-400 text-base text-center leading-6">
            {t('auth.verifyEmailBody', { email })}
          </Text>
        </View>

        {resent ? (
          <View className="bg-coral-50 rounded-2xl p-3 mb-4">
            <Text className="text-coral-600 text-center">{t('auth.verifyEmailResent')}</Text>
          </View>
        ) : null}

        {error ? (
          <View className="bg-coral-50 rounded-2xl p-3 mb-4">
            <Text className="text-coral-600 text-center">{error}</Text>
          </View>
        ) : null}

        <Pressable
          onPress={checking ? undefined : onContinue}
          className={`flex-row items-center justify-center bg-coral-500 active:bg-coral-600 rounded-2xl py-4 px-6 mb-3 ${
            checking ? 'opacity-70' : ''
          }`}
        >
          {checking ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text className="text-white font-semibold text-base">
              {t('auth.verifyEmailContinue')}
            </Text>
          )}
        </Pressable>

        <Pressable
          onPress={resending ? undefined : onResend}
          className={`flex-row items-center justify-center border-2 border-coral-500 rounded-2xl py-3.5 px-6 bg-white active:bg-coral-50 mb-6 ${
            resending ? 'opacity-70' : ''
          }`}
        >
          {resending ? (
            <ActivityIndicator color={colors.coral[500]} />
          ) : (
            <Text className="text-coral-500 font-semibold text-base">
              {t('auth.verifyEmailResend')}
            </Text>
          )}
        </Pressable>

        <Text className="text-ink-400 text-xs text-center leading-5 px-2">
          {t('auth.verifyEmailFooter')}
        </Text>

        <Pressable onPress={logout} className="mt-8 self-center">
          <Text className="text-ink-400 text-sm">{t('settings.logout')}</Text>
        </Pressable>
      </View>
    </Screen>
  );
}
