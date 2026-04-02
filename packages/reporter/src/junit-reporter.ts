import { writeFileSync } from 'node:fs';

interface TestResult {
  suite: string;
  test: string;
  status: 'passed' | 'failed' | 'skipped';
  duration: number;
  error?: string;
}

export class JUnitReporter {
  private results: TestResult[] = [];

  addResult(
    suite: string,
    test: string,
    status: 'passed' | 'failed' | 'skipped',
    duration: number,
    error?: string,
  ): void {
    this.results.push({ suite, test, status, duration, error });
  }

  toXML(): string {
    const suiteMap = new Map<string, TestResult[]>();

    for (const result of this.results) {
      const existing = suiteMap.get(result.suite);
      if (existing) {
        existing.push(result);
      } else {
        suiteMap.set(result.suite, [result]);
      }
    }

    const lines: string[] = [];
    lines.push('<?xml version="1.0" encoding="UTF-8"?>');
    lines.push('<testsuites>');

    for (const [suiteName, tests] of suiteMap) {
      const totalTests = tests.length;
      const failures = tests.filter((t) => t.status === 'failed').length;
      const skipped = tests.filter((t) => t.status === 'skipped').length;
      const totalTime = tests.reduce((sum, t) => sum + t.duration, 0);

      lines.push(
        `  <testsuite name="${escapeXml(suiteName)}" tests="${totalTests}" failures="${failures}" skipped="${skipped}" time="${(totalTime / 1000).toFixed(3)}">`,
      );

      for (const test of tests) {
        lines.push(
          `    <testcase name="${escapeXml(test.test)}" classname="${escapeXml(suiteName)}" time="${(test.duration / 1000).toFixed(3)}">`,
        );

        if (test.status === 'failed') {
          lines.push(
            `      <failure message="${escapeXml(test.error ?? 'Unknown error')}">${escapeXml(test.error ?? '')}</failure>`,
          );
        } else if (test.status === 'skipped') {
          lines.push('      <skipped/>');
        }

        lines.push('    </testcase>');
      }

      lines.push('  </testsuite>');
    }

    lines.push('</testsuites>');
    return lines.join('\n');
  }

  writeToFile(path: string): void {
    const xml = this.toXML();
    writeFileSync(path, xml, 'utf-8');
  }
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
