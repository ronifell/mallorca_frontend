import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { colors } from '../../theme/colors';

export type InterestType = 'men' | 'women' | 'both';

interface Props {
  type: InterestType;
  label: string;
  selected?: boolean;
  onPress?: () => void;
}

const ICON_CONFIG: Record<
  InterestType,
  { icon: keyof typeof Ionicons.glyphMap; color: string }
> = {
  men: { icon: 'male', color: '#4A90D9' },
  women: { icon: 'female', color: '#E879A8' },
  both: { icon: 'heart', color: colors.coral[500] },
};

export function InterestPill({ type, label, selected, onPress }: Props) {
  const { icon, color } = ICON_CONFIG[type];

  return (
    <Pressable
      onPress={onPress}
      className={`flex-1 flex-row items-center justify-center py-2.5 rounded-pill border ${
        selected ? 'bg-white border-2 border-coral-500' : 'bg-white border border-cream-300'
      }`}
      style={{
        shadowColor: '#3D2618',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 1,
      }}
    >
      <Ionicons name={icon} size={16} color={color} />
      <Text
        className={`font-semibold text-sm ml-1.5 ${selected ? 'text-coral-500' : 'text-ink-700'}`}
        numberOfLines={1}
      >
        {label}
      </Text>
      {selected ? (
        <View className="absolute right-2">
          <Ionicons name="checkmark-circle" size={15} color={colors.coral[500]} />
        </View>
      ) : null}
    </Pressable>
  );
}

interface RowProps {
  children: React.ReactNode;
}

export function InterestPillRow({ children }: RowProps) {
  return <View className="flex-row mb-4 gap-2">{children}</View>;
}
