import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usersApi } from '../api/endpoints';
import { AppLanguage, setLanguage } from '../i18n';
import { useAuthStore } from '../store/auth';
import { colors } from '../theme/colors';

const LANGUAGE_OPTIONS = [
  { id: 'en' as const, flag: '🇬🇧', code: 'EN', titleKey: 'englishTitle' },
  { id: 'es' as const, flag: '🇪🇸', code: 'ES', titleKey: 'spanishTitle' },
];

function getCurrentLanguage(language: string): AppLanguage {
  return language.startsWith('es') ? 'es' : 'en';
}

/** Compact language dropdown shown globally in the top-right corner. */
export function LanguageSwitcher() {
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const [open, setOpen] = useState(false);

  const current = getCurrentLanguage(i18n.language);
  const active = LANGUAGE_OPTIONS.find((option) => option.id === current) ?? LANGUAGE_OPTIONS[0];

  const choose = async (lang: AppLanguage) => {
    if (lang === current) {
      setOpen(false);
      return;
    }

    await setLanguage(lang);
    if (user) {
      usersApi.update({ appLanguage: lang }).catch(() => undefined);
      qc.invalidateQueries({ queryKey: ['me'] });
    }
    setOpen(false);
  };

  return (
    <>
      <View
        pointerEvents="box-none"
        style={[styles.anchor, { top: insets.top + 8, right: 16 }]}
      >
        <Pressable
          onPress={() => setOpen(true)}
          accessibilityRole="button"
          accessibilityLabel={t('settings.language')}
          style={styles.trigger}
        >
          <Text style={styles.flag}>{active.flag}</Text>
          <Text style={styles.code}>{active.code}</Text>
          <Ionicons name="chevron-down" size={14} color={colors.ink[400]} />
        </Pressable>
      </View>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <View style={styles.modalRoot}>
          <Pressable style={styles.backdrop} onPress={() => setOpen(false)} />
          <View style={[styles.menu, { top: insets.top + 48, right: 16 }]}>
            {LANGUAGE_OPTIONS.map((option, index) => {
              const selected = current === option.id;
              return (
                <Pressable
                  key={option.id}
                  onPress={() => choose(option.id)}
                  accessibilityRole="menuitem"
                  accessibilityState={{ selected }}
                  style={[styles.option, index < LANGUAGE_OPTIONS.length - 1 && styles.optionBorder]}
                >
                  <Text style={styles.optionFlag}>{option.flag}</Text>
                  <View style={styles.optionText}>
                    <Text style={styles.optionTitle}>{t(`settings.${option.titleKey}`)}</Text>
                    <Text style={styles.optionCode}>{option.code}</Text>
                  </View>
                  {selected ? (
                    <Ionicons name="checkmark" size={18} color={colors.coral[500]} />
                  ) : (
                    <View style={styles.optionSpacer} />
                  )}
                </Pressable>
              );
            })}
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  anchor: {
    position: 'absolute',
    zIndex: 1000,
    elevation: 1000,
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.cream[300],
    shadowColor: colors.ink[800],
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  flag: {
    fontSize: 15,
    lineHeight: 18,
  },
  code: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.ink[700],
    letterSpacing: 0.4,
  },
  modalRoot: {
    flex: 1,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(26, 14, 7, 0.18)',
  },
  menu: {
    position: 'absolute',
    zIndex: 1,
    minWidth: 168,
    borderRadius: 14,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.cream[300],
    overflow: 'hidden',
    shadowColor: colors.ink[800],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 6,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  optionBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.cream[300],
  },
  optionFlag: {
    fontSize: 18,
    lineHeight: 22,
  },
  optionText: {
    flex: 1,
    marginLeft: 10,
  },
  optionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.ink[700],
  },
  optionCode: {
    fontSize: 11,
    color: colors.ink[400],
    marginTop: 1,
  },
  optionSpacer: {
    width: 18,
  },
});
