import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import { Photo } from '../../api/types';
import { colors } from '../../theme/colors';
import { resolveMediaUrl } from '../../utils/mediaUrl';

interface Props {
  photos: Photo[];
  maxPhotos?: number;
  onPick: () => void;
  onRemove: (id: string) => void;
}

export function PhotoUploadGrid({ photos, maxPhotos = 6, onPick, onRemove }: Props) {
  return (
    <View className="flex-row flex-wrap -m-1.5 mb-5">
      {Array.from({ length: maxPhotos }).map((_, i) => {
        const photo = photos[i];

        return (
          <View key={photo?.id ?? `slot-${i}`} className="w-1/3 p-1.5 aspect-[3/4]">
            {photo ? (
              <View
                className="rounded-2xl overflow-hidden bg-white w-full h-full"
                style={{ borderWidth: 1.5, borderColor: colors.coral[400] }}
              >
                <Image
                  source={{ uri: resolveMediaUrl(photo.url) }}
                  className="w-full h-full"
                  resizeMode="cover"
                />
                <Pressable
                  onPress={() => onRemove(photo.id)}
                  className="absolute top-1.5 right-1.5 bg-coral-500 rounded-full w-7 h-7 items-center justify-center"
                >
                  <Text className="text-white font-bold text-base leading-none">×</Text>
                </Pressable>
                {i === 0 ? (
                  <View className="absolute bottom-1.5 left-1.5 bg-ink-700 px-2 py-0.5 rounded-md">
                    <Text className="text-white text-xs font-semibold">★</Text>
                  </View>
                ) : null}
              </View>
            ) : (
              <Pressable
                onPress={onPick}
                className="rounded-2xl bg-white w-full h-full items-center justify-center"
                style={{
                  borderWidth: 2,
                  borderStyle: 'dashed',
                  borderColor: colors.coral[400],
                }}
              >
                <View
                  className="w-11 h-11 rounded-full items-center justify-center"
                  style={{ backgroundColor: colors.coral[50] }}
                >
                  <Text className="text-coral-500 text-2xl font-light leading-none">+</Text>
                </View>
              </Pressable>
            )}
          </View>
        );
      })}
    </View>
  );
}

interface AddPhotoButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}

export function AddPhotoButton({ label, onPress, disabled }: AddPhotoButtonProps) {
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      className={`flex-row items-center justify-center bg-white rounded-2xl py-3.5 border border-cream-300 mb-4 ${
        disabled ? 'opacity-50' : ''
      }`}
      style={{
        shadowColor: '#3D2618',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 2,
      }}
    >
      <Ionicons name="image-outline" size={22} color={colors.coral[500]} />
      <Text className="text-ink-700 font-semibold text-base ml-2">{label}</Text>
    </Pressable>
  );
}
