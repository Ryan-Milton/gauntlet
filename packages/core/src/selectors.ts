import type { GauntletSelector, Surface, SelectorMap } from './types.js';

export function resolveSelector(selector: GauntletSelector, surface: Surface): string {
  // string — pass through as-is
  if (typeof selector === 'string') {
    return selector;
  }

  // SelectorMap — pick the right surface key
  if (isSelectorMap(selector)) {
    const resolved = selector[surface];
    if (!resolved) {
      throw new Error(`No selector defined for surface "${surface}" in SelectorMap`);
    }
    return resolved;
  }

  // { accessibilityLabel }
  if ('accessibilityLabel' in selector) {
    return resolveAccessibilityLabel(selector.accessibilityLabel, surface);
  }

  // { testId }
  if ('testId' in selector) {
    return resolveTestId(selector.testId, surface);
  }

  // { text }
  if ('text' in selector) {
    return resolveText(selector.text, surface);
  }

  throw new Error(`Invalid selector: ${JSON.stringify(selector)}`);
}

function isSelectorMap(sel: GauntletSelector): sel is SelectorMap {
  return (
    typeof sel === 'object' &&
    !('accessibilityLabel' in sel) &&
    !('testId' in sel) &&
    !('text' in sel)
  );
}

function resolveAccessibilityLabel(label: string, surface: Surface): string {
  switch (surface) {
    case 'web':
    case 'electron':
      return `[aria-label="${label}"]`;
    case 'ios':
      return `~${label}`;
    case 'android':
      return `[content-desc="${label}"]`;  // UiSelector notation handled by driver
  }
}

function resolveTestId(testId: string, surface: Surface): string {
  switch (surface) {
    case 'web':
    case 'electron':
      return `[data-testid="${testId}"]`;
    case 'ios':
      return `~${testId}`;   // accessibilityIdentifier
    case 'android':
      return `[resource-id="${testId}"]`;
  }
}

function resolveText(text: string, surface: Surface): string {
  switch (surface) {
    case 'web':
    case 'electron':
      return `text=${text}`;  // Playwright text selector
    case 'ios':
      return `-ios predicate string:label == "${text}"`;
    case 'android':
      return `android=new UiSelector().text("${text}")`;
  }
}
