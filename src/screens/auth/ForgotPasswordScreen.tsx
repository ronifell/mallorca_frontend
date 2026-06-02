import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import { extractErrorMessage } from '../../api/client';
import { authApi } from '../../api/endpoints';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Screen } from '../../components/Screen';

export function ForgotPasswordScreen() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setLoading(true);
    setError(null);
    try {
      await authApi.forgotPassword(email.trim());
      setSent(true);
    } catch (e) {
      setError(extractErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen scroll>
      <Text className="text-ink-700 font-serif text-2xl mt-4 mb-2">
        {t('auth.forgotPassword')}
      </Text>
      <Text className="text-ink-400 mb-6">{t('auth.subtitle')}</Text>

      <Input
        label={t('auth.email')}
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />

      {sent ? (
        <View className="bg-success/10 rounded-2xl p-3 mb-4">
          <Text className="text-success text-center">{t('auth.resetSent')}</Text>
        </View>
      ) : null}
      {error ? (
        <View className="bg-brand-50 rounded-2xl p-3 mb-4">
          <Text className="text-brand-600 text-center">{error}</Text>
        </View>
      ) : null}

      <Button
        label={t('auth.sendResetLink')}
        onPress={submit}
        fullWidth
        loading={loading}
        disabled={sent}
      />
    </Screen>
  );
}
