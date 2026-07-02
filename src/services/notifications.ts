import * as Notifications from 'expo-notifications';
import { AppState, Platform } from 'react-native';
import { usersApi } from '../api/endpoints';
import { tokenStorage } from './storage';

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
    logPushWarning('Skipping FCM upload — user not authenticated yet');
    return false;
  }
  try {
    await usersApi.updateFcmToken(token);
    console.log('[push] FCM token saved to server');
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

export async function registerForPushNotificationsAsync(): Promise<string | null> {
  await ensureDefaultNotificationChannel();

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;
  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') {
    logPushWarning(`Notification permission not granted (${finalStatus})`);
    return null;
  }

  try {
    const tokenData = await Notifications.getDevicePushTokenAsync();
    const token = tokenData.data;
    if (token) {
      console.log('[push] FCM device token obtained');
      await persistFcmToken(token);
    }
    return token;
  } catch (err) {
    logPushWarning(
      'getDevicePushTokenAsync failed — APK must include google-services.json (Firebase not initialized)',
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

    AppState.addEventListener('change', (state) => {
      if (state === 'active') register();
    });
  }

  register();
}
