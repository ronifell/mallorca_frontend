import type { TFunction } from 'i18next';

/** Map known Spanish API auth messages to the active app locale. */
const SERVER_MESSAGE_KEYS: Record<string, string> = {
  'Debes aceptar los Términos y la Política de Privacidad.': 'auth.consentRequiredBoth',
  'You must accept the Terms and Conditions and Privacy Policy.': 'auth.consentRequiredBoth',
  'Debes aceptar los Términos y Condiciones.': 'auth.termsRequired',
  'Debes aceptar la Política de Privacidad.': 'auth.privacyRequired',
  'Correo o contraseña incorrectos.': 'auth.invalidCredentials',
  'Esta cuenta está conectada a Google. Toca el botón «Continuar con Google» para acceder a ella.':
    'auth.googleLinkedAccount',
  'El token de Google no es válido.': 'auth.googleError',
  'Esta cuenta no está activa.': 'auth.accountInactive',
  'Este correo está vinculado a otra cuenta de Google.': 'auth.googleEmailConflict',
};

export function mapAuthServerError(message: string, t: TFunction): string {
  const key = SERVER_MESSAGE_KEYS[message.trim()];
  return key ? t(key) : message;
}
