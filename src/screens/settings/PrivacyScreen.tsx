import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert } from 'react-native';
import { extractErrorMessage } from '../../api/client';
import { usersApi } from '../../api/endpoints';
import { Row, SectionCard } from '../../components/Row';
import { Screen } from '../../components/Screen';
import { RootStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function PrivacyScreen() {
  const { t } = useTranslation();
  const nav = useNavigation<Nav>();
  const [exporting, setExporting] = useState(false);

  const exportData = async () => {
    setExporting(true);
    try {
      const data = await usersApi.exportData();
      Alert.alert(
        t('settings.exportData'),
        `OK — ${Object.keys(data).join(', ')}\n\n${t('common.ok')}`,
      );
    } catch (e) {
      Alert.alert(t('common.error'), extractErrorMessage(e));
    } finally {
      setExporting(false);
    }
  };

  return (
    <Screen scroll>
      <SectionCard>
        <Row label={t('settings.blockedUsers')} onPress={() => nav.navigate('BlockedUsers')} />
        <Row
          label={t('settings.exportData')}
          detail={exporting ? '…' : undefined}
          onPress={exportData}
          chevron={false}
        />
      </SectionCard>
    </Screen>
  );
}
