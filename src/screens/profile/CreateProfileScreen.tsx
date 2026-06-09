import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import { extractErrorMessage } from '../../api/client';
import { usersApi } from '../../api/endpoints';
import { Gender, InterestSelection } from '../../api/types';
import { BioTextArea } from '../../components/profile/BioTextArea';
import { GenderToggle } from '../../components/profile/GenderToggle';
import { InterestPill, InterestPillRow } from '../../components/profile/InterestPill';
import { LanguageFlagPill } from '../../components/profile/LanguageFlagPill';
import { ProfileContinueButton } from '../../components/profile/ProfileContinueButton';
import { ProfileSectionLabel } from '../../components/profile/ProfileSectionLabel';
import { ProfileSetupShell } from '../../components/profile/ProfileSetupShell';
import { Input } from '../../components/Input';
import {
  GENDER_LABEL_KEYS,
  INTEREST_OPTIONS,
  LANGUAGE_OPTIONS,
} from '../../config/profileOptions';
import { ProfileSetupStackParamList } from '../../navigation/types';
import { useAuthStore } from '../../store/auth';

type Props = NativeStackScreenProps<ProfileSetupStackParamList, 'CreateProfile'>;

function isValidIsoDate(s: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(new Date(s).getTime());
}

export function CreateProfileScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const logout = useAuthStore((s) => s.logout);

  const [firstName, setFirstName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState<Gender | null>(null);
  const [interests, setInterests] = useState<InterestSelection[]>([]);
  const [city, setCity] = useState('');
  const [bio, setBio] = useState('');
  const [languages, setLanguages] = useState<string[]>([]);
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
      } as Record<Gender, string>),
    [t],
  );

  const toggleInterest = (id: InterestSelection) =>
    setInterests((prev) => {
      if (id === 'everyone') {
        return prev.includes('everyone') ? [] : ['everyone'];
      }
      const without = prev.filter((x) => x !== 'everyone');
      return without.includes(id) ? without.filter((x) => x !== id) : [...without, id];
    });

  const toggleLang = (id: string) =>
    setLanguages((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const submit = async () => {
    setError(null);
    if (!firstName || !birthDate || !gender || !interests.length || !city) {
      setError(t('common.error'));
      return;
    }
    if (!isValidIsoDate(birthDate)) {
      setError(t('profile.birthDateFormat'));
      return;
    }
    setLoading(true);
    try {
      await usersApi.update({
        firstName,
        birthDate,
        gender,
        interestSelections: interests,
        city,
        bio,
        languages,
      });
      navigation.navigate('UploadPhotos');
    } catch (e) {
      setError(extractErrorMessage(e));
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

      <ProfileSectionLabel label={t('profile.firstName')} icon="person-outline" />
      <Input
        elevated
        value={firstName}
        onChangeText={setFirstName}
        placeholder={t('profile.firstNamePlaceholder')}
        leftIcon="person-outline"
        autoCapitalize="words"
      />

      <ProfileSectionLabel label={t('profile.birthDate')} icon="calendar-outline" />
      <Input
        elevated
        placeholder={t('profile.birthDatePlaceholder')}
        value={birthDate}
        onChangeText={setBirthDate}
        keyboardType="numbers-and-punctuation"
        rightIcon="calendar-outline"
      />

      <ProfileSectionLabel label={t('profile.iAm')} icon="person-circle-outline" />
      <GenderToggle value={gender} onChange={setGender} labels={genderLabels} />

      <ProfileSectionLabel label={t('profile.lookingFor')} icon="heart-outline" />
      <Text className="text-ink-400 text-xs mb-2">{t('profile.interestedHelper')}</Text>
      <InterestPillRow>
        {INTEREST_OPTIONS.map((opt) => (
          <InterestPill
            key={opt.id}
            type={opt.id}
            label={t(opt.labelKey)}
            selected={interests.includes(opt.id)}
            onPress={() => toggleInterest(opt.id)}
          />
        ))}
      </InterestPillRow>
      <View className="mb-2" />

      <ProfileSectionLabel label={t('profile.city')} icon="location-outline" />
      <Input
        elevated
        value={city}
        onChangeText={setCity}
        placeholder={t('profile.cityPlaceholder')}
        rightIcon="chevron-forward"
      />

      <ProfileSectionLabel label={t('profile.bio')} icon="chatbubble-outline" />
      <BioTextArea
        value={bio}
        onChangeText={setBio}
        placeholder={t('profile.bioPlaceholder')}
      />

      <ProfileSectionLabel label={t('profile.languages')} icon="globe-outline" />
      <Text className="text-ink-400 text-xs mb-2">{t('profile.languagesHelper')}</Text>
      <View className="flex-row flex-wrap mb-4">
        {LANGUAGE_OPTIONS.map((lang) => (
          <LanguageFlagPill
            key={lang.id}
            flag={lang.flag}
            label={t(lang.labelKey)}
            selected={languages.includes(lang.id)}
            onPress={() => toggleLang(lang.id)}
          />
        ))}
      </View>

      {error ? (
        <View className="bg-coral-50 rounded-2xl p-3 mb-4">
          <Text className="text-coral-600 text-center">{error}</Text>
        </View>
      ) : null}

      <ProfileContinueButton label={t('common.continue')} loading={loading} onPress={submit} />
    </ProfileSetupShell>
  );
}
