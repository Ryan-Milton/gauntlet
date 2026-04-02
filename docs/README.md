# Gauntlet — Infinity Gauntlet Unified Testing Framework

Gauntlet is a cross-platform test automation framework that provides a single API for testing across Web, Electron, iOS, and Android.

## Quick Start

```bash
# Install
pnpm install

# Build all packages
pnpm build

# Run web example tests
cd examples/web-example && npx playwright test
```

## Packages

| Package | Description |
|---------|-------------|
| `@gauntlet/core` | GauntletDriver facade, types, selector resolution, ElementRegistry |
| `@gauntlet/driver-web` | Playwright-based web driver adapter |
| `@gauntlet/driver-electron` | Playwright-based Electron driver adapter |
| `@gauntlet/driver-ios` | WebdriverIO + Appium XCUITest driver adapter |
| `@gauntlet/driver-android` | WebdriverIO + Appium UiAutomator2 driver adapter |
| `@gauntlet/reporter` | Allure reporter integration with step decorators |

## Core Concept

Write tests once using `GauntletDriver`, then run them on any surface by swapping the driver:

```typescript
import { GauntletDriver } from '@gauntlet/core';
import { PlaywrightWebDriver } from '@gauntlet/driver-web';

const gauntlet = new GauntletDriver({ surface: 'web' });
gauntlet.use(new PlaywrightWebDriver({ headless: true }));

await gauntlet.launch('https://example.com');
await gauntlet.tap({ testId: 'login-btn' });
await gauntlet.type({ testId: 'username' }, 'user@example.com');
await gauntlet.assertVisible({ text: 'Welcome' });
await gauntlet.close();
```

## Documentation

- [Architecture](./ARCHITECTURE.md) — Design decisions and package structure
- [Getting Started](./GETTING_STARTED.md) — Setup guide for each surface
- [Selectors](./SELECTORS.md) — Selector unification guide
