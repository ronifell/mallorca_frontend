import React, { ReactNode } from 'react';
import { ImageBackground, StyleSheet, View } from 'react-native';

const loginBackground = require('../../../assets/login.png');

interface Props {
  children: ReactNode;
}

/** Full-screen auth backdrop using the shared login.png artwork. */
export function AuthBackground({ children }: Props) {
  return (
    <View className="flex-1 bg-cream-50">
      <ImageBackground
        source={loginBackground}
        resizeMode="cover"
        style={StyleSheet.absoluteFillObject}
      />
      <View className="flex-1">{children}</View>
    </View>
  );
}
