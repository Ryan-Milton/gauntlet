import type { AppiumAndroidConfig } from '@gauntlet/core';
import { GauntletDriver } from '@gauntlet/core';
import { AppiumAndroidDriver } from './appium-android-driver.js';

export { AppiumAndroidDriver } from './appium-android-driver.js';
export { AppiumElement } from './appium-element.js';

/**
 * Convenience factory that creates a `GauntletDriver` wired to an
 * `AppiumAndroidDriver` for the given configuration.
 */
export function createAndroidDriver(config: AppiumAndroidConfig): {
  gauntlet: GauntletDriver;
  driver: AppiumAndroidDriver;
} {
  const driver = new AppiumAndroidDriver(config);
  const gauntlet = new GauntletDriver({ surface: 'android', android: config });
  gauntlet.use(driver);
  return { gauntlet, driver };
}
