import React, { ReactNode } from 'react';
import { View } from 'react-native';

interface Props {
  children: ReactNode;
}

export function SettingsCard({ children }: Props) {
  return (
    <View
      className="bg-white rounded-2xl overflow-hidden mb-5"
      style={{
        shadowColor: '#3D2618',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
      }}
    >
      {children}
    </View>
  );
}
