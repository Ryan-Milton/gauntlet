import fs from 'node:fs';
import path from 'node:path';
import type {
  GauntletConfig,
  GauntletSelector,
  GauntletElement,
  Point,
  WaitOptions,
  RecordingOptions,
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

  // Recording
  async startRecording(options?: RecordingOptions): Promise<void> {
    return this.getDriver().startRecording(options);
  }

  async stopRecording(outputPath?: string): Promise<string> {
    return this.getDriver().stopRecording(outputPath);
  }

  // Screenshots
  async screenshot(name?: string): Promise<Buffer> {
    return this.getDriver().screenshot(name);
  }

  async compareScreenshot(name: string, options?: VisualCompareOptions): Promise<VisualResult> {
    const threshold = options?.threshold ?? 0.1;
    const baselineDir = options?.baselineDir ?? './visual-baselines';
    const diffDir = options?.diffDir ?? './visual-diffs';
    const surface = this.config.surface;

    const baselinePath = path.join(baselineDir, surface, `${name}.png`);
    const actualDir = path.join(diffDir, surface);
    const actualPath = path.join(actualDir, `${name}-actual.png`);

    const actualBuffer = await this.getDriver().screenshot();

    fs.mkdirSync(path.dirname(baselinePath), { recursive: true });
    fs.mkdirSync(actualDir, { recursive: true });
    fs.writeFileSync(actualPath, actualBuffer);

    if (!fs.existsSync(baselinePath) || options?.updateBaseline) {
      fs.writeFileSync(baselinePath, actualBuffer);
      return {
        passed: true,
        diffPixels: 0,
        totalPixels: 0,
        diffPercentage: 0,
        baselinePath,
        actualPath,
      };
    }

    const { default: pixelmatch } = await import('pixelmatch');
    const { PNG } = await import('pngjs');

    const img1 = PNG.sync.read(fs.readFileSync(baselinePath));
    const img2 = PNG.sync.read(actualBuffer);

    if (img1.width !== img2.width || img1.height !== img2.height) {
      return {
        passed: false,
        diffPixels: -1,
        totalPixels: img1.width * img1.height,
        diffPercentage: 100,
        baselinePath,
        actualPath,
      };
    }

    const diff = new PNG({ width: img1.width, height: img1.height });
    const diffPixels = pixelmatch(
      img1.data, img2.data, diff.data,
      img1.width, img1.height,
      { threshold }
    );

    const totalPixels = img1.width * img1.height;
    const diffPercentage = (diffPixels / totalPixels) * 100;
    const passed = diffPixels === 0 || diffPercentage < threshold * 100;

    let diffImagePath: string | undefined;
    if (!passed) {
      diffImagePath = path.join(diffDir, surface, `${name}-diff.png`);
      fs.mkdirSync(path.dirname(diffImagePath), { recursive: true });
      fs.writeFileSync(diffImagePath, PNG.sync.write(diff));
    }

    return {
      passed,
      diffPixels,
      totalPixels,
      diffPercentage,
      diffImagePath,
      baselinePath,
      actualPath,
    };
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
