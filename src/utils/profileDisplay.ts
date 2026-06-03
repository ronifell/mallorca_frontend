import { Ionicons } from '@expo/vector-icons';
import { Gender, InterestedIn, MyProfile } from '../api/types';

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

export function buildProfileDetails(
  profile: Pick<MyProfile, 'gender' | 'interestedIn' | 'languages'>,
  t: (key: string) => string,
): ProfileDetailItem[] {
  const items: ProfileDetailItem[] = [];

  if (profile.gender === 'female') {
    items.push({ icon: 'female-outline', label: t('discovery.woman') });
  } else if (profile.gender === 'male') {
    items.push({ icon: 'male-outline', label: t('discovery.man') });
  }

  if (profile.interestedIn === 'men') {
    items.push({ icon: 'male-outline', label: t('profile.interestedMen') });
  } else if (profile.interestedIn === 'women') {
    items.push({ icon: 'female-outline', label: t('profile.interestedWomen') });
  } else if (profile.interestedIn === 'both') {
    items.push({ icon: 'people-outline', label: t('discovery.menAndWomen') });
  }

  if (profile.languages.length) {
    items.push({
      icon: 'globe-outline',
      label: profile.languages.slice(0, 2).join(', '),
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
