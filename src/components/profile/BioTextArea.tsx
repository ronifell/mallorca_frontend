import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, TextInput, TextInputProps, View } from 'react-native';
import { FilterContext } from '../../utils/contentFilter';
import { createFilteredChangeHandler } from '../../utils/contentFilterHelpers';
import { colors } from '../../theme/colors';

interface Props extends TextInputProps {
  value: string;
  maxLength?: number;
  filterContext?: FilterContext;
}

export function BioTextArea({
  value,
  maxLength = 500,
  filterContext = 'profile',
  onChangeText,
  ...rest
}: Props) {
  const { t } = useTranslation();
  const [filterError, setFilterError] = useState<string | null>(null);

  const handleChangeText = (text: string) => {
    if (onChangeText) {
      createFilteredChangeHandler(value, onChangeText, filterContext, t, setFilterError)(text);
      if (text.length <= value.length) {
        setFilterError(null);
      }
    }
  };

  return (
    <View className="mb-4">
      <TextInput
        placeholderTextColor={colors.ink[400]}
        multiline
        maxLength={maxLength}
        value={value}
        onChangeText={handleChangeText}
        textAlignVertical="top"
        {...rest}
        className={`bg-white rounded-2xl border px-4 py-3.5 text-ink-700 text-base min-h-[120px] ${
          filterError ? 'border-brand-500' : 'border-cream-300'
        }`}
        style={{
          shadowColor: '#3D2618',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.06,
          shadowRadius: 4,
          elevation: 1,
        }}
      />
      {filterError ? (
        <Text className="text-brand-500 text-xs mt-1.5 ml-1">{filterError}</Text>
      ) : null}
      <Text className="text-ink-400 text-xs text-right mt-1.5 mr-1">
        {value.length}/{maxLength}
      </Text>
    </View>
  );
}
