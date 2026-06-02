import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import { chatApi, matchesApi } from '../../api/endpoints';
import { Match } from '../../api/types';
import { Avatar } from '../../components/Avatar';
import { Screen } from '../../components/Screen';
import { RootStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

function formatTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const sameDay =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();
  return sameDay
    ? d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
    : d.toLocaleDateString();
}

export function ChatListScreen() {
  const { t } = useTranslation();
  const nav = useNavigation<Nav>();
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['matches'],
    queryFn: () => matchesApi.list(),
  });

  const conversations = (data ?? []).filter((m) => m.hasConversation);

  const open = async (m: Match) => {
    const conv = m.conversationId
      ? { id: m.conversationId }
      : await chatApi.ensureConversation(m.matchId);
    nav.navigate('Conversation', {
      conversationId: conv.id,
      otherName: m.otherUser.firstName,
      otherUserId: m.otherUser.id,
    });
  };

  return (
    <Screen padded={false}>
      <FlatList
        data={conversations}
        keyExtractor={(m) => m.matchId}
        refreshControl={<RefreshControl refreshing={isFetching && !isLoading} onRefresh={refetch} />}
        ListEmptyComponent={
          !isLoading ? (
            <View className="items-center justify-center px-5 py-16">
              <Text className="text-ink-400">{t('chat.empty')}</Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => open(item)}
            className="flex-row items-center px-5 py-3"
          >
            <Avatar uri={item.otherUser.coverPhoto} name={item.otherUser.firstName} />
            <View className="flex-1 ml-3">
              <View className="flex-row items-center">
                <Text className="text-ink-700 font-bold flex-1">
                  {item.otherUser.firstName ?? '—'}
                </Text>
                {item.lastMessage ? (
                  <Text className="text-ink-400 text-xs">
                    {formatTime(item.lastMessage.createdAt)}
                  </Text>
                ) : null}
              </View>
              <View className="flex-row items-center mt-0.5">
                <Text className="text-ink-400 flex-1" numberOfLines={1}>
                  {item.lastMessage?.type === 'image'
                    ? `🖼 ${t('chat.image')}`
                    : item.lastMessage?.text ?? ''}
                </Text>
                {item.unreadCount > 0 ? (
                  <View className="bg-brand-500 rounded-full px-2 py-0.5 ml-2 min-w-[20px] items-center">
                    <Text className="text-white text-xs font-bold">{item.unreadCount}</Text>
                  </View>
                ) : null}
              </View>
            </View>
          </Pressable>
        )}
      />
    </Screen>
  );
}
