import { Ionicons } from '@expo/vector-icons';
import React, { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthBackground, onboardingBackground } from '../auth/AuthBackground';
import { colors } from '../../theme/colors';
import { ProfileStepIndicator } from './ProfileStepIndicator';

interface Props {
  currentStep: number;
  totalSteps?: number;
  onBack?: () => void;
  children: ReactNode;
}

export function ProfileSetupShell({
  currentStep,
  totalSteps = 4,
  onBack,
  children,
}: Props) {
  return (
    <AuthBackground source={onboardingBackground}>
      <SafeAreaView className="flex-1" edges={['top', 'bottom']} style={{ flex: 1, backgroundColor: 'transparent' }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          className="flex-1"
        >
          <View className="flex-row items-center justify-between px-5 pt-2 pb-3">
            <Pressable
              onPress={onBack}
              className="w-10 h-10 rounded-full bg-white items-center justify-center border border-cream-300"
              style={{
                shadowColor: '#3D2618',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.08,
                shadowRadius: 4,
                elevation: 2,
              }}
              accessibilityRole="button"
              accessibilityLabel="Back"
            >
              <Ionicons name="chevron-back" size={22} color={colors.ink[700]} />
            </Pressable>
            <ProfileStepIndicator currentStep={currentStep} totalSteps={totalSteps} />
          </View>

          <ScrollView
            className="flex-1 px-6"
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: 32 }}
            showsVerticalScrollIndicator={false}
          >
            {children}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </AuthBackground>
  );
}
