import Constants from 'expo-constants';

interface Extra {
  apiBaseUrl?: string;
  socketUrl?: string;
}

const extra = (Constants.expoConfig?.extra ?? {}) as Extra;

const defaultBaseUrl = 'http://54.94.85.115:4000';

function resolveBaseUrl(
  fromExtra: string | undefined,
  fromEnv: string | undefined,
  fallback: string,
): string {
  const url = (fromExtra?.trim() || fromEnv?.trim() || fallback).replace(/\/$/, '');
  return url;
}

/**
 * Standalone APK/IPA builds bake URLs via app.config.js → expo.extra (most reliable).
 * Expo Go / dev uses EXPO_PUBLIC_* from .env at bundle time.
 */
export const env = {
  apiBaseUrl: resolveBaseUrl(
    extra.apiBaseUrl,
    process.env.EXPO_PUBLIC_API_BASE_URL,
    defaultBaseUrl,
  ),
  socketUrl: resolveBaseUrl(
    extra.socketUrl,
    process.env.EXPO_PUBLIC_SOCKET_URL ?? process.env.EXPO_PUBLIC_API_BASE_URL,
    resolveBaseUrl(extra.apiBaseUrl, process.env.EXPO_PUBLIC_API_BASE_URL, defaultBaseUrl),
  ),
};
