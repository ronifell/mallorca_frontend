import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';
import { colors } from '../../theme/colors';

interface Props {
  onReport: () => void;
  onBlock: () => void;
  onUnmatch?: () => void;
}

export function ProfileSafetySection({ onReport, onBlock, onUnmatch }: Props) {
  const { t } = useTranslation();

  return (
    <View
      className="mx-5 mb-6 rounded-2xl bg-white overflow-hidden border border-cream-300"
      style={{
        shadowColor: '#3D2618',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
        elevation: 3,
      }}
    >
      <View className="flex-row items-center px-4 pt-4 pb-2">
        <View
          className="w-10 h-10 rounded-full items-center justify-center mr-3"
          style={{ backgroundColor: colors.coral[50] }}
        >
          <Ionicons name="shield-checkmark" size={22} color={colors.coral[600]} />
        </View>
        <View className="flex-1">
          <Text className="text-ink-700 text-base font-bold">{t('profile.safetyTitle')}</Text>
          <Text className="text-ink-400 text-sm mt-0.5 leading-5">{t('profile.safetyDesc')}</Text>
        </View>
      </View>

      <View className="px-4 pb-4 pt-2 gap-2.5">
        <Pressable
          onPress={onReport}
          accessibilityRole="button"
          accessibilityLabel={t('profile.reportUser')}
          className="flex-row items-center rounded-xl px-4 py-3.5 border-2 active:opacity-80"
          style={{
            borderColor: colors.coral[500],
            backgroundColor: colors.coral[50],
          }}
        >
          <View
            className="w-9 h-9 rounded-full items-center justify-center mr-3"
            style={{ backgroundColor: colors.white }}
          >
            <Ionicons name="flag" size={18} color={colors.coral[600]} />
          </View>
          <View className="flex-1">
            <Text className="text-coral-600 font-bold text-base">{t('profile.reportUser')}</Text>
            <Text className="text-ink-400 text-xs mt-0.5">{t('profile.reportUserHint')}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.coral[500]} />
        </Pressable>

        <Pressable
          onPress={onBlock}
          accessibilityRole="button"
          accessibilityLabel={t('profile.blockUser')}
          className="flex-row items-center rounded-xl px-4 py-3.5 border active:opacity-80"
          style={{
            borderColor: colors.cream[400],
            backgroundColor: colors.cream[50],
          }}
        >
          <View
            className="w-9 h-9 rounded-full items-center justify-center mr-3"
            style={{ backgroundColor: colors.white }}
          >
            <Ionicons name="ban" size={18} color={colors.ink[600]} />
          </View>
          <View className="flex-1">
            <Text className="text-ink-700 font-bold text-base">{t('profile.blockUser')}</Text>
            <Text className="text-ink-400 text-xs mt-0.5">{t('profile.blockUserHint')}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.ink[400]} />
        </Pressable>

        {onUnmatch ? (
          <Pressable
            onPress={onUnmatch}
            accessibilityRole="button"
            accessibilityLabel={t('matches.unmatch')}
            className="flex-row items-center rounded-xl px-4 py-3.5 border active:opacity-80"
            style={{
              borderColor: colors.cream[400],
              backgroundColor: colors.white,
            }}
          >
            <View
              className="w-9 h-9 rounded-full items-center justify-center mr-3"
              style={{ backgroundColor: colors.cream[100] }}
            >
              <Ionicons name="heart-dislike-outline" size={18} color={colors.ink[600]} />
            </View>
            <View className="flex-1">
              <Text className="text-ink-700 font-bold text-base">{t('matches.unmatch')}</Text>
              <Text className="text-ink-400 text-xs mt-0.5">{t('profile.unmatchHint')}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.ink[400]} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}
