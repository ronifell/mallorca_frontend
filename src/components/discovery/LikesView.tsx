import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  Text,
  View,
} from 'react-native';
import { discoveryApi } from '../../api/endpoints';
import { LikedUser } from '../../api/types';
import { isSpecialCityValue, resolveCityLabel } from '../../config/cityOptions';
import { RootStackParamList } from '../../navigation/types';
import { useMatchPopup } from '../../store/matchPopup';
import { colors } from '../../theme/colors';
import { resolveMediaUrl } from '../../utils/mediaUrl';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Tab = 'received' | 'sent';

interface RowProps {
  user: LikedUser;
  variant: Tab;
  busy: boolean;
  onOpen: () => void;
  onAction: () => void;
}

function LikeRow({ user, variant, busy, onOpen, onAction }: RowProps) {
  const { t } = useTranslation();
  const cover = resolveMediaUrl(user.photos[0]?.url);
  const cityLabel = resolveCityLabel(user.city, t);
  const cityLine = cityLabel
    ? isSpecialCityValue(user.city)
      ? cityLabel
      : cityLabel.toLowerCase().includes('mallorca')
        ? cityLabel
        : `${cityLabel}, Mallorca`
    : null;

  const actionAccessibilityLabel =
    variant === 'received' ? t('discovery.likeBack') : t('discovery.unlike');

  return (
    <Pressable
      onPress={onOpen}
      className="flex-row items-center bg-white rounded-2xl px-3 py-3 mb-3"
      style={{
        shadowColor: '#3D2618',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
      }}
    >
      {cover ? (
        <Image
          source={{ uri: cover }}
          style={{ width: 64, height: 64, borderRadius: 16, backgroundColor: colors.cream[300] }}
          resizeMode="cover"
        />
      ) : (
        <View
          style={{
            width: 64,
            height: 64,
            borderRadius: 16,
            backgroundColor: colors.cream[300],
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="person" size={28} color={colors.cream[400]} />
        </View>
      )}

      <View className="flex-1 ml-3 pr-2">
        <View className="flex-row items-center flex-wrap">
          <Text className="text-ink-700 text-base font-bold">
            {user.firstName ?? '—'}
            {user.age ? `, ${user.age}` : ''}
          </Text>
          {user.isPremium ? (
            <View
              className="ml-2 flex-row items-center rounded-full px-1.5 py-0.5"
              style={{ backgroundColor: colors.coral[500] }}
            >
              <Ionicons name="ribbon" size={10} color="#FFFFFF" />
            </View>
          ) : null}
          {variant === 'received' && user.isSuperLike ? (
            <View
              className="ml-2 flex-row items-center rounded-full px-1.5 py-0.5"
              style={{ backgroundColor: '#F5B301' }}
            >
              <Ionicons name="star" size={10} color="#FFFFFF" />
            </View>
          ) : null}
        </View>
        {cityLine ? (
          <View className="flex-row items-center mt-1">
            <Ionicons name="location-outline" size={12} color={colors.ink[400]} />
            <Text className="text-ink-400 text-xs ml-1" numberOfLines={1}>
              {cityLine}
            </Text>
          </View>
        ) : null}
      </View>

      <Pressable
        onPress={onAction}
        disabled={busy}
        accessibilityRole="button"
        accessibilityLabel={actionAccessibilityLabel}
        className="w-11 h-11 rounded-full items-center justify-center"
        style={{
          backgroundColor:
            variant === 'received' ? colors.coral[500] : colors.coral[50],
          opacity: busy ? 0.5 : 1,
        }}
      >
        {busy && variant === 'received' ? (
          <ActivityIndicator color="#FFFFFF" size="small" />
        ) : (
          <Ionicons
            name={variant === 'received' ? 'heart' : 'close'}
            size={variant === 'received' ? 20 : 22}
            color={variant === 'received' ? '#FFFFFF' : colors.coral[500]}
          />
        )}
      </Pressable>
    </Pressable>
  );
}

function SegmentButton({
  label,
  active,
  onPress,
  count,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  count?: number;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      className={`flex-1 flex-row items-center justify-center py-2.5 rounded-pill ${
        active ? 'bg-coral-500' : ''
      }`}
    >
      <Text
        className={`font-semibold text-sm ${active ? 'text-white' : 'text-ink-400'}`}
      >
        {label}
      </Text>
      {typeof count === 'number' && count > 0 ? (
        <View
          className={`ml-1.5 rounded-full px-1.5 py-0.5 ${active ? 'bg-white/25' : 'bg-coral-50'}`}
        >
          <Text
            className={`text-[10px] font-bold ${active ? 'text-white' : 'text-coral-500'}`}
          >
            {count}
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
}

/**
 * Two-tab list of likes:
 *   - "Received" — users who liked the viewer but have not yet matched
 *   - "Sent"     — users the viewer has liked but have not yet matched
 *
 * Tapping a row opens the candidate's full profile. From a Received row the
 * coral heart button likes them back (creating the match instantly because
 * the reciprocal like already exists). From a Sent row the X button cancels
 * the like (after confirmation).
 */
export function LikesView() {
  const { t } = useTranslation();
  const nav = useNavigation<Nav>();
  const qc = useQueryClient();
  const showMatchPopup = useMatchPopup((s) => s.show);
  const [tab, setTab] = useState<Tab>('received');
  const [busyId, setBusyId] = useState<string | null>(null);

  const received = useQuery({
    queryKey: ['likes', 'received'],
    queryFn: () => discoveryApi.receivedLikes(),
  });
  const sent = useQuery({
    queryKey: ['likes', 'sent'],
    queryFn: () => discoveryApi.sentLikes(),
  });

  const active = tab === 'received' ? received : sent;
  const items = active.data ?? [];

  const openProfile = (user: LikedUser) => {
    nav.navigate('CandidateProfile', { candidate: user });
  };

  const invalidateLikes = () => {
    qc.invalidateQueries({ queryKey: ['likes'] });
    qc.invalidateQueries({ queryKey: ['feed'] });
    qc.invalidateQueries({ queryKey: ['matches'] });
  };

  const handleLikeBack = async (user: LikedUser) => {
    if (busyId) return;
    setBusyId(user.id);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => undefined);
    try {
      const res = await discoveryApi.like(user.id);
      invalidateLikes();
      // Surface the match via the global celebration modal instead of a
      // native Alert. The Alert would overlay the MatchModal (already
      // triggered from the `match:new` socket event) with a plain white
      // system dialog. Calling `showMatchPopup` is a no-op when the socket
      // path already fired thanks to dedup on matchId.
      if (res.matched && res.matchId) {
        showMatchPopup({
          matchId: res.matchId,
          otherUser: {
            id: user.id,
            firstName: user.firstName,
            photo: user.photos[0]?.url ?? null,
          },
        });
      }
    } catch {
      Alert.alert(t('common.error'), t('discovery.retryFailed'));
    } finally {
      setBusyId(null);
    }
  };

  const handleUnlike = (user: LikedUser) => {
    Alert.alert(t('discovery.unlike'), t('discovery.unlikeConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('discovery.unlike'),
        style: 'destructive',
        onPress: async () => {
          if (busyId) return;
          setBusyId(user.id);
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
          try {
            await discoveryApi.unlike(user.id);
            invalidateLikes();
          } catch {
            Alert.alert(t('common.error'), t('discovery.retryFailed'));
          } finally {
            setBusyId(null);
          }
        },
      },
    ]);
  };

  const onRefresh = () => {
    received.refetch();
    sent.refetch();
  };

  const isLoading = active.isLoading;
  const isFetching = received.isFetching || sent.isFetching;

  const emptyKey = tab === 'received' ? 'discovery.likedYouEmpty' : 'discovery.yourLikesEmpty';

  return (
    <View className="flex-1">
      <View className="mx-5 mb-4 p-1 bg-white rounded-pill flex-row border border-cream-300">
        <SegmentButton
          label={t('discovery.likesReceived')}
          active={tab === 'received'}
          count={received.data?.length}
          onPress={() => setTab('received')}
        />
        <SegmentButton
          label={t('discovery.likesSent')}
          active={tab === 'sent'}
          count={sent.data?.length}
          onPress={() => setTab('sent')}
        />
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center px-5">
          <Text className="text-ink-400">{t('discovery.loadingLikes')}</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(u) => `${tab}-${u.id}`}
          style={{ backgroundColor: 'transparent' }}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}
          refreshControl={
            <RefreshControl
              refreshing={isFetching && !isLoading}
              onRefresh={onRefresh}
              tintColor={colors.coral[500]}
            />
          }
          ListEmptyComponent={
            <View className="items-center justify-center py-16 px-4">
              <View
                className="w-16 h-16 rounded-full items-center justify-center mb-3"
                style={{ backgroundColor: colors.coral[50] }}
              >
                <Ionicons name="heart-outline" size={28} color={colors.coral[500]} />
              </View>
              <Text className="text-ink-400 text-center">{t(emptyKey)}</Text>
            </View>
          }
          renderItem={({ item }) => (
            <LikeRow
              user={item}
              variant={tab}
              busy={busyId === item.id}
              onOpen={() => openProfile(item)}
              onAction={() =>
                tab === 'received' ? handleLikeBack(item) : handleUnlike(item)
              }
            />
          )}
        />
      )}
    </View>
  );
}
