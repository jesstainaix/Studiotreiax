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
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Switch } from '../ui/switch';
import { Textarea } from '../ui/textarea';
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Download,
  FileImage,
  FileVideo,
  FileAudio,
  FileText,
  Zap,
  Settings,
  BarChart3,
  Activity,
  Users,
  Database,
  Cpu,
  HardDrive,
  Wifi,
  RefreshCw,
  Play,
  Pause,
  Square,
  Trash2,
  Upload,
  Eye,
  Filter,
  Search,
  MoreHorizontal,
  TrendingUp,
  TrendingDown,
  Minus,
  X
} from 'lucide-react';
import {
  useAssetOptimization,
  useAssetOptimizationStats,
  useAssetOptimizationConfig,
  useAssetOptimizationAssets,
  useAssetOptimizationTasks,
  useAssetOptimizationEvents,
  useAssetOptimizationMetrics,
  useAssetOptimizationDebug,
  useAssetUpload,
  useAssetPreloader,
  useAssetPerformance
} from '../../hooks/useAssetOptimization';
import {
  Asset,
  OptimizationTask,
  AssetOptimizationEvent,
  PreloadStrategy,
  formatBytes,
  formatDuration,
  getAssetTypeColor,
  getPriorityColor,
  getStatusColor,
  getAssetTypeIcon,
  getCompressionIcon
} from '../../utils/assetOptimization';

const AssetOptimizationManager: React.FC = () => {
  // Hooks
  const assetOptimization = useAssetOptimization({ autoRefresh: true });
  const { stats } = useAssetOptimizationStats();
  const { config, updateConfig } = useAssetOptimizationConfig();
  const { assets } = useAssetOptimizationAssets();
  const { tasks, activeTasks, completedTasks, failedTasks } = useAssetOptimizationTasks();
  const { events, recentEvents } = useAssetOptimizationEvents();
  const { metrics, compressionSummary, performanceMetrics } = useAssetOptimizationMetrics();
  const { debugLogs, isDebugEnabled, enableDebug, disableDebug } = useAssetOptimizationDebug();
  const { uploadAsset, isUploading, uploadProgress } = useAssetUpload();
  const { preloadAsset, isPreloading } = useAssetPreloader();
  const { currentMetrics, performanceHistory, getPerformanceTrend } = useAssetPerformance();

  // Local state
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [selectedTask, setSelectedTask] = useState<OptimizationTask | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<AssetOptimizationEvent | null>(null);
  const [selectedStrategy, setSelectedStrategy] = useState<PreloadStrategy | null>(null);
  const [showAssetModal, setShowAssetModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showStrategyModal, setShowStrategyModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<Asset['type'] | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<Asset['status'] | 'all'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'size' | 'date' | 'priority'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(5000);

  // Auto-refresh effect
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      // Trigger refresh by updating a key
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval]);

  // Demo data generation
  useEffect(() => {
    const generateDemoData = () => {
      if (assets.length === 0) {
        const demoAssets = [
          {
            url: '/images/hero-banner.jpg',
            type: 'image' as const,
            size: 2500000,
            format: 'jpeg',
            quality: 85,
            priority: 'high' as const,
            loadStrategy: 'eager' as const,
            status: 'optimized' as const
          },
          {
            url: '/videos/intro.mp4',
            type: 'video' as const,
            size: 15000000,
            format: 'mp4',
            quality: 80,
            priority: 'medium' as const,
            loadStrategy: 'lazy' as const,
            status: 'pending' as const
          },
          {
            url: '/fonts/inter.woff2',
            type: 'font' as const,
            size: 180000,
            format: 'woff2',
            quality: 100,
            priority: 'critical' as const,
            loadStrategy: 'preload' as const,
            status: 'optimized' as const
          }
        ];

        demoAssets.forEach(asset => {
          assetOptimization.addAsset(asset);
        });
      }
    };

    const timer = setTimeout(generateDemoData, 1000);
    return () => clearTimeout(timer);
  }, [assets.length, assetOptimization]);

  // Filter and sort assets
  const filteredAndSortedAssets = useMemo(() => {
    let filtered = assets;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(asset => 
        asset.url.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply type filter
    if (filterType !== 'all') {
      filtered = filtered.filter(asset => asset.type === filterType);
    }

    // Apply status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(asset => asset.status === filterStatus);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortBy) {
        case 'name':
          aValue = a.url;
          bValue = b.url;
          break;
        case 'size':
          aValue = a.size;
          bValue = b.size;
          break;
        case 'date':
          aValue = a.lastModified;
          bValue = b.lastModified;
          break;
        case 'priority':
          const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
          aValue = priorityOrder[a.priority];
          bValue = priorityOrder[b.priority];
          break;
        default:
          return 0;
      }

      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    return filtered;
  }, [assets, searchTerm, filterType, filterStatus, sortBy, sortOrder]);

  // Status cards data
  const statusCards = [
    {
      title: 'Total Assets',
      value: stats.totalAssets.toString(),
      icon: Database,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Optimized',
      value: stats.optimizedAssets.toString(),
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Total Savings',
      value: formatBytes(stats.totalSavings),
      icon: TrendingDown,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      title: 'Active Tasks',
      value: activeTasks.length.toString(),
      icon: Activity,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    }
  ];

  // Tab configuration
  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'assets', label: 'Assets', icon: FileImage },
    { id: 'tasks', label: 'Tasks', icon: Activity },
    { id: 'compression', label: 'Compression', icon: Zap },
    { id: 'preload', label: 'Preload', icon: Download },
    { id: 'performance', label: 'Performance', icon: TrendingUp },
    { id: 'events', label: 'Events', icon: Clock },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'debug', label: 'Debug', icon: Cpu }
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Asset Optimization</h1>
          <p className="text-gray-600 mt-1">
            Intelligent asset compression and preloading system
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
            Auto Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={assetOptimization.start}
            disabled={assetOptimization.isOptimizing}
          >
            <Play className="h-4 w-4 mr-2" />
            Start
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={assetOptimization.stop}
          >
            <Pause className="h-4 w-4 mr-2" />
            Stop
          </Button>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statusCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{card.title}</p>
                    <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                  </div>
                  <div className={`p-3 rounded-full ${card.bgColor}`}>
                    <Icon className={`h-6 w-6 ${card.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
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
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Compression Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Zap className="h-5 w-5" />
                  <span>Compression Summary</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Original Size</span>
                    <span className="font-medium">{formatBytes(compressionSummary.totalOriginalSize)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Compressed Size</span>
                    <span className="font-medium">{formatBytes(compressionSummary.totalCompressedSize)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Total Savings</span>
                    <span className="font-medium text-green-600">{formatBytes(compressionSummary.totalSavings)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Average Ratio</span>
                    <span className="font-medium">{(compressionSummary.averageRatio * 100).toFixed(1)}%</span>
                  </div>
                </div>
                <Progress 
                  value={compressionSummary.averageRatio * 100} 
                  className="h-2" 
                />
              </CardContent>
            </Card>

            {/* Performance Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5" />
                  <span>Performance Metrics</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Optimization Rate</span>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{(performanceMetrics.optimizationRate * 100).toFixed(1)}%</span>
                      {getPerformanceTrend('optimizationRate') === 'improving' && <TrendingUp className="h-4 w-4 text-green-500" />}
                      {getPerformanceTrend('optimizationRate') === 'declining' && <TrendingDown className="h-4 w-4 text-red-500" />}
                      {getPerformanceTrend('optimizationRate') === 'stable' && <Minus className="h-4 w-4 text-gray-500" />}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Avg. Optimization Time</span>
                    <span className="font-medium">{formatDuration(performanceMetrics.averageOptimizationTime)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Success Rate</span>
                    <span className="font-medium">{(performanceMetrics.successRate * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Cache Efficiency</span>
                    <span className="font-medium">{(performanceMetrics.cacheEfficiency * 100).toFixed(1)}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Events */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="h-5 w-5" />
                <span>Recent Events</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {recentEvents.slice(0, 5).map((event) => (
                  <div key={event.id} className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
                    <div className="flex items-center space-x-3">
                      <div className={`w-2 h-2 rounded-full ${
                        event.success ? 'bg-green-500' : 'bg-red-500'
                      }`} />
                      <span className="text-sm font-medium">{event.type.replace('_', ' ')}</span>
                      {event.assetId && (
                        <Badge variant="outline" className="text-xs">
                          {event.assetId.slice(0, 8)}...
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(event.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Assets Tab */}
        <TabsContent value="assets" className="space-y-4">
          {/* Filters and Search */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex-1 min-w-[200px]">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search assets..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={filterType} onValueChange={(value: any) => setFilterType(value)}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="image">Images</SelectItem>
                    <SelectItem value="video">Videos</SelectItem>
                    <SelectItem value="audio">Audio</SelectItem>
                    <SelectItem value="font">Fonts</SelectItem>
                    <SelectItem value="script">Scripts</SelectItem>
                    <SelectItem value="style">Styles</SelectItem>
                    <SelectItem value="document">Documents</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterStatus} onValueChange={(value: any) => setFilterStatus(value)}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="optimizing">Optimizing</SelectItem>
                    <SelectItem value="optimized">Optimized</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="cached">Cached</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="Sort" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Name</SelectItem>
                    <SelectItem value="size">Size</SelectItem>
                    <SelectItem value="date">Date</SelectItem>
                    <SelectItem value="priority">Priority</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                >
                  {sortOrder === 'asc' ? 'Asc' : 'Desc'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Assets List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Assets ({filteredAndSortedAssets.length})</span>
                <div className="flex items-center space-x-2">
                  <Button
                    size="sm"
                    onClick={() => assetOptimization.optimizeAll()}
                    disabled={assetOptimization.isOptimizing}
                  >
                    <Zap className="h-4 w-4 mr-2" />
                    Optimize All
                  </Button>
                  <input
                    type="file"
                    multiple
                    accept="image/*,video/*,audio/*"
                    onChange={async (e) => {
                      const files = Array.from(e.target.files || []);
                      for (const file of files) {
                        await uploadAsset(file, { autoOptimize: true });
                      }
                    }}
                    className="hidden"
                    id="asset-upload"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => document.getElementById('asset-upload')?.click()}
                    disabled={isUploading}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {filteredAndSortedAssets.map((asset) => (
                  <div key={asset.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50">
                    <div className="flex items-center space-x-3">
                      <div className="text-2xl">{getAssetTypeIcon(asset.type)}</div>
                      <div>
                        <div className="font-medium text-sm">{asset.url.split('/').pop()}</div>
                        <div className="text-xs text-gray-500">
                          {formatBytes(asset.size)} • {asset.format} • {asset.type}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Badge className={getPriorityColor(asset.priority)}>
                        {asset.priority}
                      </Badge>
                      <Badge className={getStatusColor(asset.status)}>
                        {asset.status}
                      </Badge>
                      {asset.compressionRatio && (
                        <div className="flex items-center space-x-1">
                          <span className="text-lg">{getCompressionIcon(asset.compressionRatio)}</span>
                          <span className="text-xs text-green-600">
                            {(asset.compressionRatio * 100).toFixed(0)}%
                          </span>
                        </div>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedAsset(asset);
                          setShowAssetModal(true);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => assetOptimization.optimizeAsset(asset.id)}
                        disabled={asset.status === 'optimizing'}
                      >
                        <Zap className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tasks Tab */}
        <TabsContent value="tasks" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Active Tasks */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Active Tasks ({activeTasks.length})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {activeTasks.map((task) => (
                  <div key={task.id} className="p-3 rounded-lg border">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">{task.type}</span>
                      <Badge className="bg-blue-100 text-blue-800">{task.status}</Badge>
                    </div>
                    <Progress value={task.progress} className="h-2 mb-2" />
                    <div className="text-xs text-gray-500">
                      {task.progress}% • {formatDuration(Date.now() - task.startTime)}
                    </div>
                  </div>
                ))}
                {activeTasks.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">No active tasks</p>
                )}
              </CardContent>
            </Card>

            {/* Completed Tasks */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Completed ({completedTasks.length})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {completedTasks.slice(-5).map((task) => (
                  <div key={task.id} className="p-3 rounded-lg border">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">{task.type}</span>
                      <Badge className="bg-green-100 text-green-800">{task.status}</Badge>
                    </div>
                    {task.result && (
                      <div className="text-xs text-gray-500">
                        Saved {formatBytes(task.result.savings)} • {formatDuration((task.endTime || 0) - task.startTime)}
                      </div>
                    )}
                  </div>
                ))}
                {completedTasks.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">No completed tasks</p>
                )}
              </CardContent>
            </Card>

            {/* Failed Tasks */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Failed ({failedTasks.length})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {failedTasks.slice(-5).map((task) => (
                  <div key={task.id} className="p-3 rounded-lg border">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">{task.type}</span>
                      <Badge className="bg-red-100 text-red-800">{task.status}</Badge>
                    </div>
                    <div className="text-xs text-red-600">
                      {task.error}
                    </div>
                  </div>
                ))}
                {failedTasks.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">No failed tasks</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* General Settings */}
            <Card>
              <CardHeader>
                <CardTitle>General Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="auto-optimize">Auto Optimize</Label>
                  <Switch
                    id="auto-optimize"
                    checked={config.autoOptimize}
                    onCheckedChange={(checked) => updateConfig({ autoOptimize: checked })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="batch-size">Batch Size</Label>
                  <Input
                    id="batch-size"
                    type="number"
                    value={config.batchSize}
                    onChange={(e) => updateConfig({ batchSize: parseInt(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="concurrency">Concurrency</Label>
                  <Input
                    id="concurrency"
                    type="number"
                    value={config.concurrency}
                    onChange={(e) => updateConfig({ concurrency: parseInt(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quality-threshold">Quality Threshold</Label>
                  <Input
                    id="quality-threshold"
                    type="number"
                    step="0.01"
                    min="0"
                    max="1"
                    value={config.qualityThreshold}
                    onChange={(e) => updateConfig({ qualityThreshold: parseFloat(e.target.value) })}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Debug Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Debug Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="debug-mode">Debug Mode</Label>
                  <Switch
                    id="debug-mode"
                    checked={isDebugEnabled}
                    onCheckedChange={(checked) => checked ? enableDebug() : disableDebug()}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Debug Logs ({debugLogs.length})</Label>
                  <div className="max-h-40 overflow-y-auto border rounded p-2 text-xs font-mono">
                    {debugLogs.slice(-10).map((log) => (
                      <div key={log.id} className={`mb-1 ${
                        log.level === 'error' ? 'text-red-600' :
                        log.level === 'warn' ? 'text-yellow-600' :
                        log.level === 'info' ? 'text-blue-600' :
                        'text-gray-600'
                      }`}>
                        [{new Date(log.timestamp).toLocaleTimeString()}] {log.level.toUpperCase()}: {log.message}
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Asset Details Modal */}
      <Dialog open={showAssetModal} onOpenChange={setShowAssetModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Asset Details</DialogTitle>
            <DialogDescription>
              Detailed information about the selected asset
            </DialogDescription>
          </DialogHeader>
          {selectedAsset && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">URL</Label>
                  <p className="text-sm text-gray-600">{selectedAsset.url}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Type</Label>
                  <p className="text-sm text-gray-600">{selectedAsset.type}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Size</Label>
                  <p className="text-sm text-gray-600">{formatBytes(selectedAsset.size)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Format</Label>
                  <p className="text-sm text-gray-600">{selectedAsset.format}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Priority</Label>
                  <Badge className={getPriorityColor(selectedAsset.priority)}>
                    {selectedAsset.priority}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <Badge className={getStatusColor(selectedAsset.status)}>
                    {selectedAsset.status}
                  </Badge>
                </div>
              </div>
              {selectedAsset.compressionRatio && (
                <div>
                  <Label className="text-sm font-medium">Compression</Label>
                  <div className="mt-1">
                    <div className="flex items-center justify-between text-sm">
                      <span>Original: {formatBytes(selectedAsset.size)}</span>
                      <span>Compressed: {formatBytes(selectedAsset.compressedSize || 0)}</span>
                    </div>
                    <Progress value={selectedAsset.compressionRatio * 100} className="h-2 mt-2" />
                    <p className="text-xs text-gray-500 mt-1">
                      {(selectedAsset.compressionRatio * 100).toFixed(1)}% compression ratio
                    </p>
                  </div>
                </div>
              )}
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setShowAssetModal(false)}
                >
                  Close
                </Button>
                <Button
                  onClick={() => {
                    assetOptimization.optimizeAsset(selectedAsset.id);
                    setShowAssetModal(false);
                  }}
                  disabled={selectedAsset.status === 'optimizing'}
                >
                  <Zap className="h-4 w-4 mr-2" />
                  Optimize
                </Button>
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
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <span>Error</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">{errorMessage}</p>
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

export default AssetOptimizationManager;