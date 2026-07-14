/** @type {import('expo/config').ExpoConfig} */
const fs = require('fs');
const path = require('path');
const { withDangerousMod, withAndroidManifest, withMainApplication, withAppBuildGradle, AndroidConfig } = require('@expo/config-plugins');
const { mergeContents } = require('@expo/config-plugins/build/utils/generateCode');
const appJson = require('./app.json');

const localGoogleServicesPath = path.join(__dirname, 'google-services.json');
const EXPECTED_FIREBASE_PROJECT_ID = 'citas-mallorca-bcfa1';

const googleWebClientId =
  process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ??
  '528899539521-sk200iq6bf4pa3rga03bnr03sqo8k6be.apps.googleusercontent.com';
const googleAndroidClientId =
  process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID ??
  '528899539521-uqicjas911s0c6a1oqsom665bksdd594.apps.googleusercontent.com';

/** EAS preview/production APK signing cert (new keystore, Jul 2026). */
const EAS_ANDROID_SHA1 = '79c24d3d19410301471125b884e573b7a3be730c';
/** Play App Signing cert from Play Console → App integrity → App signing key certificate. */
const PLAY_STORE_SHA1 = '0b632e10d5ce2843b7b8f1814e63600e11d80b32';

function androidOAuthHashes(oauthClients) {
  return oauthClients
    .filter(
      (c) =>
        c.client_type === 1 &&
        c.android_info?.package_name === 'es.citasmallorca.app' &&
        c.android_info?.certificate_hash,
    )
    .map((c) => String(c.android_info.certificate_hash).toLowerCase());
}

/**
 * react-native-iap publishes amazon + play product flavors. The app module must
 * pick one via missingDimensionStrategy or Gradle fails with variant ambiguity.
 * The stock react-native-iap config plugin sometimes misses on EAS prebuild;
 * this ensures Play Store is always selected for Google Play builds.
 */
function withIapPlayStoreFlavor(config) {
  return withAppBuildGradle(config, (config) => {
    const marker = 'missingDimensionStrategy "store", "play"';
    if (config.modResults.contents.includes(marker)) {
      return config;
    }
    config.modResults.contents = mergeContents({
      tag: 'citasmallorca-iap-play-store',
      src: config.modResults.contents,
      newSrc: `        ${marker}`,
      anchor: /defaultConfig\s*\{/,
      offset: 1,
      comment: '//',
    }).contents;
    return config;
  });
}

function assertGoogleServicesOAuth(sourcePath) {
  const raw = fs.readFileSync(sourcePath, 'utf8');
  const json = JSON.parse(raw);
  const projectId = json?.project_info?.project_id;
  if (projectId !== EXPECTED_FIREBASE_PROJECT_ID) {
    throw new Error(
      `[google-services.json] project_id is "${projectId ?? 'missing'}" but expected "${EXPECTED_FIREBASE_PROJECT_ID}". ` +
        'Download a fresh file from Firebase Console (citas-mallorca-bcfa1) and update EAS GOOGLE_SERVICES_JSON.',
    );
  }
  const oauthClients = json?.client?.[0]?.oauth_client ?? [];
  const androidHashes = androidOAuthHashes(oauthClients);
  const webOAuth = oauthClients.find((c) => c.client_type === 3);

  if (androidHashes.length === 0 || !webOAuth) {
    throw new Error(
      `[google-services.json] Missing Android/Web oauth_client entries for Google Sign-In. ` +
        'In Firebase Console add the EAS upload SHA-1 and Play App Signing SHA-1, resolve any duplicate-project warning, ' +
        'then download a fresh google-services.json (do not hand-edit oauth_client).',
    );
  }

  if (!androidHashes.includes(EAS_ANDROID_SHA1)) {
    console.warn(
      `[app.config] google-services.json is missing EAS upload SHA-1 ${EAS_ANDROID_SHA1}. ` +
        'Direct EAS APK/AAB installs will fail Google Sign-In until Firebase has that fingerprint.',
    );
  }

  if (!androidHashes.includes(PLAY_STORE_SHA1)) {
    console.warn(
      `[app.config] google-services.json is missing Play App Signing SHA-1 ${PLAY_STORE_SHA1}. ` +
        'Play Store installs will fail Google Sign-In until Firebase has that fingerprint and you re-download this file.',
    );
  }

  if (webOAuth.client_id !== googleWebClientId) {
    console.warn(
      `[app.config] google-services.json Web client (${webOAuth.client_id}) ` +
        `does not match EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID (${googleWebClientId}).`,
    );
  }
}

/**
 * EAS injects GOOGLE_SERVICES_JSON as a temp file path on the builder. Copy it
 * into the project root so Expo's google-services Gradle plugin always finds
 * ./google-services.json (absolute paths outside the repo break FCM init).
 */
function materializeGoogleServicesJson(projectRoot = __dirname) {
  const targetPath = path.join(projectRoot, 'google-services.json');
  const easPath = process.env.GOOGLE_SERVICES_JSON;

  if (easPath && fs.existsSync(easPath)) {
    fs.copyFileSync(easPath, targetPath);
    console.log(`[app.config] Copied EAS GOOGLE_SERVICES_JSON -> ${targetPath}`);
  }

  if (!fs.existsSync(targetPath)) {
    const hint =
      'FCM requires google-services.json with Android + Web oauth_client entries. Commit Frontend/google-services.json ' +
      'or run: eas env:update preview --variable-name GOOGLE_SERVICES_JSON --value ./google-services.json --type file';
    if (process.env.EAS_BUILD === 'true') {
      throw new Error(`No google-services.json found for EAS Android build. ${hint}`);
    }
    console.warn(`[app.config] ${hint}`);
    return null;
  }

  assertGoogleServicesOAuth(targetPath);
  return targetPath;
}

function resolveGoogleServicesAbsolutePath(projectRoot = __dirname) {
  return materializeGoogleServicesJson(projectRoot) ?? localGoogleServicesPath;
}

function resolveGoogleServicesFile() {
  materializeGoogleServicesJson();
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

/** Overwrite Expo's notification_icon drawables with our silhouette (fit, not cover). */
function withNotificationSmallIconAssets(config) {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      const source = path.join(config.modRequest.projectRoot, 'assets', 'notification-icon.png');
      if (!fs.existsSync(source)) {
        throw new Error(
          '[withNotificationSmallIconAssets] assets/notification-icon.png missing. Run: npm run build:icons',
        );
      }

      const resRoot = path.join(config.modRequest.platformProjectRoot, 'app', 'src', 'main', 'res');
      const dpi = [
        ['drawable-mdpi', 24],
        ['drawable-hdpi', 36],
        ['drawable-xhdpi', 48],
        ['drawable-xxhdpi', 72],
        ['drawable-xxxhdpi', 96],
      ];
      const sharp = require('sharp');

      await Promise.all(
        dpi.map(async ([folder, size]) => {
          const dir = path.join(resRoot, folder);
          fs.mkdirSync(dir, { recursive: true });
          await sharp(source)
            .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
            .png()
            .toFile(path.join(dir, 'notification_icon.png'));
        }),
      );

      return config;
    },
  ]);
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
            compileSdkVersion: 35,
            targetSdkVersion: 35,
            usesCleartextTraffic: true,
            extraMavenRepos: ['https://www.jitpack.io'],
          },
        },
      ],
      [
        '@react-native-google-signin/google-signin',
        {
          iosUrlScheme:
            'com.googleusercontent.apps.921193281866-mm69ppb6imu07eggjrua33affmpu2h18',
        },
      ],
      [
        'react-native-iap',
        {
          paymentProvider: 'Play Store',
        },
      ],
      withIapPlayStoreFlavor,
      [
        'expo-notifications',
        {
          icon: './assets/notification-icon.png',
          color: '#B82E2E',
          defaultChannel: 'default',
        },
      ],
      withNotificationSmallIconAssets,
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
        projectId: '56e6fb89-8a8c-4dbe-a025-696a01924dc1',
      },
    },
  },
};
