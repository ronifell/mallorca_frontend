import React from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface Props {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  className?: string;
}

const styles: Record<Variant, { container: string; text: string }> = {
  primary: {
    container: 'bg-brand-500 active:bg-brand-600 rounded-pill',
    text: 'text-white font-semibold text-base',
  },
  secondary: {
    container: 'bg-cream-300 active:bg-cream-400 rounded-pill',
    text: 'text-ink-700 font-semibold text-base',
  },
  ghost: {
    container: 'bg-transparent active:bg-cream-200 rounded-pill',
    text: 'text-brand-500 font-semibold text-base',
  },
  danger: {
    container: 'bg-brand-50 active:bg-brand-100 rounded-pill',
    text: 'text-brand-600 font-semibold text-base',
  },
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled,
  loading,
  fullWidth,
  className = '',
}: Props) {
  const s = styles[variant];
  return (
    <Pressable
      onPress={loading || disabled ? undefined : onPress}
      className={`${s.container} px-6 py-3.5 items-center justify-center ${fullWidth ? 'w-full' : ''} ${disabled ? 'opacity-50' : ''} ${className}`}
    >
      <View className="flex-row items-center">
        {loading ? (
          <ActivityIndicator color={variant === 'primary' ? '#fff' : '#B82E2E'} />
        ) : (
          <Text className={s.text}>{label}</Text>
        )}
      </View>
    </Pressable>
  );
}
