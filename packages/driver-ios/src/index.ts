import type { AppiumIOSConfig } from '@gauntlet/core';
import { GauntletDriver } from '@gauntlet/core';
import { AppiumIOSDriver } from './appium-ios-driver.js';

export { AppiumIOSDriver } from './appium-ios-driver.js';
export { AppiumElement } from './appium-element.js';

/**
 * Convenience factory that creates a `GauntletDriver` wired to an
 * `AppiumIOSDriver` for the given configuration.
 */
export function createIOSDriver(config: AppiumIOSConfig): {
  gauntlet: GauntletDriver;
  driver: AppiumIOSDriver;
} {
  const driver = new AppiumIOSDriver(config);
  const gauntlet = new GauntletDriver({ surface: 'ios', ios: config });
  gauntlet.use(driver);
  return { gauntlet, driver };
}
