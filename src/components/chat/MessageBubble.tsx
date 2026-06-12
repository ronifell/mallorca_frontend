import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Image, Text, View } from 'react-native';
import { Message } from '../../api/types';
import { Avatar } from '../Avatar';
import { colors } from '../../theme/colors';
import { resolveMediaUrl } from '../../utils/mediaUrl';
import { VoiceMessagePlayer } from './VoiceMessagePlayer';

interface Props {
  message: Message;
  mine: boolean;
  showAvatar: boolean;
  otherName?: string | null;
  otherPhoto?: string | null;
  showMeta?: boolean;
  timeLabel?: string;
}

export function MessageBubble({
  message,
  mine,
  showAvatar,
  otherName,
  otherPhoto,
  showMeta,
  timeLabel,
}: Props) {
  return (
    <View className={`flex-row mb-3 ${mine ? 'justify-end' : 'justify-start'}`}>
      {!mine && showAvatar ? (
        <View className="mr-2 self-end">
          <Avatar uri={otherPhoto} name={otherName} size={32} />
        </View>
      ) : !mine ? (
        <View className="w-8 mr-2" />
      ) : null}

      <View className={`max-w-[78%] ${mine ? 'items-end' : 'items-start'}`}>
        {mine && showMeta && timeLabel ? (
          <View className="flex-row items-center mb-1 mr-1">
            {message.readAt ? (
              <Ionicons name="checkmark-done" size={14} color={colors.coral[500]} style={{ marginRight: 4 }} />
            ) : message.deliveredAt ? (
              <Ionicons name="checkmark-done" size={14} color={colors.ink[400]} style={{ marginRight: 4 }} />
            ) : (
              <Ionicons name="checkmark" size={14} color={colors.ink[400]} style={{ marginRight: 4 }} />
            )}
            <Text className="text-ink-400 text-xs">{timeLabel}</Text>
          </View>
        ) : null}

        <View
          className={`px-3.5 py-2.5 rounded-2xl ${
            mine
              ? 'bg-coral-100 rounded-br-md'
              : 'bg-white rounded-bl-md border border-cream-300'
          }`}
          style={
            mine
              ? undefined
              : {
                  shadowColor: '#3D2618',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.04,
                  shadowRadius: 3,
                  elevation: 1,
                }
          }
        >
          {message.type === 'image' && message.imageUrl ? (
            <Image
              source={{ uri: resolveMediaUrl(message.imageUrl) }}
              className="w-52 h-52 rounded-xl"
              resizeMode="cover"
            />
          ) : message.type === 'audio' && message.audioUrl ? (
            <VoiceMessagePlayer
              audioUrl={message.audioUrl}
              durationSeconds={message.audioDuration}
              mine={mine}
            />
          ) : (
            <Text className="text-ink-700 text-base leading-5">{message.text}</Text>
          )}
        </View>

        {!mine && showMeta && timeLabel ? (
          <Text className="text-ink-400 text-xs mt-1 ml-1">{timeLabel}</Text>
        ) : null}
      </View>
    </View>
  );
}
