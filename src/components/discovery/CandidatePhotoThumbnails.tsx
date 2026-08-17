import React from 'react';
import { Image, Pressable, View } from 'react-native';
import { colors } from '../../theme/colors';
import { profileContentWidth } from '../../constants/profileLayout';

interface Props {
  photoUris: string[];
  activeIndex: number;
  onSelect: (index: number) => void;
}

const GAP = 8;
const MAX_VISIBLE = 6;
const MAX_THUMB_SIZE = 44;
const USABLE_WIDTH = profileContentWidth();

/**
 * Horizontal strip of small photo thumbnails. The strip is centred and each
 * thumbnail is capped at {@link MAX_THUMB_SIZE} so the row stays compact even
 * on wide screens. The active photo is outlined in coral.
 */
export function CandidatePhotoThumbnails({
  photoUris,
  activeIndex,
  onSelect,
}: Props) {
  if (photoUris.length === 0) return null;

  const usable = USABLE_WIDTH;
  const visible = Math.min(photoUris.length, MAX_VISIBLE);
  const computed = Math.floor((usable - GAP * (visible - 1)) / visible);
  const size = Math.min(computed, MAX_THUMB_SIZE);

  return (
    <View className="flex-row justify-center mb-4">
      {photoUris.map((uri, index) => {
        const isActive = index === activeIndex;
        return (
          <Pressable
            key={`${uri}-${index}`}
            onPress={() => onSelect(index)}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
            style={{
              width: size,
              height: size,
              marginRight: index === photoUris.length - 1 ? 0 : GAP,
              borderRadius: 12,
              padding: isActive ? 2 : 0,
              borderWidth: isActive ? 2 : 0,
              borderColor: isActive ? colors.coral[500] : 'transparent',
              backgroundColor: 'transparent',
            }}
          >
            <Image
              source={{ uri }}
              style={{
                flex: 1,
                borderRadius: isActive ? 8 : 10,
                backgroundColor: colors.cream[300],
              }}
              resizeMode="cover"
            />
          </Pressable>
        );
      })}
    </View>
  );
}
