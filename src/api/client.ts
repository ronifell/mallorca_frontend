import axios, { AxiosError, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';
import { env } from '../config/env';
import { isLogoutInFlight } from '../services/sessionTeardown';
import { tokenStorage } from '../services/storage';
import { formatUserError } from '../utils/formatUserError';
import { LocalizedError } from '../utils/localizedError';

declare module 'axios' {
  export interface AxiosRequestConfig {
    /** Set on logout / FCM-detach requests — skip refresh + unauthorized callback. */
    _sessionTeardown?: boolean;
    _retried?: boolean;
  }
}

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

export class ApiRequestError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = 'ApiRequestError';
    this.status = status;
  }
}

export interface MultipartFile {
  uri: string;
  name: string;
  type: string;
}

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
    const body = original?.data;
    const isMultipart = typeof FormData !== 'undefined' && body instanceof FormData;
    if (status === 401 && original && !original._retried && !isMultipart) {
      if (original._sessionTeardown || isLogoutInFlight()) {
        return Promise.reject(error);
      }
      original._retried = true;
      const newAccess = await refreshAccessToken();
      if (newAccess) {
        original.headers = original.headers ?? {};
        (original.headers as Record<string, string>).Authorization = `Bearer ${newAccess}`;
        return api.request(original);
      }
      // Let logout() clear tokens while they are still available for teardown calls.
      if (!isLogoutInFlight()) {
        await onUnauthorized?.();
      }
    }
    return Promise.reject(error);
  },
);

function isNetworkFailure(err: unknown): boolean {
  if (!(err instanceof TypeError)) return false;
  const msg = err.message.toLowerCase();
  return msg.includes('network request failed') || msg.includes('failed to fetch');
}

/** Upload multipart files via fetch (reliable in React Native; rebuilds body on retry). */
export async function postMultipartFile<T>(
  path: string,
  fieldName: string,
  file: MultipartFile,
): Promise<T> {
  const send = async (
    accessToken: string | null,
    authRetried: boolean,
    networkRetried: boolean,
  ): Promise<T> => {
    const formData = new FormData();
    // React Native expects { uri, name, type } — not a web Blob.
    formData.append(
      fieldName,
      {
        uri: file.uri,
        name: file.name,
        type: file.type,
      } as unknown as Blob,
    );

    const headers: Record<string, string> = {};
    if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

    let response: Response;
    try {
      response = await fetch(`${env.apiBaseUrl}/api${path}`, {
        method: 'POST',
        headers,
        body: formData,
      });
    } catch (err) {
      if (!networkRetried && isNetworkFailure(err)) {
        return send(accessToken, authRetried, true);
      }
      throw err;
    }

    if (response.status === 401 && !authRetried) {
      const newAccess = await refreshAccessToken();
      if (newAccess) return send(newAccess, true, networkRetried);
      if (!isLogoutInFlight()) {
        await onUnauthorized?.();
      }
      throw new ApiRequestError(formatUserError(new LocalizedError('errors.sessionExpired')), 401);
    }

    if (!response.ok) {
      let message = formatUserError(new LocalizedError('errors.requestFailed'));
      try {
        const data = (await response.json()) as { error?: { message?: string } };
        if (data?.error?.message) {
          message = formatUserError(new Error(data.error.message));
        }
      } catch {
        // Non-JSON error body.
      }
      throw new ApiRequestError(message, response.status);
    }

    if (response.status === 204) return undefined as T;
    return (await response.json()) as T;
  };

  const access = await tokenStorage.getAccess();
  return send(access, false, false);
}

export function extractErrorMessage(err: unknown): string {
  return formatUserError(err);
}
