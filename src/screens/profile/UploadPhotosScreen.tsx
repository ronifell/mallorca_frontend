import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Text, View } from 'react-native';
import { extractErrorMessage } from '../../api/client';
import { usersApi } from '../../api/endpoints';
import { Photo } from '../../api/types';
import { AddPhotoButton, PhotoUploadGrid } from '../../components/profile/PhotoUploadGrid';
import { ProfileContinueButton } from '../../components/profile/ProfileContinueButton';
import { ProfilePhotosHeader } from '../../components/profile/ProfilePhotosHeader';
import { ProfileSetupShell } from '../../components/profile/ProfileSetupShell';
import { ProfileSetupStackParamList } from '../../navigation/types';
import { useAuthStore } from '../../store/auth';

type Props = NativeStackScreenProps<ProfileSetupStackParamList, 'UploadPhotos'>;
const MAX_PHOTOS = 6;

export function UploadPhotosScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const setProfileComplete = useAuthStore((s) => s.setProfileComplete);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [profileReady, setProfileReady] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    usersApi
      .me()
      .then((me) => {
        if (!cancelled) setPhotos(me.photos);
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setProfileReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const pick = async () => {
    if (!profileReady || uploading || photos.length >= MAX_PHOTOS) return;
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(t('profile.photoPermissionTitle'), t('profile.photoPermissionMessage'));
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
    setError(null);
    try {
      const uploaded = await usersApi.uploadPhoto(res.assets[0]);
      setPhotos((prev) => [...prev, uploaded]);
    } catch (e) {
      setError(extractErrorMessage(e));
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
      setError(t('profile.photosRequired'));
      return;
    }
    setProfileComplete(true);
  };

  return (
    <ProfileSetupShell currentStep={2} onBack={() => navigation.goBack()}>
      <ProfilePhotosHeader />

      <PhotoUploadGrid photos={photos} maxPhotos={MAX_PHOTOS} onPick={pick} onRemove={remove} />

      <AddPhotoButton
        label={uploading ? t('common.loading') : t('profile.addPhoto')}
        onPress={pick}
        disabled={!profileReady || uploading || photos.length >= MAX_PHOTOS}
      />

      {error ? (
        <View className="bg-coral-50 rounded-2xl p-3 mb-4">
          <Text className="text-coral-600 text-center">{error}</Text>
        </View>
      ) : null}

      <ProfileContinueButton
        label={t('common.continue')}
        onPress={finish}
        loading={uploading}
      />
    </ProfileSetupShell>
  );
}
