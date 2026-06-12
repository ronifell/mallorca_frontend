import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { CompositeNavigationProp, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, RefreshControl, Text, View } from 'react-native';
import { matchesApi, usersApi } from '../../api/endpoints';
import { Match } from '../../api/types';
import { Screen } from '../../components/Screen';
import { MatchConversationRow } from '../../components/social/MatchConversationRow';
import { SocialBrandHeader } from '../../components/social/SocialBrandHeader';
import { SocialPageTitle } from '../../components/social/SocialPageTitle';
import { SocialSearchBar } from '../../components/social/SocialSearchBar';
import { MainTabParamList, RootStackParamList } from '../../navigation/types';
import { buildConversationParams } from '../../utils/openConversation';

type Nav = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Chat'>,
  NativeStackNavigationProp<RootStackParamList>
>;

function sortMatches(items: Match[]): Match[] {
  return [...items].sort((a, b) => {
    const aTime = a.lastMessage?.createdAt ?? a.matchedAt;
    const bTime = b.lastMessage?.createdAt ?? b.matchedAt;
    return bTime.localeCompare(aTime);
  });
}

export function ChatListScreen() {
  const { t } = useTranslation();
  const nav = useNavigation<Nav>();
  const [search, setSearch] = useState('');

  const { data: me } = useQuery({ queryKey: ['me'], queryFn: () => usersApi.me() });
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['matches'],
    queryFn: () => matchesApi.list(),
  });

  const conversations = useMemo(() => {
    const withMessages = (data ?? []).filter((m) => m.hasConversation);
    const query = search.trim().toLowerCase();
    const filtered = query
      ? withMessages.filter((m) => (m.otherUser.firstName ?? '').toLowerCase().includes(query))
      : withMessages;
    return sortMatches(filtered);
  }, [data, search]);

  const totalUnread = conversations.reduce((sum, m) => sum + m.unreadCount, 0);

  const open = async (match: Match) => {
    const params = await buildConversationParams(match);
    nav.navigate('Conversation', params);
  };

  return (
    <Screen padded={false}>
      <SocialBrandHeader
        onRightPress={() => nav.navigate('Matches')}
        showNotificationDot={totalUnread > 0}
      />

      <FlatList
        data={conversations}
        keyExtractor={(m) => m.matchId}
        style={{ backgroundColor: 'transparent' }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={isFetching && !isLoading} onRefresh={refetch} />}
        ListHeaderComponent={
          <View>
            <SocialPageTitle title={t('chat.pageTitle')} count={conversations.length} />
            <SocialSearchBar
              value={search}
              onChangeText={setSearch}
              placeholder={t('chat.searchPlaceholder')}
            />
          </View>
        }
        ListEmptyComponent={
          !isLoading ? (
            <View className="items-center justify-center py-16">
              <Text className="text-ink-400 text-center">{t('chat.empty')}</Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <MatchConversationRow match={item} myUserId={me?.id} onPress={() => open(item)} />
        )}
      />
    </Screen>
  );
}
