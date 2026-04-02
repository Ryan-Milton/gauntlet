import { describe, it, expect } from 'vitest';
import { resolveSelector } from './selectors.js';

describe('resolveSelector', () => {
  it('passes through string selectors unchanged', () => {
    expect(resolveSelector('#my-button', 'web')).toBe('#my-button');
    expect(resolveSelector('~Login', 'ios')).toBe('~Login');
  });

  it('resolves SelectorMap to the correct surface', () => {
    const map = {
      web: '[data-testid="btn"]',
      ios: '~LoginBtn',
      android: 'id=com.app:id/btn',
    };
    expect(resolveSelector(map, 'web')).toBe('[data-testid="btn"]');
    expect(resolveSelector(map, 'ios')).toBe('~LoginBtn');
    expect(resolveSelector(map, 'android')).toBe('id=com.app:id/btn');
  });

  it('throws when SelectorMap is missing a surface', () => {
    const map = { web: '#btn' };
    expect(() => resolveSelector(map, 'ios')).toThrow('No selector defined for surface "ios"');
  });

  it('resolves accessibilityLabel for each surface', () => {
    const sel = { accessibilityLabel: 'Submit' };
    expect(resolveSelector(sel, 'web')).toBe('[aria-label="Submit"]');
    expect(resolveSelector(sel, 'electron')).toBe('[aria-label="Submit"]');
    expect(resolveSelector(sel, 'ios')).toBe('~Submit');
    expect(resolveSelector(sel, 'android')).toBe('[content-desc="Submit"]');
  });

  it('resolves testId for each surface', () => {
    const sel = { testId: 'login-btn' };
    expect(resolveSelector(sel, 'web')).toBe('[data-testid="login-btn"]');
    expect(resolveSelector(sel, 'electron')).toBe('[data-testid="login-btn"]');
    expect(resolveSelector(sel, 'ios')).toBe('~login-btn');
    expect(resolveSelector(sel, 'android')).toBe('[resource-id="login-btn"]');
  });

  it('resolves text selectors for each surface', () => {
    const sel = { text: 'Sign In' };
    expect(resolveSelector(sel, 'web')).toBe('text=Sign In');
    expect(resolveSelector(sel, 'ios')).toBe('-ios predicate string:label == "Sign In"');
    expect(resolveSelector(sel, 'android')).toBe('android=new UiSelector().text("Sign In")');
  });
});
