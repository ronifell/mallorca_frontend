/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './App.tsx',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // Brand palette inspired by citasmallorca.es
        cream: {
          50: '#FBF7F1',
          100: '#F5EFE5',
          200: '#F2EBE0',  // page background
          300: '#E9DECE',
          400: '#D9C8B0',
        },
        ink: {
          50: '#F7F1E9',
          100: '#E4D4C0',
          400: '#7A5640',
          600: '#503525',
          700: '#3D2618',   // primary text
          800: '#2A1A10',
          900: '#1A0E07',
        },
        brand: {
          50: '#FCEDEC',
          100: '#F7D2D0',
          200: '#EFA6A2',
          300: '#E07974',
          400: '#D24B47',
          500: '#B82E2E',  // primary
          600: '#A12626',
          700: '#7F1D1D',
          800: '#601717',
        },
        coral: {
          50: '#FEF0EE',
          100: '#FDE4E0',
          400: '#F07A6E',
          500: '#E8554E',
          600: '#D44A42',
        },
        // semantic
        success: '#2E7D5B',
        warning: '#C68A2E',
        danger: '#B82E2E',
      },
      fontFamily: {
        serif: ['NotoSerif_400Regular'],
        sans: ['System'],
      },
      borderRadius: {
        pill: '999px',
      },
    },
  },
  plugins: [],
};
