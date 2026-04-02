import type {
  IDriver,
  GauntletElement,
  WaitOptions,
  AppiumIOSConfig,
} from '@gauntlet/core';
import { AppiumElement } from './appium-element.js';

export class AppiumIOSDriver implements IDriver {
  private browser: WebdriverIO.Browser | null = null;
  private readonly config: AppiumIOSConfig;

  get appiumBrowser(): WebdriverIO.Browser | null {
    return this.browser;
  }

  constructor(config: AppiumIOSConfig) {
    this.config = config;
  }

  async launch(_target: string): Promise<void> {
    const { remote } = await import('webdriverio');
    this.browser = await remote({
      hostname: this.config.appiumHost ?? 'localhost',
      port: this.config.appiumPort ?? 4723,
      path: '/',
      capabilities: {
        platformName: 'iOS',
        'appium:platformVersion': this.config.platformVersion,
        'appium:deviceName': this.config.deviceName,
        'appium:app': this.config.app,
        'appium:automationName': this.config.automationName ?? 'XCUITest',
        ...(this.config.udid ? { 'appium:udid': this.config.udid } : {}),
      },
    });
  }

  async close(): Promise<void> {
    await this.browser?.deleteSession();
    this.browser = null;
  }

  private getBrowser(): WebdriverIO.Browser {
    if (!this.browser) throw new Error('iOS driver not launched. Call launch() first.');
    return this.browser;
  }

  async tap(selector: string): Promise<void> {
    const el = await this.getBrowser().$(selector);
    await el.click();
  }

  async doubleTap(selector: string): Promise<void> {
    const el = await this.getBrowser().$(selector);
    await el.doubleClick();
  }

  async longPress(selector: string, duration = 1000): Promise<void> {
    const el = await this.getBrowser().$(selector);
    await this.getBrowser().action('pointer', {
      parameters: { pointerType: 'touch' },
    })
      .move({ origin: el, x: 0, y: 0 })
      .down({ button: 0 })
      .pause(duration)
      .up({ button: 0 })
      .perform();
  }

  async type(selector: string, text: string): Promise<void> {
    const el = await this.getBrowser().$(selector);
    await el.setValue(text);
  }

  async clear(selector: string): Promise<void> {
    const el = await this.getBrowser().$(selector);
    await el.clearValue();
  }

  async scroll(direction: 'up' | 'down' | 'left' | 'right', _amount?: number): Promise<void> {
    await this.getBrowser().execute('mobile: scroll', { direction });
  }

  async swipe(from: { x: number; y: number }, to: { x: number; y: number }): Promise<void> {
    await this.getBrowser().action('pointer', {
      parameters: { pointerType: 'touch' },
    })
      .move({ x: from.x, y: from.y })
      .down({ button: 0 })
      .move({ x: to.x, y: to.y, duration: 300 })
      .up({ button: 0 })
      .perform();
  }

  async find(selector: string): Promise<GauntletElement> {
    const el = await this.getBrowser().$(selector);
    return new AppiumElement(el);
  }

  async findAll(selector: string): Promise<GauntletElement[]> {
    const elements = await this.getBrowser().$$(selector);
    return elements.map((el) => new AppiumElement(el));
  }

  async waitFor(selector: string, options?: WaitOptions): Promise<void> {
    const el = await this.getBrowser().$(selector);
    await el.waitForDisplayed({ timeout: options?.timeout });
  }

  async waitForAbsence(selector: string, options?: WaitOptions): Promise<void> {
    const el = await this.getBrowser().$(selector);
    await el.waitForDisplayed({ timeout: options?.timeout, reverse: true });
  }

  async screenshot(_name?: string): Promise<Buffer> {
    const base64 = await this.getBrowser().takeScreenshot();
    return Buffer.from(base64, 'base64');
  }

  async executeScript<T>(script: string, ...args: unknown[]): Promise<T> {
    return this.getBrowser().execute(script, ...args) as Promise<T>;
  }
}
