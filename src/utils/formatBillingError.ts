type PurchaseErrorLike = {
  code?: string;
  message?: string;
};

/** Map Google Play / react-native-iap errors to user-facing Spanish messages. */
export function formatBillingError(error: unknown): string {
  if (!error) return 'Error desconocido.';

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
        : String(error);

  if (code === 'E_USER_CANCELLED' || /cancel/i.test(message)) {
    return '';
  }

  if (/network|timeout|internet/i.test(message)) {
    return 'No se pudo conectar con Google Play. Comprueba tu conexión e inténtalo de nuevo.';
  }

  if (/not available|unavailable|sku/i.test(message)) {
    return 'Esta suscripción no está disponible en Google Play en este momento.';
  }

  if (/service disconnected|billing unavailable/i.test(message)) {
    return 'Los servicios de Google Play no están disponibles. Inténtalo más tarde.';
  }

  if (/already owned|already subscribed/i.test(message)) {
    return 'Ya tienes esta suscripción activa. Prueba a restaurar tus compras.';
  }

  if (/token/i.test(message)) {
    return 'Google Play no ha devuelto un token de compra válido. Inténtalo de nuevo.';
  }

  // Prefer our own Spanish messages from billing.ts when present.
  if (/[áéíóúñ¿¡]/i.test(message)) return message;

  return 'No se pudo completar la compra. Inténtalo de nuevo.';
}
