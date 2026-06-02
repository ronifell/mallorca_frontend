import { useQuery, useQueryClient } from '@tanstack/react-query';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Switch, Text, View } from 'react-native';
import { usersApi } from '../../api/endpoints';
import { SectionCard } from '../../components/Row';
import { Screen } from '../../components/Screen';
import { colors } from '../../theme/colors';

function Toggle({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <View className="flex-row items-center justify-between px-4 py-4 bg-white border-b border-cream-200">
      <Text className="text-ink-700 font-semibold flex-1">{label}</Text>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: colors.cream[300], true: colors.brand[300] }}
        thumbColor={value ? colors.brand[500] : '#fff'}
      />
    </View>
  );
}

export function NotificationsScreen() {
  const { t } = useTranslation();
  const qc = useQueryClient();
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

  const update = async (patch: {
    matchesEnabled?: boolean;
    messagesEnabled?: boolean;
    subscriptionEnabled?: boolean;
  }) => {
    await usersApi.updateNotifications(patch);
    qc.invalidateQueries({ queryKey: ['me'] });
  };

  return (
    <Screen scroll>
      <SectionCard>
        <Toggle
          label={t('settings.notificationMatches')}
          value={matches}
          onChange={(v) => {
            setMatches(v);
            update({ matchesEnabled: v });
          }}
        />
        <Toggle
          label={t('settings.notificationMessages')}
          value={messages}
          onChange={(v) => {
            setMessages(v);
            update({ messagesEnabled: v });
          }}
        />
        <Toggle
          label={t('settings.notificationSubscription')}
          value={subscription}
          onChange={(v) => {
            setSubscription(v);
            update({ subscriptionEnabled: v });
          }}
        />
      </SectionCard>
    </Screen>
  );
}
