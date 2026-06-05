import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import React, { useLayoutEffect } from 'react';
import { Dimensions, Image, Platform, StatusBar, StyleSheet, View } from 'react-native';
import { enableFullscreenUi } from '../services/systemUi';
import { colors } from '../theme/colors';

const splashImage = require('../../assets/splash.png');

const { width: screenWidth, height: screenHeight } = Dimensions.get('screen');
const statusBarInset = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 0;

/** Launch screen shown until fonts, i18n, and auth bootstrap complete. */
export function SplashScreen() {
  useLayoutEffect(() => {
    StatusBar.setHidden(true, 'none');
    if (Platform.OS === 'android') {
      StatusBar.setTranslucent(true);
      StatusBar.setBackgroundColor(colors.cream[200], false);
    }
    enableFullscreenUi().catch(() => undefined);
  }, []);

  return (
    <View style={styles.root}>
      <ExpoStatusBar hidden />
      <StatusBar hidden translucent backgroundColor={colors.cream[200]} />
      <Image source={splashImage} resizeMode="cover" style={styles.image} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    top: -statusBarInset,
    left: 0,
    width: screenWidth,
    height: screenHeight + statusBarInset,
    backgroundColor: colors.cream[200],
  },
  image: {
    ...StyleSheet.absoluteFillObject,
    width: screenWidth,
    height: screenHeight + statusBarInset,
  },
});
