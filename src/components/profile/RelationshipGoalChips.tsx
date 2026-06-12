import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';
import { RelationshipGoal } from '../../api/types';
import { RELATIONSHIP_GOAL_OPTIONS } from '../../config/profileOptions';
import { colors } from '../../theme/colors';

interface Props {
  value: RelationshipGoal[];
  onChange: (next: RelationshipGoal[]) => void;
}

/**
 * Multi-select chip grid for the "What I'm looking for" preference. Tapping a
 * chip toggles its membership in the value array. Designed so the entire row
 * wraps cleanly on narrow screens while keeping consistent spacing with the
 * surrounding profile form.
 */
export function RelationshipGoalChips({ value, onChange }: Props) {
  const { t } = useTranslation();

  const toggle = (id: RelationshipGoal) => {
    if (value.includes(id)) {
      onChange(value.filter((x) => x !== id));
    } else {
      onChange([...value, id]);
    }
  };

  return (
    <View className="flex-row flex-wrap mb-3" style={{ gap: 8 }}>
      {RELATIONSHIP_GOAL_OPTIONS.map((opt) => {
        const selected = value.includes(opt.id);
        return (
          <Pressable
            key={opt.id}
            onPress={() => toggle(opt.id)}
            accessibilityRole="button"
            accessibilityLabel={t(opt.labelKey)}
            accessibilityState={{ selected }}
            className={`flex-row items-center px-3.5 py-2.5 rounded-pill border ${
              selected
                ? 'bg-coral-50 border-coral-500 border-2'
                : 'bg-white border-cream-300'
            }`}
            style={{
              shadowColor: '#3D2618',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.05,
              shadowRadius: 3,
              elevation: 1,
            }}
          >
            <Ionicons
              name={opt.icon}
              size={15}
              color={selected ? colors.coral[500] : opt.color}
            />
            <Text
              className={`font-semibold text-sm ml-1.5 ${
                selected ? 'text-coral-500' : 'text-ink-700'
              }`}
            >
              {t(opt.labelKey)}
            </Text>
            {selected ? (
              <Ionicons
                name="checkmark-circle"
                size={14}
                color={colors.coral[500]}
                style={{ marginLeft: 6 }}
              />
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}
