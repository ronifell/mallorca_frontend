import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Alert } from 'react-native';
import { extractErrorMessage } from '../api/client';
import { SuperLikeQuota } from '../api/types';
import { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Translate = (key: string, options?: Record<string, unknown>) => string;

export function promptSuperLikePremiumUpsell(
  nav: Nav,
  t: Translate,
  limit = 5,
): void {
  Alert.alert(
    t('discovery.superLikePremiumTitle'),
    t('discovery.superLikePremiumBody', { limit }),
    [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('discovery.superLikeUpgrade'), onPress: () => nav.navigate('Premium') },
    ],
  );
}

export function promptSuperLikeQuotaExhausted(t: Translate, limit: number): void {
  Alert.alert(
    t('discovery.superLikeNoneLeftTitle'),
    t('discovery.superLikeNoneLeftBody', { limit }),
  );
}

/** Returns false when the user cannot send a Super Like (shows the appropriate alert). */
export function ensureSuperLikeAllowed(
  quota: SuperLikeQuota | undefined,
  nav: Nav,
  t: Translate,
  viewerIsPremium = false,
): boolean {
  const premium = viewerIsPremium || quota?.isPremium === true;
  if (!premium) {
    promptSuperLikePremiumUpsell(nav, t, quota?.limit ?? 5);
    return false;
  }
  // Only enforce weekly quota once the API confirms Premium (avoids stale cache after upgrade).
  if (quota?.isPremium === true && quota.remaining <= 0) {
    promptSuperLikeQuotaExhausted(t, quota.limit);
    return false;
  }
  return true;
}

export function handleSuperLikeApiError(
  err: unknown,
  nav: Nav,
  t: Translate,
  quotaLimit = 5,
): void {
  const msg = extractErrorMessage(err);
  if (msg.toLowerCase().includes('premium')) {
    promptSuperLikePremiumUpsell(nav, t, quotaLimit);
  } else if (msg.toLowerCase().includes('super like') || msg.toLowerCase().includes('week')) {
    promptSuperLikeQuotaExhausted(t, quotaLimit);
  } else {
    Alert.alert(t('common.error'), t('discovery.superLikeError'));
  }
}
