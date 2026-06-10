import { useQuery, useQueryClient } from '@tanstack/react-query';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Pressable, Text, View } from 'react-native';
import { moderationApi } from '../../api/endpoints';
import { Avatar } from '../../components/Avatar';
import { Screen } from '../../components/Screen';

export function BlockedUsersScreen() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['blocks'],
    queryFn: () => moderationApi.listBlocks(),
  });

  const unblock = async (id: string) => {
    await moderationApi.unblock(id);
    qc.invalidateQueries({ queryKey: ['blocks'] });
  };

  return (
    <Screen padded={false}>
      <FlatList
        data={data ?? []}
        keyExtractor={(b) => b.id}
        style={{ backgroundColor: 'transparent' }}
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={
          !isLoading ? (
            <View className="items-center py-10">
              <Text className="text-ink-400">—</Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <View className="flex-row items-center bg-white rounded-2xl p-3 mb-2">
            <Avatar name={item.firstName} />
            <Text className="text-ink-700 font-semibold ml-3 flex-1">
              {item.firstName ?? '—'}
            </Text>
            <Pressable
              onPress={() => unblock(item.userId)}
              className="bg-cream-300 rounded-pill px-4 py-2"
            >
              <Text className="text-ink-700 font-semibold">{t('moderation.unblock')}</Text>
            </Pressable>
          </View>
        )}
      />
    </Screen>
  );
}
