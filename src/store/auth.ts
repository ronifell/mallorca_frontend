import { create } from 'zustand';
import { authApi, usersApi } from '../api/endpoints';
import { AuthUser } from '../api/types';
import i18n, { resolveAppLanguage } from '../i18n';
import { detachPushTokenFromServer, resetFcmTokenCache } from '../services/notifications';
import { isLogoutInFlight, setLogoutInFlight, getLogoutInFlight } from '../services/sessionTeardown';
import { tokenStorage } from '../services/storage';

export { isLogoutInFlight } from '../services/sessionTeardown';

interface AuthState {
  user: AuthUser | null;
  initialized: boolean;
  setSession: (input: { user: AuthUser; accessToken: string; refreshToken: string }) => Promise<void>;
  patchUser: (patch: Partial<AuthUser>) => void;
  setProfileComplete: (complete: boolean) => void;
  refreshVerificationStatus: () => Promise<boolean>;
  logout: () => Promise<void>;
  bootstrap: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  initialized: false,

  async setSession({ user, accessToken, refreshToken }) {
    await tokenStorage.setTokens(accessToken, refreshToken);
    set({ user, initialized: true });
    // Align push language with the UI language as soon as a session starts.
    const localLang = resolveAppLanguage(i18n.language);
    await usersApi.update({ appLanguage: localLang }).catch(() => undefined);
  },

  patchUser(patch) {
    set((s) => (s.user ? { user: { ...s.user, ...patch } } : s));
  },

  setProfileComplete(complete) {
    set((s) => (s.user ? { user: { ...s.user, profileComplete: complete } } : s));
  },

  async refreshVerificationStatus() {
    const me = await usersApi.me();
    const verified = me.emailVerified === true;
    set((s) =>
      s.user
        ? {
            user: {
              ...s.user,
              emailVerified: verified,
              isPremium: me.isPremium,
            },
          }
        : s,
    );
    return verified;
  },

  async logout() {
    const inFlight = getLogoutInFlight();
    if (inFlight) return inFlight;

    const promise = (async () => {
      try {
        await detachPushTokenFromServer();
        const refresh = await tokenStorage.getRefresh();
        if (refresh) {
          await authApi.logout(refresh).catch(() => undefined);
        }
      } catch {
        // Best-effort server cleanup; always clear local session below.
      } finally {
        await tokenStorage.clear();
        resetFcmTokenCache();
        set({ user: null, initialized: true });
        setLogoutInFlight(null);
      }
    })();

    setLogoutInFlight(promise);
    return promise;
  },

  /**
   * On app launch:
   *   - If we have a token, ping /users/me to validate it AND determine the
   *     current user's `profileComplete` / premium state.
   *   - Otherwise mark initialised with no user, so the auth navigator shows.
   */
  async bootstrap() {
    const access = await tokenStorage.getAccess();
    if (!access) {
      set({ user: null, initialized: true });
      return;
    }
    try {
      const me = await usersApi.me();
      const profileComplete =
        !!me.firstName &&
        !!me.birthDate &&
        !!me.gender &&
        !!me.city &&
        !!me.interestedIn &&
        me.photos.length > 0;
      // Keep users.language in sync with the device UI language so FCM pushes
      // (chosen server-side) match Settings → Language.
      const localLang = resolveAppLanguage(i18n.language);
      const serverLang = resolveAppLanguage(me.appLanguage);
      if (serverLang !== localLang) {
        await usersApi.update({ appLanguage: localLang }).catch(() => undefined);
      }
      set({
        user: {
          id: me.id,
          email: me.email,
          role: 'user',
          isPremium: me.isPremium,
          profileComplete,
          emailVerified: me.emailVerified === true,
        },
        initialized: true,
      });
    } catch {
      await tokenStorage.clear();
      set({ user: null, initialized: true });
    }
  },
}));
