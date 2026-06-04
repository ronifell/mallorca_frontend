import React, { ReactNode } from 'react';
import {
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTopScreenPadding } from '../hooks/useTopScreenPadding';
import { colors } from '../theme/colors';

const onboardingBackground = require('../../assets/onboarding.png');

interface Props {
  children: ReactNode;
  scroll?: boolean;
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
  className?: string;
  padded?: boolean;
  background?: 'onboarding';
}

export function Screen({
  children,
  scroll = false,
  edges = ['bottom'],
  className = '',
  padded = true,
  background,
}: Props) {
  const topPadding = useTopScreenPadding();
  const hasBackground = background === 'onboarding';
  const surfaceColor = hasBackground ? 'transparent' : colors.cream[200];
  const containerClass = hasBackground ? `flex-1 ${className}` : `flex-1 bg-cream-200 ${className}`;

  const inner = (
    <View className={padded ? 'flex-1 px-5' : 'flex-1'} style={{ paddingTop: topPadding }}>
      {children}
    </View>
  );

  const body = (
    <SafeAreaView
      edges={edges}
      className={containerClass}
      style={{ flex: 1, backgroundColor: surfaceColor }}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
        style={{ flex: 1, backgroundColor: surfaceColor }}
      >
        {scroll ? (
          <ScrollView
            className={padded ? 'flex-1 px-5' : 'flex-1'}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingTop: topPadding + 16, paddingBottom: 16, flexGrow: 1 }}
            style={{ flex: 1, backgroundColor: surfaceColor }}
          >
            {children}
          </ScrollView>
        ) : (
          inner
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );

  if (!hasBackground) {
    return body;
  }

  return (
    <View style={[styles.backgroundRoot, { backgroundColor: colors.cream[50] }]}>
      <ImageBackground
        source={onboardingBackground}
        resizeMode="cover"
        style={StyleSheet.absoluteFillObject}
      />
      {body}
    </View>
  );
}

const styles = StyleSheet.create({
  backgroundRoot: {
    flex: 1,
  },
});
