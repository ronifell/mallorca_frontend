import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  ImageBackground,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LEGAL_LINKS } from '../../config/legal';
import { SettingsMenuRow } from '../../components/settings/SettingsMenuRow';
import { useTopScreenPadding } from '../../hooks/useTopScreenPadding';
import { colors } from '../../theme/colors';

const settingsBackground = require('../../../assets/main1.png');

export function LegalScreen() {
  const { t } = useTranslation();
  const nav = useNavigation();
  const topPadding = useTopScreenPadding();

  const open = (url: string) => {
    Linking.openURL(url).catch(() => undefined);
  };

  return (
    <View style={styles.root}>
      <ImageBackground
        source={settingsBackground}
        resizeMode="cover"
        style={StyleSheet.absoluteFillObject}
        imageStyle={styles.backgroundImage}
      />

      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <View className="px-5" style={{ paddingTop: topPadding }}>
          <Pressable
            onPress={() => nav.goBack()}
            className="w-10 h-10 rounded-full bg-white items-center justify-center border border-cream-300 mb-5"
            style={styles.backButton}
            accessibilityRole="button"
            accessibilityLabel={t('common.back')}
          >
            <Ionicons name="chevron-back" size={22} color={colors.ink[700]} />
          </Pressable>

          <Text className="text-ink-700 text-3xl font-bold">{t('settings.legal')}</Text>
          <Text className="text-ink-400 text-sm mt-2 leading-5 max-w-[320px]">
            {t('settings.legalPageSubtitle')}
          </Text>
        </View>

        <View className="px-5 mt-8">
          <View className="bg-white rounded-2xl overflow-hidden" style={cardShadow}>
            <SettingsMenuRow
              icon="shield-checkmark-outline"
              title={t('settings.privacyPolicyTitle')}
              description={t('settings.privacyPolicyDesc')}
              onPress={() => open(LEGAL_LINKS.privacy)}
              showDivider
              trailing={<Ionicons name="open-outline" size={20} color={colors.ink[400]} />}
            />
            <SettingsMenuRow
              icon="document-text-outline"
              title={t('settings.termsTitle')}
              description={t('settings.termsDesc')}
              onPress={() => open(LEGAL_LINKS.terms)}
              showDivider={false}
              trailing={<Ionicons name="open-outline" size={20} color={colors.ink[400]} />}
            />
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.cream[50] },
  backgroundImage: { width: '100%', height: '100%' },
  safeArea: { flex: 1, backgroundColor: 'transparent' },
  backButton: {
    shadowColor: '#3D2618',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
});

const cardShadow = {
  shadowColor: '#3D2618',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.08,
  shadowRadius: 10,
  elevation: 3,
};
