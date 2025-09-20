import React, { useState, useEffect } from 'react';
import { useAdvancedOptimization } from '../../hooks/useAdvancedOptimization';
import {
  OptimizationRule,
  OptimizationSuggestion,
  PerformanceMetric,
  CacheStrategy
} from '../../hooks/useAdvancedOptimization';
import {
  Zap,
  Settings,
  BarChart3,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Play,
  Pause,
  RefreshCw,
  Download,
  Upload,
  Trash2,
  Plus,
  Edit,
  Eye,
  EyeOff,
  TrendingUp,
  TrendingDown,
  Minus,
  Clock,
  Cpu,
  HardDrive,
  Wifi,
  Monitor,
  Package,
  Filter,
  Search,
  Info,
  Target,
  Layers,
  Database,
  Image,
  Code,
  Gauge
} from 'lucide-react';

interface AdvancedOptimizationManagerProps {
  className?: string;
}

const AdvancedOptimizationManager: React.FC<AdvancedOptimizationManagerProps> = ({
  className = ''
}) => {
  const { state, actions } = useAdvancedOptimization();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [showRuleModal, setShowRuleModal] = useState(false);
  const [editingRule, setEditingRule] = useState<OptimizationRule | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Auto-refresh analytics
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      actions.analyzeBundleSize();
    }, 30000);

    return () => clearInterval(interval);
  }, [autoRefresh, actions]);

  // Filter rules
  const filteredRules = state.rules.filter(rule => {
    const matchesSearch = rule.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         rule.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || rule.category === filterCategory;
    const matchesPriority = filterPriority === 'all' || rule.priority === filterPriority;
    
    return matchesSearch && matchesCategory && matchesPriority;
  });

  // Filter suggestions
  const filteredSuggestions = state.suggestions.filter(suggestion => {
    return suggestion.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
           suggestion.description.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Get analytics
  const analytics = actions.getAnalytics();

  // Get performance score color
  const getPerformanceScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Get metric status color
  const getMetricStatusColor = (metric: PerformanceMetric) => {
    if (metric.value <= metric.threshold.good) return 'text-green-600';
    if (metric.value <= metric.threshold.needs_improvement) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-red-600 bg-red-50';
      case 'high': return 'text-orange-600 bg-orange-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  // Get category icon
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'performance': return <Gauge className="w-4 h-4" />;
      case 'memory': return <Cpu className="w-4 h-4" />;
      case 'network': return <Wifi className="w-4 h-4" />;
      case 'rendering': return <Monitor className="w-4 h-4" />;
      case 'bundle': return <Package className="w-4 h-4" />;
      default: return <Settings className="w-4 h-4" />;
    }
  };

  // Handle rule creation/editing
  const handleSaveRule = (ruleData: Partial<OptimizationRule>) => {
    if (editingRule) {
      actions.updateRule(editingRule.id, ruleData);
    } else {
      actions.addRule(ruleData as Omit<OptimizationRule, 'id'>);
    }
    setShowRuleModal(false);
    setEditingRule(null);
  };

  // Handle suggestion auto-fix
  const handleAutoFix = async (suggestion: OptimizationSuggestion) => {
    if (suggestion.rule) {
      await actions.applyOptimization(suggestion.rule);
      actions.dismissSuggestion(suggestion.id);
    }
  };

  // Export/Import handlers
  const handleExport = () => {
    const data = actions.exportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `optimization-config-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string);
          actions.importData(data);
        } catch (error) {
          console.error('Failed to import data:', error);
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-lg ${className}`}>
      {/* Header */}
      <div className="border-b border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Zap className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Advanced Optimization</h2>
              <p className="text-sm text-gray-500">
                Intelligent performance optimization and monitoring
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`p-2 rounded-lg transition-colors ${
                autoRefresh
                  ? 'bg-green-100 text-green-600 hover:bg-green-200'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              title={autoRefresh ? 'Disable auto-refresh' : 'Enable auto-refresh'}
            >
              <RefreshCw className={`w-4 h-4 ${autoRefresh ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={handleExport}
              className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
              title="Export configuration"
            >
              <Download className="w-4 h-4" />
            </button>
            <label className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors cursor-pointer">
              <Upload className="w-4 h-4" />
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                className="hidden"
              />
            </label>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-6">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
            { id: 'rules', label: 'Rules', icon: Settings },
            { id: 'suggestions', label: 'Suggestions', icon: AlertTriangle },
            { id: 'metrics', label: 'Metrics', icon: TrendingUp },
            { id: 'cache', label: 'Cache', icon: Database },
            { id: 'config', label: 'Config', icon: Settings }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.id === 'suggestions' && state.suggestions.length > 0 && (
                  <span className="bg-red-100 text-red-600 text-xs px-2 py-1 rounded-full">
                    {state.suggestions.length}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Performance Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-600">Performance Score</p>
                    <p className={`text-2xl font-bold ${getPerformanceScoreColor(state.optimizationMetrics.performanceScore)}`}>
                      {state.optimizationMetrics.performanceScore.toFixed(0)}
                    </p>
                  </div>
                  <Gauge className="w-8 h-8 text-blue-600" />
                </div>
              </div>

              <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-600">Optimizations Applied</p>
                    <p className="text-2xl font-bold text-green-700">
                      {state.optimizationMetrics.optimizationsApplied}
                    </p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
              </div>

              <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-600">Memory Usage</p>
                    <p className="text-2xl font-bold text-purple-700">
                      {state.optimizationMetrics.memoryUsage.toFixed(1)} MB
                    </p>
                  </div>
                  <Cpu className="w-8 h-8 text-purple-600" />
                </div>
              </div>

              <div className="bg-gradient-to-r from-orange-50 to-orange-100 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-orange-600">Bundle Size</p>
                    <p className="text-2xl font-bold text-orange-700">
                      {(state.optimizationMetrics.bundleSize / 1024).toFixed(1)} KB
                    </p>
                  </div>
                  <Package className="w-8 h-8 text-orange-600" />
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => actions.applyAllOptimizations()}
                  disabled={state.isOptimizing}
                  className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {state.isOptimizing ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                  <span>{state.isOptimizing ? 'Optimizing...' : 'Apply All Optimizations'}</span>
                </button>
                
                <button
                  onClick={() => actions.analyzeBundleSize()}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <BarChart3 className="w-4 h-4" />
                  <span>Analyze Bundle</span>
                </button>
                
                <button
                  onClick={() => actions.clearCache()}
                  className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Clear Cache</span>
                </button>
              </div>
            </div>

            {/* Recent Suggestions */}
            {state.suggestions.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                <h3 className="text-lg font-medium text-yellow-800 mb-3">Recent Suggestions</h3>
                <div className="space-y-2">
                  {state.suggestions.slice(0, 3).map(suggestion => (
                    <div key={suggestion.id} className="flex items-center justify-between bg-white p-3 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <AlertTriangle className={`w-4 h-4 ${
                          suggestion.type === 'critical' ? 'text-red-500' :
                          suggestion.type === 'warning' ? 'text-yellow-500' : 'text-blue-500'
                        }`} />
                        <div>
                          <p className="font-medium text-gray-900">{suggestion.title}</p>
                          <p className="text-sm text-gray-500">{suggestion.description}</p>
                        </div>
                      </div>
                      {suggestion.autoFixAvailable && (
                        <button
                          onClick={() => handleAutoFix(suggestion)}
                          className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                        >
                          Auto Fix
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Rules Tab */}
        {activeTab === 'rules' && (
          <div className="space-y-6">
            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search rules..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="all">All Categories</option>
                <option value="performance">Performance</option>
                <option value="memory">Memory</option>
                <option value="network">Network</option>
                <option value="rendering">Rendering</option>
                <option value="bundle">Bundle</option>
              </select>
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="all">All Priorities</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
              <button
                onClick={() => setShowRuleModal(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add Rule</span>
              </button>
            </div>

            {/* Rules List */}
            <div className="space-y-4">
              {filteredRules.map(rule => (
                <div key={rule.id} className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <button
                        onClick={() => actions.toggleRule(rule.id)}
                        className={`p-2 rounded-lg transition-colors ${
                          rule.enabled
                            ? 'bg-green-100 text-green-600 hover:bg-green-200'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {rule.enabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                      
                      <div className="flex items-center space-x-2">
                        {getCategoryIcon(rule.category)}
                        <div>
                          <h3 className="font-medium text-gray-900">{rule.name}</h3>
                          <p className="text-sm text-gray-500">{rule.description}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(rule.priority)}`}>
                        {rule.priority}
                      </span>
                      
                      <div className="flex items-center space-x-1 text-sm text-gray-500">
                        <Target className="w-4 h-4" />
                        <span>{rule.impact}/10</span>
                      </div>
                      
                      {rule.metrics.appliedAt && (
                        <div className="flex items-center space-x-1 text-sm text-green-600">
                          <CheckCircle className="w-4 h-4" />
                          <span>Applied</span>
                        </div>
                      )}
                      
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => actions.applyOptimization(rule)}
                          disabled={state.isOptimizing || !rule.enabled}
                          className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          title="Apply optimization"
                        >
                          <Play className="w-4 h-4" />
                        </button>
                        
                        <button
                          onClick={() => {
                            setEditingRule(rule);
                            setShowRuleModal(true);
                          }}
                          className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                          title="Edit rule"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        
                        <button
                          onClick={() => actions.deleteRule(rule.id)}
                          className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                          title="Delete rule"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Suggestions Tab */}
        {activeTab === 'suggestions' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">
                Optimization Suggestions ({state.suggestions.length})
              </h3>
              <button
                onClick={() => actions.clearSuggestions()}
                className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>Clear All</span>
              </button>
            </div>

            <div className="space-y-4">
              {filteredSuggestions.map(suggestion => (
                <div key={suggestion.id} className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <div className={`p-2 rounded-lg ${
                        suggestion.type === 'critical' ? 'bg-red-100 text-red-600' :
                        suggestion.type === 'warning' ? 'bg-yellow-100 text-yellow-600' :
                        'bg-blue-100 text-blue-600'
                      }`}>
                        <AlertTriangle className="w-4 h-4" />
                      </div>
                      
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{suggestion.title}</h4>
                        <p className="text-sm text-gray-500 mt-1">{suggestion.description}</p>
                        
                        <div className="flex items-center space-x-4 mt-3">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            suggestion.impact === 'high' ? 'bg-red-100 text-red-600' :
                            suggestion.impact === 'medium' ? 'bg-yellow-100 text-yellow-600' :
                            'bg-green-100 text-green-600'
                          }`}>
                            {suggestion.impact} impact
                          </span>
                          
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            suggestion.effort === 'complex' ? 'bg-red-100 text-red-600' :
                            suggestion.effort === 'moderate' ? 'bg-yellow-100 text-yellow-600' :
                            'bg-green-100 text-green-600'
                          }`}>
                            {suggestion.effort} effort
                          </span>
                          
                          <span className="text-xs text-gray-500">
                            Category: {suggestion.category}
                          </span>
                        </div>
                        
                        <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                          <div className="flex items-center space-x-1">
                            <TrendingUp className="w-4 h-4" />
                            <span>Performance: +{suggestion.estimatedImprovement.performance}%</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Cpu className="w-4 h-4" />
                            <span>Memory: +{suggestion.estimatedImprovement.memory}%</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Package className="w-4 h-4" />
                            <span>Bundle: +{suggestion.estimatedImprovement.bundle}%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {suggestion.autoFixAvailable && (
                        <button
                          onClick={() => handleAutoFix(suggestion)}
                          className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                        >
                          Auto Fix
                        </button>
                      )}
                      
                      <button
                        onClick={() => actions.dismissSuggestion(suggestion.id)}
                        className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                        title="Dismiss suggestion"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              
              {filteredSuggestions.length === 0 && (
                <div className="text-center py-8">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Suggestions</h3>
                  <p className="text-gray-500">Your application is well optimized!</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Metrics Tab */}
        {activeTab === 'metrics' && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">Performance Metrics</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {state.metrics.map(metric => (
                <div key={metric.id} className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-900">{metric.name}</h4>
                    <span className={`text-sm font-medium ${getMetricStatusColor(metric)}`}>
                      {metric.value.toFixed(1)} {metric.unit}
                    </span>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-green-600">Good: &lt; {metric.threshold.good} {metric.unit}</span>
                      <span className="text-yellow-600">Needs Improvement: &lt; {metric.threshold.needs_improvement} {metric.unit}</span>
                      <span className="text-red-600">Poor: &gt; {metric.threshold.poor} {metric.unit}</span>
                    </div>
                    
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          metric.value <= metric.threshold.good ? 'bg-green-500' :
                          metric.value <= metric.threshold.needs_improvement ? 'bg-yellow-500' :
                          'bg-red-500'
                        }`}
                        style={{
                          width: `${Math.min((metric.value / metric.threshold.poor) * 100, 100)}%`
                        }}
                      />
                    </div>
                    
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      {metric.trend === 'improving' && <TrendingUp className="w-4 h-4 text-green-500" />}
                      {metric.trend === 'degrading' && <TrendingDown className="w-4 h-4 text-red-500" />}
                      {metric.trend === 'stable' && <Minus className="w-4 h-4 text-gray-500" />}
                      <span>Trend: {metric.trend}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Cache Tab */}
        {activeTab === 'cache' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Cache Management</h3>
              <button
                onClick={() => actions.clearCache()}
                className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>Clear All Cache</span>
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {state.config.cacheStrategies.map(strategy => (
                <div key={strategy.id} className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-900">{strategy.name}</h4>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      strategy.enabled ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {strategy.enabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                  
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex justify-between">
                      <span>Type:</span>
                      <span className="font-medium">{strategy.type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>TTL:</span>
                      <span className="font-medium">{(strategy.ttl / 1000).toFixed(0)}s</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Max Size:</span>
                      <span className="font-medium">{strategy.maxSize}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Targets:</span>
                      <span className="font-medium">{strategy.targets.length}</span>
                    </div>
                  </div>
                  
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => actions.clearCache(`${strategy.type}-*`)}
                        className="flex-1 px-3 py-1 bg-red-100 text-red-600 text-sm rounded-lg hover:bg-red-200 transition-colors"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Config Tab */}
        {activeTab === 'config' && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">Configuration</h3>
            
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="space-y-6">
                {/* General Settings */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-4">General Settings</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Monitoring Interval (ms)
                      </label>
                      <input
                        type="number"
                        value={state.config.monitoringInterval}
                        onChange={(e) => actions.updateConfig({ monitoringInterval: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Performance Threshold (ms)
                      </label>
                      <input
                        type="number"
                        value={state.config.performanceThreshold}
                        onChange={(e) => actions.updateConfig({ performanceThreshold: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Memory Threshold (MB)
                      </label>
                      <input
                        type="number"
                        value={state.config.memoryThreshold}
                        onChange={(e) => actions.updateConfig({ memoryThreshold: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Bundle Threshold (bytes)
                      </label>
                      <input
                        type="number"
                        value={state.config.bundleThreshold}
                        onChange={(e) => actions.updateConfig({ bundleThreshold: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
                
                {/* Feature Toggles */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-4">Feature Toggles</h4>
                  <div className="space-y-3">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={state.config.enabled}
                        onChange={(e) => actions.updateConfig({ enabled: e.target.checked })}
                        className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Enable Optimization System</span>
                    </label>
                    
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={state.config.autoApply}
                        onChange={(e) => actions.updateConfig({ autoApply: e.target.checked })}
                        className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Auto-apply Optimizations</span>
                    </label>
                    
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={state.config.lazyLoading.enabled}
                        onChange={(e) => actions.updateConfig({ 
                          lazyLoading: { ...state.config.lazyLoading, enabled: e.target.checked }
                        })}
                        className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Enable Lazy Loading</span>
                    </label>
                    
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={state.config.virtualization.enabled}
                        onChange={(e) => actions.updateConfig({ 
                          virtualization: { ...state.config.virtualization, enabled: e.target.checked }
                        })}
                        className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Enable Virtualization</span>
                    </label>
                    
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={state.config.preloadCritical}
                        onChange={(e) => actions.updateConfig({ preloadCritical: e.target.checked })}
                        className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Preload Critical Resources</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdvancedOptimizationManager;