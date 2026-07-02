import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';
import { extractErrorMessage } from '../../api/client';
import { authApi } from '../../api/endpoints';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Screen } from '../../components/Screen';
import { AuthStackParamList } from '../../navigation/types';

type Step = 'email' | 'reset' | 'done';

export function ForgotPasswordScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendCode = async () => {
    setLoading(true);
    setError(null);
    try {
      await authApi.forgotPassword(email.trim());
      setStep('reset');
    } catch (e) {
      setError(extractErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async () => {
    if (password !== confirmPassword) {
      setError(t('auth.resetPasswordMismatch'));
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await authApi.resetPassword(email.trim(), code.trim(), password);
      setStep('done');
    } catch (e) {
      setError(extractErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  const onCodeChange = (value: string) => {
    setCode(value.replace(/\D/g, '').slice(0, 6));
  };

  if (step === 'done') {
    return (
      <Screen scroll>
        <Text className="text-ink-700 font-serif text-2xl mt-4 mb-2">
          {t('auth.forgotPassword')}
        </Text>
        <View className="bg-success/10 rounded-2xl p-4 mb-6">
          <Text className="text-success text-center">{t('auth.resetPasswordSuccess')}</Text>
        </View>
        <Button
          label={t('auth.backToLogin')}
          onPress={() => navigation.navigate('Login')}
          fullWidth
        />
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <Text className="text-ink-700 font-serif text-2xl mt-4 mb-2">
        {t('auth.forgotPassword')}
      </Text>
      <Text className="text-ink-400 mb-6">
        {step === 'email' ? t('auth.subtitle') : t('auth.resetSent')}
      </Text>

      <Input
        label={t('auth.email')}
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
        editable={step === 'email'}
      />

      {step === 'reset' ? (
        <>
          <Input
            label={t('auth.resetCodeLabel')}
            placeholder={t('auth.resetCodePlaceholder')}
            keyboardType="number-pad"
            autoComplete="one-time-code"
            textContentType="oneTimeCode"
            maxLength={6}
            value={code}
            onChangeText={onCodeChange}
          />
          <Input
            label={t('auth.password')}
            placeholder={t('auth.passwordPlaceholder')}
            secureTextEntry
            showPasswordToggle
            value={password}
            onChangeText={setPassword}
            hint={t('auth.passwordHint')}
          />
          <Input
            label={t('auth.confirmPassword')}
            placeholder={t('auth.passwordPlaceholder')}
            secureTextEntry
            showPasswordToggle
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />
        </>
      ) : null}

      {error ? (
        <View className="bg-brand-50 rounded-2xl p-3 mb-4">
          <Text className="text-brand-600 text-center">{error}</Text>
        </View>
      ) : null}

      {step === 'email' ? (
        <Button
          label={t('auth.sendResetCode')}
          onPress={sendCode}
          fullWidth
          loading={loading}
          disabled={!email.trim()}
        />
      ) : (
        <>
          <Button
            label={t('auth.resetPasswordButton')}
            onPress={resetPassword}
            fullWidth
            loading={loading}
            disabled={code.length !== 6 || !password || !confirmPassword}
          />
          <Pressable
            onPress={sendCode}
            disabled={loading}
            className="mt-4 py-2"
          >
            <Text className="text-brand-600 text-center font-semibold">
              {t('auth.resendCode')}
            </Text>
          </Pressable>
        </>
      )}
    </Screen>
  );
}
