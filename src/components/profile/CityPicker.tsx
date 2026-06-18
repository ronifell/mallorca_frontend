import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  CityOption,
  MALLORCA_MUNICIPALITIES,
  SPECIAL_CITY_OPTIONS,
  resolveCityLabel,
} from '../../config/cityOptions';
import { colors } from '../../theme/colors';

interface Props {
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
}

type Row =
  | { kind: 'header'; key: string; title: string }
  | { kind: 'option'; key: string; option: CityOption; label: string; selected: boolean };

/**
 * Dropdown-style picker that replaces the free-text "city" input. Tapping
 * the field opens a full-screen modal with a search input and a sectioned
 * list: every Mallorca municipality first, then the translated catch-all
 * options ("Visiting Mallorca", "Another city in Spain", etc.).
 *
 * The selected option's `value` is stored verbatim on `users.city`. For
 * Mallorca cities the value IS the display label; for the special options
 * it's a stable id resolved through i18n by `resolveCityLabel`.
 */
export function CityPicker({ value, onChange, placeholder }: Props) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const selectedLabel = resolveCityLabel(value, t) ?? '';

  const rows = useMemo<Row[]>(() => {
    const q = query.trim().toLocaleLowerCase();
    const matches = (opt: CityOption): boolean => {
      if (!q) return true;
      const label =
        opt.label ?? (opt.labelKey ? t(opt.labelKey) : opt.value);
      return label.toLocaleLowerCase().includes(q);
    };

    const out: Row[] = [];
    const mallorca = MALLORCA_MUNICIPALITIES.filter(matches);
    if (mallorca.length > 0) {
      out.push({
        kind: 'header',
        key: 'h-mallorca',
        title: t('profile.cityMallorcaSection'),
      });
      mallorca.forEach((opt) =>
        out.push({
          kind: 'option',
          key: `m-${opt.id}`,
          option: opt,
          label: opt.label ?? opt.value,
          selected: opt.value === value,
        }),
      );
    }

    const special = SPECIAL_CITY_OPTIONS.filter(matches);
    if (special.length > 0) {
      out.push({
        kind: 'header',
        key: 'h-other',
        title: t('profile.cityOtherSection'),
      });
      special.forEach((opt) =>
        out.push({
          kind: 'option',
          key: `s-${opt.id}`,
          option: opt,
          label: opt.labelKey ? t(opt.labelKey) : opt.value,
          selected: opt.value === value,
        }),
      );
    }

    return out;
  }, [query, t, value]);

  const closeModal = () => {
    setOpen(false);
    setQuery('');
  };

  const handleSelect = (next: string) => {
    onChange(next);
    closeModal();
  };

  return (
    <View className="w-full mb-4">
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={placeholder ?? t('profile.cityPlaceholder')}
        className="flex-row items-center bg-white rounded-2xl border border-cream-300 px-3 py-3.5"
        style={styles.fieldShadow}
      >
        <Ionicons
          name="location-outline"
          size={18}
          color={colors.coral[500]}
          style={{ marginRight: 8 }}
        />
        <Text
          className={`flex-1 text-base ${
            selectedLabel ? 'text-ink-700' : 'text-ink-400'
          }`}
          numberOfLines={1}
        >
          {selectedLabel || placeholder || t('profile.cityPlaceholder')}
        </Text>
        <Ionicons name="chevron-down" size={18} color={colors.ink[400]} />
      </Pressable>

      <Modal
        visible={open}
        animationType="slide"
        onRequestClose={closeModal}
        presentationStyle="pageSheet"
      >
        <SafeAreaView edges={['top', 'bottom']} style={styles.modalRoot}>
          <View style={styles.headerRow}>
            <Pressable
              onPress={closeModal}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel={t('common.cancel')}
              style={styles.headerCancel}
            >
              <Text style={styles.headerCancelText}>{t('common.cancel')}</Text>
            </Pressable>
            <Text style={styles.headerTitle}>{t('profile.cityPickerTitle')}</Text>
            <View style={styles.headerSpacer} />
          </View>

          <View style={styles.searchWrap}>
            <Ionicons
              name="search-outline"
              size={18}
              color={colors.ink[400]}
              style={{ marginRight: 8 }}
            />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder={t('profile.citySearchPlaceholder')}
              placeholderTextColor={colors.ink[400]}
              style={styles.searchInput}
              autoCorrect={false}
              autoCapitalize="none"
              underlineColorAndroid="transparent"
              includeFontPadding={false}
            />
            {query.length > 0 ? (
              <Pressable
                onPress={() => setQuery('')}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel={t('common.cancel')}
              >
                <Ionicons name="close-circle" size={18} color={colors.ink[400]} />
              </Pressable>
            ) : null}
          </View>

          <FlatList
            data={rows}
            keyExtractor={(row) => row.key}
            contentContainerStyle={styles.listContent}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={
              <View style={styles.emptyWrap}>
                <Text style={styles.emptyText}>{t('profile.cityNoResults')}</Text>
              </View>
            }
            renderItem={({ item }) => {
              if (item.kind === 'header') {
                return <Text style={styles.sectionHeader}>{item.title}</Text>;
              }
              return (
                <Pressable
                  onPress={() => handleSelect(item.option.value)}
                  accessibilityRole="button"
                  accessibilityLabel={item.label}
                  accessibilityState={{ selected: item.selected }}
                  style={({ pressed }) => [
                    styles.optionRow,
                    item.selected && styles.optionRowSelected,
                    pressed && styles.optionRowPressed,
                  ]}
                >
                  <Text
                    style={[
                      styles.optionLabel,
                      item.selected && styles.optionLabelSelected,
                    ]}
                  >
                    {item.label}
                  </Text>
                  {item.selected ? (
                    <Ionicons
                      name="checkmark-circle"
                      size={20}
                      color={colors.coral[500]}
                    />
                  ) : null}
                </Pressable>
              );
            }}
          />
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  fieldShadow: {
    shadowColor: '#3D2618',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
  },
  modalRoot: {
    flex: 1,
    backgroundColor: colors.cream[50],
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  headerCancel: {
    minWidth: 64,
  },
  headerCancelText: {
    color: colors.coral[500],
    fontSize: 15,
    fontWeight: '600',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '700',
    color: colors.ink[700],
  },
  headerSpacer: {
    minWidth: 64,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 4,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.cream[300],
  },
  searchInput: {
    flex: 1,
    color: colors.ink[700],
    fontSize: 15,
    padding: 0,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.ink[400],
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginTop: 16,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 13,
    backgroundColor: colors.white,
    borderRadius: 14,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: colors.cream[300],
  },
  optionRowSelected: {
    borderColor: colors.coral[500],
    backgroundColor: colors.coral[50],
  },
  optionRowPressed: {
    opacity: 0.7,
  },
  optionLabel: {
    color: colors.ink[700],
    fontSize: 15,
    fontWeight: '500',
  },
  optionLabelSelected: {
    color: colors.coral[600],
    fontWeight: '700',
  },
  emptyWrap: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyText: {
    color: colors.ink[400],
    fontSize: 14,
  },
});
