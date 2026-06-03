import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { CreateProfileScreen } from '../screens/profile/CreateProfileScreen';
import { UploadPhotosScreen } from '../screens/profile/UploadPhotosScreen';
import { colors } from '../theme/colors';
import { ProfileSetupStackParamList } from './types';

const Stack = createNativeStackNavigator<ProfileSetupStackParamList>();

export function ProfileSetupStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.cream[200] },
        headerShadowVisible: false,
        headerTintColor: colors.ink[700],
        headerTitleStyle: { fontWeight: '700' },
        contentStyle: { backgroundColor: colors.cream[200] },
      }}
    >
      <Stack.Screen
        name="CreateProfile"
        component={CreateProfileScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="UploadPhotos"
        component={UploadPhotosScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}
