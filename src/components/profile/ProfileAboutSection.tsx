import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';

interface Props {
  bio: string | null;
}

const PREVIEW_LENGTH = 120;

export function ProfileAboutSection({ bio }: Props) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);

  if (!bio) return null;

  const canExpand = bio.length > PREVIEW_LENGTH;
  const displayText =
    canExpand && !expanded ? `${bio.slice(0, PREVIEW_LENGTH).trim()}…` : bio;

  return (
    <View className="mb-6">
      <Text className="text-ink-700 text-lg font-bold mb-2">{t('profile.aboutMe')}</Text>
      <Text className="text-ink-400 text-sm leading-6">{displayText}</Text>
      {canExpand ? (
        <Pressable onPress={() => setExpanded((v) => !v)} className="self-end mt-3">
          <View className="bg-coral-50 rounded-pill px-3 py-1.5">
            <Text className="text-coral-500 text-xs font-semibold">
              {expanded ? t('profile.viewLess') : t('profile.viewMore')}
            </Text>
          </View>
        </Pressable>
      ) : null}
    </View>
  );
}
