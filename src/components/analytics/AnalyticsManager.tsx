import React, { useState, useEffect, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Badge } from '../ui/badge';
import { Switch } from '../ui/switch';
import { Slider } from '../ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Alert, AlertDescription } from '../ui/alert';
import { Progress } from '../ui/progress';
import { Separator } from '../ui/separator';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Bell,
  CheckCircle,
  Clock,
  Download,
  Eye,
  Filter,
  LineChart,
  Play,
  Pause,
  RefreshCw,
  Settings,
  TrendingUp,
  Users,
  Zap,
  Target,
  PieChart,
  Calendar,
  Search,
  X,
  ExternalLink,
  Database,
  Cpu,
  HardDrive,
  Wifi,
  Globe,
  Smartphone,
  Monitor,
  Tablet,
} from 'lucide-react';
import { useAnalytics, useAnalyticsStats, useAnalyticsConfig } from '../../hooks/useAnalytics';
import { AnalyticsEvent, PerformanceMetric, Alert as AnalyticsAlert } from '../../utils/analytics';

const AnalyticsManager: React.FC = () => {
  // Hooks
  const analytics = useAnalytics({
    autoTrack: true,
    trackPageViews: true,
    trackErrors: true,
    trackPerformance: true,
    enableRealTime: true,
    updateInterval: 2000,
  });
  
  const { stats, realTimeMetrics } = useAnalyticsStats();
  const { config, updateConfig } = useAnalyticsConfig();
  
  // Local state
  const [activeTab, setActiveTab] = useState('overview');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(5000);
  const [selectedTimeRange, setSelectedTimeRange] = useState('1h');
  const [eventFilter, setEventFilter] = useState('');
  const [metricFilter, setMetricFilter] = useState('');
  const [alertFilter, setAlertFilter] = useState('');
  const [showEventModal, setShowEventModal] = useState(false);
  const [showMetricModal, setShowMetricModal] = useState(false);
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<AnalyticsEvent | null>(null);
  const [selectedMetric, setSelectedMetric] = useState<PerformanceMetric | null>(null);
  const [selectedAlert, setSelectedAlert] = useState<AnalyticsAlert | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Auto refresh effect
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      analytics.syncWithServer().catch(err => {
        setError(err.message);
        setShowErrorModal(true);
      });
    }, refreshInterval);
    
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, analytics]);
  
  // Generate demo data
  useEffect(() => {
    const generateDemoData = () => {
      // Generate demo events
      const eventTypes = ['page_view', 'click', 'form_submit', 'error', 'api_call'];
      const categories = ['navigation', 'interaction', 'form', 'error', 'api'];
      
      for (let i = 0; i < 5; i++) {
        const type = eventTypes[Math.floor(Math.random() * eventTypes.length)];
        const category = categories[Math.floor(Math.random() * categories.length)];
        
        analytics.trackEvent({
          type,
          category,
          action: `demo_${type}_${i}`,
          label: `Demo ${type} event`,
          value: Math.floor(Math.random() * 100),
          properties: {
            demo: true,
            timestamp: Date.now(),
            userAgent: navigator.userAgent,
          },
        });
      }
      
      // Generate demo metrics
      const metricNames = ['page_load_time', 'api_response_time', 'memory_usage', 'cpu_usage', 'bundle_size'];
      const metricCategories = ['load', 'api', 'system', 'system', 'build'];
      const units = ['ms', 'ms', 'MB', '%', 'KB'];
      
      for (let i = 0; i < 5; i++) {
        const name = metricNames[i];
        const category = metricCategories[i];
        const unit = units[i];
        
        analytics.trackMetric({
          name,
          value: Math.floor(Math.random() * 1000) + 100,
          unit,
          category,
          tags: {
            demo: 'true',
            environment: 'development',
          },
        });
      }
      
      // Generate demo alerts
      const alertTypes = ['performance', 'error', 'security', 'system'];
      const severities = ['low', 'medium', 'high', 'critical'];
      
      for (let i = 0; i < 3; i++) {
        const type = alertTypes[Math.floor(Math.random() * alertTypes.length)];
        const severity = severities[Math.floor(Math.random() * severities.length)];
        
        analytics.createAlert({
          type,
          severity: severity as any,
          title: `Demo ${type} alert`,
          message: `This is a demo ${severity} alert for ${type} monitoring`,
          source: 'demo_generator',
          metadata: {
            demo: true,
            category: type,
          },
        });
      }
    };
    
    // Generate demo data on mount
    setTimeout(generateDemoData, 1000);
  }, [analytics]);
  
  // Filter functions
  const filteredEvents = useMemo(() => {
    return analytics.events.filter(event => {
      if (!eventFilter) return true;
      return event.type.toLowerCase().includes(eventFilter.toLowerCase()) ||
             event.category.toLowerCase().includes(eventFilter.toLowerCase()) ||
             event.action.toLowerCase().includes(eventFilter.toLowerCase());
    });
  }, [analytics.events, eventFilter]);
  
  const filteredMetrics = useMemo(() => {
    return analytics.metrics.filter(metric => {
      if (!metricFilter) return true;
      return metric.name.toLowerCase().includes(metricFilter.toLowerCase()) ||
             metric.category.toLowerCase().includes(metricFilter.toLowerCase());
    });
  }, [analytics.metrics, metricFilter]);
  
  const filteredAlerts = useMemo(() => {
    return analytics.alerts.filter(alert => {
      if (!alertFilter) return true;
      return alert.type.toLowerCase().includes(alertFilter.toLowerCase()) ||
             alert.title.toLowerCase().includes(alertFilter.toLowerCase()) ||
             alert.severity.toLowerCase().includes(alertFilter.toLowerCase());
    });
  }, [analytics.alerts, alertFilter]);
  
  // Status cards data
  const statusCards = [
    {
      title: 'Total Events',
      value: analytics.totalEvents.toLocaleString(),
      change: '+12%',
      icon: Activity,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Active Alerts',
      value: analytics.unacknowledgedAlerts.toLocaleString(),
      change: analytics.criticalAlerts > 0 ? 'Critical!' : 'Normal',
      icon: AlertTriangle,
      color: analytics.criticalAlerts > 0 ? 'text-red-600' : 'text-yellow-600',
      bgColor: analytics.criticalAlerts > 0 ? 'bg-red-50' : 'bg-yellow-50',
    },
    {
      title: 'Performance Score',
      value: `${Math.round(analytics.performanceScore)}%`,
      change: analytics.performanceScore >= 90 ? 'Excellent' : analytics.performanceScore >= 70 ? 'Good' : 'Needs Improvement',
      icon: TrendingUp,
      color: analytics.performanceScore >= 90 ? 'text-green-600' : analytics.performanceScore >= 70 ? 'text-yellow-600' : 'text-red-600',
      bgColor: analytics.performanceScore >= 90 ? 'bg-green-50' : analytics.performanceScore >= 70 ? 'bg-yellow-50' : 'bg-red-50',
    },
    {
      title: 'Error Rate',
      value: `${(analytics.errorRate * 100).toFixed(2)}%`,
      change: analytics.errorRate < 0.01 ? 'Low' : analytics.errorRate < 0.05 ? 'Medium' : 'High',
      icon: AlertTriangle,
      color: analytics.errorRate < 0.01 ? 'text-green-600' : analytics.errorRate < 0.05 ? 'text-yellow-600' : 'text-red-600',
      bgColor: analytics.errorRate < 0.01 ? 'bg-green-50' : analytics.errorRate < 0.05 ? 'bg-yellow-50' : 'bg-red-50',
    },
  ];
  
  // Tab configuration
  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'events', label: 'Events', icon: Activity },
    { id: 'metrics', label: 'Metrics', icon: LineChart },
    { id: 'alerts', label: 'Alerts', icon: Bell },
    { id: 'realtime', label: 'Real-time', icon: Zap },
    { id: 'performance', label: 'Performance', icon: TrendingUp },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'debug', label: 'Debug', icon: Target },
  ];
  
  // Utility functions
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50';
      case 'high': return 'text-orange-600 bg-orange-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-blue-600 bg-blue-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };
  
  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case 'page_view': return Globe;
      case 'click': return Target;
      case 'form_submit': return CheckCircle;
      case 'error': return AlertTriangle;
      case 'api_call': return Database;
      default: return Activity;
    }
  };
  
  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };
  
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };
  
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics Manager</h1>
          <p className="text-gray-600 mt-1">
            Monitor performance, track events, and analyze user behavior in real-time
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <Switch
              checked={autoRefresh}
              onCheckedChange={setAutoRefresh}
            />
            <Label>Auto Refresh</Label>
          </div>
          
          <Select value={selectedTimeRange} onValueChange={setSelectedTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5m">Last 5 min</SelectItem>
              <SelectItem value="1h">Last hour</SelectItem>
              <SelectItem value="24h">Last 24h</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
            </SelectContent>
          </Select>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => analytics.syncWithServer()}
            disabled={!analytics.isConnected}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowConfigModal(true)}
          >
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>
      
      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statusCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{card.title}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{card.value}</p>
                    <p className={`text-sm mt-1 ${card.color}`}>{card.change}</p>
                  </div>
                  <div className={`p-3 rounded-lg ${card.bgColor}`}>
                    <Icon className={`h-6 w-6 ${card.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      
      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-9">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <TabsTrigger key={tab.id} value={tab.id} className="flex items-center space-x-2">
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>
        
        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Events */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="h-5 w-5" />
                  <span>Recent Events</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.recentEvents.slice(0, 5).map((event) => {
                    const Icon = getEventTypeIcon(event.type);
                    return (
                      <div key={event.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Icon className="h-4 w-4 text-gray-600" />
                          <div>
                            <p className="font-medium text-sm">{event.action}</p>
                            <p className="text-xs text-gray-600">{event.category}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant="outline">{event.type}</Badge>
                          <p className="text-xs text-gray-600 mt-1">
                            {new Date(event.timestamp).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
            
            {/* Recent Alerts */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Bell className="h-5 w-5" />
                  <span>Recent Alerts</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.recentAlerts.slice(0, 5).map((alert) => (
                    <div key={alert.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <AlertTriangle className="h-4 w-4 text-gray-600" />
                        <div>
                          <p className="font-medium text-sm">{alert.title}</p>
                          <p className="text-xs text-gray-600">{alert.message}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className={getSeverityColor(alert.severity)}>
                          {alert.severity}
                        </Badge>
                        <p className="text-xs text-gray-600 mt-1">
                          {new Date(alert.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Performance Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5" />
                <span>Performance Overview</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label>Overall Score</Label>
                  <div className="flex items-center space-x-3">
                    <Progress value={analytics.performanceScore} className="flex-1" />
                    <span className="text-sm font-medium">{Math.round(analytics.performanceScore)}%</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Error Rate</Label>
                  <div className="flex items-center space-x-3">
                    <Progress value={analytics.errorRate * 100} className="flex-1" />
                    <span className="text-sm font-medium">{(analytics.errorRate * 100).toFixed(2)}%</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Active Users</Label>
                  <div className="flex items-center space-x-3">
                    <Users className="h-4 w-4 text-gray-600" />
                    <span className="text-sm font-medium">{realTimeMetrics.activeUsers || 0}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Events Tab */}
        <TabsContent value="events" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="h-5 w-5" />
                  <span>Events ({filteredEvents.length})</span>
                </CardTitle>
                
                <div className="flex items-center space-x-2">
                  <div className="relative">
                    <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <Input
                      placeholder="Filter events..."
                      value={eventFilter}
                      onChange={(e) => setEventFilter(e.target.value)}
                      className="pl-10 w-64"
                    />
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => analytics.exportData('json')}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {filteredEvents.slice(0, 20).map((event) => {
                  const Icon = getEventTypeIcon(event.type);
                  return (
                    <div
                      key={event.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                      onClick={() => {
                        setSelectedEvent(event);
                        setShowEventModal(true);
                      }}
                    >
                      <div className="flex items-center space-x-4">
                        <Icon className="h-5 w-5 text-gray-600" />
                        <div>
                          <p className="font-medium">{event.action}</p>
                          <p className="text-sm text-gray-600">{event.category} • {event.type}</p>
                          {event.label && (
                            <p className="text-xs text-gray-500">{event.label}</p>
                          )}
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <Badge variant="outline">{event.type}</Badge>
                        <p className="text-sm text-gray-600 mt-1">
                          {new Date(event.timestamp).toLocaleString()}
                        </p>
                        {event.value && (
                          <p className="text-xs text-gray-500">Value: {event.value}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Metrics Tab */}
        <TabsContent value="metrics" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <LineChart className="h-5 w-5" />
                  <span>Metrics ({filteredMetrics.length})</span>
                </CardTitle>
                
                <div className="flex items-center space-x-2">
                  <div className="relative">
                    <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <Input
                      placeholder="Filter metrics..."
                      value={metricFilter}
                      onChange={(e) => setMetricFilter(e.target.value)}
                      className="pl-10 w-64"
                    />
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => analytics.exportData('csv')}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredMetrics.slice(0, 12).map((metric) => (
                  <div
                    key={metric.id}
                    className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                    onClick={() => {
                      setSelectedMetric(metric);
                      setShowMetricModal(true);
                    }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{metric.name}</h4>
                      <Badge variant="outline">{metric.category}</Badge>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-bold">{metric.value}</span>
                        <span className="text-sm text-gray-600">{metric.unit}</span>
                      </div>
                      
                      <p className="text-xs text-gray-500">
                        {new Date(metric.timestamp).toLocaleString()}
                      </p>
                      
                      {metric.tags && Object.keys(metric.tags).length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {Object.entries(metric.tags).map(([key, value]) => (
                            <Badge key={key} variant="secondary" className="text-xs">
                              {key}: {value}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Alerts Tab */}
        <TabsContent value="alerts" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <Bell className="h-5 w-5" />
                  <span>Alerts ({filteredAlerts.length})</span>
                </CardTitle>
                
                <div className="flex items-center space-x-2">
                  <div className="relative">
                    <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <Input
                      placeholder="Filter alerts..."
                      value={alertFilter}
                      onChange={(e) => setAlertFilter(e.target.value)}
                      className="pl-10 w-64"
                    />
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => analytics.clearData('alerts')}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Clear All
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {filteredAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`p-4 border rounded-lg cursor-pointer ${
                      alert.acknowledged ? 'bg-gray-50' : 'bg-white border-l-4'
                    } ${
                      alert.severity === 'critical' ? 'border-l-red-500' :
                      alert.severity === 'high' ? 'border-l-orange-500' :
                      alert.severity === 'medium' ? 'border-l-yellow-500' :
                      'border-l-blue-500'
                    }`}
                    onClick={() => {
                      setSelectedAlert(alert);
                      setShowAlertModal(true);
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <AlertTriangle className="h-4 w-4 text-gray-600" />
                          <h4 className="font-medium">{alert.title}</h4>
                          <Badge className={getSeverityColor(alert.severity)}>
                            {alert.severity}
                          </Badge>
                          {alert.acknowledged && (
                            <Badge variant="outline">Acknowledged</Badge>
                          )}
                          {alert.resolved && (
                            <Badge variant="outline" className="text-green-600 bg-green-50">
                              Resolved
                            </Badge>
                          )}
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-2">{alert.message}</p>
                        
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <span>Source: {alert.source}</span>
                          <span>Type: {alert.type}</span>
                          <span>{new Date(alert.timestamp).toLocaleString()}</span>
                        </div>
                      </div>
                      
                      <div className="flex space-x-2">
                        {!alert.acknowledged && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              analytics.acknowledgeAlert(alert.id);
                            }}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Acknowledge
                          </Button>
                        )}
                        
                        {!alert.resolved && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              analytics.resolveAlert(alert.id, 'user');
                            }}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Resolve
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Real-time Tab */}
        <TabsContent value="realtime" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <Users className="h-8 w-8 text-blue-600" />
                  <div>
                    <p className="text-sm text-gray-600">Active Users</p>
                    <p className="text-2xl font-bold">{realTimeMetrics.activeUsers || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <Activity className="h-8 w-8 text-green-600" />
                  <div>
                    <p className="text-sm text-gray-600">Events/min</p>
                    <p className="text-2xl font-bold">{realTimeMetrics.eventsPerMinute || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <Cpu className="h-8 w-8 text-orange-600" />
                  <div>
                    <p className="text-sm text-gray-600">CPU Usage</p>
                    <p className="text-2xl font-bold">{realTimeMetrics.cpuUsage || 0}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <HardDrive className="h-8 w-8 text-purple-600" />
                  <div>
                    <p className="text-sm text-gray-600">Memory</p>
                    <p className="text-2xl font-bold">{formatBytes(realTimeMetrics.memoryUsage || 0)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Zap className="h-5 w-5" />
                <span>Live Activity Feed</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {analytics.recentEvents.slice(0, 10).map((event) => {
                  const Icon = getEventTypeIcon(event.type);
                  return (
                    <div key={event.id} className="flex items-center space-x-3 p-2 bg-gray-50 rounded">
                      <Icon className="h-4 w-4 text-gray-600" />
                      <span className="text-sm">{event.action}</span>
                      <Badge variant="outline" className="text-xs">{event.type}</Badge>
                      <span className="text-xs text-gray-500 ml-auto">
                        {new Date(event.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Load Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Page Load Time</span>
                      <span>2.3s</span>
                    </div>
                    <Progress value={77} />
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>First Paint</span>
                      <span>1.2s</span>
                    </div>
                    <Progress value={85} />
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Interactive</span>
                      <span>3.1s</span>
                    </div>
                    <Progress value={65} />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Resource Usage</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Memory</span>
                      <span>{formatBytes(realTimeMetrics.memoryUsage || 0)}</span>
                    </div>
                    <Progress value={(realTimeMetrics.memoryUsage || 0) / 1024 / 1024 / 10} />
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>CPU</span>
                      <span>{realTimeMetrics.cpuUsage || 0}%</span>
                    </div>
                    <Progress value={realTimeMetrics.cpuUsage || 0} />
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Network</span>
                      <span>Good</span>
                    </div>
                    <Progress value={90} />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">User Experience</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Overall Score</span>
                      <span>{Math.round(analytics.performanceScore)}%</span>
                    </div>
                    <Progress value={analytics.performanceScore} />
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Error Rate</span>
                      <span>{(analytics.errorRate * 100).toFixed(2)}%</span>
                    </div>
                    <Progress value={analytics.errorRate * 100} />
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Satisfaction</span>
                      <span>95%</span>
                    </div>
                    <Progress value={95} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Users Tab */}
        <TabsContent value="users" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <Users className="h-8 w-8 text-blue-600" />
                  <div>
                    <p className="text-sm text-gray-600">Total Users</p>
                    <p className="text-2xl font-bold">1,234</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <Smartphone className="h-8 w-8 text-green-600" />
                  <div>
                    <p className="text-sm text-gray-600">Mobile Users</p>
                    <p className="text-2xl font-bold">67%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <Monitor className="h-8 w-8 text-purple-600" />
                  <div>
                    <p className="text-sm text-gray-600">Desktop Users</p>
                    <p className="text-2xl font-bold">28%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <Tablet className="h-8 w-8 text-orange-600" />
                  <div>
                    <p className="text-sm text-gray-600">Tablet Users</p>
                    <p className="text-2xl font-bold">5%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>User Behavior</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-3">Top Pages</h4>
                  <div className="space-y-2">
                    {['/dashboard', '/projects', '/settings', '/profile', '/help'].map((page, index) => (
                      <div key={page} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="text-sm">{page}</span>
                        <span className="text-sm font-medium">{Math.floor(Math.random() * 1000) + 100}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-3">User Actions</h4>
                  <div className="space-y-2">
                    {['Click Button', 'Form Submit', 'File Upload', 'Search', 'Download'].map((action, index) => (
                      <div key={action} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="text-sm">{action}</span>
                        <span className="text-sm font-medium">{Math.floor(Math.random() * 500) + 50}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Analytics Configuration</CardTitle>
              <CardDescription>
                Configure analytics tracking, data retention, and performance settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium">Tracking Settings</h4>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="enable-tracking">Enable Analytics</Label>
                    <Switch
                      id="enable-tracking"
                      checked={config.enabled}
                      onCheckedChange={(checked) => analytics.updateConfig({ enabled: checked })}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="enable-performance">Performance Tracking</Label>
                    <Switch
                      id="enable-performance"
                      checked={config.enablePerformanceTracking}
                      onCheckedChange={(checked) => analytics.updateConfig({ enablePerformanceTracking: checked })}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="enable-errors">Error Tracking</Label>
                    <Switch
                      id="enable-errors"
                      checked={config.enableErrorTracking}
                      onCheckedChange={(checked) => analytics.updateConfig({ enableErrorTracking: checked })}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="enable-users">User Tracking</Label>
                    <Switch
                      id="enable-users"
                      checked={config.enableUserTracking}
                      onCheckedChange={(checked) => analytics.updateConfig({ enableUserTracking: checked })}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="sample-rate">Sample Rate: {Math.round(config.sampleRate * 100)}%</Label>
                    <Slider
                      id="sample-rate"
                      min={0}
                      max={1}
                      step={0.1}
                      value={[config.sampleRate]}
                      onValueChange={([value]) => analytics.updateConfig({ sampleRate: value })}
                    />
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h4 className="font-medium">Data Management</h4>
                  
                  <div className="space-y-2">
                    <Label htmlFor="retention-days">Data Retention (days)</Label>
                    <Input
                      id="retention-days"
                      type="number"
                      value={config.dataRetentionDays}
                      onChange={(e) => analytics.updateConfig({ dataRetentionDays: parseInt(e.target.value) })}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="batch-size">Batch Size</Label>
                    <Input
                      id="batch-size"
                      type="number"
                      value={config.batchSize}
                      onChange={(e) => analytics.updateConfig({ batchSize: parseInt(e.target.value) })}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="flush-interval">Flush Interval (ms)</Label>
                    <Input
                      id="flush-interval"
                      type="number"
                      value={config.flushInterval}
                      onChange={(e) => analytics.updateConfig({ flushInterval: parseInt(e.target.value) })}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="real-time-alerts">Real-time Alerts</Label>
                    <Switch
                      id="real-time-alerts"
                      checked={config.enableRealTimeAlerts}
                      onCheckedChange={(checked) => analytics.updateConfig({ enableRealTimeAlerts: checked })}
                    />
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    analytics.updateConfig({
                      enabled: true,
                      sampleRate: 1.0,
                      enablePerformanceTracking: true,
                      enableErrorTracking: true,
                      enableUserTracking: true,
                      enableRealTimeAlerts: true,
                      dataRetentionDays: 30,
                      batchSize: 100,
                      flushInterval: 5000,
                    });
                  }}
                >
                  Reset to Defaults
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => analytics.clearData('all')}
                >
                  Clear All Data
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => analytics.exportData('json')}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export Configuration
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Debug Tab */}
        <TabsContent value="debug" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Target className="h-5 w-5" />
                <span>Debug Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-3">System Status</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Tracking Status:</span>
                      <Badge variant={analytics.isTracking ? 'default' : 'secondary'}>
                        {analytics.isTracking ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Connection:</span>
                      <Badge variant={analytics.isConnected ? 'default' : 'destructive'}>
                        {analytics.isConnected ? 'Connected' : 'Disconnected'}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Session ID:</span>
                      <span className="text-sm font-mono">{analytics.currentSession?.id || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Events Count:</span>
                      <span>{analytics.totalEvents}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Alerts Count:</span>
                      <span>{analytics.totalAlerts}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-3">Debug Actions</h4>
                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        analytics.trackEvent({
                          type: 'debug',
                          category: 'test',
                          action: 'manual_test_event',
                          label: 'Debug test event',
                          value: Math.floor(Math.random() * 100),
                        });
                      }}
                      className="w-full"
                    >
                      Generate Test Event
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        analytics.trackMetric({
                          name: 'debug_metric',
                          value: Math.floor(Math.random() * 1000),
                          unit: 'ms',
                          category: 'debug',
                        });
                      }}
                      className="w-full"
                    >
                      Generate Test Metric
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        analytics.createAlert({
                          type: 'debug',
                          severity: 'low',
                          title: 'Debug Test Alert',
                          message: 'This is a test alert generated for debugging',
                          source: 'debug_panel',
                        });
                      }}
                      className="w-full"
                    >
                      Generate Test Alert
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => analytics.syncWithServer()}
                      className="w-full"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Force Sync
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Event Details Modal */}
      <Dialog open={showEventModal} onOpenChange={setShowEventModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Event Details</DialogTitle>
            <DialogDescription>
              Detailed information about the selected event
            </DialogDescription>
          </DialogHeader>
          
          {selectedEvent && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Event ID</Label>
                  <p className="text-sm font-mono">{selectedEvent.id}</p>
                </div>
                <div>
                  <Label>Type</Label>
                  <Badge variant="outline">{selectedEvent.type}</Badge>
                </div>
                <div>
                  <Label>Category</Label>
                  <p className="text-sm">{selectedEvent.category}</p>
                </div>
                <div>
                  <Label>Action</Label>
                  <p className="text-sm">{selectedEvent.action}</p>
                </div>
                <div>
                  <Label>Timestamp</Label>
                  <p className="text-sm">{new Date(selectedEvent.timestamp).toLocaleString()}</p>
                </div>
                <div>
                  <Label>Session ID</Label>
                  <p className="text-sm font-mono">{selectedEvent.sessionId}</p>
                </div>
              </div>
              
              {selectedEvent.label && (
                <div>
                  <Label>Label</Label>
                  <p className="text-sm">{selectedEvent.label}</p>
                </div>
              )}
              
              {selectedEvent.value && (
                <div>
                  <Label>Value</Label>
                  <p className="text-sm">{selectedEvent.value}</p>
                </div>
              )}
              
              {selectedEvent.properties && Object.keys(selectedEvent.properties).length > 0 && (
                <div>
                  <Label>Properties</Label>
                  <pre className="text-xs bg-gray-100 p-3 rounded overflow-auto max-h-40">
                    {JSON.stringify(selectedEvent.properties, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Metric Details Modal */}
      <Dialog open={showMetricModal} onOpenChange={setShowMetricModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Metric Details</DialogTitle>
            <DialogDescription>
              Detailed information about the selected metric
            </DialogDescription>
          </DialogHeader>
          
          {selectedMetric && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Metric ID</Label>
                  <p className="text-sm font-mono">{selectedMetric.id}</p>
                </div>
                <div>
                  <Label>Name</Label>
                  <p className="text-sm">{selectedMetric.name}</p>
                </div>
                <div>
                  <Label>Value</Label>
                  <p className="text-lg font-bold">{selectedMetric.value} {selectedMetric.unit}</p>
                </div>
                <div>
                  <Label>Category</Label>
                  <Badge variant="outline">{selectedMetric.category}</Badge>
                </div>
                <div>
                  <Label>Timestamp</Label>
                  <p className="text-sm">{new Date(selectedMetric.timestamp).toLocaleString()}</p>
                </div>
              </div>
              
              {selectedMetric.tags && Object.keys(selectedMetric.tags).length > 0 && (
                <div>
                  <Label>Tags</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {Object.entries(selectedMetric.tags).map(([key, value]) => (
                      <Badge key={key} variant="secondary">
                        {key}: {value}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Alert Details Modal */}
      <Dialog open={showAlertModal} onOpenChange={setShowAlertModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Alert Details</DialogTitle>
            <DialogDescription>
              Detailed information about the selected alert
            </DialogDescription>
          </DialogHeader>
          
          {selectedAlert && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Alert ID</Label>
                  <p className="text-sm font-mono">{selectedAlert.id}</p>
                </div>
                <div>
                  <Label>Severity</Label>
                  <Badge className={getSeverityColor(selectedAlert.severity)}>
                    {selectedAlert.severity}
                  </Badge>
                </div>
                <div>
                  <Label>Type</Label>
                  <p className="text-sm">{selectedAlert.type}</p>
                </div>
                <div>
                  <Label>Source</Label>
                  <p className="text-sm">{selectedAlert.source}</p>
                </div>
                <div>
                  <Label>Timestamp</Label>
                  <p className="text-sm">{new Date(selectedAlert.timestamp).toLocaleString()}</p>
                </div>
                <div>
                  <Label>Status</Label>
                  <div className="flex space-x-2">
                    {selectedAlert.acknowledged && (
                      <Badge variant="outline">Acknowledged</Badge>
                    )}
                    {selectedAlert.resolved && (
                      <Badge variant="outline" className="text-green-600 bg-green-50">
                        Resolved
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              
              <div>
                <Label>Title</Label>
                <p className="text-sm font-medium">{selectedAlert.title}</p>
              </div>
              
              <div>
                <Label>Message</Label>
                <p className="text-sm">{selectedAlert.message}</p>
              </div>
              
              {selectedAlert.metadata && Object.keys(selectedAlert.metadata).length > 0 && (
                <div>
                  <Label>Metadata</Label>
                  <pre className="text-xs bg-gray-100 p-3 rounded overflow-auto max-h-40">
                    {JSON.stringify(selectedAlert.metadata, null, 2)}
                  </pre>
                </div>
              )}
              
              <div className="flex space-x-3 pt-4">
                {!selectedAlert.acknowledged && (
                  <Button
                    onClick={() => {
                      analytics.acknowledgeAlert(selectedAlert.id);
                      setShowAlertModal(false);
                    }}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Acknowledge
                  </Button>
                )}
                
                {!selectedAlert.resolved && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      analytics.resolveAlert(selectedAlert.id, 'user');
                      setShowAlertModal(false);
                    }}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Resolve
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Error Modal */}
      <Dialog open={showErrorModal} onOpenChange={setShowErrorModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <span>Error</span>
            </DialogTitle>
          </DialogHeader>
          
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {error}
            </AlertDescription>
          </Alert>
          
          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => {
                setError(null);
                setShowErrorModal(false);
              }}
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AnalyticsManager;