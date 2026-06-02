import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Alert } from 'react-native';
import { usersApi } from '../../api/endpoints';
import { Row, SectionCard } from '../../components/Row';
import { Screen } from '../../components/Screen';
import { RootStackParamList } from '../../navigation/types';
import { useAuthStore } from '../../store/auth';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function SettingsScreen() {
  const { t, i18n } = useTranslation();
  const nav = useNavigation<Nav>();
  const logout = useAuthStore((s) => s.logout);

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

  return (
    <Screen scroll>
      <SectionCard>
        <Row
          label={t('settings.language')}
          detail={i18n.language === 'es' ? 'Español' : 'English'}
          onPress={() => nav.navigate('Language')}
        />
        <Row label={t('settings.notifications')} onPress={() => nav.navigate('Notifications')} />
        <Row label={t('settings.subscription')} onPress={() => nav.navigate('Premium')} />
        <Row label={t('settings.privacy')} onPress={() => nav.navigate('Privacy')} />
      </SectionCard>

      <SectionCard>
        <Row label={t('settings.logout')} onPress={() => logout()} chevron={false} destructive />
        <Row label={t('settings.deleteAccount')} onPress={onDelete} chevron={false} destructive />
      </SectionCard>
    </Screen>
  );
}
