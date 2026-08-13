import type { TFunction } from 'i18next';
import { extractErrorMessage } from '../api/client';
import type { AuthFormError } from '../hooks/useGoogleSignIn';

/** Resolve auth form errors so they re-localize when the UI language changes. */
export function resolveAuthFormError(error: AuthFormError | null, t: TFunction): string | null {
  if (!error) return null;
  if (error.i18nKey) {
    const base = t(error.i18nKey);
    return error.detail ? `${base} (${error.detail})` : base;
  }
  if (error.raw !== undefined) return extractErrorMessage(error.raw);
  return null;
}
