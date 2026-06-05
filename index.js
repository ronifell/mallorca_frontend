import 'react-native-gesture-handler';
import { Platform, StatusBar } from 'react-native';
import { registerRootComponent } from 'expo';
import App from './App';
import { enableFullscreenUi } from './src/services/systemUi';

// Must run before registerRootComponent so the Android window is marked
// translucent before the first frame is drawn. Without this, the app window
// starts below the status bar and no amount of CSS/style fixes can cover it.
if (Platform.OS === 'android') {
  StatusBar.setTranslucent(true);
  StatusBar.setBackgroundColor('#F2EBE0', false);
}
StatusBar.setHidden(true, 'none');
enableFullscreenUi().catch(() => undefined);

registerRootComponent(App);
