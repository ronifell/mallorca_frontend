import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { ForgotPasswordScreen } from '../screens/auth/ForgotPasswordScreen';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { OnboardingScreen } from '../screens/auth/OnboardingScreen';
import { RegisterScreen } from '../screens/auth/RegisterScreen';
import { colors } from '../theme/colors';
import { AuthStackParamList } from './types';

const Stack = createNativeStackNavigator<AuthStackParamList>();

/** Set false to skip onboarding on launch; screen remains registered for manual navigation. */
export const SHOW_ONBOARDING_ON_LAUNCH = false;

export function AuthStack() {
  return (
    <Stack.Navigator
      initialRouteName={SHOW_ONBOARDING_ON_LAUNCH ? 'Onboarding' : 'Login'}
      screenOptions={{
        headerStyle: { backgroundColor: colors.cream[200] },
        headerShadowVisible: false,
        headerTintColor: colors.ink[700],
        headerTitle: '',
        headerStatusBarHeight: 0,
        statusBarTranslucent: true,
        contentStyle: { backgroundColor: 'transparent' },
      }}
    >
      <Stack.Screen
        name="Onboarding"
        component={OnboardingScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Register" component={RegisterScreen} options={{ headerShown: false }} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </Stack.Navigator>
  );
}
