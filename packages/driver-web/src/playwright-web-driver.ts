import type { Browser, BrowserContext, Page, BrowserType } from 'playwright';
import type {
  IDriver,
  GauntletElement,
  WaitOptions,
  MockResponse,
  RequestHandler,
  PlaywrightWebConfig,
} from '@gauntlet/core';
import { PlaywrightElement } from './playwright-element.js';

export class PlaywrightWebDriver implements IDriver {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private page: Page | null = null;
  private readonly config: PlaywrightWebConfig;

  /** Expose underlying Playwright page for escape hatch */
  get playwrightPage(): Page | null {
    return this.page;
  }

  constructor(config: PlaywrightWebConfig = {}) {
    this.config = config;
  }

  /**
   * Create a driver from an existing Playwright Page instance.
   * Useful when integrating with `@playwright/test` fixtures.
   */
  static fromPage(page: Page): PlaywrightWebDriver {
    const driver = new PlaywrightWebDriver();
    driver.page = page;
    return driver;
  }

  async launch(url: string): Promise<void> {
    // Dynamic import to avoid hard dependency at module level
    const pw = await import('playwright');
    const browserType: BrowserType = pw[this.config.browser ?? 'chromium'];
    this.browser = await browserType.launch({
      headless: this.config.headless ?? true,
    });
    this.context = await this.browser.newContext({
      viewport: this.config.viewport,
      baseURL: this.config.baseURL,
    });
    this.page = await this.context.newPage();
    if (this.config.traceDir) {
      await this.context.tracing.start({ screenshots: true, snapshots: true });
    }
    await this.page.goto(url);
  }

  async close(): Promise<void> {
    if (this.config.traceDir && this.context) {
      await this.context.tracing.stop({
        path: `${this.config.traceDir}/trace.zip`,
      });
    }
    await this.browser?.close();
    this.page = null;
    this.context = null;
    this.browser = null;
  }

  private getPage(): Page {
    if (!this.page) throw new Error('Driver not launched. Call launch() first.');
    return this.page;
  }

  async tap(selector: string): Promise<void> {
    await this.getPage().click(selector);
  }

  async doubleTap(selector: string): Promise<void> {
    await this.getPage().dblclick(selector);
  }

  async longPress(selector: string, duration = 1000): Promise<void> {
    const page = this.getPage();
    await page.locator(selector).click({ delay: duration });
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
}
