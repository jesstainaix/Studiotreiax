import React, { useState, useEffect, useMemo } from 'react';
import {
  Activity,
  Package,
  Zap,
  Settings,
  BarChart3,
  FileText,
  Clock,
  Download,
  Upload,
  Cpu,
  HardDrive,
  Wifi,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Play,
  Pause,
  RotateCcw,
  Trash2,
  Eye,
  EyeOff,
  Filter,
  Search,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Minimize2,
  Maximize2,
  Info,
  X
} from 'lucide-react';
import {
  useBundleOptimization,
  useBundleOptimizationStats,
  useBundleOptimizationConfig,
  useBundleOptimizationChunks,
  useBundleOptimizationModules,
  useBundleOptimizationStrategies,
  useBundleOptimizationAnalyses,
  useBundleOptimizationEvents,
  useBundleOptimizationDebug,
  useBundlePerformance,
  useBundleOptimizer
} from '../../hooks/useBundleOptimization';
import { BundleChunk, ModuleInfo, LoadingStrategy, BundleAnalysis, BundleEvent } from '../../utils/bundleOptimization';

interface BundleOptimizationManagerProps {
  className?: string;
}

const BundleOptimizationManager = React.memo<BundleOptimizationManagerProps>(({ className = '' }) => {
  const {
    chunks,
    modules,
    strategies,
    analyses,
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
  } = useBundleOptimization();
  
  const { stats } = useBundleOptimizationStats();
  const { performanceMetrics, recommendations } = useBundlePerformance();
  const { runFullOptimization, runSizeOptimization, runPerformanceOptimization } = useBundleOptimizer();
  
  // Local state
  const [activeTab, setActiveTab] = useState<'overview' | 'chunks' | 'modules' | 'strategies' | 'analyses' | 'performance' | 'events' | 'settings' | 'debug'>('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'critical' | 'high' | 'medium' | 'low'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'size' | 'loadTime' | 'priority'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [selectedChunk, setSelectedChunk] = useState<BundleChunk | null>(null);
  const [selectedModule, setSelectedModule] = useState<ModuleInfo | null>(null);
  const [selectedStrategy, setSelectedStrategy] = useState<LoadingStrategy | null>(null);
  const [selectedAnalysis, setSelectedAnalysis] = useState<BundleAnalysis | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<BundleEvent | null>(null);
  const [showError, setShowError] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  
  // Auto-refresh effect
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        analytics.refresh();
      }, 5000);
      
      return () => clearInterval(interval);
    }
  }, [autoRefresh, analytics]);
  
  // Generate demo data effect
  useEffect(() => {
    if (events.length === 0) {
      // Generate some demo events
      const demoEvents = [
        {
          type: 'chunk_loaded' as const,
          timestamp: Date.now() - 300000,
          metadata: { chunkId: 'main', loadTime: 120 }
        },
        {
          type: 'optimization_applied' as const,
          timestamp: Date.now() - 240000,
          metadata: { action: 'code_splitting' }
        },
        {
          type: 'analysis_completed' as const,
          timestamp: Date.now() - 180000,
          metadata: { analysisId: 'perf-001', recommendations: 3 }
        },
        {
          type: 'cache_hit' as const,
          timestamp: Date.now() - 120000,
          metadata: { chunkId: 'vendor', cacheType: 'memory' }
        },
        {
          type: 'bundle_optimized' as const,
          timestamp: Date.now() - 60000,
          metadata: { sizeBefore: 800000, sizeAfter: 600000 }
        }
      ];
      
      demoEvents.forEach(event => actions.trackEvent(event));
    }
  }, [events.length, actions]);
  
  // Filter and sort functions
  const filteredChunks = useMemo(() => {
    const filtered = chunks.filter(chunk => {
      const matchesSearch = chunk.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = filterType === 'all' || chunk.priority === filterType;
      return matchesSearch && matchesFilter;
    });
    
    return filtered.sort((a, b) => {
      let aValue: any = a[sortBy];
      let bValue: any = b[sortBy];
      
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }
      
      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });
  }, [chunks, searchTerm, filterType, sortBy, sortOrder]);
  
  const filteredModules = useMemo(() => {
    return modules.filter(module => 
      module.path.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [modules, searchTerm]);
  
  const filteredStrategies = useMemo(() => {
    return strategies.filter(strategy => 
      strategy.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [strategies, searchTerm]);
  
  const filteredEvents = useMemo(() => {
    return events.filter(event => 
      event.type.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [events, searchTerm]);
  
  // Status cards data
  const statusCards = [
    {
      title: 'Total Bundle Size',
      value: utils.formatBytes(stats.totalSize),
      icon: Package,
      color: stats.totalSize > 2000000 ? 'text-red-500' : 'text-green-500',
      bgColor: stats.totalSize > 2000000 ? 'bg-red-50' : 'bg-green-50'
    },
    {
      title: 'Compression Ratio',
      value: `${(stats.compressionRatio * 100).toFixed(1)}%`,
      icon: Minimize2,
      color: stats.compressionRatio > 0.3 ? 'text-green-500' : 'text-yellow-500',
      bgColor: stats.compressionRatio > 0.3 ? 'bg-green-50' : 'bg-yellow-50'
    },
    {
      title: 'Cache Hit Rate',
      value: `${(stats.cacheHitRate * 100).toFixed(1)}%`,
      icon: HardDrive,
      color: stats.cacheHitRate > 0.5 ? 'text-green-500' : 'text-red-500',
      bgColor: stats.cacheHitRate > 0.5 ? 'bg-green-50' : 'bg-red-50'
    },
    {
      title: 'Load Time',
      value: utils.formatDuration(stats.loadTime),
      icon: Clock,
      color: stats.loadTime < 3000 ? 'text-green-500' : 'text-yellow-500',
      bgColor: stats.loadTime < 3000 ? 'bg-green-50' : 'bg-yellow-50'
    }
  ];
  
  // Tab configuration
  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'chunks', label: 'Chunks', icon: Package },
    { id: 'modules', label: 'Modules', icon: FileText },
    { id: 'strategies', label: 'Strategies', icon: Zap },
    { id: 'analyses', label: 'Analyses', icon: Activity },
    { id: 'performance', label: 'Performance', icon: TrendingUp },
    { id: 'events', label: 'Events', icon: Clock },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'debug', label: 'Debug', icon: Info }
  ];
  
  const getChunkTypeIcon = (type: BundleChunk['type']) => {
    switch (type) {
      case 'entry': return Play;
      case 'vendor': return Package;
      case 'async': return Download;
      case 'common': return FileText;
      default: return FileText;
    }
  };
  
  const getChunkTypeColor = (type: BundleChunk['type']) => {
    switch (type) {
      case 'entry': return 'text-blue-500';
      case 'vendor': return 'text-purple-500';
      case 'async': return 'text-green-500';
      case 'common': return 'text-orange-500';
      default: return 'text-gray-500';
    }
  };
  
  const getPriorityColor = (priority: BundleChunk['priority']) => {
    switch (priority) {
      case 'critical': return 'text-red-500';
      case 'high': return 'text-orange-500';
      case 'medium': return 'text-yellow-500';
      case 'low': return 'text-green-500';
      default: return 'text-gray-500';
    }
  };
  
  const getEventTypeIcon = (type: BundleEvent['type']) => {
    switch (type) {
      case 'chunk_loaded': return Download;
      case 'chunk_unloaded': return Upload;
      case 'optimization_applied': return Zap;
      case 'analysis_completed': return Activity;
      case 'cache_hit': return CheckCircle;
      case 'cache_miss': return XCircle;
      case 'bundle_optimized': return TrendingUp;
      case 'error': return AlertTriangle;
      default: return Info;
    }
  };
  
  const getEventTypeColor = (type: BundleEvent['type']) => {
    switch (type) {
      case 'chunk_loaded': return 'text-green-500';
      case 'chunk_unloaded': return 'text-blue-500';
      case 'optimization_applied': return 'text-purple-500';
      case 'analysis_completed': return 'text-indigo-500';
      case 'cache_hit': return 'text-green-500';
      case 'cache_miss': return 'text-yellow-500';
      case 'bundle_optimized': return 'text-emerald-500';
      case 'error': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };
  
  return (
    <div className={`bg-white rounded-lg shadow-lg ${className}`}>
      {/* Header */}
      <div className="border-b border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Package className="h-8 w-8 text-blue-500" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Bundle Optimization</h2>
              <p className="text-gray-600">Intelligent code splitting and performance optimization</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                autoRefresh
                  ? 'bg-green-100 text-green-700 hover:bg-green-200'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <RefreshCw className={`h-4 w-4 ${autoRefresh ? 'animate-spin' : ''}`} />
            </button>
            
            <button
              onClick={analytics.refresh}
              className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
            
            <button
              onClick={() => runFullOptimization()}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Optimize
            </button>
          </div>
        </div>
        
        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          {statusCards.map((card, index) => {
            const IconComponent = card.icon;
            return (
              <div key={index} className={`${card.bgColor} rounded-lg p-4`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{card.title}</p>
                    <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
                  </div>
                  <IconComponent className={`h-8 w-8 ${card.color}`} />
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
            const IconComponent = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <IconComponent className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
      
      {/* Content */}
      <div className="p-6">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <button
                  onClick={quickActions.enableCodeSplitting}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  <Package className="h-4 w-4" />
                  <span>Code Splitting</span>
                </button>
                
                <button
                  onClick={quickActions.enableLazyLoading}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                >
                  <Download className="h-4 w-4" />
                  <span>Lazy Loading</span>
                </button>
                
                <button
                  onClick={() => runPerformanceOptimization()}
                  className="flex items-center space-x-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
                >
                  <TrendingUp className="h-4 w-4" />
                  <span>Performance</span>
                </button>
                
                <button
                  onClick={() => runSizeOptimization()}
                  className="flex items-center space-x-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                >
                  <Minimize2 className="h-4 w-4" />
                  <span>Size Optimize</span>
                </button>
              </div>
            </div>
            
            {/* Performance Metrics */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Metrics</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Bundle Health</h4>
                  <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    computed.bundleHealth === 'excellent' ? 'bg-green-100 text-green-800' :
                    computed.bundleHealth === 'good' ? 'bg-blue-100 text-blue-800' :
                    computed.bundleHealth === 'fair' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {computed.bundleHealth === 'excellent' && <CheckCircle className="h-4 w-4 mr-1" />}
                    {computed.bundleHealth === 'good' && <CheckCircle className="h-4 w-4 mr-1" />}
                    {computed.bundleHealth === 'fair' && <AlertTriangle className="h-4 w-4 mr-1" />}
                    {computed.bundleHealth === 'poor' && <XCircle className="h-4 w-4 mr-1" />}
                    {computed.bundleHealth.charAt(0).toUpperCase() + computed.bundleHealth.slice(1)}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Chunks Summary</h4>
                  <div className="text-sm text-gray-600">
                    <div>Total: {computed.totalChunks}</div>
                    <div>Loaded: {computed.loadedChunks}</div>
                    <div>Critical: {computed.criticalChunks}</div>
                    <div>Async: {computed.asyncChunks}</div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Recommendations */}
            {recommendations.length > 0 && (
              <div className="bg-yellow-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recommendations</h3>
                <ul className="space-y-2">
                  {recommendations.map((rec, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5" />
                      <span className="text-sm text-gray-700">{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {/* Recent Events */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Events</h3>
              <div className="space-y-2">
                {computed.recentEvents.map((event, index) => {
                  const IconComponent = getEventTypeIcon(event.type);
                  const colorClass = getEventTypeColor(event.type);
                  return (
                    <div key={index} className="flex items-center space-x-3 p-2 bg-white rounded border">
                      <IconComponent className={`h-4 w-4 ${colorClass}`} />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">{event.type.replace('_', ' ')}</div>
                        <div className="text-xs text-gray-500">
                          {new Date(event.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                      {event.metadata && (
                        <div className="text-xs text-gray-500">
                          {JSON.stringify(event.metadata).slice(0, 50)}...
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
        
        {/* Chunks Tab */}
        {activeTab === 'chunks' && (
          <div className="space-y-4">
            {/* Search and Filter */}
            <div className="flex items-center space-x-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search chunks..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Priorities</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
              
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="name">Sort by Name</option>
                <option value="size">Sort by Size</option>
                <option value="loadTime">Sort by Load Time</option>
                <option value="priority">Sort by Priority</option>
              </select>
              
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </button>
            </div>
            
            {/* Chunks List */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Chunk</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Load Time</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredChunks.map((chunk, index) => {
                      const TypeIcon = getChunkTypeIcon(chunk.type);
                      const typeColor = getChunkTypeColor(chunk.type);
                      const priorityColor = getPriorityColor(chunk.priority);
                      
                      return (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <TypeIcon className={`h-5 w-5 ${typeColor} mr-3`} />
                              <div>
                                <div className="text-sm font-medium text-gray-900">{chunk.name}</div>
                                <div className="text-sm text-gray-500">{chunk.route || 'No route'}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${typeColor} bg-gray-100`}>
                              {chunk.type}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{utils.formatBytes(chunk.size)}</div>
                            <div className="text-sm text-gray-500">Gzip: {utils.formatBytes(chunk.gzipSize)}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${priorityColor} bg-gray-100`}>
                              {chunk.priority}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {utils.formatDuration(chunk.loadTime)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              chunk.isLoaded ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                              {chunk.isLoaded ? 'Loaded' : 'Unloaded'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => setSelectedChunk(chunk)}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                              
                              {chunk.isLoaded ? (
                                <button
                                  onClick={() => actions.unloadChunk(chunk.name)}
                                  className="text-orange-600 hover:text-orange-900"
                                >
                                  <Pause className="h-4 w-4" />
                                </button>
                              ) : (
                                <button
                                  onClick={() => actions.loadChunk(chunk.name)}
                                  className="text-green-600 hover:text-green-900"
                                >
                                  <Play className="h-4 w-4" />
                                </button>
                              )}
                              
                              <button
                                onClick={() => actions.removeChunk(chunk.name)}
                                className="text-red-600 hover:text-red-900"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
        
        {/* Other tabs would be implemented similarly... */}
        {activeTab === 'modules' && (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Modules Management</h3>
            <p className="text-gray-600">Module analysis and optimization features coming soon...</p>
          </div>
        )}
        
        {activeTab === 'strategies' && (
          <div className="text-center py-8">
            <Zap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Loading Strategies</h3>
            <p className="text-gray-600">Strategy configuration and management features coming soon...</p>
          </div>
        )}
        
        {activeTab === 'analyses' && (
          <div className="text-center py-8">
            <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Bundle Analysis</h3>
            <p className="text-gray-600">Detailed analysis and recommendations coming soon...</p>
          </div>
        )}
        
        {activeTab === 'performance' && (
          <div className="text-center py-8">
            <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Performance Metrics</h3>
            <p className="text-gray-600">Advanced performance monitoring coming soon...</p>
          </div>
        )}
        
        {activeTab === 'events' && (
          <div className="text-center py-8">
            <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Event Timeline</h3>
            <p className="text-gray-600">Event tracking and timeline features coming soon...</p>
          </div>
        )}
        
        {activeTab === 'settings' && (
          <div className="text-center py-8">
            <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Configuration</h3>
            <p className="text-gray-600">Bundle optimization settings coming soon...</p>
          </div>
        )}
        
        {activeTab === 'debug' && (
          <div className="text-center py-8">
            <Info className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Debug Information</h3>
            <p className="text-gray-600">Debug logs and diagnostics coming soon...</p>
          </div>
        )}
      </div>
      
      {/* Chunk Details Modal */}
      {selectedChunk && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Chunk Details</h3>
                <button
                  onClick={() => setSelectedChunk(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedChunk.name}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Type</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedChunk.type}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Size</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {utils.formatBytes(selectedChunk.size)} (Gzip: {utils.formatBytes(selectedChunk.gzipSize)})
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Priority</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedChunk.priority}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Load Time</label>
                  <p className="mt-1 text-sm text-gray-900">{utils.formatDuration(selectedChunk.loadTime)}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Route</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedChunk.route || 'No route'}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Modules</label>
                  <div className="mt-1 space-y-1">
                    {selectedChunk.modules.map((module, index) => (
                      <p key={index} className="text-sm text-gray-600">• {module}</p>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Dependencies</label>
                  <div className="mt-1 space-y-1">
                    {selectedChunk.dependencies.map((dep, index) => (
                      <p key={index} className="text-sm text-gray-600">• {dep}</p>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Error Modal */}
      {error && showError && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-red-900">Error</h3>
                <button
                  onClick={() => setShowError(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <div className="flex items-start space-x-3">
                <AlertTriangle className="h-6 w-6 text-red-500 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-900">{error}</p>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowError(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
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
});

export default BundleOptimizationManager;