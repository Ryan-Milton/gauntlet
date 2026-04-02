import type { PlaywrightWebConfig } from '@gauntlet/core';
import { GauntletDriver } from '@gauntlet/core';
import { PlaywrightWebDriver } from './playwright-web-driver.js';

export { PlaywrightWebDriver } from './playwright-web-driver.js';
export { PlaywrightElement } from './playwright-element.js';

/**
 * Convenience factory that creates a `GauntletDriver` wired to a
 * `PlaywrightWebDriver` for the given configuration.
 */
export function createWebDriver(config: PlaywrightWebConfig): {
  gauntlet: GauntletDriver;
  driver: PlaywrightWebDriver;
} {
  const driver = new PlaywrightWebDriver(config);
  const gauntlet = new GauntletDriver({ surface: 'web', web: config });
  gauntlet.use(driver);
  return { gauntlet, driver };
}
