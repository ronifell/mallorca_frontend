import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';

export type DiscoveryMode = 'discover' | 'likedYou';

interface Props {
  mode: DiscoveryMode;
  onChange: (mode: DiscoveryMode) => void;
  showLikedYouBadge?: boolean;
}

export function DiscoveryModeToggle({ mode, onChange, showLikedYouBadge = true }: Props) {
  const { t } = useTranslation();

  return (
    <View className="mx-5 mb-4 p-1 bg-white rounded-pill flex-row border border-cream-300">
      <Pressable
        onPress={() => onChange('discover')}
        className={`flex-1 flex-row items-center justify-center py-2.5 rounded-pill ${
          mode === 'discover' ? 'bg-coral-500' : ''
        }`}
      >
        <Ionicons
          name="heart-outline"
          size={16}
          color={mode === 'discover' ? '#FFFFFF' : '#7A5640'}
          style={{ marginRight: 6 }}
        />
        <Text
          className={`font-semibold text-sm ${mode === 'discover' ? 'text-white' : 'text-ink-400'}`}
        >
          {t('nav.discover')}
        </Text>
      </Pressable>

      <Pressable
        onPress={() => onChange('likedYou')}
        className="flex-1 flex-row items-center justify-center py-2.5 rounded-pill relative"
      >
        <Text
          className={`font-semibold text-sm ${mode === 'likedYou' ? 'text-coral-500' : 'text-ink-400'}`}
        >
          {t('discovery.likedYou')}
        </Text>
        {showLikedYouBadge ? (
          <View className="absolute top-2 right-4 w-2 h-2 rounded-full bg-coral-500" />
        ) : null}
      </Pressable>
    </View>
  );
}
