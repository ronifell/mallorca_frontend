import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  ImageBackground,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { extractErrorMessage } from '../../api/client';
import { usersApi } from '../../api/endpoints';
import { SettingsMenuRow } from '../../components/settings/SettingsMenuRow';
import { useTopScreenPadding } from '../../hooks/useTopScreenPadding';
import { RootStackParamList } from '../../navigation/types';
import { colors } from '../../theme/colors';

const settingsBackground = require('../../../assets/main1.png');

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function PrivacyScreen() {
  const { t } = useTranslation();
  const nav = useNavigation<Nav>();
  const topPadding = useTopScreenPadding();
  const [exporting, setExporting] = useState(false);

  const exportData = async () => {
    setExporting(true);
    try {
      const data = await usersApi.exportData();
      Alert.alert(
        t('settings.exportData'),
        `OK — ${Object.keys(data).join(', ')}\n\n${t('common.ok')}`,
      );
    } catch (e) {
      Alert.alert(t('common.error'), extractErrorMessage(e));
    } finally {
      setExporting(false);
    }
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

          <Text className="text-ink-700 text-3xl font-bold">{t('settings.privacy')}</Text>
          <Text className="text-ink-400 text-sm mt-2 leading-5 max-w-[320px]">
            {t('settings.privacyPageSubtitle')}
          </Text>
        </View>

        <View className="px-5 mt-8">
          <View className="bg-white rounded-2xl overflow-hidden" style={cardShadow}>
            <SettingsMenuRow
              icon="ban-outline"
              title={t('settings.blockedUsers')}
              description={t('settings.blockedUsersDesc')}
              onPress={() => nav.navigate('BlockedUsers')}
              showDivider
            />
            <SettingsMenuRow
              icon="download-outline"
              title={t('settings.exportData')}
              description={t('settings.exportDataDesc')}
              onPress={exporting ? undefined : exportData}
              showDivider={false}
              trailing={
                exporting ? (
                  <ActivityIndicator color={colors.coral[500]} />
                ) : (
                  <Ionicons name="chevron-forward" size={20} color={colors.ink[400]} />
                )
              }
            />
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.cream[50],
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
  },
  safeArea: {
    flex: 1,
    backgroundColor: 'transparent',
  },
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
