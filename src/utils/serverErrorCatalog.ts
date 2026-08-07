import type { TFunction } from 'i18next';
import i18n from '../i18n';

/**
 * Exact backend/API messages → i18n keys.
 * Keeps English UI users from seeing raw Spanish server strings.
 */
const SERVER_MESSAGE_KEYS: Record<string, string> = {
  // Auth — Spanish
  'Debes aceptar los Términos y la Política de Privacidad.': 'auth.consentRequiredBoth',
  'Debes aceptar los Términos y Condiciones.': 'auth.termsRequired',
  'Debes aceptar la Política de Privacidad.': 'auth.privacyRequired',
  'Correo o contraseña incorrectos.': 'auth.invalidCredentials',
  'Esta cuenta está conectada a Google. Toca el botón «Continuar con Google» para acceder a ella.':
    'auth.googleLinkedAccount',
  'El token de Google no es válido.': 'auth.googleError',
  'Esta cuenta no está activa.': 'auth.accountInactive',
  'Este correo está vinculado a otra cuenta de Google.': 'auth.googleEmailConflict',
  'El inicio de sesión con Google no está configurado en el servidor.': 'auth.googleNotConfigured',
  'Tu sesión ha caducado. Inicia sesión de nuevo.': 'errors.sessionExpired',
  'Tu sesión ya no es válida. Cierra sesión y vuelve a iniciarla.': 'errors.sessionInvalid',
  'Tu cuenta ya no existe.': 'errors.accountNotFound',
  'Tu correo de Google debe estar verificado antes de vincularlo a tu cuenta existente.':
    'auth.googleEmailNotVerified',
  'El enlace de verificación no es válido o ha caducado.': 'auth.verifyLinkInvalid',
  'El código no es válido o ha caducado.': 'auth.resetCodeInvalid',

  // Auth — English (backend may return these when language=en)
  'You must accept the Terms and Conditions and Privacy Policy.': 'auth.consentRequiredBoth',

  // Subscriptions / billing — Spanish
  'Estamos verificando tu pago con Google Play. Vuelve a la pantalla Premium y pulsa «Restaurar compras» en unos minutos para activar tu suscripción. Si el problema persiste, contáctanos.':
    'billing.verifyPending',
  'La validación con Google Play ha fallado. Inténtalo de nuevo.': 'billing.validationFailed',
  'Google Play no reconoce este token de compra.': 'billing.tokenNotRecognized',
  'Google Play ha devuelto una suscripción sin fecha de caducidad.': 'billing.missingExpiry',
  'Esta suscripción ya ha caducado.': 'billing.subscriptionExpired',
  'Esta suscripción ya no está activa.': 'billing.subscriptionInactive',
  'La facturación de Google Play no está configurada en el servidor. Contacta con soporte.':
    'billing.notConfigured',
  'Las credenciales de facturación de Google Play están mal configuradas en el servidor. Contacta con soporte.':
    'billing.credentialsInvalid',
  'Las credenciales de facturación de Google Play están incompletas en el servidor. Contacta con soporte.':
    'billing.credentialsIncomplete',
};

/** Client-side extractErrorMessage fallbacks (legacy Spanish strings). */
const LEGACY_CLIENT_MESSAGE_KEYS: Record<string, string> = {
  'Sesión expirada. Inicia sesión de nuevo.': 'errors.sessionExpired',
  'No se puede conectar con el servidor. Comprueba tu conexión a internet.': 'errors.network',
  'La solicitud ha fallado.': 'errors.requestFailed',
  'Error desconocido.': 'errors.unknown',
};

function looksLikeSpanish(message: string): boolean {
  return /[áéíóúñ¿¡«»]/i.test(message);
}

export function mapServerMessage(message: string, t: TFunction): string | null {
  const trimmed = message.trim();
  if (!trimmed) return null;

  const exactKey =
    SERVER_MESSAGE_KEYS[trimmed] ?? LEGACY_CLIENT_MESSAGE_KEYS[trimmed];
  if (exactKey) return t(exactKey);

  if (trimmed.startsWith('Producto desconocido:')) {
    const productId = trimmed.slice('Producto desconocido:'.length).trim();
    return t('errors.unknownProduct', { productId });
  }

  if (/^La solicitud ha fallado \(\d+\)\.$/.test(trimmed)) {
    const status = trimmed.match(/\((\d+)\)/)?.[1] ?? '?';
    return t('errors.requestFailedStatus', { status });
  }

  if (trimmed.startsWith('Request failed (')) {
    const status = trimmed.match(/\((\d+)\)/)?.[1] ?? '?';
    return t('errors.requestFailedStatus', { status });
  }

  // English UI: never show unmapped Spanish backend text.
  if (i18n.language === 'en' && looksLikeSpanish(trimmed)) {
    return t('errors.generic');
  }

  return null;
}

/** @deprecated Use mapServerMessage via formatUserError instead. */
export function mapAuthServerError(message: string, t: TFunction): string {
  return mapServerMessage(message, t) ?? message;
}
