import { useNavigation } from '@react-navigation/native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Text, View } from 'react-native';
import { extractErrorMessage } from '../../api/client';
import { subscriptionsApi } from '../../api/endpoints';
import { PremiumBenefitsCard } from '../../components/premium/PremiumBenefitsCard';
import { PremiumHero } from '../../components/premium/PremiumHero';
import { PremiumPlanCard } from '../../components/premium/PremiumPlanCard';
import { PremiumShell } from '../../components/premium/PremiumShell';
import { PremiumSubscribeSection } from '../../components/premium/PremiumSubscribeSection';
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

  const isPremium = status?.isPremium ?? false;

  return (
    <PremiumShell>
      <PremiumHero />
      <PremiumBenefitsCard />

      {isPremium ? (
        <View className="bg-coral-50 border border-coral-100 rounded-2xl p-4 mb-5 items-center">
          <Text className="text-coral-600 font-bold">{t('premium.active')}</Text>
          {status?.expiryDate ? (
            <Text className="text-ink-700 mt-1 text-sm">
              {t('premium.until')}: {new Date(status.expiryDate).toLocaleDateString()}
            </Text>
          ) : null}
        </View>
      ) : null}

      {(plans ?? []).map((plan) => (
        <PremiumPlanCard
          key={plan.id}
          plan={plan}
          selected={selected === plan.id}
          onSelect={() => setSelected(plan.id)}
        />
      ))}

      <PremiumSubscribeSection
        onSubscribe={subscribe}
        loading={loading}
        disabled={isPremium}
      />
    </PremiumShell>
  );
}
