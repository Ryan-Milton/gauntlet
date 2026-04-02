import type { GauntletElement } from '@gauntlet/core';

export class AppiumElement implements GauntletElement {
  constructor(private readonly element: WebdriverIO.Element) {}

  async text(): Promise<string> {
    return this.element.getText();
  }

  async value(): Promise<string> {
    return (await this.element.getValue()) ?? '';
  }

  async isVisible(): Promise<boolean> {
    return this.element.isDisplayed();
  }

  async isEnabled(): Promise<boolean> {
    return this.element.isEnabled();
  }

  async tap(): Promise<void> {
    await this.element.click();
  }

  async type(text: string): Promise<void> {
    await this.element.setValue(text);
  }

  async getAttribute(name: string): Promise<string | null> {
    const val = await this.element.getAttribute(name);
    return val ?? null;
  }
}
