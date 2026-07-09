/**
 * In-app billing service.
 *
 * Wraps `react-native-iap` to:
 *   1. Initialise the Google Play / App Store billing connection.
 *   2. Fetch subscription offers (needed on Android Billing v5+ for offerToken).
 *   3. Launch the store purchase sheet and resolve with the resulting token.
 *   4. Restore previously-purchased subscriptions.
 *   5. Acknowledge / finish transactions AFTER the backend has validated them.
 *
 * The backend (`POST /api/subscriptions/validate`) is the source of truth for
 * premium status. This module never grants premium locally.
 *
 * ---
 *
 * ### Expo Go fallback
 *
 * `react-native-iap` is a native module; it does NOT work in Expo Go. When we
 * detect the native module is missing (dev on Expo Go), we fall back to a mock
 * purchase so the rest of the UI can still be exercised end-to-end. The
 * backend must have `BILLING_ALLOW_MOCK=true` for the mock token to be
 * accepted. Production builds via EAS have the native module linked.
 */
import { NativeModules, Platform } from 'react-native';
import type {
  Purchase,
  Subscription,
  SubscriptionAndroid,
  SubscriptionPurchase,
} from 'react-native-iap';

export type Platform_ = 'google_play' | 'app_store';
export type ProductId = 'monthly_premium' | 'annual_premium';

export interface PurchaseResult {
  platform: Platform_;
  productId: string;
  purchaseToken: string;
  /**
   * The raw `Purchase` object from `react-native-iap`. Required by
   * `acknowledgePurchase` / `finishTransaction`. Not sent to the backend
   * (strip it out with `toApiPayload()` before POSTing).
   */
  raw?: Purchase;
}

export const SUBSCRIPTION_SKUS: ProductId[] = ['monthly_premium', 'annual_premium'];

/** True iff the react-native-iap native module is linked (i.e. dev-client / production build, not Expo Go). */
export const IAP_NATIVE_AVAILABLE: boolean =
  Platform.OS === 'android'
    ? !!NativeModules?.RNIapModule
    : Platform.OS === 'ios'
      ? !!NativeModules?.RNIapIos || !!NativeModules?.RNIapIosSk2
      : false;

/**
 * Server-controlled kill switch for the whole native billing flow. When the
 * backend reports `mockEnabled: true` (i.e. `BILLING_ALLOW_MOCK=true` in the
 * backend `.env`), the app skips Google Play and completes the purchase with
 * a mock token — the backend validator will accept it and grant Premium for
 * the product's normal duration. This lets QA / demos exercise the whole
 * Premium gating end-to-end without a real Google Play charge, and lets ops
 * toggle real vs mock billing without shipping a new app build.
 */
let mockModeFromServer = false;

/** Called by `PremiumScreen` after fetching `/subscriptions/config`. */
export function setBillingMockMode(enabled: boolean): void {
  mockModeFromServer = enabled;
}

/** Effective flag: server explicitly enabled mock billing. */
function shouldUseMock(): boolean {
  return mockModeFromServer;
}

let connectionReady = false;
let connectPromise: Promise<boolean> | null = null;

/**
 * Idempotently initialise the store billing connection. Safe to call multiple
 * times; subsequent calls are no-ops until `endBillingConnection()` is called.
 */
export async function initBillingConnection(): Promise<boolean> {
  if (connectionReady) return true;
  if (shouldUseMock()) return false;
  if (connectPromise) return connectPromise;

  const RNIap = await import('react-native-iap');
  connectPromise = (async () => {
    try {
      await RNIap.initConnection();
      if (Platform.OS === 'android') {
        try {
          await RNIap.flushFailedPurchasesCachedAsPendingAndroid();
        } catch {
          // best-effort — do not block startup if there is no cache
        }
      }
      connectionReady = true;
      return true;
    } catch (err) {
      connectionReady = false;
      throw err;
    } finally {
      connectPromise = null;
    }
  })();
  return connectPromise;
}

export async function endBillingConnection(): Promise<void> {
  if (!connectionReady) return;
  try {
    const RNIap = await import('react-native-iap');
    await RNIap.endConnection();
  } catch {
    // ignore
  }
  connectionReady = false;
}

/**
 * Strip the `raw` Purchase from a result before sending to the backend.
 * The backend only accepts `{ platform, productId, purchaseToken }`.
 */
export function toApiPayload(r: PurchaseResult): {
  platform: Platform_;
  productId: string;
  purchaseToken: string;
} {
  return {
    platform: r.platform,
    productId: r.productId,
    purchaseToken: r.purchaseToken,
  };
}

function extractPurchaseToken(purchase: Purchase | SubscriptionPurchase): string | undefined {
  if (purchase.purchaseToken) return purchase.purchaseToken;
  const legacy = (purchase as unknown as { transactionReceipt?: string }).transactionReceipt;
  return legacy || undefined;
}

/**
 * Fetch localised subscription offers from the store. Useful to display real
 * prices instead of the hardcoded ones served by `/subscriptions/plans`.
 */
export async function fetchSubscriptions(): Promise<Subscription[]> {
  if (shouldUseMock()) return [];
  await initBillingConnection();
  const RNIap = await import('react-native-iap');
  return RNIap.getSubscriptions({ skus: SUBSCRIPTION_SKUS });
}

/**
 * Resolve the currently-visible purchase from an updated-listener event.
 *
 * @throws When the store fires an error (user cancel, network, invalid SKU…).
 */
function waitForPurchase(sku: string, timeoutMs = 90_000): Promise<Purchase> {
  return new Promise((resolve, reject) => {
    let settled = false;
    let unsubUpdate: { remove: () => void } | null = null;
    let unsubError: { remove: () => void } | null = null;
    const cleanup = () => {
      unsubUpdate?.remove();
      unsubError?.remove();
    };
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(new Error('Purchase timed out'));
    }, timeoutMs);

    void import('react-native-iap').then((RNIap) => {
      if (settled) return;
      unsubUpdate = RNIap.purchaseUpdatedListener((purchase) => {
        if (settled) return;
        if (purchase.productId !== sku) return;
        const token = extractPurchaseToken(purchase);
        if (!token) return;
        settled = true;
        clearTimeout(timer);
        cleanup();
        resolve(purchase);
      });
      unsubError = RNIap.purchaseErrorListener((error) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        cleanup();
        reject(error);
      });
    });
  });
}

/**
 * Launch the platform purchase sheet for the given product and resolve with a
 * validated purchase token. Rejects on cancel, error, or timeout.
 *
 * IMPORTANT: The caller MUST send the returned `PurchaseResult` to
 * `POST /api/subscriptions/validate` on the backend, then call
 * `acknowledgePurchase(result)` on success. Otherwise Google auto-refunds
 * within 3 days.
 */
export async function startPurchase(productId: ProductId): Promise<PurchaseResult> {
  if (shouldUseMock()) {
    // Backend reported BILLING_ALLOW_MOCK=true — skip Google Play and finish
    // the purchase with a mock token that the backend validator will accept.
    return mockPurchase(productId);
  }

  if (!IAP_NATIVE_AVAILABLE) {
    throw new Error(
      'Google Play billing is not available in Expo Go. Install a preview or production build to test real purchases.',
    );
  }

  await initBillingConnection();
  const RNIap = await import('react-native-iap');

  if (Platform.OS === 'android') {
    // Play Billing v5+: pick an offerToken from subscriptionOfferDetails.
    const subs = await RNIap.getSubscriptions({ skus: [productId] });
    const sub = subs.find((s) => s.productId === productId) as SubscriptionAndroid | undefined;
    if (!sub) {
      throw new Error(
        `Subscription "${productId}" is not available in Google Play. Make sure the product is created and activated in Play Console.`,
      );
    }
    const offer = sub.subscriptionOfferDetails?.[0];
    if (!offer?.offerToken) {
      throw new Error(`No offerToken found for "${productId}".`);
    }

    const purchasePromise = waitForPurchase(productId);
    await RNIap.requestSubscription({
      subscriptionOffers: [{ sku: productId, offerToken: offer.offerToken }],
    });
    const purchase = await purchasePromise;
    const purchaseToken = extractPurchaseToken(purchase);
    if (!purchaseToken) {
      throw new Error('Google Play did not return a purchase token.');
    }

    return {
      platform: 'google_play',
      productId,
      purchaseToken,
      raw: purchase,
    };
  }

  // iOS: the backend does not yet support App Store receipt validation.
  // Reject explicitly so the UI can show a clear message rather than the
  // generic "must be validated through Google Play" from the server.
  throw new Error('App Store subscriptions are not available yet. Please use an Android device.');
}

/**
 * Finalise a purchase AFTER the backend has confirmed validation succeeded.
 * On Android this acknowledges the subscription (required within 3 days).
 * On iOS this marks the StoreKit transaction as finished.
 */
export async function acknowledgePurchase(result: PurchaseResult): Promise<void> {
  if (shouldUseMock() || !result.raw) return;
  const RNIap = await import('react-native-iap');
  try {
    await RNIap.finishTransaction({ purchase: result.raw, isConsumable: false });
  } catch {
    // Google may auto-acknowledge on subsequent app opens; log at call site.
  }
}

/**
 * Restore previously purchased subscriptions. Returns the raw Purchase array
 * (or an empty array in Expo Go dev). The caller is expected to send each
 * token to `POST /api/subscriptions/validate` and then
 * `acknowledgePurchase({...})` for the ones the backend accepts.
 */
export async function restorePurchases(): Promise<PurchaseResult[]> {
  if (shouldUseMock()) return [];
  await initBillingConnection();
  const RNIap = await import('react-native-iap');
  const purchases = await RNIap.getAvailablePurchases();

  const results: PurchaseResult[] = [];
  for (const purchase of purchases) {
    const token = extractPurchaseToken(purchase);
    if (!token) continue;
    results.push({
      platform: Platform.OS === 'ios' ? 'app_store' : 'google_play',
      productId: purchase.productId,
      purchaseToken: token,
      raw: purchase,
    });
  }
  return results;
}

/**
 * Deep-link into the platform subscription management screen so the user can
 * cancel / change plan. Google Play requires this affordance for auto-renewing
 * subscriptions.
 */
export async function openManageSubscriptions(sku?: ProductId): Promise<void> {
  if (shouldUseMock()) return;
  const RNIap = await import('react-native-iap');
  await RNIap.deepLinkToSubscriptions({ sku });
}

/**
 * Dev-only helper used when the native billing module is not available.
 * The backend accepts these tokens only when BILLING_ALLOW_MOCK=true.
 */
export async function mockPurchase(productId: string): Promise<PurchaseResult> {
  await new Promise((r) => setTimeout(r, 600));
  return {
    platform: Platform.OS === 'ios' ? 'app_store' : 'google_play',
    productId,
    purchaseToken: `dev_token_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
  };
}
