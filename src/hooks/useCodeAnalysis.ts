import { useState, useEffect, useCallback, useRef } from 'react';

// Types
export interface CodeMetric {
  id: string;
  name: string;
  value: number;
  threshold: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  category: 'complexity' | 'maintainability' | 'performance' | 'security' | 'quality';
  file?: string;
  line?: number;
  column?: number;
}

export interface CodeIssue {
  id: string;
  type: 'error' | 'warning' | 'info' | 'suggestion';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  description: string;
  file: string;
  line: number;
  column: number;
  rule: string;
  category: string;
  fixable: boolean;
  suggestion?: string;
  createdAt: Date;
}

export interface CodeSmell {
  id: string;
  type: string;
  name: string;
  description: string;
  file: string;
  startLine: number;
  endLine: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  impact: number;
  effort: number;
  debt: number; // Technical debt in minutes
  tags: string[];
}

export interface DependencyInfo {
  name: string;
  version: string;
  type: 'production' | 'development' | 'peer' | 'optional';
  size: number;
  vulnerabilities: number;
  outdated: boolean;
  license: string;
  description: string;
  homepage?: string;
  repository?: string;
}

export interface CodeCoverage {
  file: string;
  lines: {
    total: number;
    covered: number;
    percentage: number;
  };
  functions: {
    total: number;
    covered: number;
    percentage: number;
  };
  branches: {
    total: number;
    covered: number;
    percentage: number;
  };
  statements: {
    total: number;
    covered: number;
    percentage: number;
  };
}

export interface AnalysisReport {
  id: string;
  timestamp: Date;
  duration: number;
  filesAnalyzed: number;
  linesOfCode: number;
  metrics: CodeMetric[];
  issues: CodeIssue[];
  smells: CodeSmell[];
  coverage?: CodeCoverage[];
  dependencies: DependencyInfo[];
  summary: {
    quality: number;
    maintainability: number;
    reliability: number;
    security: number;
    performance: number;
    technicalDebt: number;
  };
}

export interface AnalysisConfig {
  enabled: boolean;
  autoAnalysis: boolean;
  analysisInterval: number;
  includeTests: boolean;
  includeDependencies: boolean;
  enableRealTime: boolean;
  rules: {
    [category: string]: {
      [rule: string]: {
        enabled: boolean;
        severity: 'low' | 'medium' | 'high' | 'critical';
        threshold?: number;
      };
    };
  };
  excludePatterns: string[];
  includePatterns: string[];
  maxFileSize: number;
  timeout: number;
}

export interface AnalysisState {
  isAnalyzing: boolean;
  currentReport: AnalysisReport | null;
  reports: AnalysisReport[];
  metrics: CodeMetric[];
  issues: CodeIssue[];
  smells: CodeSmell[];
  dependencies: DependencyInfo[];
  coverage: CodeCoverage[];
  config: AnalysisConfig;
  error: string | null;
  progress: {
    current: number;
    total: number;
    stage: string;
  };
}

// Code Analysis Engine
class CodeAnalysisEngine {
  private config: AnalysisConfig;
  private workers: Worker[] = [];
  private analysisQueue: string[] = [];
  private isRunning = false;
  private observers: ((state: Partial<AnalysisState>) => void)[] = [];

  constructor(config: AnalysisConfig) {
    this.config = config;
    this.initializeWorkers();
  }

  private initializeWorkers() {
    const workerCount = Math.min(navigator.hardwareConcurrency || 4, 4);
    
    for (let i = 0; i < workerCount; i++) {
      try {
        const worker = new Worker('/workers/code-analysis-worker.js');
        worker.onmessage = this.handleWorkerMessage.bind(this);
        worker.onerror = this.handleWorkerError.bind(this);
        this.workers.push(worker);
      } catch (error) {
        console.warn('Failed to create analysis worker:', error);
      }
    }
  }

  private handleWorkerMessage(event: MessageEvent) {
    const { type, data } = event.data;
    
    switch (type) {
      case 'analysis-progress':
        this.notifyObservers({ progress: data });
        break;
      case 'analysis-complete':
        this.handleAnalysisComplete(data);
        break;
      case 'analysis-error':
        this.handleAnalysisError(data);
        break;
    }
  }

  private handleWorkerError(error: ErrorEvent) {
    console.error('Analysis worker error:', error);
    this.notifyObservers({ error: error.message });
  }

  private handleAnalysisComplete(data: any) {
    this.notifyObservers({
      isAnalyzing: false,
      currentReport: data.report,
      metrics: data.metrics,
      issues: data.issues,
      smells: data.smells,
      dependencies: data.dependencies,
      coverage: data.coverage
    });
  }

  private handleAnalysisError(error: string) {
    this.notifyObservers({
      isAnalyzing: false,
      error
    });
  }

  subscribe(observer: (state: Partial<AnalysisState>) => void) {
    this.observers.push(observer);
    return () => {
      this.observers = this.observers.filter(obs => obs !== observer);
    };
  }

  private notifyObservers(state: Partial<AnalysisState>) {
    this.observers.forEach(observer => observer(state));
  }

  async analyzeProject(projectPath: string): Promise<AnalysisReport> {
    if (this.isRunning) {
      throw new Error('Analysis already in progress');
    }

    this.isRunning = true;
    this.notifyObservers({ 
      isAnalyzing: true, 
      error: null,
      progress: { current: 0, total: 100, stage: 'Initializing' }
    });

    try {
      const startTime = Date.now();
      
      // Get file list
      const files = await this.getProjectFiles(projectPath);
      
      // Analyze files in parallel
      const results = await this.analyzeFiles(files);
      
      // Generate report
      const report = this.generateReport(results, Date.now() - startTime);
      
      this.notifyObservers({
        isAnalyzing: false,
        currentReport: report
      });
      
      return report;
    } catch (error) {
      this.notifyObservers({
        isAnalyzing: false,
        error: error instanceof Error ? error.message : 'Analysis failed'
      });
      throw error;
    } finally {
      this.isRunning = false;
    }
  }

  private async getProjectFiles(projectPath: string): Promise<string[]> {
    // Simulate file discovery
    return new Promise(resolve => {
      setTimeout(() => {
        const files = [
          'src/components/App.tsx',
          'src/hooks/useCodeAnalysis.ts',
          'src/utils/helpers.ts',
          'package.json',
          'tsconfig.json'
        ];
        resolve(files);
      }, 500);
    });
  }

  private async analyzeFiles(files: string[]): Promise<any> {
    const results = {
      metrics: [],
      issues: [],
      smells: [],
      dependencies: [],
      coverage: []
    };

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      this.notifyObservers({
        progress: {
          current: (i / files.length) * 100,
          total: 100,
          stage: `Analyzing ${file}`
        }
      });

      // Simulate file analysis
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Generate mock results
      results.metrics.push(...this.generateMockMetrics(file));
      results.issues.push(...this.generateMockIssues(file));
      results.smells.push(...this.generateMockSmells(file));
      
      if (file === 'package.json') {
        results.dependencies.push(...this.generateMockDependencies());
      }
    }

    return results;
  }

  private generateMockMetrics(file: string): CodeMetric[] {
    const metrics: CodeMetric[] = [];
    
    // Complexity metrics
    metrics.push({
      id: `complexity-${file}`,
      name: 'Cyclomatic Complexity',
      value: Math.floor(Math.random() * 20) + 1,
      threshold: 10,
      severity: 'medium',
      description: 'Measures the complexity of the code',
      category: 'complexity',
      file
    });
    
    // Maintainability metrics
    metrics.push({
      id: `maintainability-${file}`,
      name: 'Maintainability Index',
      value: Math.floor(Math.random() * 100),
      threshold: 70,
      severity: 'low',
      description: 'Measures how maintainable the code is',
      category: 'maintainability',
      file
    });
    
    return metrics;
  }

  private generateMockIssues(file: string): CodeIssue[] {
    const issues: CodeIssue[] = [];
    const issueCount = Math.floor(Math.random() * 5);
    
    for (let i = 0; i < issueCount; i++) {
      issues.push({
        id: `issue-${file}-${i}`,
        type: ['error', 'warning', 'info', 'suggestion'][Math.floor(Math.random() * 4)] as any,
        severity: ['low', 'medium', 'high', 'critical'][Math.floor(Math.random() * 4)] as any,
        message: 'Sample issue message',
        description: 'Detailed description of the issue',
        file,
        line: Math.floor(Math.random() * 100) + 1,
        column: Math.floor(Math.random() * 80) + 1,
        rule: 'sample-rule',
        category: 'code-quality',
        fixable: Math.random() > 0.5,
        suggestion: 'Consider refactoring this code',
        createdAt: new Date()
      });
    }
    
    return issues;
  }

  private generateMockSmells(file: string): CodeSmell[] {
    const smells: CodeSmell[] = [];
    const smellCount = Math.floor(Math.random() * 3);
    
    for (let i = 0; i < smellCount; i++) {
      smells.push({
        id: `smell-${file}-${i}`,
        type: 'long-method',
        name: 'Long Method',
        description: 'Method is too long and should be refactored',
        file,
        startLine: Math.floor(Math.random() * 50) + 1,
        endLine: Math.floor(Math.random() * 50) + 51,
        severity: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)] as any,
        impact: Math.floor(Math.random() * 10) + 1,
        effort: Math.floor(Math.random() * 60) + 15,
        debt: Math.floor(Math.random() * 120) + 30,
        tags: ['maintainability', 'complexity']
      });
    }
    
    return smells;
  }

  private generateMockDependencies(): DependencyInfo[] {
    return [
      {
        name: 'react',
        version: '18.2.0',
        type: 'production',
        size: 42000,
        vulnerabilities: 0,
        outdated: false,
        license: 'MIT',
        description: 'A JavaScript library for building user interfaces'
      },
      {
        name: 'lodash',
        version: '4.17.20',
        type: 'production',
        size: 71000,
        vulnerabilities: 1,
        outdated: true,
        license: 'MIT',
        description: 'A modern JavaScript utility library'
      }
    ];
  }

  private generateReport(results: any, duration: number): AnalysisReport {
    const report: AnalysisReport = {
      id: `report-${Date.now()}`,
      timestamp: new Date(),
      duration,
      filesAnalyzed: 5,
      linesOfCode: 1250,
      metrics: results.metrics,
      issues: results.issues,
      smells: results.smells,
      dependencies: results.dependencies,
      coverage: results.coverage,
      summary: {
        quality: Math.floor(Math.random() * 40) + 60,
        maintainability: Math.floor(Math.random() * 40) + 60,
        reliability: Math.floor(Math.random() * 40) + 60,
        security: Math.floor(Math.random() * 40) + 60,
        performance: Math.floor(Math.random() * 40) + 60,
        technicalDebt: Math.floor(Math.random() * 500) + 100
      }
    };
    
    return report;
  }

  async analyzeFile(filePath: string): Promise<Partial<AnalysisReport>> {
    // Simulate single file analysis
    return new Promise(resolve => {
      setTimeout(() => {
        resolve({
          metrics: this.generateMockMetrics(filePath),
          issues: this.generateMockIssues(filePath),
          smells: this.generateMockSmells(filePath)
        });
      }, 1000);
    });
  }

  updateConfig(newConfig: Partial<AnalysisConfig>) {
    this.config = { ...this.config, ...newConfig };
    this.notifyObservers({ config: this.config });
  }

  exportData(): string {
    return JSON.stringify({
      config: this.config,
      timestamp: new Date().toISOString()
    }, null, 2);
  }

  importData(data: string) {
    try {
      const parsed = JSON.parse(data);
      if (parsed.config) {
        this.updateConfig(parsed.config);
      }
    } catch (error) {
      throw new Error('Invalid data format');
    }
  }

  destroy() {
    this.workers.forEach(worker => worker.terminate());
    this.workers = [];
    this.observers = [];
  }
}

// Default configuration
const defaultConfig: AnalysisConfig = {
  enabled: true,
  autoAnalysis: false,
  analysisInterval: 300000, // 5 minutes
  includeTests: true,
  includeDependencies: true,
  enableRealTime: false,
  rules: {
    complexity: {
      'cyclomatic-complexity': { enabled: true, severity: 'medium', threshold: 10 },
      'cognitive-complexity': { enabled: true, severity: 'medium', threshold: 15 },
      'nesting-depth': { enabled: true, severity: 'low', threshold: 4 }
    },
    maintainability: {
      'function-length': { enabled: true, severity: 'medium', threshold: 50 },
      'parameter-count': { enabled: true, severity: 'low', threshold: 5 },
      'class-length': { enabled: true, severity: 'medium', threshold: 200 }
    },
    performance: {
      'unused-imports': { enabled: true, severity: 'low' },
      'inefficient-loops': { enabled: true, severity: 'medium' },
      'memory-leaks': { enabled: true, severity: 'high' }
    },
    security: {
      'xss-vulnerabilities': { enabled: true, severity: 'critical' },
      'sql-injection': { enabled: true, severity: 'critical' },
      'insecure-dependencies': { enabled: true, severity: 'high' }
    },
    quality: {
      'code-duplication': { enabled: true, severity: 'medium' },
      'naming-conventions': { enabled: true, severity: 'low' },
      'documentation': { enabled: true, severity: 'low' }
    }
  },
  excludePatterns: ['node_modules/**', 'dist/**', 'build/**', '*.min.js'],
  includePatterns: ['src/**/*.{ts,tsx,js,jsx}', '*.{ts,tsx,js,jsx}'],
  maxFileSize: 1024 * 1024, // 1MB
  timeout: 30000 // 30 seconds
};

// Hook
export const useCodeAnalysis = () => {
  const [state, setState] = useState<AnalysisState>({
    isAnalyzing: false,
    currentReport: null,
    reports: [],
    metrics: [],
    issues: [],
    smells: [],
    dependencies: [],
    coverage: [],
    config: defaultConfig,
    error: null,
    progress: { current: 0, total: 100, stage: 'Ready' }
  });

  const engineRef = useRef<CodeAnalysisEngine | null>(null);

  // Initialize engine
  useEffect(() => {
    engineRef.current = new CodeAnalysisEngine(defaultConfig);
    
    const unsubscribe = engineRef.current.subscribe((newState) => {
      setState(prevState => ({ ...prevState, ...newState }));
    });

    return () => {
      unsubscribe();
      engineRef.current?.destroy();
    };
  }, []);

  // Auto analysis
  useEffect(() => {
    if (state.config.autoAnalysis && state.config.enabled) {
      const interval = setInterval(() => {
        if (!state.isAnalyzing) {
          actions.analyzeProject('.');
        }
      }, state.config.analysisInterval);

      return () => clearInterval(interval);
    }
  }, [state.config.autoAnalysis, state.config.enabled, state.config.analysisInterval, state.isAnalyzing]);

  const actions = {
    analyzeProject: useCallback(async (projectPath: string = '.') => {
      if (!engineRef.current) return;
      try {
        const report = await engineRef.current.analyzeProject(projectPath);
        setState(prevState => ({
          ...prevState,
          reports: [report, ...prevState.reports.slice(0, 9)] // Keep last 10 reports
        }));
        return report;
      } catch (error) {
        console.error('Analysis failed:', error);
        throw error;
      }
    }, []),

    analyzeFile: useCallback(async (filePath: string) => {
      if (!engineRef.current) return;
      return await engineRef.current.analyzeFile(filePath);
    }, []),

    updateConfig: useCallback((newConfig: Partial<AnalysisConfig>) => {
      if (!engineRef.current) return;
      engineRef.current.updateConfig(newConfig);
    }, []),

    clearError: useCallback(() => {
      setState(prevState => ({ ...prevState, error: null }));
    }, []),

    clearReports: useCallback(() => {
      setState(prevState => ({ ...prevState, reports: [] }));
    }, []),

    exportData: useCallback(() => {
      if (!engineRef.current) return '';
      return engineRef.current.exportData();
    }, []),

    importData: useCallback((data: string) => {
      if (!engineRef.current) return;
      engineRef.current.importData(data);
    }, [])
  };

  return {
    ...state,
    actions
  };
};

export default useCodeAnalysis;