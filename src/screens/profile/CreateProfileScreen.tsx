import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import { extractErrorMessage } from '../../api/client';
import { usersApi } from '../../api/endpoints';
import { Button } from '../../components/Button';
import { Chip } from '../../components/Chip';
import { Input } from '../../components/Input';
import { Screen } from '../../components/Screen';
import { ProfileSetupStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<ProfileSetupStackParamList, 'CreateProfile'>;

const ALL_LANGUAGES = ['English', 'Español', 'Català', 'Deutsch', 'Français', 'Italiano'];

function isValidIsoDate(s: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(new Date(s).getTime());
}

export function CreateProfileScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const [firstName, setFirstName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | null>(null);
  const [interested, setInterested] = useState<'men' | 'women' | 'both' | null>(null);
  const [city, setCity] = useState('');
  const [bio, setBio] = useState('');
  const [languages, setLanguages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleLang = (l: string) =>
    setLanguages((prev) => (prev.includes(l) ? prev.filter((x) => x !== l) : [...prev, l]));

  const submit = async () => {
    setError(null);
    if (!firstName || !birthDate || !gender || !interested || !city) {
      setError(t('common.error'));
      return;
    }
    if (!isValidIsoDate(birthDate)) {
      setError('Format: YYYY-MM-DD');
      return;
    }
    setLoading(true);
    try {
      await usersApi.update({
        firstName,
        birthDate,
        gender,
        interestedIn: interested,
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
    <Screen scroll>
      <Text className="text-ink-700 font-serif text-2xl mb-1">{t('profile.complete')}</Text>
      <Text className="text-ink-400 mb-5">{t('profile.incomplete')}</Text>

      <Input label={t('profile.firstName')} value={firstName} onChangeText={setFirstName} />
      <Input
        label={t('profile.birthDate')}
        placeholder="YYYY-MM-DD"
        value={birthDate}
        onChangeText={setBirthDate}
        keyboardType="numbers-and-punctuation"
      />

      <Text className="text-ink-700 font-semibold mb-2 mt-2">{t('profile.gender')}</Text>
      <View className="flex-row flex-wrap mb-3">
        <Chip
          label={t('profile.male')}
          selected={gender === 'male'}
          onPress={() => setGender('male')}
        />
        <Chip
          label={t('profile.female')}
          selected={gender === 'female'}
          onPress={() => setGender('female')}
        />
      </View>

      <Text className="text-ink-700 font-semibold mb-2 mt-2">{t('profile.interestedIn')}</Text>
      <View className="flex-row flex-wrap mb-3">
        <Chip
          label={t('profile.interestedMen')}
          selected={interested === 'men'}
          onPress={() => setInterested('men')}
        />
        <Chip
          label={t('profile.interestedWomen')}
          selected={interested === 'women'}
          onPress={() => setInterested('women')}
        />
        <Chip
          label={t('profile.interestedBoth')}
          selected={interested === 'both'}
          onPress={() => setInterested('both')}
        />
      </View>

      <Input label={t('profile.city')} value={city} onChangeText={setCity} placeholder="Palma" />
      <Input
        label={t('profile.bio')}
        value={bio}
        onChangeText={setBio}
        multiline
        numberOfLines={4}
        placeholder={t('profile.bioPlaceholder')}
      />

      <Text className="text-ink-700 font-semibold mb-2 mt-2">{t('profile.languages')}</Text>
      <View className="flex-row flex-wrap mb-4">
        {ALL_LANGUAGES.map((l) => (
          <Chip key={l} label={l} selected={languages.includes(l)} onPress={() => toggleLang(l)} />
        ))}
      </View>

      {error ? (
        <View className="bg-brand-50 rounded-2xl p-3 mb-4">
          <Text className="text-brand-600 text-center">{error}</Text>
        </View>
      ) : null}

      <Button label={t('common.continue')} fullWidth loading={loading} onPress={submit} />
    </Screen>
  );
}
