import {
  NotoSerif_400Regular,
  NotoSerif_700Bold,
} from '@expo-google-fonts/noto-serif';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import * as ExpoSplash from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useLayoutEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import './src/styles/global.css';
import { setOnUnauthorized } from './src/api/client';
import { initI18n } from './src/i18n';
import {
  flushPendingEmailVerification,
  initEmailVerificationLinking,
} from './src/services/emailVerificationLinking';
import { RootNavigator } from './src/navigation/RootNavigator';
import { SplashScreen } from './src/screens/SplashScreen';
import { registerForPushNotificationsAsync } from './src/services/notifications';
import { enableFullscreenUi } from './src/services/systemUi';
import { useAuthStore } from './src/store/auth';
import { colors } from './src/theme/colors';

ExpoSplash.preventAutoHideAsync().catch(() => undefined);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

export default function App() {
  const [i18nReady, setI18nReady] = React.useState(false);
  const [fontsLoaded] = useFonts({
    NotoSerif_400Regular,
    NotoSerif_700Bold,
  });
  const initialized = useAuthStore((s) => s.initialized);
  const bootstrap = useAuthStore((s) => s.bootstrap);
  const logout = useAuthStore((s) => s.logout);

  const ready = i18nReady && fontsLoaded && initialized;

  useEffect(() => {
    initEmailVerificationLinking();
  }, []);

  useEffect(() => {
    if (!initialized) return;
    void flushPendingEmailVerification();
  }, [initialized]);

  useLayoutEffect(() => {
    if (ready) return;
    enableFullscreenUi().catch(() => undefined);
  }, [ready]);

  useEffect(() => {
    initI18n().then(() => setI18nReady(true));
    bootstrap();
    setOnUnauthorized(() => {
      logout();
    });
  }, [bootstrap, logout]);

  useEffect(() => {
    if (!ready) return;
    ExpoSplash.hideAsync().catch(() => undefined);
    registerForPushNotificationsAsync().catch(() => undefined);
  }, [ready]);

  if (!ready) {
    return <SplashScreen />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.cream[200] }}>
      <SafeAreaProvider style={{ flex: 1, backgroundColor: colors.cream[200] }}>
        <QueryClientProvider client={queryClient}>
          <RootNavigator />
          <StatusBar hidden />
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
