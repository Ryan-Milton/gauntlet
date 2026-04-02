import type { GauntletDriver } from '@gauntlet/core';

export interface ReporterOptions {
  outputDir?: string;
  screenshotOnFailure?: boolean;
  junitOutputPath?: string;
}

export class GauntletReporter {
  private readonly options: ReporterOptions;
  private readonly driver: GauntletDriver;
  private steps: Array<{ name: string; status: 'passed' | 'failed'; duration: number; screenshot?: string }> = [];

  constructor(driver: GauntletDriver, options: ReporterOptions = {}) {
    this.driver = driver;
    this.options = {
      outputDir: options.outputDir ?? 'allure-results',
      screenshotOnFailure: options.screenshotOnFailure ?? true,
      junitOutputPath: options.junitOutputPath,
    };
  }

  startStep(name: string): void {
    this.steps.push({ name, status: 'passed', duration: 0 });
  }

  async endStep(status: 'passed' | 'failed' = 'passed'): Promise<void> {
    const currentStep = this.steps[this.steps.length - 1];
    if (currentStep) {
      currentStep.status = status;
    }

    if (status === 'failed' && this.options.screenshotOnFailure) {
      try {
        const screenshot = await this.driver.screenshot();
        if (currentStep) {
          currentStep.screenshot = screenshot.toString('base64');
        }
      } catch {
        // Screenshot capture failed — not critical
      }
    }
  }

  async attachScreenshot(name: string): Promise<void> {
    const screenshot = await this.driver.screenshot();
    const currentStep = this.steps[this.steps.length - 1];
    if (currentStep) {
      currentStep.screenshot = screenshot.toString('base64');
    }
  }

  getSteps(): ReadonlyArray<{ name: string; status: string; duration: number }> {
    return this.steps;
  }

  generateJUnitXML(suiteName: string): string {
    const testcases = this.steps
      .map((s) => {
        const failure = s.status === 'failed' ? `\n      <failure message="${s.name} failed" />` : '';
        return `    <testcase name="${this.escapeXml(s.name)}" time="${s.duration}">${failure}\n    </testcase>`;
      })
      .join('\n');

    return `<?xml version="1.0" encoding="UTF-8"?>
<testsuite name="${this.escapeXml(suiteName)}" tests="${this.steps.length}" failures="${this.steps.filter((s) => s.status === 'failed').length}">
${testcases}
</testsuite>`;
  }

  private escapeXml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}
