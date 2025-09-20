export type TestType = 'unit' | 'integration' | 'e2e' | 'visual' | 'accessibility' | 'performance';
export type TestStatus = 'pending' | 'running' | 'passed' | 'failed' | 'skipped';
export type TestPriority = 'low' | 'medium' | 'high' | 'critical';
export type ReportFormat = 'json' | 'html' | 'xml' | 'pdf';
export type CoverageType = 'line' | 'branch' | 'function' | 'statement';

export interface TestResult {
  id: string;
  name: string;
  type: TestType;
  status: TestStatus;
  duration: number;
  coverage?: number;
  lastRun: Date;
  file: string;
  description?: string;
  error?: string;
  stackTrace?: string;
  screenshots?: string[];
  logs?: string[];
  metrics?: TestMetrics;
  tags?: string[];
  priority?: TestPriority;
  flaky?: boolean;
  retries?: number;
  environment?: string;
}

export interface TestMetrics {
  memoryUsage?: number;
  cpuUsage?: number;
  networkRequests?: number;
  renderTime?: number;
  bundleSize?: number;
  accessibility?: {
    violations: number;
    warnings: number;
    score: number;
  };
  performance?: {
    fcp: number; // First Contentful Paint
    lcp: number; // Largest Contentful Paint
    fid: number; // First Input Delay
    cls: number; // Cumulative Layout Shift
    ttfb: number; // Time to First Byte
  };
  visual?: {
    pixelDiff: number;
    threshold: number;
    baseline: string;
    actual: string;
  };
}

export interface TestSuite {
  id: string;
  name: string;
  description?: string;
  tests: TestResult[];
  setup?: string;
  teardown?: string;
  timeout?: number;
  parallel?: boolean;
  tags?: string[];
  environment?: string;
  dependencies?: string[];
}

export interface TestConfig {
  timeout: number;
  retries: number;
  parallel: boolean;
  coverage: boolean;
  watch: boolean;
  verbose: boolean;
  bail: boolean;
  reporter: string;
  outputDir: string;
  include: string[];
  exclude: string[];
  environment: Record<string, any>;
  setup?: string[];
  teardown?: string[];
  browsers?: BrowserConfig[];
  devices?: DeviceConfig[];
  thresholds?: CoverageThresholds;
}

export interface BrowserConfig {
  name: string;
  version?: string;
  headless?: boolean;
  viewport?: {
    width: number;
    height: number;
  };
  userAgent?: string;
  locale?: string;
  timezone?: string;
  permissions?: string[];
  geolocation?: {
    latitude: number;
    longitude: number;
  };
}

export interface DeviceConfig {
  name: string;
  userAgent: string;
  viewport: {
    width: number;
    height: number;
    deviceScaleFactor: number;
    isMobile: boolean;
    hasTouch: boolean;
  };
}

export interface CoverageThresholds {
  global?: {
    branches?: number;
    functions?: number;
    lines?: number;
    statements?: number;
  };
  perFile?: {
    branches?: number;
    functions?: number;
    lines?: number;
    statements?: number;
  };
}

export interface TestReport {
  id: string;
  timestamp: Date;
  summary: TestSummary;
  results: TestResult[];
  environment: Record<string, any>;
  config?: any;
  metrics?: any;
  charts?: any;
  coverage?: any;
  duration?: number;
  errors?: string[];
  warnings?: string[];
  insights?: string[];
  recommendations?: string[];
}

export interface TestSummary {
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  pending: number;
  duration: number;
  coverage: number;
  passRate?: number;
  failRate?: number;
  flakyTests?: number;
  slowTests?: number;
}

export interface TestSchedule {
  id: string;
  name: string;
  description?: string;
  cron: string;
  enabled: boolean;
  tests: string[];
  config?: Partial<TestConfig>;
  notifications?: NotificationConfig[];
  lastRun?: Date;
  nextRun?: Date;
  history: TestScheduleRun[];
}

export interface TestScheduleRun {
  id: string;
  scheduleId: string;
  startTime: Date;
  endTime?: Date;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  results?: TestResult[];
  summary?: TestSummary;
  error?: string;
}

export interface NotificationConfig {
  type: 'email' | 'slack' | 'webhook' | 'sms';
  enabled: boolean;
  recipients: string[];
  conditions: {
    onFailure?: boolean;
    onSuccess?: boolean;
    onFlaky?: boolean;
    threshold?: {
      passRate?: number;
      coverage?: number;
      duration?: number;
    };
  };
  template?: string;
}

export interface TestAutomationSettings {
  autoGenerate: {
    enabled: boolean;
    types: TestType[];
    coverage: {
      threshold: number;
      includeUncovered: boolean;
    };
    ai: {
      enabled: boolean;
      provider: 'openai' | 'anthropic' | 'local';
      model: string;
      temperature: number;
    };
  };
  execution: {
    parallel: boolean;
    maxWorkers: number;
    timeout: number;
    retries: number;
    failFast: boolean;
  };
  reporting: {
    formats: ReportFormat[];
    destinations: string[];
    realtime: boolean;
    retention: number; // days
  };
  monitoring: {
    flaky: {
      enabled: boolean;
      threshold: number;
      window: number; // runs
    };
    performance: {
      enabled: boolean;
      thresholds: {
        duration: number;
        memory: number;
        cpu: number;
      };
    };
    coverage: {
      enabled: boolean;
      thresholds: CoverageThresholds;
      trend: boolean;
    };
  };
  integration: {
    ci: {
      enabled: boolean;
      provider: 'github' | 'gitlab' | 'jenkins' | 'azure';
      webhook?: string;
      token?: string;
    };
    deployment: {
      enabled: boolean;
      environments: string[];
      smokeTests: boolean;
    };
  };
}

export interface TestFilter {
  type?: TestType[];
  status?: TestStatus[];
  tags?: string[];
  priority?: TestPriority[];
  file?: string;
  name?: string;
  duration?: {
    min?: number;
    max?: number;
  };
  coverage?: {
    min?: number;
    max?: number;
  };
  lastRun?: {
    from?: Date;
    to?: Date;
  };
  flaky?: boolean;
  environment?: string;
}

export interface TestGenerationRequest {
  type: TestType;
  target: {
    file: string;
    function?: string;
    component?: string;
    line?: number;
  };
  options: {
    coverage: boolean;
    mocking: boolean;
    assertions: string[];
    scenarios: string[];
    ai?: {
      enabled: boolean;
      prompt?: string;
      examples?: string[];
    };
  };
}

export interface TestGenerationResult {
  success: boolean;
  tests: GeneratedTest[];
  coverage: {
    before: number;
    after: number;
    improvement: number;
  };
  suggestions: string[];
  errors: string[];
}

export interface GeneratedTest {
  name: string;
  type: TestType;
  code: string;
  file: string;
  description: string;
  scenarios: string[];
  assertions: string[];
  mocks: string[];
  confidence: number;
  aiGenerated: boolean;
}

export interface TestAnalytics {
  trends: {
    passRate: TrendData[];
    coverage: TrendData[];
    duration: TrendData[];
    flaky: TrendData[];
  };
  distribution: {
    byType: Record<TestType, number>;
    byStatus: Record<TestStatus, number>;
    byPriority: Record<TestPriority, number>;
    byFile: Record<string, number>;
  };
  performance: {
    slowest: TestResult[];
    fastest: TestResult[];
    mostFlaky: TestResult[];
    leastCovered: string[];
  };
  insights: {
    recommendations: string[];
    warnings: string[];
    achievements: string[];
    metrics: Record<string, number>;
  };
}

export interface TrendData {
  date: Date;
  value: number;
  change?: number;
  changePercent?: number;
}

export interface TestExecution {
  id: string;
  startTime: Date;
  endTime?: Date;
  status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
  tests: TestResult[];
  config: TestConfig;
  trigger: 'manual' | 'scheduled' | 'webhook' | 'ci';
  user?: string;
  branch?: string;
  commit?: string;
  environment?: string;
  logs: string[];
  artifacts: string[];
}

export interface TestAlert {
  id: string;
  type: 'failure' | 'flaky' | 'performance' | 'coverage';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  timestamp: Date;
  test?: TestResult;
  execution?: string;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  resolved: boolean;
  resolvedBy?: string;
  resolvedAt?: Date;
  actions: AlertAction[];
}

export interface AlertAction {
  id: string;
  type: 'rerun' | 'ignore' | 'investigate' | 'fix';
  label: string;
  description: string;
  handler: string;
  params?: Record<string, any>;
}

export interface TestEnvironment {
  id: string;
  name: string;
  description?: string;
  type: 'local' | 'staging' | 'production' | 'ci';
  url?: string;
  config: Record<string, any>;
  variables: Record<string, string>;
  setup?: string[];
  teardown?: string[];
  active: boolean;
  lastUsed?: Date;
}

export interface TestData {
  id: string;
  name: string;
  description?: string;
  type: 'fixture' | 'mock' | 'seed' | 'snapshot';
  data: any;
  schema?: any;
  tags?: string[];
  environment?: string;
  createdAt: Date;
  updatedAt: Date;
  version: number;
}

export interface TestPlugin {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  enabled: boolean;
  config: Record<string, any>;
  hooks: {
    beforeAll?: string;
    afterAll?: string;
    beforeEach?: string;
    afterEach?: string;
    onResult?: string;
    onError?: string;
  };
  dependencies?: string[];
  permissions?: string[];
}

export interface TestWorkspace {
  id: string;
  name: string;
  description?: string;
  projects: TestProject[];
  settings: TestAutomationSettings;
  users: WorkspaceUser[];
  createdAt: Date;
  updatedAt: Date;
}

export interface TestProject {
  id: string;
  name: string;
  description?: string;
  path: string;
  config: TestConfig;
  suites: TestSuite[];
  environments: TestEnvironment[];
  schedules: TestSchedule[];
  plugins: TestPlugin[];
  active: boolean;
  lastRun?: Date;
}

export interface WorkspaceUser {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'editor' | 'viewer';
  permissions: string[];
  lastActive?: Date;
}

// Event types for real-time updates
export interface TestEvent {
  type: 'test.start' | 'test.complete' | 'test.error' | 'execution.start' | 'execution.complete' | 'alert.created';
  timestamp: Date;
  data: any;
  source: string;
}

// Utility types
export type TestResultWithSuite = TestResult & {
  suite: TestSuite;
};

export type TestExecutionSummary = Pick<TestExecution, 'id' | 'startTime' | 'endTime' | 'status' | 'trigger'> & {
  summary: TestSummary;
};

export type TestConfigPartial = Partial<TestConfig>;

export type TestFilterOptions = Partial<TestFilter>;

// Constants
export const TEST_TYPES: TestType[] = ['unit', 'integration', 'e2e', 'visual', 'accessibility', 'performance'];
export const TEST_STATUSES: TestStatus[] = ['pending', 'running', 'passed', 'failed', 'skipped'];
export const TEST_PRIORITIES: TestPriority[] = ['low', 'medium', 'high', 'critical'];
export const REPORT_FORMATS: ReportFormat[] = ['json', 'html', 'xml', 'pdf'];

// Default configurations
export const DEFAULT_TEST_CONFIG: TestConfig = {
  timeout: 30000,
  retries: 2,
  parallel: true,
  coverage: true,
  watch: false,
  verbose: false,
  bail: false,
  reporter: 'default',
  outputDir: './test-results',
  include: ['**/*.test.{ts,tsx,js,jsx}', '**/*.spec.{ts,tsx,js,jsx}'],
  exclude: ['**/node_modules/**', '**/dist/**', '**/build/**'],
  environment: {},
  thresholds: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
};

export const DEFAULT_AUTOMATION_SETTINGS: TestAutomationSettings = {
  autoGenerate: {
    enabled: false,
    types: ['unit'],
    coverage: {
      threshold: 80,
      includeUncovered: true
    },
    ai: {
      enabled: false,
      provider: 'openai',
      model: 'gpt-4',
      temperature: 0.3
    }
  },
  execution: {
    parallel: true,
    maxWorkers: 4,
    timeout: 30000,
    retries: 2,
    failFast: false
  },
  reporting: {
    formats: ['html', 'json'],
    destinations: ['./reports'],
    realtime: true,
    retention: 30
  },
  monitoring: {
    flaky: {
      enabled: true,
      threshold: 0.1,
      window: 10
    },
    performance: {
      enabled: true,
      thresholds: {
        duration: 10000,
        memory: 100,
        cpu: 80
      }
    },
    coverage: {
      enabled: true,
      thresholds: {
        global: {
          lines: 80,
          branches: 80,
          functions: 80,
          statements: 80
        }
      },
      trend: true
    }
  },
  integration: {
    ci: {
      enabled: false,
      provider: 'github'
    },
    deployment: {
      enabled: false,
      environments: ['staging', 'production'],
      smokeTests: true
    }
  }
};