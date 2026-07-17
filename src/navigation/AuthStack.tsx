import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { ForgotPasswordScreen } from '../screens/auth/ForgotPasswordScreen';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { RegisterScreen } from '../screens/auth/RegisterScreen';
import { colors } from '../theme/colors';
import { AuthStackParamList } from './types';

const Stack = createNativeStackNavigator<AuthStackParamList>();

interface Props {
  /** Where the auth flow should land first. Defaults to `Login` so users with
   *  a previously created profile can sign in immediately after (re)installing
   *  the app; new users tap "Sign up" to reach Register from there. */
  initialRoute?: 'Login' | 'Register';
}

export function AuthStack({ initialRoute = 'Login' }: Props) {
  return (
    <Stack.Navigator
      initialRouteName={initialRoute}
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
      <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Register" component={RegisterScreen} options={{ headerShown: false }} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </Stack.Navigator>
  );
}
