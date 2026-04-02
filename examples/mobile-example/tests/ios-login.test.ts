/**
 * Example iOS test using GauntletDriver + Appium.
 *
 * Prerequisites:
 *   1. Appium server running on localhost:4723
 *   2. iOS Simulator booted
 *   3. Demo app installed
 */

import { GauntletDriver, ElementRegistry } from '@gauntlet/core';
import { AppiumIOSDriver } from '@gauntlet/driver-ios';

// Register shared elements
ElementRegistry.define('usernameField', {
  ios: '~username-input',
  android: 'id=com.demo:id/username',
  web: '#username',
});

ElementRegistry.define('passwordField', {
  ios: '~password-input',
  android: 'id=com.demo:id/password',
  web: '#password',
});

ElementRegistry.define('loginButton', {
  ios: '~login-button',
  android: 'id=com.demo:id/loginBtn',
  web: 'button[type="submit"]',
});

async function runIOSExample() {
  const gauntlet = new GauntletDriver({
    surface: 'ios',
    ios: {
      platformVersion: '17.0',
      deviceName: 'iPhone 15',
      app: '/path/to/DemoApp.app',
    },
  });

  const iosDriver = new AppiumIOSDriver({
    platformVersion: '17.0',
    deviceName: 'iPhone 15',
    app: '/path/to/DemoApp.app',
  });
  gauntlet.use(iosDriver);

  try {
    await gauntlet.launch('/path/to/DemoApp.app');
    console.log('iOS app launched');

    // Use registered elements
    const usernameSelector = ElementRegistry.get('usernameField', 'ios');
    await gauntlet.type(usernameSelector, 'testuser');

    const passwordSelector = ElementRegistry.get('passwordField', 'ios');
    await gauntlet.type(passwordSelector, 'password123');

    const loginSelector = ElementRegistry.get('loginButton', 'ios');
    await gauntlet.tap(loginSelector);

    // Or use semantic selectors
    await gauntlet.waitFor({ accessibilityLabel: 'Welcome' });
    console.log('Login successful!');
  } finally {
    await gauntlet.close();
  }
}

runIOSExample().catch(console.error);
