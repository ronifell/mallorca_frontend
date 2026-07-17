import {
  NavigationContainer,
  DefaultTheme,
  NavigationContainerRef,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useRef } from 'react';
import { ImageBackground, StyleSheet, View } from 'react-native';
import { GlobalMatchModal } from '../components/discovery/GlobalMatchModal';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { setNavigationRef } from '../services/notifications';
import { useAuthStore } from '../store/auth';
import { colors } from '../theme/colors';
import { AuthStack } from './AuthStack';
import { MainTabs } from './MainTabs';
import { ProfileSetupStack } from './ProfileSetupStack';
import { ConversationScreen } from '../screens/chat/ConversationScreen';
import { MatchProfileScreen } from '../screens/matches/MatchProfileScreen';
import { PremiumScreen } from '../screens/premium/PremiumScreen';
import { EditProfileScreen } from '../screens/profile/EditProfileScreen';
import { SettingsScreen } from '../screens/settings/SettingsScreen';
import { LanguageScreen } from '../screens/settings/LanguageScreen';
import { NotificationsScreen } from '../screens/settings/NotificationsScreen';
import { PrivacyScreen } from '../screens/settings/PrivacyScreen';
import { LegalScreen } from '../screens/settings/LegalScreen';
import { ContactScreen } from '../screens/settings/ContactScreen';
import { BlockedUsersScreen } from '../screens/settings/BlockedUsersScreen';
import { CandidateProfileScreen } from '../screens/discovery/CandidateProfileScreen';
import { VerifyEmailScreen } from '../screens/auth/VerifyEmailScreen';
import { RootStackParamList } from './types';
const Stack = createNativeStackNavigator<RootStackParamList>();

const appBackground = require('../../assets/main1.png');

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: 'transparent',
    card: 'transparent',
    text: colors.ink[700],
    primary: colors.brand[500],
    border: colors.cream[300],
    notification: colors.brand[500],
  },
};

export function RootNavigator() {
  const { user } = useAuthStore();
  const isAuthenticated = !!user;
  const isFullyOnboarded =
    !!user && user.emailVerified && user.profileComplete;

  // The auth stack always lands on Login so users with a previously created
  // profile can sign in immediately after (re)installing the app; new users
  // tap "Sign up" from Login to reach Register.
  const navigationRef = useRef<NavigationContainerRef<RootStackParamList>>(null);

  // Expose the navigator to the push-notification service so tapping a
  // notification can deep-link to the right screen (chat, match, likes…).
  useEffect(() => {
    setNavigationRef(navigationRef.current);
    return () => setNavigationRef(null);
  }, []);

  const onNavReady = useCallback(() => {
    setNavigationRef(navigationRef.current);
  }, []);

  const contentStyle = isAuthenticated
    ? { backgroundColor: 'transparent' as const }
    : { backgroundColor: colors.cream[200] };

  return (
    <NavigationContainer ref={navigationRef} theme={navTheme} onReady={onNavReady}>
      <View style={[styles.root, { backgroundColor: colors.cream[200] }]}>
        {isAuthenticated ? (
          <ImageBackground
            source={appBackground}
            resizeMode="cover"
            style={StyleSheet.absoluteFillObject}
          />
        ) : null}
        <Stack.Navigator
          screenOptions={{
            headerStyle: { backgroundColor: colors.cream[200] },
            headerTintColor: colors.ink[700],
            headerTitleStyle: { fontWeight: '700' },
            headerShadowVisible: false,
            headerStatusBarHeight: 0,
            statusBarTranslucent: true,
            // Faster, snappier transitions between screens. Native-stack lets
            // us customise the underlying platform transition — on Android
            // we use the fade-in-from-bottom style (fast, minimal), on iOS
            // the default slide but with a shorter duration.
            animation: 'slide_from_right',
            animationDuration: 220,
            contentStyle,
          }}
        >
          {!user ? (
            <Stack.Screen
              name="Auth"
              options={{ headerShown: false }}
            >
              {() => <AuthStack initialRoute="Login" />}
            </Stack.Screen>
          ) : !user.emailVerified ? (
            <Stack.Screen
              name="VerifyEmail"
              component={VerifyEmailScreen}
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
                name="MatchProfile"
                component={MatchProfileScreen}
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="Conversation"
                component={ConversationScreen}
                options={{ headerShown: false }}
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
              <Stack.Screen name="Settings" component={SettingsScreen} options={{ headerShown: false }} />
              <Stack.Screen name="Language" component={LanguageScreen} options={{ headerShown: false }} />
              <Stack.Screen
                name="Notifications"
                component={NotificationsScreen}
                options={{ headerShown: false }}
              />
              <Stack.Screen name="Privacy" component={PrivacyScreen} options={{ headerShown: false }} />
              <Stack.Screen name="Legal" component={LegalScreen} options={{ headerShown: false }} />
              <Stack.Screen name="Contact" component={ContactScreen} options={{ headerShown: false }} />
              <Stack.Screen
                name="CandidateProfile"
                component={CandidateProfileScreen}
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="BlockedUsers"
                component={BlockedUsersScreen}
                options={{ title: 'Bloqueados' }}
              />
            </>
          )}
        </Stack.Navigator>
        {isFullyOnboarded ? <GlobalMatchModal /> : null}
        <LanguageSwitcher />
      </View>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
