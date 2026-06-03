import {
  NotoSerif_400Regular,
  NotoSerif_700Bold,
} from '@expo-google-fonts/noto-serif';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import * as SystemUI from 'expo-system-ui';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import './src/styles/global.css';
import { initI18n } from './src/i18n';
import { RootNavigator } from './src/navigation/RootNavigator';
import { SplashScreen } from './src/screens/SplashScreen';
import { registerForPushNotificationsAsync } from './src/services/notifications';
import { colors } from './src/theme/colors';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

export default function App() {
  const [i18nReady, setI18nReady] = useState(false);
  const [fontsLoaded] = useFonts({
    NotoSerif_400Regular,
    NotoSerif_700Bold,
  });

  useEffect(() => {
    initI18n().then(() => setI18nReady(true));
    SystemUI.setBackgroundColorAsync(colors.cream[200]).catch(() => undefined);
  }, []);

  const ready = i18nReady && fontsLoaded;

  useEffect(() => {
    if (!ready) return;
    // Fire & forget: request push permissions and register the token.
    registerForPushNotificationsAsync().catch(() => undefined);
  }, [ready]);

  if (!ready) return <SplashScreen />;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.cream[200] }}>
      <SafeAreaProvider style={{ flex: 1, backgroundColor: colors.cream[200] }}>
        <QueryClientProvider client={queryClient}>
          <RootNavigator />
          <StatusBar style="dark" backgroundColor={colors.cream[200]} />
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
