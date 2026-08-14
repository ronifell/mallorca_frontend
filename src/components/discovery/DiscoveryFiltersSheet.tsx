import { useQueryClient } from '@tanstack/react-query';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { extractErrorMessage } from '../../api/client';
import { usersApi } from '../../api/endpoints';
import { InterestSelection, MyProfile, RelationshipGoal } from '../../api/types';
import { Button } from '../Button';
import { AgeRangePicker } from '../profile/AgeRangePicker';
import { InterestPill, InterestPillRow } from '../profile/InterestPill';
import { ProfileSectionLabel } from '../profile/ProfileSectionLabel';
import { RelationshipGoalChips } from '../profile/RelationshipGoalChips';
import { INTEREST_OPTIONS } from '../../config/profileOptions';
import { colors } from '../../theme/colors';

interface Props {
  visible: boolean;
  profile: MyProfile | undefined;
  onClose: () => void;
  onApplied?: () => void;
}

export function DiscoveryFiltersSheet({ visible, profile, onClose, onApplied }: Props) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();

  const [interests, setInterests] = useState<InterestSelection[]>([]);
  const [relationshipGoals, setRelationshipGoals] = useState<RelationshipGoal[]>([]);
  const [ageRange, setAgeRange] = useState({ min: 18, max: 99 });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!profile || !visible) return;
    setRelationshipGoals(profile.relationshipGoals ?? []);
    setAgeRange({ min: profile.minAge ?? 18, max: profile.maxAge ?? 99 });
    if (profile.interestSelections.length) {
      setInterests(profile.interestSelections);
    } else if (profile.interestedIn) {
      setInterests(profile.interestedIn === 'both' ? ['everyone'] : [profile.interestedIn]);
    } else {
      setInterests([]);
    }
    setError(null);
  }, [profile, visible]);

  const toggleInterest = (id: InterestSelection) =>
    setInterests((prev) => {
      if (id === 'everyone') {
        return prev.includes('everyone') ? [] : ['everyone'];
      }
      const without = prev.filter((x) => x !== 'everyone');
      return without.includes(id) ? without.filter((x) => x !== id) : [...without, id];
    });

  const apply = async () => {
    if (!interests.length) {
      setError(t('discovery.filtersInterestRequired'));
      return;
    }
    if (!relationshipGoals.length) {
      setError(t('profile.relationshipGoalRequired'));
      return;
    }
    if (ageRange.min > ageRange.max) {
      setError(t('profile.ageRangeInvalid'));
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await usersApi.update({
        interestSelections: interests,
        relationshipGoals,
        minAge: ageRange.min,
        maxAge: ageRange.max,
      });
      onApplied?.();
      onClose();
      void qc.invalidateQueries({ queryKey: ['me'] });
      void qc.invalidateQueries({ queryKey: ['feed'] });
    } catch (e) {
      setError(extractErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.root}>
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel={t('common.cancel')} />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <View style={styles.handle} />
          <Text style={styles.title}>{t('discovery.filters')}</Text>
          <Text style={styles.subtitle}>{t('discovery.filtersSubtitle')}</Text>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <ProfileSectionLabel label={t('discovery.filtersShowMe')} icon="people-outline" />
            <InterestPillRow>
              {INTEREST_OPTIONS.map((opt) => (
                <InterestPill
                  key={opt.id}
                  type={opt.id}
                  label={t(opt.labelKey)}
                  selected={interests.includes(opt.id)}
                  onPress={() => toggleInterest(opt.id)}
                />
              ))}
            </InterestPillRow>

            <ProfileSectionLabel label={t('profile.ageRange')} icon="calendar-outline" />
            <AgeRangePicker min={ageRange.min} max={ageRange.max} onChange={setAgeRange} />

            <ProfileSectionLabel label={t('profile.relationshipGoal')} icon="sparkles-outline" />
            <Text className="text-ink-400 text-xs mb-2">{t('profile.relationshipGoalHelper')}</Text>
            <RelationshipGoalChips value={relationshipGoals} onChange={setRelationshipGoals} />

            {error ? <Text style={styles.error}>{error}</Text> : null}
          </ScrollView>

          <View style={styles.actions}>
            <Button label={t('common.cancel')} variant="secondary" onPress={onClose} />
            <View style={{ width: 12 }} />
            <Button label={t('discovery.filtersApply')} onPress={apply} disabled={saving} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(26, 14, 7, 0.35)',
  },
  sheet: {
    backgroundColor: colors.cream[100],
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 10,
    maxHeight: '88%',
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.cream[400],
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.ink[700],
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: colors.ink[400],
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 16,
  },
  scroll: {
    flexGrow: 0,
  },
  scrollContent: {
    paddingBottom: 8,
  },
  error: {
    color: colors.coral[600],
    textAlign: 'center',
    marginTop: 8,
  },
  actions: {
    flexDirection: 'row',
    marginTop: 12,
  },
});
