import { randomUUID } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

export interface AllureReporterConfig {
  outputDir?: string;
  suiteName?: string;
}

interface AllureStep {
  name: string;
  status: 'passed' | 'failed' | 'broken';
  start: number;
  stop: number;
  statusDetails?: { message: string; trace: string };
}

interface AllureAttachment {
  name: string;
  type: string;
  source: string;
}

interface AllureTestResult {
  uuid: string;
  name: string;
  status: 'passed' | 'failed' | 'broken' | 'unknown';
  start: number;
  stop: number;
  steps: AllureStep[];
  attachments: AllureAttachment[];
  statusDetails?: { message: string; trace: string };
  labels: Array<{ name: string; value: string }>;
}

interface AllureSuiteResult {
  uuid: string;
  name: string;
  start: number;
  stop: number;
  children: string[];
}

export class GauntletReporter {
  private readonly outputDir: string;
  private readonly suiteName: string;

  private currentSuite: AllureSuiteResult | null = null;
  private currentTest: AllureTestResult | null = null;
  private results: AllureTestResult[] = [];
  private suites: AllureSuiteResult[] = [];

  constructor(config?: AllureReporterConfig) {
    this.outputDir = config?.outputDir ?? 'allure-results';
    this.suiteName = config?.suiteName ?? 'Gauntlet Tests';
  }

  startSuite(name: string): void {
    this.currentSuite = {
      uuid: randomUUID(),
      name,
      start: Date.now(),
      stop: 0,
      children: [],
    };
  }

  startTest(name: string): void {
    this.currentTest = {
      uuid: randomUUID(),
      name,
      status: 'unknown',
      start: Date.now(),
      stop: 0,
      steps: [],
      attachments: [],
      labels: [
        { name: 'suite', value: this.currentSuite?.name ?? this.suiteName },
      ],
    };

    if (this.currentSuite) {
      this.currentSuite.children.push(this.currentTest.uuid);
    }
  }

  async step(name: string, body: () => Promise<void>): Promise<void> {
    if (!this.currentTest) {
      throw new Error('Cannot add step: no active test case. Call startTest() first.');
    }

    const stepRecord: AllureStep = {
      name,
      status: 'passed',
      start: Date.now(),
      stop: 0,
    };

    try {
      await body();
      stepRecord.stop = Date.now();
      stepRecord.status = 'passed';
    } catch (error) {
      stepRecord.stop = Date.now();
      stepRecord.status = 'failed';
      if (error instanceof Error) {
        stepRecord.statusDetails = {
          message: error.message,
          trace: error.stack ?? '',
        };
      }
      throw error;
    } finally {
      this.currentTest.steps.push(stepRecord);
    }
  }

  attachScreenshot(name: string, data: Buffer): void {
    if (!this.currentTest) {
      throw new Error('Cannot attach screenshot: no active test case. Call startTest() first.');
    }

    mkdirSync(this.outputDir, { recursive: true });

    const filename = `${randomUUID()}-attachment.png`;
    const filepath = join(this.outputDir, filename);
    writeFileSync(filepath, data);

    this.currentTest.attachments.push({
      name,
      type: 'image/png',
      source: filename,
    });
  }

  pass(): void {
    if (!this.currentTest) {
      throw new Error('Cannot mark as passed: no active test case. Call startTest() first.');
    }
    this.currentTest.status = 'passed';
  }

  fail(error: Error): void {
    if (!this.currentTest) {
      throw new Error('Cannot mark as failed: no active test case. Call startTest() first.');
    }
    this.currentTest.status = 'failed';
    this.currentTest.statusDetails = {
      message: error.message,
      trace: error.stack ?? '',
    };
  }

  endTest(): void {
    if (!this.currentTest) {
      throw new Error('Cannot end test: no active test case. Call startTest() first.');
    }
    this.currentTest.stop = Date.now();
    this.results.push(this.currentTest);
    this.currentTest = null;
  }

  endSuite(): void {
    if (!this.currentSuite) {
      throw new Error('Cannot end suite: no active suite. Call startSuite() first.');
    }
    this.currentSuite.stop = Date.now();
    this.suites.push(this.currentSuite);
    this.currentSuite = null;
  }

  generate(): void {
    mkdirSync(this.outputDir, { recursive: true });

    for (const result of this.results) {
      const filename = `${result.uuid}-result.json`;
      const filepath = join(this.outputDir, filename);
      writeFileSync(filepath, JSON.stringify(result, null, 2), 'utf-8');
    }

    for (const suite of this.suites) {
      const filename = `${suite.uuid}-container.json`;
      const filepath = join(this.outputDir, filename);
      writeFileSync(filepath, JSON.stringify(suite, null, 2), 'utf-8');
    }

    console.log(`[GauntletReporter] Allure results written to: ${this.outputDir}`);
    console.log(`[GauntletReporter] ${this.results.length} test result(s), ${this.suites.length} suite(s)`);
    console.log(`[GauntletReporter] Run 'allure generate ${this.outputDir}' to produce the HTML report.`);
  }
}
