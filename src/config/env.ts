import Constants from 'expo-constants';

interface Extra {
  apiBaseUrl?: string;
  socketUrl?: string;
}

const extra = (Constants.expoConfig?.extra ?? {}) as Extra;

const defaultBaseUrl = 'http://localhost:4000';

/** Resolved from `.env` (EXPO_PUBLIC_*), then app.config `extra`, then defaults. */
export const env = {
  apiBaseUrl:
    process.env.EXPO_PUBLIC_API_BASE_URL ??
    extra.apiBaseUrl ??
    defaultBaseUrl,
  socketUrl:
    process.env.EXPO_PUBLIC_SOCKET_URL ??
    process.env.EXPO_PUBLIC_API_BASE_URL ??
    extra.socketUrl ??
    extra.apiBaseUrl ??
    defaultBaseUrl,
};
