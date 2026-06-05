/** @type {import('expo/config').ExpoConfig} */
const appJson = require('./app.json');

const apiBaseUrl =
  process.env.EXPO_PUBLIC_API_BASE_URL ?? appJson.expo.extra?.apiBaseUrl;
const socketUrl =
  process.env.EXPO_PUBLIC_SOCKET_URL ??
  process.env.EXPO_PUBLIC_API_BASE_URL ??
  appJson.expo.extra?.socketUrl;

module.exports = {
  expo: {
    ...appJson.expo,
    androidStatusBar: {
      hidden: true,
      translucent: true,
      backgroundColor: '#F2EBE0',
    },
    androidNavigationBar: {
      visible: 'sticky-immersive',
      backgroundColor: '#00000000',
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
    },
  },
};
