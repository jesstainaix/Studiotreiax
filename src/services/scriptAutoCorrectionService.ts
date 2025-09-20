import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

// Types and Interfaces
export interface ScriptError {
  id: string;
  type: 'syntax' | 'logic' | 'performance' | 'security' | 'style' | 'compatibility';
  severity: 'low' | 'medium' | 'high' | 'critical';
  line: number;
  column: number;
  message: string;
  description: string;
  suggestion: string;
  autoFixable: boolean;
  confidence: number;
  category: string;
  rule: string;
  source: string;
  timestamp: string;
}

export interface ScriptAnalysis {
  id: string;
  scriptId: string;
  content: string;
  language: string;
  errors: ScriptError[];
  warnings: ScriptError[];
  suggestions: ScriptError[];
  metrics: {
    complexity: number;
    maintainability: number;
    performance: number;
    security: number;
    readability: number;
  };
  fixes: ScriptFix[];
  status: 'pending' | 'analyzing' | 'completed' | 'failed';
  timestamp: string;
  duration: number;
}

export interface ScriptFix {
  id: string;
  errorId: string;
  type: 'replace' | 'insert' | 'delete' | 'refactor';
  startLine: number;
  endLine: number;
  startColumn: number;
  endColumn: number;
  originalCode: string;
  fixedCode: string;
  description: string;
  confidence: number;
  impact: 'low' | 'medium' | 'high';
  applied: boolean;
  timestamp: string;
}

export interface CorrectionRule {
  id: string;
  name: string;
  description: string;
  category: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  enabled: boolean;
  autoFix: boolean;
  pattern: string;
  replacement?: string;
  languages: string[];
  confidence: number;
  examples: {
    before: string;
    after: string;
  }[];
}

export interface CorrectionConfig {
  autoCorrection: boolean;
  realTimeAnalysis: boolean;
  languages: string[];
  rules: {
    [category: string]: {
      enabled: boolean;
      severity: 'low' | 'medium' | 'high' | 'critical';
      autoFix: boolean;
    };
  };
  thresholds: {
    complexity: number;
    maintainability: number;
    performance: number;
    security: number;
  };
  notifications: {
    errors: boolean;
    warnings: boolean;
    suggestions: boolean;
  };
}

export interface CorrectionStats {
  totalAnalyses: number;
  totalErrors: number;
  totalFixes: number;
  autoFixRate: number;
  averageComplexity: number;
  averageMaintainability: number;
  errorsByType: Record<string, number>;
  fixesByType: Record<string, number>;
  languageStats: Record<string, {
    analyses: number;
    errors: number;
    fixes: number;
  }>;
  timeStats: {
    averageAnalysisTime: number;
    totalAnalysisTime: number;
    fastestAnalysis: number;
    slowestAnalysis: number;
  };
}

export interface CorrectionEvent {
  id: string;
  type: 'analysis_started' | 'analysis_completed' | 'error_detected' | 'fix_applied' | 'rule_updated' | 'config_changed';
  timestamp: string;
  data: any;
  scriptId?: string;
  userId?: string;
}

// Store Interface
interface ScriptAutoCorrectionStore {
  // State
  analyses: ScriptAnalysis[];
  errors: ScriptError[];
  fixes: ScriptFix[];
  rules: CorrectionRule[];
  config: CorrectionConfig;
  stats: CorrectionStats;
  events: CorrectionEvent[];
  isAnalyzing: boolean;
  isApplyingFixes: boolean;
  error: string | null;
  isInitialized: boolean;
  
  // Computed values
  recentAnalyses: ScriptAnalysis[];
  criticalErrors: ScriptError[];
  pendingFixes: ScriptFix[];
  enabledRules: CorrectionRule[];
  errorsByCategory: Record<string, ScriptError[]>;
  fixesByImpact: Record<string, ScriptFix[]>;
  
  // Actions
  analyzeScript: (scriptId: string, content: string, language: string) => Promise<ScriptAnalysis>;
  applyFix: (fixId: string) => Promise<boolean>;
  applyAllFixes: (analysisId: string) => Promise<number>;
  updateRule: (ruleId: string, updates: Partial<CorrectionRule>) => Promise<void>;
  addCustomRule: (rule: Omit<CorrectionRule, 'id'>) => Promise<string>;
  removeRule: (ruleId: string) => Promise<void>;
  updateConfig: (updates: Partial<CorrectionConfig>) => Promise<void>;
  getAnalysis: (analysisId: string) => ScriptAnalysis | null;
  getErrorsForScript: (scriptId: string) => ScriptError[];
  getFixesForScript: (scriptId: string) => ScriptFix[];
  searchAnalyses: (query: string) => ScriptAnalysis[];
  filterAnalyses: (filters: any) => ScriptAnalysis[];
  
  // Batch operations
  analyzeMultipleScripts: (scripts: { id: string; content: string; language: string }[]) => Promise<ScriptAnalysis[]>;
  applyFixesBatch: (fixIds: string[]) => Promise<{ applied: number; failed: number }>;
  
  // Real-time processing
  startRealTimeAnalysis: () => Promise<void>;
  stopRealTimeAnalysis: () => Promise<void>;
  
  // Quick actions
  quickFix: (scriptId: string, errorType: string) => Promise<boolean>;
  autoCorrectScript: (scriptId: string) => Promise<ScriptAnalysis>;
  validateScript: (content: string, language: string) => Promise<{ isValid: boolean; errors: ScriptError[] }>;
  
  // Advanced features
  generateReport: (analysisId: string) => Promise<any>;
  exportAnalysis: (analysisId: string, format: 'json' | 'csv' | 'pdf') => Promise<string>;
  importRules: (rules: CorrectionRule[]) => Promise<void>;
  optimizeScript: (scriptId: string) => Promise<ScriptAnalysis>;
  
  // System operations
  refreshData: () => Promise<void>;
  resetSystem: () => Promise<void>;
  checkHealth: () => Promise<boolean>;
  performMaintenance: () => Promise<void>;
  
  // Utilities
  formatDuration: (ms: number) => string;
  getSeverityColor: (severity: string) => string;
  getTypeIcon: (type: string) => string;
  
  // Configuration and analytics
  getConfig: () => CorrectionConfig;
  getStats: () => CorrectionStats;
  getEvents: (limit?: number) => CorrectionEvent[];
  clearEvents: () => void;
  
  // Debug and monitoring
  logState: () => void;
  validateConfig: () => boolean;
  getSystemInfo: () => any;
}

// Default configuration
const defaultConfig: CorrectionConfig = {
  autoCorrection: false,
  realTimeAnalysis: true,
  languages: ['javascript', 'typescript', 'python', 'java', 'css', 'html'],
  rules: {
    syntax: { enabled: true, severity: 'critical', autoFix: true },
    logic: { enabled: true, severity: 'high', autoFix: false },
    performance: { enabled: true, severity: 'medium', autoFix: true },
    security: { enabled: true, severity: 'critical', autoFix: false },
    style: { enabled: true, severity: 'low', autoFix: true },
    compatibility: { enabled: true, severity: 'medium', autoFix: true }
  },
  thresholds: {
    complexity: 10,
    maintainability: 70,
    performance: 80,
    security: 90
  },
  notifications: {
    errors: true,
    warnings: true,
    suggestions: false
  }
};

// Default rules
const defaultRules: CorrectionRule[] = [
  {
    id: 'no-unused-vars',
    name: 'No Unused Variables',
    description: 'Detect and remove unused variables',
    category: 'logic',
    severity: 'medium',
    enabled: true,
    autoFix: true,
    pattern: 'var\\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\\s*=.*?;(?!.*\\1)',
    languages: ['javascript', 'typescript'],
    confidence: 0.9,
    examples: [
      {
        before: 'var unusedVar = 5;\n',
        after: ''
      }
    ]
  },
  {
    id: 'semicolon-missing',
    name: 'Missing Semicolons',
    description: 'Add missing semicolons',
    category: 'syntax',
    severity: 'low',
    enabled: true,
    autoFix: true,
    pattern: '[^;]\\s*\\n',
    replacement: ';\n',
    languages: ['javascript', 'typescript'],
    confidence: 0.95,
    examples: [
      {
        before: 'var x = 5\n',
        after: 'var x = 5;\n'
      }
    ]
  },
  {
    id: 'console-log-removal',
    name: 'Remove Console Logs',
    description: 'Remove console.log statements in production',
    category: 'performance',
    severity: 'low',
    enabled: false,
    autoFix: true,
    pattern: 'console\\.log\\([^)]*\\);?',
    replacement: '',
    languages: ['javascript', 'typescript'],
    confidence: 0.8,
    examples: [
      {
        before: '\nreturn value;',
        after: 'return value;'
      }
    ]
  }
];

// Create the store
export const useScriptAutoCorrectionStore = create<ScriptAutoCorrectionStore>()(subscribeWithSelector((set, get) => ({
  // Initial state
  analyses: [],
  errors: [],
  fixes: [],
  rules: defaultRules,
  config: defaultConfig,
  stats: {
    totalAnalyses: 0,
    totalErrors: 0,
    totalFixes: 0,
    autoFixRate: 0,
    averageComplexity: 0,
    averageMaintainability: 0,
    errorsByType: {},
    fixesByType: {},
    languageStats: {},
    timeStats: {
      averageAnalysisTime: 0,
      totalAnalysisTime: 0,
      fastestAnalysis: 0,
      slowestAnalysis: 0
    }
  },
  events: [],
  isAnalyzing: false,
  isApplyingFixes: false,
  error: null,
  isInitialized: false,
  
  // Computed values
  get recentAnalyses() {
    return get().analyses
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10);
  },
  
  get criticalErrors() {
    return get().errors.filter(error => error.severity === 'critical');
  },
  
  get pendingFixes() {
    return get().fixes.filter(fix => !fix.applied);
  },
  
  get enabledRules() {
    return get().rules.filter(rule => rule.enabled);
  },
  
  get errorsByCategory() {
    const errors = get().errors;
    return errors.reduce((acc, error) => {
      if (!acc[error.category]) acc[error.category] = [];
      acc[error.category].push(error);
      return acc;
    }, {} as Record<string, ScriptError[]>);
  },
  
  get fixesByImpact() {
    const fixes = get().fixes;
    return fixes.reduce((acc, fix) => {
      if (!acc[fix.impact]) acc[fix.impact] = [];
      acc[fix.impact].push(fix);
      return acc;
    }, {} as Record<string, ScriptFix[]>);
  },
  
  // Actions
  analyzeScript: async (scriptId: string, content: string, language: string) => {
    set({ isAnalyzing: true, error: null });
    
    try {
      const startTime = Date.now();
      
      // Create analysis
      const analysis: ScriptAnalysis = {
        id: `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        scriptId,
        content,
        language,
        errors: [],
        warnings: [],
        suggestions: [],
        metrics: {
          complexity: Math.floor(Math.random() * 20) + 1,
          maintainability: Math.floor(Math.random() * 40) + 60,
          performance: Math.floor(Math.random() * 30) + 70,
          security: Math.floor(Math.random() * 20) + 80,
          readability: Math.floor(Math.random() * 25) + 75
        },
        fixes: [],
        status: 'analyzing',
        timestamp: new Date().toISOString(),
        duration: 0
      };
      
      // Add to analyses
      set(state => ({
        analyses: [...state.analyses, analysis]
      }));
      
      // Simulate analysis with enabled rules
      const enabledRules = get().enabledRules.filter(rule => rule.languages.includes(language));
      const detectedErrors: ScriptError[] = [];
      const generatedFixes: ScriptFix[] = [];
      
      // Simulate error detection
      for (const rule of enabledRules) {
        if (Math.random() > 0.7) { // 30% chance of finding an error
          const error: ScriptError = {
            id: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: rule.category as any,
            severity: rule.severity,
            line: Math.floor(Math.random() * 50) + 1,
            column: Math.floor(Math.random() * 80) + 1,
            message: `${rule.name}: ${rule.description}`,
            description: rule.description,
            suggestion: `Consider applying the ${rule.name} rule`,
            autoFixable: rule.autoFix,
            confidence: rule.confidence,
            category: rule.category,
            rule: rule.id,
            source: content.split('\n')[Math.floor(Math.random() * Math.min(10, content.split('\n').length))] || '',
            timestamp: new Date().toISOString()
          };
          
          detectedErrors.push(error);
          
          // Generate fix if auto-fixable
          if (rule.autoFix) {
            const fix: ScriptFix = {
              id: `fix_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              errorId: error.id,
              type: 'replace',
              startLine: error.line,
              endLine: error.line,
              startColumn: error.column,
              endColumn: error.column + 10,
              originalCode: error.source,
              fixedCode: rule.replacement || error.source + ' // Fixed',
              description: `Auto-fix for ${rule.name}`,
              confidence: rule.confidence,
              impact: rule.severity === 'critical' ? 'high' : rule.severity === 'high' ? 'medium' : 'low',
              applied: false,
              timestamp: new Date().toISOString()
            };
            
            generatedFixes.push(fix);
          }
        }
      }
      
      const duration = Date.now() - startTime;
      
      // Update analysis
      const completedAnalysis: ScriptAnalysis = {
        ...analysis,
        errors: detectedErrors,
        warnings: detectedErrors.filter(e => e.severity === 'medium' || e.severity === 'low'),
        suggestions: detectedErrors.filter(e => e.severity === 'low'),
        fixes: generatedFixes,
        status: 'completed',
        duration
      };
      
      // Update state
      set(state => ({
        analyses: state.analyses.map(a => a.id === analysis.id ? completedAnalysis : a),
        errors: [...state.errors, ...detectedErrors],
        fixes: [...state.fixes, ...generatedFixes],
        isAnalyzing: false
      }));
      
      // Add event
      const event: CorrectionEvent = {
        id: `event_${Date.now()}`,
        type: 'analysis_completed',
        timestamp: new Date().toISOString(),
        data: { analysisId: analysis.id, errorsFound: detectedErrors.length, fixesGenerated: generatedFixes.length },
        scriptId
      };
      
      set(state => ({
        events: [event, ...state.events].slice(0, 100)
      }));
      
      return completedAnalysis;
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Analysis failed', isAnalyzing: false });
      throw error;
    }
  },
  
  applyFix: async (fixId: string) => {
    set({ isApplyingFixes: true, error: null });
    
    try {
      const fix = get().fixes.find(f => f.id === fixId);
      if (!fix) {
        throw new Error('Fix not found');
      }
      
      // Simulate applying fix
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Update fix status
      set(state => ({
        fixes: state.fixes.map(f => f.id === fixId ? { ...f, applied: true } : f),
        isApplyingFixes: false
      }));
      
      // Add event
      const event: CorrectionEvent = {
        id: `event_${Date.now()}`,
        type: 'fix_applied',
        timestamp: new Date().toISOString(),
        data: { fixId, description: fix.description }
      };
      
      set(state => ({
        events: [event, ...state.events].slice(0, 100)
      }));
      
      return true;
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to apply fix', isApplyingFixes: false });
      return false;
    }
  },
  
  applyAllFixes: async (analysisId: string) => {
    set({ isApplyingFixes: true, error: null });
    
    try {
      const analysis = get().analyses.find(a => a.id === analysisId);
      if (!analysis) {
        throw new Error('Analysis not found');
      }
      
      const fixesToApply = analysis.fixes.filter(f => !f.applied && f.confidence > 0.7);
      let appliedCount = 0;
      
      for (const fix of fixesToApply) {
        try {
          await get().applyFix(fix.id);
          appliedCount++;
        } catch (error) {
          console.error(`Failed to apply fix ${fix.id}:`, error);
        }
      }
      
      set({ isApplyingFixes: false });
      return appliedCount;
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to apply fixes', isApplyingFixes: false });
      return 0;
    }
  },
  
  updateRule: async (ruleId: string, updates: Partial<CorrectionRule>) => {
    try {
      set(state => ({
        rules: state.rules.map(rule => rule.id === ruleId ? { ...rule, ...updates } : rule)
      }));
      
      // Add event
      const event: CorrectionEvent = {
        id: `event_${Date.now()}`,
        type: 'rule_updated',
        timestamp: new Date().toISOString(),
        data: { ruleId, updates }
      };
      
      set(state => ({
        events: [event, ...state.events].slice(0, 100)
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to update rule' });
      throw error;
    }
  },
  
  addCustomRule: async (rule: Omit<CorrectionRule, 'id'>) => {
    try {
      const newRule: CorrectionRule = {
        ...rule,
        id: `custom_rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      };
      
      set(state => ({
        rules: [...state.rules, newRule]
      }));
      
      return newRule.id;
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to add custom rule' });
      throw error;
    }
  },
  
  removeRule: async (ruleId: string) => {
    try {
      set(state => ({
        rules: state.rules.filter(rule => rule.id !== ruleId)
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to remove rule' });
      throw error;
    }
  },
  
  updateConfig: async (updates: Partial<CorrectionConfig>) => {
    try {
      set(state => ({
        config: { ...state.config, ...updates }
      }));
      
      // Add event
      const event: CorrectionEvent = {
        id: `event_${Date.now()}`,
        type: 'config_changed',
        timestamp: new Date().toISOString(),
        data: { updates }
      };
      
      set(state => ({
        events: [event, ...state.events].slice(0, 100)
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to update config' });
      throw error;
    }
  },
  
  getAnalysis: (analysisId: string) => {
    return get().analyses.find(a => a.id === analysisId) || null;
  },
  
  getErrorsForScript: (scriptId: string) => {
    const analyses = get().analyses.filter(a => a.scriptId === scriptId);
    return analyses.flatMap(a => a.errors);
  },
  
  getFixesForScript: (scriptId: string) => {
    const analyses = get().analyses.filter(a => a.scriptId === scriptId);
    return analyses.flatMap(a => a.fixes);
  },
  
  searchAnalyses: (query: string) => {
    const analyses = get().analyses;
    const lowerQuery = query.toLowerCase();
    
    return analyses.filter(analysis => 
      analysis.scriptId.toLowerCase().includes(lowerQuery) ||
      analysis.language.toLowerCase().includes(lowerQuery) ||
      analysis.errors.some(error => 
        error.message.toLowerCase().includes(lowerQuery) ||
        error.description.toLowerCase().includes(lowerQuery)
      )
    );
  },
  
  filterAnalyses: (filters: any) => {
    let analyses = get().analyses;
    
    if (filters.language) {
      analyses = analyses.filter(a => a.language === filters.language);
    }
    
    if (filters.status) {
      analyses = analyses.filter(a => a.status === filters.status);
    }
    
    if (filters.hasErrors !== undefined) {
      analyses = analyses.filter(a => filters.hasErrors ? a.errors.length > 0 : a.errors.length === 0);
    }
    
    return analyses;
  },
  
  // Batch operations
  analyzeMultipleScripts: async (scripts: { id: string; content: string; language: string }[]) => {
    const results: ScriptAnalysis[] = [];
    
    for (const script of scripts) {
      try {
        const analysis = await get().analyzeScript(script.id, script.content, script.language);
        results.push(analysis);
      } catch (error) {
        console.error(`Failed to analyze script ${script.id}:`, error);
      }
    }
    
    return results;
  },
  
  applyFixesBatch: async (fixIds: string[]) => {
    let applied = 0;
    let failed = 0;
    
    for (const fixId of fixIds) {
      try {
        const success = await get().applyFix(fixId);
        if (success) applied++;
        else failed++;
      } catch (error) {
        failed++;
      }
    }
    
    return { applied, failed };
  },
  
  // Real-time processing
  startRealTimeAnalysis: async () => {
    try {
      set(state => ({
        config: { ...state.config, realTimeAnalysis: true }
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to start real-time analysis' });
    }
  },
  
  stopRealTimeAnalysis: async () => {
    try {
      set(state => ({
        config: { ...state.config, realTimeAnalysis: false }
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to stop real-time analysis' });
    }
  },
  
  // Quick actions
  quickFix: async (scriptId: string, errorType: string) => {
    try {
      const fixes = get().getFixesForScript(scriptId).filter(f => 
        !f.applied && 
        f.confidence > 0.8 && 
        get().errors.find(e => e.id === f.errorId)?.type === errorType
      );
      
      if (fixes.length > 0) {
        return await get().applyFix(fixes[0].id);
      }
      
      return false;
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Quick fix failed' });
      return false;
    }
  },
  
  autoCorrectScript: async (scriptId: string) => {
    try {
      // Get the latest analysis for the script
      const analyses = get().analyses.filter(a => a.scriptId === scriptId);
      if (analyses.length === 0) {
        throw new Error('No analysis found for script');
      }
      
      const latestAnalysis = analyses.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )[0];
      
      // Apply all high-confidence fixes
      await get().applyAllFixes(latestAnalysis.id);
      
      return latestAnalysis;
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Auto-correction failed' });
      throw error;
    }
  },
  
  validateScript: async (content: string, language: string) => {
    try {
      // Simulate validation
      const tempAnalysis = await get().analyzeScript('temp_validation', content, language);
      
      return {
        isValid: tempAnalysis.errors.filter(e => e.severity === 'critical' || e.severity === 'high').length === 0,
        errors: tempAnalysis.errors
      };
    } catch (error) {
      return {
        isValid: false,
        errors: []
      };
    }
  },
  
  // Advanced features
  generateReport: async (analysisId: string) => {
    try {
      const analysis = get().getAnalysis(analysisId);
      if (!analysis) {
        throw new Error('Analysis not found');
      }
      
      return {
        analysis,
        summary: {
          totalErrors: analysis.errors.length,
          criticalErrors: analysis.errors.filter(e => e.severity === 'critical').length,
          autoFixableErrors: analysis.errors.filter(e => e.autoFixable).length,
          appliedFixes: analysis.fixes.filter(f => f.applied).length
        },
        recommendations: [
          'Consider enabling auto-correction for low-risk fixes',
          'Review critical security issues immediately',
          'Improve code maintainability score'
        ]
      };
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to generate report' });
      throw error;
    }
  },
  
  exportAnalysis: async (analysisId: string, format: 'json' | 'csv' | 'pdf') => {
    try {
      const analysis = get().getAnalysis(analysisId);
      if (!analysis) {
        throw new Error('Analysis not found');
      }
      
      // Simulate export
      const exportData = {
        analysis,
        exportedAt: new Date().toISOString(),
        format
      };
      
      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to export analysis' });
      throw error;
    }
  },
  
  importRules: async (rules: CorrectionRule[]) => {
    try {
      set(state => ({
        rules: [...state.rules, ...rules]
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to import rules' });
      throw error;
    }
  },
  
  optimizeScript: async (scriptId: string) => {
    try {
      // Get current script content (simulated)
      const content = `// Optimized script content for ${scriptId}`;
      
      // Analyze with optimization focus
      return await get().analyzeScript(scriptId + '_optimized', content, 'javascript');
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to optimize script' });
      throw error;
    }
  },
  
  // System operations
  refreshData: async () => {
    try {
      // Simulate data refresh
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update stats
      const state = get();
      const stats: CorrectionStats = {
        totalAnalyses: state.analyses.length,
        totalErrors: state.errors.length,
        totalFixes: state.fixes.length,
        autoFixRate: state.fixes.length > 0 ? state.fixes.filter(f => f.applied).length / state.fixes.length : 0,
        averageComplexity: state.analyses.length > 0 ? 
          state.analyses.reduce((sum, a) => sum + a.metrics.complexity, 0) / state.analyses.length : 0,
        averageMaintainability: state.analyses.length > 0 ? 
          state.analyses.reduce((sum, a) => sum + a.metrics.maintainability, 0) / state.analyses.length : 0,
        errorsByType: state.errors.reduce((acc, error) => {
          acc[error.type] = (acc[error.type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        fixesByType: state.fixes.reduce((acc, fix) => {
          acc[fix.type] = (acc[fix.type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        languageStats: state.analyses.reduce((acc, analysis) => {
          if (!acc[analysis.language]) {
            acc[analysis.language] = { analyses: 0, errors: 0, fixes: 0 };
          }
          acc[analysis.language].analyses++;
          acc[analysis.language].errors += analysis.errors.length;
          acc[analysis.language].fixes += analysis.fixes.length;
          return acc;
        }, {} as Record<string, { analyses: number; errors: number; fixes: number }>),
        timeStats: {
          averageAnalysisTime: state.analyses.length > 0 ? 
            state.analyses.reduce((sum, a) => sum + a.duration, 0) / state.analyses.length : 0,
          totalAnalysisTime: state.analyses.reduce((sum, a) => sum + a.duration, 0),
          fastestAnalysis: Math.min(...state.analyses.map(a => a.duration), 0),
          slowestAnalysis: Math.max(...state.analyses.map(a => a.duration), 0)
        }
      };
      
      set({ stats });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to refresh data' });
    }
  },
  
  resetSystem: async () => {
    try {
      set({
        analyses: [],
        errors: [],
        fixes: [],
        events: [],
        error: null,
        isAnalyzing: false,
        isApplyingFixes: false
      });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to reset system' });
    }
  },
  
  checkHealth: async () => {
    try {
      // Simulate health check
      await new Promise(resolve => setTimeout(resolve, 500));
      return true;
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Health check failed' });
      return false;
    }
  },
  
  performMaintenance: async () => {
    try {
      // Clean old events
      set(state => ({
        events: state.events.slice(0, 50)
      }));
      
      // Update stats
      await get().refreshData();
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Maintenance failed' });
    }
  },
  
  // Utilities
  formatDuration: (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  },
  
  getSeverityColor: (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600';
      case 'high': return 'text-orange-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  },
  
  getTypeIcon: (type: string) => {
    switch (type) {
      case 'syntax': return 'Code';
      case 'logic': return 'Brain';
      case 'performance': return 'Zap';
      case 'security': return 'Shield';
      case 'style': return 'Palette';
      case 'compatibility': return 'Globe';
      default: return 'AlertTriangle';
    }
  },
  
  // Configuration and analytics
  getConfig: () => get().config,
  getStats: () => get().stats,
  getEvents: (limit?: number) => {
    const events = get().events;
    return limit ? events.slice(0, limit) : events;
  },
  clearEvents: () => set({ events: [] }),
  
  // Debug and monitoring
  logState: () => {
  },
  
  validateConfig: () => {
    const config = get().config;
    return !!(config.languages.length > 0 && config.rules);
  },
  
  getSystemInfo: () => {
    const state = get();
    return {
      isInitialized: state.isInitialized,
      totalAnalyses: state.analyses.length,
      totalRules: state.rules.length,
      enabledRules: state.enabledRules.length,
      isProcessing: state.isAnalyzing || state.isApplyingFixes,
      hasErrors: state.error !== null,
      configValid: get().validateConfig()
    };
  }
})));

// Manager class for external usage
export class ScriptAutoCorrectionManager {
  private store = useScriptAutoCorrectionStore;
  
  async initialize() {
    try {
      // Initialize the system
      this.store.setState({ isInitialized: true });
      
      // Load initial data
      await this.store.getState().refreshData();
      
      return true;
    } catch (error) {
      console.error('Failed to initialize Script Auto-Correction Manager:', error);
      return false;
    }
  }
  
  async analyzeScript(scriptId: string, content: string, language: string) {
    return this.store.getState().analyzeScript(scriptId, content, language);
  }
  
  async applyFix(fixId: string) {
    return this.store.getState().applyFix(fixId);
  }
  
  async autoCorrect(scriptId: string) {
    return this.store.getState().autoCorrectScript(scriptId);
  }
  
  getAnalyses() {
    return this.store.getState().analyses;
  }
  
  getErrors() {
    return this.store.getState().errors;
  }
  
  getFixes() {
    return this.store.getState().fixes;
  }
  
  getConfig() {
    return this.store.getState().config;
  }
  
  async updateConfig(updates: Partial<CorrectionConfig>) {
    return this.store.getState().updateConfig(updates);
  }
}

// Global instance
export const scriptAutoCorrectionManager = new ScriptAutoCorrectionManager();

// Utility functions
export const formatDuration = (ms: number): string => {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
};

export const getSeverityColorClass = (severity: string): string => {
  switch (severity) {
    case 'critical': return 'text-red-600 bg-red-50 border-red-200';
    case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
    case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    case 'low': return 'text-blue-600 bg-blue-50 border-blue-200';
    default: return 'text-gray-600 bg-gray-50 border-gray-200';
  }
};

export const getTypeIcon = (type: string): string => {
  switch (type) {
    case 'syntax': return 'Code';
    case 'logic': return 'Brain';
    case 'performance': return 'Zap';
    case 'security': return 'Shield';
    case 'style': return 'Palette';
    case 'compatibility': return 'Globe';
    default: return 'AlertTriangle';
  }
};