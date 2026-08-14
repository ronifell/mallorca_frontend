import React from 'react';
import { Image, Text, View } from 'react-native';
import { FeedCandidate } from '../../api/types';
import { resolveMediaUrl } from '../../utils/mediaUrl';

/** Photo-only under-card preview — no name, info button, or gestures. */
export function DiscoveryCardPhotoPreview({ candidate }: { candidate: FeedCandidate }) {
  const photo = resolveMediaUrl(candidate.photos[0]?.url);

  return (
    <View className="w-full aspect-[3/4] rounded-3xl overflow-hidden bg-cream-300">
      {photo ? (
        <Image
          key={candidate.id}
          source={{ uri: photo }}
          className="w-full h-full"
          resizeMode="cover"
        />
      ) : (
        <View className="flex-1 items-center justify-center">
          <Text className="text-5xl text-coral-500">♥</Text>
        </View>
      )}
    </View>
  );
}
