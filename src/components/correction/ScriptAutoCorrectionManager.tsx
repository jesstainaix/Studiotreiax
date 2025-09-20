import React, { useState, useEffect, useMemo } from 'react';
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Code,
  Settings,
  Play,
  Pause,
  RefreshCw,
  Download,
  Upload,
  Search,
  Filter,
  BarChart3,
  FileText,
  Zap,
  Shield,
  Brain,
  Palette,
  Globe,
  X,
  ChevronDown,
  ChevronRight,
  Eye,
  Edit,
  Trash2,
  Plus,
  Save,
  RotateCcw,
  Activity,
  TrendingUp,
  Users,
  Calendar,
  Target
} from 'lucide-react';
import { useScriptAutoCorrection } from '../../hooks/useScriptAutoCorrection';
import { ScriptAnalysis, ScriptError, ScriptFix, CorrectionRule } from '../../services/scriptAutoCorrectionService';

const ScriptAutoCorrectionManager: React.FC = () => {
  // Hook state
  const {
    analyses,
    errors,
    fixes,
    rules,
    config,
    stats,
    events,
    isAnalyzing,
    isApplyingFixes,
    error,
    isInitialized,
    recentAnalyses,
    criticalErrors,
    pendingFixes,
    enabledRules,
    errorsByCategory,
    fixesByImpact,
    selectedAnalysis,
    selectedError,
    selectedFix,
    searchQuery,
    filters,
    autoRefresh,
    filteredAnalyses,
    selectedAnalysisData,
    selectedErrorData,
    selectedFixData,
    hasActiveFilters,
    totalIssues,
    criticalIssues,
    pendingFixesCount,
    autoFixableCount,
    isProcessing,
    systemHealth,
    actions,
    quickActions,
    advancedFeatures,
    systemOperations,
    utilities,
    configHelpers,
    formatDuration,
    getSeverityColor,
    getTypeIcon
  } = useScriptAutoCorrection();

  // Icon mapping for error categories
  const typeIconMap = {
    syntax: Code,
    logic: Brain,
    performance: Zap,
    security: Shield,
    style: Palette,
    compatibility: Globe
  };

  // Get icon component from type
  const getIconComponent = (type: string) => {
    return typeIconMap[type as keyof typeof typeIconMap] || AlertTriangle;
  };

  // Local state
  const [activeTab, setActiveTab] = useState('overview');
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [showRuleModal, setShowRuleModal] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['syntax', 'security']));
  const [newScript, setNewScript] = useState({ id: '', content: '', language: 'javascript' });
  const [newRule, setNewRule] = useState<Partial<CorrectionRule>>({});
  const [batchProgress, setBatchProgress] = useState(0);

  // Auto-refresh and demo data generation
  useEffect(() => {
    const generateDemoData = async () => {
      if (analyses.length === 0 && isInitialized) {
        try {
          // Generate some demo analyses
          const demoScripts = [
            { id: 'script1', content: 'var x = 5\n {\n  return undefined;\n}', language: 'javascript' },
            { id: 'script3', content: 'let data = fetch("/api/data");', language: 'typescript' }
          ];
          
          for (const script of demoScripts) {
            await actions.analyzeScript(script.id, script.content, script.language);
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        } catch (error) {
          console.error('Failed to generate demo data:', error);
        }
      }
    };

    if (isInitialized) {
      generateDemoData();
    }
  }, [isInitialized, analyses.length, actions]);

  // Filtered and sorted data
  const sortedAnalyses = useMemo(() => {
    return [...filteredAnalyses].sort((a, b) => {
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });
  }, [filteredAnalyses]);

  const sortedErrors = useMemo(() => {
    return [...errors].sort((a, b) => {
      const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return severityOrder[b.severity] - severityOrder[a.severity];
    });
  }, [errors]);

  const sortedFixes = useMemo(() => {
    return [...fixes].sort((a, b) => {
      if (a.applied !== b.applied) return a.applied ? 1 : -1;
      return b.confidence - a.confidence;
    });
  }, [fixes]);

  // Status cards data
  const statusCards = [
    {
      title: 'Total Analyses',
      value: analyses.length,
      icon: FileText,
      color: 'bg-blue-500',
      change: '+12%',
      trend: 'up'
    },
    {
      title: 'Critical Issues',
      value: criticalIssues,
      icon: AlertTriangle,
      color: 'bg-red-500',
      change: '-8%',
      trend: 'down'
    },
    {
      title: 'Pending Fixes',
      value: pendingFixesCount,
      icon: Clock,
      color: 'bg-yellow-500',
      change: '+5%',
      trend: 'up'
    },
    {
      title: 'Auto-fixable',
      value: autoFixableCount,
      icon: Zap,
      color: 'bg-green-500',
      change: '+15%',
      trend: 'up'
    }
  ];

  // Tab configuration
  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'analyses', label: 'Analyses', icon: FileText },
    { id: 'errors', label: 'Errors', icon: AlertTriangle },
    { id: 'fixes', label: 'Fixes', icon: CheckCircle },
    { id: 'rules', label: 'Rules', icon: Settings },
    { id: 'realtime', label: 'Real-time', icon: Activity },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const handleAnalyzeScript = async () => {
    if (!newScript.id || !newScript.content) return;
    
    try {
      await actions.analyzeScript(newScript.id, newScript.content, newScript.language);
      setNewScript({ id: '', content: '', language: 'javascript' });
    } catch (error) {
      console.error('Failed to analyze script:', error);
    }
  };

  const handleBatchAnalysis = async () => {
    const scripts = [
      { id: 'batch1', content: '', language: 'javascript' },
      { id: 'batch2', content: 'var unused = 5;', language: 'javascript' },
      { id: 'batch3', content: 'function empty() {}', language: 'typescript' }
    ];
    
    try {
      await advancedFeatures.batchAnalysis(scripts, setBatchProgress);
      setBatchProgress(0);
    } catch (error) {
      console.error('Batch analysis failed:', error);
    }
  };

  const handleAddRule = async () => {
    if (!newRule.name || !newRule.pattern) return;
    
    try {
      await actions.addCustomRule({
        name: newRule.name,
        description: newRule.description || '',
        category: newRule.category || 'custom',
        severity: newRule.severity || 'medium',
        enabled: true,
        autoFix: newRule.autoFix || false,
        pattern: newRule.pattern,
        replacement: newRule.replacement,
        languages: newRule.languages || ['javascript'],
        confidence: newRule.confidence || 0.8,
        examples: newRule.examples || []
      });
      setNewRule({});
      setShowRuleModal(false);
    } catch (error) {
      console.error('Failed to add rule:', error);
    }
  };

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-500" />
          <p className="text-gray-600">Initializing Script Auto-Correction System...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Code className="h-8 w-8 text-blue-600" />
            Script Auto-Correction
          </h1>
          <p className="text-gray-600 mt-1">
            AI-powered script analysis and automatic error correction
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => utilities.toggleAutoRefresh()}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
              autoRefresh
                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {autoRefresh ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            {autoRefresh ? 'Auto-refresh On' : 'Auto-refresh Off'}
          </button>
          <button
            onClick={systemOperations.refresh}
            disabled={isProcessing}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isProcessing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="font-medium text-red-800">System Error</h3>
            <p className="text-red-700 text-sm mt-1">{error}</p>
          </div>
          <button
            onClick={() => systemOperations.refresh()}
            className="text-red-600 hover:text-red-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      )}

      {/* Loading State */}
      {isProcessing && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center gap-3">
          <RefreshCw className="h-5 w-5 text-blue-600 animate-spin flex-shrink-0" />
          <div className="flex-1">
            <h3 className="font-medium text-blue-800">
              {isAnalyzing ? 'Analyzing Scripts...' : 'Applying Fixes...'}
            </h3>
            <p className="text-blue-700 text-sm mt-1">
              {isAnalyzing ? 'Running code analysis and error detection' : 'Applying automatic corrections'}
            </p>
          </div>
          {batchProgress > 0 && (
            <div className="w-32">
              <div className="bg-blue-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${batchProgress}%` }}
                />
              </div>
              <p className="text-xs text-blue-600 mt-1 text-center">{Math.round(batchProgress)}%</p>
            </div>
          )}
        </div>
      )}

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statusCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{card.title}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{card.value}</p>
                </div>
                <div className={`${card.color} p-3 rounded-lg`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="flex items-center mt-4 text-sm">
                <span className={`flex items-center gap-1 ${
                  card.trend === 'up' ? 'text-green-600' : 'text-red-600'
                }`}>
                  <TrendingUp className={`h-4 w-4 ${
                    card.trend === 'down' ? 'rotate-180' : ''
                  }`} />
                  {card.change}
                </span>
                <span className="text-gray-500 ml-2">vs last week</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Quick Actions */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
                  <div className="space-y-3">
                    <button
                      onClick={handleBatchAnalysis}
                      disabled={isProcessing}
                      className="w-full p-4 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50 flex items-center gap-3"
                    >
                      <Play className="h-5 w-5 text-blue-600" />
                      <div className="text-left">
                        <p className="font-medium text-blue-900">Run Batch Analysis</p>
                        <p className="text-sm text-blue-700">Analyze multiple scripts at once</p>
                      </div>
                    </button>
                    <button
                      onClick={() => quickActions.autoCorrect('all')}
                      disabled={isProcessing || pendingFixesCount === 0}
                      className="w-full p-4 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors disabled:opacity-50 flex items-center gap-3"
                    >
                      <Zap className="h-5 w-5 text-green-600" />
                      <div className="text-left">
                        <p className="font-medium text-green-900">Auto-fix All Issues</p>
                        <p className="text-sm text-green-700">{autoFixableCount} fixes available</p>
                      </div>
                    </button>
                    <button
                      onClick={() => setShowConfigModal(true)}
                      className="w-full p-4 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors flex items-center gap-3"
                    >
                      <Settings className="h-5 w-5 text-purple-600" />
                      <div className="text-left">
                        <p className="font-medium text-purple-900">Configure Rules</p>
                        <p className="text-sm text-purple-700">Customize correction settings</p>
                      </div>
                    </button>
                  </div>
                </div>

                {/* System Health */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">System Health</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium text-gray-700">System Status</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        systemHealth.isHealthy
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {systemHealth.isHealthy ? 'Healthy' : 'Issues Detected'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium text-gray-700">Configuration</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        systemHealth.configValid
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {systemHealth.configValid ? 'Valid' : 'Needs Review'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium text-gray-700">Data Status</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        systemHealth.hasData
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {systemHealth.hasData ? 'Data Available' : 'No Data'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
                <div className="space-y-3">
                  {events.slice(0, 5).map((event) => (
                    <div key={event.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {event.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(event.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Analyses Tab */}
          {activeTab === 'analyses' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Script Analyses</h3>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search analyses..."
                      value={searchQuery}
                      onChange={(e) => utilities.search(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <button
                    onClick={() => setShowAnalysisModal(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    New Analysis
                  </button>
                </div>
              </div>

              <div className="grid gap-4">
                {sortedAnalyses.map((analysis) => (
                  <div
                    key={analysis.id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => {
                      utilities.selectAnalysis(analysis.id);
                      setShowAnalysisModal(true);
                    }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${
                          analysis.status === 'completed' ? 'bg-green-500' :
                          analysis.status === 'analyzing' ? 'bg-yellow-500' :
                          analysis.status === 'failed' ? 'bg-red-500' : 'bg-gray-500'
                        }`} />
                        <h4 className="font-medium text-gray-900">{analysis.scriptId}</h4>
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium">
                          {analysis.language}
                        </span>
                      </div>
                      <span className="text-sm text-gray-500">
                        {formatDuration(analysis.duration)}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Errors:</span>
                        <span className="ml-2 font-medium text-red-600">{analysis.errors.length}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Fixes:</span>
                        <span className="ml-2 font-medium text-green-600">{analysis.fixes.length}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Complexity:</span>
                        <span className="ml-2 font-medium">{analysis.metrics.complexity}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Maintainability:</span>
                        <span className="ml-2 font-medium">{analysis.metrics.maintainability}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Errors Tab */}
          {activeTab === 'errors' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Detected Errors</h3>
              
              <div className="space-y-4">
                {Object.entries(errorsByCategory).map(([category, categoryErrors]) => (
                  <div key={category} className="border border-gray-200 rounded-lg">
                    <button
                      onClick={() => toggleCategory(category)}
                      className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {React.createElement(
                          getIconComponent(category),
                          { className: 'h-5 w-5 text-gray-600' }
                        )}
                        <span className="font-medium text-gray-900 capitalize">{category}</span>
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm">
                          {categoryErrors.length}
                        </span>
                      </div>
                      {expandedCategories.has(category) ? (
                        <ChevronDown className="h-5 w-5 text-gray-400" />
                      ) : (
                        <ChevronRight className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                    
                    {expandedCategories.has(category) && (
                      <div className="border-t border-gray-200">
                        {categoryErrors.map((error) => (
                          <div key={error.id} className="p-4 border-b border-gray-100 last:border-b-0">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                                    getSeverityColor(error.severity)
                                  }`}>
                                    {error.severity}
                                  </span>
                                  <span className="text-sm text-gray-500">
                                    Line {error.line}:{error.column}
                                  </span>
                                </div>
                                <p className="font-medium text-gray-900 mb-1">{error.message}</p>
                                <p className="text-sm text-gray-600 mb-2">{error.description}</p>
                                {error.suggestion && (
                                  <p className="text-sm text-blue-600 bg-blue-50 p-2 rounded">
                                    💡 {error.suggestion}
                                  </p>
                                )}
                              </div>
                              <div className="flex items-center gap-2 ml-4">
                                {error.autoFixable && (
                                  <button
                                    onClick={() => quickActions.quickFix(error.source, error.type)}
                                    className="px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 text-sm"
                                  >
                                    Quick Fix
                                  </button>
                                )}
                                <button
                                  onClick={() => utilities.selectError(error.id)}
                                  className="p-1 text-gray-400 hover:text-gray-600"
                                >
                                  <Eye className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Fixes Tab */}
          {activeTab === 'fixes' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Available Fixes</h3>
                <button
                  onClick={() => actions.applyAllFixes('all')}
                  disabled={pendingFixesCount === 0 || isProcessing}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
                >
                  <Zap className="h-4 w-4" />
                  Apply All ({pendingFixesCount})
                </button>
              </div>

              <div className="space-y-4">
                {Object.entries(fixesByImpact).map(([impact, impactFixes]) => (
                  <div key={impact} className="border border-gray-200 rounded-lg">
                    <div className="p-4 bg-gray-50 border-b border-gray-200">
                      <h4 className="font-medium text-gray-900 capitalize">
                        {impact} Impact Fixes ({impactFixes.length})
                      </h4>
                    </div>
                    <div className="divide-y divide-gray-100">
                      {impactFixes.map((fix) => (
                        <div key={fix.id} className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className={`w-3 h-3 rounded-full ${
                                  fix.applied ? 'bg-green-500' : 'bg-yellow-500'
                                }`} />
                                <span className="font-medium text-gray-900">{fix.description}</span>
                                <span className="text-sm text-gray-500">
                                  {Math.round(fix.confidence * 100)}% confidence
                                </span>
                              </div>
                              <div className="text-sm text-gray-600 space-y-1">
                                <p><span className="font-medium">Type:</span> {fix.type}</p>
                                <p><span className="font-medium">Location:</span> Line {fix.startLine}-{fix.endLine}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 ml-4">
                              {!fix.applied && (
                                <button
                                  onClick={() => actions.applyFix(fix.id)}
                                  disabled={isProcessing}
                                  className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-sm disabled:opacity-50"
                                >
                                  Apply
                                </button>
                              )}
                              <button
                                onClick={() => utilities.selectFix(fix.id)}
                                className="p-1 text-gray-400 hover:text-gray-600"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Rules Tab */}
          {activeTab === 'rules' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Correction Rules</h3>
                <button
                  onClick={() => setShowRuleModal(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Rule
                </button>
              </div>

              <div className="grid gap-4">
                {rules.map((rule) => (
                  <div key={rule.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${
                          rule.enabled ? 'bg-green-500' : 'bg-gray-400'
                        }`} />
                        <h4 className="font-medium text-gray-900">{rule.name}</h4>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          getSeverityColor(rule.severity)
                        }`}>
                          {rule.severity}
                        </span>
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                          {rule.category}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => actions.updateRule(rule.id, { enabled: !rule.enabled })}
                          className={`px-3 py-1 rounded text-sm ${
                            rule.enabled
                              ? 'bg-red-100 text-red-700 hover:bg-red-200'
                              : 'bg-green-100 text-green-700 hover:bg-green-200'
                          }`}
                        >
                          {rule.enabled ? 'Disable' : 'Enable'}
                        </button>
                        <button
                          onClick={() => actions.removeRule(rule.id)}
                          className="p-1 text-gray-400 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{rule.description}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>Languages: {rule.languages.join(', ')}</span>
                      <span>Auto-fix: {rule.autoFix ? 'Yes' : 'No'}</span>
                      <span>Confidence: {Math.round(rule.confidence * 100)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Real-time Tab */}
          {activeTab === 'realtime' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Real-time Monitoring</h3>
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    config.realTimeAnalysis
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {config.realTimeAnalysis ? 'Active' : 'Inactive'}
                  </span>
                  <button
                    onClick={() => 
                      config.realTimeAnalysis 
                        ? systemOperations.refresh() 
                        : systemOperations.refresh()
                    }
                    className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                      config.realTimeAnalysis
                        ? 'bg-red-100 text-red-700 hover:bg-red-200'
                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                    }`}
                  >
                    {config.realTimeAnalysis ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    {config.realTimeAnalysis ? 'Stop' : 'Start'}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Live Activity</h4>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {events.slice(0, 20).map((event) => (
                      <div key={event.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">
                            {event.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(event.timestamp).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Performance Metrics</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium text-gray-700">Avg Analysis Time</span>
                      <span className="text-sm text-gray-900">
                        {formatDuration(stats.timeStats.averageAnalysisTime)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium text-gray-700">Auto-fix Rate</span>
                      <span className="text-sm text-gray-900">
                        {Math.round(stats.autoFixRate * 100)}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium text-gray-700">Active Rules</span>
                      <span className="text-sm text-gray-900">{enabledRules.length}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Analytics & Reports</h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Error Distribution</h4>
                  <div className="space-y-2">
                    {Object.entries(stats.errorsByType).map(([type, count]) => (
                      <div key={type} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm font-medium text-gray-700 capitalize">{type}</span>
                        <span className="text-sm text-gray-900">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Language Statistics</h4>
                  <div className="space-y-2">
                    {Object.entries(stats.languageStats).map(([language, langStats]) => (
                      <div key={language} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700 capitalize">{language}</span>
                          <span className="text-sm text-gray-900">{langStats.analyses} analyses</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-xs text-gray-600">
                          <span>Errors: {langStats.errors}</span>
                          <span>Fixes: {langStats.fixes}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">System Settings</h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">General Settings</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium text-gray-700">Auto-correction</span>
                      <button
                        onClick={() => actions.updateConfig({ autoCorrection: !config.autoCorrection })}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          config.autoCorrection ? 'bg-blue-600' : 'bg-gray-200'
                        }`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          config.autoCorrection ? 'translate-x-6' : 'translate-x-1'
                        }`} />
                      </button>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium text-gray-700">Real-time Analysis</span>
                      <button
                        onClick={() => actions.updateConfig({ realTimeAnalysis: !config.realTimeAnalysis })}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          config.realTimeAnalysis ? 'bg-blue-600' : 'bg-gray-200'
                        }`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          config.realTimeAnalysis ? 'translate-x-6' : 'translate-x-1'
                        }`} />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">System Actions</h4>
                  <div className="space-y-3">
                    <button
                      onClick={systemOperations.maintenance}
                      className="w-full p-3 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-3"
                    >
                      <Settings className="h-5 w-5 text-blue-600" />
                      <span className="text-blue-900 font-medium">Run Maintenance</span>
                    </button>
                    <button
                      onClick={systemOperations.reset}
                      className="w-full p-3 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors flex items-center gap-3"
                    >
                      <RotateCcw className="h-5 w-5 text-red-600" />
                      <span className="text-red-900 font-medium">Reset System</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Analysis Modal */}
      {showAnalysisModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  {selectedAnalysisData ? 'Analysis Details' : 'New Script Analysis'}
                </h3>
                <button
                  onClick={() => {
                    setShowAnalysisModal(false);
                    utilities.selectAnalysis(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              {selectedAnalysisData ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Script ID</label>
                      <p className="text-gray-900">{selectedAnalysisData.scriptId}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
                      <p className="text-gray-900">{selectedAnalysisData.language}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                      <span className={`px-2 py-1 rounded text-sm font-medium ${
                        selectedAnalysisData.status === 'completed' ? 'bg-green-100 text-green-800' :
                        selectedAnalysisData.status === 'analyzing' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {selectedAnalysisData.status}
                      </span>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                      <p className="text-gray-900">{formatDuration(selectedAnalysisData.duration)}</p>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Metrics</label>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      {Object.entries(selectedAnalysisData.metrics).map(([key, value]) => (
                        <div key={key} className="text-center p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm text-gray-600 capitalize">{key}</p>
                          <p className="text-lg font-semibold text-gray-900">
                            {typeof value === 'number' ? (key === 'complexity' ? value : `${value}%`) : value}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Script Content</label>
                    <pre className="bg-gray-50 p-4 rounded-lg text-sm overflow-x-auto">
                      <code>{selectedAnalysisData.content}</code>
                    </pre>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Script ID</label>
                    <input
                      type="text"
                      value={newScript.id}
                      onChange={(e) => setNewScript({ ...newScript, id: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter script identifier"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
                    <select
                      value={newScript.language}
                      onChange={(e) => setNewScript({ ...newScript, language: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="javascript">JavaScript</option>
                      <option value="typescript">TypeScript</option>
                      <option value="python">Python</option>
                      <option value="java">Java</option>
                      <option value="css">CSS</option>
                      <option value="html">HTML</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Script Content</label>
                    <textarea
                      value={newScript.content}
                      onChange={(e) => setNewScript({ ...newScript, content: e.target.value })}
                      rows={10}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                      placeholder="Paste your script content here..."
                    />
                  </div>
                  
                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => setShowAnalysisModal(false)}
                      className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAnalyzeScript}
                      disabled={!newScript.id || !newScript.content || isProcessing}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      Analyze Script
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Rule Modal */}
      {showRuleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Add Custom Rule</h3>
                <button
                  onClick={() => {
                    setShowRuleModal(false);
                    setNewRule({});
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rule Name</label>
                  <input
                    type="text"
                    value={newRule.name || ''}
                    onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter rule name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={newRule.category || 'custom'}
                    onChange={(e) => setNewRule({ ...newRule, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="syntax">Syntax</option>
                    <option value="logic">Logic</option>
                    <option value="performance">Performance</option>
                    <option value="security">Security</option>
                    <option value="style">Style</option>
                    <option value="compatibility">Compatibility</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={newRule.description || ''}
                  onChange={(e) => setNewRule({ ...newRule, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Describe what this rule does"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pattern (Regex)</label>
                <input
                  type="text"
                  value={newRule.pattern || ''}
                  onChange={(e) => setNewRule({ ...newRule, pattern: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                  placeholder="Enter regex pattern"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Replacement (Optional)</label>
                <input
                  type="text"
                  value={newRule.replacement || ''}
                  onChange={(e) => setNewRule({ ...newRule, replacement: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                  placeholder="Enter replacement text"
                />
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Severity</label>
                  <select
                    value={newRule.severity || 'medium'}
                    onChange={(e) => setNewRule({ ...newRule, severity: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Confidence</label>
                  <input
                    type="number"
                    min="0"
                    max="1"
                    step="0.1"
                    value={newRule.confidence || 0.8}
                    onChange={(e) => setNewRule({ ...newRule, confidence: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div className="flex items-center">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={newRule.autoFix || false}
                      onChange={(e) => setNewRule({ ...newRule, autoFix: e.target.checked })}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Auto-fix</span>
                  </label>
                </div>
              </div>
              
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowRuleModal(false);
                    setNewRule({});
                  }}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddRule}
                  disabled={!newRule.name || !newRule.pattern || isProcessing}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  Add Rule
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Config Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">System Configuration</h3>
                <button
                  onClick={() => setShowConfigModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Analysis Settings</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <span className="text-sm font-medium text-gray-700">Auto-correction</span>
                      <p className="text-xs text-gray-500">Automatically apply safe fixes</p>
                    </div>
                    <button
                      onClick={() => actions.updateConfig({ autoCorrection: !config.autoCorrection })}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        config.autoCorrection ? 'bg-blue-600' : 'bg-gray-200'
                      }`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        config.autoCorrection ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <span className="text-sm font-medium text-gray-700">Real-time Analysis</span>
                      <p className="text-xs text-gray-500">Analyze code as you type</p>
                    </div>
                    <button
                      onClick={() => actions.updateConfig({ realTimeAnalysis: !config.realTimeAnalysis })}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        config.realTimeAnalysis ? 'bg-blue-600' : 'bg-gray-200'
                      }`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        config.realTimeAnalysis ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <span className="text-sm font-medium text-gray-700">Strict Mode</span>
                      <p className="text-xs text-gray-500">Enable stricter error detection</p>
                    </div>
                    <button
                      onClick={() => actions.updateConfig({ strictMode: !config.strictMode })}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        config.strictMode ? 'bg-blue-600' : 'bg-gray-200'
                      }`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        config.strictMode ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Performance Settings</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Max Analysis Time (seconds)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="300"
                      value={config.maxAnalysisTime || 30}
                      onChange={(e) => actions.updateConfig({ maxAnalysisTime: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Confidence Threshold
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="1"
                      step="0.1"
                      value={config.confidenceThreshold || 0.7}
                      onChange={(e) => actions.updateConfig({ confidenceThreshold: parseFloat(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowConfigModal(false)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    systemOperations.refresh();
                    setShowConfigModal(false);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Save & Apply
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScriptAutoCorrectionManager;