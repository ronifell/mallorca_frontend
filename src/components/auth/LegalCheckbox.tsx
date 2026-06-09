import React from 'react';
import { Linking, Pressable, Text, View } from 'react-native';
import { colors } from '../../theme/colors';

interface Props {
  checked: boolean;
  onToggle: () => void;
  /** Plain prefix text (i.e. "I have read and I accept the "). */
  intro: string;
  /** Translated label rendered as the tappable link. */
  linkLabel: string;
  /** Full URL opened when the user taps the link label. */
  linkUrl: string;
  testID?: string;
}

/**
 * Single legal checkbox row (terms OR privacy). Tapping the row toggles the
 * checkbox; tapping the underlined label opens the corresponding document
 * in the device's default browser.
 */
export function LegalCheckbox({ checked, onToggle, intro, linkLabel, linkUrl, testID }: Props) {
  const open = () => {
    Linking.openURL(linkUrl).catch(() => undefined);
  };

  return (
    <Pressable
      onPress={onToggle}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      className="flex-row items-start mb-3"
      testID={testID}
    >
      <View
        className={`w-6 h-6 rounded-md mr-3 mt-0.5 items-center justify-center border-2 ${
          checked ? 'bg-coral-500 border-coral-500' : 'bg-white border-cream-300'
        }`}
      >
        {checked ? <Text className="text-white text-sm font-bold">✓</Text> : null}
      </View>
      <View className="flex-1">
        <Text className="text-ink-700 text-sm leading-5">
          <Text>{intro}</Text>
          <Text
            onPress={open}
            className="text-coral-500 font-semibold"
            style={{ textDecorationLine: 'underline', textDecorationColor: colors.coral[500] }}
          >
            {linkLabel}
          </Text>
          <Text>.</Text>
        </Text>
      </View>
    </Pressable>
  );
}
