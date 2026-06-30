import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { extractErrorMessage } from '../../api/client';
import { moderationApi } from '../../api/endpoints';
import { useContentFilter } from '../../hooks/useContentFilter';
import { useFilteredText } from '../../hooks/useFilteredText';
import { colors } from '../../theme/colors';

const REASONS = [
  { id: 'fake_profile', icon: 'person-circle-outline' as const },
  { id: 'harassment', icon: 'warning-outline' as const },
  { id: 'inappropriate_content', icon: 'eye-off-outline' as const },
  { id: 'spam', icon: 'megaphone-outline' as const },
  { id: 'other', icon: 'ellipsis-horizontal-circle-outline' as const },
] as const;

type Reason = (typeof REASONS)[number]['id'];

interface Props {
  visible: boolean;
  userId: string;
  onClose: () => void;
  onReported?: () => void;
}

export function ReportUserSheet({ visible, userId, onClose, onReported }: Props) {
  const { t } = useTranslation();
  const { check: checkContent } = useContentFilter();
  const { value: details, onChangeText: setDetails, setValue: resetDetails, filterError } =
    useFilteredText('', 'chat');
  const [reason, setReason] = useState<Reason | null>(null);
  const [busy, setBusy] = useState(false);

  const reset = () => {
    setReason(null);
    resetDetails('');
    setBusy(false);
  };

  const handleClose = () => {
    if (busy) return;
    reset();
    onClose();
  };

  const handleSubmit = async () => {
    if (!reason || busy) return;
    const trimmed = details.trim();
    const blocked = trimmed ? checkContent(trimmed, 'chat') : null;
    if (blocked) {
      Alert.alert(t('contentFilter.blockedTitle'), blocked);
      return;
    }
    setBusy(true);
    try {
      await moderationApi.report(userId, reason, details.trim() || undefined);
      reset();
      onClose();
      Alert.alert(t('moderation.report'), t('moderation.reported'));
      onReported?.();
    } catch (e) {
      Alert.alert(t('common.error'), extractErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Pressable
            onPress={handleClose}
            disabled={busy}
            accessibilityRole="button"
            accessibilityLabel={t('common.cancel')}
            hitSlop={8}
          >
            <Ionicons name="close" size={26} color={colors.ink[700]} />
          </Pressable>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>{t('moderation.reportTitle')}</Text>
            <Text style={styles.headerSubtitle}>{t('moderation.reportSubtitle')}</Text>
          </View>
          <View style={{ width: 26 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.body}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.introBanner}>
            <Ionicons name="shield-checkmark" size={28} color={colors.coral[600]} />
            <Text style={styles.introText}>{t('profile.safetyDesc')}</Text>
          </View>

          <Text style={styles.sectionLabel}>{t('moderation.selectReason')}</Text>

          {REASONS.map((item) => {
            const selected = reason === item.id;
            return (
              <Pressable
                key={item.id}
                onPress={() => setReason(item.id)}
                disabled={busy}
                style={[styles.reasonRow, selected && styles.reasonRowSelected]}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
              >
                <View
                  style={[
                    styles.reasonIconWrap,
                    selected && styles.reasonIconWrapSelected,
                  ]}
                >
                  <Ionicons
                    name={item.icon}
                    size={22}
                    color={selected ? colors.coral[600] : colors.ink[400]}
                  />
                </View>
                <Text style={[styles.reasonText, selected && styles.reasonTextSelected]}>
                  {t(`moderation.reason_${item.id}`)}
                </Text>
                {selected ? (
                  <Ionicons name="checkmark-circle" size={24} color={colors.coral[500]} />
                ) : (
                  <View style={styles.reasonDot} />
                )}
              </Pressable>
            );
          })}

          <Text style={styles.sectionLabel}>{t('moderation.detailsPlaceholder')}</Text>
          <TextInput
            value={details}
            onChangeText={setDetails}
            placeholder={t('moderation.detailsPlaceholder')}
            placeholderTextColor={colors.ink[400]}
            style={[styles.detailsInput, filterError ? styles.detailsInputBlocked : null]}
            multiline
            maxLength={1000}
            editable={!busy}
          />
          {filterError ? <Text style={styles.filterError}>{filterError}</Text> : null}
        </ScrollView>

        <View style={styles.footer}>
          <Pressable
            onPress={handleSubmit}
            disabled={!reason || busy}
            style={[styles.submitBtn, (!reason || busy) && styles.submitBtnDisabled]}
            accessibilityRole="button"
            accessibilityLabel={t('moderation.send')}
          >
            {busy ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <>
                <Ionicons name="flag" size={18} color={colors.white} style={{ marginRight: 8 }} />
                <Text style={styles.submitText}>{t('moderation.send')}</Text>
              </>
            )}
          </Pressable>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.cream[100],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.cream[300],
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.ink[700],
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 13,
    color: colors.ink[400],
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
  },
  body: {
    padding: 20,
    paddingBottom: 32,
  },
  introBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.coral[50],
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.coral[100],
    padding: 14,
    marginBottom: 20,
    gap: 12,
  },
  introText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: colors.ink[600],
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.ink[400],
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 10,
  },
  reasonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.cream[300],
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 10,
  },
  reasonRowSelected: {
    borderColor: colors.coral[500],
    backgroundColor: colors.coral[50],
  },
  reasonIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.cream[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  reasonIconWrapSelected: {
    backgroundColor: colors.white,
  },
  reasonText: {
    fontSize: 16,
    color: colors.ink[700],
    flex: 1,
    marginRight: 8,
    fontWeight: '500',
  },
  reasonTextSelected: {
    fontWeight: '700',
    color: colors.coral[600],
  },
  reasonDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.cream[400],
  },
  detailsInput: {
    backgroundColor: colors.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.cream[300],
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.ink[700],
    minHeight: 100,
    textAlignVertical: 'top',
  },
  detailsInputBlocked: {
    borderColor: colors.coral[500],
  },
  filterError: {
    color: colors.coral[600],
    fontSize: 12,
    marginTop: 6,
    marginLeft: 4,
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.cream[300],
  },
  submitBtn: {
    flexDirection: 'row',
    backgroundColor: colors.coral[500],
    borderRadius: 16,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnDisabled: {
    opacity: 0.45,
  },
  submitText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
});
