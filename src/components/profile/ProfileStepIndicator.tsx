import React from 'react';
import { Text, View } from 'react-native';

interface Props {
  currentStep: number;
  totalSteps?: number;
}

export function ProfileStepIndicator({ currentStep, totalSteps = 4 }: Props) {
  return (
    <View className="flex-row items-center">
      {Array.from({ length: totalSteps }, (_, i) => {
        const step = i + 1;
        const isActive = step <= currentStep;
        const isLast = step === totalSteps;

        return (
          <React.Fragment key={step}>
            <View
              className={`w-8 h-8 rounded-full items-center justify-center ${
                isActive ? 'bg-coral-500' : 'bg-cream-300'
              }`}
            >
              <Text
                className={`text-sm font-bold ${isActive ? 'text-white' : 'text-ink-400'}`}
              >
                {step}
              </Text>
            </View>
            {!isLast ? (
              <View
                className={`h-0.5 w-5 mx-0.5 ${step < currentStep ? 'bg-coral-500' : 'bg-cream-300'}`}
              />
            ) : null}
          </React.Fragment>
        );
      })}
    </View>
  );
}
