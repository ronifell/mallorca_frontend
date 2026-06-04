import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  ImageBackground,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usersApi } from '../../api/endpoints';
import { LanguageOptionRow } from '../../components/settings/LanguageOptionRow';
import { useTopScreenPadding } from '../../hooks/useTopScreenPadding';
import { setLanguage } from '../../i18n';
import { colors } from '../../theme/colors';

const languageBackground = require('../../../assets/main1.png');

const LANGUAGES = [
  { id: 'es' as const, flag: '🇪🇸', titleKey: 'spanishTitle', subtitleKey: 'spanishSubtitle' },
  { id: 'en' as const, flag: '🇬🇧', titleKey: 'englishTitle', subtitleKey: 'englishSubtitle' },
];

export function LanguageScreen() {
  const { t, i18n } = useTranslation();
  const nav = useNavigation();
  const qc = useQueryClient();
  const topPadding = useTopScreenPadding();
  const current = i18n.language.startsWith('es') ? 'es' : 'en';

  const choose = async (lang: 'en' | 'es') => {
    await setLanguage(lang);
    usersApi.update({ appLanguage: lang }).catch(() => undefined);
    qc.invalidateQueries({ queryKey: ['me'] });
    nav.goBack();
  };

  return (
    <View style={styles.root}>
      <ImageBackground
        source={languageBackground}
        resizeMode="cover"
        style={StyleSheet.absoluteFillObject}
        imageStyle={styles.backgroundImage}
      />

      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <View className="px-5" style={{ paddingTop: topPadding }}>
          <Pressable
            onPress={() => nav.goBack()}
            className="w-10 h-10 rounded-full bg-white items-center justify-center border border-cream-300 mb-5"
            style={styles.backButton}
            accessibilityRole="button"
            accessibilityLabel={t('common.back')}
          >
            <Ionicons name="chevron-back" size={22} color={colors.ink[700]} />
          </Pressable>

          <Text className="text-ink-700 text-3xl font-bold">{t('settings.language')}</Text>
          <Text className="text-ink-400 text-sm mt-2 leading-5 max-w-[300px]">
            {t('settings.languagePageSubtitle')}
          </Text>
        </View>

        <View className="px-5 mt-8">
          <View className="bg-white rounded-2xl overflow-hidden" style={cardShadow}>
            {LANGUAGES.map((lang, index) => (
              <LanguageOptionRow
                key={lang.id}
                flag={lang.flag}
                title={t(`settings.${lang.titleKey}`)}
                subtitle={t(`settings.${lang.subtitleKey}`)}
                selected={current === lang.id}
                onPress={() => choose(lang.id)}
                showDivider={index < LANGUAGES.length - 1}
              />
            ))}
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.cream[50],
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
  },
  safeArea: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  backButton: {
    shadowColor: '#3D2618',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
});

const cardShadow = {
  shadowColor: '#3D2618',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.08,
  shadowRadius: 10,
  elevation: 3,
};
