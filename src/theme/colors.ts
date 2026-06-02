/**
 * Centralised brand palette. Keep in sync with tailwind.config.js so that
 * native code paths that cannot consume Tailwind classes (e.g. status bar,
 * navigation header config) still use the same colour values.
 */
export const colors = {
  cream: {
    50: '#FBF7F1',
    100: '#F5EFE5',
    200: '#F2EBE0',
    300: '#E9DECE',
    400: '#D9C8B0',
  },
  ink: {
    50: '#F7F1E9',
    100: '#E4D4C0',
    400: '#7A5640',
    600: '#503525',
    700: '#3D2618',
    800: '#2A1A10',
    900: '#1A0E07',
  },
  brand: {
    50: '#FCEDEC',
    100: '#F7D2D0',
    300: '#E07974',
    500: '#B82E2E',
    600: '#A12626',
    700: '#7F1D1D',
  },
  white: '#FFFFFF',
  black: '#000000',
  shadow: 'rgba(58, 32, 18, 0.12)',
  overlay: 'rgba(26, 14, 7, 0.45)',
} as const;

export type ColorPalette = typeof colors;
