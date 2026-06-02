import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Image, Pressable, RefreshControl, Text, View } from 'react-native';
import { chatApi, matchesApi } from '../../api/endpoints';
import { Match } from '../../api/types';
import { Avatar } from '../../components/Avatar';
import { Screen } from '../../components/Screen';
import { RootStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function MatchesScreen() {
  const { t } = useTranslation();
  const nav = useNavigation<Nav>();
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['matches'],
    queryFn: () => matchesApi.list(),
  });

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

  const matches = data ?? [];
  const newMatches = matches.filter((m) => !m.hasConversation);
  const conversations = matches.filter((m) => m.hasConversation);

  return (
    <Screen padded={false}>
      <FlatList
        data={conversations}
        ListHeaderComponent={
          <View className="px-5 pt-2 pb-3">
            {newMatches.length ? (
              <>
                <Text className="text-ink-700 font-bold mb-3 mt-1">{t('matches.newMatch')}</Text>
                <FlatList
                  horizontal
                  data={newMatches}
                  keyExtractor={(m) => m.matchId}
                  showsHorizontalScrollIndicator={false}
                  renderItem={({ item }) => (
                    <Pressable className="mr-3 items-center" onPress={() => open(item)}>
                      {item.otherUser.coverPhoto ? (
                        <Image
                          source={{ uri: item.otherUser.coverPhoto }}
                          className="w-20 h-28 rounded-2xl bg-cream-300"
                        />
                      ) : (
                        <View className="w-20 h-28 rounded-2xl bg-cream-300 items-center justify-center">
                          <Text className="text-2xl">♥</Text>
                        </View>
                      )}
                      <Text className="text-ink-700 mt-1 text-xs" numberOfLines={1}>
                        {item.otherUser.firstName ?? '—'}
                      </Text>
                    </Pressable>
                  )}
                />
                <View className="h-3" />
              </>
            ) : null}
            <Text className="text-ink-700 font-bold mt-2">{t('chat.title')}</Text>
          </View>
        }
        keyExtractor={(m) => m.matchId}
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={isFetching && !isLoading} onRefresh={refetch} />}
        ListEmptyComponent={
          !isLoading && !newMatches.length ? (
            <View className="items-center justify-center px-5 py-12">
              <Text className="text-ink-400 text-center">{t('matches.empty')}</Text>
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
                {item.unreadCount > 0 ? (
                  <View className="bg-brand-500 rounded-full px-2 py-0.5 ml-2">
                    <Text className="text-white text-xs font-bold">{item.unreadCount}</Text>
                  </View>
                ) : null}
              </View>
              <Text className="text-ink-400 mt-0.5" numberOfLines={1}>
                {item.lastMessage?.type === 'image'
                  ? `🖼 ${t('chat.image')}`
                  : item.lastMessage?.text ?? ''}
              </Text>
            </View>
          </Pressable>
        )}
      />
    </Screen>
  );
}
