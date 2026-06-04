import { useSafeAreaInsets } from 'react-native-safe-area-context';

/** Top padding for content below the hidden status bar (notch / camera area). */
export function useTopScreenPadding(min = 8): number {
  const { top } = useSafeAreaInsets();
  return Math.max(top, min);
}
