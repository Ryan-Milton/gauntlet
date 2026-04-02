import type { Locator } from 'playwright';
import type { GauntletElement } from '@gauntlet/core';

export class PlaywrightElement implements GauntletElement {
  constructor(private readonly locator: Locator) {}

  async text(): Promise<string> {
    return (await this.locator.textContent()) ?? '';
  }

  async value(): Promise<string> {
    return this.locator.inputValue();
  }

  async isVisible(): Promise<boolean> {
    return this.locator.isVisible();
  }

  async isEnabled(): Promise<boolean> {
    return this.locator.isEnabled();
  }

  async tap(): Promise<void> {
    await this.locator.click();
  }

  async type(text: string): Promise<void> {
    await this.locator.fill(text);
  }

  async getAttribute(name: string): Promise<string | null> {
    return this.locator.getAttribute(name);
  }
}
