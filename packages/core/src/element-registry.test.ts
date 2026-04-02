import { describe, it, expect, beforeEach } from 'vitest';
import { ElementRegistry } from './element-registry.js';

describe('ElementRegistry', () => {
  beforeEach(() => {
    ElementRegistry.clear();
  });

  it('defines and retrieves selectors', () => {
    ElementRegistry.define('loginButton', {
      web: '[data-testid="login-btn"]',
      ios: '~Login',
      android: 'id=com.app:id/loginButton',
    });

    expect(ElementRegistry.get('loginButton', 'web')).toBe('[data-testid="login-btn"]');
    expect(ElementRegistry.get('loginButton', 'ios')).toBe('~Login');
  });

  it('throws for unregistered elements', () => {
    expect(() => ElementRegistry.get('missing', 'web')).toThrow('Element "missing" is not registered');
  });

  it('throws for missing surface', () => {
    ElementRegistry.define('button', { web: '#btn' });
    expect(() => ElementRegistry.get('button', 'android')).toThrow(
      'Element "button" has no selector for surface "android"'
    );
  });

  it('has() checks existence', () => {
    expect(ElementRegistry.has('x')).toBe(false);
    ElementRegistry.define('x', { web: '#x' });
    expect(ElementRegistry.has('x')).toBe(true);
  });
});
