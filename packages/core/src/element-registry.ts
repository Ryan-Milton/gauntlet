import type { SelectorMap, Surface } from './types.js';

const registry = new Map<string, SelectorMap>();

export class ElementRegistry {
  static define(name: string, selectors: SelectorMap): void {
    registry.set(name, selectors);
  }

  static get(name: string, surface: Surface): string {
    const map = registry.get(name);
    if (!map) {
      throw new Error(`Element "${name}" is not registered`);
    }
    const selector = map[surface];
    if (!selector) {
      throw new Error(`Element "${name}" has no selector for surface "${surface}"`);
    }
    return selector;
  }

  static has(name: string): boolean {
    return registry.has(name);
  }

  static clear(): void {
    registry.clear();
  }
}
