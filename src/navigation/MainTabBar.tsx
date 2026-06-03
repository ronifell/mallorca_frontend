import { BottomTabBar, BottomTabBarProps } from '@react-navigation/bottom-tabs';
import React, { useEffect } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';

/** Extends the tab bar background through the bottom safe area / home indicator zone. */
export function MainTabBar(props: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (Platform.OS !== 'android') return;
    import('expo-navigation-bar')
      .then((NavigationBar) => {
        NavigationBar.setBackgroundColorAsync(colors.white).catch(() => undefined);
        NavigationBar.setButtonStyleAsync('dark').catch(() => undefined);
      })
      .catch(() => undefined);
  }, []);

  return (
    <View style={[styles.shell, { paddingBottom: insets.bottom }]}>
      <BottomTabBar {...props} />
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    backgroundColor: colors.white,
    borderTopColor: colors.cream[300],
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
