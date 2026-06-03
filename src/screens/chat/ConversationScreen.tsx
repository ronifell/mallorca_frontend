import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  FlatList,
  Image,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Socket } from 'socket.io-client';
import { extractErrorMessage } from '../../api/client';
import { chatApi, usersApi } from '../../api/endpoints';
import { Message } from '../../api/types';
import { Screen } from '../../components/Screen';
import { RootStackParamList } from '../../navigation/types';
import { connectSocket } from '../../services/socket';
import { colors } from '../../theme/colors';
import { resolveMediaUrl } from '../../utils/mediaUrl';

type Props = NativeStackScreenProps<RootStackParamList, 'Conversation'>;

export function ConversationScreen({ route, navigation }: Props) {
  const { t } = useTranslation();
  const { conversationId } = route.params;

  const { data: me } = useQuery({ queryKey: ['me'], queryFn: () => usersApi.me() });
  const myId = me?.id;

  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [otherTyping, setOtherTyping] = useState(false);
  const [premiumBlocked, setPremiumBlocked] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const listRef = useRef<FlatList<Message>>(null);

  const loadInitial = useCallback(async () => {
    try {
      const msgs = await chatApi.list(conversationId);
      setMessages(msgs);
      chatApi.markRead(conversationId).catch(() => undefined);
    } catch (e) {
      Alert.alert(t('common.error'), extractErrorMessage(e));
    }
  }, [conversationId, t]);

  useEffect(() => {
    loadInitial();
  }, [loadInitial]);

  useEffect(() => {
    let active = true;
    (async () => {
      const s = await connectSocket();
      if (!active || !s) return;
      socketRef.current = s;
      s.emit('conversation:join', conversationId);

      const onMessage = (m: Message & { conversationId?: string }) => {
        if (m.conversationId && m.conversationId !== conversationId) return;
        setMessages((prev) =>
          prev.some((x) => x.id === m.id) ? prev : [...prev, m],
        );
        chatApi.markRead(conversationId).catch(() => undefined);
      };
      const onTyping = (p: { conversationId: string; userId: string; typing: boolean }) => {
        if (p.conversationId !== conversationId) return;
        if (p.userId === myId) return;
        setOtherTyping(p.typing);
      };
      const onRead = (p: { conversationId: string; readerId: string }) => {
        if (p.conversationId !== conversationId) return;
        if (p.readerId === myId) return;
        setMessages((prev) =>
          prev.map((m) =>
            m.senderId === myId && !m.readAt ? { ...m, readAt: new Date().toISOString() } : m,
          ),
        );
      };

      s.on('message:new', onMessage);
      s.on('typing', onTyping);
      s.on('message:read', onRead);

      return () => {
        s.off('message:new', onMessage);
        s.off('typing', onTyping);
        s.off('message:read', onRead);
        s.emit('conversation:leave', conversationId);
      };
    })();
    return () => {
      active = false;
    };
  }, [conversationId, myId]);

  useEffect(() => {
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);
  }, [messages.length]);

  const send = async () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    try {
      const msg = await chatApi.send(conversationId, { type: 'text', text: trimmed });
      setMessages((prev) => [...prev, msg]);
      setText('');
    } catch (e) {
      const msg = extractErrorMessage(e);
      if (msg.toLowerCase().includes('premium')) {
        setPremiumBlocked(true);
      } else {
        Alert.alert(t('common.error'), msg);
      }
    }
  };

  const sendImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
    });
    if (res.canceled || !res.assets[0]) return;
    try {
      const { url } = await chatApi.uploadImage(conversationId, res.assets[0].uri);
      const msg = await chatApi.send(conversationId, { type: 'image', imageUrl: url });
      setMessages((prev) => [...prev, msg]);
    } catch (e) {
      const errMsg = extractErrorMessage(e);
      if (errMsg.toLowerCase().includes('premium')) setPremiumBlocked(true);
      else Alert.alert(t('common.error'), errMsg);
    }
  };

  const onChangeText = (v: string) => {
    setText(v);
    if (!socketRef.current) return;
    socketRef.current.emit('typing', { conversationId, typing: true });
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      socketRef.current?.emit('typing', { conversationId, typing: false });
    }, 1500);
  };

  const sortedMessages = useMemo(
    () => [...messages].sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    [messages],
  );

  return (
    <Screen padded={false} edges={['top']}>
      <FlatList
        ref={listRef}
        data={sortedMessages}
        keyExtractor={(m) => m.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 8 }}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
        renderItem={({ item }) => {
          const mine = item.senderId === myId;
          const last = sortedMessages[sortedMessages.length - 1];
          return (
            <View className={`mb-2 max-w-[80%] ${mine ? 'self-end' : 'self-start'}`}>
              <View
                className={`px-3 py-2 rounded-2xl ${
                  mine
                    ? 'bg-brand-500 rounded-br-md'
                    : 'bg-white rounded-bl-md border border-cream-300'
                }`}
              >
                {item.type === 'image' && item.imageUrl ? (
                  <Image
                    source={{ uri: resolveMediaUrl(item.imageUrl) }}
                    className="w-48 h-48 rounded-xl"
                    resizeMode="cover"
                  />
                ) : (
                  <Text className={mine ? 'text-white' : 'text-ink-700'}>{item.text}</Text>
                )}
              </View>
              {mine && item.id === last?.id ? (
                <Text className="text-ink-400 text-xs mt-1 mr-1 self-end">
                  {item.readAt
                    ? `✓✓ ${t('chat.read')}`
                    : item.deliveredAt
                      ? '✓✓'
                      : '✓'}
                </Text>
              ) : null}
            </View>
          );
        }}
        ListFooterComponent={
          otherTyping ? (
            <View className="mb-2 self-start bg-white border border-cream-300 px-3 py-2 rounded-2xl rounded-bl-md">
              <Text className="text-ink-400 italic">{t('chat.typing')}</Text>
            </View>
          ) : null
        }
      />

      {premiumBlocked ? (
        <View className="bg-brand-50 border-t border-brand-100 px-5 py-4">
          <Text className="text-brand-600 mb-2 text-center">{t('chat.premiumRequired')}</Text>
          <Pressable
            onPress={() => navigation.navigate('Premium')}
            className="bg-brand-500 py-3 rounded-pill items-center"
          >
            <Text className="text-white font-semibold">{t('chat.upgrade')}</Text>
          </Pressable>
        </View>
      ) : null}

      <View className="flex-row items-end px-3 py-2 border-t border-cream-300 bg-cream-100">
        <Pressable
          onPress={sendImage}
          className="w-11 h-11 rounded-full bg-white items-center justify-center mr-2 border border-cream-300"
        >
          <Text className="text-brand-500 text-xl">＋</Text>
        </Pressable>
        <TextInput
          value={text}
          onChangeText={onChangeText}
          placeholder={t('chat.writeMessage')}
          placeholderTextColor={colors.ink[400]}
          className="flex-1 bg-white rounded-2xl px-4 py-3 text-ink-700 border border-cream-300 max-h-32"
          multiline
        />
        <Pressable
          onPress={send}
          className="ml-2 w-11 h-11 rounded-full bg-brand-500 items-center justify-center"
        >
          <Text className="text-white text-lg">➤</Text>
        </Pressable>
      </View>
    </Screen>
  );
}
