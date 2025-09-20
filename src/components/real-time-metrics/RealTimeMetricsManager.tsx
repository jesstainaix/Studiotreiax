import React, { useState, useEffect, useMemo } from 'react';
import {
  Play,
  Pause,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  XCircle,
  TrendingUp,
  TrendingDown,
  Minus,
  Settings,
  Download,
  Upload,
  Plus,
  Edit,
  Trash2,
  Eye,
  Filter,
  Search,
  BarChart3,
  PieChart,
  Activity,
  Gauge,
  Table,
  Zap
} from 'lucide-react';
import { useRealTimeMetrics, MetricValue, Alert, Dashboard, Widget, MetricCollector } from '../../hooks/useRealTimeMetrics';

interface RealTimeMetricsManagerProps {
  className?: string;
}

export const RealTimeMetricsManager: React.FC<RealTimeMetricsManagerProps> = ({ className = '' }) => {
  const {
    isCollecting,
    metrics,
    alerts,
    dashboards,
    collectors,
    config,
    error,
    lastUpdate,
    stats,
    actions
  } = useRealTimeMetrics();

  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSeverity, setSelectedSeverity] = useState('all');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(5000);
  const [showCreateDashboard, setShowCreateDashboard] = useState(false);
  const [showCreateWidget, setShowCreateWidget] = useState(false);
  const [showAlertDetails, setShowAlertDetails] = useState<Alert | null>(null);
  const [showMetricDetails, setShowMetricDetails] = useState<MetricValue | null>(null);
  const [selectedDashboard, setSelectedDashboard] = useState<Dashboard | null>(null);

  // Auto refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      // Trigger refresh by updating component
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval]);

  // Filter functions
  const filteredMetrics = useMemo(() => {
    return metrics.filter(metric => {
      const matchesSearch = metric.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           metric.category.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || metric.category === selectedCategory;
      const matchesSeverity = selectedSeverity === 'all' || metric.severity === selectedSeverity;
      return matchesSearch && matchesCategory && matchesSeverity;
    });
  }, [metrics, searchTerm, selectedCategory, selectedSeverity]);

  const filteredAlerts = useMemo(() => {
    return alerts.filter(alert => {
      const matchesSearch = alert.message.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSeverity = selectedSeverity === 'all' || alert.severity === selectedSeverity;
      return matchesSearch && matchesSeverity;
    });
  }, [alerts, searchTerm, selectedSeverity]);

  // Helper functions
  const formatValue = (value: number, unit: string): string => {
    if (unit === '%') {
      return `${value.toFixed(1)}%`;
    } else if (unit === 'ms') {
      return `${value.toFixed(0)}ms`;
    } else if (unit === 'bytes') {
      const sizes = ['B', 'KB', 'MB', 'GB'];
      let i = 0;
      let val = value;
      while (val >= 1024 && i < sizes.length - 1) {
        val /= 1024;
        i++;
      }
      return `${val.toFixed(1)}${sizes[i]}`;
    }
    return `${value.toFixed(2)}${unit}`;
  };

  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'low': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'high': return 'text-orange-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'down': return <TrendingDown className="w-4 h-4 text-red-500" />;
      default: return <Minus className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'inactive': return <XCircle className="w-4 h-4 text-gray-500" />;
      case 'error': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default: return <XCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  // Render functions
  const renderStatusBar = () => (
    <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${
              isCollecting ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
            }`} />
            <span className="text-sm font-medium">
              {isCollecting ? 'Collecting' : 'Stopped'}
            </span>
          </div>
          
          <div className="text-sm text-gray-600">
            <span className="font-medium">{stats.totalMetrics}</span> metrics
          </div>
          
          <div className="text-sm text-gray-600">
            <span className="font-medium text-red-600">{stats.activeAlerts}</span> active alerts
          </div>
          
          <div className="text-sm text-gray-600">
            <span className="font-medium">{stats.collectionRate}</span> collectors active
          </div>
          
          {lastUpdate && (
            <div className="text-sm text-gray-500">
              Last update: {lastUpdate.toLocaleTimeString()}
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-3 py-1 rounded text-sm ${
              autoRefresh
                ? 'bg-green-100 text-green-700 border border-green-300'
                : 'bg-gray-100 text-gray-700 border border-gray-300'
            }`}
          >
            <RefreshCw className={`w-4 h-4 ${autoRefresh ? 'animate-spin' : ''}`} />
          </button>
          
          <button
            onClick={isCollecting ? actions.stopCollection : actions.startCollection}
            className={`px-4 py-2 rounded-lg font-medium ${
              isCollecting
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            {isCollecting ? (
              <><Pause className="w-4 h-4 mr-2" />Stop</>
            ) : (
              <><Play className="w-4 h-4 mr-2" />Start</>
            )}
          </button>
        </div>
      </div>
      
      {error && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              <span className="text-sm text-red-700">{error}</span>
            </div>
            <button
              onClick={actions.clearError}
              className="text-red-500 hover:text-red-700"
            >
              <XCircle className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );

  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Metrics</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalMetrics}</p>
            </div>
            <Activity className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Alerts</p>
              <p className="text-2xl font-bold text-red-600">{stats.activeAlerts}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Collection Rate</p>
              <p className="text-2xl font-bold text-green-600">{stats.collectionRate}</p>
            </div>
            <Gauge className="w-8 h-8 text-green-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Data Points</p>
              <p className="text-2xl font-bold text-purple-600">{stats.dataPoints}</p>
            </div>
            <BarChart3 className="w-8 h-8 text-purple-500" />
          </div>
        </div>
      </div>
      
      {/* Recent Metrics */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Recent Metrics</h3>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {filteredMetrics.slice(0, 10).map(metric => (
              <div key={metric.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className={`w-3 h-3 rounded-full ${
                    metric.severity === 'critical' ? 'bg-red-500' :
                    metric.severity === 'high' ? 'bg-orange-500' :
                    metric.severity === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                  }`} />
                  <div>
                    <p className="font-medium text-gray-900">{metric.name}</p>
                    <p className="text-sm text-gray-600">{metric.category}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="font-medium text-gray-900">
                      {formatValue(metric.value, metric.unit)}
                    </p>
                    <p className="text-sm text-gray-600">
                      {metric.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                  {getTrendIcon(metric.trend)}
                  <button
                    onClick={() => setShowMetricDetails(metric)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Recent Alerts */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Recent Alerts</h3>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {filteredAlerts.slice(0, 5).map(alert => (
              <div key={alert.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-4">
                  <AlertTriangle className={`w-5 h-5 ${
                    alert.severity === 'critical' ? 'text-red-500' :
                    alert.severity === 'high' ? 'text-orange-500' :
                    alert.severity === 'medium' ? 'text-yellow-500' : 'text-green-500'
                  }`} />
                  <div>
                    <p className="font-medium text-gray-900">{alert.message}</p>
                    <p className="text-sm text-gray-600">
                      {alert.timestamp.toLocaleString()}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {alert.resolved ? (
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm">
                      Resolved
                    </span>
                  ) : alert.acknowledged ? (
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-sm">
                      Acknowledged
                    </span>
                  ) : (
                    <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-sm">
                      Active
                    </span>
                  )}
                  <button
                    onClick={() => setShowAlertDetails(alert)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
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
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Categories</option>
            <option value="system">System</option>
            <option value="application">Application</option>
            <option value="business">Business</option>
            <option value="performance">Performance</option>
            <option value="reliability">Reliability</option>
          </select>
          
          <select
            value={selectedSeverity}
            onChange={(e) => setSelectedSeverity(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Severities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>
      </div>
      
      {/* Metrics Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Metric
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Value
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trend
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Severity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Update
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredMetrics.map(metric => (
                <tr key={metric.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{metric.name}</div>
                      <div className="text-sm text-gray-500">{metric.category}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {formatValue(metric.value, metric.unit)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      {getTrendIcon(metric.trend)}
                      <span className="text-sm text-gray-600">
                        {metric.change > 0 ? '+' : ''}{metric.change.toFixed(1)}%
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      metric.severity === 'critical' ? 'bg-red-100 text-red-800' :
                      metric.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                      metric.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {metric.severity}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {metric.timestamp.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => setShowMetricDetails(metric)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderAlerts = () => (
    <div className="space-y-6">
      {/* Alert Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {['low', 'medium', 'high', 'critical'].map(severity => {
          const count = alerts.filter(a => a.severity === severity && !a.resolved).length;
          return (
            <div key={severity} className="bg-white rounded-lg shadow-sm border p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 capitalize">{severity}</p>
                  <p className={`text-2xl font-bold ${getSeverityColor(severity)}`}>{count}</p>
                </div>
                <AlertTriangle className={`w-6 h-6 ${
                  severity === 'critical' ? 'text-red-500' :
                  severity === 'high' ? 'text-orange-500' :
                  severity === 'medium' ? 'text-yellow-500' : 'text-green-500'
                }`} />
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Alerts List */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Alerts</h3>
            <div className="flex items-center space-x-2">
              <select
                value={selectedSeverity}
                onChange={(e) => setSelectedSeverity(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Severities</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>
        </div>
        
        <div className="divide-y divide-gray-200">
          {filteredAlerts.map(alert => (
            <div key={alert.id} className="p-6 hover:bg-gray-50">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4">
                  <AlertTriangle className={`w-5 h-5 mt-0.5 ${
                    alert.severity === 'critical' ? 'text-red-500' :
                    alert.severity === 'high' ? 'text-orange-500' :
                    alert.severity === 'medium' ? 'text-yellow-500' : 'text-green-500'
                  }`} />
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-gray-900">{alert.message}</h4>
                    <p className="text-sm text-gray-600 mt-1">{alert.description}</p>
                    <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                      <span>Type: {alert.type}</span>
                      <span>•</span>
                      <span>{alert.timestamp.toLocaleString()}</span>
                      {alert.resolvedAt && (
                        <>
                          <span>•</span>
                          <span>Resolved: {alert.resolvedAt.toLocaleString()}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {alert.resolved ? (
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
                      Resolved
                    </span>
                  ) : alert.acknowledged ? (
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-medium">
                      Acknowledged
                    </span>
                  ) : (
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => actions.acknowledgeAlert(alert.id)}
                        className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-medium hover:bg-yellow-200"
                      >
                        Acknowledge
                      </button>
                      <button
                        onClick={() => actions.resolveAlert(alert.id)}
                        className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium hover:bg-green-200"
                      >
                        Resolve
                      </button>
                    </div>
                  )}
                  <button
                    onClick={() => setShowAlertDetails(alert)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderCollectors = () => (
    <div className="space-y-6">
      {/* Collectors List */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Metric Collectors</h3>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2">
              <Plus className="w-4 h-4" />
              <span>Add Collector</span>
            </button>
          </div>
        </div>
        
        <div className="divide-y divide-gray-200">
          {collectors.map(collector => (
            <div key={collector.id} className="p-6 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  {getStatusIcon(collector.status)}
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">{collector.name}</h4>
                    <p className="text-sm text-gray-600">
                      Type: {collector.type} • Source: {collector.source}
                    </p>
                    <p className="text-sm text-gray-500">
                      Interval: {collector.interval}ms
                      {collector.lastRun && (
                        <> • Last run: {collector.lastRun.toLocaleString()}</>
                      )}
                    </p>
                    {collector.errorMessage && (
                      <p className="text-sm text-red-600 mt-1">
                        Error: {collector.errorMessage}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={collector.enabled}
                      onChange={(e) => {
                        // Update collector enabled status
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-600">Enabled</span>
                  </label>
                  
                  <button className="text-blue-600 hover:text-blue-800">
                    <Edit className="w-4 h-4" />
                  </button>
                  
                  <button className="text-red-600 hover:text-red-800">
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

  const renderDashboards = () => (
    <div className="space-y-6">
      {/* Dashboards Grid */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Dashboards</h3>
            <button
              onClick={() => setShowCreateDashboard(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Create Dashboard</span>
            </button>
          </div>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {dashboards.map(dashboard => (
              <div key={dashboard.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-medium text-gray-900">{dashboard.name}</h4>
                    <p className="text-sm text-gray-600 mt-1">{dashboard.description}</p>
                  </div>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => setSelectedDashboard(dashboard)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button className="text-gray-600 hover:text-gray-800">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button className="text-red-600 hover:text-red-800">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <div className="text-sm text-gray-500 space-y-1">
                  <p>{dashboard.widgets.length} widgets</p>
                  <p>Refresh: {dashboard.refreshInterval}ms</p>
                  <p>Created: {dashboard.createdAt.toLocaleDateString()}</p>
                  {dashboard.isPublic && (
                    <span className="inline-flex px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                      Public
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="space-y-6">
      {/* General Settings */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">General Settings</h3>
        </div>
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Collection Interval (ms)
              </label>
              <input
                type="number"
                value={config.collectInterval}
                onChange={(e) => actions.updateConfig({ collectInterval: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Retention Days
              </label>
              <input
                type="number"
                value={config.retentionDays}
                onChange={(e) => actions.updateConfig({ retentionDays: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Metrics
              </label>
              <input
                type="number"
                value={config.maxMetrics}
                onChange={(e) => actions.updateConfig({ maxMetrics: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={config.enabled}
                  onChange={(e) => actions.updateConfig({ enabled: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm font-medium text-gray-700">Enable Metrics Collection</span>
              </label>
            </div>
          </div>
        </div>
      </div>
      
      {/* Alerting Settings */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Alerting Settings</h3>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={config.alerting.enabled}
                onChange={(e) => actions.updateConfig({
                  alerting: { ...config.alerting, enabled: e.target.checked }
                })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm font-medium text-gray-700">Enable Alerting</span>
            </label>
            
            <div className="text-sm text-gray-600">
              <p>Alert Channels: {config.alerting.channels.length}</p>
              <p>Alert Rules: {config.alerting.rules.length}</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Data Management */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Data Management</h3>
        </div>
        <div className="p-6">
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => {
                const data = actions.exportData();
                const blob = new Blob([data], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `metrics-export-${new Date().toISOString().split('T')[0]}.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
              }}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Export Data</span>
            </button>
            
            <label className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2 cursor-pointer">
              <Upload className="w-4 h-4" />
              <span>Import Data</span>
              <input
                type="file"
                accept=".json"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                      const data = event.target?.result as string;
                      actions.importData(data);
                    };
                    reader.readAsText(file);
                  }
                }}
                className="hidden"
              />
            </label>
          </div>
        </div>
      </div>
    </div>
  );

  // Modals
  const MetricDetailsModal = ({ metric, onClose }: { metric: MetricValue; onClose: () => void }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Metric Details</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <XCircle className="w-6 h-6" />
            </button>
          </div>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <p className="text-sm text-gray-900">{metric.name}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <p className="text-sm text-gray-900">{metric.category}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Value</label>
              <p className="text-sm text-gray-900">{formatValue(metric.value, metric.unit)}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Severity</label>
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                metric.severity === 'critical' ? 'bg-red-100 text-red-800' :
                metric.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                metric.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                'bg-green-100 text-green-800'
              }`}>
                {metric.severity}
              </span>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Trend</label>
              <div className="flex items-center space-x-2">
                {getTrendIcon(metric.trend)}
                <span className="text-sm text-gray-900">
                  {metric.change > 0 ? '+' : ''}{metric.change.toFixed(1)}%
                </span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Timestamp</label>
              <p className="text-sm text-gray-900">{metric.timestamp.toLocaleString()}</p>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Thresholds</label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-sm text-yellow-600">Warning: {metric.threshold.warning}{metric.unit}</span>
              </div>
              <div>
                <span className="text-sm text-red-600">Critical: {metric.threshold.critical}{metric.unit}</span>
              </div>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
            <div className="flex flex-wrap gap-2">
              {metric.tags.map(tag => (
                <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const AlertDetailsModal = ({ alert, onClose }: { alert: Alert; onClose: () => void }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Alert Details</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <XCircle className="w-6 h-6" />
            </button>
          </div>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
              <p className="text-sm text-gray-900">{alert.message}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <p className="text-sm text-gray-900">{alert.type}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Severity</label>
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                alert.severity === 'critical' ? 'bg-red-100 text-red-800' :
                alert.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                alert.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                'bg-green-100 text-green-800'
              }`}>
                {alert.severity}
              </span>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                alert.resolved ? 'bg-green-100 text-green-800' :
                alert.acknowledged ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {alert.resolved ? 'Resolved' : alert.acknowledged ? 'Acknowledged' : 'Active'}
              </span>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Created</label>
              <p className="text-sm text-gray-900">{alert.timestamp.toLocaleString()}</p>
            </div>
            {alert.resolvedAt && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Resolved</label>
                <p className="text-sm text-gray-900">{alert.resolvedAt.toLocaleString()}</p>
              </div>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <p className="text-sm text-gray-900">{alert.description}</p>
          </div>
          
          {!alert.resolved && (
            <div className="flex space-x-3">
              {!alert.acknowledged && (
                <button
                  onClick={() => {
                    actions.acknowledgeAlert(alert.id);
                    onClose();
                  }}
                  className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
                >
                  Acknowledge
                </button>
              )}
              <button
                onClick={() => {
                  actions.resolveAlert(alert.id);
                  onClose();
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Resolve
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Real-Time Metrics</h2>
          <p className="text-gray-600">Monitor system performance and application metrics in real-time</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <Zap className="w-8 h-8 text-blue-500" />
        </div>
      </div>
      
      {/* Status Bar */}
      {renderStatusBar()}
      
      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
            { id: 'metrics', label: 'Metrics', icon: Activity },
            { id: 'alerts', label: 'Alerts', icon: AlertTriangle },
            { id: 'collectors', label: 'Collectors', icon: Gauge },
            { id: 'dashboards', label: 'Dashboards', icon: PieChart },
            { id: 'settings', label: 'Settings', icon: Settings }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
      
      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'metrics' && renderMetrics()}
        {activeTab === 'alerts' && renderAlerts()}
        {activeTab === 'collectors' && renderCollectors()}
        {activeTab === 'dashboards' && renderDashboards()}
        {activeTab === 'settings' && renderSettings()}
      </div>
      
      {/* Modals */}
      {showMetricDetails && (
        <MetricDetailsModal
          metric={showMetricDetails}
          onClose={() => setShowMetricDetails(null)}
        />
      )}
      
      {showAlertDetails && (
        <AlertDetailsModal
          alert={showAlertDetails}
          onClose={() => setShowAlertDetails(null)}
        />
      )}
    </div>
  );
};

export default RealTimeMetricsManager;