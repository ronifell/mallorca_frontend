import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';
import { authApi } from '../../api/endpoints';
import { extractErrorMessage } from '../../api/client';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Logo } from '../../components/Logo';
import { Screen } from '../../components/Screen';
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

  return (
    <Screen scroll>
      <View className="items-center mt-2 mb-6">
        <Logo size="md" />
        <Text className="text-ink-700 font-serif text-2xl mt-3">{t('auth.login')}</Text>
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
      />

      <Pressable onPress={() => navigation.navigate('ForgotPassword')} className="self-end mb-4">
        <Text className="text-brand-500 font-semibold">{t('auth.forgotPassword')}</Text>
      </Pressable>

      {error ? (
        <View className="bg-brand-50 rounded-2xl p-3 mb-4">
          <Text className="text-brand-600 text-center">{error}</Text>
        </View>
      ) : null}

      <Button label={t('auth.login')} fullWidth onPress={onSubmit} loading={loading} />

      <View className="mt-8 flex-row justify-center">
        <Text className="text-ink-400">{t('auth.noAccount')} </Text>
        <Pressable onPress={() => navigation.replace('Register')}>
          <Text className="text-brand-500 font-semibold">{t('auth.signUp')}</Text>
        </Pressable>
      </View>
    </Screen>
  );
}
