import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import { usersApi } from '../../api/endpoints';
import { Gender, InterestSelection, RelationshipGoal } from '../../api/types';
import { ProfileContinueButton } from '../../components/profile/ProfileContinueButton';
import { ProfileDetailsFields, ProfileIdentityFields } from '../../components/profile/ProfileFormFields';
import { ProfileSetupShell } from '../../components/profile/ProfileSetupShell';
import { GENDER_LABEL_KEYS } from '../../config/profileOptions';
import { ProfileSetupStackParamList } from '../../navigation/types';
import { useContentFilter } from '../../hooks/useContentFilter';
import {
  displayToIsoBirthDate,
  formatBirthDateInput,
} from '../../utils/birthDateFormat';
import { validateProfileFields, extractContentBlockedMessage } from '../../utils/contentFilterHelpers';
import { formatUserError } from '../../utils/formatUserError';
import { useAuthStore } from '../../store/auth';

type Props = NativeStackScreenProps<ProfileSetupStackParamList, 'CreateProfile'>;

export function CreateProfileScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const { check: checkContent } = useContentFilter();
  const logout = useAuthStore((s) => s.logout);

  const [firstName, setFirstName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState<Gender | null>(null);
  const [interests, setInterests] = useState<InterestSelection[]>([]);
  const [city, setCity] = useState('');
  const [bio, setBio] = useState('');
  const [languages, setLanguages] = useState<string[]>([]);
  const [relationshipGoals, setRelationshipGoals] = useState<RelationshipGoal[]>([]);
  const [ageRange, setAgeRange] = useState<{ min: number; max: number }>({ min: 18, max: 99 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const genderLabels = useMemo(
    () =>
      ({
        male: t(GENDER_LABEL_KEYS.male),
        female: t(GENDER_LABEL_KEYS.female),
        non_binary: t(GENDER_LABEL_KEYS.non_binary),
        gender_fluid: t(GENDER_LABEL_KEYS.gender_fluid),
        other: t(GENDER_LABEL_KEYS.other),
        prefer_not_to_say: t(GENDER_LABEL_KEYS.prefer_not_to_say),
      }) as Record<Gender, string>,
    [t],
  );

  const toggleInterest = useCallback((id: InterestSelection) => {
    setInterests((prev) => {
      if (id === 'everyone') {
        return prev.includes('everyone') ? [] : ['everyone'];
      }
      const without = prev.filter((x) => x !== 'everyone');
      return without.includes(id) ? without.filter((x) => x !== id) : [...without, id];
    });
  }, []);

  const toggleLang = useCallback((id: string) => {
    setLanguages((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }, []);

  const onBirthDateChange = useCallback((v: string) => {
    setBirthDate(formatBirthDateInput(v));
  }, []);

  const submit = async () => {
    setError(null);
    if (!firstName || !birthDate || !gender || !interests.length || !city) {
      setError(t('profile.fillRequired'));
      return;
    }
    if (!relationshipGoals.length) {
      setError(t('profile.relationshipGoalRequired'));
      return;
    }
    if (ageRange.min > ageRange.max) {
      setError(t('profile.ageRangeInvalid'));
      return;
    }
    const isoBirthDate = displayToIsoBirthDate(birthDate);
    if (!isoBirthDate) {
      setError(t('profile.birthDateFormat'));
      return;
    }
    const blockedField = validateProfileFields(
      [{ value: firstName }, { value: city }, { value: bio }],
      checkContent,
    );
    if (blockedField) {
      setError(blockedField);
      return;
    }
    setLoading(true);
    try {
      await usersApi.update({
        firstName,
        birthDate: isoBirthDate,
        gender,
        interestSelections: interests,
        relationshipGoals,
        minAge: ageRange.min,
        maxAge: ageRange.max,
        city,
        bio,
        languages,
      });
      navigation.navigate('UploadPhotos');
    } catch (e) {
      setError(extractContentBlockedMessage(e, t) ?? formatUserError(e, t));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProfileSetupShell currentStep={1} onBack={() => logout()}>
      <View className="mb-6">
        <View className="flex-row items-center flex-wrap">
          <Text className="text-ink-700 font-serif text-3xl">{t('profile.title')}</Text>
          <Text className="text-coral-500 text-xl ml-1.5">♥</Text>
        </View>
        <View className="h-1 w-20 bg-coral-500 rounded-full mt-2 opacity-80" />
        <Text className="text-ink-700 text-xl font-bold mt-4">{t('profile.complete')}</Text>
        <Text className="text-ink-400 text-sm mt-2 leading-5">{t('profile.incomplete')}</Text>
      </View>

      <ProfileIdentityFields
        firstName={firstName}
        onFirstNameChange={setFirstName}
        birthDate={birthDate}
        onBirthDateChange={onBirthDateChange}
      />

      <ProfileDetailsFields
        gender={gender}
        onGenderChange={setGender}
        genderLabels={genderLabels}
        interests={interests}
        onToggleInterest={toggleInterest}
        relationshipGoals={relationshipGoals}
        onRelationshipGoalsChange={setRelationshipGoals}
        ageRange={ageRange}
        onAgeRangeChange={setAgeRange}
        city={city}
        onCityChange={setCity}
        bio={bio}
        onBioChange={setBio}
        languages={languages}
        onToggleLang={toggleLang}
      />

      {error ? (
        <View className="bg-coral-50 rounded-2xl p-3 mb-4">
          <Text className="text-coral-600 text-center">{error}</Text>
        </View>
      ) : null}

      <ProfileContinueButton label={t('common.continue')} loading={loading} onPress={submit} />
    </ProfileSetupShell>
  );
}
