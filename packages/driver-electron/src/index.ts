import type { PlaywrightElectronConfig } from '@gauntlet/core';
import { GauntletDriver } from '@gauntlet/core';

import { PlaywrightElectronDriver } from './playwright-electron-driver.js';

export { PlaywrightElectronDriver } from './playwright-electron-driver.js';
export { PlaywrightElement } from './playwright-element.js';

/**
 * Convenience factory that wires up a `PlaywrightElectronDriver` behind a
 * `GauntletDriver` facade, ready to use.
 *
 * @example
 * ```ts
 * const { gauntlet, driver } = createElectronDriver({
 *   executablePath: '/usr/local/bin/electron',
 * });
 * await gauntlet.launch('./my-app');
 * ```
 */
export function createElectronDriver(config: PlaywrightElectronConfig): {
  gauntlet: GauntletDriver;
  driver: PlaywrightElectronDriver;
} {
  const driver = new PlaywrightElectronDriver(config);
  const gauntlet = new GauntletDriver({ surface: 'electron', electron: config });
  gauntlet.use(driver);
  return { gauntlet, driver };
}
