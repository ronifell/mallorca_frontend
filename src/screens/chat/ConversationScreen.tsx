import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  Dimensions,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  View,
} from 'react-native';
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
import { useTopScreenPadding } from '../../hooks/useTopScreenPadding';
import { RootStackParamList } from '../../navigation/types';
import { connectSocket } from '../../services/socket';
import { RecordingResult } from '../../services/voiceRecorder';
import { useContentFilter } from '../../hooks/useContentFilter';
import { createFilteredChangeHandler, extractContentBlockedMessage } from '../../utils/contentFilterHelpers';
import { useAuthStore } from '../../store/auth';
import { useMatchPopup } from '../../store/matchPopup';

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
  const { check: checkContent } = useContentFilter();
  const { conversationId, otherName, otherUserAge, otherUserPhoto } = route.params;

  const { data: me } = useQuery({ queryKey: ['me'], queryFn: () => usersApi.me() });
  const myId = me?.id;
  // Read Premium status from the auth store too. The store is updated
  // synchronously the moment a purchase succeeds (PremiumScreen calls
  // `patchUser({ isPremium })`), so the banner clears without waiting for
  // the React Query refetch of /users/me to finish.
  const authIsPremium = useAuthStore((s) => s.user?.isPremium ?? false);
  const isPremium = authIsPremium || (me?.isPremium ?? false);

  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [otherTyping, setOtherTyping] = useState(false);
  const [premiumBlocked, setPremiumBlocked] = useState(false);
  // Manual keyboard-height fallback for Android. The Stack.Navigator sets
  // `statusBarTranslucent: true`, which causes the activity to extend
  // behind the system bars and makes `windowSoftInputMode=adjustResize`
  // unreliable in Expo Go — the input bar can be left hidden behind the
  // keyboard. We listen to Keyboard events ourselves and apply the
  // measured height as bottom padding only when the system has not
  // already shrunk the visible window (compared to the screen).
  const [androidKeyboardOffset, setAndroidKeyboardOffset] = useState(0);
  const socketRef = useRef<Socket | null>(null);
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const listRef = useRef<FlatList<ChatRow>>(null);

  // As soon as the user actually has Premium (e.g. just returned from the
  // Premium screen after purchasing), drop the gating banner immediately so
  // they don't have to leave and re-enter the conversation to send their
  // first message.
  useEffect(() => {
    if (isPremium && premiumBlocked) {
      setPremiumBlocked(false);
    }
  }, [isPremium, premiumBlocked]);

  useFocusEffect(
    useCallback(() => {
      useMatchPopup.getState().hide();
    }, []),
  );

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

  // Track the soft keyboard height on Android as a fallback for unreliable
  // `adjustResize`. If the OS already shrank the window, we add no extra
  // offset (avoids double-padding). Also auto-scrolls to the latest message
  // whenever the keyboard opens so the new typing area is in view.
  useEffect(() => {
    if (Platform.OS !== 'android') return;

    const onShow = (e: { endCoordinates: { height: number } }) => {
      const kb = e.endCoordinates.height ?? 0;
      const screenH = Dimensions.get('screen').height;
      const windowH = Dimensions.get('window').height;
      const systemAdjustedBy = Math.max(0, screenH - windowH);
      // If the OS already resized the window by ~ the keyboard's height,
      // adjustResize is working — don't add manual padding on top.
      const needsManual = systemAdjustedBy < kb * 0.5;
      setAndroidKeyboardOffset(needsManual ? kb : 0);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 60);
    };
    const onHide = () => setAndroidKeyboardOffset(0);

    const showSub = Keyboard.addListener('keyboardDidShow', onShow);
    const hideSub = Keyboard.addListener('keyboardDidHide', onHide);
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

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

    const blockedMessage = checkContent(trimmed, 'chat');
    if (blockedMessage) {
      Alert.alert(t('contentFilter.blockedTitle'), blockedMessage);
      return;
    }

    const tempId = makeTempId();
    const optimistic: Message = {
      id: tempId,
      senderId: myId,
      type: 'text',
      text: trimmed,
      imageUrl: null,
      audioUrl: null,
      audioDuration: null,
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
      const blockedMessage = extractContentBlockedMessage(e, t);
      if (blockedMessage) {
        Alert.alert(t('contentFilter.blockedTitle'), blockedMessage);
        return;
      }
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
      audioUrl: null,
      audioDuration: null,
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

  const sendVoice = useCallback(
    async (recording: RecordingResult) => {
      if (!myId) return;
      const tempId = makeTempId();
      const optimistic: Message = {
        id: tempId,
        senderId: myId,
        type: 'audio',
        text: null,
        imageUrl: null,
        audioUrl: recording.uri,
        audioDuration: recording.durationSeconds,
        deliveredAt: null,
        readAt: null,
        createdAt: new Date().toISOString(),
        conversationId,
      };
      setMessages((prev) => [...prev, optimistic]);

      try {
        const fileName = `voice-${Date.now()}.m4a`;
        const file = { uri: recording.uri, name: fileName, type: recording.mimeType };
        const { url } = await chatApi.uploadAudio(conversationId, file);
        const msg = await chatApi.send(conversationId, {
          type: 'audio',
          audioUrl: url,
          audioDuration: recording.durationSeconds,
        });
        reconcileOptimistic(tempId, msg);
      } catch (e) {
        removeOptimistic(tempId);
        const errMsg = extractErrorMessage(e);
        if (errMsg.toLowerCase().includes('premium')) setPremiumBlocked(true);
        else Alert.alert(t('common.error'), errMsg);
      }
    },
    [conversationId, myId, t],
  );

  const onChangeText = useCallback(
    (v: string) => {
      createFilteredChangeHandler(
        text,
        (next) => {
          setText(next);
          if (!socketRef.current) return;
          socketRef.current.emit('typing', { conversationId, typing: true });
          if (typingTimeout.current) clearTimeout(typingTimeout.current);
          typingTimeout.current = setTimeout(() => {
            socketRef.current?.emit('typing', { conversationId, typing: false });
          }, 1500);
        },
        'chat',
        t,
        (message) => Alert.alert(t('contentFilter.blockedTitle'), message),
      )(v);
    },
    [conversationId, t, text],
  );

  const chatRows = useMemo(() => buildChatRows(messages, t), [messages, t]);
  const inputDisabled = premiumBlocked;
  const topPadding = useTopScreenPadding();

  return (
    <Screen padded={false} edges={['bottom']} keyboardAvoiding={false}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? topPadding : 0}
      >
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
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
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
          onSendVoice={sendVoice}
          onRecordingChange={(isRecording) => {
            if (isRecording) {
              Keyboard.dismiss();
              setAndroidKeyboardOffset(0);
            }
          }}
          disabled={inputDisabled}
        />

        {/* Fallback spacer on Android when adjustResize does not shrink
            the window (e.g. translucent status bar). Keeps the input bar
            visible above the soft keyboard. */}
        {Platform.OS === 'android' && androidKeyboardOffset > 0 ? (
          <View style={{ height: androidKeyboardOffset }} />
        ) : null}
      </KeyboardAvoidingView>
    </Screen>
  );
}
