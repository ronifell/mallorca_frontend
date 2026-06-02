import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Image, Pressable, Text, View } from 'react-native';
import { extractErrorMessage } from '../../api/client';
import { usersApi } from '../../api/endpoints';
import { Photo } from '../../api/types';
import { Button } from '../../components/Button';
import { Chip } from '../../components/Chip';
import { Input } from '../../components/Input';
import { Screen } from '../../components/Screen';
import { RootStackParamList } from '../../navigation/types';

const LANGS = ['English', 'Español', 'Català', 'Deutsch', 'Français', 'Italiano'];

export function EditProfileScreen() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { data: me } = useQuery({ queryKey: ['me'], queryFn: () => usersApi.me() });

  const [firstName, setFirstName] = useState('');
  const [city, setCity] = useState('');
  const [bio, setBio] = useState('');
  const [interested, setInterested] = useState<'men' | 'women' | 'both' | null>(null);
  const [languages, setLanguages] = useState<string[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!me) return;
    setFirstName(me.firstName ?? '');
    setCity(me.city ?? '');
    setBio(me.bio ?? '');
    setInterested(me.interestedIn);
    setLanguages(me.languages);
    setPhotos(me.photos);
  }, [me]);

  const toggleLang = (l: string) =>
    setLanguages((prev) => (prev.includes(l) ? prev.filter((x) => x !== l) : [...prev, l]));

  const pick = async () => {
    if (photos.length >= 6) return;
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
      allowsEditing: true,
      aspect: [3, 4],
    });
    if (res.canceled || !res.assets[0]) return;
    try {
      const uploaded = await usersApi.uploadPhoto(res.assets[0].uri);
      setPhotos((prev) => [...prev, uploaded]);
    } catch (e) {
      Alert.alert(t('common.error'), extractErrorMessage(e));
    }
  };

  const remove = async (id: string) => {
    try {
      await usersApi.deletePhoto(id);
      setPhotos((prev) => prev.filter((p) => p.id !== id));
    } catch (e) {
      Alert.alert(t('common.error'), extractErrorMessage(e));
    }
  };

  const save = async () => {
    setSaving(true);
    try {
      await usersApi.update({
        firstName,
        city,
        bio,
        interestedIn: interested ?? undefined,
        languages,
      });
      await qc.invalidateQueries({ queryKey: ['me'] });
      nav.goBack();
    } catch (e) {
      Alert.alert(t('common.error'), extractErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  if (!me) return null;

  return (
    <Screen scroll>
      <Text className="text-ink-700 font-semibold mb-2">{t('profile.photos')}</Text>
      <View className="flex-row flex-wrap -m-1 mb-4">
        {Array.from({ length: 6 }).map((_, i) => {
          const p = photos[i];
          return (
            <View key={p?.id ?? `slot-${i}`} className="w-1/3 p-1 aspect-[3/4]">
              {p ? (
                <View className="rounded-2xl overflow-hidden bg-cream-300 w-full h-full">
                  <Image source={{ uri: p.url }} className="w-full h-full" />
                  <Pressable
                    onPress={() => remove(p.id)}
                    className="absolute top-1 right-1 bg-brand-500 rounded-full w-7 h-7 items-center justify-center"
                  >
                    <Text className="text-white font-bold">×</Text>
                  </Pressable>
                </View>
              ) : (
                <Pressable
                  onPress={pick}
                  className="rounded-2xl bg-white border-2 border-dashed border-cream-400 w-full h-full items-center justify-center"
                >
                  <Text className="text-brand-500 text-3xl">+</Text>
                </Pressable>
              )}
            </View>
          );
        })}
      </View>

      <Input label={t('profile.firstName')} value={firstName} onChangeText={setFirstName} />
      <Input label={t('profile.city')} value={city} onChangeText={setCity} />
      <Input
        label={t('profile.bio')}
        value={bio}
        onChangeText={setBio}
        multiline
        numberOfLines={4}
      />

      <Text className="text-ink-700 font-semibold mb-2">{t('profile.interestedIn')}</Text>
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

      <Text className="text-ink-700 font-semibold mb-2">{t('profile.languages')}</Text>
      <View className="flex-row flex-wrap mb-4">
        {LANGS.map((l) => (
          <Chip key={l} label={l} selected={languages.includes(l)} onPress={() => toggleLang(l)} />
        ))}
      </View>

      <Button label={t('common.save')} onPress={save} loading={saving} fullWidth />
    </Screen>
  );
}
