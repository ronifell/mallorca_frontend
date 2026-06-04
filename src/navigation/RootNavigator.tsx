import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React, { useEffect } from 'react';
import { useAuthStore } from '../store/auth';
import { colors } from '../theme/colors';
import { AuthStack } from './AuthStack';
import { MainTabs } from './MainTabs';
import { ProfileSetupStack } from './ProfileSetupStack';
import { SplashScreen } from '../screens/SplashScreen';
import { ConversationScreen } from '../screens/chat/ConversationScreen';
import { PremiumScreen } from '../screens/premium/PremiumScreen';
import { EditProfileScreen } from '../screens/profile/EditProfileScreen';
import { SettingsScreen } from '../screens/settings/SettingsScreen';
import { LanguageScreen } from '../screens/settings/LanguageScreen';
import { NotificationsScreen } from '../screens/settings/NotificationsScreen';
import { PrivacyScreen } from '../screens/settings/PrivacyScreen';
import { BlockedUsersScreen } from '../screens/settings/BlockedUsersScreen';
import { RootStackParamList } from './types';
import { setOnUnauthorized } from '../api/client';

const Stack = createNativeStackNavigator<RootStackParamList>();

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.cream[200],
    card: colors.cream[200],
    text: colors.ink[700],
    primary: colors.brand[500],
    border: colors.cream[300],
    notification: colors.brand[500],
  },
};

export function RootNavigator() {
  const { user, initialized, bootstrap, logout } = useAuthStore();

  useEffect(() => {
    bootstrap();
    setOnUnauthorized(() => {
      logout();
    });
  }, []);

  if (!initialized) {
    return <SplashScreen />;
  }

  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: colors.cream[200] },
          headerTintColor: colors.ink[700],
          headerTitleStyle: { fontWeight: '700' },
          headerShadowVisible: false,
          contentStyle: { backgroundColor: colors.cream[200] },
        }}
      >
        {!user ? (
          <Stack.Screen
            name="Auth"
            component={AuthStack}
            options={{ headerShown: false }}
          />
        ) : !user.profileComplete ? (
          <Stack.Screen
            name="ProfileSetup"
            component={ProfileSetupStack}
            options={{ headerShown: false }}
          />
        ) : (
          <>
            <Stack.Screen
              name="Main"
              component={MainTabs}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="Conversation"
              component={ConversationScreen}
              options={({ route }) => ({
                title: route.params.otherName ?? 'Chat',
              })}
            />
            <Stack.Screen
              name="Premium"
              component={PremiumScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="EditProfile"
              component={EditProfileScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Ajustes' }} />
            <Stack.Screen name="Language" component={LanguageScreen} options={{ title: 'Idioma' }} />
            <Stack.Screen
              name="Notifications"
              component={NotificationsScreen}
              options={{ title: 'Notificaciones' }}
            />
            <Stack.Screen name="Privacy" component={PrivacyScreen} options={{ title: 'Privacidad' }} />
            <Stack.Screen
              name="BlockedUsers"
              component={BlockedUsersScreen}
              options={{ title: 'Bloqueados' }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
