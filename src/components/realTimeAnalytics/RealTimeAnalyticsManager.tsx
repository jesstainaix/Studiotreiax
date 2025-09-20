import React, { useState, useEffect, useMemo } from 'react';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Bell,
  CheckCircle,
  Clock,
  Database,
  Download,
  Eye,
  Filter,
  LineChart,
  Monitor,
  Play,
  Pause,
  Plus,
  RefreshCw,
  Search,
  Settings,
  TrendingUp,
  TrendingDown,
  Users,
  X,
  Zap
} from 'lucide-react';
import { useRealTimeAnalytics } from '../../hooks/useRealTimeAnalytics';
import {
  AnalyticsMetric,
  AnalyticsAlert,
  AnalyticsDashboard,
  AnalyticsEvent,
  formatBytes,
  formatDuration,
  getMetricCategoryColor,
  getAlertTypeColor,
  getTrendIcon,
  getEventSeverityColor
} from '../../utils/realTimeAnalytics';

const RealTimeAnalyticsManager: React.FC = () => {
  const {
    metrics,
    alerts,
    dashboards,
    events,
    isLoading,
    error,
    actions,
    quickActions,
    advanced,
    system,
    utils,
    config,
    analytics,
    debug,
    computed
  } = useRealTimeAnalytics();
  
  // Local state
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('timestamp');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedMetric, setSelectedMetric] = useState<AnalyticsMetric | null>(null);
  const [selectedAlert, setSelectedAlert] = useState<AnalyticsAlert | null>(null);
  const [selectedDashboard, setSelectedDashboard] = useState<AnalyticsDashboard | null>(null);
  const [showMetricModal, setShowMetricModal] = useState(false);
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [showDashboardModal, setShowDashboardModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  
  // Auto-refresh effect
  useEffect(() => {
    const interval = setInterval(() => {
      if (config.current.enableAutoRefresh) {
        analytics.refresh();
      }
    }, config.current.refreshInterval);
    
    return () => clearInterval(interval);
  }, [config.current.enableAutoRefresh, config.current.refreshInterval, analytics.refresh]);
  
  // Generate demo data effect
  useEffect(() => {
    if (metrics.length === 0) {
      quickActions.generateSampleData();
    }
  }, []);
  
  // Filter and sort functions
  const filteredMetrics = useMemo(() => {
    return metrics
      .filter(metric => {
        const matchesSearch = metric.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = filterCategory === 'all' || metric.category === filterCategory;
        return matchesSearch && matchesCategory;
      })
      .sort((a, b) => {
        const aValue = a[sortBy as keyof AnalyticsMetric];
        const bValue = b[sortBy as keyof AnalyticsMetric];
        const comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
        return sortOrder === 'asc' ? comparison : -comparison;
      });
  }, [metrics, searchTerm, filterCategory, sortBy, sortOrder]);
  
  const filteredAlerts = useMemo(() => {
    return alerts
      .filter(alert => {
        const matchesSearch = alert.title.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = filterType === 'all' || alert.type === filterType;
        return matchesSearch && matchesType;
      })
      .sort((a, b) => {
        const comparison = a.timestamp - b.timestamp;
        return sortOrder === 'asc' ? comparison : -comparison;
      });
  }, [alerts, searchTerm, filterType, sortOrder]);
  
  // Status cards data
  const statusCards = [
    {
      title: 'Total Metrics',
      value: computed.totalMetrics,
      icon: BarChart3,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      change: '+12%',
      trend: 'up'
    },
    {
      title: 'Active Alerts',
      value: computed.activeAlerts,
      icon: AlertTriangle,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      change: '-5%',
      trend: 'down'
    },
    {
      title: 'Dashboards',
      value: computed.totalDashboards,
      icon: Monitor,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      change: '+3%',
      trend: 'up'
    },
    {
      title: 'System Health',
      value: computed.isHealthy ? 'Healthy' : 'Issues',
      icon: computed.isHealthy ? CheckCircle : AlertTriangle,
      color: computed.isHealthy ? 'text-green-600' : 'text-red-600',
      bgColor: computed.isHealthy ? 'bg-green-50' : 'bg-red-50',
      change: computed.isHealthy ? 'Good' : 'Alert',
      trend: computed.isHealthy ? 'up' : 'down'
    }
  ];
  
  // Tab configuration
  const tabs = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'metrics', label: 'Metrics', icon: BarChart3 },
    { id: 'alerts', label: 'Alerts', icon: Bell },
    { id: 'dashboards', label: 'Dashboards', icon: Monitor },
    { id: 'events', label: 'Events', icon: Clock },
    { id: 'performance', label: 'Performance', icon: TrendingUp },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'debug', label: 'Debug', icon: Zap }
  ];
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading analytics...</span>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Real-Time Analytics</h1>
          <p className="text-gray-600">Monitor metrics, alerts, and system performance</p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => analytics.refresh()}
            className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </button>
          <button
            onClick={() => config.current.enableRealTime ? system.stopRealTimeUpdates() : system.startRealTimeUpdates()}
            className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
              config.current.enableRealTime
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            {config.current.enableRealTime ? (
              <><Pause className="w-4 h-4 mr-2" />Stop</>
            ) : (
              <><Play className="w-4 h-4 mr-2" />Start</>
            )}
          </button>
        </div>
      </div>
      
      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
            <span className="text-red-800">{error}</span>
            <button
              onClick={() => setShowErrorModal(true)}
              className="ml-auto text-red-600 hover:text-red-800"
            >
              <Eye className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
      
      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statusCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{card.title}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{card.value}</p>
                </div>
                <div className={`p-3 rounded-lg ${card.bgColor}`}>
                  <Icon className={`w-6 h-6 ${card.color}`} />
                </div>
              </div>
              <div className="flex items-center mt-4">
                <span className={`text-sm font-medium ${
                  card.trend === 'up' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {card.change}
                </span>
                <span className="text-sm text-gray-600 ml-2">vs last period</span>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4 mr-2" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>
      
      {/* Tab Content */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Alerts */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Alerts</h3>
                <div className="space-y-3">
                  {computed.recentEvents.slice(0, 5).map((event) => (
                    <div key={event.id} className="flex items-center p-3 bg-gray-50 rounded-lg">
                      <div className={`w-2 h-2 rounded-full mr-3 ${getEventSeverityColor(event.severity)}`}></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{event.type.replace('_', ' ')}</p>
                        <p className="text-xs text-gray-600">{utils.formatDuration(Date.now() - event.timestamp)} ago</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Performance Overview */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Overview</h3>
                <div className="space-y-3">
                  {computed.performanceMetrics.slice(0, 5).map((metric) => (
                    <div key={metric.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <span className="text-2xl mr-2">{getTrendIcon(metric.trend)}</span>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{metric.name}</p>
                          <p className="text-xs text-gray-600">{metric.category}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-gray-900">{metric.value}{metric.unit}</p>
                        <p className={`text-xs ${
                          metric.trend === 'up' ? 'text-green-600' : 
                          metric.trend === 'down' ? 'text-red-600' : 'text-gray-600'
                        }`}>
                          {metric.change > 0 ? '+' : ''}{metric.change}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Quick Actions */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <button
                  onClick={quickActions.createPerformanceDashboard}
                  className="flex flex-col items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <Monitor className="w-8 h-8 text-blue-600 mb-2" />
                  <span className="text-sm font-medium text-blue-900">Performance Dashboard</span>
                </button>
                <button
                  onClick={quickActions.createUserDashboard}
                  className="flex flex-col items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
                >
                  <Users className="w-8 h-8 text-green-600 mb-2" />
                  <span className="text-sm font-medium text-green-900">User Dashboard</span>
                </button>
                <button
                  onClick={quickActions.createSystemDashboard}
                  className="flex flex-col items-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
                >
                  <Database className="w-8 h-8 text-purple-600 mb-2" />
                  <span className="text-sm font-medium text-purple-900">System Dashboard</span>
                </button>
                <button
                  onClick={quickActions.setupDefaultAlerts}
                  className="flex flex-col items-center p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors"
                >
                  <Bell className="w-8 h-8 text-orange-600 mb-2" />
                  <span className="text-sm font-medium text-orange-900">Setup Alerts</span>
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Metrics Tab */}
        {activeTab === 'metrics' && (
          <div className="p-6">
            {/* Filters */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search metrics..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Categories</option>
                  <option value="performance">Performance</option>
                  <option value="user">User</option>
                  <option value="system">System</option>
                  <option value="business">Business</option>
                </select>
              </div>
              <button
                onClick={() => setShowMetricModal(true)}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Metric
              </button>
            </div>
            
            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredMetrics.map((metric) => (
                <div key={metric.id} className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors cursor-pointer"
                     onClick={() => { setSelectedMetric(metric); setShowMetricModal(true); }}>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className={`font-medium ${getMetricCategoryColor(metric.category)}`}>{metric.name}</h4>
                    <span className="text-2xl">{getTrendIcon(metric.trend)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-gray-900">{metric.value}{metric.unit}</span>
                    <div className="text-right">
                      <p className="text-xs text-gray-600 capitalize">{metric.category}</p>
                      <p className={`text-xs ${
                        metric.trend === 'up' ? 'text-green-600' : 
                        metric.trend === 'down' ? 'text-red-600' : 'text-gray-600'
                      }`}>
                        {metric.change > 0 ? '+' : ''}{metric.change}%
                      </p>
                    </div>
                  </div>
                  {metric.threshold && (
                    <div className="mt-2">
                      <div className="flex justify-between text-xs text-gray-600 mb-1">
                        <span>Warning: {metric.threshold.warning}{metric.unit}</span>
                        <span>Critical: {metric.threshold.critical}{metric.unit}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            metric.value >= metric.threshold.critical ? 'bg-red-500' :
                            metric.value >= metric.threshold.warning ? 'bg-orange-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${Math.min((metric.value / metric.threshold.critical) * 100, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Alerts Tab */}
        {activeTab === 'alerts' && (
          <div className="p-6">
            {/* Filters */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search alerts..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Types</option>
                  <option value="critical">Critical</option>
                  <option value="warning">Warning</option>
                  <option value="info">Info</option>
                </select>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">
                  {computed.unreadAlerts} unread, {computed.activeAlerts} active
                </span>
              </div>
            </div>
            
            {/* Alerts List */}
            <div className="space-y-4">
              {filteredAlerts.map((alert) => (
                <div key={alert.id} className={`border rounded-lg p-4 ${
                  alert.isRead ? 'bg-gray-50' : 'bg-white border-l-4'
                } ${
                  alert.type === 'critical' ? 'border-l-red-500' :
                  alert.type === 'warning' ? 'border-l-orange-500' : 'border-l-blue-500'
                }`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="font-medium text-gray-900">{alert.title}</h4>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          alert.type === 'critical' ? 'bg-red-100 text-red-800' :
                          alert.type === 'warning' ? 'bg-orange-100 text-orange-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {alert.type}
                        </span>
                        {!alert.isRead && (
                          <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{alert.message}</p>
                      <p className="text-xs text-gray-500">
                        {utils.formatDuration(Date.now() - alert.timestamp)} ago
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      {!alert.isRead && (
                        <button
                          onClick={() => actions.markAlertAsRead(alert.id)}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          Mark as read
                        </button>
                      )}
                      {!alert.isResolved && (
                        <button
                          onClick={() => actions.resolveAlert(alert.id, 'current_user')}
                          className="text-green-600 hover:text-green-800 text-sm"
                        >
                          Resolve
                        </button>
                      )}
                      <button
                        onClick={() => { setSelectedAlert(alert); setShowAlertModal(true); }}
                        className="text-gray-600 hover:text-gray-800"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* General Settings */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">General Settings</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700">Enable Real-time Updates</label>
                    <button
                      onClick={() => config.update({ enableRealTime: !config.current.enableRealTime })}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        config.current.enableRealTime ? 'bg-blue-600' : 'bg-gray-200'
                      }`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        config.current.enableRealTime ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700">Enable Alerts</label>
                    <button
                      onClick={() => config.update({ enableAlerts: !config.current.enableAlerts })}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        config.current.enableAlerts ? 'bg-blue-600' : 'bg-gray-200'
                      }`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        config.current.enableAlerts ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Refresh Interval (ms)
                    </label>
                    <input
                      type="number"
                      value={config.current.refreshInterval}
                      onChange={(e) => config.update({ refreshInterval: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Data Retention (days)
                    </label>
                    <input
                      type="number"
                      value={config.current.retentionDays}
                      onChange={(e) => config.update({ retentionDays: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
              
              {/* Alert Thresholds */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Alert Thresholds</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Warning Threshold (%)
                    </label>
                    <input
                      type="number"
                      value={config.current.alertThresholds.warning}
                      onChange={(e) => config.update({ 
                        alertThresholds: { 
                          ...config.current.alertThresholds, 
                          warning: parseInt(e.target.value) 
                        }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Critical Threshold (%)
                    </label>
                    <input
                      type="number"
                      value={config.current.alertThresholds.critical}
                      onChange={(e) => config.update({ 
                        alertThresholds: { 
                          ...config.current.alertThresholds, 
                          critical: parseInt(e.target.value) 
                        }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700">Email Notifications</label>
                    <button
                      onClick={() => config.update({ emailNotifications: !config.current.emailNotifications })}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        config.current.emailNotifications ? 'bg-blue-600' : 'bg-gray-200'
                      }`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        config.current.emailNotifications ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Actions */}
            <div className="flex items-center space-x-4 pt-6 border-t border-gray-200">
              <button
                onClick={config.reset}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Reset to Defaults
              </button>
              <button
                onClick={system.optimizeStorage}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Optimize Storage
              </button>
            </div>
          </div>
        )}
        
        {/* Debug Tab */}
        {activeTab === 'debug' && (
          <div className="p-6">
            <div className="space-y-6">
              {/* Debug Controls */}
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Debug Information</h3>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={debug.clear}
                    className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Clear Logs
                  </button>
                  <button
                    onClick={debug.isEnabled ? debug.disable : debug.enable}
                    className={`px-3 py-2 rounded-lg transition-colors ${
                      debug.isEnabled
                        ? 'bg-red-600 text-white hover:bg-red-700'
                        : 'bg-green-600 text-white hover:bg-green-700'
                    }`}
                  >
                    {debug.isEnabled ? 'Disable' : 'Enable'} Debug
                  </button>
                </div>
              </div>
              
              {/* Debug Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">System Stats</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Storage Used:</span>
                      <span>{utils.formatBytes(analytics.stats.storageUsed)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>API Calls:</span>
                      <span>{analytics.stats.apiCalls}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Uptime:</span>
                      <span>{utils.formatDuration(analytics.stats.uptime)}</span>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Data Validation</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Data Valid:</span>
                      <span className={system.validateData() ? 'text-green-600' : 'text-red-600'}>
                        {system.validateData() ? 'Yes' : 'No'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Debug Enabled:</span>
                      <span className={debug.isEnabled ? 'text-green-600' : 'text-red-600'}>
                        {debug.isEnabled ? 'Yes' : 'No'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Performance</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Last Update:</span>
                      <span>{utils.formatDuration(Date.now() - analytics.stats.lastUpdate)} ago</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Refresh Rate:</span>
                      <span>{config.current.refreshInterval}ms</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Debug Logs */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Debug Logs</h4>
                <div className="bg-gray-900 text-green-400 rounded-lg p-4 h-64 overflow-y-auto font-mono text-sm">
                  {debug.logs.length === 0 ? (
                    <p className="text-gray-500">No debug logs available</p>
                  ) : (
                    debug.logs.slice(-50).map((log) => (
                      <div key={log.id} className="mb-1">
                        <span className="text-gray-500">
                          [{new Date(log.timestamp).toLocaleTimeString()}]
                        </span>
                        <span className={`ml-2 ${
                          log.level === 'error' ? 'text-red-400' :
                          log.level === 'warn' ? 'text-yellow-400' :
                          log.level === 'info' ? 'text-blue-400' : 'text-green-400'
                        }`}>
                          [{log.level.toUpperCase()}]
                        </span>
                        <span className="ml-2">{log.component}:</span>
                        <span className="ml-2">{log.message}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Modals */}
      {/* Error Modal */}
      {showErrorModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Error Details</h3>
              <button
                onClick={() => setShowErrorModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3">
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setShowErrorModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RealTimeAnalyticsManager;