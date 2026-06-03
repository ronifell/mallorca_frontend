import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { extractErrorMessage } from '../../api/client';
import { authApi } from '../../api/endpoints';
import { AuthBackground } from '../../components/auth/AuthBackground';
import { AuthBrandHeader } from '../../components/auth/AuthBrandHeader';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { AuthStackParamList } from '../../navigation/types';
import { useAuthStore } from '../../store/auth';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

export function RegisterScreen({ navigation }: Props) {
  const { t, i18n } = useTranslation();
  const setSession = useAuthStore((s) => s.setSession);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async () => {
    if (!accepted) {
      setError(t('auth.termsRequired'));
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await authApi.register({
        email: email.trim(),
        password,
        acceptedTerms: true,
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
    <AuthBackground>
      <SafeAreaView className="flex-1" edges={['top', 'bottom']} style={{ flex: 1, backgroundColor: 'transparent' }}>
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

            <Text className="text-ink-700 text-2xl font-bold mb-1">{t('auth.register')}</Text>
            <Text className="text-ink-400 text-base mb-6">{t('auth.subtitle')}</Text>

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
              hint={t('auth.passwordHint')}
            />

            <Pressable
              onPress={() => setAccepted((v) => !v)}
              className="flex-row items-center mb-4 mt-1"
            >
              <View
                className={`w-6 h-6 rounded-md mr-3 items-center justify-center border-2 ${
                  accepted ? 'bg-coral-500 border-coral-500' : 'bg-cream-50 border-cream-400'
                }`}
              >
                {accepted ? <Text className="text-white">✓</Text> : null}
              </View>
              <Text className="text-ink-700 flex-1">{t('auth.termsAccept')}</Text>
            </Pressable>

            {error ? (
              <View className="bg-coral-50 rounded-2xl p-3 mb-4">
                <Text className="text-coral-600 text-center">{error}</Text>
              </View>
            ) : null}

            <Button
              label={t('auth.register')}
              fullWidth
              onPress={onSubmit}
              loading={loading}
              className="bg-coral-500 active:bg-coral-600"
            />

            <View className="mt-8 flex-row justify-center">
              <Text className="text-ink-400">{t('auth.haveAccount')} </Text>
              <Pressable onPress={() => navigation.replace('Login')}>
                <Text className="text-coral-500 font-semibold">{t('auth.signIn')}</Text>
              </Pressable>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </AuthBackground>
  );
}
