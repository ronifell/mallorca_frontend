import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, TextInput, View } from 'react-native';
import { colors } from '../../theme/colors';

interface Props {
  value: string;
  onChangeText: (value: string) => void;
  onSend: () => void;
  onAttach: () => void;
  onPickImage: () => void;
  disabled?: boolean;
}

export function ConversationInputBar({
  value,
  onChangeText,
  onSend,
  onAttach,
  onPickImage,
  disabled,
}: Props) {
  const { t } = useTranslation();

  return (
    <View className="flex-row items-end px-4 py-3 bg-cream-200 border-t border-cream-300">
      <Pressable
        onPress={disabled ? undefined : onAttach}
        className="w-10 h-10 rounded-full bg-white items-center justify-center mr-2 border border-cream-300"
        accessibilityRole="button"
        accessibilityLabel={t('chat.attach')}
      >
        <Ionicons name="add" size={24} color={colors.ink[700]} />
      </Pressable>

      <View className="flex-1 flex-row items-center bg-white rounded-2xl px-3 py-2 border border-cream-300 min-h-[48px]">
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={t('chat.writeMessage')}
          placeholderTextColor={colors.ink[400]}
          className="flex-1 text-ink-700 text-base max-h-28 py-1"
          multiline
          editable={!disabled}
        />
        <Pressable
          onPress={disabled ? undefined : onPickImage}
          className="w-8 h-8 items-center justify-center"
          accessibilityRole="button"
          accessibilityLabel={t('chat.image')}
        >
          <Ionicons name="image-outline" size={22} color={colors.ink[400]} />
        </Pressable>
        <Pressable
          onPress={() => Alert.alert(t('chat.voice'), t('chat.voiceComingSoon'))}
          className="w-8 h-8 items-center justify-center"
          accessibilityRole="button"
          accessibilityLabel={t('chat.voice')}
        >
          <Ionicons name="mic-outline" size={22} color={colors.ink[400]} />
        </Pressable>
      </View>

      {value.trim().length > 0 ? (
        <Pressable
          onPress={onSend}
          className="ml-2 w-10 h-10 rounded-full bg-coral-500 items-center justify-center"
          accessibilityRole="button"
          accessibilityLabel={t('chat.send')}
        >
          <Ionicons name="send" size={18} color={colors.white} />
        </Pressable>
      ) : null}
    </View>
  );
}
