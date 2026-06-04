import { env } from '../config/env';

const LOCAL_HOST_PATTERN = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i;
const LAN_HOST_PATTERN = /^https?:\/\/(192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3})(:\d+)?/i;
const UPLOADS_PATH_RE = /\/uploads\/(.+?)(?:\?|#|$)/;

/**
 * Rewrites media URLs to the API host the app uses.
 * Handles localhost/LAN dev URLs and legacy /uploads/ paths after server moves.
 */
export function resolveMediaUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  const base = env.apiBaseUrl.replace(/\/$/, '');

  const uploadsMatch = url.match(UPLOADS_PATH_RE);
  if (uploadsMatch) {
    return `${base}/uploads/${decodeURIComponent(uploadsMatch[1])}`;
  }

  if (LOCAL_HOST_PATTERN.test(url)) {
    return url.replace(LOCAL_HOST_PATTERN, base);
  }

  if (LAN_HOST_PATTERN.test(url)) {
    return url.replace(LAN_HOST_PATTERN, base);
  }

  return url;
}
