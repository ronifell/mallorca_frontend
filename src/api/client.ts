import axios, { AxiosError, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';
import { env } from '../config/env';
import { tokenStorage } from '../services/storage';

export const api = axios.create({
  baseURL: `${env.apiBaseUrl}/api`,
  timeout: 15_000,
});

let onUnauthorized: (() => void) | null = null;

export function setOnUnauthorized(cb: () => void) {
  onUnauthorized = cb;
}

api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const access = await tokenStorage.getAccess();
  if (access) {
    config.headers = config.headers ?? {};
    (config.headers as Record<string, string>).Authorization = `Bearer ${access}`;
  }
  return config;
});

// --- Refresh-token rotation ---
// Single-flight: while one refresh is in-flight, queue subsequent 401s and
// retry them once the new access token arrives.
let refreshing: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (refreshing) return refreshing;
  refreshing = (async () => {
    const refresh = await tokenStorage.getRefresh();
    if (!refresh) return null;
    try {
      const r = await axios.post(`${env.apiBaseUrl}/api/auth/refresh`, {
        refreshToken: refresh,
      });
      const { accessToken, refreshToken } = r.data as {
        accessToken: string;
        refreshToken: string;
      };
      await tokenStorage.setTokens(accessToken, refreshToken);
      return accessToken;
    } catch {
      return null;
    }
  })();
  try {
    return await refreshing;
  } finally {
    refreshing = null;
  }
}

api.interceptors.response.use(
  (r) => r,
  async (error: AxiosError) => {
    const status = error.response?.status;
    const original = error.config as (AxiosRequestConfig & { _retried?: boolean }) | undefined;
    if (status === 401 && original && !original._retried) {
      original._retried = true;
      const newAccess = await refreshAccessToken();
      if (newAccess) {
        original.headers = original.headers ?? {};
        (original.headers as Record<string, string>).Authorization = `Bearer ${newAccess}`;
        return api.request(original);
      }
      await tokenStorage.clear();
      onUnauthorized?.();
    }
    return Promise.reject(error);
  },
);

export function extractErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { error?: { message?: string } } | undefined;
    return data?.error?.message ?? err.message ?? 'Request failed';
  }
  if (err instanceof Error) return err.message;
  return 'Unknown error';
}
