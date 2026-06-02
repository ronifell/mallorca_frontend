import { useNavigation } from '@react-navigation/native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, Text, View } from 'react-native';
import { extractErrorMessage } from '../../api/client';
import { subscriptionsApi } from '../../api/endpoints';
import { Button } from '../../components/Button';
import { Screen } from '../../components/Screen';
import { startPurchase } from '../../services/billing';
import { useAuthStore } from '../../store/auth';

export function PremiumScreen() {
  const { t } = useTranslation();
  const nav = useNavigation();
  const qc = useQueryClient();
  const patchUser = useAuthStore((s) => s.patchUser);
  const [selected, setSelected] = useState<'monthly_premium' | 'annual_premium'>('annual_premium');
  const [loading, setLoading] = useState(false);

  const { data: plans } = useQuery({
    queryKey: ['plans'],
    queryFn: () => subscriptionsApi.plans(),
  });
  const { data: status } = useQuery({
    queryKey: ['subscription-status'],
    queryFn: () => subscriptionsApi.status(),
  });

  const subscribe = async () => {
    setLoading(true);
    try {
      const purchase = await startPurchase(selected);
      const result = await subscriptionsApi.validate(purchase);
      patchUser({ isPremium: result.isPremium });
      await qc.invalidateQueries({ queryKey: ['me'] });
      await qc.invalidateQueries({ queryKey: ['subscription-status'] });
      Alert.alert(t('premium.active'), `${t('premium.until')}: ${new Date(result.expiryDate).toLocaleDateString()}`);
      nav.goBack();
    } catch (e) {
      Alert.alert(t('premium.purchaseError'), extractErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen scroll>
      <View className="items-center mt-2 mb-6">
        <Text className="text-5xl mb-2">♥</Text>
        <Text className="text-ink-700 font-serif text-3xl">{t('premium.title')}</Text>
        <Text className="text-ink-400 mt-2 text-center">{t('premium.subtitle')}</Text>
      </View>

      <View className="bg-white rounded-2xl p-4 mb-6">
        <Text className="text-ink-700 font-bold mb-2">{t('premium.benefits')}</Text>
        {['benefit1', 'benefit2', 'benefit3'].map((k) => (
          <View key={k} className="flex-row items-center mb-1.5">
            <Text className="text-brand-500 mr-2">✓</Text>
            <Text className="text-ink-700 flex-1">{t(`premium.${k}`)}</Text>
          </View>
        ))}
      </View>

      {status?.isPremium ? (
        <View className="bg-success/10 rounded-2xl p-4 mb-4 items-center">
          <Text className="text-success font-bold">{t('premium.active')}</Text>
          {status.expiryDate ? (
            <Text className="text-ink-700 mt-1">
              {t('premium.until')}: {new Date(status.expiryDate).toLocaleDateString()}
            </Text>
          ) : null}
        </View>
      ) : null}

      {(plans ?? []).map((p) => (
        <Pressable
          key={p.id}
          onPress={() => setSelected(p.id)}
          className={`rounded-2xl p-4 mb-3 border-2 ${
            selected === p.id ? 'border-brand-500 bg-brand-50' : 'border-cream-300 bg-white'
          }`}
        >
          <View className="flex-row items-center">
            <View className="flex-1">
              <Text className="text-ink-700 font-bold text-lg">{p.name}</Text>
              <Text className="text-ink-400">{p.description}</Text>
            </View>
            <View className="items-end">
              <Text className="text-ink-700 font-bold text-lg">{p.price}</Text>
              <Text className="text-ink-400 text-xs">/ {p.period === 'year' ? 'año' : 'mes'}</Text>
              {p.id === 'annual_premium' ? (
                <View className="bg-brand-500 mt-1 px-2 py-0.5 rounded-full">
                  <Text className="text-white text-xs font-bold">{t('premium.save')}</Text>
                </View>
              ) : null}
            </View>
          </View>
        </Pressable>
      ))}

      <View className="h-2" />
      <Button label={t('premium.subscribe')} fullWidth onPress={subscribe} loading={loading} />
    </Screen>
  );
}
