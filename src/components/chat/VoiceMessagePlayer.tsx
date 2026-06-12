import { Ionicons } from '@expo/vector-icons';
import { Audio, AVPlaybackStatus } from 'expo-av';
import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';
import { resolveMediaUrl } from '../../utils/mediaUrl';
import { colors } from '../../theme/colors';

interface Props {
  audioUrl: string;
  durationSeconds: number | null;
  mine: boolean;
}

function formatTime(totalSeconds: number): string {
  const safe = Math.max(0, Math.round(totalSeconds));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Inline audio playback control used for voice-message bubbles. Holds an
 * `Audio.Sound` instance for the lifetime of the component, scrubbing through
 * playback events to power a play/pause toggle and a time readout.
 */
export function VoiceMessagePlayer({ audioUrl, durationSeconds, mine }: Props) {
  const { t } = useTranslation();
  const soundRef = useRef<Audio.Sound | null>(null);
  const [loading, setLoading] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [positionMs, setPositionMs] = useState(0);
  const [durationMs, setDurationMs] = useState(
    durationSeconds ? Math.round(durationSeconds * 1000) : 0,
  );

  useEffect(() => {
    return () => {
      const s = soundRef.current;
      soundRef.current = null;
      s?.unloadAsync().catch(() => undefined);
    };
  }, []);

  const onStatus = (status: AVPlaybackStatus) => {
    if (!status.isLoaded) return;
    setPositionMs(status.positionMillis ?? 0);
    if (status.durationMillis) setDurationMs(status.durationMillis);
    setPlaying(status.isPlaying);
    if (status.didJustFinish) {
      setPositionMs(0);
      setPlaying(false);
      soundRef.current?.setPositionAsync(0).catch(() => undefined);
    }
  };

  const toggle = async () => {
    try {
      if (!soundRef.current) {
        setLoading(true);
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
        });
        const { sound } = await Audio.Sound.createAsync(
          { uri: resolveMediaUrl(audioUrl) ?? audioUrl },
          { shouldPlay: true },
          onStatus,
        );
        soundRef.current = sound;
        setLoading(false);
        return;
      }
      const status = await soundRef.current.getStatusAsync();
      if (!status.isLoaded) return;
      if (status.isPlaying) {
        await soundRef.current.pauseAsync();
      } else {
        await soundRef.current.playAsync();
      }
    } catch {
      setLoading(false);
    }
  };

  const totalSeconds = durationMs ? durationMs / 1000 : durationSeconds ?? 0;
  const remainingSeconds = playing
    ? Math.max(0, (durationMs - positionMs) / 1000)
    : totalSeconds;

  const progress = durationMs > 0 ? Math.min(1, positionMs / durationMs) : 0;

  const accent = mine ? colors.coral[600] : colors.coral[500];
  const trackBg = mine ? 'rgba(232, 85, 78, 0.18)' : 'rgba(122, 86, 64, 0.18)';
  const textColor = mine ? 'text-coral-700' : 'text-ink-700';

  return (
    <View className="flex-row items-center" style={{ minWidth: 180 }}>
      <Pressable
        onPress={toggle}
        accessibilityRole="button"
        accessibilityLabel={playing ? t('chat.voicePause') : t('chat.voicePlay')}
        className="w-9 h-9 rounded-full items-center justify-center mr-2.5"
        style={{ backgroundColor: accent }}
      >
        {loading ? (
          <Ionicons name="hourglass-outline" size={18} color={colors.white} />
        ) : (
          <Ionicons
            name={playing ? 'pause' : 'play'}
            size={18}
            color={colors.white}
            style={!playing ? { marginLeft: 2 } : undefined}
          />
        )}
      </Pressable>

      <View className="flex-1">
        <View
          style={{
            height: 4,
            borderRadius: 999,
            backgroundColor: trackBg,
            overflow: 'hidden',
          }}
        >
          <View
            style={{
              width: `${Math.round(progress * 100)}%`,
              height: '100%',
              backgroundColor: accent,
            }}
          />
        </View>
        <Text className={`text-xs mt-1 ${textColor}`}>
          {formatTime(remainingSeconds)}
        </Text>
      </View>
    </View>
  );
}
