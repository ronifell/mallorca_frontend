import { env } from '../config/env';

const LOCAL_HOST_PATTERN = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i;

/**
 * Rewrites localhost asset URLs to the API host the app actually uses.
 * Fixes photos uploaded when Backend API_BASE_URL was localhost but Expo uses a LAN IP.
 */
export function resolveMediaUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  const base = env.apiBaseUrl.replace(/\/$/, '');
  if (LOCAL_HOST_PATTERN.test(url)) {
    return url.replace(LOCAL_HOST_PATTERN, base);
  }
  return url;
}
