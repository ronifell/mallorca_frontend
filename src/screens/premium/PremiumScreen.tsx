import { useNavigation } from '@react-navigation/native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, ScrollView, View } from 'react-native';
import { extractErrorMessage } from '../../api/client';
import { subscriptionsApi } from '../../api/endpoints';
import { PremiumActiveCard } from '../../components/premium/PremiumActiveCard';
import { PremiumBenefitsCard } from '../../components/premium/PremiumBenefitsCard';
import { PremiumHero } from '../../components/premium/PremiumHero';
import { PremiumPlanCard } from '../../components/premium/PremiumPlanCard';
import { PremiumShell } from '../../components/premium/PremiumShell';
import { PremiumSubscribeSection } from '../../components/premium/PremiumSubscribeSection';
import {
  acknowledgePurchase,
  initBillingConnection,
  restorePurchases,
  setBillingMockMode,
  startPurchase,
  toApiPayload,
} from '../../services/billing';
import { useAuthStore } from '../../store/auth';

export function PremiumScreen() {
  const { t } = useTranslation();
  const nav = useNavigation();
  const qc = useQueryClient();
  const patchUser = useAuthStore((s) => s.patchUser);
  const [selected, setSelected] = useState<'monthly_premium' | 'annual_premium'>('annual_premium');
  const [loading, setLoading] = useState(false);
  const [restoring, setRestoring] = useState(false);

  const { data: plans } = useQuery({
    queryKey: ['plans'],
    queryFn: () => subscriptionsApi.plans(),
  });
  const { data: status } = useQuery({
    queryKey: ['subscription-status'],
    queryFn: () => subscriptionsApi.status(),
  });
  const { data: billingConfig } = useQuery({
    queryKey: ['subscription-config'],
    queryFn: () => subscriptionsApi.config(),
    staleTime: 60_000,
  });

  useEffect(() => {
    // Push the server-side mock flag into the billing module BEFORE any
    // purchase can start. This lets ops flip real ↔ mock billing by setting
    // BILLING_ALLOW_MOCK in the backend .env — no app rebuild required.
    if (typeof billingConfig?.mockEnabled === 'boolean') {
      setBillingMockMode(billingConfig.mockEnabled);
    }
  }, [billingConfig?.mockEnabled]);

  useEffect(() => {
    // Warm the billing connection up-front so the "Subscribe" tap is snappy.
    // Skipped automatically when the backend has enabled mock mode.
    if (billingConfig?.mockEnabled) return;
    initBillingConnection().catch(() => undefined);
  }, [billingConfig?.mockEnabled]);

  const invalidatePremiumQueries = async () => {
    await qc.invalidateQueries({ queryKey: ['me'] });
    await qc.invalidateQueries({ queryKey: ['subscription-status'] });
    await qc.invalidateQueries({ queryKey: ['superLikeQuota'] });
  };

  const subscribe = async () => {
    setLoading(true);
    try {
      const purchase = await startPurchase(selected);
      const result = await subscriptionsApi.validate(toApiPayload(purchase));
      // Only acknowledge once the backend has recorded the entitlement — otherwise
      // Google auto-refunds. If acknowledge fails, Google will re-emit the pending
      // purchase on the next app open and it will be re-validated then.
      await acknowledgePurchase(purchase);
      patchUser({ isPremium: result.isPremium });
      await invalidatePremiumQueries();
      Alert.alert(
        t('premium.active'),
        `${t('premium.until')}: ${new Date(result.expiryDate).toLocaleDateString()}`,
      );
      nav.goBack();
    } catch (e) {
      const msg = extractErrorMessage(e);
      // Don't yell at the user for cancelling the store sheet.
      if (!/cancel/i.test(msg)) {
        Alert.alert(t('premium.purchaseError'), msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const restore = async () => {
    setRestoring(true);
    try {
      const purchases = await restorePurchases();
      if (purchases.length === 0) {
        Alert.alert(t('premium.restore'), t('premium.restoreNone'));
        return;
      }

      let restored = 0;
      let latestExpiry: string | null = null;
      let lastError: string | null = null;
      for (const purchase of purchases) {
        try {
          const result = await subscriptionsApi.validate(toApiPayload(purchase));
          await acknowledgePurchase(purchase);
          if (result.isPremium) {
            restored += 1;
            latestExpiry = result.expiryDate;
          }
        } catch (err) {
          lastError = extractErrorMessage(err);
        }
      }

      if (restored > 0) {
        patchUser({ isPremium: true });
        await invalidatePremiumQueries();
        Alert.alert(
          t('premium.restoreSuccess'),
          latestExpiry
            ? `${t('premium.until')}: ${new Date(latestExpiry).toLocaleDateString()}`
            : undefined,
        );
      } else {
        Alert.alert(t('premium.restore'), lastError ?? t('premium.restoreNone'));
      }
    } catch (e) {
      Alert.alert(t('premium.restore'), extractErrorMessage(e));
    } finally {
      setRestoring(false);
    }
  };

  const isPremium = status?.isPremium ?? false;

  return (
    <PremiumShell>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 16 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-1 justify-between">
          <View>
            <PremiumHero />
            <PremiumBenefitsCard />
            {isPremium ? <PremiumActiveCard expiryDate={status?.expiryDate} /> : null}
            {(plans ?? []).map((plan) => (
              <PremiumPlanCard
                key={plan.id}
                plan={plan}
                selected={selected === plan.id}
                onSelect={() => setSelected(plan.id)}
              />
            ))}
          </View>

          <PremiumSubscribeSection
            onSubscribe={subscribe}
            onRestore={restore}
            loading={loading}
            restoring={restoring}
            disabled={isPremium}
          />
        </View>
      </ScrollView>
    </PremiumShell>
  );
}
