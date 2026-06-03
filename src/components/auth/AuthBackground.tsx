import React, { ReactNode } from 'react';
import { ImageBackground, ImageSourcePropType, StyleSheet, View } from 'react-native';

const loginBackground = require('../../../assets/login.png');
const onboardingBackground = require('../../../assets/onboarding.png');

interface Props {
  children: ReactNode;
  source?: ImageSourcePropType;
}

/** Full-screen backdrop for auth and onboarding screens. */
export function AuthBackground({ children, source = loginBackground }: Props) {
  return (
    <View className="flex-1 bg-cream-50">
      <ImageBackground
        source={source}
        resizeMode="cover"
        style={StyleSheet.absoluteFillObject}
      />
      <View className="flex-1">{children}</View>
    </View>
  );
}

export { onboardingBackground };
