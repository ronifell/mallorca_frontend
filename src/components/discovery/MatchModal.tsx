import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../../theme/colors';
import { Button } from '../Button';

interface Props {
  visible: boolean;
  name: string | null;
  onSayHi: () => void;
  onClose: () => void;
}

/**
 * Full-screen, centered "It's a match!" modal. Uses RN's Modal so the dim
 * backdrop reliably covers the entire screen instead of collapsing to its
 * content size when nested inside flex parents.
 */
export function MatchModal({ visible, name, onSayHi, onClose }: Props) {
  const { t } = useTranslation();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.root}>
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel={t('discovery.keepSwiping')} />

        <View style={styles.card}>
          <View style={styles.heartHalo}>
            <View style={styles.heartCircle}>
              <Ionicons name="heart" size={36} color={colors.white} />
            </View>
          </View>

          <Text style={styles.title}>{t('discovery.matched')}</Text>
          {name ? <Text style={styles.subtitle}>{t('discovery.matchSubtitle', { name })}</Text> : null}

          <View style={styles.actions}>
            <Button
              label={t('discovery.sayHi')}
              onPress={onSayHi}
              fullWidth
              className="bg-coral-500 active:bg-coral-600"
            />
            <View style={styles.spacer} />
            <Button label={t('discovery.keepSwiping')} variant="ghost" onPress={onClose} fullWidth />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(26, 14, 7, 0.55)',
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: colors.cream[50],
    borderRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 20,
    alignItems: 'center',
    shadowColor: colors.ink[900],
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 12,
  },
  heartHalo: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.coral[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  heartCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.coral[500],
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.coral[500],
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  title: {
    fontFamily: 'NotoSerif_700Bold',
    fontSize: 28,
    lineHeight: 34,
    color: colors.ink[700],
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.ink[400],
    textAlign: 'center',
    marginBottom: 24,
  },
  actions: {
    width: '100%',
    marginTop: 4,
  },
  spacer: {
    height: 8,
  },
});
