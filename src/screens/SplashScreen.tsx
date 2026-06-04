import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { AuthBackground, onboardingBackground } from '../components/auth/AuthBackground';
import { Logo } from '../components/Logo';
import { colors } from '../theme/colors';

/** Brief launch screen while fonts, i18n, or auth bootstrap load. */
export function SplashScreen() {
  return (
    <AuthBackground source={onboardingBackground}>
      <View style={styles.content}>
        <Logo size={100} />
        <ActivityIndicator color={colors.coral[500]} style={styles.spinner} />
      </View>
    </AuthBackground>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinner: {
    marginTop: 32,
  },
});
