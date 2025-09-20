import React, { useState, useEffect } from 'react';
import { 
  Activity, Settings, TrendingUp, AlertTriangle, CheckCircle, 
  XCircle, Play, Square, Download, Upload, Trash2, Plus,
  BarChart3, Zap, Clock, Target, Gauge, Cpu, HardDrive,
  Network, Eye, Filter, Search, RefreshCw, Bell
} from 'lucide-react';
import usePerformanceOptimization from '../../hooks/usePerformanceOptimization';
import type { 
  PerformanceMetric, OptimizationRule, PerformanceBudget, 
  PerformanceAlert, OptimizationConfig 
} from '../../hooks/usePerformanceOptimization';

const PerformanceOptimizationManager: React.FC = () => {
  const {
    isOptimizing,
    isAnalyzing,
    metrics,
    rules,
    actions: actionsList,
    results,
    bundleAnalysis,
    budgets,
    config,
    error,
    progress,
    lastOptimization,
    recommendations,
    alerts,
    actions
  } = usePerformanceOptimization();

  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showRuleModal, setShowRuleModal] = useState(false);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedRule, setSelectedRule] = useState<OptimizationRule | null>(null);
  const [selectedBudget, setSelectedBudget] = useState<PerformanceBudget | null>(null);
  const [importData, setImportData] = useState('');

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      // Trigger refresh if needed
    }, 5000);
    
    return () => clearInterval(interval);
  }, [autoRefresh]);

  // Filter functions
  const filteredMetrics = metrics.filter(metric => {
    const matchesSearch = metric.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || metric.category === filterCategory;
    const matchesStatus = filterStatus === 'all' || metric.status === filterStatus;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const filteredRules = rules.filter(rule => {
    const matchesSearch = rule.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || rule.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const filteredAlerts = alerts.filter(alert => {
    const matchesSearch = alert.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || 
      (filterStatus === 'acknowledged' && alert.acknowledged) ||
      (filterStatus === 'unacknowledged' && !alert.acknowledged);
    return matchesSearch && matchesStatus;
  });

  // Helper functions
  const getMetricIcon = (category: string) => {
    switch (category) {
      case 'loading': return Clock;
      case 'runtime': return Cpu;
      case 'memory': return HardDrive;
      case 'network': return Network;
      case 'rendering': return Eye;
      default: return Activity;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'good': return 'bg-green-100';
      case 'warning': return 'bg-yellow-100';
      case 'critical': return 'bg-red-100';
      default: return 'bg-gray-100';
    }
  };

  const formatValue = (value: number, unit: string) => {
    if (unit === 'ms') {
      return value < 1000 ? `${value.toFixed(0)}ms` : `${(value / 1000).toFixed(1)}s`;
    }
    if (unit === 'bytes') {
      if (value < 1024) return `${value}B`;
      if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)}KB`;
      return `${(value / (1024 * 1024)).toFixed(1)}MB`;
    }
    return `${value.toFixed(1)}${unit}`;
  };

  const getTrendIcon = (trend: number) => {
    if (trend > 5) return <TrendingUp className="w-4 h-4 text-red-500" />;
    if (trend < -5) return <TrendingUp className="w-4 h-4 text-green-500 rotate-180" />;
    return <div className="w-4 h-4" />;
  };

  // Render functions
  const renderStatusBar = () => (
    <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${
              isOptimizing ? 'bg-blue-500 animate-pulse' : 
              error ? 'bg-red-500' : 'bg-green-500'
            }`} />
            <span className="text-sm font-medium">
              {isOptimizing ? 'Optimizing...' : error ? 'Error' : 'Ready'}
            </span>
          </div>
          
          <div className="text-sm text-gray-600">
            Metrics: <span className="font-medium">{metrics.length}</span>
          </div>
          
          <div className="text-sm text-gray-600">
            Rules: <span className="font-medium">{rules.filter(r => r.enabled).length}/{rules.length}</span>
          </div>
          
          <div className="text-sm text-gray-600">
            Alerts: <span className="font-medium text-red-600">{alerts.filter(a => !a.acknowledged).length}</span>
          </div>
          
          {lastOptimization && (
            <div className="text-sm text-gray-600">
              Last: <span className="font-medium">{lastOptimization.toLocaleTimeString()}</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`p-2 rounded-lg border ${
              autoRefresh ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-gray-50 border-gray-200 text-gray-600'
            }`}
            title="Auto Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${autoRefresh ? 'animate-spin' : ''}`} />
          </button>
          
          {isOptimizing ? (
            <button
              onClick={actions.stopOptimization}
              className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              <Square className="w-4 h-4" />
              <span>Stop</span>
            </button>
          ) : (
            <button
              onClick={actions.startOptimization}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Play className="w-4 h-4" />
              <span>Start Optimization</span>
            </button>
          )}
        </div>
      </div>
      
      {isOptimizing && (
        <div className="mt-4">
          <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
            <span>Optimization Progress</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
      
      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            <span className="text-sm text-red-800">{error}</span>
          </div>
        </div>
      )}
    </div>
  );

  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {['loading', 'runtime', 'memory', 'network'].map(category => {
          const categoryMetrics = metrics.filter(m => m.category === category);
          const avgValue = categoryMetrics.length > 0 
            ? categoryMetrics.reduce((sum, m) => sum + m.value, 0) / categoryMetrics.length 
            : 0;
          const criticalCount = categoryMetrics.filter(m => m.status === 'critical').length;
          const Icon = getMetricIcon(category);
          
          return (
            <div key={category} className="bg-white rounded-lg shadow-sm border p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 capitalize">{category}</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatValue(avgValue, category === 'memory' ? '%' : 'ms')}
                  </p>
                </div>
                <Icon className="w-8 h-8 text-gray-400" />
              </div>
              {criticalCount > 0 && (
                <div className="mt-2 flex items-center space-x-1">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                  <span className="text-sm text-red-600">{criticalCount} critical</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {/* Recent Metrics */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-4 border-b">
          <h3 className="text-lg font-semibold">Recent Performance Metrics</h3>
        </div>
        <div className="p-4">
          <div className="space-y-3">
            {metrics.slice(0, 10).map(metric => {
              const Icon = getMetricIcon(metric.category);
              return (
                <div key={metric.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Icon className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="font-medium">{metric.name}</p>
                      <p className="text-sm text-gray-600">{metric.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    {getTrendIcon(metric.trend)}
                    <div className="text-right">
                      <p className={`font-medium ${getStatusColor(metric.status)}`}>
                        {formatValue(metric.value, metric.unit)}
                      </p>
                      <p className="text-sm text-gray-500">
                        Threshold: {formatValue(metric.threshold, metric.unit)}
                      </p>
                    </div>
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                      getStatusBg(metric.status)
                    } ${getStatusColor(metric.status)}`}>
                      {metric.status}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      
      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-4 border-b">
            <h3 className="text-lg font-semibold">Optimization Recommendations</h3>
          </div>
          <div className="p-4">
            <div className="space-y-2">
              {recommendations.map((rec, index) => (
                <div key={index} className="flex items-center space-x-2 p-2 bg-blue-50 rounded-lg">
                  <Zap className="w-4 h-4 text-blue-600" />
                  <span className="text-sm text-blue-800">{rec}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderMetrics = () => (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search metrics..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Categories</option>
            <option value="loading">Loading</option>
            <option value="runtime">Runtime</option>
            <option value="memory">Memory</option>
            <option value="network">Network</option>
            <option value="rendering">Rendering</option>
          </select>
          
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="good">Good</option>
            <option value="warning">Warning</option>
            <option value="critical">Critical</option>
          </select>
        </div>
      </div>
      
      {/* Metrics List */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-4 border-b">
          <h3 className="text-lg font-semibold">Performance Metrics ({filteredMetrics.length})</h3>
        </div>
        <div className="divide-y">
          {filteredMetrics.map(metric => {
            const Icon = getMetricIcon(metric.category);
            return (
              <div key={metric.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Icon className="w-5 h-5 text-gray-400" />
                    <div>
                      <h4 className="font-medium">{metric.name}</h4>
                      <p className="text-sm text-gray-600">{metric.description}</p>
                      <div className="flex items-center space-x-4 mt-1">
                        <span className="text-xs text-gray-500 capitalize">{metric.category}</span>
                        <span className="text-xs text-gray-500 capitalize">{metric.impact} impact</span>
                        <span className="text-xs text-gray-500">
                          {metric.timestamp.toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    {getTrendIcon(metric.trend)}
                    <div className="text-right">
                      <p className={`text-lg font-bold ${getStatusColor(metric.status)}`}>
                        {formatValue(metric.value, metric.unit)}
                      </p>
                      <p className="text-sm text-gray-500">
                        Threshold: {formatValue(metric.threshold, metric.unit)}
                      </p>
                      {metric.trend !== 0 && (
                        <p className={`text-xs ${
                          metric.trend > 0 ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {metric.trend > 0 ? '+' : ''}{metric.trend.toFixed(1)}%
                        </p>
                      )}
                    </div>
                    
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                      getStatusBg(metric.status)
                    } ${getStatusColor(metric.status)}`}>
                      {metric.status}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  const renderRules = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Optimization Rules</h2>
        <button
          onClick={() => {
            setSelectedRule(null);
            setShowRuleModal(true);
          }}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          <span>Add Rule</span>
        </button>
      </div>
      
      {/* Rules List */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="divide-y">
          {filteredRules.map(rule => (
            <div key={rule.id} className="p-4 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${
                    rule.enabled ? 'bg-green-500' : 'bg-gray-300'
                  }`} />
                  <div>
                    <h4 className="font-medium">{rule.name}</h4>
                    <p className="text-sm text-gray-600">{rule.description}</p>
                    <div className="flex items-center space-x-4 mt-1">
                      <span className="text-xs text-gray-500 capitalize">{rule.category}</span>
                      <span className="text-xs text-gray-500 capitalize">{rule.priority} priority</span>
                      <span className="text-xs text-gray-500">{rule.impact}% impact</span>
                      <span className="text-xs text-gray-500 capitalize">{rule.effort} effort</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => actions.updateRule(rule.id, { enabled: !rule.enabled })}
                    className={`px-3 py-1 rounded-lg text-sm font-medium ${
                      rule.enabled 
                        ? 'bg-green-100 text-green-800 hover:bg-green-200'
                        : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                    }`}
                  >
                    {rule.enabled ? 'Enabled' : 'Disabled'}
                  </button>
                  
                  <button
                    onClick={() => {
                      setSelectedRule(rule);
                      setShowRuleModal(true);
                    }}
                    className="p-2 text-gray-400 hover:text-gray-600"
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                  
                  <button
                    onClick={() => actions.deleteRule(rule.id)}
                    className="p-2 text-gray-400 hover:text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderBudgets = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Performance Budgets</h2>
        <button
          onClick={() => {
            setSelectedBudget(null);
            setShowBudgetModal(true);
          }}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          <span>Add Budget</span>
        </button>
      </div>
      
      {/* Budgets List */}
      <div className="space-y-4">
        {budgets.map(budget => (
          <div key={budget.id} className="bg-white rounded-lg shadow-sm border">
            <div className="p-4 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${
                    budget.enabled ? 'bg-green-500' : 'bg-gray-300'
                  }`} />
                  <div>
                    <h4 className="font-medium">{budget.name}</h4>
                    <div className="flex items-center space-x-4 mt-1">
                      <span className="text-xs text-gray-500">
                        {budget.violations.length} violations
                      </span>
                      <span className="text-xs text-gray-500">
                        Last check: {budget.lastCheck.toLocaleTimeString()}
                      </span>
                      {budget.strict && (
                        <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                          Strict
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => actions.updateBudget(budget.id, { enabled: !budget.enabled })}
                    className={`px-3 py-1 rounded-lg text-sm font-medium ${
                      budget.enabled 
                        ? 'bg-green-100 text-green-800 hover:bg-green-200'
                        : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                    }`}
                  >
                    {budget.enabled ? 'Enabled' : 'Disabled'}
                  </button>
                  
                  <button
                    onClick={() => {
                      setSelectedBudget(budget);
                      setShowBudgetModal(true);
                    }}
                    className="p-2 text-gray-400 hover:text-gray-600"
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                  
                  <button
                    onClick={() => actions.deleteBudget(budget.id)}
                    className="p-2 text-gray-400 hover:text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
            
            <div className="p-4">
              <div className="space-y-3">
                {budget.metrics.map(metric => (
                  <div key={metric.name} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{metric.name}</p>
                      <p className="text-sm text-gray-600">
                        Limit: {formatValue(metric.limit, metric.unit)}
                      </p>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <div className="text-right">
                        <p className={`font-medium ${
                          metric.status === 'exceeded' ? 'text-red-600' :
                          metric.status === 'warning' ? 'text-yellow-600' : 'text-green-600'
                        }`}>
                          {formatValue(metric.current, metric.unit)}
                        </p>
                        <p className="text-sm text-gray-500">
                          {((metric.current / metric.limit) * 100).toFixed(1)}% of limit
                        </p>
                      </div>
                      
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                        metric.status === 'exceeded' ? 'bg-red-100 text-red-800' :
                        metric.status === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {metric.status}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderAlerts = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Performance Alerts</h2>
        <button
          onClick={actions.clearAlerts}
          className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          <Trash2 className="w-4 h-4" />
          <span>Clear All</span>
        </button>
      </div>
      
      {/* Alerts List */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="divide-y">
          {filteredAlerts.map(alert => (
            <div key={alert.id} className={`p-4 hover:bg-gray-50 ${
              !alert.acknowledged ? 'bg-yellow-50' : ''
            }`}>
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <div className={`mt-1 w-2 h-2 rounded-full ${
                    alert.severity === 'critical' ? 'bg-red-500' :
                    alert.severity === 'error' ? 'bg-red-400' :
                    alert.severity === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
                  }`} />
                  <div>
                    <h4 className="font-medium">{alert.title}</h4>
                    <p className="text-sm text-gray-600 mt-1">{alert.message}</p>
                    <div className="flex items-center space-x-4 mt-2">
                      <span className="text-xs text-gray-500 capitalize">{alert.type}</span>
                      <span className="text-xs text-gray-500 capitalize">{alert.severity}</span>
                      <span className="text-xs text-gray-500">
                        {alert.timestamp.toLocaleString()}
                      </span>
                    </div>
                    {alert.actions.length > 0 && (
                      <div className="flex items-center space-x-2 mt-2">
                        {alert.actions.map((action, index) => (
                          <button
                            key={index}
                            className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded hover:bg-blue-200"
                          >
                            {action}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {!alert.acknowledged && (
                    <button
                      onClick={() => actions.acknowledgeAlert(alert.id)}
                      className="flex items-center space-x-1 px-3 py-1 bg-green-100 text-green-800 rounded-lg hover:bg-green-200"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>Acknowledge</span>
                    </button>
                  )}
                  
                  {alert.acknowledged && (
                    <div className="flex items-center space-x-1 text-green-600">
                      <CheckCircle className="w-4 h-4" />
                      <span className="text-sm">Acknowledged</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold mb-4">Configuration</h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="font-medium">Enable Performance Optimization</label>
              <p className="text-sm text-gray-600">Automatically monitor and optimize performance</p>
            </div>
            <input
              type="checkbox"
              checked={config.enabled}
              onChange={(e) => actions.updateConfig({ enabled: e.target.checked })}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <label className="font-medium">Auto Optimization</label>
              <p className="text-sm text-gray-600">Automatically apply optimization rules</p>
            </div>
            <input
              type="checkbox"
              checked={config.autoOptimization}
              onChange={(e) => actions.updateConfig({ autoOptimization: e.target.checked })}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <label className="font-medium">Budget Checking</label>
              <p className="text-sm text-gray-600">Monitor performance budgets</p>
            </div>
            <input
              type="checkbox"
              checked={config.budgetChecking}
              onChange={(e) => actions.updateConfig({ budgetChecking: e.target.checked })}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block font-medium mb-2">Monitoring Interval (ms)</label>
            <input
              type="number"
              value={config.monitoringInterval}
              onChange={(e) => actions.updateConfig({ monitoringInterval: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              min="1000"
              step="1000"
            />
          </div>
        </div>
        
        <div className="mt-6 pt-6 border-t">
          <h4 className="font-medium mb-4">Alert Thresholds</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Loading (ms)</label>
              <input
                type="number"
                value={config.alertThresholds.loading}
                onChange={(e) => actions.updateConfig({
                  alertThresholds: {
                    ...config.alertThresholds,
                    loading: parseInt(e.target.value)
                  }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Memory (%)</label>
              <input
                type="number"
                value={config.alertThresholds.memory}
                onChange={(e) => actions.updateConfig({
                  alertThresholds: {
                    ...config.alertThresholds,
                    memory: parseInt(e.target.value)
                  }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">CPU (%)</label>
              <input
                type="number"
                value={config.alertThresholds.cpu}
                onChange={(e) => actions.updateConfig({
                  alertThresholds: {
                    ...config.alertThresholds,
                    cpu: parseInt(e.target.value)
                  }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Network (ms)</label>
              <input
                type="number"
                value={config.alertThresholds.network}
                onChange={(e) => actions.updateConfig({
                  alertThresholds: {
                    ...config.alertThresholds,
                    network: parseInt(e.target.value)
                  }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
        
        <div className="mt-6 pt-6 border-t">
          <h4 className="font-medium mb-4">Data Management</h4>
          <div className="flex space-x-4">
            <button
              onClick={() => {
                const data = actions.exportData();
                const blob = new Blob([data], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'performance-optimization-data.json';
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Download className="w-4 h-4" />
              <span>Export Data</span>
            </button>
            
            <button
              onClick={() => setShowImportModal(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <Upload className="w-4 h-4" />
              <span>Import Data</span>
            </button>
            
            <button
              onClick={actions.clearResults}
              className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              <Trash2 className="w-4 h-4" />
              <span>Clear Results</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Import Modal
  const ImportModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold mb-4">Import Data</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">JSON Data</label>
            <textarea
              value={importData}
              onChange={(e) => setImportData(e.target.value)}
              className="w-full h-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Paste your JSON data here..."
            />
          </div>
        </div>
        
        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={() => {
              setShowImportModal(false);
              setImportData('');
            }}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              actions.importData(importData);
              setShowImportModal(false);
              setImportData('');
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Import
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-2">
            <Gauge className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Performance Optimization</h1>
          </div>
          <p className="text-gray-600">Monitor, analyze, and optimize application performance</p>
        </div>

        {/* Status Bar */}
        {renderStatusBar()}

        {/* Navigation */}
        <div className="bg-white rounded-lg shadow-sm border mb-6">
          <div className="flex space-x-1 p-1">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
              { id: 'metrics', label: 'Metrics', icon: Activity },
              { id: 'rules', label: 'Rules', icon: Target },
              { id: 'budgets', label: 'Budgets', icon: Gauge },
              { id: 'alerts', label: 'Alerts', icon: Bell },
              { id: 'settings', label: 'Settings', icon: Settings }
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                  {tab.id === 'alerts' && alerts.filter(a => !a.acknowledged).length > 0 && (
                    <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-[1.25rem] h-5 flex items-center justify-center">
                      {alerts.filter(a => !a.acknowledged).length}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="space-y-6">
          {activeTab === 'dashboard' && renderDashboard()}
          {activeTab === 'metrics' && renderMetrics()}
          {activeTab === 'rules' && renderRules()}
          {activeTab === 'budgets' && renderBudgets()}
          {activeTab === 'alerts' && renderAlerts()}
          {activeTab === 'settings' && renderSettings()}
        </div>

        {/* Modals */}
        {showImportModal && <ImportModal />}
      </div>
    </div>
  );
};

export default PerformanceOptimizationManager;