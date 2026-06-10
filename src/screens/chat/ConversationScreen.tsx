import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, FlatList, Pressable, Text, View } from 'react-native';
import { Socket } from 'socket.io-client';
import { extractErrorMessage } from '../../api/client';
import { chatApi, usersApi } from '../../api/endpoints';
import { Message } from '../../api/types';
import { ChatDateSeparator } from '../../components/chat/ChatDateSeparator';
import { ConversationHeader } from '../../components/chat/ConversationHeader';
import { ConversationInputBar } from '../../components/chat/ConversationInputBar';
import { MessageBubble } from '../../components/chat/MessageBubble';
import { PremiumConversationBanner } from '../../components/chat/PremiumConversationBanner';
import { Screen } from '../../components/Screen';
import { RootStackParamList } from '../../navigation/types';
import { connectSocket } from '../../services/socket';

type Props = NativeStackScreenProps<RootStackParamList, 'Conversation'>;

type ChatRow =
  | { kind: 'date'; id: string; label: string }
  | {
      kind: 'message';
      id: string;
      message: Message;
      showAvatar: boolean;
      showMeta: boolean;
      timeLabel: string;
    };

function dateLabel(iso: string, t: (key: string) => string): string {
  const date = new Date(iso);
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);

  const sameDay =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();
  if (sameDay) return t('chat.today');

  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();
  if (isYesterday) return t('chat.yesterday');

  return date.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
}

function formatMessageTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

function buildChatRows(messages: Message[], t: (key: string) => string): ChatRow[] {
  const sorted = [...messages].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const rows: ChatRow[] = [];
  let lastDateKey = '';

  sorted.forEach((message, index) => {
    const dateKey = message.createdAt.slice(0, 10);
    if (dateKey !== lastDateKey) {
      rows.push({
        kind: 'date',
        id: `date-${dateKey}`,
        label: dateLabel(message.createdAt, t),
      });
      lastDateKey = dateKey;
    }

    const prev = sorted[index - 1];
    const next = sorted[index + 1];
    const showAvatar = !prev || prev.senderId !== message.senderId;
    const showMeta = !next || next.senderId !== message.senderId;

    rows.push({
      kind: 'message',
      id: message.id,
      message,
      showAvatar,
      showMeta,
      timeLabel: formatMessageTime(message.createdAt),
    });
  });

  return rows;
}

export function ConversationScreen({ route, navigation }: Props) {
  const { t } = useTranslation();
  const { conversationId, otherName, otherUserAge, otherUserPhoto } = route.params;

  const { data: me } = useQuery({ queryKey: ['me'], queryFn: () => usersApi.me() });
  const myId = me?.id;

  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [otherTyping, setOtherTyping] = useState(false);
  const [premiumBlocked, setPremiumBlocked] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const listRef = useRef<FlatList<ChatRow>>(null);

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
        setMessages((prev) => {
          if (prev.some((x) => x.id === m.id)) return prev;
          // If this is the echo of a message we just sent, replace the
          // matching optimistic placeholder so we don't render duplicates.
          if (m.senderId === myId) {
            const idx = prev.findIndex(
              (x) =>
                x.id.startsWith('temp-') &&
                x.senderId === m.senderId &&
                x.type === m.type &&
                (x.text ?? '') === (m.text ?? '') &&
                (x.imageUrl ?? '') === (m.imageUrl ?? ''),
            );
            if (idx >= 0) {
              const next = prev.slice();
              next[idx] = m;
              return next;
            }
          }
          return [...prev, m];
        });
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

  const makeTempId = () =>
    `temp-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

  const reconcileOptimistic = (tempId: string, msg: Message) => {
    setMessages((prev) => {
      const withoutTemp = prev.filter((m) => m.id !== tempId);
      if (withoutTemp.some((m) => m.id === msg.id)) return withoutTemp;
      return [...withoutTemp, msg];
    });
  };

  const removeOptimistic = (tempId: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== tempId));
  };

  const send = async () => {
    const trimmed = text.trim();
    if (!trimmed || !myId) return;

    const tempId = makeTempId();
    const optimistic: Message = {
      id: tempId,
      senderId: myId,
      type: 'text',
      text: trimmed,
      imageUrl: null,
      deliveredAt: null,
      readAt: null,
      createdAt: new Date().toISOString(),
      conversationId,
    };
    setMessages((prev) => [...prev, optimistic]);
    setText('');

    try {
      const msg = await chatApi.send(conversationId, { type: 'text', text: trimmed });
      reconcileOptimistic(tempId, msg);
    } catch (e) {
      removeOptimistic(tempId);
      setText(trimmed);
      const errMsg = extractErrorMessage(e);
      if (errMsg.toLowerCase().includes('premium')) {
        setPremiumBlocked(true);
      } else {
        Alert.alert(t('common.error'), errMsg);
      }
    }
  };

  const sendImage = async () => {
    if (!myId) return;
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
    });
    if (res.canceled || !res.assets[0]) return;

    const tempId = makeTempId();
    const localUri = res.assets[0].uri;
    const optimistic: Message = {
      id: tempId,
      senderId: myId,
      type: 'image',
      text: null,
      imageUrl: localUri,
      deliveredAt: null,
      readAt: null,
      createdAt: new Date().toISOString(),
      conversationId,
    };
    setMessages((prev) => [...prev, optimistic]);

    try {
      const { url } = await chatApi.uploadImage(conversationId, res.assets[0]);
      const msg = await chatApi.send(conversationId, { type: 'image', imageUrl: url });
      reconcileOptimistic(tempId, msg);
    } catch (e) {
      removeOptimistic(tempId);
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

  const chatRows = useMemo(() => buildChatRows(messages, t), [messages, t]);
  const inputDisabled = premiumBlocked;
  const isPremium = me?.isPremium ?? false;

  return (
    <Screen padded={false} edges={['bottom']}>
      <ConversationHeader
        otherName={otherName}
        otherUserAge={otherUserAge}
        otherUserPhoto={otherUserPhoto}
        onBack={() => navigation.goBack()}
      />

      {isPremium && !premiumBlocked ? (
        <PremiumConversationBanner onPress={() => navigation.navigate('Premium')} />
      ) : null}

      <FlatList
        ref={listRef}
        data={chatRows}
        keyExtractor={(row) => row.id}
        className="flex-1"
        style={{ backgroundColor: 'transparent' }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12, paddingBottom: 8 }}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
        renderItem={({ item }) => {
          if (item.kind === 'date') {
            return <ChatDateSeparator label={item.label} />;
          }

          const mine = item.message.senderId === myId;
          return (
            <MessageBubble
              message={item.message}
              mine={mine}
              showAvatar={!mine && item.showAvatar}
              otherName={otherName}
              otherPhoto={otherUserPhoto}
              showMeta={item.showMeta}
              timeLabel={item.timeLabel}
            />
          );
        }}
        ListFooterComponent={
          otherTyping ? (
            <View className="flex-row mb-3">
              <View className="w-8 mr-2" />
              <View className="bg-white border border-cream-300 px-3 py-2 rounded-2xl rounded-bl-md">
                <Text className="text-ink-400 italic">{t('chat.typing')}</Text>
              </View>
            </View>
          ) : null
        }
      />

      {premiumBlocked ? (
        <View className="bg-coral-50 border-t border-coral-100 px-5 py-4">
          <Text className="text-coral-600 mb-2 text-center">{t('chat.premiumRequired')}</Text>
          <Pressable
            onPress={() => navigation.navigate('Premium')}
            className="bg-coral-500 py-3 rounded-2xl items-center"
          >
            <Text className="text-white font-semibold">{t('chat.upgrade')}</Text>
          </Pressable>
        </View>
      ) : null}

      <ConversationInputBar
        value={text}
        onChangeText={onChangeText}
        onSend={send}
        onAttach={sendImage}
        onPickImage={sendImage}
        disabled={inputDisabled}
      />
    </Screen>
  );
}
