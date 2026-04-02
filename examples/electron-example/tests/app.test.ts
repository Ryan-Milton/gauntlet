/**
 * Example Electron test using GauntletDriver.
 *
 * To run this test, set ELECTRON_APP_PATH to the path of your Electron app binary.
 * For example:
 *   ELECTRON_APP_PATH=/Applications/MyApp.app/Contents/MacOS/MyApp npx vitest run
 */

import { GauntletDriver } from '@gauntlet/core';
import { PlaywrightElectronDriver } from '@gauntlet/driver-electron';

async function runElectronExample() {
  const appPath = process.env['ELECTRON_APP_PATH'];
  if (!appPath) {
    console.log('Skipping: ELECTRON_APP_PATH not set');
    return;
  }

  const gauntlet = new GauntletDriver({
    surface: 'electron',
    electron: {
      executablePath: appPath,
      args: ['--no-sandbox'],
    },
  });

  const electronDriver = new PlaywrightElectronDriver({
    executablePath: appPath,
    args: ['--no-sandbox'],
  });
  gauntlet.use(electronDriver);

  try {
    await gauntlet.launch(appPath);
    console.log('Electron app launched successfully');

    // Example: find the main heading
    const title = await gauntlet.find('h1');
    console.log('Title text:', await title.text());

    // Take a screenshot
    await gauntlet.screenshot('electron-example');
    console.log('Screenshot saved');
  } finally {
    await gauntlet.close();
  }
}

runElectronExample().catch(console.error);
