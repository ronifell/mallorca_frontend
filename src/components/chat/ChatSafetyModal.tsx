import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { colors } from '../../theme/colors';

interface Props {
  visible: boolean;
  otherName: string | null;
  onClose: () => void;
  onReport: () => void;
  onBlock: () => void;
  onUnmatch: () => void;
}

export function ChatSafetyModal({
  visible,
  otherName,
  onClose,
  onReport,
  onBlock,
  onUnmatch,
}: Props) {
  const { t } = useTranslation();

  const runAction = (action: () => void) => {
    onClose();
    setTimeout(action, 0);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.card} onStartShouldSetResponder={() => true}>
          <View style={styles.header}>
            <Text style={styles.title}>{t('chat.safety')}</Text>
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel={t('common.cancel')}
              hitSlop={8}
              style={styles.closeBtn}
            >
              <Ionicons name="close" size={22} color={colors.ink[700]} />
            </Pressable>
          </View>

          {otherName ? (
            <Text style={styles.subtitle}>{otherName}</Text>
          ) : null}

          <View style={styles.actions}>
            <Pressable
              onPress={() => runAction(onReport)}
              accessibilityRole="button"
              style={styles.actionBtn}
            >
              <Text style={styles.actionText}>{t('profile.reportUser')}</Text>
            </Pressable>
            <Pressable
              onPress={() => runAction(onBlock)}
              accessibilityRole="button"
              style={styles.actionBtn}
            >
              <Text style={[styles.actionText, styles.destructiveText]}>
                {t('profile.blockUser')}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => runAction(onUnmatch)}
              accessibilityRole="button"
              style={styles.actionBtn}
            >
              <Text style={[styles.actionText, styles.destructiveText]}>
                {t('matches.unmatch')}
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: colors.white,
    borderRadius: 4,
    paddingTop: 20,
    paddingBottom: 8,
    paddingHorizontal: 20,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  title: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    color: colors.ink[800],
  },
  closeBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: -4,
  },
  subtitle: {
    fontSize: 15,
    color: colors.ink[500],
    marginBottom: 16,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    gap: 4,
  },
  actionBtn: {
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.4,
    color: colors.coral[600],
    textTransform: 'uppercase',
  },
  destructiveText: {
    color: colors.coral[600],
  },
});
