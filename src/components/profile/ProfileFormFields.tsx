import React, { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import { Gender, InterestSelection, RelationshipGoal } from '../../api/types';
import { AgeRangePicker } from '../../components/profile/AgeRangePicker';
import { BioTextArea } from '../../components/profile/BioTextArea';
import { CityPicker } from '../../components/profile/CityPicker';
import { GenderToggle } from '../../components/profile/GenderToggle';
import { InterestPill, InterestPillRow } from '../../components/profile/InterestPill';
import { LanguageFlagPill } from '../../components/profile/LanguageFlagPill';
import { ProfileSectionLabel } from '../../components/profile/ProfileSectionLabel';
import { RelationshipGoalChips } from '../../components/profile/RelationshipGoalChips';
import { Input } from '../../components/Input';
import { INTEREST_OPTIONS, LANGUAGE_OPTIONS } from '../../config/profileOptions';

type GenderLabels = Record<Gender, string>;

interface IdentityFieldsProps {
  firstName: string;
  onFirstNameChange: (value: string) => void;
  birthDate: string;
  onBirthDateChange: (value: string) => void;
}

/** Name + birth date only — isolates keystroke re-renders from the rest of the form. */
export const ProfileIdentityFields = memo(function ProfileIdentityFields({
  firstName,
  onFirstNameChange,
  birthDate,
  onBirthDateChange,
}: IdentityFieldsProps) {
  const { t } = useTranslation();

  return (
    <>
      <ProfileSectionLabel label={t('profile.firstName')} icon="person-outline" />
      <Input
        elevated
        value={firstName}
        onChangeText={onFirstNameChange}
        placeholder={t('profile.firstNamePlaceholder')}
        leftIcon="person-outline"
        autoCapitalize="words"
      />

      <ProfileSectionLabel label={t('profile.birthDate')} icon="calendar-outline" />
      <Input
        elevated
        placeholder={t('profile.birthDatePlaceholder')}
        value={birthDate}
        onChangeText={onBirthDateChange}
        keyboardType="number-pad"
        maxLength={10}
        rightIcon="calendar-outline"
      />
    </>
  );
});

interface DetailsFieldsProps {
  gender: Gender | null;
  onGenderChange: (value: Gender) => void;
  genderLabels: GenderLabels;
  interests: InterestSelection[];
  onToggleInterest: (id: InterestSelection) => void;
  relationshipGoals: RelationshipGoal[];
  onRelationshipGoalsChange: (value: RelationshipGoal[]) => void;
  ageRange: { min: number; max: number };
  onAgeRangeChange: (value: { min: number; max: number }) => void;
  city: string;
  onCityChange: (value: string) => void;
  bio: string;
  onBioChange: (value: string) => void;
  languages: string[];
  onToggleLang: (id: string) => void;
}

export const ProfileDetailsFields = memo(function ProfileDetailsFields({
  gender,
  onGenderChange,
  genderLabels,
  interests,
  onToggleInterest,
  relationshipGoals,
  onRelationshipGoalsChange,
  ageRange,
  onAgeRangeChange,
  city,
  onCityChange,
  bio,
  onBioChange,
  languages,
  onToggleLang,
}: DetailsFieldsProps) {
  const { t } = useTranslation();

  return (
    <>
      <ProfileSectionLabel label={t('profile.iAm')} icon="person-circle-outline" />
      <GenderToggle value={gender} onChange={onGenderChange} labels={genderLabels} />

      <ProfileSectionLabel label={t('profile.lookingFor')} icon="heart-outline" />
      <Text className="text-ink-400 text-xs mb-2">{t('profile.interestedHelper')}</Text>
      <InterestPillRow>
        {INTEREST_OPTIONS.map((opt) => (
          <InterestPill
            key={opt.id}
            type={opt.id}
            label={t(opt.labelKey)}
            selected={interests.includes(opt.id)}
            onPress={() => onToggleInterest(opt.id)}
          />
        ))}
      </InterestPillRow>
      <View className="mb-2" />

      <ProfileSectionLabel label={t('profile.relationshipGoal')} icon="sparkles-outline" />
      <Text className="text-ink-400 text-xs mb-2">{t('profile.relationshipGoalHelper')}</Text>
      <RelationshipGoalChips value={relationshipGoals} onChange={onRelationshipGoalsChange} />

      <ProfileSectionLabel label={t('profile.ageRange')} icon="calendar-number-outline" />
      <Text className="text-ink-400 text-xs mb-2">{t('profile.ageRangeHelper')}</Text>
      <AgeRangePicker min={ageRange.min} max={ageRange.max} onChange={onAgeRangeChange} />

      <ProfileSectionLabel label={t('profile.city')} icon="location-outline" />
      <CityPicker value={city} onChange={onCityChange} placeholder={t('profile.cityPlaceholder')} />

      <ProfileSectionLabel label={t('profile.bio')} icon="chatbubble-outline" />
      <BioTextArea value={bio} onChangeText={onBioChange} placeholder={t('profile.bioPlaceholder')} />

      <ProfileSectionLabel label={t('profile.languages')} icon="globe-outline" />
      <Text className="text-ink-400 text-xs mb-2">{t('profile.languagesHelper')}</Text>
      <View className="flex-row flex-wrap mb-4">
        {LANGUAGE_OPTIONS.map((lang) => (
          <LanguageFlagPill
            key={lang.id}
            flag={lang.flag}
            label={t(lang.labelKey)}
            selected={languages.includes(lang.id)}
            onPress={() => onToggleLang(lang.id)}
          />
        ))}
      </View>
    </>
  );
});
