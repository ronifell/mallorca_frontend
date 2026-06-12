import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';
import { colors } from '../../theme/colors';

interface Props {
  min: number;
  max: number;
  onChange: (next: { min: number; max: number }) => void;
  /** Hard lower bound (defaults to 18 - matches backend MIN_AGE). */
  absoluteMin?: number;
  /** Hard upper bound (defaults to 99 - matches backend max enum). */
  absoluteMax?: number;
}

interface SideProps {
  label: string;
  value: number;
  onDecrement: () => void;
  onIncrement: () => void;
  canDecrement: boolean;
  canIncrement: boolean;
  accessibilityHintBase: string;
}

function StepperSide({
  label,
  value,
  onDecrement,
  onIncrement,
  canDecrement,
  canIncrement,
  accessibilityHintBase,
}: SideProps) {
  return (
    <View className="flex-1 bg-white border border-cream-300 rounded-2xl px-3 py-3 mx-1">
      <Text className="text-ink-400 text-xs mb-1.5 text-center">{label}</Text>
      <View className="flex-row items-center justify-between">
        <Pressable
          onPress={canDecrement ? onDecrement : undefined}
          accessibilityRole="button"
          accessibilityLabel={`${accessibilityHintBase} -1`}
          className={`w-8 h-8 rounded-full items-center justify-center ${
            canDecrement ? 'bg-coral-50' : 'bg-cream-100'
          }`}
        >
          <Ionicons
            name="remove"
            size={18}
            color={canDecrement ? colors.coral[500] : colors.ink[400]}
          />
        </Pressable>

        <Text className="text-ink-700 font-bold text-xl tabular-nums">{value}</Text>

        <Pressable
          onPress={canIncrement ? onIncrement : undefined}
          accessibilityRole="button"
          accessibilityLabel={`${accessibilityHintBase} +1`}
          className={`w-8 h-8 rounded-full items-center justify-center ${
            canIncrement ? 'bg-coral-50' : 'bg-cream-100'
          }`}
        >
          <Ionicons
            name="add"
            size={18}
            color={canIncrement ? colors.coral[500] : colors.ink[400]}
          />
        </Pressable>
      </View>
    </View>
  );
}

/**
 * Two-thumb age range control built from native primitives (no extra
 * dependencies). Exposes min/max as separate steppers so the user can dial
 * in their preferred range without dragging a slider that's awkward inside
 * a vertical scroll view.
 */
export function AgeRangePicker({
  min,
  max,
  onChange,
  absoluteMin = 18,
  absoluteMax = 99,
}: Props) {
  const { t } = useTranslation();
  const clamp = (n: number) => Math.max(absoluteMin, Math.min(absoluteMax, n));

  const handleMinChange = (delta: number) => {
    const next = clamp(min + delta);
    onChange({ min: next, max: Math.max(next, max) });
  };

  const handleMaxChange = (delta: number) => {
    const next = clamp(max + delta);
    onChange({ min: Math.min(min, next), max: next });
  };

  return (
    <View className="mb-3">
      <View className="flex-row items-center -mx-1 mb-2">
        <StepperSide
          label={t('profile.ageMin')}
          value={min}
          onDecrement={() => handleMinChange(-1)}
          onIncrement={() => handleMinChange(+1)}
          canDecrement={min > absoluteMin}
          canIncrement={min < max}
          accessibilityHintBase={t('profile.ageMin')}
        />
        <View className="w-8 items-center">
          <View className="h-0.5 w-4 bg-coral-300 rounded-full" />
        </View>
        <StepperSide
          label={t('profile.ageMax')}
          value={max}
          onDecrement={() => handleMaxChange(-1)}
          onIncrement={() => handleMaxChange(+1)}
          canDecrement={max > min}
          canIncrement={max < absoluteMax}
          accessibilityHintBase={t('profile.ageMax')}
        />
      </View>
      <Text className="text-coral-500 text-sm font-semibold text-center">
        {t('profile.ageRangeValue', { min, max })}
      </Text>
    </View>
  );
}
