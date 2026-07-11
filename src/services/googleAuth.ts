import Constants from 'expo-constants';
import { NativeModules, Platform } from 'react-native';

/**
 * Native Google Sign-In wrapper. The backend (`POST /auth/google`) verifies the
 * Google **ID token**, so we configure `webClientId` as the token audience — it
 * must match the server's `GOOGLE_CLIENT_ID`. Android additionally requires the
 * app's SHA-1 fingerprint on the Android OAuth client in Google Cloud / Firebase.
 *
 * Standalone APK builds read client IDs from expo.extra (app.config.js) because
 * that is more reliable than process.env alone in release builds.
 */

interface GoogleExtra {
  googleWebClientId?: string;
  googleAndroidClientId?: string;
}

const extra = (Constants.expoConfig?.extra ?? {}) as GoogleExtra;

const webClientId =
  extra.googleWebClientId?.trim() ||
  process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID?.trim() ||
  '';
const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID?.trim() || '';

type GoogleSignInModule = typeof import('@react-native-google-signin/google-signin');

/** Expo Go cannot load custom native modules such as RNGoogleSignin. */
export function isNativeGoogleSignInAvailable(): boolean {
  if (Constants.appOwnership === 'expo') return false;
  if (Platform.OS === 'web') return false;
  return !!NativeModules.RNGoogleSignin;
}

/** Web client ID is present in env (UI can show the button). */
export const hasGoogleClientId = webClientId.length > 0;

/** True when sign-in can actually run (env + native module in a dev/production build). */
export const isGoogleConfigured =
  hasGoogleClientId && isNativeGoogleSignInAvailable();

let googleSignInModule: GoogleSignInModule | null = null;
let configured = false;

async function loadGoogleSignInModule(): Promise<GoogleSignInModule | null> {
  if (!isNativeGoogleSignInAvailable()) return null;
  if (!googleSignInModule) {
    googleSignInModule = await import('@react-native-google-signin/google-signin');
  }
  return googleSignInModule;
}

async function ensureConfigured(): Promise<GoogleSignInModule | null> {
  const mod = await loadGoogleSignInModule();
  if (!mod || configured) return mod;
  mod.GoogleSignin.configure({
    webClientId,
    iosClientId: iosClientId || undefined,
    offlineAccess: false,
    scopes: ['profile', 'email'],
  });
  configured = true;
  return mod;
}

export type GoogleSignInOutcome =
  | { type: 'success'; idToken: string }
  | { type: 'cancelled' }
  | {
      type: 'error';
      code:
        | 'in_progress'
        | 'play_services'
        | 'no_token'
        | 'not_configured'
        | 'requires_dev_build'
        | 'developer_error'
        | 'unknown';
      message?: string;
    };

function isDeveloperError(code: string | number | undefined): boolean {
  return code === 10 || code === '10' || code === 'DEVELOPER_ERROR';
}

export async function signInWithGoogle(): Promise<GoogleSignInOutcome> {
  if (!webClientId) return { type: 'error', code: 'not_configured' };
  if (!isNativeGoogleSignInAvailable()) {
    return { type: 'error', code: 'requires_dev_build' };
  }

  const mod = await ensureConfigured();
  if (!mod) return { type: 'error', code: 'requires_dev_build' };

  const { GoogleSignin, isErrorWithCode, isCancelledResponse, isSuccessResponse, statusCodes } =
    mod;

  try {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

    // Always show the Google account chooser (even after a previous sign-in on
    // this device) so the user can pick between personal / work / corporate
    // Google accounts. Without this, Google silently reuses the last account,
    // which is confusing when a user has several accounts on the same phone.
    try {
      await GoogleSignin.signOut();
    } catch {
      // Ignore — no previous session or already signed out.
    }

    const response = await GoogleSignin.signIn();

    if (isCancelledResponse(response)) return { type: 'cancelled' };

    if (isSuccessResponse(response)) {
      let idToken = response.data.idToken;
      if (!idToken) {
        try {
          const tokens = await GoogleSignin.getTokens();
          idToken = tokens.idToken ?? null;
        } catch {
          // handled below
        }
      }
      if (!idToken) {
        return {
          type: 'error',
          code: 'developer_error',
          message:
            'Google no ha devuelto un ID token. Verifica que la huella SHA-1 del APK EAS está en el cliente OAuth de Android y ' +
            'que google-services.json incluye las entradas oauth_client, y vuelve a compilar el APK.',
        };
      }
      return { type: 'success', idToken };
    }

    return { type: 'error', code: 'unknown', message: 'Respuesta inesperada del inicio de sesión con Google.' };
  } catch (e) {
    if (isErrorWithCode(e)) {
      if (isDeveloperError(e.code)) {
        return {
          type: 'error',
          code: 'developer_error',
          message: e.message,
        };
      }
      switch (e.code) {
        case statusCodes.SIGN_IN_CANCELLED:
          return { type: 'cancelled' };
        case statusCodes.IN_PROGRESS:
          return { type: 'error', code: 'in_progress' };
        case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
          return { type: 'error', code: 'play_services' };
        default:
          return { type: 'error', code: 'unknown', message: e.message };
      }
    }
    return { type: 'error', code: 'unknown', message: (e as Error)?.message };
  }
}

export async function signOutGoogle(): Promise<void> {
  if (!isGoogleConfigured) return;
  try {
    const mod = await ensureConfigured();
    if (!mod) return;
    await mod.GoogleSignin.signOut();
  } catch {
    // Non-fatal: app session logout is handled separately.
  }
}
