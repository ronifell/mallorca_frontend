module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
    ],
    plugins: [
      // Inline what nativewind/babel (react-native-css-interop/babel) does,
      // but omit "react-native-worklets/plugin" which is only needed for Reanimated 4+.
      require('react-native-css-interop/dist/babel-plugin').default,
      [
        '@babel/plugin-transform-react-jsx',
        { runtime: 'automatic', importSource: 'react-native-css-interop' },
      ],
      'react-native-reanimated/plugin',
    ],
  };
};
