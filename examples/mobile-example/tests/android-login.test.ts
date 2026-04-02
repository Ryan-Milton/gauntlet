/**
 * Example Android test using GauntletDriver + Appium.
 *
 * Prerequisites:
 *   1. Appium server running on localhost:4723
 *   2. Android emulator running
 *   3. Demo APK available
 */

import { GauntletDriver, ElementRegistry } from '@gauntlet/core';
import { AppiumAndroidDriver } from '@gauntlet/driver-android';

async function runAndroidExample() {
  const gauntlet = new GauntletDriver({
    surface: 'android',
    android: {
      platformVersion: '14',
      deviceName: 'Pixel 7',
      app: '/path/to/demo.apk',
      appPackage: 'com.demo.app',
      appActivity: '.MainActivity',
    },
  });

  const androidDriver = new AppiumAndroidDriver({
    platformVersion: '14',
    deviceName: 'Pixel 7',
    app: '/path/to/demo.apk',
    appPackage: 'com.demo.app',
    appActivity: '.MainActivity',
  });
  gauntlet.use(androidDriver);

  try {
    await gauntlet.launch('/path/to/demo.apk');
    console.log('Android app launched');

    // Use semantic selectors — resolved to Android format automatically
    await gauntlet.type({ testId: 'username' }, 'testuser');
    await gauntlet.type({ testId: 'password' }, 'password123');
    await gauntlet.tap({ text: 'Sign In' });

    await gauntlet.waitFor({ text: 'Welcome' });
    console.log('Login successful!');

    await gauntlet.screenshot('android-login-success');
  } finally {
    await gauntlet.close();
  }
}

runAndroidExample().catch(console.error);
