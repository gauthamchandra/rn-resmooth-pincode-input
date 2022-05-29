// See https://github.com/facebook/react/issues/20756
// This fix is only useful in a test environment with
// Node 15+, jsdom, and React < 17.1.0.
delete global.MessageChannel;

import '@testing-library/jest-native/extend-expect';

jest.mock('react-native-animatable', () => {
  /**
   * Animatable.View uses React Native's Animated module.
   *
   * Any animations that get kicked off aren't really observable in tests anyway and
   * fixing it requires using fake timers and overriding requestAnimationFrame; something that
   * for now is more work than it's worth.
   * */
  const View = require('react-native').View;
  const real = jest.requireActual('react-native-animatable');
  return {
    ...real,
    View,
  };
});
