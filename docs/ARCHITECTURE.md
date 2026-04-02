# Architecture

## Design Principles

1. **Surface Agnostic API**: `GauntletDriver` provides a single interface that works identically across web, desktop, and mobile.
2. **Driver Adapter Pattern**: Each platform has its own driver package implementing `IDriver`. The facade delegates to whichever driver is registered.
3. **Selector Unification**: The `GauntletSelector` type maps semantic selectors (testId, accessibility label, text) to platform-native formats.
4. **Zero Lock-in**: Escape hatches (`gauntlet.playwright`, `gauntlet.appium`) provide direct access to underlying drivers when needed.

## Package Dependency Graph

```
@gauntlet/core (types, GauntletDriver, selectors, ElementRegistry)
  ├── @gauntlet/driver-web       (Playwright Page)
  ├── @gauntlet/driver-electron  (Playwright Electron, reuses driver-web elements)
  ├── @gauntlet/driver-ios       (WebdriverIO + Appium XCUITest)
  ├── @gauntlet/driver-android   (WebdriverIO + Appium UiAutomator2)
  └── @gauntlet/reporter         (Allure integration)
```

## Selector Resolution Flow

```
GauntletSelector (input)
  │
  ├── string → pass through as-is
  ├── SelectorMap → pick surface key
  ├── { testId } → [data-testid] (web) | ~id (ios) | [resource-id] (android)
  ├── { accessibilityLabel } → [aria-label] (web) | ~label (ios) | [content-desc] (android)
  └── { text } → text= (web) | predicate string (ios) | UiSelector (android)
  │
  ▼
Platform-native selector string → passed to IDriver
```

## Test Execution Matrix

| Surface | Driver Package | Underlying Library | CI Requirement |
|---------|---------------|--------------------|----------------|
| Web | driver-web | Playwright | Headless browser |
| Electron | driver-electron | Playwright Electron | Electron binary |
| iOS | driver-ios | WebdriverIO + Appium | macOS + Xcode + Simulator |
| Android | driver-android | WebdriverIO + Appium | Android SDK + Emulator |
