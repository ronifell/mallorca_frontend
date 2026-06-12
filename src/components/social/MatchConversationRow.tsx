import React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';
import { Match } from '../../api/types';
import { Avatar } from '../Avatar';
import { formatRelativeTime } from '../../utils/formatRelativeTime';

interface Props {
  match: Match;
  myUserId?: string;
  onPress: () => void;
}

function formatPreview(match: Match, myUserId: string | undefined, t: (key: string) => string): string {
  if (!match.lastMessage) {
    return match.hasConversation ? '' : t('matches.newMatch');
  }
  const prefix = match.lastMessage.senderId === myUserId ? `${t('chat.youPrefix')} ` : '';
  if (match.lastMessage.type === 'image') {
    return `${prefix}🖼 ${t('chat.image')}`;
  }
  if (match.lastMessage.type === 'audio') {
    return `${prefix}🎙 ${t('chat.voice')}`;
  }
  const text = match.lastMessage.text ?? '';
  if (match.lastMessage.senderId === myUserId) {
    return `${t('chat.youPrefix')} ${text}`;
  }
  return text;
}

function isRecentlyActive(match: Match): boolean {
  if (!match.lastMessage) return !match.hasConversation;
  const diffMs = Date.now() - new Date(match.lastMessage.createdAt).getTime();
  return diffMs < 15 * 60 * 1000;
}

export function MatchConversationRow({ match, myUserId, onPress }: Props) {
  const { t } = useTranslation();
  const name = match.otherUser.firstName ?? '—';
  const age = match.otherUser.age;
  const displayName = age != null ? `${name}, ${age}` : name;
  const preview = formatPreview(match, myUserId, t);
  const timeLabel = match.lastMessage
    ? formatRelativeTime(match.lastMessage.createdAt, t)
    : formatRelativeTime(match.matchedAt, t);

  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center px-4 py-3.5 mb-3 bg-white rounded-2xl border border-cream-300"
      style={{
        shadowColor: '#3D2618',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 1,
      }}
    >
      <View>
        <Avatar uri={match.otherUser.coverPhoto} name={match.otherUser.firstName} size={58} />
        {isRecentlyActive(match) ? (
          <View className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 rounded-full bg-success border-2 border-cream-200" />
        ) : null}
      </View>

      <View className="flex-1 ml-3.5 mr-2">
        <Text className="text-ink-700 font-bold text-base">{displayName}</Text>
        <Text className="text-ink-400 text-sm mt-0.5" numberOfLines={1}>
          {preview}
        </Text>
      </View>

      <View className="items-end min-w-[52px]">
        <Text className="text-ink-400 text-xs">{timeLabel}</Text>
        {match.unreadCount > 0 ? (
          <View className="bg-coral-500 rounded-full min-w-[22px] h-[22px] px-1.5 items-center justify-center mt-1.5">
            <Text className="text-white text-xs font-bold">{match.unreadCount}</Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}
