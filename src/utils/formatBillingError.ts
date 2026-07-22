import axios from 'axios';
import { ApiRequestError } from '../api/client';

type PurchaseErrorLike = {
  code?: string;
  message?: string;
  debugMessage?: string;
};

/** Map Google Play / react-native-iap / API errors to user-facing Spanish messages. */
export function formatBillingError(error: unknown): string {
  if (!error) return 'Error desconocido.';

  // Prefer the backend / Axios payload — this is the real reason after a store
  // purchase succeeds but server validation fails (e.g. payment pending).
  if (axios.isAxiosError(error)) {
    const apiMsg = (error.response?.data as { error?: { message?: string } } | undefined)
      ?.error?.message;
    if (apiMsg) return apiMsg;

    if (!error.response) {
      return 'No se puede conectar con el servidor. Comprueba tu conexión a internet.';
    }
    return 'No se pudo completar la compra. Inténtalo de nuevo.';
  }

  if (error instanceof ApiRequestError && error.message) {
    return error.message;
  }

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

  if (code === 'E_USER_CANCELLED' || /cancel/i.test(combined)) {
    return '';
  }

  if (/network|timeout|internet/i.test(combined)) {
    return 'No se pudo conectar con Google Play. Comprueba tu conexión e inténtalo de nuevo.';
  }

  if (/not available|unavailable|sku/i.test(combined)) {
    return 'Esta suscripción no está disponible en Google Play en este momento.';
  }

  if (/service disconnected|billing unavailable/i.test(combined)) {
    return 'Los servicios de Google Play no están disponibles. Inténtalo más tarde.';
  }

  if (/already owned|already subscribed/i.test(combined)) {
    return 'Ya tienes esta suscripción activa. Prueba a restaurar tus compras.';
  }

  if (/token/i.test(combined) && !/[áéíóúñ¿¡]/i.test(combined)) {
    return 'Google Play no ha devuelto un token de compra válido. Inténtalo de nuevo.';
  }

  // Prefer our own Spanish messages from billing.ts when present.
  if (message && /[áéíóúñ¿¡]/i.test(message)) return message;
  if (message) return message;

  return 'No se pudo completar la compra. Inténtalo de nuevo.';
}
