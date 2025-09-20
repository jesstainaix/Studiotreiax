import { TestResult, TestType, TestStatus, TestReport, TestConfig } from '../types/testing';

export interface TestRunnerConfig {
  parallel: boolean;
  timeout: number;
  retries: number;
  coverage: boolean;
  watch: boolean;
  verbose: boolean;
  bail: boolean;
}

export interface TestRunOptions {
  types?: TestType[];
  files?: string[];
  pattern?: string;
  config?: Partial<TestRunnerConfig>;
}

export interface TestRunResult {
  success: boolean;
  results: TestResult[];
  summary: TestSummary;
  duration: number;
  coverage?: any;
  errors: string[];
}

export interface TestSummary {
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  pending: number;
  duration: number;
  coverage: number;
}

export class TestRunner {
  private static instance: TestRunner;
  private config: TestRunnerConfig;
  private isRunning: boolean = false;
  private currentRun: AbortController | null = null;
  private listeners: Map<string, Function[]> = new Map();

  private constructor() {
    this.config = {
      parallel: true,
      timeout: 30000,
      retries: 2,
      coverage: true,
      watch: false,
      verbose: false,
      bail: false
    };
    this.loadConfig();
  }

  public static getInstance(): TestRunner {
    if (!TestRunner.instance) {
      TestRunner.instance = new TestRunner();
    }
    return TestRunner.instance;
  }

  public async runTests(options: TestRunOptions = {}): Promise<TestRunResult> {
    if (this.isRunning) {
      throw new Error('Tests are already running');
    }

    this.isRunning = true;
    this.currentRun = new AbortController();
    const startTime = Date.now();

    try {
      this.emit('start', { options });

      const config = { ...this.config, ...options.config };
      const testFiles = await this.discoverTests(options);
      
      this.emit('discovery', { files: testFiles });

      const results = await this.executeTests(testFiles, config);
      const duration = Date.now() - startTime;
      const summary = this.calculateSummary(results, duration);

      const runResult: TestRunResult = {
        success: summary.failed === 0,
        results,
        summary,
        duration,
        errors: []
      };

      this.emit('complete', runResult);
      return runResult;

    } catch (error) {
      const duration = Date.now() - startTime;
      const errorResult: TestRunResult = {
        success: false,
        results: [],
        summary: {
          total: 0,
          passed: 0,
          failed: 0,
          skipped: 0,
          pending: 0,
          duration,
          coverage: 0
        },
        duration,
        errors: [error instanceof Error ? error.message : String(error)]
      };

      this.emit('error', { error, result: errorResult });
      return errorResult;

    } finally {
      this.isRunning = false;
      this.currentRun = null;
    }
  }

  public stopTests(): void {
    if (this.currentRun) {
      this.currentRun.abort();
      this.emit('stop', {});
    }
  }

  public isTestsRunning(): boolean {
    return this.isRunning;
  }

  public updateConfig(newConfig: Partial<TestRunnerConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.saveConfig();
    this.emit('configUpdate', { config: this.config });
  }

  public getConfig(): TestRunnerConfig {
    return { ...this.config };
  }

  public on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  public off(event: string, callback: Function): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  public async generateReport(results: TestResult[], format: 'json' | 'html' | 'xml' = 'json'): Promise<string> {
    const report: TestReport = {
      id: `report-${Date.now()}`,
      timestamp: new Date(),
      summary: this.calculateSummary(results, 0),
      results,
      environment: this.getEnvironmentInfo(),
      config: this.config
    };

    switch (format) {
      case 'json':
        return JSON.stringify(report, null, 2);
      case 'html':
        return this.generateHTMLReport(report);
      case 'xml':
        return this.generateXMLReport(report);
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }

  private async discoverTests(options: TestRunOptions): Promise<string[]> {
    // Simulate test discovery
    const allTests = [
      'src/test/unit/components/TestAutomationPanel.test.tsx',
      'src/test/unit/hooks/useTestAutomation.test.ts',
      'src/test/unit/utils/coverageAnalyzer.test.ts',
      'src/test/integration/api/auth.test.ts',
      'src/test/integration/components/form.test.tsx',
      'src/test/e2e/app.spec.ts',
      'src/test/e2e/navigation.spec.ts'
    ];

    let filteredTests = allTests;

    if (options.types && options.types.length > 0) {
      filteredTests = allTests.filter(test => {
        return options.types!.some(type => test.includes(`/${type}/`));
      });
    }

    if (options.pattern) {
      const regex = new RegExp(options.pattern, 'i');
      filteredTests = filteredTests.filter(test => regex.test(test));
    }

    if (options.files && options.files.length > 0) {
      filteredTests = filteredTests.filter(test => 
        options.files!.some(file => test.includes(file))
      );
    }

    return filteredTests;
  }

  private async executeTests(testFiles: string[], config: TestRunnerConfig): Promise<TestResult[]> {
    const results: TestResult[] = [];

    if (config.parallel) {
      // Simulate parallel execution
      const promises = testFiles.map(file => this.executeTestFile(file, config));
      const parallelResults = await Promise.all(promises);
      results.push(...parallelResults.flat());
    } else {
      // Sequential execution
      for (const file of testFiles) {
        if (this.currentRun?.signal.aborted) {
          break;
        }
        const fileResults = await this.executeTestFile(file, config);
        results.push(...fileResults);
        
        if (config.bail && fileResults.some(r => r.status === 'failed')) {
          break;
        }
      }
    }

    return results;
  }

  private async executeTestFile(file: string, config: TestRunnerConfig): Promise<TestResult[]> {
    // Simulate test execution for a file
    const testCount = Math.floor(Math.random() * 5) + 1;
    const results: TestResult[] = [];

    for (let i = 0; i < testCount; i++) {
      if (this.currentRun?.signal.aborted) {
        break;
      }

      const testName = `Test ${i + 1} in ${file.split('/').pop()}`;
      const startTime = Date.now();
      
      // Simulate test execution time
      await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 100));
      
      const duration = Date.now() - startTime;
      const status = this.simulateTestResult();
      
      const result: TestResult = {
        id: `${file}-${i}`,
        name: testName,
        type: this.getTestType(file),
        status,
        duration,
        coverage: status === 'passed' ? Math.floor(Math.random() * 30) + 70 : 0,
        lastRun: new Date(),
        file,
        description: `Automated test for ${testName}`,
        error: status === 'failed' ? this.generateMockError() : undefined
      };

      results.push(result);
      this.emit('testComplete', { result });
    }

    return results;
  }

  private simulateTestResult(): TestStatus {
    const rand = Math.random();
    if (rand < 0.8) return 'passed';
    if (rand < 0.95) return 'failed';
    return 'skipped';
  }

  private getTestType(file: string): TestType {
    if (file.includes('/unit/')) return 'unit';
    if (file.includes('/integration/')) return 'integration';
    if (file.includes('/e2e/')) return 'e2e';
    return 'unit';
  }

  private generateMockError(): string {
    const errors = [
      'Expected true but received false',
      'Timeout: Test exceeded 5000ms',
      'Element not found: [data-testid="submit-button"]',
      'Network error: Failed to fetch',
      'Assertion failed: Expected 5 but received 3'
    ];
    return errors[Math.floor(Math.random() * errors.length)];
  }

  private calculateSummary(results: TestResult[], duration: number): TestSummary {
    const total = results.length;
    const passed = results.filter(r => r.status === 'passed').length;
    const failed = results.filter(r => r.status === 'failed').length;
    const skipped = results.filter(r => r.status === 'skipped').length;
    const pending = results.filter(r => r.status === 'pending').length;
    
    const totalCoverage = results.reduce((sum, r) => sum + (r.coverage || 0), 0);
    const coverage = total > 0 ? Math.round(totalCoverage / total) : 0;

    return {
      total,
      passed,
      failed,
      skipped,
      pending,
      duration,
      coverage
    };
  }

  private getEnvironmentInfo(): Record<string, any> {
    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      }
    };
  }

  private generateHTMLReport(report: TestReport): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <title>Test Report - ${report.timestamp.toISOString()}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .summary { background: #f5f5f5; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
        .passed { color: green; }
        .failed { color: red; }
        .skipped { color: orange; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
    </style>
</head>
<body>
    <h1>Test Report</h1>
    <div class="summary">
        <h2>Summary</h2>
        <p>Total: ${report.summary.total}</p>
        <p class="passed">Passed: ${report.summary.passed}</p>
        <p class="failed">Failed: ${report.summary.failed}</p>
        <p class="skipped">Skipped: ${report.summary.skipped}</p>
        <p>Coverage: ${report.summary.coverage}%</p>
        <p>Duration: ${report.summary.duration}ms</p>
    </div>
    
    <h2>Test Results</h2>
    <table>
        <tr>
            <th>Test Name</th>
            <th>Type</th>
            <th>Status</th>
            <th>Duration</th>
            <th>Coverage</th>
        </tr>
        ${report.results.map(result => `
        <tr>
            <td>${result.name}</td>
            <td>${result.type}</td>
            <td class="${result.status}">${result.status}</td>
            <td>${result.duration}ms</td>
            <td>${result.coverage || 0}%</td>
        </tr>
        `).join('')}
    </table>
</body>
</html>
    `;
  }

  private generateXMLReport(report: TestReport): string {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<testReport>\n';
    xml += `  <timestamp>${report.timestamp.toISOString()}</timestamp>\n`;
    xml += '  <summary>\n';
    xml += `    <total>${report.summary.total}</total>\n`;
    xml += `    <passed>${report.summary.passed}</passed>\n`;
    xml += `    <failed>${report.summary.failed}</failed>\n`;
    xml += `    <skipped>${report.summary.skipped}</skipped>\n`;
    xml += `    <coverage>${report.summary.coverage}</coverage>\n`;
    xml += `    <duration>${report.summary.duration}</duration>\n`;
    xml += '  </summary>\n';
    xml += '  <results>\n';
    
    report.results.forEach(result => {
      xml += '    <test>\n';
      xml += `      <name>${result.name}</name>\n`;
      xml += `      <type>${result.type}</type>\n`;
      xml += `      <status>${result.status}</status>\n`;
      xml += `      <duration>${result.duration}</duration>\n`;
      xml += `      <coverage>${result.coverage || 0}</coverage>\n`;
      if (result.error) {
        xml += `      <error>${result.error}</error>\n`;
      }
      xml += '    </test>\n';
    });
    
    xml += '  </results>\n';
    xml += '</testReport>';
    return xml;
  }

  private emit(event: string, data: any): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  private loadConfig(): void {
    try {
      const stored = localStorage.getItem('testRunnerConfig');
      if (stored) {
        this.config = { ...this.config, ...JSON.parse(stored) };
      }
    } catch (error) {
      console.warn('Failed to load test runner config:', error);
    }
  }

  private saveConfig(): void {
    try {
      localStorage.setItem('testRunnerConfig', JSON.stringify(this.config));
    } catch (error) {
      console.warn('Failed to save test runner config:', error);
    }
  }
}

// Export singleton instance
export const testRunner = TestRunner.getInstance();

// Export utility functions
export const runTests = (options?: TestRunOptions) => testRunner.runTests(options);
export const stopTests = () => testRunner.stopTests();
export const getTestResults = () => testRunner.isTestsRunning();
export const generateTestReport = (results: TestResult[], format?: 'json' | 'html' | 'xml') => 
  testRunner.generateReport(results, format);