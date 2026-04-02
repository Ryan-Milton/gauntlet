import type { ElectronApplication, Page } from 'playwright';
import type {
  IDriver,
  GauntletElement,
  WaitOptions,
  MockResponse,
  RequestHandler,
  PlaywrightElectronConfig,
} from '@gauntlet/core';
import { PlaywrightElement } from './playwright-element.js';

export class PlaywrightElectronDriver implements IDriver {
  private app: ElectronApplication | null = null;
  private page: Page | null = null;
  private readonly config: PlaywrightElectronConfig;

  get playwrightPage(): Page | null {
    return this.page;
  }

  constructor(config: PlaywrightElectronConfig) {
    this.config = config;
  }

  async launch(_target: string): Promise<void> {
    const pw = await import('playwright');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const electron = (pw as any)._electron;
    this.app = await electron.launch({
      executablePath: this.config.executablePath,
      args: this.config.args,
      env: this.config.env,
      cwd: this.config.cwd,
    });
    this.page = await this.app!.firstWindow();
  }

  async close(): Promise<void> {
    await this.app?.close();
    this.app = null;
    this.page = null;
  }

  private getPage(): Page {
    if (!this.page) throw new Error('Electron app not launched. Call launch() first.');
    return this.page;
  }

  async tap(selector: string): Promise<void> {
    await this.getPage().click(selector);
  }

  async doubleTap(selector: string): Promise<void> {
    await this.getPage().dblclick(selector);
  }

  async longPress(selector: string, duration = 1000): Promise<void> {
    await this.getPage().locator(selector).click({ delay: duration });
  }

  async type(selector: string, text: string): Promise<void> {
    await this.getPage().locator(selector).fill(text);
  }

  async clear(selector: string): Promise<void> {
    await this.getPage().locator(selector).fill('');
  }

  async scroll(direction: 'up' | 'down' | 'left' | 'right', amount = 300): Promise<void> {
    const page = this.getPage();
    const deltaX = direction === 'left' ? -amount : direction === 'right' ? amount : 0;
    const deltaY = direction === 'up' ? -amount : direction === 'down' ? amount : 0;
    await page.mouse.wheel(deltaX, deltaY);
  }

  async swipe(from: { x: number; y: number }, to: { x: number; y: number }): Promise<void> {
    const page = this.getPage();
    await page.mouse.move(from.x, from.y);
    await page.mouse.down();
    await page.mouse.move(to.x, to.y, { steps: 10 });
    await page.mouse.up();
  }

  async find(selector: string): Promise<GauntletElement> {
    const locator = this.getPage().locator(selector).first();
    return new PlaywrightElement(locator);
  }

  async findAll(selector: string): Promise<GauntletElement[]> {
    const locator = this.getPage().locator(selector);
    const count = await locator.count();
    const elements: GauntletElement[] = [];
    for (let i = 0; i < count; i++) {
      elements.push(new PlaywrightElement(locator.nth(i)));
    }
    return elements;
  }

  async waitFor(selector: string, options?: WaitOptions): Promise<void> {
    await this.getPage().locator(selector).waitFor({
      state: 'visible',
      timeout: options?.timeout,
    });
  }

  async waitForAbsence(selector: string, options?: WaitOptions): Promise<void> {
    await this.getPage().locator(selector).waitFor({
      state: 'hidden',
      timeout: options?.timeout,
    });
  }

  async screenshot(name?: string): Promise<Buffer> {
    const buffer = await this.getPage().screenshot({
      path: name ? `${name}.png` : undefined,
    });
    return Buffer.from(buffer);
  }

  async executeScript<T>(script: string, ...args: unknown[]): Promise<T> {
    return this.getPage().evaluate(script, args) as Promise<T>;
  }

  async navigate(url: string): Promise<void> {
    await this.getPage().goto(url);
  }

  async back(): Promise<void> {
    await this.getPage().goBack();
  }

  async forward(): Promise<void> {
    await this.getPage().goForward();
  }

  async reload(): Promise<void> {
    await this.getPage().reload();
  }

  async interceptRequest(pattern: string, handler: RequestHandler): Promise<void> {
    await this.getPage().route(pattern, async (route) => {
      await handler({
        url: route.request().url(),
        method: route.request().method(),
        headers: route.request().headers(),
        body: route.request().postData() ?? undefined,
        continue: async (overrides) => {
          await route.continue({
            url: overrides?.url,
            method: overrides?.method,
            headers: overrides?.headers,
            postData: overrides?.body,
          });
        },
        fulfill: async (response) => {
          await route.fulfill({
            status: response.status,
            headers: response.headers,
            body: response.body as string,
            contentType: response.contentType,
          });
        },
        abort: async () => {
          await route.abort();
        },
      });
    });
  }

  async mockResponse(pattern: string, response: MockResponse): Promise<void> {
    await this.getPage().route(pattern, async (route) => {
      await route.fulfill({
        status: response.status ?? 200,
        headers: response.headers,
        body: response.body as string,
        contentType: response.contentType,
      });
    });
  }

  /** Execute code in the Electron main process */
  async evaluateInMainProcess<T>(fn: (electronApp: unknown) => T): Promise<T> {
    if (!this.app) throw new Error('Electron app not launched');
    return this.app.evaluate(fn as Parameters<ElectronApplication['evaluate']>[0]) as Promise<T>;
  }

  /** Returns the underlying Playwright ElectronApplication instance. */
  get rawDriver(): ElectronApplication | null {
    return this.app;
  }
}
