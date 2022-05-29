const { default: tsjPreset } = require('ts-jest/presets');

/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  preset: 'react-native',
  globals: {
    'ts-jest': {
      babelConfig: true,
      tsconfig: './tsconfig.spec.json',
    },
  },
  testEnvironment: 'node',
  setupFilesAfterEnv: ['./setupTests.js'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  transform: {
    '^.+\\.jsx$': 'babel-jest',
    '^.+\\.tsx?$': 'ts-jest',
  },
  testRegex: '(/__tests__/.*|\\.(test|spec))\\.(ts|tsx|js)$',
  testPathIgnorePatterns: [
    '\\.snap$',
    '<rootDir>/node_modules/',
  ],
  transformIgnorePatterns: ['node_modules/(?!(@react-native|react-native|react-native-animatable))'],
  cacheDirectory: '.jest/cache'
};
