import React, { ReactNode } from 'react';
import { ImageBackground, ImageSourcePropType, StyleSheet, View } from 'react-native';
import { colors } from '../../theme/colors';

const loginBackground = require('../../../assets/login.png');
const onboardingBackground = require('../../../assets/onboarding.png');

interface Props {
  children: ReactNode;
  source?: ImageSourcePropType;
}

/** Full-screen backdrop for auth and onboarding screens. */
export function AuthBackground({ children, source = loginBackground }: Props) {
  return (
    <View style={[styles.root, { backgroundColor: colors.cream[50] }]}>
      <ImageBackground
        source={source}
        resizeMode="cover"
        style={StyleSheet.absoluteFillObject}
      />
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
});

export { onboardingBackground };
