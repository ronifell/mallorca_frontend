import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, TextInput, TextInputProps, View } from 'react-native';
import { FilterContext } from '../utils/contentFilter';
import { createFilteredChangeHandler } from '../utils/contentFilterHelpers';
import { colors } from '../theme/colors';

interface Props extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  showPasswordToggle?: boolean;
  elevated?: boolean;
  /** When true, left icon uses the coral accent color (login form style). */
  accentIcon?: boolean;
  /** When set, blocks inappropriate text as the user types (profile/chat rules). */
  filterContext?: FilterContext;
  onFilterBlock?: (message: string) => void;
}

export function Input({
  label,
  error,
  hint,
  leftIcon,
  rightIcon,
  showPasswordToggle,
  secureTextEntry,
  elevated = false,
  accentIcon = false,
  filterContext,
  onFilterBlock,
  onChangeText,
  value,
  ...rest
}: Props) {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  const [filterError, setFilterError] = useState<string | null>(null);
  const isSecure = secureTextEntry && !visible;
  const fieldBg = elevated ? 'bg-white' : 'bg-cream-50';
  const leftIconColor = accentIcon ? colors.coral[500] : colors.ink[400];
  const displayError = error ?? filterError;

  const handleChangeText = (text: string) => {
    if (filterContext && onChangeText) {
      createFilteredChangeHandler(
        typeof value === 'string' ? value : '',
        onChangeText,
        filterContext,
        t,
        (message) => {
          setFilterError(message);
          onFilterBlock?.(message);
        },
      )(text);
      if (text.length <= (typeof value === 'string' ? value.length : 0)) {
        setFilterError(null);
      }
      return;
    }
    onChangeText?.(text);
  };

  return (
    <View className="w-full mb-4">
      {label ? (
        <Text className="text-ink-700 font-semibold mb-1.5 ml-1">{label}</Text>
      ) : null}
      <View
        className={`flex-row items-center ${fieldBg} rounded-2xl border px-3 ${
          displayError ? 'border-brand-500' : 'border-cream-300'
        }`}
        style={
          elevated
            ? {
                shadowColor: '#3D2618',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.06,
                shadowRadius: 4,
                elevation: 1,
              }
            : undefined
        }
      >
        {leftIcon ? (
          <Ionicons name={leftIcon} size={18} color={leftIconColor} style={{ marginRight: 8 }} />
        ) : null}
        <TextInput
          placeholderTextColor={colors.ink[400]}
          secureTextEntry={isSecure}
          value={value}
          onChangeText={handleChangeText}
          {...rest}
          className="flex-1 py-3.5 text-ink-700 text-base"
        />
        {showPasswordToggle && secureTextEntry ? (
          <Pressable
            onPress={() => setVisible((v) => !v)}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={visible ? 'Hide password' : 'Show password'}
          >
            <Ionicons
              name={visible ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={colors.ink[400]}
            />
          </Pressable>
        ) : rightIcon ? (
          <Ionicons name={rightIcon} size={18} color={colors.ink[400]} />
        ) : null}
      </View>
      {displayError ? (
        <Text className="text-brand-500 text-xs mt-1 ml-1">{displayError}</Text>
      ) : hint ? (
        <Text className="text-ink-400 text-xs mt-1 ml-1">{hint}</Text>
      ) : null}
    </View>
  );
}
