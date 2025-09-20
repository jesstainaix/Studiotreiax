import { useState, useEffect, useCallback, useRef } from 'react';

// Types
export interface Dependency {
  id: string;
  name: string;
  version: string;
  type: 'production' | 'development' | 'peer' | 'optional';
  size: number;
  license: string;
  description: string;
  homepage?: string;
  repository?: string;
  author?: string;
  keywords: string[];
  dependencies: string[];
  devDependencies: string[];
  peerDependencies: string[];
  vulnerabilities: Vulnerability[];
  outdated: boolean;
  latestVersion?: string;
  installDate: Date;
  lastUsed: Date;
  usageCount: number;
  bundleImpact: BundleImpact;
  treeshaking: boolean;
  sideEffects: boolean;
}

export interface Vulnerability {
  id: string;
  severity: 'low' | 'moderate' | 'high' | 'critical';
  title: string;
  description: string;
  cwe: string[];
  cvss: number;
  range: string;
  fixedIn?: string;
  patchedVersions?: string;
  recommendation: string;
  references: string[];
  foundAt: Date;
}

export interface BundleImpact {
  gzippedSize: number;
  parsedSize: number;
  statSize: number;
  chunkNames: string[];
  modules: string[];
  reasons: string[];
  optimizable: boolean;
  duplicates: string[];
}

export interface DependencyGraph {
  nodes: DependencyNode[];
  edges: DependencyEdge[];
  clusters: DependencyCluster[];
  metrics: GraphMetrics;
}

export interface DependencyNode {
  id: string;
  name: string;
  version: string;
  type: string;
  level: number;
  size: number;
  children: string[];
  parents: string[];
  circular: boolean;
  critical: boolean;
}

export interface DependencyEdge {
  id: string;
  source: string;
  target: string;
  type: 'direct' | 'transitive' | 'peer' | 'optional';
  weight: number;
  version: string;
}

export interface DependencyCluster {
  id: string;
  name: string;
  nodes: string[];
  type: 'framework' | 'utility' | 'ui' | 'testing' | 'build' | 'other';
  size: number;
  complexity: number;
}

export interface GraphMetrics {
  totalNodes: number;
  totalEdges: number;
  maxDepth: number;
  avgDepth: number;
  circularDependencies: number;
  duplicateDependencies: number;
  unusedDependencies: number;
  outdatedDependencies: number;
  vulnerablePackages: number;
  totalSize: number;
  bundleSize: number;
  treeshakingOpportunities: number;
}

export interface AnalysisReport {
  id: string;
  timestamp: Date;
  projectName: string;
  packageManager: 'npm' | 'yarn' | 'pnpm';
  nodeVersion: string;
  dependencies: Dependency[];
  graph: DependencyGraph;
  metrics: AnalysisMetrics;
  recommendations: Recommendation[];
  security: SecurityReport;
  performance: PerformanceReport;
  compliance: ComplianceReport;
}

export interface AnalysisMetrics {
  totalDependencies: number;
  directDependencies: number;
  transitiveDependencies: number;
  devDependencies: number;
  peerDependencies: number;
  optionalDependencies: number;
  totalSize: number;
  bundleSize: number;
  duplicates: number;
  outdated: number;
  vulnerable: number;
  unused: number;
  licenses: Record<string, number>;
  maintainers: Record<string, number>;
  ages: Record<string, number>;
}

export interface Recommendation {
  id: string;
  type: 'security' | 'performance' | 'maintenance' | 'compliance';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  impact: string;
  effort: 'low' | 'medium' | 'high';
  action: string;
  dependencies: string[];
  automated: boolean;
  command?: string;
  links: string[];
}

export interface SecurityReport {
  vulnerabilities: Vulnerability[];
  riskScore: number;
  criticalCount: number;
  highCount: number;
  moderateCount: number;
  lowCount: number;
  patchableCount: number;
  unpatchableCount: number;
  recommendations: Recommendation[];
}

export interface PerformanceReport {
  bundleSize: number;
  gzippedSize: number;
  loadTime: number;
  parseTime: number;
  treeshakingOpportunities: string[];
  duplicateCode: string[];
  unusedCode: string[];
  optimizationSuggestions: Recommendation[];
}

export interface ComplianceReport {
  licenses: Record<string, string[]>;
  incompatibleLicenses: string[];
  missingLicenses: string[];
  copyleftLicenses: string[];
  proprietaryLicenses: string[];
  riskLevel: 'low' | 'medium' | 'high';
  recommendations: Recommendation[];
}

export interface AnalysisConfig {
  enabled: boolean;
  autoAnalysis: boolean;
  analysisInterval: number;
  includeDevDependencies: boolean;
  includePeerDependencies: boolean;
  includeOptionalDependencies: boolean;
  vulnerabilityCheck: boolean;
  licenseCheck: boolean;
  bundleAnalysis: boolean;
  performanceAnalysis: boolean;
  unusedDependencyCheck: boolean;
  duplicateCheck: boolean;
  outdatedCheck: boolean;
  circularDependencyCheck: boolean;
  treeshakingAnalysis: boolean;
  registries: string[];
  excludePatterns: string[];
  includePatterns: string[];
  maxDepth: number;
  timeout: number;
  parallel: boolean;
  cache: boolean;
  cacheTimeout: number;
}

export interface AnalysisState {
  isAnalyzing: boolean;
  currentReport: AnalysisReport | null;
  reports: AnalysisReport[];
  dependencies: Dependency[];
  graph: DependencyGraph | null;
  metrics: AnalysisMetrics | null;
  recommendations: Recommendation[];
  security: SecurityReport | null;
  performance: PerformanceReport | null;
  compliance: ComplianceReport | null;
  config: AnalysisConfig;
  error: string | null;
  progress: number;
  lastAnalysis: Date | null;
}

// Default configuration
const defaultConfig: AnalysisConfig = {
  enabled: true,
  autoAnalysis: true,
  analysisInterval: 3600000, // 1 hour
  includeDevDependencies: true,
  includePeerDependencies: true,
  includeOptionalDependencies: false,
  vulnerabilityCheck: true,
  licenseCheck: true,
  bundleAnalysis: true,
  performanceAnalysis: true,
  unusedDependencyCheck: true,
  duplicateCheck: true,
  outdatedCheck: true,
  circularDependencyCheck: true,
  treeshakingAnalysis: true,
  registries: ['https://registry.npmjs.org'],
  excludePatterns: ['node_modules', '.git', 'dist', 'build'],
  includePatterns: ['src/**/*', 'lib/**/*'],
  maxDepth: 10,
  timeout: 300000, // 5 minutes
  parallel: true,
  cache: true,
  cacheTimeout: 86400000 // 24 hours
};

// Dependency Analysis Engine
class DependencyAnalysisEngine {
  private config: AnalysisConfig;
  private workers: Worker[] = [];
  private cache: Map<string, any> = new Map();
  private analysisQueue: string[] = [];
  private isProcessing = false;

  constructor(config: AnalysisConfig) {
    this.config = config;
    this.initializeWorkers();
  }

  private initializeWorkers() {
    if (!this.config.parallel) return;

    const workerCount = Math.min(navigator.hardwareConcurrency || 4, 8);
    for (let i = 0; i < workerCount; i++) {
      const worker = new Worker(
        URL.createObjectURL(
          new Blob([
            `
            self.onmessage = function(e) {
              const { type, data } = e.data;
              
              switch (type) {
                case 'analyze-dependency':
                  analyzeDependency(data);
                  break;
                case 'check-vulnerability':
                  checkVulnerability(data);
                  break;
                case 'analyze-bundle':
                  analyzeBundle(data);
                  break;
                case 'check-license':
                  checkLicense(data);
                  break;
              }
            };
            
            function analyzeDependency(dependency) {
              // Simulate dependency analysis
              const result = {
                id: dependency.id,
                analysis: {
                  size: Math.random() * 1000000,
                  complexity: Math.random() * 100,
                  maintainability: Math.random() * 100,
                  security: Math.random() * 100
                }
              };
              
              self.postMessage({ type: 'dependency-analyzed', data: result });
            }
            
            function checkVulnerability(dependency) {
              // Simulate vulnerability check
              const vulnerabilities = [];
              if (Math.random() > 0.8) {
                vulnerabilities.push({
                  id: 'vuln-' + Math.random().toString(36).substr(2, 9),
                  severity: ['low', 'moderate', 'high', 'critical'][Math.floor(Math.random() * 4)],
                  title: 'Sample Vulnerability',
                  description: 'This is a sample vulnerability for testing',
                  cvss: Math.random() * 10,
                  foundAt: new Date()
                });
              }
              
              self.postMessage({ 
                type: 'vulnerability-checked', 
                data: { id: dependency.id, vulnerabilities } 
              });
            }
            
            function analyzeBundle(dependency) {
              // Simulate bundle analysis
              const impact = {
                gzippedSize: Math.random() * 100000,
                parsedSize: Math.random() * 200000,
                statSize: Math.random() * 150000,
                optimizable: Math.random() > 0.5
              };
              
              self.postMessage({ 
                type: 'bundle-analyzed', 
                data: { id: dependency.id, impact } 
              });
            }
            
            function checkLicense(dependency) {
              // Simulate license check
              const licenses = ['MIT', 'Apache-2.0', 'GPL-3.0', 'BSD-3-Clause', 'ISC'];
              const license = licenses[Math.floor(Math.random() * licenses.length)];
              
              self.postMessage({ 
                type: 'license-checked', 
                data: { id: dependency.id, license } 
              });
            }
            `
          ], { type: 'application/javascript' })
        )
      );

      worker.onmessage = (e) => {
        this.handleWorkerMessage(e.data);
      };

      this.workers.push(worker);
    }
  }

  private handleWorkerMessage(message: any) {
    const { type, data } = message;
    
    switch (type) {
      case 'dependency-analyzed':
        this.cache.set(`analysis-${data.id}`, data.analysis);
        break;
      case 'vulnerability-checked':
        this.cache.set(`vulnerabilities-${data.id}`, data.vulnerabilities);
        break;
      case 'bundle-analyzed':
        this.cache.set(`bundle-${data.id}`, data.impact);
        break;
      case 'license-checked':
        this.cache.set(`license-${data.id}`, data.license);
        break;
    }
  }

  async analyzeProject(projectPath: string): Promise<AnalysisReport> {
    try {
      this.isProcessing = true;
      
      // Read package.json
      const packageJson = await this.readPackageJson(projectPath);
      
      // Analyze dependencies
      const dependencies = await this.analyzeDependencies(packageJson);
      
      // Build dependency graph
      const graph = await this.buildDependencyGraph(dependencies);
      
      // Generate metrics
      const metrics = this.calculateMetrics(dependencies, graph);
      
      // Security analysis
      const security = await this.performSecurityAnalysis(dependencies);
      
      // Performance analysis
      const performance = await this.performPerformanceAnalysis(dependencies);
      
      // Compliance analysis
      const compliance = await this.performComplianceAnalysis(dependencies);
      
      // Generate recommendations
      const recommendations = this.generateRecommendations(
        dependencies, graph, security, performance, compliance
      );
      
      const report: AnalysisReport = {
        id: Math.random().toString(36).substr(2, 9),
        timestamp: new Date(),
        projectName: packageJson.name || 'Unknown',
        packageManager: this.detectPackageManager(projectPath),
        nodeVersion: typeof process !== 'undefined' && process.version ? process.version : 'Browser Environment',
        dependencies,
        graph,
        metrics,
        recommendations,
        security,
        performance,
        compliance
      };
      
      this.isProcessing = false;
      return report;
    } catch (error) {
      this.isProcessing = false;
      throw error;
    }
  }

  private async readPackageJson(projectPath: string): Promise<any> {
    // Simulate reading package.json
    return {
      name: 'studio-treiax',
      version: '1.0.0',
      dependencies: {
        'react': '^18.0.0',
        'react-dom': '^18.0.0',
        'typescript': '^4.9.0',
        'vite': '^4.0.0'
      },
      devDependencies: {
        '@types/react': '^18.0.0',
        '@types/react-dom': '^18.0.0',
        'eslint': '^8.0.0'
      }
    };
  }

  private async analyzeDependencies(packageJson: any): Promise<Dependency[]> {
    const dependencies: Dependency[] = [];
    
    // Analyze production dependencies
    if (this.config.includeDevDependencies && packageJson.dependencies) {
      for (const [name, version] of Object.entries(packageJson.dependencies)) {
        const dependency = await this.analyzeDependency(name, version as string, 'production');
        dependencies.push(dependency);
      }
    }
    
    // Analyze dev dependencies
    if (this.config.includeDevDependencies && packageJson.devDependencies) {
      for (const [name, version] of Object.entries(packageJson.devDependencies)) {
        const dependency = await this.analyzeDependency(name, version as string, 'development');
        dependencies.push(dependency);
      }
    }
    
    // Analyze peer dependencies
    if (this.config.includePeerDependencies && packageJson.peerDependencies) {
      for (const [name, version] of Object.entries(packageJson.peerDependencies)) {
        const dependency = await this.analyzeDependency(name, version as string, 'peer');
        dependencies.push(dependency);
      }
    }
    
    return dependencies;
  }

  private async analyzeDependency(
    name: string, 
    version: string, 
    type: Dependency['type']
  ): Promise<Dependency> {
    const cacheKey = `${name}@${version}`;
    
    if (this.config.cache && this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }
    
    // Simulate dependency analysis
    const dependency: Dependency = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      version,
      type,
      size: Math.random() * 1000000,
      license: ['MIT', 'Apache-2.0', 'GPL-3.0', 'BSD-3-Clause'][Math.floor(Math.random() * 4)],
      description: `Description for ${name}`,
      keywords: ['javascript', 'library'],
      dependencies: [],
      devDependencies: [],
      peerDependencies: [],
      vulnerabilities: [],
      outdated: Math.random() > 0.8,
      latestVersion: version,
      installDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
      lastUsed: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
      usageCount: Math.floor(Math.random() * 100),
      bundleImpact: {
        gzippedSize: Math.random() * 100000,
        parsedSize: Math.random() * 200000,
        statSize: Math.random() * 150000,
        chunkNames: ['main', 'vendor'],
        modules: [`${name}/index.js`],
        reasons: ['imported'],
        optimizable: Math.random() > 0.5,
        duplicates: []
      },
      treeshaking: Math.random() > 0.3,
      sideEffects: Math.random() > 0.7
    };
    
    if (this.config.cache) {
      this.cache.set(cacheKey, dependency);
    }
    
    return dependency;
  }

  private async buildDependencyGraph(dependencies: Dependency[]): Promise<DependencyGraph> {
    const nodes: DependencyNode[] = [];
    const edges: DependencyEdge[] = [];
    const clusters: DependencyCluster[] = [];
    
    // Build nodes
    dependencies.forEach((dep, index) => {
      nodes.push({
        id: dep.id,
        name: dep.name,
        version: dep.version,
        type: dep.type,
        level: Math.floor(index / 10),
        size: dep.size,
        children: [],
        parents: [],
        circular: false,
        critical: dep.vulnerabilities.some(v => v.severity === 'critical')
      });
    });
    
    // Build edges (simplified)
    for (let i = 0; i < nodes.length - 1; i++) {
      if (Math.random() > 0.7) {
        edges.push({
          id: `edge-${i}`,
          source: nodes[i].id,
          target: nodes[i + 1].id,
          type: 'direct',
          weight: Math.random(),
          version: nodes[i + 1].version
        });
      }
    }
    
    // Calculate metrics
    const metrics: GraphMetrics = {
      totalNodes: nodes.length,
      totalEdges: edges.length,
      maxDepth: Math.max(...nodes.map(n => n.level)),
      avgDepth: nodes.reduce((sum, n) => sum + n.level, 0) / nodes.length,
      circularDependencies: nodes.filter(n => n.circular).length,
      duplicateDependencies: 0,
      unusedDependencies: dependencies.filter(d => d.usageCount === 0).length,
      outdatedDependencies: dependencies.filter(d => d.outdated).length,
      vulnerablePackages: dependencies.filter(d => d.vulnerabilities.length > 0).length,
      totalSize: dependencies.reduce((sum, d) => sum + d.size, 0),
      bundleSize: dependencies.reduce((sum, d) => sum + d.bundleImpact.gzippedSize, 0),
      treeshakingOpportunities: dependencies.filter(d => !d.treeshaking).length
    };
    
    return { nodes, edges, clusters, metrics };
  }

  private calculateMetrics(dependencies: Dependency[], graph: DependencyGraph): AnalysisMetrics {
    const licenses: Record<string, number> = {};
    const maintainers: Record<string, number> = {};
    const ages: Record<string, number> = {};
    
    dependencies.forEach(dep => {
      licenses[dep.license] = (licenses[dep.license] || 0) + 1;
      
      if (dep.author) {
        maintainers[dep.author] = (maintainers[dep.author] || 0) + 1;
      }
      
      const age = Math.floor((Date.now() - dep.installDate.getTime()) / (1000 * 60 * 60 * 24));
      const ageGroup = age < 30 ? 'recent' : age < 90 ? 'medium' : 'old';
      ages[ageGroup] = (ages[ageGroup] || 0) + 1;
    });
    
    return {
      totalDependencies: dependencies.length,
      directDependencies: dependencies.filter(d => d.type === 'production').length,
      transitiveDependencies: 0, // Would be calculated from graph
      devDependencies: dependencies.filter(d => d.type === 'development').length,
      peerDependencies: dependencies.filter(d => d.type === 'peer').length,
      optionalDependencies: dependencies.filter(d => d.type === 'optional').length,
      totalSize: dependencies.reduce((sum, d) => sum + d.size, 0),
      bundleSize: dependencies.reduce((sum, d) => sum + d.bundleImpact.gzippedSize, 0),
      duplicates: 0, // Would be calculated from analysis
      outdated: dependencies.filter(d => d.outdated).length,
      vulnerable: dependencies.filter(d => d.vulnerabilities.length > 0).length,
      unused: dependencies.filter(d => d.usageCount === 0).length,
      licenses,
      maintainers,
      ages
    };
  }

  private async performSecurityAnalysis(dependencies: Dependency[]): Promise<SecurityReport> {
    const vulnerabilities: Vulnerability[] = [];
    let criticalCount = 0;
    let highCount = 0;
    let moderateCount = 0;
    let lowCount = 0;
    
    dependencies.forEach(dep => {
      dep.vulnerabilities.forEach(vuln => {
        vulnerabilities.push(vuln);
        switch (vuln.severity) {
          case 'critical': criticalCount++; break;
          case 'high': highCount++; break;
          case 'moderate': moderateCount++; break;
          case 'low': lowCount++; break;
        }
      });
    });
    
    const riskScore = (criticalCount * 10 + highCount * 7 + moderateCount * 4 + lowCount * 1) / dependencies.length;
    
    return {
      vulnerabilities,
      riskScore,
      criticalCount,
      highCount,
      moderateCount,
      lowCount,
      patchableCount: vulnerabilities.filter(v => v.fixedIn).length,
      unpatchableCount: vulnerabilities.filter(v => !v.fixedIn).length,
      recommendations: []
    };
  }

  private async performPerformanceAnalysis(dependencies: Dependency[]): Promise<PerformanceReport> {
    const bundleSize = dependencies.reduce((sum, d) => sum + d.bundleImpact.parsedSize, 0);
    const gzippedSize = dependencies.reduce((sum, d) => sum + d.bundleImpact.gzippedSize, 0);
    
    return {
      bundleSize,
      gzippedSize,
      loadTime: bundleSize / 1000, // Simplified calculation
      parseTime: bundleSize / 5000, // Simplified calculation
      treeshakingOpportunities: dependencies.filter(d => !d.treeshaking).map(d => d.name),
      duplicateCode: [],
      unusedCode: dependencies.filter(d => d.usageCount === 0).map(d => d.name),
      optimizationSuggestions: []
    };
  }

  private async performComplianceAnalysis(dependencies: Dependency[]): Promise<ComplianceReport> {
    const licenses: Record<string, string[]> = {};
    const incompatibleLicenses: string[] = [];
    const missingLicenses: string[] = [];
    const copyleftLicenses: string[] = [];
    const proprietaryLicenses: string[] = [];
    
    dependencies.forEach(dep => {
      if (!dep.license) {
        missingLicenses.push(dep.name);
      } else {
        if (!licenses[dep.license]) {
          licenses[dep.license] = [];
        }
        licenses[dep.license].push(dep.name);
        
        if (['GPL-2.0', 'GPL-3.0', 'AGPL-3.0'].includes(dep.license)) {
          copyleftLicenses.push(dep.name);
        }
      }
    });
    
    const riskLevel = copyleftLicenses.length > 0 ? 'high' : 
                     missingLicenses.length > 0 ? 'medium' : 'low';
    
    return {
      licenses,
      incompatibleLicenses,
      missingLicenses,
      copyleftLicenses,
      proprietaryLicenses,
      riskLevel,
      recommendations: []
    };
  }

  private generateRecommendations(
    dependencies: Dependency[],
    graph: DependencyGraph,
    security: SecurityReport,
    performance: PerformanceReport,
    compliance: ComplianceReport
  ): Recommendation[] {
    const recommendations: Recommendation[] = [];
    
    // Security recommendations
    if (security.criticalCount > 0) {
      recommendations.push({
        id: 'security-critical',
        type: 'security',
        severity: 'critical',
        title: 'Critical Security Vulnerabilities Found',
        description: `Found ${security.criticalCount} critical vulnerabilities`,
        impact: 'High security risk',
        effort: 'medium',
        action: 'Update vulnerable packages immediately',
        dependencies: [],
        automated: true,
        command: 'npm audit fix',
        links: ['https://docs.npmjs.com/auditing-package-dependencies-for-security-vulnerabilities']
      });
    }
    
    // Performance recommendations
    if (performance.bundleSize > 1000000) {
      recommendations.push({
        id: 'performance-bundle-size',
        type: 'performance',
        severity: 'medium',
        title: 'Large Bundle Size',
        description: 'Bundle size exceeds 1MB',
        impact: 'Slower load times',
        effort: 'medium',
        action: 'Enable tree shaking and code splitting',
        dependencies: performance.treeshakingOpportunities,
        automated: false,
        links: ['https://webpack.js.org/guides/tree-shaking/']
      });
    }
    
    // Compliance recommendations
    if (compliance.copyleftLicenses.length > 0) {
      recommendations.push({
        id: 'compliance-copyleft',
        type: 'compliance',
        severity: 'high',
        title: 'Copyleft Licenses Detected',
        description: `Found ${compliance.copyleftLicenses.length} packages with copyleft licenses`,
        impact: 'Legal compliance risk',
        effort: 'high',
        action: 'Review license compatibility',
        dependencies: compliance.copyleftLicenses,
        automated: false,
        links: ['https://choosealicense.com/']
      });
    }
    
    return recommendations;
  }

  private detectPackageManager(projectPath: string): 'npm' | 'yarn' | 'pnpm' {
    // Simplified detection
    return 'npm';
  }

  updateConfig(newConfig: Partial<AnalysisConfig>) {
    this.config = { ...this.config, ...newConfig };
  }

  exportData(): string {
    return JSON.stringify({
      config: this.config,
      cache: Array.from(this.cache.entries()),
      timestamp: new Date().toISOString()
    }, null, 2);
  }

  importData(data: string) {
    try {
      const parsed = JSON.parse(data);
      if (parsed.config) {
        this.config = { ...this.config, ...parsed.config };
      }
      if (parsed.cache) {
        this.cache = new Map(parsed.cache);
      }
    } catch (error) {
      console.error('Failed to import data:', error);
    }
  }

  destroy() {
    this.workers.forEach(worker => worker.terminate());
    this.workers = [];
    this.cache.clear();
  }
}

// Hook
const useDependencyAnalysis = (initialConfig: Partial<AnalysisConfig> = {}) => {
  const [state, setState] = useState<AnalysisState>({
    isAnalyzing: false,
    currentReport: null,
    reports: [],
    dependencies: [],
    graph: null,
    metrics: null,
    recommendations: [],
    security: null,
    performance: null,
    compliance: null,
    config: { ...defaultConfig, ...initialConfig },
    error: null,
    progress: 0,
    lastAnalysis: null
  });

  const engineRef = useRef<DependencyAnalysisEngine | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize engine
  useEffect(() => {
    engineRef.current = new DependencyAnalysisEngine(state.config);
    
    return () => {
      if (engineRef.current) {
        engineRef.current.destroy();
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Auto analysis
  useEffect(() => {
    if (!state.config.autoAnalysis || !state.config.enabled) return;
    
    intervalRef.current = setInterval(() => {
      analyzeProject();
    }, state.config.analysisInterval);
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [state.config.autoAnalysis, state.config.enabled, state.config.analysisInterval]);

  const analyzeProject = useCallback(async (projectPath: string = './') => {
    if (!engineRef.current || state.isAnalyzing) return;
    
    setState(prev => ({ 
      ...prev, 
      isAnalyzing: true, 
      error: null, 
      progress: 0 
    }));
    
    try {
      const report = await engineRef.current.analyzeProject(projectPath);
      
      setState(prev => ({
        ...prev,
        isAnalyzing: false,
        currentReport: report,
        reports: [report, ...prev.reports.slice(0, 9)],
        dependencies: report.dependencies,
        graph: report.graph,
        metrics: report.metrics,
        recommendations: report.recommendations,
        security: report.security,
        performance: report.performance,
        compliance: report.compliance,
        lastAnalysis: new Date(),
        progress: 100
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        isAnalyzing: false,
        error: error instanceof Error ? error.message : 'Analysis failed',
        progress: 0
      }));
    }
  }, [state.isAnalyzing]);

  const updateConfig = useCallback((newConfig: Partial<AnalysisConfig>) => {
    setState(prev => ({
      ...prev,
      config: { ...prev.config, ...newConfig }
    }));
    
    if (engineRef.current) {
      engineRef.current.updateConfig(newConfig);
    }
  }, []);

  const exportData = useCallback(() => {
    if (!engineRef.current) return '';
    return engineRef.current.exportData();
  }, []);

  const importData = useCallback((data: string) => {
    if (!engineRef.current) return;
    engineRef.current.importData(data);
  }, []);

  const clearReports = useCallback(() => {
    setState(prev => ({
      ...prev,
      reports: [],
      currentReport: null
    }));
  }, []);

  const actions = {
    analyzeProject,
    updateConfig,
    exportData,
    importData,
    clearReports
  };

  return {
    ...state,
    actions
  };
};

export default useDependencyAnalysis;