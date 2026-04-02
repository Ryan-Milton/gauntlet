export type Surface = 'web' | 'electron' | 'ios' | 'android';

export interface Point {
  x: number;
  y: number;
}

export interface WaitOptions {
  timeout?: number;
  interval?: number;
}

export interface RecordingOptions {
  size?: { width: number; height: number };
  fps?: number;          // default 30
  outputDir?: string;    // defaults to ./recordings
}

export interface VisualCompareOptions {
  threshold?: number;        // 0-1, default 0.1
  updateBaseline?: boolean;  // if true, save as new baseline instead of comparing
  baselineDir?: string;      // default ./visual-baselines
  diffDir?: string;          // default ./visual-diffs
}

export interface VisualResult {
  passed: boolean;
  diffPixels: number;
  totalPixels: number;
  diffPercentage: number;
  diffImagePath?: string;    // path to diff PNG if failed
  baselinePath: string;
  actualPath: string;
}

export interface PlaywrightWebConfig {
  browser?: 'chromium' | 'firefox' | 'webkit';
  headless?: boolean;
  viewport?: { width: number; height: number };
  baseURL?: string;
  traceDir?: string;
  recording?: RecordingOptions;
}

export interface PlaywrightElectronConfig {
  executablePath: string;
  args?: string[];
  env?: Record<string, string>;
  cwd?: string;
  recording?: RecordingOptions;
}

export interface AppiumIOSConfig {
  platformVersion: string;
  deviceName: string;
  app: string;
  udid?: string;
  automationName?: string;
  appiumHost?: string;
  appiumPort?: number;
}

export interface AppiumAndroidConfig {
  platformVersion: string;
  deviceName: string;
  app: string;
  appPackage: string;
  appActivity?: string;
  automationName?: string;
  appiumHost?: string;
  appiumPort?: number;
}

export interface GauntletConfig {
  surface: Surface;
  web?: PlaywrightWebConfig;
  electron?: PlaywrightElectronConfig;
  ios?: AppiumIOSConfig;
  android?: AppiumAndroidConfig;
  timeout?: number;
  screenshotDir?: string;
}

export type GauntletSelector =
  | string
  | SelectorMap
  | { accessibilityLabel: string }
  | { testId: string }
  | { text: string };

export interface SelectorMap {
  web?: string;
  electron?: string;
  ios?: string;
  android?: string;
}

export interface GauntletElement {
  text(): Promise<string>;
  value(): Promise<string>;
  isVisible(): Promise<boolean>;
  isEnabled(): Promise<boolean>;
  tap(): Promise<void>;
  type(text: string): Promise<void>;
  getAttribute(name: string): Promise<string | null>;
}

export type RequestHandler = (request: InterceptedRequest) => Promise<void> | void;

export interface InterceptedRequest {
  url: string;
  method: string;
  headers: Record<string, string>;
  body?: string;
  continue(overrides?: RequestOverrides): Promise<void>;
  fulfill(response: MockResponse): Promise<void>;
  abort(): Promise<void>;
}

export interface RequestOverrides {
  url?: string;
  method?: string;
  headers?: Record<string, string>;
  body?: string;
}

export interface MockResponse {
  status?: number;
  headers?: Record<string, string>;
  body?: string | Buffer;
  contentType?: string;
}
