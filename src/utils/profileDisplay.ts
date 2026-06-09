import { Ionicons } from '@expo/vector-icons';
import { Gender, InterestedIn } from '../api/types';
import { GENDER_LABEL_KEYS, LANGUAGE_OPTIONS } from '../config/profileOptions';

export interface ProfileDetailItem {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
}

export interface ProfileInterestItem {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
}

const INTEREST_CATALOG: {
  pattern: RegExp;
  icon: keyof typeof Ionicons.glyphMap;
  labelEn: string;
  labelEs: string;
}[] = [
  { pattern: /hik/i, icon: 'walk-outline', labelEn: 'Hiking', labelEs: 'Senderismo' },
  { pattern: /music/i, icon: 'musical-notes-outline', labelEn: 'Music', labelEs: 'Música' },
  { pattern: /travel/i, icon: 'airplane-outline', labelEn: 'Travel', labelEs: 'Viajes' },
  { pattern: /coffee/i, icon: 'cafe-outline', labelEn: 'Coffee', labelEs: 'Café' },
  { pattern: /beach|playa/i, icon: 'sunny-outline', labelEn: 'Beach', labelEs: 'Playa' },
  { pattern: /food|cocina|restaurant/i, icon: 'restaurant-outline', labelEn: 'Food', labelEs: 'Comida' },
  { pattern: /sport|deporte/i, icon: 'football-outline', labelEn: 'Sports', labelEs: 'Deportes' },
];

const GENDER_ICON: Record<Gender, keyof typeof Ionicons.glyphMap> = {
  male: 'male-outline',
  female: 'female-outline',
  non_binary: 'transgender-outline',
  gender_fluid: 'sparkles-outline',
  other: 'ellipse-outline',
  prefer_not_to_say: 'eye-off-outline',
};

export function genderIcon(g: Gender): keyof typeof Ionicons.glyphMap {
  return GENDER_ICON[g] ?? 'person-outline';
}

export function genderLabel(g: Gender, t: (key: string) => string): string {
  return t(GENDER_LABEL_KEYS[g]);
}

export function interestedInIcon(value: InterestedIn): keyof typeof Ionicons.glyphMap {
  if (value === 'men') return 'male-outline';
  if (value === 'women') return 'female-outline';
  return 'people-outline';
}

export function interestedInLabel(value: InterestedIn, t: (key: string) => string): string {
  if (value === 'men') return t('profile.interestedMen');
  if (value === 'women') return t('profile.interestedWomen');
  return t('profile.interestedBoth');
}

export function languageLabel(id: string, t: (key: string) => string): string {
  const opt = LANGUAGE_OPTIONS.find((o) => o.id === id);
  return opt ? t(opt.labelKey) : id;
}

export function buildProfileDetails(
  profile: { gender: Gender | null; interestedIn: InterestedIn | null; languages: string[] },
  t: (key: string) => string,
): ProfileDetailItem[] {
  const items: ProfileDetailItem[] = [];

  if (profile.gender) {
    items.push({ icon: genderIcon(profile.gender), label: genderLabel(profile.gender, t) });
  }

  if (profile.interestedIn) {
    items.push({
      icon: interestedInIcon(profile.interestedIn),
      label: interestedInLabel(profile.interestedIn, t),
    });
  }

  if (profile.languages.length) {
    items.push({
      icon: 'globe-outline',
      label: profile.languages
        .slice(0, 2)
        .map((id) => languageLabel(id, t))
        .join(', '),
    });
  }

  return items.slice(0, 3);
}

export function extractInterestsFromBio(
  bio: string | null,
  language: string,
): ProfileInterestItem[] {
  if (!bio) return [];

  const isEs = language.startsWith('es');
  return INTEREST_CATALOG.filter((item) => item.pattern.test(bio)).map((item) => ({
    icon: item.icon,
    label: isEs ? item.labelEs : item.labelEn,
  }));
}

export function formatProfileLocation(city: string | null, t: (key: string) => string): string | null {
  if (!city) return null;
  const suffix = city.toLowerCase().includes('mallorca') ? city : `${city}, Mallorca`;
  return `${suffix} · ${t('discovery.nearby')}`;
}
