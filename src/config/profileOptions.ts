import { Ionicons } from '@expo/vector-icons';
import { Gender, InterestSelection, RelationshipGoal } from '../api/types';

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

export interface RelationshipGoalOption {
  id: RelationshipGoal;
  /** i18n key under `profile.relationshipGoal*`. */
  labelKey: string;
  icon: keyof typeof Ionicons.glyphMap;
  /** Accent color used to tint the option chip when selected. */
  color: string;
}

export const RELATIONSHIP_GOAL_OPTIONS: RelationshipGoalOption[] = [
  { id: 'love',       labelKey: 'profile.relationshipGoalLove',       icon: 'heart',                 color: '#E8554E' },
  { id: 'friendship', labelKey: 'profile.relationshipGoalFriendship', icon: 'people',                color: '#4A90D9' },
  { id: 'chat',       labelKey: 'profile.relationshipGoalChat',       icon: 'chatbubbles',           color: '#A57BD9' },
  { id: 'casual',     labelKey: 'profile.relationshipGoalCasual',     icon: 'sparkles',              color: '#F5B301' },
  { id: 'serious',    labelKey: 'profile.relationshipGoalSerious',    icon: 'ribbon',                color: '#D44A42' },
  { id: 'long_term',  labelKey: 'profile.relationshipGoalLongTerm',   icon: 'infinite',              color: '#2E8C66' },
];

export const RELATIONSHIP_GOAL_LABEL_KEYS: Record<RelationshipGoal, string> =
  RELATIONSHIP_GOAL_OPTIONS.reduce<Record<RelationshipGoal, string>>(
    (acc, opt) => {
      acc[opt.id] = opt.labelKey;
      return acc;
    },
    {} as Record<RelationshipGoal, string>,
  );
