/**
 * Thin abstraction for the in-app billing flow.
 *
 * In production this wraps `react-native-iap`:
 *   import * as RNIap from 'react-native-iap';
 *
 * For development we expose a `mockPurchase` so that the rest of the app
 * (premium chat gating, etc.) can be exercised end-to-end without configuring
 * a Play Console / Apple developer account.
 *
 * Replace `mockPurchase` with the real IAP flow before submitting to Play:
 *
 *   await RNIap.initConnection();
 *   const purchase = await RNIap.requestSubscription({ sku: productId });
 *   return { platform: 'google_play',
 *            productId,
 *            purchaseToken: purchase.purchaseToken };
 */
import { Platform } from 'react-native';

export type Platform_ = 'google_play' | 'app_store';

export interface PurchaseResult {
  platform: Platform_;
  productId: string;
  purchaseToken: string;
}

export async function startPurchase(productId: string): Promise<PurchaseResult> {
  // TODO: wire react-native-iap before production release. See file header.
  return mockPurchase(productId);
}

export async function mockPurchase(productId: string): Promise<PurchaseResult> {
  await new Promise((r) => setTimeout(r, 600));
  return {
    platform: Platform.OS === 'ios' ? 'app_store' : 'google_play',
    productId,
    purchaseToken: `dev_token_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
  };
}
