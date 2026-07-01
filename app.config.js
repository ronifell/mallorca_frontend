/** @type {import('expo/config').ExpoConfig} */
const fs = require('fs');
const path = require('path');
const appJson = require('./app.json');

const localGoogleServicesPath = path.join(__dirname, 'google-services.json');

function resolveGoogleServicesFile() {
  if (process.env.GOOGLE_SERVICES_JSON) {
    return process.env.GOOGLE_SERVICES_JSON;
  }
  if (fs.existsSync(localGoogleServicesPath)) {
    return './google-services.json';
  }
  const hint =
    'FCM will not work on Android. Add Frontend/google-services.json or run: ' +
    'eas env:create preview --name GOOGLE_SERVICES_JSON --type file --value ./google-services.json';
  if (process.env.EAS_BUILD === 'true') {
    throw new Error(`google-services.json missing for EAS Android build. ${hint}`);
  }
  console.warn(`[app.config] ${hint}`);
  return './google-services.json';
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
      [
        'expo-build-properties',
        {
          android: {
            usesCleartextTraffic: true,
            extraMavenRepos: ['https://www.jitpack.io'],
          },
        },
      ],
      '@react-native-google-signin/google-signin',
      ...(appJson.expo.plugins ?? []),
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
      // EAS injects GOOGLE_SERVICES_JSON as a file path on cloud builds; local builds use ./google-services.json.
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
      eas: {
        projectId: '2a257000-2886-4f51-a75a-c6694a8c4ee6',
      },
    },
  },
};
