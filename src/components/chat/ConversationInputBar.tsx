import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  Animated,
  Easing,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { colors } from '../../theme/colors';
import {
  cancelVoiceRecording,
  ensureMicPermission,
  RecordingResult,
  startVoiceRecording,
  stopVoiceRecording,
} from '../../services/voiceRecorder';

interface Props {
  value: string;
  onChangeText: (value: string) => void;
  onSend: () => void;
  onAttach: () => void;
  onPickImage: () => void;
  onSendVoice: (result: RecordingResult) => void | Promise<void>;
  disabled?: boolean;
}

function formatRecordingTime(seconds: number): string {
  const safe = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

export function ConversationInputBar({
  value,
  onChangeText,
  onSend,
  onAttach,
  onPickImage,
  onSendVoice,
  disabled,
}: Props) {
  const { t } = useTranslation();
  const [recording, setRecording] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const pulse = useRef(new Animated.Value(0)).current;
  const interval = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTime = useRef<number | null>(null);

  const clearTimers = () => {
    if (interval.current) {
      clearInterval(interval.current);
      interval.current = null;
    }
    startTime.current = null;
  };

  useEffect(() => {
    return () => {
      clearTimers();
      cancelVoiceRecording().catch(() => undefined);
    };
  }, []);

  useEffect(() => {
    if (!recording) {
      pulse.stopAnimation();
      pulse.setValue(0);
      return;
    }
    pulse.setValue(0);
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 700,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 700,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [recording, pulse]);

  const startRecording = useCallback(async () => {
    if (recording || disabled) return;
    const granted = await ensureMicPermission();
    if (!granted) {
      Alert.alert(
        t('chat.voicePermissionTitle'),
        t('chat.voicePermissionMessage'),
      );
      return;
    }
    try {
      await startVoiceRecording();
      setElapsedSeconds(0);
      startTime.current = Date.now();
      interval.current = setInterval(() => {
        if (!startTime.current) return;
        setElapsedSeconds(Math.floor((Date.now() - startTime.current) / 1000));
      }, 250);
      setRecording(true);
    } catch (err) {
      Alert.alert(t('common.error'), (err as Error).message ?? '');
    }
  }, [recording, disabled, t]);

  const finishRecording = useCallback(async () => {
    if (!recording) return;
    clearTimers();
    setRecording(false);
    const result = await stopVoiceRecording();
    setElapsedSeconds(0);
    if (!result || result.durationSeconds < 1) {
      Alert.alert(t('chat.voice'), t('chat.voiceTooShort'));
      return;
    }
    await onSendVoice(result);
  }, [recording, onSendVoice, t]);

  const cancelRecording = useCallback(async () => {
    if (!recording) return;
    clearTimers();
    setRecording(false);
    setElapsedSeconds(0);
    await cancelVoiceRecording();
  }, [recording]);

  const showRecordingBar = recording;
  const hasText = value.trim().length > 0;
  const indicatorOpacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.35, 1],
  });

  if (showRecordingBar) {
    return (
      <View style={styles.container} className="bg-cream-200 border-t border-cream-300">
        <Pressable
          onPress={cancelRecording}
          className="w-10 h-10 rounded-full bg-white border border-cream-300 items-center justify-center mr-2"
          accessibilityRole="button"
          accessibilityLabel={t('chat.voiceCancel')}
        >
          <Ionicons name="trash-outline" size={20} color={colors.coral[500]} />
        </Pressable>

        <View className="flex-1 flex-row items-center bg-white rounded-2xl px-3 py-3 border border-coral-100">
          <Animated.View
            style={{
              width: 10,
              height: 10,
              borderRadius: 5,
              backgroundColor: colors.coral[500],
              marginRight: 10,
              opacity: indicatorOpacity,
            }}
          />
          <Text className="text-ink-700 font-semibold text-sm">
            {t('chat.voiceRecording')}
          </Text>
          <Text className="text-ink-400 text-sm ml-2 tabular-nums">
            {formatRecordingTime(elapsedSeconds)}
          </Text>
        </View>

        <Pressable
          onPress={finishRecording}
          className="ml-2 w-11 h-11 rounded-full bg-coral-500 items-center justify-center"
          accessibilityRole="button"
          accessibilityLabel={t('chat.voiceSend')}
          style={{
            shadowColor: colors.coral[600],
            shadowOffset: { width: 0, height: 3 },
            shadowOpacity: 0.35,
            shadowRadius: 6,
            elevation: 4,
          }}
        >
          <Ionicons name="send" size={18} color={colors.white} />
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container} className="bg-cream-200 border-t border-cream-300">
      <Pressable
        onPress={disabled ? undefined : onAttach}
        className="w-10 h-10 rounded-full bg-white items-center justify-center mr-2 border border-cream-300"
        accessibilityRole="button"
        accessibilityLabel={t('chat.attach')}
      >
        <Ionicons name="add" size={24} color={colors.ink[700]} />
      </Pressable>

      <View style={styles.inputWrap}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={t('chat.writeMessage')}
          placeholderTextColor={colors.ink[400]}
          style={styles.textInput}
          multiline
          editable={!disabled}
          underlineColorAndroid="transparent"
          selectionColor={colors.coral[500]}
          cursorColor={colors.coral[500]}
          autoCorrect
          textAlignVertical="top"
          includeFontPadding={false}
        />
        {!hasText ? (
          <Pressable
            onPress={disabled ? undefined : onPickImage}
            className="w-8 h-8 items-center justify-center ml-1"
            accessibilityRole="button"
            accessibilityLabel={t('chat.image')}
          >
            <Ionicons name="image-outline" size={22} color={colors.ink[400]} />
          </Pressable>
        ) : null}
      </View>

      {hasText ? (
        <Pressable
          onPress={onSend}
          className="ml-2 w-11 h-11 rounded-full bg-coral-500 items-center justify-center"
          accessibilityRole="button"
          accessibilityLabel={t('chat.send')}
          style={{
            shadowColor: colors.coral[600],
            shadowOffset: { width: 0, height: 3 },
            shadowOpacity: 0.35,
            shadowRadius: 6,
            elevation: 4,
          }}
        >
          <Ionicons name="send" size={18} color={colors.white} />
        </Pressable>
      ) : (
        <Pressable
          onPress={startRecording}
          onLongPress={startRecording}
          delayLongPress={150}
          disabled={disabled}
          className="ml-2 w-11 h-11 rounded-full bg-coral-500 items-center justify-center"
          accessibilityRole="button"
          accessibilityLabel={t('chat.voice')}
          style={{
            shadowColor: colors.coral[600],
            shadowOffset: { width: 0, height: 3 },
            shadowOpacity: 0.35,
            shadowRadius: 6,
            elevation: 4,
            opacity: disabled ? 0.5 : 1,
          }}
        >
          <Ionicons name="mic" size={20} color={colors.white} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 10 : 8,
  },
  inputWrap: {
    flex: 1,
    flexDirection: 'row',
    // Bottom-align so the action icon hugs the last line of typed text;
    // crucially we do NOT use `items-center` here — combined with a
    // multiline TextInput on Android that causes the typed text to be
    // clipped above the visible area when it grows past one line.
    alignItems: 'flex-end',
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.cream[300],
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 6 : 4,
    minHeight: 48,
    maxHeight: 140,
  },
  textInput: {
    flex: 1,
    color: colors.ink[700],
    fontSize: 16,
    // No explicit lineHeight here — on Android, lineHeight combined with
    // multiline and `includeFontPadding: false` can cause the cursor and
    // typed glyphs to render outside the input bounds. Let the platform
    // pick a sensible default.
    paddingTop: Platform.OS === 'ios' ? 8 : 6,
    paddingBottom: Platform.OS === 'ios' ? 8 : 6,
    paddingHorizontal: 4,
    minHeight: 36,
    maxHeight: 120,
  },
});
