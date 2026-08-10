import axios from 'axios';
import type { TFunction } from 'i18next';
import i18n from '../i18n';
import { isLocalizedError } from './localizedError';
import { mapServerMessage } from './serverErrorCatalog';

type PurchaseErrorLike = {
  code?: string;
  message?: string;
  debugMessage?: string;
};

function rawApiMessage(err: unknown): string | null {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { error?: { message?: string } } | undefined;
    if (data?.error?.message) return data.error.message;
    if (!err.response) {
      const msg = err.message?.toLowerCase() ?? '';
      const code = err.code?.toLowerCase() ?? '';
      if (
        msg.includes('network error') ||
        msg.includes('network request failed') ||
        code === 'econnaborted' ||
        msg.includes('timeout')
      ) {
        return '__network__';
      }
    }
    return err.message ?? '__request_failed__';
  }
  if (err instanceof Error && err.name === 'ApiRequestError') return err.message;
  if (err instanceof Error) return err.message;
  return null;
}

function mapBillingNativeError(error: unknown, t: TFunction): string | null {
  const code =
    typeof error === 'object' && error !== null && 'code' in error
      ? String((error as PurchaseErrorLike).code ?? '')
      : '';
  const message =
    error instanceof Error
      ? error.message
      : typeof error === 'object' &&
          error !== null &&
          'message' in error &&
          typeof (error as PurchaseErrorLike).message === 'string'
        ? (error as PurchaseErrorLike).message!
        : '';
  const debugMessage =
    typeof error === 'object' &&
    error !== null &&
    'debugMessage' in error &&
    typeof (error as PurchaseErrorLike).debugMessage === 'string'
      ? (error as PurchaseErrorLike).debugMessage!
      : '';
  const combined = `${message} ${debugMessage}`.trim();

  if (code === 'E_USER_CANCELLED' || /cancel/i.test(combined)) return '';

  if (/network|timeout|internet/i.test(combined)) return t('billing.googlePlayNetwork');
  if (/not available|unavailable|sku/i.test(combined)) return t('billing.subscriptionUnavailablePlay');
  if (/service disconnected|billing unavailable/i.test(combined)) return t('billing.googlePlayUnavailable');
  if (/already owned|already subscribed/i.test(combined)) return t('billing.alreadySubscribed');
  if (/token/i.test(combined) && !looksLikeSpanish(message)) return t('billing.invalidPurchaseToken');

  const mapped = mapServerMessage(message, t);
  if (mapped) return mapped;

  return null;
}

function looksLikeSpanish(message: string): boolean {
  return /[áéíóúñ¿¡«»]/i.test(message);
}

/** Resolve any error to a localized, user-facing string. */
export function formatUserError(error: unknown, t: TFunction = i18n.t.bind(i18n)): string {
  if (!error) return t('errors.unknown');

  if (isLocalizedError(error)) {
    return t(error.i18nKey, error.i18nParams);
  }

  const billingNative = mapBillingNativeError(error, t);
  if (billingNative !== null) return billingNative;

  const raw = rawApiMessage(error);
  if (raw === '__network__') return t('errors.network');
  if (raw === '__request_failed__') return t('errors.requestFailed');

  if (raw) {
    const mapped = mapServerMessage(raw, t);
    if (mapped) return mapped;
    if (looksLikeSpanish(raw) && i18n.language.startsWith('en')) return t('errors.generic');
    return raw;
  }

  return t('errors.unknown');
}

/** @deprecated Prefer formatUserError — kept for existing imports. */
export function formatBillingError(error: unknown, t: TFunction = i18n.t.bind(i18n)): string {
  const msg = formatUserError(error, t);
  return msg === t('errors.generic') ? t('billing.purchaseFailed') : msg;
}
