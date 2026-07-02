/** @type {import('expo/config').ExpoConfig} */
const fs = require('fs');
const path = require('path');
const { withDangerousMod, withAndroidManifest, withMainApplication, AndroidConfig } = require('@expo/config-plugins');
const { mergeContents } = require('@expo/config-plugins/build/utils/generateCode');
const appJson = require('./app.json');

const localGoogleServicesPath = path.join(__dirname, 'google-services.json');

const googleWebClientId =
  process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ??
  '348711983822-7tp79tt59u3vrsusl2iave6o0taqpaiv.apps.googleusercontent.com';
const googleAndroidClientId =
  process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID ??
  '348711983822-t881asjhgq217qmiv1dle7gm00plvd0g.apps.googleusercontent.com';

/** EAS preview/production APK signing cert (from `eas credentials` / keytool on the APK). */
const EAS_ANDROID_SHA1 = 'ad617be1fe9b49aed1d13379f80a924e7117836e';

function assertGoogleServicesOAuth(sourcePath) {
  const raw = fs.readFileSync(sourcePath, 'utf8');
  const json = JSON.parse(raw);
  const oauthClients = json?.client?.[0]?.oauth_client ?? [];
  const androidOAuth = oauthClients.find(
    (c) =>
      c.client_type === 1 &&
      c.android_info?.package_name === 'es.citasmallorca.app' &&
      c.android_info?.certificate_hash,
  );
  const webOAuth = oauthClients.find((c) => c.client_type === 3);

  if (!androidOAuth || !webOAuth) {
    throw new Error(
      `[google-services.json] Missing Android/Web oauth_client entries for Google Sign-In. ` +
        'In Firebase Console → Project settings → Your Android app, add the EAS APK SHA-1 fingerprint, ' +
        'then download a fresh google-services.json (do not hand-edit oauth_client).',
    );
  }

  const hash = String(androidOAuth.android_info.certificate_hash).toLowerCase();
  if (hash !== EAS_ANDROID_SHA1) {
    console.warn(
      `[app.config] google-services.json Android SHA-1 is ${hash}; expected EAS SHA-1 ${EAS_ANDROID_SHA1}. ` +
        'Google Sign-In will fail in preview APK builds until Firebase has the EAS fingerprint.',
    );
  }

  if (webOAuth.client_id !== googleWebClientId) {
    console.warn(
      `[app.config] google-services.json Web client (${webOAuth.client_id}) ` +
        `does not match EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID (${googleWebClientId}).`,
    );
  }
}

function resolveGoogleServicesAbsolutePath(projectRoot = __dirname) {
  const easPath = process.env.GOOGLE_SERVICES_JSON;
  if (easPath && fs.existsSync(easPath)) {
    return easPath;
  }

  const localPath = path.join(projectRoot, 'google-services.json');
  if (fs.existsSync(localPath)) {
    return localPath;
  }

  const hint =
    'FCM requires google-services.json. Commit Frontend/google-services.json or run: ' +
    'eas env:create preview --name GOOGLE_SERVICES_JSON --type file --value ./google-services.json';

  if (process.env.EAS_BUILD === 'true') {
    throw new Error(`google-services.json missing for EAS Android build. ${hint}`);
  }

  console.warn(`[app.config] ${hint}`);
  return localPath;
}

function resolveGoogleServicesFile() {
  const easPath = process.env.GOOGLE_SERVICES_JSON;
  if (easPath && fs.existsSync(easPath)) {
    return easPath;
  }
  if (fs.existsSync(localGoogleServicesPath)) {
    return './google-services.json';
  }
  if (process.env.EAS_BUILD === 'true') {
    throw new Error(
      'google-services.json missing for EAS Android build. Commit Frontend/google-services.json ' +
        'or upload it as GOOGLE_SERVICES_JSON.',
    );
  }
  return './google-services.json';
}

/** Fail the build if Firebase config is not copied into android/app/. */
function withEnsureGoogleServices(config) {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const source = resolveGoogleServicesAbsolutePath(projectRoot);
      if (!fs.existsSync(source)) {
        throw new Error(
          `[withEnsureGoogleServices] google-services.json not found at ${source}. ` +
            'Push notifications will not work without it.',
        );
      }

      assertGoogleServicesOAuth(source);

      const destination = path.join(
        config.modRequest.platformProjectRoot,
        'app',
        'google-services.json',
      );
      fs.mkdirSync(path.dirname(destination), { recursive: true });
      fs.copyFileSync(source, destination);
      console.log(`[withEnsureGoogleServices] copied ${source} -> ${destination}`);
      return config;
    },
  ]);
}

/** Create the FCM notification channel before any push can arrive (Android 8+). */
function withDefaultNotificationChannelAtBoot(config) {
  return withMainApplication(config, (config) => {
    config.modResults.contents = mergeContents({
      tag: 'citasmallorca-default-notification-channel',
      src: config.modResults.contents,
      newSrc: `
    if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
      val channel = android.app.NotificationChannel(
        "default",
        "General",
        android.app.NotificationManager.IMPORTANCE_HIGH
      )
      channel.enableVibration(true)
      channel.setShowBadge(true)
      channel.lockscreenVisibility = android.app.Notification.VISIBILITY_PUBLIC
      val notificationManager = getSystemService(android.app.NotificationManager::class.java)
      notificationManager?.createNotificationChannel(channel)
    }
      `.trim(),
      anchor: /ApplicationLifecycleDispatcher\.onApplicationCreate\(this\)/,
      offset: 1,
      comment: '//',
    }).contents;
    return config;
  });
}

/** Full-color logo in the notification shade (large icon). */
function withNotificationLargeIcon(config) {
  return withAndroidManifest(config, (config) => {
    const mainApplication = AndroidConfig.Manifest.getMainApplicationOrThrow(config.modResults);
    AndroidConfig.Manifest.addMetaDataItemToMainApplication(
      mainApplication,
      'expo.modules.notifications.large_notification_icon',
      '@drawable/notification_large_icon',
      'resource',
    );
    return config;
  });
}

/** Copy full-color logo into Android drawables for notification large icon. */
function withNotificationLargeIconAssets(config) {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      const source = path.join(config.modRequest.projectRoot, 'assets', 'notification-large-icon.png');
      if (!fs.existsSync(source)) {
        throw new Error(
          '[withNotificationLargeIconAssets] assets/notification-large-icon.png missing. Run: npm run build:icons',
        );
      }

      const smallIcon = path.join(config.modRequest.projectRoot, 'assets', 'notification-icon.png');
      if (!fs.existsSync(smallIcon)) {
        throw new Error(
          '[withNotificationLargeIconAssets] assets/notification-icon.png missing. Run: npm run build:icons',
        );
      }

      const resRoot = path.join(config.modRequest.platformProjectRoot, 'app', 'src', 'main', 'res');
      const folders = [
        'drawable-mdpi',
        'drawable-hdpi',
        'drawable-xhdpi',
        'drawable-xxhdpi',
        'drawable-xxxhdpi',
      ];
      const sizes = [64, 96, 128, 192, 256];

      await Promise.all(
        folders.map(async (folder, index) => {
          const dir = path.join(resRoot, folder);
          fs.mkdirSync(dir, { recursive: true });
          const sharp = require('sharp');
          await sharp(source)
            .resize(sizes[index], sizes[index], { fit: 'contain', background: { r: 242, g: 235, b: 224, alpha: 1 } })
            .png()
            .toFile(path.join(dir, 'notification_large_icon.png'));
        }),
      );

      return config;
    },
  ]);
}

const apiBaseUrl =
  process.env.EXPO_PUBLIC_API_BASE_URL ?? appJson.expo.extra?.apiBaseUrl;
const socketUrl =
  process.env.EXPO_PUBLIC_SOCKET_URL ??
  process.env.EXPO_PUBLIC_API_BASE_URL ??
  appJson.expo.extra?.socketUrl;

module.exports = {
  expo: {
    ...appJson.expo,
    plugins: [
      withEnsureGoogleServices,
      withNotificationLargeIconAssets,
      withNotificationLargeIcon,
      withDefaultNotificationChannelAtBoot,
      [
        'expo-build-properties',
        {
          android: {
            usesCleartextTraffic: true,
            extraMavenRepos: ['https://www.jitpack.io'],
          },
        },
      ],
      [
        '@react-native-google-signin/google-signin',
        {
          iosUrlScheme:
            'com.googleusercontent.apps.348711983822-7tp79tt59u3vrsusl2iave6o0taqpaiv',
        },
      ],
      [
        'expo-notifications',
        {
          icon: './assets/notification-icon.png',
          color: '#B82E2E',
          defaultChannel: 'default',
        },
      ],
      ...(appJson.expo.plugins ?? []).filter(
        (plugin) =>
          plugin !== 'expo-notifications' &&
          !(Array.isArray(plugin) && plugin[0] === 'expo-notifications'),
      ),
    ],
    androidStatusBar: {
      hidden: true,
      translucent: true,
      backgroundColor: '#F2EBE0',
    },
    androidNavigationBar: {
      visible: 'sticky-immersive',
      backgroundColor: '#00000000',
    },
    android: {
      ...appJson.expo.android,
      googleServicesFile: resolveGoogleServicesFile(),
    },
    ios: {
      ...appJson.expo.ios,
      infoPlist: {
        ...appJson.expo.ios?.infoPlist,
        UIStatusBarHidden: true,
        UIViewControllerBasedStatusBarAppearance: false,
      },
    },
    extra: {
      ...appJson.expo.extra,
      apiBaseUrl,
      socketUrl,
      googleWebClientId,
      googleAndroidClientId,
      eas: {
        projectId: '2a257000-2886-4f51-a75a-c6694a8c4ee6',
      },
    },
  },
};
