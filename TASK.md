# Build: Infinity Gauntlet Unified Testing Framework

## Project Name
`gauntlet` — a TypeScript monorepo for cross-platform test automation covering Web, Electron, iOS, and Android from a single unified API.

## Architecture Overview

This is a **TypeScript abstraction library** that wraps:
- **Playwright** → Web (Chromium/Firefox/WebKit) + Electron
- **WebdriverIO + Appium 3** → iOS (XCUITest) + Android (UIAutomator2)

Into a single `GauntletDriver` facade with a unified surface-agnostic API.

## What to Build

Scaffold a complete, well-structured TypeScript monorepo with the following:

### Root Package Structure
```
gauntlet/
├── package.json              # workspace root (pnpm workspaces)
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── vitest.config.ts
├── .github/
│   └── workflows/
│       └── ci.yml            # matrix: web, electron, ios, android
├── packages/
│   ├── core/                 # GauntletDriver facade + shared types
│   ├── driver-web/           # Playwright web driver adapter
│   ├── driver-electron/      # Playwright electron driver adapter
│   ├── driver-ios/           # WebdriverIO + Appium iOS adapter
│   ├── driver-android/       # WebdriverIO + Appium Android adapter
│   └── reporter/             # Allure reporter integration
├── examples/
│   ├── web-example/          # Example web test suite
│   ├── electron-example/     # Example Electron test suite
│   └── mobile-example/       # Example mobile test suite
└── docs/
    ├── README.md
    ├── ARCHITECTURE.md
    ├── GETTING_STARTED.md
    └── SELECTORS.md          # Selector unification guide
```

### Core Package (`packages/core`)

The heart of the framework. Must include:

#### `GauntletDriver` class
```typescript
export type Surface = 'web' | 'electron' | 'ios' | 'android';

export interface GauntletConfig {
  surface: Surface;
  web?: PlaywrightWebConfig;
  electron?: PlaywrightElectronConfig;
  ios?: AppiumIOSConfig;
  android?: AppiumAndroidConfig;
}

export class GauntletDriver {
  constructor(config: GauntletConfig);
  
  // Lifecycle
  launch(urlOrAppPath: string): Promise<void>;
  close(): Promise<void>;
  
  // Interaction
  tap(selector: GauntletSelector): Promise<void>;
  doubleTap(selector: GauntletSelector): Promise<void>;
  longPress(selector: GauntletSelector, duration?: number): Promise<void>;
  type(selector: GauntletSelector, text: string): Promise<void>;
  clear(selector: GauntletSelector): Promise<void>;
  scroll(direction: 'up' | 'down' | 'left' | 'right', amount?: number): Promise<void>;
  swipe(from: Point, to: Point): Promise<void>;
  
  // Querying
  find(selector: GauntletSelector): Promise<GauntletElement>;
  findAll(selector: GauntletSelector): Promise<GauntletElement[]>;
  waitFor(selector: GauntletSelector, options?: WaitOptions): Promise<void>;
  waitForAbsence(selector: GauntletSelector, options?: WaitOptions): Promise<void>;
  
  // Assertions
  assertVisible(selector: GauntletSelector): Promise<void>;
  assertHidden(selector: GauntletSelector): Promise<void>;
  assertText(selector: GauntletSelector, expected: string | RegExp): Promise<void>;
  assertValue(selector: GauntletSelector, expected: string): Promise<void>;
  assertEnabled(selector: GauntletSelector): Promise<void>;
  assertDisabled(selector: GauntletSelector): Promise<void>;
  
  // Navigation (web/electron)
  navigate(url: string): Promise<void>;
  back(): Promise<void>;
  forward(): Promise<void>;
  reload(): Promise<void>;
  
  // Screenshots & Visual
  screenshot(name?: string): Promise<Buffer>;
  compareScreenshot(name: string, options?: VisualCompareOptions): Promise<VisualResult>;
  
  // Network (web/electron only)
  interceptRequest(pattern: string, handler: RequestHandler): Promise<void>;
  mockResponse(pattern: string, response: MockResponse): Promise<void>;
  
  // Context
  executeScript<T>(script: string | Function, ...args: unknown[]): Promise<T>;
  
  // Escape hatch: access underlying driver directly
  get playwright(): PlaywrightPage | null;
  get appium(): WebdriverIO.Browser | null;
}
```

#### `GauntletSelector` — the unification layer (most important)
```typescript
// Selectors can be surface-specific or semantic
export type GauntletSelector = 
  | string                    // auto-detect surface selector
  | SelectorMap               // surface-specific map
  | { accessibilityLabel: string }  // normalized a11y
  | { testId: string }        // maps to data-testid (web) or accessibilityIdentifier (iOS)
  | { text: string }          // visible text match (all surfaces)

export interface SelectorMap {
  web?: string;           // CSS selector
  electron?: string;      // CSS selector  
  ios?: string;           // ~AccessibilityLabel or -ios predicate string
  android?: string;       // id=resource_id or content-desc
}
```

#### `ElementRegistry` — Page Object Model helper
```typescript
// Define elements once, use on all surfaces
export class ElementRegistry {
  static define(name: string, selectors: SelectorMap): void;
  static get(name: string, surface: Surface): string;
}

// Usage:
ElementRegistry.define('loginButton', {
  web: '[data-testid="login-btn"]',
  ios: '~Login',
  android: 'id=com.app:id/loginButton',
});
```

#### Driver interface (`IDriver`)
```typescript
export interface IDriver {
  launch(target: string): Promise<void>;
  close(): Promise<void>;
  tap(selector: string): Promise<void>;
  type(selector: string, text: string): Promise<void>;
  find(selector: string): Promise<IElement>;
  findAll(selector: string): Promise<IElement[]>;
  waitFor(selector: string, options?: WaitOptions): Promise<void>;
  screenshot(): Promise<Buffer>;
  executeScript<T>(script: string, ...args: unknown[]): Promise<T>;
  navigate?(url: string): Promise<void>;
  interceptRequest?(pattern: string, handler: RequestHandler): Promise<void>;
}
```

### Driver Packages

Each driver package implements `IDriver`:

#### `driver-web` (Playwright)
- Wraps `@playwright/test` Page API
- Supports all Playwright browser types (chromium/firefox/webkit)
- Implements network interception via `page.route()`
- Maps `GauntletSelector` → CSS/XPath/text selectors
- Exposes Playwright Trace Viewer integration

#### `driver-electron` (Playwright Electron)
- Wraps `playwright._electron.launch()`
- Shares the same selector/interaction API as `driver-web`
- Supports Electron `app.evaluate()` for main process access
- Config: app binary path, args, env

#### `driver-ios` (WebdriverIO + Appium)
- Wraps `webdriverio` with `appium-xcuitest-driver`
- Maps `GauntletSelector` → XCUITest predicates / accessibility labels
- Supports real device and simulator
- Config: `platformVersion`, `deviceName`, `app`, UDID

#### `driver-android` (WebdriverIO + Appium)
- Wraps `webdriverio` with `appium-uiautomator2-driver`
- Maps `GauntletSelector` → resource IDs / content descriptions
- Supports real device and emulator
- Config: `platformVersion`, `deviceName`, `app`, `appPackage`

### Reporter Package

- Allure reporter integration
- Screenshots attached to test steps automatically
- Step-level logging with `@Step` decorator support
- JUnit XML output for CI

### Examples

Each example should have a complete, runnable test:

**web-example**: Login flow test on a demo site (https://the-internet.herokuapp.com/login)
**electron-example**: Test against a simple Electron app (can be a stub)
**mobile-example**: A sample Appium test targeting a demo app

### Documentation

**README.md**: Project overview, quick start, installation
**ARCHITECTURE.md**: Full architecture diagram and design decisions
**GETTING_STARTED.md**: Step-by-step setup for each surface
**SELECTORS.md**: The selector unification guide — this is critical

## Tech Stack
- Language: TypeScript 5.x
- Package manager: pnpm + workspaces
- Test runner: Vitest (for unit tests of the framework itself)
- Web driver: @playwright/test
- Mobile driver: webdriverio + @wdio/globals
- Reporting: allure-playwright, allure-js
- Linting: ESLint + @typescript-eslint
- Formatting: Prettier

## Quality Requirements
- All packages must have proper `package.json` with correct peer deps
- Full TypeScript types throughout — no `any` unless absolutely necessary
- Each package must have unit tests (where logic exists to test)
- CI workflow must run web tests (Playwright headless) and unit tests
- Mobile CI steps should be gated on platform availability

## Output
Create the full scaffold in the current directory. Initialize git, create all files, install dependencies (pnpm install), ensure TypeScript compiles (pnpm -r build), and run the web example test.

When completely finished, run this command to notify:
openclaw system event --text "Done: Infinity Gauntlet framework scaffolded — full TypeScript monorepo with web/electron/iOS/Android drivers, unified GauntletDriver API, selector registry, examples, and docs" --mode now
