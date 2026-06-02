import { useNavigation } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { usersApi } from '../../api/endpoints';
import { Row, SectionCard } from '../../components/Row';
import { Screen } from '../../components/Screen';
import { setLanguage } from '../../i18n';

export function LanguageScreen() {
  const { i18n } = useTranslation();
  const nav = useNavigation();
  const qc = useQueryClient();

  const choose = async (lang: 'en' | 'es') => {
    await setLanguage(lang);
    usersApi.update({ appLanguage: lang }).catch(() => undefined);
    qc.invalidateQueries({ queryKey: ['me'] });
    nav.goBack();
  };

  return (
    <Screen scroll>
      <SectionCard>
        <Row
          label="Español"
          detail={i18n.language === 'es' ? '✓' : ''}
          chevron={false}
          onPress={() => choose('es')}
        />
        <Row
          label="English"
          detail={i18n.language === 'en' ? '✓' : ''}
          chevron={false}
          onPress={() => choose('en')}
        />
      </SectionCard>
    </Screen>
  );
}
