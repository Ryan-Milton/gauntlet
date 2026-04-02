# Getting Started

## Prerequisites

- Node.js >= 18
- pnpm >= 8

## Installation

```bash
git clone <repo-url>
cd gauntlet
pnpm install
pnpm build
```

## Web Testing

```bash
# Install Playwright browsers
npx playwright install chromium

# Run the web example
cd examples/web-example
npx playwright test
```

## Electron Testing

1. Build or locate your Electron app binary
2. Set the `ELECTRON_APP_PATH` environment variable
3. Run the example:

```bash
cd examples/electron-example
ELECTRON_APP_PATH=/path/to/your/app node tests/app.test.js
```

## iOS Testing

1. Install Appium 3: `npm install -g appium`
2. Install XCUITest driver: `appium driver install xcuitest`
3. Start Appium: `appium`
4. Boot an iOS Simulator
5. Update the test config with your app path, device name, and platform version

## Android Testing

1. Install Appium 3: `npm install -g appium`
2. Install UiAutomator2 driver: `appium driver install uiautomator2`
3. Start Appium: `appium`
4. Start an Android emulator
5. Update the test config with your APK path, package name, and device info
