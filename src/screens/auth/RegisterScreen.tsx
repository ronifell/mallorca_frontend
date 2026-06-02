import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';
import { extractErrorMessage } from '../../api/client';
import { authApi } from '../../api/endpoints';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Logo } from '../../components/Logo';
import { Screen } from '../../components/Screen';
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
    <Screen scroll>
      <View className="items-center mt-2 mb-6">
        <Logo size="md" />
        <Text className="text-ink-700 font-serif text-2xl mt-3">{t('auth.register')}</Text>
      </View>

      <Input
        label={t('auth.email')}
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
        placeholder="tu@email.com"
      />
      <Input
        label={t('auth.password')}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        hint={t('auth.passwordHint')}
      />

      <Pressable
        onPress={() => setAccepted((v) => !v)}
        className="flex-row items-center mb-4 mt-1"
      >
        <View
          className={`w-6 h-6 rounded-md mr-3 items-center justify-center border-2 ${
            accepted ? 'bg-brand-500 border-brand-500' : 'bg-white border-cream-400'
          }`}
        >
          {accepted ? <Text className="text-white">✓</Text> : null}
        </View>
        <Text className="text-ink-700 flex-1">{t('auth.termsAccept')}</Text>
      </Pressable>

      {error ? (
        <View className="bg-brand-50 rounded-2xl p-3 mb-4">
          <Text className="text-brand-600 text-center">{error}</Text>
        </View>
      ) : null}

      <Button label={t('auth.register')} fullWidth onPress={onSubmit} loading={loading} />

      <View className="mt-8 flex-row justify-center">
        <Text className="text-ink-400">{t('auth.haveAccount')} </Text>
        <Pressable onPress={() => navigation.replace('Login')}>
          <Text className="text-brand-500 font-semibold">{t('auth.signIn')}</Text>
        </Pressable>
      </View>
    </Screen>
  );
}
