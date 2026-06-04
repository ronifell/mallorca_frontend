import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ImageBackground,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usersApi } from '../../api/endpoints';
import { NotificationToggleRow } from '../../components/settings/NotificationToggleRow';
import { useTopScreenPadding } from '../../hooks/useTopScreenPadding';
import { colors } from '../../theme/colors';

const settingsBackground = require('../../../assets/main1.png');

const NOTIFICATION_ITEMS = [
  {
    key: 'matches' as const,
    icon: 'heart' as const,
    titleKey: 'notificationMatches',
    descKey: 'notificationMatchesDesc',
  },
  {
    key: 'messages' as const,
    icon: 'chatbubble-ellipses-outline' as const,
    titleKey: 'notificationMessages',
    descKey: 'notificationMessagesDesc',
  },
  {
    key: 'subscription' as const,
    icon: 'notifications-outline' as const,
    titleKey: 'notificationSubscription',
    descKey: 'notificationSubscriptionDesc',
  },
];

export function NotificationsScreen() {
  const { t } = useTranslation();
  const nav = useNavigation();
  const qc = useQueryClient();
  const topPadding = useTopScreenPadding();
  const { data: me } = useQuery({ queryKey: ['me'], queryFn: () => usersApi.me() });

  const [matches, setMatches] = useState(true);
  const [messages, setMessages] = useState(true);
  const [subscription, setSubscription] = useState(true);

  useEffect(() => {
    if (!me) return;
    setMatches(me.notifications.matches);
    setMessages(me.notifications.messages);
    setSubscription(me.notifications.subscription);
  }, [me]);

  const values = { matches, messages, subscription };

  const setters = {
    matches: setMatches,
    messages: setMessages,
    subscription: setSubscription,
  };

  const update = async (patch: {
    matchesEnabled?: boolean;
    messagesEnabled?: boolean;
    subscriptionEnabled?: boolean;
  }) => {
    await usersApi.updateNotifications(patch);
    qc.invalidateQueries({ queryKey: ['me'] });
  };

  const onToggle = (key: 'matches' | 'messages' | 'subscription', enabled: boolean) => {
    setters[key](enabled);
    if (key === 'matches') update({ matchesEnabled: enabled });
    if (key === 'messages') update({ messagesEnabled: enabled });
    if (key === 'subscription') update({ subscriptionEnabled: enabled });
  };

  return (
    <View style={styles.root}>
      <ImageBackground
        source={settingsBackground}
        resizeMode="cover"
        style={StyleSheet.absoluteFillObject}
        imageStyle={styles.backgroundImage}
      />

      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <View className="px-5" style={{ paddingTop: topPadding }}>
          <Pressable
            onPress={() => nav.goBack()}
            className="w-10 h-10 rounded-full bg-white items-center justify-center border border-cream-300 mb-5"
            style={styles.backButton}
            accessibilityRole="button"
            accessibilityLabel={t('common.back')}
          >
            <Ionicons name="chevron-back" size={22} color={colors.ink[700]} />
          </Pressable>

          <Text className="text-ink-700 text-3xl font-bold">{t('settings.notifications')}</Text>
          <Text className="text-ink-400 text-sm mt-2 leading-5 max-w-[320px]">
            {t('settings.notificationsPageSubtitle')}
          </Text>
        </View>

        <View className="px-5 mt-8">
          <View className="bg-white rounded-2xl overflow-hidden" style={cardShadow}>
            {NOTIFICATION_ITEMS.map((item, index) => (
              <NotificationToggleRow
                key={item.key}
                icon={item.icon}
                title={t(`settings.${item.titleKey}`)}
                description={t(`settings.${item.descKey}`)}
                value={values[item.key]}
                onValueChange={(v) => onToggle(item.key, v)}
                showDivider={index < NOTIFICATION_ITEMS.length - 1}
              />
            ))}
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.cream[50],
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
  },
  safeArea: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  backButton: {
    shadowColor: '#3D2618',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
});

const cardShadow = {
  shadowColor: '#3D2618',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.08,
  shadowRadius: 10,
  elevation: 3,
};
