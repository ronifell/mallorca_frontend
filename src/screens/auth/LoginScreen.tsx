import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { authApi } from '../../api/endpoints';
import { extractErrorMessage } from '../../api/client';
import { AuthBackground } from '../../components/auth/AuthBackground';
import { AuthBrandHeader } from '../../components/auth/AuthBrandHeader';
import { OrDivider } from '../../components/auth/OrDivider';
import { SocialAuthButton } from '../../components/auth/SocialAuthButton';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { AuthStackParamList } from '../../navigation/types';
import { useAuthStore } from '../../store/auth';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export function LoginScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const setSession = useAuthStore((s) => s.setSession);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const onSocialPress = () => {
    Alert.alert(t('auth.login'), t('auth.socialComingSoon'));
  };

  return (
    <AuthBackground>
      <SafeAreaView className="flex-1" edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          className="flex-1"
        >
          <ScrollView
            className="flex-1 px-6"
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingVertical: 24, paddingBottom: 32 }}
            showsVerticalScrollIndicator={false}
          >
            <AuthBrandHeader />

            <Text className="text-ink-700 text-2xl font-bold mb-1">{t('auth.welcomeBack')}</Text>
            <Text className="text-ink-400 text-base mb-6">{t('auth.loginSubtitle')}</Text>

            <Input
              label={t('auth.email')}
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
              placeholder={t('auth.emailPlaceholder')}
              leftIcon="mail-outline"
            />
            <Input
              label={t('auth.password')}
              secureTextEntry
              showPasswordToggle
              value={password}
              onChangeText={setPassword}
              placeholder={t('auth.passwordPlaceholder')}
              leftIcon="lock-closed-outline"
            />

            <Pressable
              onPress={() => navigation.navigate('ForgotPassword')}
              className="self-end mb-5 -mt-1"
            >
              <Text className="text-coral-500 font-semibold text-sm">{t('auth.forgotPassword')}</Text>
            </Pressable>

            {error ? (
              <View className="bg-coral-50 rounded-2xl p-3 mb-4">
                <Text className="text-coral-600 text-center">{error}</Text>
              </View>
            ) : null}

            <Button
              label={t('auth.login')}
              fullWidth
              onPress={onSubmit}
              loading={loading}
              className="bg-coral-500 active:bg-coral-600"
            />

            <OrDivider />

            <SocialAuthButton
              provider="google"
              label={t('auth.continueWithGoogle')}
              onPress={onSocialPress}
            />
            <SocialAuthButton
              provider="apple"
              label={t('auth.continueWithApple')}
              onPress={onSocialPress}
            />

            <View className="mt-6 flex-row justify-center">
              <Text className="text-ink-400">{t('auth.noAccount')} </Text>
              <Pressable onPress={() => navigation.replace('Register')}>
                <Text className="text-coral-500 font-semibold">{t('auth.signUp')}</Text>
              </Pressable>
            </View>

            <Text className="text-ink-400 text-xs text-center mt-8 leading-5 px-2">
              {t('auth.legalPrefix')}
              <Text className="text-coral-500">{t('auth.termsOfService')}</Text>
              {t('auth.legalJoiner')}
              <Text className="text-coral-500">{t('auth.privacyPolicy')}</Text>
              {t('auth.legalSuffix')}
            </Text>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </AuthBackground>
  );
}
