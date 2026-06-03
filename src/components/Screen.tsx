import React, { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';

interface Props {
  children: ReactNode;
  scroll?: boolean;
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
  className?: string;
  padded?: boolean;
}

export function Screen({
  children,
  scroll = false,
  edges = ['top'],
  className = '',
  padded = true,
}: Props) {
  const containerClass = `flex-1 bg-cream-200 ${className}`;

  const inner = (
    <View className={padded ? 'flex-1 px-5' : 'flex-1'}>{children}</View>
  );

  return (
    <SafeAreaView
      edges={edges}
      className={containerClass}
      style={{ flex: 1, backgroundColor: colors.cream[200] }}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
        style={{ flex: 1, backgroundColor: colors.cream[200] }}
      >
        {scroll ? (
          <ScrollView
            className={padded ? 'flex-1 px-5' : 'flex-1'}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingVertical: 16, flexGrow: 1 }}
            style={{ flex: 1, backgroundColor: colors.cream[200] }}
          >
            {children}
          </ScrollView>
        ) : (
          inner
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
