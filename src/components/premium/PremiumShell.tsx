import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React, { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ImageBackground,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTopScreenPadding } from '../../hooks/useTopScreenPadding';
import { authScreenStyles } from '../../screens/auth/authScreenStyles';
import { colors } from '../../theme/colors';

const premiumBackground = require('../../../assets/main.png');

interface Props {
  children: ReactNode;
}

export function PremiumShell({ children }: Props) {
  const { t } = useTranslation();
  const nav = useNavigation();
  const canGoBack = nav.canGoBack();
  const topPadding = useTopScreenPadding();

  return (
    <View style={styles.root}>
      <ImageBackground
        source={premiumBackground}
        resizeMode="cover"
        style={StyleSheet.absoluteFillObject}
        imageStyle={styles.backgroundImage}
      />

      <View pointerEvents="none" style={authScreenStyles.heroFade}>
        <View style={[authScreenStyles.fadeLayer, { height: 140, opacity: 0.2 }]} />
        <View style={[authScreenStyles.fadeLayer, { height: 100, opacity: 0.45 }]} />
        <View style={[authScreenStyles.fadeLayer, { height: 60, opacity: 0.75 }]} />
      </View>

      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <View
          className="flex-row items-center justify-between px-5"
          style={{ paddingTop: topPadding, paddingBottom: 6 }}
        >
          {canGoBack ? (
            <Pressable
              onPress={() => nav.goBack()}
              className="w-10 h-10 rounded-full bg-white items-center justify-center border border-cream-300"
              style={styles.iconButton}
              accessibilityRole="button"
              accessibilityLabel={t('common.back')}
            >
              <Ionicons name="chevron-back" size={22} color={colors.ink[700]} />
            </Pressable>
          ) : (
            <View className="w-10" />
          )}

          <View className="flex-row items-baseline">
            <Text className="text-ink-700 font-bold text-lg">{t('auth.appNameCitas')} </Text>
            <Text className="text-coral-500 font-bold text-lg">{t('auth.appNameMallorca')}</Text>
          </View>

          <View className="w-10" />
        </View>

        <View style={styles.content}>{children}</View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.cream[100],
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
  },
  safeArea: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  iconButton: {
    shadowColor: '#3D2618',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
});
