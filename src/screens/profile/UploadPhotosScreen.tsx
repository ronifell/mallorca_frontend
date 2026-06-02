import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Image, Pressable, Text, View } from 'react-native';
import { extractErrorMessage } from '../../api/client';
import { usersApi } from '../../api/endpoints';
import { Button } from '../../components/Button';
import { Screen } from '../../components/Screen';
import { ProfileSetupStackParamList } from '../../navigation/types';
import { useAuthStore } from '../../store/auth';
import { Photo } from '../../api/types';

type Props = NativeStackScreenProps<ProfileSetupStackParamList, 'UploadPhotos'>;
const MAX_PHOTOS = 6;

export function UploadPhotosScreen({}: Props) {
  const { t } = useTranslation();
  const setProfileComplete = useAuthStore((s) => s.setProfileComplete);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    usersApi.me().then((me) => setPhotos(me.photos)).catch(() => undefined);
  }, []);

  const pick = async () => {
    if (photos.length >= MAX_PHOTOS) return;
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission needed', 'Photo library access is required.');
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
      allowsEditing: true,
      aspect: [3, 4],
    });
    if (res.canceled || !res.assets[0]) return;

    setUploading(true);
    try {
      const uploaded = await usersApi.uploadPhoto(res.assets[0].uri);
      setPhotos((prev) => [...prev, uploaded]);
    } catch (e) {
      Alert.alert(t('common.error'), extractErrorMessage(e));
    } finally {
      setUploading(false);
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

  const finish = () => {
    if (!photos.length) {
      Alert.alert(t('common.error'), t('profile.photosHint'));
      return;
    }
    // Update the auth store; RootNavigator will switch to the Main stack.
    setProfileComplete(true);
  };

  return (
    <Screen scroll>
      <Text className="text-ink-700 font-serif text-2xl mb-1">{t('profile.photos')}</Text>
      <Text className="text-ink-400 mb-5">{t('profile.photosHint')}</Text>

      <View className="flex-row flex-wrap -m-1">
        {Array.from({ length: MAX_PHOTOS }).map((_, i) => {
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
                  {i === 0 ? (
                    <View className="absolute bottom-1 left-1 bg-ink-700 px-2 py-0.5 rounded">
                      <Text className="text-white text-xs font-semibold">★</Text>
                    </View>
                  ) : null}
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

      <View className="h-6" />
      <Button
        label={uploading ? '…' : t('profile.addPhoto')}
        variant="secondary"
        onPress={pick}
        disabled={uploading || photos.length >= MAX_PHOTOS}
        fullWidth
      />
      <View className="h-3" />
      <Button label={t('common.continue')} onPress={finish} fullWidth />
    </Screen>
  );
}
