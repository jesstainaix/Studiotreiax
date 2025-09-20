import React, { useState, useEffect, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '../ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { Progress } from '../ui/progress';
import { Badge } from '../ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Download,
  Globe,
  HardDrive,
  Play,
  RefreshCw,
  Settings,
  Shield,
  Trash2,
  Upload,
  Wifi,
  WifiOff,
  Zap
} from 'lucide-react';
import {
  useServiceWorkers,
  useServiceWorkerStats,
  useServiceWorkerConfig,
  useOfflineQueue,
  useSyncTasks,
  useServiceWorkerEvents,
  useServiceWorkerDebug,
  useCacheManagement,
  useServiceWorkerPerformance
} from '../../hooks/useServiceWorkers';
import {
  CacheStrategy,
  OfflineQueue,
  SyncTask,
  ServiceWorkerEvent,
  formatBytes,
  formatDuration,
  getStatusColor,
  getPriorityColor,
  getStrategyIcon,
  getEventTypeIcon
} from '../../utils/serviceWorkers';

const ServiceWorkersManager: React.FC = () => {
  // Hooks
  const serviceWorkers = useServiceWorkers({ autoRegister: true, enableDebug: true });
  const stats = useServiceWorkerStats();
  const { config, updateConfig } = useServiceWorkerConfig();
  const { offlineQueue, pendingItems, failedItems, processOfflineQueue } = useOfflineQueue();
  const { syncTasks, pendingTasks, activeTasks, processSyncTasks } = useSyncTasks();
  const { events, recentEvents, errorEvents } = useServiceWorkerEvents();
  const { debugLogs, recentLogs, errorLogs, isDebugEnabled } = useServiceWorkerDebug();
  const { cacheEntries, cacheSize, cacheStrategies, expiredEntries, optimizeCache } = useCacheManagement();
  const { performance, cacheEfficiency, averageResponseTime } = useServiceWorkerPerformance();

  // Local state
  const [activeTab, setActiveTab] = useState('overview');
  const [showStrategyModal, setShowStrategyModal] = useState(false);
  const [showQueueModal, setShowQueueModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [selectedStrategy, setSelectedStrategy] = useState<CacheStrategy | null>(null);
  const [selectedQueueItem, setSelectedQueueItem] = useState<OfflineQueue | null>(null);
  const [selectedTask, setSelectedTask] = useState<SyncTask | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<ServiceWorkerEvent | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('timestamp');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [searchTerm, setSearchTerm] = useState('');

  // Auto-refresh
  useEffect(() => {
    const interval = setInterval(() => {
      serviceWorkers.getStats();
      serviceWorkers.getMetrics();
    }, 5000);

    return () => clearInterval(interval);
  }, [serviceWorkers]);

  // Generate demo data
  useEffect(() => {
    const generateDemoData = () => {
      // Add demo cache strategies if none exist
      if (cacheStrategies.length === 0) {
        const demoStrategies: CacheStrategy[] = [
          {
            id: 'images',
            name: 'Images',
            pattern: /\.(png|jpg|jpeg|gif|svg)$/,
            strategy: 'cache-first',
            maxAge: 86400000,
            maxEntries: 200,
            enabled: true
          },
          {
            id: 'videos',
            name: 'Videos',
            pattern: /\.(mp4|webm|ogg)$/,
            strategy: 'cache-first',
            maxAge: 604800000,
            maxEntries: 50,
            enabled: true
          }
        ];

        demoStrategies.forEach(strategy => {
          serviceWorkers.addCacheStrategy(strategy);
        });
      }

      // Add demo offline queue items
      if (offlineQueue.length === 0) {
        serviceWorkers.addToOfflineQueue({
          url: '/api/projects/save',
          method: 'POST',
          body: { name: 'Demo Project', data: 'demo data' },
          headers: { 'Content-Type': 'application/json' },
          priority: 'high',
          maxRetries: 3
        });
      }

      // Add demo sync tasks
      if (syncTasks.length === 0) {
        serviceWorkers.addSyncTask({
          type: 'backup',
          data: { projectId: 'demo-project' },
          maxRetries: 3
        });
      }
    };

    const timer = setTimeout(generateDemoData, 1000);
    return () => clearTimeout(timer);
  }, [serviceWorkers, cacheStrategies.length, offlineQueue.length, syncTasks.length]);

  // Filter and sort functions
  const filteredOfflineQueue = useMemo(() => {
    let filtered = offlineQueue;

    if (filterStatus !== 'all') {
      filtered = filtered.filter(item => item.status === filterStatus);
    }

    if (searchTerm) {
      filtered = filtered.filter(item => 
        item.url.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.method.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered.sort((a, b) => {
      const aValue = a[sortBy as keyof OfflineQueue];
      const bValue = b[sortBy as keyof OfflineQueue];
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  }, [offlineQueue, filterStatus, searchTerm, sortBy, sortOrder]);

  const filteredSyncTasks = useMemo(() => {
    let filtered = syncTasks;

    if (filterStatus !== 'all') {
      filtered = filtered.filter(task => task.status === filterStatus);
    }

    if (searchTerm) {
      filtered = filtered.filter(task => 
        task.type.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered.sort((a, b) => {
      const aValue = a[sortBy as keyof SyncTask];
      const bValue = b[sortBy as keyof SyncTask];
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  }, [syncTasks, filterStatus, searchTerm, sortBy, sortOrder]);

  // Status cards data
  const statusCards = [
    {
      title: 'Service Worker',
      value: serviceWorkers.isRegistered ? 'Registered' : 'Not Registered',
      icon: serviceWorkers.isRegistered ? CheckCircle : AlertTriangle,
      color: serviceWorkers.isRegistered ? 'text-green-600' : 'text-red-600',
      bgColor: serviceWorkers.isRegistered ? 'bg-green-50' : 'bg-red-50'
    },
    {
      title: 'Connection',
      value: serviceWorkers.isOnline ? 'Online' : 'Offline',
      icon: serviceWorkers.isOnline ? Wifi : WifiOff,
      color: serviceWorkers.isOnline ? 'text-green-600' : 'text-orange-600',
      bgColor: serviceWorkers.isOnline ? 'bg-green-50' : 'bg-orange-50'
    },
    {
      title: 'Cache Hit Rate',
      value: `${cacheEfficiency.toFixed(1)}%`,
      icon: Zap,
      color: cacheEfficiency > 80 ? 'text-green-600' : cacheEfficiency > 60 ? 'text-yellow-600' : 'text-red-600',
      bgColor: cacheEfficiency > 80 ? 'bg-green-50' : cacheEfficiency > 60 ? 'bg-yellow-50' : 'bg-red-50'
    },
    {
      title: 'Cache Size',
      value: formatBytes(cacheSize),
      icon: HardDrive,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Offline Queue',
      value: pendingItems.length.toString(),
      icon: Clock,
      color: pendingItems.length > 0 ? 'text-orange-600' : 'text-green-600',
      bgColor: pendingItems.length > 0 ? 'bg-orange-50' : 'bg-green-50'
    },
    {
      title: 'Sync Tasks',
      value: activeTasks.length.toString(),
      icon: RefreshCw,
      color: activeTasks.length > 0 ? 'text-blue-600' : 'text-gray-600',
      bgColor: activeTasks.length > 0 ? 'bg-blue-50' : 'bg-gray-50'
    }
  ];

  // Tab configuration
  const tabs = [
    { id: 'overview', label: 'Overview', icon: Globe },
    { id: 'cache', label: 'Cache', icon: HardDrive },
    { id: 'offline', label: 'Offline Queue', icon: WifiOff },
    { id: 'sync', label: 'Sync Tasks', icon: RefreshCw },
    { id: 'events', label: 'Events', icon: Zap },
    { id: 'performance', label: 'Performance', icon: Zap },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'debug', label: 'Debug', icon: Shield }
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Service Workers Manager</h1>
          <p className="text-muted-foreground">
            Manage offline capabilities, caching strategies, and background sync
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            onClick={() => serviceWorkers.register()}
            disabled={serviceWorkers.isRegistered || serviceWorkers.isLoading}
            size="sm"
          >
            <Play className="h-4 w-4 mr-2" />
            Register SW
          </Button>
          <Button
            onClick={() => serviceWorkers.checkForUpdates()}
            disabled={serviceWorkers.isLoading}
            variant="outline"
            size="sm"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Check Updates
          </Button>
          {serviceWorkers.hasUpdates && (
            <Button
              onClick={() => serviceWorkers.installUpdate()}
              size="sm"
              className="bg-orange-600 hover:bg-orange-700"
            >
              <Download className="h-4 w-4 mr-2" />
              Install Update
            </Button>
          )}
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {statusCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <Card key={index}>
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${card.bgColor}`}>
                    <Icon className={`h-5 w-5 ${card.color}`} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{card.title}</p>
                    <p className={`text-lg font-bold ${card.color}`}>{card.value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-8">
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
            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
                <CardDescription>Real-time performance statistics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Cache Hit Rate</span>
                    <span>{cacheEfficiency.toFixed(1)}%</span>
                  </div>
                  <Progress value={cacheEfficiency} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Average Response Time</span>
                    <span>{averageResponseTime.toFixed(0)}ms</span>
                  </div>
                  <Progress value={Math.min(averageResponseTime / 10, 100)} className="h-2" />
                </div>
                <div className="grid grid-cols-2 gap-4 pt-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">{stats.cacheHits}</p>
                    <p className="text-sm text-muted-foreground">Cache Hits</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-red-600">{stats.cacheMisses}</p>
                    <p className="text-sm text-muted-foreground">Cache Misses</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>System Status</CardTitle>
                <CardDescription>Current system state and health</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Service Worker</span>
                  <Badge variant={serviceWorkers.isRegistered ? 'default' : 'destructive'}>
                    {serviceWorkers.isRegistered ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Offline Mode</span>
                  <Badge variant={config.offlineMode ? 'default' : 'secondary'}>
                    {config.offlineMode ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Background Sync</span>
                  <Badge variant={config.backgroundSync ? 'default' : 'secondary'}>
                    {config.backgroundSync ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Cache Strategies</span>
                  <span className="text-sm">{cacheStrategies.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Total Cache Size</span>
                  <span className="text-sm">{formatBytes(cacheSize)}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest events and operations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentEvents.slice(0, 5).map((event) => (
                  <div key={event.id} className="flex items-center space-x-3 p-3 bg-muted rounded-lg">
                    <span className="text-lg">{getEventTypeIcon(event.type)}</span>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{event.type.replace('_', ' ')}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(event.timestamp).toLocaleString()}
                      </p>
                    </div>
                    <Badge variant={event.success ? 'default' : 'destructive'}>
                      {event.success ? 'Success' : 'Failed'}
                    </Badge>
                  </div>
                ))}
                {recentEvents.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">No recent events</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cache Tab */}
        <TabsContent value="cache" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Cache Management</h3>
              <p className="text-sm text-muted-foreground">Manage caching strategies and cached content</p>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                onClick={() => optimizeCache()}
                variant="outline"
                size="sm"
              >
                <Zap className="h-4 w-4 mr-2" />
                Optimize
              </Button>
              <Button
                onClick={() => serviceWorkers.clearAllCaches()}
                variant="outline"
                size="sm"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Clear All
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Cache Strategies</CardTitle>
                <CardDescription>Configure caching behavior for different resource types</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {cacheStrategies.map((strategy) => (
                    <div key={strategy.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <span className="text-lg">{getStrategyIcon(strategy.strategy)}</span>
                        <div>
                          <p className="font-medium">{strategy.name}</p>
                          <p className="text-xs text-muted-foreground">{strategy.strategy}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={strategy.enabled}
                          onCheckedChange={(checked) => {
                            const updatedStrategies = cacheStrategies.map(s => 
                              s.id === strategy.id ? { ...s, enabled: checked } : s
                            );
                            updateConfig({ strategies: updatedStrategies });
                          }}
                        />
                        <Button
                          onClick={() => {
                            setSelectedStrategy(strategy);
                            setShowStrategyModal(true);
                          }}
                          variant="ghost"
                          size="sm"
                        >
                          <Settings className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {cacheStrategies.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">No cache strategies configured</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cache Statistics</CardTitle>
                <CardDescription>Current cache usage and performance</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <p className="text-2xl font-bold">{cacheEntries.length}</p>
                    <p className="text-sm text-muted-foreground">Cached Items</p>
                  </div>
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <p className="text-2xl font-bold">{formatBytes(cacheSize)}</p>
                    <p className="text-sm text-muted-foreground">Total Size</p>
                  </div>
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <p className="text-2xl font-bold">{expiredEntries.length}</p>
                    <p className="text-sm text-muted-foreground">Expired</p>
                  </div>
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <p className="text-2xl font-bold">{cacheEfficiency.toFixed(1)}%</p>
                    <p className="text-sm text-muted-foreground">Hit Rate</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Cache Usage</span>
                    <span>{((cacheSize / config.maxCacheSize) * 100).toFixed(1)}%</span>
                  </div>
                  <Progress value={(cacheSize / config.maxCacheSize) * 100} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Offline Queue Tab */}
        <TabsContent value="offline" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Offline Queue</h3>
              <p className="text-sm text-muted-foreground">Manage requests queued while offline</p>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                onClick={() => processOfflineQueue()}
                disabled={pendingItems.length === 0}
                size="sm"
              >
                <Play className="h-4 w-4 mr-2" />
                Process Queue
              </Button>
              <Button
                onClick={() => serviceWorkers.retryFailedTasks()}
                disabled={failedItems.length === 0}
                variant="outline"
                size="sm"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry Failed
              </Button>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Queue Items</CardTitle>
              <CardDescription>Requests waiting to be processed</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <Input
                    placeholder="Search requests..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="max-w-sm"
                  />
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="processing">Processing</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>URL</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Retries</TableHead>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOfflineQueue.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-mono text-sm">
                          {item.url.length > 40 ? `${item.url.substring(0, 40)}...` : item.url}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{item.method}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getPriorityColor(item.priority)}>
                            {item.priority}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(item.status)}>
                            {item.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{item.retries}/{item.maxRetries}</TableCell>
                        <TableCell className="text-sm">
                          {new Date(item.timestamp).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Button
                            onClick={() => {
                              setSelectedQueueItem(item);
                              setShowQueueModal(true);
                            }}
                            variant="ghost"
                            size="sm"
                          >
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {filteredOfflineQueue.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">No queue items found</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sync Tasks Tab */}
        <TabsContent value="sync" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Background Sync</h3>
              <p className="text-sm text-muted-foreground">Manage background synchronization tasks</p>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                onClick={() => processSyncTasks()}
                disabled={pendingTasks.length === 0}
                size="sm"
              >
                <Play className="h-4 w-4 mr-2" />
                Process Tasks
              </Button>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Sync Tasks</CardTitle>
              <CardDescription>Background synchronization operations</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Retries</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSyncTasks.map((task) => (
                    <TableRow key={task.id}>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Upload className="h-4 w-4" />
                          <span className="capitalize">{task.type}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(task.status)}>
                          {task.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Progress value={task.progress} className="w-20 h-2" />
                          <span className="text-sm">{task.progress}%</span>
                        </div>
                      </TableCell>
                      <TableCell>{task.retries}/{task.maxRetries}</TableCell>
                      <TableCell className="text-sm">
                        {new Date(task.timestamp).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Button
                          onClick={() => {
                            setSelectedTask(task);
                            setShowTaskModal(true);
                          }}
                          variant="ghost"
                          size="sm"
                        >
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {filteredSyncTasks.length === 0 && (
                <p className="text-center text-muted-foreground py-8">No sync tasks found</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Events Tab */}
        <TabsContent value="events" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Service Worker Events</CardTitle>
              <CardDescription>Real-time events and operations log</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentEvents.map((event) => (
                  <div key={event.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <span className="text-lg">{getEventTypeIcon(event.type)}</span>
                      <div>
                        <p className="font-medium">{event.type.replace('_', ' ')}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(event.timestamp).toLocaleString()}
                        </p>
                        {event.url && (
                          <p className="text-xs text-muted-foreground font-mono">{event.url}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={event.success ? 'default' : 'destructive'}>
                        {event.success ? 'Success' : 'Failed'}
                      </Badge>
                      {event.duration && (
                        <Badge variant="outline">
                          {formatDuration(event.duration)}
                        </Badge>
                      )}
                      <Button
                        onClick={() => {
                          setSelectedEvent(event);
                          setShowEventModal(true);
                        }}
                        variant="ghost"
                        size="sm"
                      >
                        View
                      </Button>
                    </div>
                  </div>
                ))}
                {recentEvents.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">No events recorded</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance Analysis</CardTitle>
                <CardDescription>Detailed performance metrics and insights</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Cache Hit Rate</span>
                    <span className="text-sm">{performance.cacheHitRate?.toFixed(1) || 0}%</span>
                  </div>
                  <Progress value={performance.cacheHitRate || 0} className="h-2" />
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Average Response Time</span>
                    <span className="text-sm">{performance.averageResponseTime?.toFixed(0) || 0}ms</span>
                  </div>
                  <Progress value={Math.min((performance.averageResponseTime || 0) / 10, 100)} className="h-2" />
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Error Rate</span>
                    <span className="text-sm">{performance.errorRate?.toFixed(1) || 0}%</span>
                  </div>
                  <Progress value={performance.errorRate || 0} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Most Accessed Resources</CardTitle>
                <CardDescription>Top cached resources by access count</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {performance.mostAccessedResources?.slice(0, 5).map((resource, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                      <span className="text-sm font-mono truncate flex-1 mr-2">
                        {resource.url.length > 30 ? `${resource.url.substring(0, 30)}...` : resource.url}
                      </span>
                      <Badge variant="outline">{resource.hits} hits</Badge>
                    </div>
                  )) || (
                    <p className="text-center text-muted-foreground py-8">No data available</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Service Worker Configuration</CardTitle>
              <CardDescription>Configure service worker behavior and settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="offline-mode">Offline Mode</Label>
                      <p className="text-sm text-muted-foreground">Enable offline functionality</p>
                    </div>
                    <Switch
                      id="offline-mode"
                      checked={config.offlineMode}
                      onCheckedChange={(checked) => updateConfig({ offlineMode: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="background-sync">Background Sync</Label>
                      <p className="text-sm text-muted-foreground">Enable background synchronization</p>
                    </div>
                    <Switch
                      id="background-sync"
                      checked={config.backgroundSync}
                      onCheckedChange={(checked) => updateConfig({ backgroundSync: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="push-notifications">Push Notifications</Label>
                      <p className="text-sm text-muted-foreground">Enable push notifications</p>
                    </div>
                    <Switch
                      id="push-notifications"
                      checked={config.pushNotifications}
                      onCheckedChange={(checked) => updateConfig({ pushNotifications: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="debug-mode">Debug Mode</Label>
                      <p className="text-sm text-muted-foreground">Enable debug logging</p>
                    </div>
                    <Switch
                      id="debug-mode"
                      checked={config.debug}
                      onCheckedChange={(checked) => updateConfig({ debug: checked })}
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="cache-version">Cache Version</Label>
                    <Input
                      id="cache-version"
                      value={config.cacheVersion}
                      onChange={(e) => updateConfig({ cacheVersion: e.target.value })}
                      placeholder="1.0.0"
                    />
                  </div>
                  <div>
                    <Label htmlFor="max-cache-size">Max Cache Size (MB)</Label>
                    <Input
                      id="max-cache-size"
                      type="number"
                      value={config.maxCacheSize / (1024 * 1024)}
                      onChange={(e) => updateConfig({ maxCacheSize: parseInt(e.target.value) * 1024 * 1024 })}
                      placeholder="50"
                    />
                  </div>
                  <div>
                    <Label htmlFor="update-interval">Update Interval (ms)</Label>
                    <Input
                      id="update-interval"
                      type="number"
                      value={config.updateInterval}
                      onChange={(e) => updateConfig({ updateInterval: parseInt(e.target.value) })}
                      placeholder="60000"
                    />
                  </div>
                  <div>
                    <Label htmlFor="cleanup-interval">Cleanup Interval (ms)</Label>
                    <Input
                      id="cleanup-interval"
                      type="number"
                      value={config.cleanupInterval}
                      onChange={(e) => updateConfig({ cleanupInterval: parseInt(e.target.value) })}
                      placeholder="300000"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Debug Tab */}
        <TabsContent value="debug" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Debug Information</h3>
              <p className="text-sm text-muted-foreground">System logs and debugging tools</p>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                onClick={() => serviceWorkers.clearDebugLogs()}
                variant="outline"
                size="sm"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Clear Logs
              </Button>
              <Button
                onClick={() => {
                  const report = serviceWorkers.generateReport();
                  const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `sw-report-${Date.now()}.json`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                size="sm"
              >
                <Download className="h-4 w-4 mr-2" />
                Export Report
              </Button>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Debug Logs</CardTitle>
              <CardDescription>System logs and error messages</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {recentLogs.map((log) => (
                  <div key={log.id} className={`p-3 rounded text-sm font-mono ${
                    log.level === 'error' ? 'bg-red-50 text-red-800' :
                    log.level === 'warn' ? 'bg-yellow-50 text-yellow-800' :
                    log.level === 'info' ? 'bg-blue-50 text-blue-800' :
                    'bg-gray-50 text-gray-800'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className="font-bold uppercase">{log.level}</span>
                      <span className="text-xs">{new Date(log.timestamp).toLocaleString()}</span>
                    </div>
                    <p className="mt-1">{log.message}</p>
                    {log.data && (
                      <pre className="mt-2 text-xs overflow-x-auto">
                        {JSON.stringify(log.data, null, 2)}
                      </pre>
                    )}
                  </div>
                ))}
                {recentLogs.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">No debug logs available</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Strategy Details Modal */}
      <Dialog open={showStrategyModal} onOpenChange={setShowStrategyModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cache Strategy Details</DialogTitle>
            <DialogDescription>
              Configure caching behavior for this resource type
            </DialogDescription>
          </DialogHeader>
          {selectedStrategy && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Strategy Name</Label>
                  <p className="font-medium">{selectedStrategy.name}</p>
                </div>
                <div>
                  <Label>Strategy Type</Label>
                  <p className="font-medium">{selectedStrategy.strategy}</p>
                </div>
                <div>
                  <Label>Max Age</Label>
                  <p className="font-medium">{formatDuration(selectedStrategy.maxAge)}</p>
                </div>
                <div>
                  <Label>Max Entries</Label>
                  <p className="font-medium">{selectedStrategy.maxEntries}</p>
                </div>
              </div>
              <div>
                <Label>URL Pattern</Label>
                <p className="font-mono text-sm bg-muted p-2 rounded">
                  {selectedStrategy.pattern.toString()}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={selectedStrategy.enabled}
                  onCheckedChange={(checked) => {
                    const updatedStrategies = cacheStrategies.map(s => 
                      s.id === selectedStrategy.id ? { ...s, enabled: checked } : s
                    );
                    updateConfig({ strategies: updatedStrategies });
                    setSelectedStrategy({ ...selectedStrategy, enabled: checked });
                  }}
                />
                <Label>Enabled</Label>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Queue Item Details Modal */}
      <Dialog open={showQueueModal} onOpenChange={setShowQueueModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Offline Queue Item</DialogTitle>
            <DialogDescription>
              Details of the queued request
            </DialogDescription>
          </DialogHeader>
          {selectedQueueItem && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>URL</Label>
                  <p className="font-mono text-sm break-all">{selectedQueueItem.url}</p>
                </div>
                <div>
                  <Label>Method</Label>
                  <p className="font-medium">{selectedQueueItem.method}</p>
                </div>
                <div>
                  <Label>Priority</Label>
                  <Badge className={getPriorityColor(selectedQueueItem.priority)}>
                    {selectedQueueItem.priority}
                  </Badge>
                </div>
                <div>
                  <Label>Status</Label>
                  <Badge className={getStatusColor(selectedQueueItem.status)}>
                    {selectedQueueItem.status}
                  </Badge>
                </div>
                <div>
                  <Label>Retries</Label>
                  <p>{selectedQueueItem.retries}/{selectedQueueItem.maxRetries}</p>
                </div>
                <div>
                  <Label>Timestamp</Label>
                  <p className="text-sm">{new Date(selectedQueueItem.timestamp).toLocaleString()}</p>
                </div>
              </div>
              {selectedQueueItem.body && (
                <div>
                  <Label>Request Body</Label>
                  <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
                    {JSON.stringify(selectedQueueItem.body, null, 2)}
                  </pre>
                </div>
              )}
              {Object.keys(selectedQueueItem.headers).length > 0 && (
                <div>
                  <Label>Headers</Label>
                  <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
                    {JSON.stringify(selectedQueueItem.headers, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Sync Task Details Modal */}
      <Dialog open={showTaskModal} onOpenChange={setShowTaskModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sync Task Details</DialogTitle>
            <DialogDescription>
              Background synchronization task information
            </DialogDescription>
          </DialogHeader>
          {selectedTask && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Task ID</Label>
                  <p className="font-mono text-sm">{selectedTask.id}</p>
                </div>
                <div>
                  <Label>Type</Label>
                  <p className="font-medium capitalize">{selectedTask.type}</p>
                </div>
                <div>
                  <Label>Status</Label>
                  <Badge className={getStatusColor(selectedTask.status)}>
                    {selectedTask.status}
                  </Badge>
                </div>
                <div>
                  <Label>Progress</Label>
                  <div className="flex items-center space-x-2">
                    <Progress value={selectedTask.progress} className="flex-1" />
                    <span className="text-sm">{selectedTask.progress}%</span>
                  </div>
                </div>
                <div>
                  <Label>Retries</Label>
                  <p>{selectedTask.retries}/{selectedTask.maxRetries}</p>
                </div>
                <div>
                  <Label>Created</Label>
                  <p className="text-sm">{new Date(selectedTask.timestamp).toLocaleString()}</p>
                </div>
              </div>
              {selectedTask.error && (
                <div>
                  <Label>Error</Label>
                  <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{selectedTask.error}</p>
                </div>
              )}
              {selectedTask.data && (
                <div>
                  <Label>Task Data</Label>
                  <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
                    {JSON.stringify(selectedTask.data, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Event Details Modal */}
      <Dialog open={showEventModal} onOpenChange={setShowEventModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Event Details</DialogTitle>
            <DialogDescription>
              Service worker event information
            </DialogDescription>
          </DialogHeader>
          {selectedEvent && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Event ID</Label>
                  <p className="font-mono text-sm">{selectedEvent.id}</p>
                </div>
                <div>
                  <Label>Type</Label>
                  <div className="flex items-center space-x-2">
                    <span>{getEventTypeIcon(selectedEvent.type)}</span>
                    <span className="font-medium">{selectedEvent.type.replace('_', ' ')}</span>
                  </div>
                </div>
                <div>
                  <Label>Success</Label>
                  <Badge variant={selectedEvent.success ? 'default' : 'destructive'}>
                    {selectedEvent.success ? 'Success' : 'Failed'}
                  </Badge>
                </div>
                <div>
                  <Label>Timestamp</Label>
                  <p className="text-sm">{new Date(selectedEvent.timestamp).toLocaleString()}</p>
                </div>
              </div>
              {selectedEvent.url && (
                <div>
                  <Label>URL</Label>
                  <p className="font-mono text-sm break-all">{selectedEvent.url}</p>
                </div>
              )}
              {selectedEvent.duration && (
                <div>
                  <Label>Duration</Label>
                  <p className="text-sm">{formatDuration(selectedEvent.duration)}</p>
                </div>
              )}
              {selectedEvent.data && (
                <div>
                  <Label>Event Data</Label>
                  <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
                    {JSON.stringify(selectedEvent.data, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Error Modal */}
      <Dialog open={showErrorModal} onOpenChange={setShowErrorModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <span>Error</span>
            </DialogTitle>
            <DialogDescription>
              An error occurred while processing your request
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-red-50 border border-red-200 rounded">
              <p className="text-red-800">{errorMessage}</p>
            </div>
            <div className="flex justify-end">
              <Button onClick={() => setShowErrorModal(false)}>
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ServiceWorkersManager;