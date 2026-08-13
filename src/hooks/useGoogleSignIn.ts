import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { authApi } from '../api/endpoints';
import { resolveAppLanguage } from '../i18n';
import { hasGoogleClientId, isGoogleConfigured, signInWithGoogle } from '../services/googleAuth';
import { useAuthStore } from '../store/auth';

export type AuthFormError = { i18nKey?: string; detail?: string; raw?: unknown };

interface Options {
  /** When true (Register flow), the user must accept Terms + Privacy first. */
  requireConsent?: boolean;
  /**
   * When true (Login flow), the footer legal copy counts as consent for new
   * Google sign-ups — always send acceptedTerms/acceptedPrivacy to the API.
   */
  implicitConsent?: boolean;
  acceptedTerms?: boolean;
  acceptedPrivacy?: boolean;
  onError?: (error: AuthFormError) => void;
}

const ERROR_KEYS = {
  in_progress: 'auth.googleInProgress',
  play_services: 'auth.googlePlayServices',
  no_token: 'auth.googleError',
  not_configured: 'auth.googleNotConfigured',
  requires_dev_build: 'auth.googleRequiresDevBuild',
  developer_error: 'auth.googleDeveloperError',
  unknown: 'auth.googleError',
} as const;

export function useGoogleSignIn({
  requireConsent = false,
  implicitConsent = false,
  acceptedTerms = false,
  acceptedPrivacy = false,
  onError,
}: Options = {}) {
  const { t, i18n } = useTranslation();
  const setSession = useAuthStore((s) => s.setSession);
  const [googleLoading, setGoogleLoading] = useState(false);

  const onGooglePress = async () => {
    if (!hasGoogleClientId) {
      onError?.({ i18nKey: 'auth.googleNotConfigured' });
      return;
    }
    if (requireConsent && (!acceptedTerms || !acceptedPrivacy)) {
      onError?.({ i18nKey: 'auth.consentRequiredBoth' });
      return;
    }

    setGoogleLoading(true);
    try {
      const outcome = await signInWithGoogle();
      if (outcome.type === 'cancelled') return;
      if (outcome.type === 'error') {
        const baseKey = ERROR_KEYS[outcome.code];
        onError?.({
          i18nKey: baseKey,
          detail:
            outcome.message && outcome.code !== 'developer_error' ? outcome.message : undefined,
        });
        return;
      }

      const hasConsent = implicitConsent || (acceptedTerms && acceptedPrivacy);
      const result = await authApi.loginWithGoogle({
        idToken: outcome.idToken,
        ...(hasConsent
          ? { acceptedTerms: true as const, acceptedPrivacy: true as const }
          : {}),
        language: resolveAppLanguage(i18n.language),
      });
      await setSession({
        user: result.user,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      });
    } catch (e) {
      onError?.({ raw: e });
    } finally {
      setGoogleLoading(false);
    }
  };

  return {
    onGooglePress,
    googleLoading,
    /** Show the button when OAuth client IDs are configured. */
    showGoogleButton: hasGoogleClientId,
    isConfigured: isGoogleConfigured,
  };
}
