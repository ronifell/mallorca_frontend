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
 * Discreet Block / Report actions at the bottom of a profile. Small light-gray
 * pills so they stay out of the way of discovery content and photo gestures.
 */
export function ProfileSafetyActions({ onReport, onBlock, onUnmatch }: Props) {
  const { t } = useTranslation();

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <QuietButton label={t('profile.block')} onPress={onBlock} />
        <QuietButton label={t('profile.report')} onPress={onReport} />
      </View>
      {onUnmatch ? (
        <Pressable
          onPress={onUnmatch}
          accessibilityRole="button"
          accessibilityLabel={t('matches.unmatch')}
          hitSlop={8}
          style={styles.unmatchHit}
        >
          <Text style={styles.unmatchLabel}>{t('matches.unmatch')}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function QuietButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      android_ripple={{ color: 'rgba(0,0,0,0.06)' }}
      style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
    >
      <Text style={styles.buttonLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 8,
    marginBottom: 28,
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  button: {
    minWidth: 104,
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#EEEEEE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPressed: {
    backgroundColor: '#E2E2E2',
  },
  buttonLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#111111',
    letterSpacing: 0.1,
  },
  unmatchHit: {
    marginTop: 14,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  unmatchLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.ink[400],
    textDecorationLine: 'underline',
  },
});
