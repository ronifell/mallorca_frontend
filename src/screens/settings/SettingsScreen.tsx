import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Text, View } from 'react-native';
import { usersApi } from '../../api/endpoints';
import { SettingsCard } from '../../components/settings/SettingsCard';
import { SettingsRow } from '../../components/settings/SettingsRow';
import { SettingsShell } from '../../components/settings/SettingsShell';
import { RootStackParamList } from '../../navigation/types';
import { useAuthStore } from '../../store/auth';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function SettingsScreen() {
  const { t, i18n } = useTranslation();
  const nav = useNavigation<Nav>();
  const logout = useAuthStore((s) => s.logout);

  const languageLabel = i18n.language === 'es' ? 'Español' : 'English';

  const onDelete = () => {
    Alert.alert(t('settings.deleteAccount'), t('settings.deleteAccountConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: async () => {
          try {
            await usersApi.deleteAccount();
          } finally {
            await logout();
          }
        },
      },
    ]);
  };

  const onLogout = () => {
    Alert.alert(t('settings.logout'), t('settings.logoutConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('settings.logout'), style: 'destructive', onPress: () => logout() },
    ]);
  };

  return (
    <SettingsShell>
      <View className="mt-2 mb-6">
        <Text className="text-ink-700 text-3xl font-bold">{t('settings.title')}</Text>
        <Text className="text-ink-400 text-sm mt-1.5">{t('settings.subtitle')}</Text>
      </View>

      <SettingsCard>
        <SettingsRow
          icon="globe-outline"
          title={t('settings.language')}
          description={t('settings.languageDesc')}
          detail={languageLabel}
          onPress={() => nav.navigate('Language')}
        />
        <SettingsRow
          icon="notifications-outline"
          title={t('settings.notifications')}
          description={t('settings.notificationsDesc')}
          onPress={() => nav.navigate('Notifications')}
        />
        <SettingsRow
          icon="ribbon-outline"
          title={t('settings.subscription')}
          description={t('settings.subscriptionDesc')}
          onPress={() => nav.navigate('Premium')}
        />
        <SettingsRow
          icon="shield-checkmark-outline"
          title={t('settings.privacy')}
          description={t('settings.privacyDesc')}
          onPress={() => nav.navigate('Privacy')}
          isLast
        />
      </SettingsCard>

      <SettingsCard>
        <SettingsRow
          icon="log-out-outline"
          title={t('settings.logout')}
          description={t('settings.logoutDesc')}
          onPress={onLogout}
          accentTitle
        />
        <SettingsRow
          icon="trash-outline"
          title={t('settings.deleteAccount')}
          description={t('settings.deleteAccountDesc')}
          onPress={onDelete}
          accentTitle
          isLast
        />
      </SettingsCard>
    </SettingsShell>
  );
}
