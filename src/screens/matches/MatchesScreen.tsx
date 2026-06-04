import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { CompositeNavigationProp, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, FlatList, Image, Pressable, RefreshControl, Text, View } from 'react-native';
import { matchesApi, usersApi } from '../../api/endpoints';
import { Match } from '../../api/types';
import { Screen } from '../../components/Screen';
import { MatchConversationRow } from '../../components/social/MatchConversationRow';
import { SocialBrandHeader } from '../../components/social/SocialBrandHeader';
import { SocialPageTitle } from '../../components/social/SocialPageTitle';
import { SocialSearchBar } from '../../components/social/SocialSearchBar';
import { MainTabParamList, RootStackParamList } from '../../navigation/types';
import { resolveMediaUrl } from '../../utils/mediaUrl';

type Nav = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Matches'>,
  NativeStackNavigationProp<RootStackParamList>
>;

function sortMatches(items: Match[]): Match[] {
  return [...items].sort((a, b) => {
    const aTime = a.lastMessage?.createdAt ?? a.matchedAt;
    const bTime = b.lastMessage?.createdAt ?? b.matchedAt;
    return bTime.localeCompare(aTime);
  });
}

export function MatchesScreen() {
  const { t } = useTranslation();
  const nav = useNavigation<Nav>();
  const [search, setSearch] = useState('');

  const { data: me } = useQuery({ queryKey: ['me'], queryFn: () => usersApi.me() });
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['matches'],
    queryFn: () => matchesApi.list(),
  });

  const matches = data ?? [];
  const newMatches = matches.filter((m) => !m.hasConversation);
  const allMatches = useMemo(() => {
    const query = search.trim().toLowerCase();
    const filtered = query
      ? matches.filter((m) => (m.otherUser.firstName ?? '').toLowerCase().includes(query))
      : matches;
    return sortMatches(filtered);
  }, [matches, search]);

  const totalUnread = matches.reduce((sum, m) => sum + m.unreadCount, 0);

  const openProfile = (match: Match) => {
    nav.navigate('MatchProfile', { matchId: match.matchId });
  };

  return (
    <Screen padded={false} background="onboarding">
      <SocialBrandHeader
        onLeftPress={() => Alert.alert(t('matches.filters'), t('matches.filterComingSoon'))}
        onRightPress={() => nav.navigate('Chat')}
        showNotificationDot={totalUnread > 0}
      />

      <FlatList
        data={allMatches}
        keyExtractor={(m) => m.matchId}
        style={{ backgroundColor: 'transparent' }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={isFetching && !isLoading} onRefresh={refetch} />}
        ListHeaderComponent={
          <View>
            <SocialPageTitle title={t('matches.pageTitle')} count={matches.length} />
            <SocialSearchBar
              value={search}
              onChangeText={setSearch}
              placeholder={t('matches.searchPlaceholder')}
            />

            {newMatches.length ? (
              <>
                <Text className="text-ink-700 font-bold mb-3">{t('matches.newMatch')}</Text>
                <FlatList
                  horizontal
                  data={newMatches}
                  keyExtractor={(m) => m.matchId}
                  showsHorizontalScrollIndicator={false}
                  className="mb-4"
                  renderItem={({ item }) => (
                    <Pressable className="mr-3 items-center" onPress={() => openProfile(item)}>
                      {item.otherUser.coverPhoto ? (
                        <Image
                          source={{ uri: resolveMediaUrl(item.otherUser.coverPhoto) }}
                          className="w-20 h-28 rounded-2xl bg-cream-300"
                        />
                      ) : (
                        <View className="w-20 h-28 rounded-2xl bg-cream-300 items-center justify-center">
                          <Text className="text-2xl text-coral-500">♥</Text>
                        </View>
                      )}
                      <Text className="text-ink-700 mt-1.5 text-xs font-semibold" numberOfLines={1}>
                        {item.otherUser.firstName ?? '—'}
                      </Text>
                    </Pressable>
                  )}
                />
              </>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          !isLoading ? (
            <View className="items-center justify-center py-12">
              <Text className="text-ink-400 text-center">{t('matches.empty')}</Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <MatchConversationRow
            match={item}
            myUserId={me?.id}
            onPress={() => openProfile(item)}
          />
        )}
      />
    </Screen>
  );
}
