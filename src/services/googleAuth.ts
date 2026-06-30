import Constants from 'expo-constants';
import { NativeModules, Platform } from 'react-native';

/**
 * Native Google Sign-In wrapper. The backend (`POST /auth/google`) verifies the
 * Google **ID token**, so we configure `webClientId` as the token audience — it
 * must match the server's `GOOGLE_CLIENT_ID`. Android additionally requires the
 * app's SHA-1 fingerprint to be registered on the Android OAuth client.
 *
 * Requires a development/production build — **not Expo Go** (no RNGoogleSignin native module).
 */

const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? '';
const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ?? '';

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
        | 'unknown';
      message?: string;
    };

function extractIdToken(response: unknown): string | null {
  const r = response as { idToken?: string; data?: { idToken?: string } } | null;
  return r?.data?.idToken ?? r?.idToken ?? null;
}

function isCancelled(response: unknown): boolean {
  return (response as { type?: string } | null)?.type === 'cancelled';
}

export async function signInWithGoogle(): Promise<GoogleSignInOutcome> {
  if (!webClientId) return { type: 'error', code: 'not_configured' };
  if (!isNativeGoogleSignInAvailable()) {
    return { type: 'error', code: 'requires_dev_build' };
  }

  const mod = await ensureConfigured();
  if (!mod) return { type: 'error', code: 'requires_dev_build' };

  const { GoogleSignin, isErrorWithCode, statusCodes } = mod;

  try {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const response = await GoogleSignin.signIn();

    if (isCancelled(response)) return { type: 'cancelled' };

    let idToken = extractIdToken(response);
    if (!idToken) {
      try {
        const tokens = await GoogleSignin.getTokens();
        idToken = tokens.idToken ?? null;
      } catch {
        // ignore; handled below
      }
    }
    if (!idToken) return { type: 'error', code: 'no_token' };
    return { type: 'success', idToken };
  } catch (e) {
    if (isErrorWithCode(e)) {
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
