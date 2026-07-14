import Constants, { ExecutionEnvironment } from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { AppState, Platform } from 'react-native';
import type {
  NavigationContainerRef,
} from '@react-navigation/native';
import { matchesApi, usersApi } from '../api/endpoints';
import { RootStackParamList } from '../navigation/types';
import { tokenStorage } from './storage';

// Expo Go uses Expo's shared Firebase project for FCM tokens — pushes sent from
// our own Firebase Admin (citas-mallorca-bcfa1) will NOT reach the device with
// those tokens. Real push delivery requires a dev/preview/production build
// created via `eas build` (which bundles google-services.json for our project).
const isExpoGo =
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

// Skip redundant PUTs when the same token is already saved.
let lastPersistedToken: string | null = null;

Notifications.setNotificationHandler({
  handleNotification: async () => {
    // Foreground chat/likes use socket + showMessageNotification; suppress FCM duplicates.
    const isForeground = AppState.currentState === 'active';
    return {
      shouldShowAlert: !isForeground,
      shouldPlaySound: !isForeground,
      shouldSetBadge: false,
      priority: Notifications.AndroidNotificationPriority.MAX,
    };
  },
  handleError(id, error) {
    console.warn('[push] foreground handler error', id, error);
  },
});

function logPushWarning(message: string, err?: unknown) {
  console.warn(`[push] ${message}`, err ?? '');
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function stringifyData(data?: Record<string, string>): Record<string, string> | undefined {
  if (!data) return undefined;
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value != null) out[key] = String(value);
  }
  return Object.keys(out).length ? out : undefined;
}

/** Must exist before any FCM/local notification is shown (Android 8+). */
export async function ensureDefaultNotificationChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync('default', {
    name: 'default',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#B82E2E',
    sound: 'default',
    enableVibrate: true,
    showBadge: true,
  });
}

async function persistFcmToken(token: string, attempt = 1): Promise<boolean> {
  const access = await tokenStorage.getAccess();
  if (!access) {
    if (attempt < 5) {
      await sleep(400 * attempt);
      return persistFcmToken(token, attempt + 1);
    }
    logPushWarning('Skipping FCM upload — user not authenticated yet (no access token after 5 retries)');
    return false;
  }
  if (lastPersistedToken === token) {
    console.log('[push] FCM token already saved this session, skipping duplicate PUT');
    return true;
  }
  try {
    await usersApi.updateFcmToken(token);
    lastPersistedToken = token;
    console.log(`[push] FCM token saved to server (prefix=${token.slice(0, 12)}…, len=${token.length})`);
    return true;
  } catch (err) {
    if (attempt < 3) {
      await sleep(500 * attempt);
      return persistFcmToken(token, attempt + 1);
    }
    logPushWarning('Failed to save FCM token to server', err);
    return false;
  }
}

/** Called from `logout()` so the next login re-issues a PUT for the new user. */
export function resetFcmTokenCache(): void {
  lastPersistedToken = null;
}

export async function registerForPushNotificationsAsync(): Promise<string | null> {
  await ensureDefaultNotificationChannel();

  if (isExpoGo) {
    logPushWarning(
      'Running in Expo Go — FCM tokens are registered against Expo\'s Firebase project, ' +
        'so pushes from citas-mallorca-69a3a will NOT arrive on this device. ' +
        'Build a dev/preview APK (eas build --profile preview --platform android) to test real push delivery.',
    );
  }

  const { status: existing } = await Notifications.getPermissionsAsync();
  console.log(`[push] Current notification permission = ${existing}`);
  let finalStatus = existing;
  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
    console.log(`[push] Requested permission → ${status}`);
  }
  if (finalStatus !== 'granted') {
    logPushWarning(
      `Notification permission not granted (${finalStatus}). ` +
        (Platform.OS === 'android'
          ? 'On Android 13+ POST_NOTIFICATIONS must be granted at runtime; ' +
            'ask the user to enable notifications in the OS settings for this app.'
          : 'Ask the user to enable notifications in iOS Settings for this app.'),
    );
    return null;
  }

  try {
    const tokenData = await Notifications.getDevicePushTokenAsync();
    const token = tokenData.data;
    if (token) {
      console.log(
        `[push] FCM device token obtained (prefix=${token.slice(0, 12)}…, len=${token.length}, expoGo=${isExpoGo})`,
      );
      await persistFcmToken(token);
    } else {
      logPushWarning('getDevicePushTokenAsync returned an empty token');
    }
    return token;
  } catch (err) {
    logPushWarning(
      'getDevicePushTokenAsync failed — APK must include google-services.json (Firebase not initialized on device)',
      err,
    );
    return null;
  }
}

/** Show a heads-up notification while the app is open (e.g. new chat message via socket). */
export async function showMessageNotification(
  title: string,
  body: string,
  data?: Record<string, string>,
): Promise<void> {
  const { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') return;

  await ensureDefaultNotificationChannel();

  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: stringifyData(data),
        sound: true,
        ...(Platform.OS === 'android' ? { channelId: 'default' } : {}),
      },
      trigger: null,
    });
  } catch (err) {
    logPushWarning('showMessageNotification failed', err);
  }
}

// ───────────────────────────────────────────────────────────────────────────
// Notification tap deep-linking
// ───────────────────────────────────────────────────────────────────────────

type NavRef = NavigationContainerRef<RootStackParamList>;

let navigationRef: NavRef | null = null;
let pendingResponse: Notifications.NotificationResponse | null = null;
let tapListenersAttached = false;

/**
 * Called from the RootNavigator once the NavigationContainer is ready. Buffers
 * any notification response that arrived before the navigator was mounted
 * (e.g. the user tapped a push while the app was cold-launching) and replays
 * it as soon as we have a nav ref.
 */
export function setNavigationRef(ref: NavRef | null): void {
  navigationRef = ref;
  if (ref && pendingResponse) {
    const buffered = pendingResponse;
    pendingResponse = null;
    void handleNotificationResponse(buffered);
  }
}

function readData(response: Notifications.NotificationResponse): Record<string, unknown> {
  const dataFromRequest = response.notification?.request?.content?.data ?? {};
  return (dataFromRequest as Record<string, unknown>) ?? {};
}

async function handleNotificationResponse(
  response: Notifications.NotificationResponse,
): Promise<void> {
  const nav = navigationRef;
  if (!nav || !nav.isReady()) {
    pendingResponse = response;
    return;
  }

  const data = readData(response);
  const type = String(data.type ?? '');

  try {
    if (type === 'new_message') {
      const conversationId = data.conversationId ? String(data.conversationId) : null;
      if (!conversationId) {
        nav.navigate('Main', { screen: 'Chat' } as never);
        return;
      }
      // Enrich with the match info so the Conversation screen shows the right header.
      let otherName: string | null = null;
      let otherUserId = '';
      let otherUserPhoto: string | null = null;
      let otherUserAge: number | null = null;
      try {
        const matches = await matchesApi.list();
        const match = matches.find((m) => m.conversationId === conversationId);
        if (match) {
          otherName = match.otherUser.firstName;
          otherUserId = match.otherUser.id;
          otherUserPhoto = match.otherUser.coverPhoto;
          otherUserAge = match.otherUser.age;
        }
      } catch (err) {
        logPushWarning('Failed to enrich conversation from notification data', err);
      }
      nav.navigate('Conversation', {
        conversationId,
        otherName,
        otherUserId,
        otherUserPhoto,
        otherUserAge,
      });
      return;
    }

    if (type === 'new_match') {
      const matchId = data.matchId ? String(data.matchId) : null;
      if (matchId) {
        nav.navigate('MatchProfile', { matchId });
        return;
      }
      nav.navigate('Main', { screen: 'Matches' } as never);
      return;
    }

    if (type === 'new_like' || type === 'super_like') {
      nav.navigate('Main', { screen: 'Discover' } as never);
      return;
    }
  } catch (err) {
    logPushWarning('Failed to route notification tap', err);
  }
}

function attachTapListeners(): void {
  if (tapListenersAttached) return;
  tapListenersAttached = true;

  Notifications.addNotificationResponseReceivedListener((response) => {
    void handleNotificationResponse(response);
  });

  // If the app was launched by tapping a notification while it was fully
  // closed, `getLastNotificationResponseAsync` returns that response once.
  Notifications.getLastNotificationResponseAsync()
    .then((response) => {
      if (response) {
        void handleNotificationResponse(response);
      }
    })
    .catch((err) => logPushWarning('getLastNotificationResponseAsync failed', err));
}

let pushRegistrationStarted = false;

/** Register for FCM and keep the backend token in sync (login, cold start, token refresh). */
export function initPushNotifications(userAuthenticated: boolean) {
  if (!userAuthenticated) return;

  const register = () => {
    registerForPushNotificationsAsync().catch((err) => {
      logPushWarning('registerForPushNotificationsAsync failed', err);
    });
  };

  if (!pushRegistrationStarted) {
    pushRegistrationStarted = true;

    void ensureDefaultNotificationChannel();

    Notifications.addPushTokenListener(({ data }) => {
      if (data) {
        persistFcmToken(data).catch((err) => {
          logPushWarning('Failed to persist refreshed FCM token', err);
        });
      }
    });

    attachTapListeners();

    AppState.addEventListener('change', (state) => {
      if (state === 'active') register();
    });
  }

  register();
}
