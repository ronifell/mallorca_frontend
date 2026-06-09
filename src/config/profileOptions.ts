import { Gender, InterestSelection } from '../api/types';

/**
 * Languages spoken — stored verbatim on the backend (`user_languages.language`).
 * We use stable, locale-neutral identifiers for the value and resolve the
 * display label through i18n (`profile.lang_*`).
 */
export interface LanguageOption {
  id: string;
  flag: string;
  /** i18n key under `profile.*` for the display label. */
  labelKey: string;
}

export const LANGUAGE_OPTIONS: LanguageOption[] = [
  { id: 'es', flag: '🇪🇸', labelKey: 'profile.lang_es' },
  { id: 'de', flag: '🇩🇪', labelKey: 'profile.lang_de' },
  { id: 'fr', flag: '🇫🇷', labelKey: 'profile.lang_fr' },
  { id: 'it', flag: '🇮🇹', labelKey: 'profile.lang_it' },
  { id: 'en', flag: '🇬🇧', labelKey: 'profile.lang_en' },
  { id: 'ca-mallorqui', flag: '🟡', labelKey: 'profile.lang_ca_mallorqui' },
  { id: 'pt', flag: '🇵🇹', labelKey: 'profile.lang_pt' },
  { id: 'other', flag: '🌐', labelKey: 'profile.lang_other' },
];

export const GENDER_LABEL_KEYS: Record<Gender, string> = {
  male: 'profile.male',
  female: 'profile.female',
  non_binary: 'profile.nonBinary',
  gender_fluid: 'profile.genderFluid',
  other: 'profile.other',
  prefer_not_to_say: 'profile.preferNotToSay',
};

export const INTEREST_OPTIONS: { id: InterestSelection; labelKey: string }[] = [
  { id: 'men', labelKey: 'profile.interestedMen' },
  { id: 'women', labelKey: 'profile.interestedWomen' },
  { id: 'everyone', labelKey: 'profile.interestedBoth' },
];
