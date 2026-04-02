import { test, expect } from '@playwright/test';
import { GauntletDriver } from '@gauntlet/core';
import { PlaywrightWebDriver } from '@gauntlet/driver-web';

test.describe('Login Flow — the-internet.herokuapp.com', () => {
  let gauntlet: GauntletDriver;

  test.beforeEach(async () => {
    gauntlet = new GauntletDriver({ surface: 'web' });
    const webDriver = new PlaywrightWebDriver({ headless: true });
    gauntlet.use(webDriver);
    await gauntlet.launch('https://the-internet.herokuapp.com/login');
  });

  test.afterEach(async () => {
    await gauntlet.close();
  });

  test('should login with valid credentials', async () => {
    await gauntlet.type('#username', 'tomsmith');
    await gauntlet.type('#password', 'SuperSecretPassword!');
    await gauntlet.tap('button[type="submit"]');

    await gauntlet.waitFor('#flash');
    await gauntlet.assertVisible('.flash.success');
    await gauntlet.assertText('.flash.success', /You logged into a secure area!/);
  });

  test('should show error for invalid credentials', async () => {
    await gauntlet.type('#username', 'baduser');
    await gauntlet.type('#password', 'badpass');
    await gauntlet.tap('button[type="submit"]');

    await gauntlet.waitFor('#flash');
    await gauntlet.assertVisible('.flash.error');
    await gauntlet.assertText('.flash.error', /Your username is invalid!/);
  });
});
