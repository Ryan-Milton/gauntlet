# Selector Unification Guide

The most powerful feature of Gauntlet is its unified selector system. Write selectors once, run on every surface.

## Selector Types

### 1. String Selectors (Raw)

Pass a platform-native selector string directly:

```typescript
await gauntlet.tap('#my-button');          // CSS (web)
await gauntlet.tap('~LoginButton');        // Accessibility ID (iOS)
await gauntlet.tap('id=com.app:id/btn');   // Resource ID (Android)
```

### 2. Test ID Selectors

Map to the appropriate test identifier on each surface:

```typescript
await gauntlet.tap({ testId: 'submit-btn' });
// Web/Electron: [data-testid="submit-btn"]
// iOS: ~submit-btn (accessibilityIdentifier)
// Android: [resource-id="submit-btn"]
```

### 3. Accessibility Label Selectors

```typescript
await gauntlet.tap({ accessibilityLabel: 'Submit' });
// Web/Electron: [aria-label="Submit"]
// iOS: ~Submit
// Android: [content-desc="Submit"]
```

### 4. Text Selectors

Match visible text on any surface:

```typescript
await gauntlet.tap({ text: 'Sign In' });
// Web/Electron: text=Sign In (Playwright text selector)
// iOS: -ios predicate string:label == "Sign In"
// Android: android=new UiSelector().text("Sign In")
```

### 5. SelectorMap (Per-Surface)

When selectors differ across surfaces, provide a map:

```typescript
await gauntlet.tap({
  web: '[data-testid="login"]',
  ios: '~LoginButton',
  android: 'id=com.app:id/loginBtn',
});
```

### 6. ElementRegistry (Page Object Model)

Pre-register elements for reuse:

```typescript
import { ElementRegistry } from '@gauntlet/core';

ElementRegistry.define('loginButton', {
  web: '[data-testid="login-btn"]',
  ios: '~Login',
  android: 'id=com.app:id/loginButton',
});

// Then use anywhere:
const selector = ElementRegistry.get('loginButton', gauntlet.surface);
await gauntlet.tap(selector);
```

## Recommended Strategy

1. **Prefer `{ testId }` selectors** — they're the most portable
2. Use `{ text }` for labels and buttons that have stable visible text
3. Use `SelectorMap` when platform selectors fundamentally differ
4. Use `ElementRegistry` to centralize selector definitions in page objects
5. Reserve raw string selectors for platform-specific tests
