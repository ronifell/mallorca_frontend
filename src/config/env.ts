import Constants from 'expo-constants';

interface Extra {
  apiBaseUrl?: string;
  socketUrl?: string;
}

const extra = (Constants.expoConfig?.extra ?? {}) as Extra;

export const env = {
  apiBaseUrl: extra.apiBaseUrl ?? 'http://localhost:4000',
  socketUrl: extra.socketUrl ?? extra.apiBaseUrl ?? 'http://localhost:4000',
};
