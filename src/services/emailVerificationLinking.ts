import { Linking } from 'react-native';
import { authApi } from '../api/endpoints';
import { APP_DEEP_LINK_SCHEME } from '../config/linking';
import { useAuthStore } from '../store/auth';

type ParsedVerificationLink =
  | { kind: 'verified' }
  | { kind: 'token'; token: string };

let pendingUrl: string | null = null;
let listenerReady = false;

function isMarketingOpenAppUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    if (host !== 'www.citasmallorca.es' && host !== 'citasmallorca.es') return false;
    return parsed.pathname.replace(/\/$/, '').endsWith('/open-app') ||
      parsed.pathname.includes('open-app.html');
  } catch {
    return /citasmallorca\.es\/open-app/i.test(url);
  }
}

export function parseVerificationDeepLink(url: string | null): ParsedVerificationLink | null {
  if (!url) return null;

  const normalized = url.trim();
  const lower = normalized.toLowerCase();

  // HTTPS App Links from welcome emails (citasmallorca.es/open-app…)
  if (lower.startsWith('https://') || lower.startsWith('http://')) {
    if (isMarketingOpenAppUrl(normalized)) {
      try {
        const token = new URL(normalized).searchParams.get('token');
        if (token) return { kind: 'token', token };
      } catch {
        // ignore
      }
      return { kind: 'verified' };
    }
    return null;
  }

  const schemePrefix = `${APP_DEEP_LINK_SCHEME}://`;
  if (!lower.startsWith(schemePrefix)) return null;

  const rest = normalized.slice(schemePrefix.length);
  const [hostAndPath, query = ''] = rest.split('?');
  const host = hostAndPath.split('/')[0]?.toLowerCase();

  if (host === 'email-verified') {
    return { kind: 'verified' };
  }

  if (host === 'verify-email') {
    const params = new URLSearchParams(query);
    const token = params.get('token');
    if (token) return { kind: 'token', token };
  }

  return null;
}

export async function processEmailVerificationUrl(url: string | null): Promise<boolean> {
  const parsed = parseVerificationDeepLink(url);
  if (!parsed) return false;

  const { refreshVerificationStatus } = useAuthStore.getState();

  if (parsed.kind === 'token') {
    try {
      await authApi.verifyEmail(parsed.token);
    } catch {
      // Token may already be consumed; fall through and refresh from /users/me.
    }
  }

  return refreshVerificationStatus();
}

export function initEmailVerificationLinking(): void {
  if (listenerReady) return;
  listenerReady = true;

  const queue = (url: string | null) => {
    if (!parseVerificationDeepLink(url)) return;
    pendingUrl = url;
    void flushPendingEmailVerification();
  };

  Linking.getInitialURL()
    .then(queue)
    .catch(() => undefined);

  Linking.addEventListener('url', ({ url }) => queue(url));
}

export async function flushPendingEmailVerification(): Promise<boolean> {
  if (!pendingUrl) return false;

  const { initialized, user } = useAuthStore.getState();
  if (!initialized || !user) return false;

  const url = pendingUrl;
  pendingUrl = null;
  return processEmailVerificationUrl(url);
}

export function hasPendingEmailVerification(): boolean {
  return pendingUrl != null;
}
