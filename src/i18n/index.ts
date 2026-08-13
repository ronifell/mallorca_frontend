import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import es from './locales/es.json';

const LANGUAGE_KEY = '@app/language';

export const SUPPORTED_LANGUAGES = ['en', 'es'] as const;
export type AppLanguage = (typeof SUPPORTED_LANGUAGES)[number];

/** Normalize i18n / device tags (`en-US`, `es-ES`) to API `en` | `es`. */
export function resolveAppLanguage(language?: string | null): AppLanguage {
  if (language && language.toLowerCase().startsWith('en')) return 'en';
  return 'es';
}

function detectLanguage(): AppLanguage {
  const locales = Localization.getLocales();
  const tag = locales[0]?.languageCode ?? 'es';
  return SUPPORTED_LANGUAGES.includes(tag as AppLanguage) ? (tag as AppLanguage) : 'es';
}

export async function setLanguage(lang: AppLanguage): Promise<void> {
  await AsyncStorage.setItem(LANGUAGE_KEY, lang);
  await i18n.changeLanguage(lang);
}

/** Returns a stored UI language choice, or null when the user has not picked one yet. */
export async function getStoredLanguage(): Promise<AppLanguage | null> {
  const stored = (await AsyncStorage.getItem(LANGUAGE_KEY)) as AppLanguage | null;
  return stored === 'en' || stored === 'es' ? stored : null;
}

export async function initI18n(): Promise<void> {
  const stored = (await AsyncStorage.getItem(LANGUAGE_KEY)) as AppLanguage | null;
  const lang = stored ?? detectLanguage();

  await i18n
    .use(initReactI18next)
    .init({
      resources: { en: { translation: en }, es: { translation: es } },
      lng: lang,
      fallbackLng: 'es',
      interpolation: { escapeValue: false },
      compatibilityJSON: 'v3',
    });
}

export default i18n;
