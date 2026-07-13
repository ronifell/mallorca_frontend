import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../../theme/colors';

interface Props {
  onReport: () => void;
  onBlock: () => void;
  onUnmatch?: () => void;
}

/**
 * Bottom-of-profile safety actions (Report, Block, Unmatch). Rendered inline
 * at the very end of the profile scroll view instead of over the photo hero
 * — that way tapping the kebab no longer conflicts with the swipe-between-
 * photos gesture. Presented as a list of large-tap rows so they are easy to
 * reach and hard to hit by accident.
 */
export function ProfileSafetyActions({ onReport, onBlock, onUnmatch }: Props) {
  const { t } = useTranslation();

  return (
    <View className="mx-5 mb-6">
      <Text className="text-ink-400 text-xs font-semibold uppercase tracking-wider mb-2 ml-1">
        {t('profile.safetyTitle')}
      </Text>
      <View
        style={styles.card}
      >
        <SafetyRow
          icon="flag-outline"
          iconColor={colors.coral[600]}
          label={t('profile.reportUser')}
          hint={t('profile.reportUserHint')}
          onPress={onReport}
        />
        <View style={styles.divider} />
        <SafetyRow
          icon="ban-outline"
          iconColor={colors.ink[700]}
          label={t('profile.blockUser')}
          hint={t('profile.blockUserHint')}
          onPress={onBlock}
        />
        {onUnmatch ? (
          <>
            <View style={styles.divider} />
            <SafetyRow
              icon="heart-dislike-outline"
              iconColor={colors.ink[700]}
              label={t('matches.unmatch')}
              hint={t('profile.unmatchHint')}
              onPress={onUnmatch}
            />
          </>
        ) : null}
      </View>
    </View>
  );
}

function SafetyRow({
  icon,
  iconColor,
  label,
  hint,
  onPress,
}: {
  icon: keyof typeof import('@expo/vector-icons').Ionicons.glyphMap;
  iconColor: string;
  label: string;
  hint?: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      android_ripple={{ color: colors.cream[200] }}
      style={styles.row}
    >
      <View style={[styles.iconWrap, { backgroundColor: `${iconColor}14` }]}>
        <Ionicons name={icon} size={18} color={iconColor} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowLabel}>{label}</Text>
        {hint ? <Text style={styles.rowHint}>{hint}</Text> : null}
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.ink[400]} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.cream[300],
    overflow: 'hidden',
    shadowColor: '#3D2618',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rowLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.ink[700],
  },
  rowHint: {
    marginTop: 2,
    fontSize: 12,
    color: colors.ink[400],
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.cream[300],
    marginLeft: 62,
  },
});
