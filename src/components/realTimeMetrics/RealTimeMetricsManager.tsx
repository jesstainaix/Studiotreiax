import React, { useState, useEffect, useMemo } from 'react';
import { 
  Activity, 
  AlertTriangle, 
  BarChart3, 
  Bell, 
  BellOff, 
  CheckCircle, 
  Clock, 
  Download, 
  Filter, 
  LineChart, 
  Play, 
  Pause, 
  Plus, 
  RefreshCw, 
  Search, 
  Settings, 
  TrendingUp, 
  TrendingDown, 
  Upload, 
  X, 
  Zap,
  Eye,
  EyeOff,
  Target,
  Database,
  Gauge,
  PieChart,
  Calendar,
  Users,
  Server,
  Cpu,
  MemoryStick,
  HardDrive,
  Wifi,
  Shield,
  Bug,
  Info,
  AlertCircle,
  XCircle
} from 'lucide-react';
import { 
  useRealTimeMetrics,
  useMetrics,
  useMetricAlerts,
  useMetricDashboards,
  useMetricPerformance,
  useMetricEvents,
  useMetricDebug,
  useDebouncedMetricSearch
} from '../../hooks/useRealTimeMetrics';
import { 
  type MetricData,
  type MetricAlert,
  type MetricDashboard,
  type DashboardWidget
} from '../../utils/realTimeMetrics';

interface RealTimeMetricsManagerProps {
  className?: string;
}

export function RealTimeMetricsManager({ className = '' }: RealTimeMetricsManagerProps) {
  const {
    metrics,
    alerts,
    dashboards,
    isCollecting,
    isAlerting,
    lastUpdate,
    actions,
    quickActions,
    computed,
    utils
  } = useRealTimeMetrics();
  
  const performance = useMetricPerformance();
  const events = useMetricEvents();
  const debug = useMetricDebug();
  
  // Local state
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('timestamp');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showMetricModal, setShowMetricModal] = useState(false);
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [showDashboardModal, setShowDashboardModal] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<MetricData | null>(null);
  const [selectedAlert, setSelectedAlert] = useState<MetricAlert | null>(null);
  const [selectedDashboard, setSelectedDashboard] = useState<MetricDashboard | null>(null);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  // Auto-refresh
  useEffect(() => {
    const interval = setInterval(() => {
      // Trigger re-render for real-time updates
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);
  
  // Generate demo data
  useEffect(() => {
    const generateDemoData = async () => {
      if (metrics.length === 0) {
        try {
          // Add sample metrics
          await actions.addMetrics([
            {
              name: 'CPU Usage',
              value: 65.5,
              unit: '%',
              category: 'performance',
              tags: { source: 'system', component: 'cpu' }
            },
            {
              name: 'Memory Usage',
              value: 78.2,
              unit: '%',
              category: 'performance',
              tags: { source: 'system', component: 'memory' }
            },
            {
              name: 'Active Users',
              value: 1247,
              unit: 'count',
              category: 'user',
              tags: { source: 'analytics', type: 'concurrent' }
            }
          ]);
          
          // Add sample alerts
          await actions.createAlert({
            name: 'High CPU Usage',
            description: 'CPU usage is above 80%',
            metricName: 'CPU Usage',
            condition: 'greater_than',
            threshold: 80,
            severity: 'warning'
          });
          
          await actions.createAlert({
            name: 'Memory Critical',
            description: 'Memory usage is critically high',
            metricName: 'Memory Usage',
            condition: 'greater_than',
            threshold: 90,
            severity: 'critical'
          });
          
          // Create sample dashboard
          await actions.createDashboard({
            name: 'System Overview',
            description: 'Main system performance dashboard',
            widgets: [
              {
                id: 'cpu-widget',
                type: 'gauge',
                title: 'CPU Usage',
                metricName: 'CPU Usage',
                position: { x: 0, y: 0, width: 6, height: 4 },
                config: { min: 0, max: 100, unit: '%' }
              },
              {
                id: 'memory-widget',
                type: 'gauge',
                title: 'Memory Usage',
                metricName: 'Memory Usage',
                position: { x: 6, y: 0, width: 6, height: 4 },
                config: { min: 0, max: 100, unit: '%' }
              }
            ]
          });
        } catch (error) {
          console.error('Failed to generate demo data:', error);
        }
      }
    };
    
    generateDemoData();
  }, []);
  
  // Filtered and sorted data
  const filteredMetrics = useDebouncedMetricSearch(searchTerm);
  
  const processedMetrics = useMemo(() => {
    let result = [...filteredMetrics];
    
    // Filter by category
    if (selectedCategory !== 'all') {
      result = result.filter(metric => metric.category === selectedCategory);
    }
    
    // Sort
    result.sort((a, b) => {
      let aValue: any = a[sortBy as keyof MetricData];
      let bValue: any = b[sortBy as keyof MetricData];
      
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
    
    return result;
  }, [filteredMetrics, selectedCategory, sortBy, sortOrder]);
  
  const processedAlerts = useMemo(() => {
    let result = [...alerts];
    
    // Filter by severity
    if (selectedSeverity !== 'all') {
      result = result.filter(alert => alert.severity === selectedSeverity);
    }
    
    // Sort by timestamp (newest first)
    result.sort((a, b) => b.timestamp - a.timestamp);
    
    return result;
  }, [alerts, selectedSeverity]);
  
  // Status cards data
  const statusCards = [
    {
      title: 'System Health',
      value: `${computed.systemHealth.toFixed(1)}%`,
      icon: computed.systemHealth > 80 ? CheckCircle : AlertTriangle,
      color: computed.systemHealth > 80 ? 'text-green-600' : computed.systemHealth > 60 ? 'text-yellow-600' : 'text-red-600',
      bgColor: computed.systemHealth > 80 ? 'bg-green-50' : computed.systemHealth > 60 ? 'bg-yellow-50' : 'bg-red-50'
    },
    {
      title: 'Active Metrics',
      value: metrics.length.toString(),
      icon: BarChart3,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Active Alerts',
      value: computed.activeAlerts.length.toString(),
      icon: Bell,
      color: computed.activeAlerts.length > 0 ? 'text-red-600' : 'text-green-600',
      bgColor: computed.activeAlerts.length > 0 ? 'bg-red-50' : 'bg-green-50'
    },
    {
      title: 'Performance Score',
      value: `${computed.performanceScore.toFixed(1)}%`,
      icon: TrendingUp,
      color: computed.performanceScore > 80 ? 'text-green-600' : computed.performanceScore > 60 ? 'text-yellow-600' : 'text-red-600',
      bgColor: computed.performanceScore > 80 ? 'bg-green-50' : computed.performanceScore > 60 ? 'bg-yellow-50' : 'bg-red-50'
    }
  ];
  
  // Tab configuration
  const tabs = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'metrics', label: 'Metrics', icon: BarChart3 },
    { id: 'alerts', label: 'Alerts', icon: Bell },
    { id: 'dashboards', label: 'Dashboards', icon: LineChart },
    { id: 'performance', label: 'Performance', icon: Gauge },
    { id: 'events', label: 'Events', icon: Clock },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'debug', label: 'Debug', icon: Bug }
  ];
  
  // Helper functions
  const handleError = (error: string) => {
    setErrorMessage(error);
    setShowErrorModal(true);
  };
  
  const getMetricIcon = (category: MetricData['category']) => {
    switch (category) {
      case 'performance': return Cpu;
      case 'user': return Users;
      case 'system': return Server;
      case 'business': return Target;
      case 'error': return AlertCircle;
      default: return BarChart3;
    }
  };
  
  const getAlertIcon = (severity: MetricAlert['severity']) => {
    switch (severity) {
      case 'critical': return XCircle;
      case 'warning': return AlertTriangle;
      case 'info': return Info;
      default: return Bell;
    }
  };
  
  const getSeverityColor = (severity: MetricAlert['severity']) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50';
      case 'warning': return 'text-yellow-600 bg-yellow-50';
      case 'info': return 'text-blue-600 bg-blue-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };
  
  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Activity className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Real-Time Metrics</h2>
              <p className="text-sm text-gray-500">
                Monitor system performance and analytics in real-time
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => isCollecting ? quickActions.stopCollection() : quickActions.startCollection()}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                isCollecting
                  ? 'bg-red-100 text-red-700 hover:bg-red-200'
                  : 'bg-green-100 text-green-700 hover:bg-green-200'
              }`}
            >
              {isCollecting ? (
                <><Pause className="w-4 h-4 mr-2" />Stop Collection</>
              ) : (
                <><Play className="w-4 h-4 mr-2" />Start Collection</>
              )}
            </button>
            
            <button
              onClick={() => isAlerting ? quickActions.disableAlerts() : quickActions.enableAlerts()}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                isAlerting
                  ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {isAlerting ? (
                <><BellOff className="w-4 h-4 mr-2" />Disable Alerts</>
              ) : (
                <><Bell className="w-4 h-4 mr-2" />Enable Alerts</>
              )}
            </button>
            
            <button
              onClick={() => quickActions.exportMetrics()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </button>
          </div>
        </div>
        
        {/* Status indicator */}
        <div className="mt-4 flex items-center space-x-4 text-sm">
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${
              isCollecting ? 'bg-green-500' : 'bg-gray-400'
            }`} />
            <span className="text-gray-600">
              Collection: {isCollecting ? 'Active' : 'Inactive'}
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${
              isAlerting ? 'bg-yellow-500' : 'bg-gray-400'
            }`} />
            <span className="text-gray-600">
              Alerts: {isAlerting ? 'Enabled' : 'Disabled'}
            </span>
          </div>
          
          {lastUpdate && (
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-gray-400" />
              <span className="text-gray-600">
                Last update: {new Date(lastUpdate).toLocaleTimeString()}
              </span>
            </div>
          )}
        </div>
      </div>
      
      {/* Status Cards */}
      <div className="p-6 border-b border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {statusCards.map((card, index) => {
            const Icon = card.icon;
            return (
              <div key={index} className={`p-4 rounded-lg ${card.bgColor}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{card.title}</p>
                    <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
                  </div>
                  <Icon className={`w-8 h-8 ${card.color}`} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-6">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
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
      <div className="p-6">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* System Health */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">System Health</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">CPU Usage</span>
                    <Cpu className="w-4 h-4 text-blue-600" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900 mt-2">
                    {performance.systemHealth > 0 ? `${(100 - performance.systemHealth).toFixed(1)}%` : 'N/A'}
                  </p>
                </div>
                
                <div className="bg-white p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">Memory Usage</span>
                    <MemoryStick className="w-4 h-4 text-green-600" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900 mt-2">
                    {performance.performanceScore > 0 ? `${(100 - performance.performanceScore).toFixed(1)}%` : 'N/A'}
                  </p>
                </div>
                
                <div className="bg-white p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">Response Time</span>
                    <Zap className="w-4 h-4 text-yellow-600" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900 mt-2">
                    {performance.avgResponseTime ? `${performance.avgResponseTime.toFixed(0)}ms` : 'N/A'}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Quick Actions */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <button
                  onClick={() => quickActions.generateReport(3600000)}
                  className="p-4 bg-white rounded-lg hover:bg-gray-50 transition-colors text-center"
                >
                  <BarChart3 className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                  <span className="text-sm font-medium text-gray-900">Generate Report</span>
                </button>
                
                <button
                  onClick={() => quickActions.exportMetrics()}
                  className="p-4 bg-white rounded-lg hover:bg-gray-50 transition-colors text-center"
                >
                  <Download className="w-6 h-6 text-green-600 mx-auto mb-2" />
                  <span className="text-sm font-medium text-gray-900">Export Data</span>
                </button>
                
                <button
                  onClick={() => quickActions.resetSystem()}
                  className="p-4 bg-white rounded-lg hover:bg-gray-50 transition-colors text-center"
                >
                  <RefreshCw className="w-6 h-6 text-orange-600 mx-auto mb-2" />
                  <span className="text-sm font-medium text-gray-900">Reset System</span>
                </button>
                
                <button
                  onClick={() => setActiveTab('settings')}
                  className="p-4 bg-white rounded-lg hover:bg-gray-50 transition-colors text-center"
                >
                  <Settings className="w-6 h-6 text-gray-600 mx-auto mb-2" />
                  <span className="text-sm font-medium text-gray-900">Settings</span>
                </button>
              </div>
            </div>
            
            {/* Recent Events */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Events</h3>
              <div className="space-y-3">
                {events.recentEvents.slice(0, 5).map((event) => (
                  <div key={event.id} className="flex items-center space-x-3 bg-white p-3 rounded-lg">
                    <div className={`w-2 h-2 rounded-full ${
                      event.type === 'error' ? 'bg-red-500' :
                      event.type === 'warning' ? 'bg-yellow-500' :
                      event.type === 'success' ? 'bg-green-500' :
                      'bg-blue-500'
                    }`} />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{event.message}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(event.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
                
                {events.recentEvents.length === 0 && (
                  <div className="text-center py-8">
                    <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No recent events</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Metrics Tab */}
        {activeTab === 'metrics' && (
          <div className="space-y-6">
            {/* Filters */}
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
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Categories</option>
                <option value="performance">Performance</option>
                <option value="user">User</option>
                <option value="system">System</option>
                <option value="business">Business</option>
                <option value="error">Error</option>
              </select>
              
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="timestamp">Sort by Time</option>
                <option value="name">Sort by Name</option>
                <option value="value">Sort by Value</option>
                <option value="category">Sort by Category</option>
              </select>
              
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {sortOrder === 'asc' ? 'Ascending' : 'Descending'}
              </button>
            </div>
            
            {/* Metrics List */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
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
                        Category
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Timestamp
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {processedMetrics.map((metric) => {
                      const Icon = getMetricIcon(metric.category);
                      return (
                        <tr key={metric.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <Icon className="w-5 h-5 text-gray-400 mr-3" />
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {metric.name}
                                </div>
                                {Object.keys(metric.tags).length > 0 && (
                                  <div className="text-xs text-gray-500">
                                    {Object.entries(metric.tags).map(([key, value]) => (
                                      <span key={key} className="mr-2">
                                        {key}: {value}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {utils.formatMetricValue(metric.value, metric.unit)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              metric.category === 'performance' ? 'bg-blue-100 text-blue-800' :
                              metric.category === 'user' ? 'bg-green-100 text-green-800' :
                              metric.category === 'system' ? 'bg-purple-100 text-purple-800' :
                              metric.category === 'business' ? 'bg-yellow-100 text-yellow-800' :
                              metric.category === 'error' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {metric.category}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(metric.timestamp).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => {
                                setSelectedMetric(metric);
                                setShowMetricModal(true);
                              }}
                              className="text-blue-600 hover:text-blue-900 mr-3"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => actions.deleteMetric(metric.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              
              {processedMetrics.length === 0 && (
                <div className="text-center py-12">
                  <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No metrics found</p>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Alerts Tab */}
        {activeTab === 'alerts' && (
          <div className="space-y-6">
            {/* Alert Filters */}
            <div className="flex items-center justify-between">
              <select
                value={selectedSeverity}
                onChange={(e) => setSelectedSeverity(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Severities</option>
                <option value="critical">Critical</option>
                <option value="warning">Warning</option>
                <option value="info">Info</option>
              </select>
              
              <button
                onClick={() => setShowAlertModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Alert
              </button>
            </div>
            
            {/* Alerts List */}
            <div className="space-y-4">
              {processedAlerts.map((alert) => {
                const Icon = getAlertIcon(alert.severity);
                return (
                  <div key={alert.id} className={`p-4 rounded-lg border-l-4 ${
                    alert.severity === 'critical' ? 'border-red-500 bg-red-50' :
                    alert.severity === 'warning' ? 'border-yellow-500 bg-yellow-50' :
                    alert.severity === 'info' ? 'border-blue-500 bg-blue-50' :
                    'border-gray-500 bg-gray-50'
                  }`}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <Icon className={`w-5 h-5 mt-0.5 ${
                          alert.severity === 'critical' ? 'text-red-600' :
                          alert.severity === 'warning' ? 'text-yellow-600' :
                          alert.severity === 'info' ? 'text-blue-600' :
                          'text-gray-600'
                        }`} />
                        <div>
                          <h4 className="text-sm font-medium text-gray-900">{alert.name}</h4>
                          <p className="text-sm text-gray-600 mt-1">{alert.description}</p>
                          <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                            <span>Metric: {alert.metricName}</span>
                            <span>Condition: {alert.condition} {alert.threshold}</span>
                            <span>{new Date(alert.timestamp).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(alert.severity)}`}>
                          {alert.severity}
                        </span>
                        
                        {alert.isActive && (
                          <button
                            onClick={() => actions.resolveAlert(alert.id)}
                            className="text-green-600 hover:text-green-900"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        
                        <button
                          onClick={() => {
                            setSelectedAlert(alert);
                            setShowAlertModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        
                        <button
                          onClick={() => actions.deleteAlert(alert.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {processedAlerts.length === 0 && (
                <div className="text-center py-12">
                  <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No alerts found</p>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Other tabs placeholder */}
        {!['overview', 'metrics', 'alerts'].includes(activeTab) && (
          <div className="text-center py-12">
            <div className="w-12 h-12 bg-gray-100 rounded-lg mx-auto mb-4 flex items-center justify-center">
              {tabs.find(tab => tab.id === activeTab)?.icon && (
                React.createElement(tabs.find(tab => tab.id === activeTab)!.icon, {
                  className: "w-6 h-6 text-gray-400"
                })
              )}
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {tabs.find(tab => tab.id === activeTab)?.label}
            </h3>
            <p className="text-gray-500">This section is under development</p>
          </div>
        )}
      </div>
      
      {/* Metric Details Modal */}
      {showMetricModal && selectedMetric && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Metric Details</h3>
              <button
                onClick={() => setShowMetricModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <p className="mt-1 text-sm text-gray-900">{selectedMetric.name}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Value</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {utils.formatMetricValue(selectedMetric.value, selectedMetric.unit)}
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Category</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedMetric.category}</p>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Tags</label>
                <div className="mt-1 flex flex-wrap gap-2">
                  {Object.entries(selectedMetric.tags).map(([key, value]) => (
                    <span key={key} className="px-2 py-1 bg-gray-100 rounded text-xs">
                      {key}: {value}
                    </span>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Timestamp</label>
                <p className="mt-1 text-sm text-gray-900">
                  {new Date(selectedMetric.timestamp).toLocaleString()}
                </p>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setShowMetricModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Error Modal */}
      {showErrorModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-red-900">Error</h3>
              <button
                onClick={() => setShowErrorModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-gray-700">{errorMessage}</p>
            </div>
            
            <div className="flex justify-end">
              <button
                onClick={() => setShowErrorModal(false)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RealTimeMetricsManager;