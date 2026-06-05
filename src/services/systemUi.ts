import * as SystemUI from 'expo-system-ui';
import { Platform, StatusBar as RNStatusBar } from 'react-native';

/** Hide the OS status bar and allow the app to draw edge-to-edge. */
export async function enableFullscreenUi(): Promise<void> {
  RNStatusBar.setHidden(true, 'none');

  if (Platform.OS === 'android') {
    RNStatusBar.setTranslucent(true);
    RNStatusBar.setBackgroundColor('transparent', false);

    try {
      const NavigationBar = await import('expo-navigation-bar');
      await NavigationBar.setPositionAsync('absolute');
      await NavigationBar.setVisibilityAsync('hidden');
      await NavigationBar.setBackgroundColorAsync('#00000000');
    } catch {
      // Optional on unsupported devices.
    }
  }

  await SystemUI.setBackgroundColorAsync('transparent').catch(() => undefined);
}
