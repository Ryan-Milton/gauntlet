import type {
  GauntletConfig,
  GauntletSelector,
  GauntletElement,
  Point,
  WaitOptions,
  VisualCompareOptions,
  VisualResult,
  MockResponse,
  RequestHandler,
} from './types.js';
import type { IDriver } from './driver.interface.js';
import { resolveSelector } from './selectors.js';

export class GauntletDriver {
  private driver: IDriver | null = null;
  private readonly config: GauntletConfig;

  constructor(config: GauntletConfig) {
    this.config = config;
  }

  /**
   * Register a driver implementation. Called by driver packages.
   */
  use(driver: IDriver): void {
    this.driver = driver;
  }

  private getDriver(): IDriver {
    if (!this.driver) {
      throw new Error(
        `No driver registered for surface "${this.config.surface}". ` +
        `Call driver.use() with the appropriate driver implementation.`
      );
    }
    return this.driver;
  }

  private resolve(selector: GauntletSelector): string {
    return resolveSelector(selector, this.config.surface);
  }

  get surface() {
    return this.config.surface;
  }

  // Lifecycle
  async launch(urlOrAppPath: string): Promise<void> {
    return this.getDriver().launch(urlOrAppPath);
  }

  async close(): Promise<void> {
    return this.getDriver().close();
  }

  // Interaction
  async tap(selector: GauntletSelector): Promise<void> {
    return this.getDriver().tap(this.resolve(selector));
  }

  async doubleTap(selector: GauntletSelector): Promise<void> {
    return this.getDriver().doubleTap(this.resolve(selector));
  }

  async longPress(selector: GauntletSelector, duration?: number): Promise<void> {
    return this.getDriver().longPress(this.resolve(selector), duration);
  }

  async type(selector: GauntletSelector, text: string): Promise<void> {
    return this.getDriver().type(this.resolve(selector), text);
  }

  async clear(selector: GauntletSelector): Promise<void> {
    return this.getDriver().clear(this.resolve(selector));
  }

  async scroll(direction: 'up' | 'down' | 'left' | 'right', amount?: number): Promise<void> {
    return this.getDriver().scroll(direction, amount);
  }

  async swipe(from: Point, to: Point): Promise<void> {
    return this.getDriver().swipe(from, to);
  }

  // Querying
  async find(selector: GauntletSelector): Promise<GauntletElement> {
    return this.getDriver().find(this.resolve(selector));
  }

  async findAll(selector: GauntletSelector): Promise<GauntletElement[]> {
    return this.getDriver().findAll(this.resolve(selector));
  }

  async waitFor(selector: GauntletSelector, options?: WaitOptions): Promise<void> {
    return this.getDriver().waitFor(this.resolve(selector), options);
  }

  async waitForAbsence(selector: GauntletSelector, options?: WaitOptions): Promise<void> {
    return this.getDriver().waitForAbsence(this.resolve(selector), options);
  }

  // Assertions
  async assertVisible(selector: GauntletSelector): Promise<void> {
    const el = await this.find(selector);
    const visible = await el.isVisible();
    if (!visible) {
      throw new Error(`Expected element to be visible: ${JSON.stringify(selector)}`);
    }
  }

  async assertHidden(selector: GauntletSelector): Promise<void> {
    const el = await this.find(selector);
    const visible = await el.isVisible();
    if (visible) {
      throw new Error(`Expected element to be hidden: ${JSON.stringify(selector)}`);
    }
  }

  async assertText(selector: GauntletSelector, expected: string | RegExp): Promise<void> {
    const el = await this.find(selector);
    const text = await el.text();
    if (typeof expected === 'string') {
      if (text !== expected) {
        throw new Error(`Expected text "${expected}" but got "${text}"`);
      }
    } else {
      if (!expected.test(text)) {
        throw new Error(`Expected text matching ${expected} but got "${text}"`);
      }
    }
  }

  async assertValue(selector: GauntletSelector, expected: string): Promise<void> {
    const el = await this.find(selector);
    const value = await el.value();
    if (value !== expected) {
      throw new Error(`Expected value "${expected}" but got "${value}"`);
    }
  }

  async assertEnabled(selector: GauntletSelector): Promise<void> {
    const el = await this.find(selector);
    const enabled = await el.isEnabled();
    if (!enabled) {
      throw new Error(`Expected element to be enabled: ${JSON.stringify(selector)}`);
    }
  }

  async assertDisabled(selector: GauntletSelector): Promise<void> {
    const el = await this.find(selector);
    const enabled = await el.isEnabled();
    if (enabled) {
      throw new Error(`Expected element to be disabled: ${JSON.stringify(selector)}`);
    }
  }

  // Navigation (web/electron)
  async navigate(url: string): Promise<void> {
    const driver = this.getDriver();
    if (!driver.navigate) {
      throw new Error(`navigate() is not supported on surface "${this.config.surface}"`);
    }
    return driver.navigate(url);
  }

  async back(): Promise<void> {
    const driver = this.getDriver();
    if (!driver.back) {
      throw new Error(`back() is not supported on surface "${this.config.surface}"`);
    }
    return driver.back();
  }

  async forward(): Promise<void> {
    const driver = this.getDriver();
    if (!driver.forward) {
      throw new Error(`forward() is not supported on surface "${this.config.surface}"`);
    }
    return driver.forward();
  }

  async reload(): Promise<void> {
    const driver = this.getDriver();
    if (!driver.reload) {
      throw new Error(`reload() is not supported on surface "${this.config.surface}"`);
    }
    return driver.reload();
  }

  // Screenshots
  async screenshot(name?: string): Promise<Buffer> {
    return this.getDriver().screenshot(name);
  }

  async compareScreenshot(_name: string, _options?: VisualCompareOptions): Promise<VisualResult> {
    // Visual comparison is a placeholder — real implementation would use pixelmatch or similar
    throw new Error('compareScreenshot() is not yet implemented');
  }

  // Network (web/electron)
  async interceptRequest(pattern: string, handler: RequestHandler): Promise<void> {
    const driver = this.getDriver();
    if (!driver.interceptRequest) {
      throw new Error(`interceptRequest() is not supported on surface "${this.config.surface}"`);
    }
    return driver.interceptRequest(pattern, handler);
  }

  async mockResponse(pattern: string, response: MockResponse): Promise<void> {
    const driver = this.getDriver();
    if (!driver.mockResponse) {
      throw new Error(`mockResponse() is not supported on surface "${this.config.surface}"`);
    }
    return driver.mockResponse(pattern, response);
  }

  // Script execution
  async executeScript<T>(script: string | Function, ...args: unknown[]): Promise<T> {
    const scriptStr = typeof script === 'function' ? script.toString() : script;
    return this.getDriver().executeScript<T>(scriptStr, ...args);
  }

  // Escape hatches — these return null; drivers can expose their own typed accessors
  get playwright(): unknown {
    return (this.driver as Record<string, unknown> | null)?.['playwrightPage'] ?? null;
  }

  get appium(): unknown {
    return (this.driver as Record<string, unknown> | null)?.['appiumBrowser'] ?? null;
  }
}
