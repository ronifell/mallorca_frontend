import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import es from './locales/es.json';

const LANGUAGE_KEY = '@app/language';

export const SUPPORTED_LANGUAGES = ['en', 'es'] as const;
export type AppLanguage = (typeof SUPPORTED_LANGUAGES)[number];

function detectLanguage(): AppLanguage {
  const locales = Localization.getLocales();
  const tag = locales[0]?.languageCode ?? 'en';
  return SUPPORTED_LANGUAGES.includes(tag as AppLanguage) ? (tag as AppLanguage) : 'en';
}

export async function setLanguage(lang: AppLanguage): Promise<void> {
  await AsyncStorage.setItem(LANGUAGE_KEY, lang);
  await i18n.changeLanguage(lang);
}

export async function initI18n(): Promise<void> {
  const stored = (await AsyncStorage.getItem(LANGUAGE_KEY)) as AppLanguage | null;
  const lang = stored ?? detectLanguage();

  await i18n
    .use(initReactI18next)
    .init({
      resources: { en: { translation: en }, es: { translation: es } },
      lng: lang,
      fallbackLng: 'en',
      interpolation: { escapeValue: false },
      compatibilityJSON: 'v3',
    });
}

export default i18n;
