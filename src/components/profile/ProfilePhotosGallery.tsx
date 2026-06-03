import React from 'react';
import { useTranslation } from 'react-i18next';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';
import { Photo } from '../../api/types';
import { resolveMediaUrl } from '../../utils/mediaUrl';

interface Props {
  photos: Photo[];
  onEdit: () => void;
}

export function ProfilePhotosGallery({ photos, onEdit }: Props) {
  const { t } = useTranslation();

  if (!photos.length) return null;

  return (
    <View className="mb-6">
      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-ink-700 text-lg font-bold">{t('profile.myPhotos')}</Text>
        <Pressable onPress={onEdit}>
          <Text className="text-coral-500 font-semibold text-sm">{t('common.edit')}</Text>
        </Pressable>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-1">
        {photos.map((photo) => (
          <Image
            key={photo.id}
            source={{ uri: resolveMediaUrl(photo.url) }}
            className="w-24 h-28 rounded-2xl mr-3 bg-cream-200"
            resizeMode="cover"
          />
        ))}
      </ScrollView>
    </View>
  );
}
