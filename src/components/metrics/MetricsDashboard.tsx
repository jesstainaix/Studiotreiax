import React, { useState, useEffect, useMemo } from 'react';
import { 
  Activity, AlertTriangle, BarChart3, Clock, Database, 
  Download, Filter, Gauge, LineChart, Monitor, 
  Play, Pause, RefreshCw, Settings, TrendingUp, 
  Users, Zap, AlertCircle, CheckCircle, XCircle,
  Eye, EyeOff, Plus, Trash2, Edit3, Search,
  Calendar, Bell, Shield, Cpu, HardDrive
} from 'lucide-react';
import { useMetrics } from '../../hooks/useMetrics';
import { Metric, Alert, Dashboard } from '../../utils/metricsManager';

const MetricsDashboard: React.FC = () => {
  const {
    metrics,
    alerts,
    dashboards,
    stats,
    isCollecting,
    computed,
    
    // Actions
    startCollection,
    stopCollection,
    createMetric,
    updateMetric,
    deleteMetric,
    acknowledgeAlert,
    resolveAlert,
    quickActions,
    advanced,
    
    // Utilities
    formatValue,
    formatBytes,
    formatDuration,
    getMetricColor,
    getAlertIcon,
    getTrendIcon
  } = useMetrics();
  
  // Local state
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showInactive, setShowInactive] = useState(false);
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([]);
  const [isAutoRefresh, setIsAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30);
  
  // Demo data generation
  useEffect(() => {
    if (metrics.length === 0) {
      // Create demo metrics
      quickActions.createPerformanceMetrics();
      quickActions.createUsageMetrics();
      quickActions.createErrorMetrics();
      
      // Setup default dashboard
      setTimeout(() => {
        quickActions.setupDefaultDashboard();
      }, 1000);
    }
  }, [metrics.length, quickActions]);
  
  // Auto refresh effect
  useEffect(() => {
    if (!isAutoRefresh) return;
    
    const interval = setInterval(() => {
      // Simulate metric updates
      metrics.forEach(metric => {
        if (metric.isActive) {
          const variation = (Math.random() - 0.5) * 0.1;
          const newValue = Math.max(0, metric.currentValue * (1 + variation));
          // recordValue would be called here in real implementation
        }
      });
    }, refreshInterval * 1000);
    
    return () => clearInterval(interval);
  }, [isAutoRefresh, refreshInterval, metrics]);
  
  // Filter and sort metrics
  const filteredMetrics = useMemo(() => {
    const filtered = metrics.filter(metric => {
      const matchesSearch = metric.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           metric.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = filterCategory === 'all' || metric.category === filterCategory;
      const matchesActive = showInactive || metric.isActive;
      
      return matchesSearch && matchesCategory && matchesActive;
    });
    
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'name':
          aValue = a.name;
          bValue = b.name;
          break;
        case 'value':
          aValue = a.currentValue;
          bValue = b.currentValue;
          break;
        case 'category':
          aValue = a.category;
          bValue = b.category;
          break;
        case 'updated':
          aValue = a.updatedAt;
          bValue = b.updatedAt;
          break;
        default:
          aValue = a.name;
          bValue = b.name;
      }
      
      if (typeof aValue === 'string') {
        return sortOrder === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      }
      
      return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
    });
    
    return filtered;
  }, [metrics, searchTerm, filterCategory, showInactive, sortBy, sortOrder]);
  
  // Filter alerts
  const filteredAlerts = useMemo(() => {
    return alerts
      .filter(alert => alert.status === 'active')
      .sort((a, b) => b.triggeredAt - a.triggeredAt);
  }, [alerts]);
  
  // Status cards data
  const statusCards = [
    {
      title: 'Total Metrics',
      value: stats.totalMetrics,
      icon: BarChart3,
      color: 'bg-blue-500',
      change: '+12%'
    },
    {
      title: 'Active Alerts',
      value: computed.criticalAlertsCount,
      icon: AlertTriangle,
      color: computed.criticalAlertsCount > 0 ? 'bg-red-500' : 'bg-green-500',
      change: computed.criticalAlertsCount > 0 ? 'Critical' : 'Healthy'
    },
    {
      title: 'Data Points',
      value: formatBytes(stats.dataPoints * 8), // Approximate bytes
      icon: Database,
      color: 'bg-purple-500',
      change: '+5.2%'
    },
    {
      title: 'System Health',
      value: computed.systemHealth,
      icon: computed.systemHealth === 'healthy' ? CheckCircle : 
            computed.systemHealth === 'warning' ? AlertCircle : XCircle,
      color: computed.systemHealth === 'healthy' ? 'bg-green-500' : 
             computed.systemHealth === 'warning' ? 'bg-yellow-500' : 'bg-red-500',
      change: 'Real-time'
    }
  ];
  
  // Tab configuration
  const tabs = [
    { id: 'overview', label: 'Overview', icon: Monitor },
    { id: 'metrics', label: 'Metrics', icon: LineChart },
    { id: 'alerts', label: 'Alerts', icon: Bell },
    { id: 'dashboards', label: 'Dashboards', icon: BarChart3 },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];
  
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Metrics Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Monitor system performance and analytics in real-time
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={isCollecting ? stopCollection : startCollection}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              isCollecting 
                ? 'bg-red-500 hover:bg-red-600 text-white' 
                : 'bg-green-500 hover:bg-green-600 text-white'
            }`}
          >
            {isCollecting ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            {isCollecting ? 'Stop Collection' : 'Start Collection'}
          </button>
          
          <button
            onClick={() => setIsAutoRefresh(!isAutoRefresh)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              isAutoRefresh 
                ? 'bg-blue-500 hover:bg-blue-600 text-white' 
                : 'bg-gray-500 hover:bg-gray-600 text-white'
            }`}
          >
            <RefreshCw className={`w-4 h-4 ${isAutoRefresh ? 'animate-spin' : ''}`} />
            Auto Refresh
          </button>
        </div>
      </div>
      
      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statusCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{card.title}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {typeof card.value === 'string' ? card.value : card.value.toLocaleString()}
                  </p>
                </div>
                <div className={`${card.color} p-3 rounded-lg`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="mt-4">
                <span className="text-sm text-gray-500">{card.change}</span>
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
                  className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
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
              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-6">
                  <div className="flex items-center gap-3">
                    <Activity className="w-8 h-8 text-blue-600" />
                    <div>
                      <h3 className="font-semibold text-gray-900">Active Metrics</h3>
                      <p className="text-2xl font-bold text-blue-600">{computed.activeMetricsCount}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-6">
                  <div className="flex items-center gap-3">
                    <Gauge className="w-8 h-8 text-green-600" />
                    <div>
                      <h3 className="font-semibold text-gray-900">Avg Response</h3>
                      <p className="text-2xl font-bold text-green-600">
                        {formatDuration(computed.averageResponseTime)}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-6">
                  <div className="flex items-center gap-3">
                    <Users className="w-8 h-8 text-purple-600" />
                    <div>
                      <h3 className="font-semibold text-gray-900">Error Rate</h3>
                      <p className="text-2xl font-bold text-purple-600">
                        {computed.errorRate.toFixed(2)}%
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Recent Alerts */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Alerts</h3>
                <div className="space-y-3">
                  {computed.recentAlerts.slice(0, 5).map((alert) => (
                    <div key={alert.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{getAlertIcon(alert.type)}</span>
                        <div>
                          <h4 className="font-medium text-gray-900">{alert.title}</h4>
                          <p className="text-sm text-gray-600">{alert.message}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">
                          {new Date(alert.triggeredAt).toLocaleTimeString()}
                        </span>
                        <button
                          onClick={() => acknowledgeAlert(alert.id, 'user')}
                          className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 transition-colors"
                        >
                          Acknowledge
                        </button>
                      </div>
                    </div>
                  ))}
                  
                  {computed.recentAlerts.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <Shield className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p>No recent alerts</p>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Top Metrics */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Metrics</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {computed.topMetrics.map((metric) => (
                    <div key={metric.id} className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900">{metric.name}</h4>
                        <span className="text-lg">{getTrendIcon(metric.trend)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className={`text-2xl font-bold ${getMetricColor(metric)}`}>
                          {formatValue(metric.currentValue, metric.unit)}
                        </span>
                        <span className="text-sm text-gray-500 capitalize">
                          {metric.category}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          
          {/* Metrics Tab */}
          {activeTab === 'metrics' && (
            <div className="space-y-6">
              {/* Controls */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
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
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Categories</option>
                  <option value="performance">Performance</option>
                  <option value="usage">Usage</option>
                  <option value="error">Error</option>
                  <option value="business">Business</option>
                  <option value="system">System</option>
                </select>
                
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="name">Sort by Name</option>
                  <option value="value">Sort by Value</option>
                  <option value="category">Sort by Category</option>
                  <option value="updated">Sort by Updated</option>
                </select>
                
                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {sortOrder === 'asc' ? '↑' : '↓'}
                </button>
                
                <button
                  onClick={() => setShowInactive(!showInactive)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    showInactive ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {showInactive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  Show Inactive
                </button>
              </div>
              
              {/* Metrics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredMetrics.map((metric) => (
                  <div key={metric.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{metric.name}</h3>
                        <p className="text-sm text-gray-600 mt-1">{metric.description}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{getTrendIcon(metric.trend)}</span>
                        <div className={`w-3 h-3 rounded-full ${
                          metric.isActive ? 'bg-green-500' : 'bg-gray-300'
                        }`} />
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Current Value</span>
                        <span className={`text-lg font-bold ${getMetricColor(metric)}`}>
                          {formatValue(metric.currentValue, metric.unit)}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Category</span>
                        <span className="text-sm font-medium capitalize text-gray-900">
                          {metric.category}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Type</span>
                        <span className="text-sm font-medium capitalize text-gray-900">
                          {metric.type}
                        </span>
                      </div>
                      
                      {metric.threshold && (
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Warning</span>
                            <span className="text-sm text-yellow-600">
                              {formatValue(metric.threshold.warning, metric.unit)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Critical</span>
                            <span className="text-sm text-red-600">
                              {formatValue(metric.threshold.critical, metric.unit)}
                            </span>
                          </div>
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                        <span className="text-xs text-gray-500">
                          Updated {new Date(metric.updatedAt).toLocaleTimeString()}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => updateMetric(metric.id, { isActive: !metric.isActive })}
                            className="p-1 text-gray-400 hover:text-blue-500 transition-colors"
                          >
                            {metric.isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => deleteMetric(metric.id)}
                            className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {filteredMetrics.length === 0 && (
                <div className="text-center py-12">
                  <BarChart3 className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No metrics found</h3>
                  <p className="text-gray-600 mb-4">Try adjusting your search or filters</p>
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setFilterCategory('all');
                      setShowInactive(true);
                    }}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    Clear Filters
                  </button>
                </div>
              )}
            </div>
          )}
          
          {/* Alerts Tab */}
          {activeTab === 'alerts' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Active Alerts</h3>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    computed.systemHealth === 'healthy' ? 'bg-green-100 text-green-800' :
                    computed.systemHealth === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    System {computed.systemHealth}
                  </span>
                </div>
              </div>
              
              <div className="space-y-4">
                {filteredAlerts.map((alert) => (
                  <div key={alert.id} className={`border rounded-lg p-6 ${
                    alert.type === 'critical' ? 'border-red-200 bg-red-50' :
                    alert.type === 'warning' ? 'border-yellow-200 bg-yellow-50' :
                    'border-blue-200 bg-blue-50'
                  }`}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <span className="text-3xl">{getAlertIcon(alert.type)}</span>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">{alert.title}</h4>
                          <p className="text-gray-700 mt-1">{alert.message}</p>
                          <div className="flex items-center gap-4 mt-3 text-sm text-gray-600">
                            <span>Severity: {alert.severity}</span>
                            <span>•</span>
                            <span>Triggered: {new Date(alert.triggeredAt).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {alert.status === 'active' && (
                          <>
                            <button
                              onClick={() => acknowledgeAlert(alert.id, 'user')}
                              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                            >
                              Acknowledge
                            </button>
                            <button
                              onClick={() => resolveAlert(alert.id, 'user')}
                              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                            >
                              Resolve
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                
                {filteredAlerts.length === 0 && (
                  <div className="text-center py-12">
                    <CheckCircle className="w-16 h-16 mx-auto text-green-500 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No active alerts</h3>
                    <p className="text-gray-600">Your system is running smoothly</p>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Configuration</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Collection Settings</h4>
                  
                  <div className="space-y-3">
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={isAutoRefresh}
                        onChange={(e) => setIsAutoRefresh(e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">Enable auto refresh</span>
                    </label>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Refresh Interval (seconds)
                      </label>
                      <input
                        type="number"
                        min="5"
                        max="300"
                        value={refreshInterval}
                        onChange={(e) => setRefreshInterval(Number(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Quick Actions</h4>
                  
                  <div className="space-y-2">
                    <button
                      onClick={quickActions.createPerformanceMetrics}
                      className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      Create Performance Metrics
                    </button>
                    
                    <button
                      onClick={quickActions.setupDefaultDashboard}
                      className="w-full px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                    >
                      Setup Default Dashboard
                    </button>
                    
                    <button
                      onClick={quickActions.enableAllAlerts}
                      className="w-full px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
                    >
                      Enable All Alerts
                    </button>
                    
                    <button
                      onClick={quickActions.optimizeAll}
                      className="w-full px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
                    >
                      Optimize Storage
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Other tabs would be implemented similarly */}
          {activeTab === 'dashboards' && (
            <div className="text-center py-12">
              <BarChart3 className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Dashboards</h3>
              <p className="text-gray-600">Dashboard management coming soon</p>
            </div>
          )}
          
          {activeTab === 'analytics' && (
            <div className="text-center py-12">
              <TrendingUp className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Analytics</h3>
              <p className="text-gray-600">Advanced analytics coming soon</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MetricsDashboard;