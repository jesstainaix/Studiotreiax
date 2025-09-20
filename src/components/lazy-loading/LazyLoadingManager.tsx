import React, { useState, useEffect, useRef } from 'react';
import { 
  Image, Video, Music, Code, Database, Settings, BarChart3, 
  Clock, CheckCircle, XCircle, AlertTriangle, RefreshCw,
  Play, Pause, Download, Upload, Trash2, Plus, Search,
  Filter, Eye, EyeOff, Zap, Target, HardDrive, Activity
} from 'lucide-react';
import useLazyLoading from '../../hooks/useLazyLoading';
import type { LazyLoadItem, LazyLoadConfig } from '../../hooks/useLazyLoading';

const LazyLoadingManager: React.FC = () => {
  const {
    items,
    states,
    queue,
    cache,
    metrics,
    config,
    isLoading,
    error,
    actions
  } = useLazyLoading();

  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [newItem, setNewItem] = useState<Partial<LazyLoadItem>>({});
  const [importData, setImportData] = useState('');
  const testImageRef = useRef<HTMLDivElement>(null);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      // Trigger refresh if needed
    }, 2000);
    
    return () => clearInterval(interval);
  }, [autoRefresh]);

  // Convert Maps to Arrays for filtering
  const itemsArray = Array.from(items.values());
  const statesArray = Array.from(states.entries());

  // Filter functions
  const filteredItems = itemsArray.filter(item => {
    const state = states.get(item.id);
    const matchesSearch = item.src.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (item.alt && item.alt.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = filterType === 'all' || item.type === filterType;
    const matchesStatus = filterStatus === 'all' || (state && state.status === filterStatus);
    const matchesPriority = filterPriority === 'all' || item.priority === filterPriority;
    return matchesSearch && matchesType && matchesStatus && matchesPriority;
  });

  // Helper functions
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'image': return Image;
      case 'video': return Video;
      case 'audio': return Music;
      case 'component': return Code;
      case 'data': return Database;
      default: return Activity;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'loaded': return 'text-green-600';
      case 'loading': return 'text-blue-600';
      case 'error': return 'text-red-600';
      case 'retrying': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'loaded': return 'bg-green-100';
      case 'loading': return 'bg-blue-100';
      case 'error': return 'bg-red-100';
      case 'retrying': return 'bg-yellow-100';
      default: return 'bg-gray-100';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatTime = (ms: number) => {
    if (ms < 1000) return `${ms.toFixed(0)}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  // Test lazy loading
  const addTestItems = () => {
    const testItems: LazyLoadItem[] = [
      {
        id: 'test-image-1',
        src: 'https://picsum.photos/400/300?random=1',
        alt: 'Test Image 1',
        type: 'image',
        priority: 'high',
        size: 50000
      },
      {
        id: 'test-image-2',
        src: 'https://picsum.photos/400/300?random=2',
        alt: 'Test Image 2',
        type: 'image',
        priority: 'medium',
        size: 45000
      },
      {
        id: 'test-data-1',
        src: 'https://jsonplaceholder.typicode.com/posts/1',
        type: 'data',
        priority: 'low',
        size: 1000
      }
    ];

    testItems.forEach(item => actions.addItem(item));
  };

  // Render functions
  const renderStatusBar = () => (
    <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${
              isLoading ? 'bg-blue-500 animate-pulse' : 
              error ? 'bg-red-500' : 'bg-green-500'
            }`} />
            <span className="text-sm font-medium">
              {isLoading ? 'Loading...' : error ? 'Error' : 'Ready'}
            </span>
          </div>
          
          <div className="text-sm text-gray-600">
            Items: <span className="font-medium">{metrics.totalItems}</span>
          </div>
          
          <div className="text-sm text-gray-600">
            Loaded: <span className="font-medium text-green-600">{metrics.loadedItems}</span>
          </div>
          
          <div className="text-sm text-gray-600">
            Failed: <span className="font-medium text-red-600">{metrics.failedItems}</span>
          </div>
          
          <div className="text-sm text-gray-600">
            Cache: <span className="font-medium">{Object.keys(cache).length}</span>
          </div>
          
          <div className="text-sm text-gray-600">
            Score: <span className="font-medium">{metrics.performanceScore.toFixed(1)}%</span>
          </div>
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
          
          <button
            onClick={addTestItems}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <Plus className="w-4 h-4" />
            <span>Add Test Items</span>
          </button>
        </div>
      </div>
      
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
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Items</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.totalItems}</p>
            </div>
            <Target className="w-8 h-8 text-gray-400" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Success Rate</p>
              <p className="text-2xl font-bold text-green-600">
                {metrics.totalItems > 0 ? ((metrics.loadedItems / metrics.totalItems) * 100).toFixed(1) : 0}%
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Cache Hit Rate</p>
              <p className="text-2xl font-bold text-blue-600">
                {(metrics.cacheHits + metrics.cacheMisses) > 0 
                  ? ((metrics.cacheHits / (metrics.cacheHits + metrics.cacheMisses)) * 100).toFixed(1)
                  : 0}%
              </p>
            </div>
            <HardDrive className="w-8 h-8 text-blue-400" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Load Time</p>
              <p className="text-2xl font-bold text-purple-600">
                {formatTime(metrics.averageLoadTime)}
              </p>
            </div>
            <Clock className="w-8 h-8 text-purple-400" />
          </div>
        </div>
      </div>
      
      {/* Queue Status */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-4 border-b">
          <h3 className="text-lg font-semibold">Loading Queue</h3>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{queue.high.length}</div>
              <div className="text-sm text-gray-600">High Priority</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{queue.medium.length}</div>
              <div className="text-sm text-gray-600">Medium Priority</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{queue.low.length}</div>
              <div className="text-sm text-gray-600">Low Priority</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Recent Items */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-4 border-b">
          <h3 className="text-lg font-semibold">Recent Items</h3>
        </div>
        <div className="divide-y">
          {filteredItems.slice(0, 10).map(item => {
            const state = states.get(item.id);
            const Icon = getTypeIcon(item.type);
            return (
              <div key={item.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Icon className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="font-medium truncate max-w-xs">{item.src}</p>
                      {item.alt && <p className="text-sm text-gray-600">{item.alt}</p>}
                      <div className="flex items-center space-x-2 mt-1">
                        <span className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(item.priority)}`}>
                          {item.priority}
                        </span>
                        <span className="text-xs text-gray-500 capitalize">{item.type}</span>
                        {item.size && (
                          <span className="text-xs text-gray-500">{formatBytes(item.size)}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    {state && (
                      <>
                        {state.status === 'loading' && (
                          <div className="flex items-center space-x-2">
                            <div className="w-16 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${state.progress}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-500">{state.progress}%</span>
                          </div>
                        )}
                        
                        {state.loadTime && (
                          <span className="text-xs text-gray-500">
                            {formatTime(state.loadTime)}
                          </span>
                        )}
                        
                        {state.fromCache && (
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            Cached
                          </span>
                        )}
                        
                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                          getStatusBg(state.status)
                        } ${getStatusColor(state.status)}`}>
                          {state.status}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Test Area */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-4 border-b">
          <h3 className="text-lg font-semibold">Test Lazy Loading</h3>
        </div>
        <div className="p-4">
          <div 
            ref={testImageRef}
            className="h-64 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300"
          >
            <div className="text-center">
              <Eye className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600">Scroll to test lazy loading</p>
              <p className="text-sm text-gray-500">Images will load when they come into view</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderItems = () => (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Types</option>
            <option value="image">Images</option>
            <option value="video">Videos</option>
            <option value="audio">Audio</option>
            <option value="component">Components</option>
            <option value="data">Data</option>
          </select>
          
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="idle">Idle</option>
            <option value="loading">Loading</option>
            <option value="loaded">Loaded</option>
            <option value="error">Error</option>
            <option value="retrying">Retrying</option>
          </select>
          
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Priorities</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          
          <button
            onClick={() => {
              setNewItem({});
              setShowAddItemModal(true);
            }}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            <span>Add Item</span>
          </button>
        </div>
      </div>
      
      {/* Items List */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-4 border-b">
          <h3 className="text-lg font-semibold">Items ({filteredItems.length})</h3>
        </div>
        <div className="divide-y">
          {filteredItems.map(item => {
            const state = states.get(item.id);
            const Icon = getTypeIcon(item.type);
            return (
              <div key={item.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Icon className="w-5 h-5 text-gray-400" />
                    <div className="flex-1">
                      <p className="font-medium">{item.src}</p>
                      {item.alt && <p className="text-sm text-gray-600">{item.alt}</p>}
                      <div className="flex items-center space-x-4 mt-1">
                        <span className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(item.priority)}`}>
                          {item.priority} priority
                        </span>
                        <span className="text-xs text-gray-500 capitalize">{item.type}</span>
                        {item.size && (
                          <span className="text-xs text-gray-500">{formatBytes(item.size)}</span>
                        )}
                        {item.critical && (
                          <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                            Critical
                          </span>
                        )}
                        {item.preload && (
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            Preload
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    {state && (
                      <>
                        {state.status === 'loading' && (
                          <div className="flex items-center space-x-2">
                            <div className="w-20 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${state.progress}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-500 w-8">{state.progress}%</span>
                          </div>
                        )}
                        
                        <div className="text-right text-xs text-gray-500">
                          {state.loadTime && (
                            <div>Load: {formatTime(state.loadTime)}</div>
                          )}
                          {state.retryCount > 0 && (
                            <div>Retries: {state.retryCount}</div>
                          )}
                          {state.fromCache && (
                            <div className="text-blue-600">From Cache</div>
                          )}
                        </div>
                        
                        <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                          getStatusBg(state.status)
                        } ${getStatusColor(state.status)}`}>
                          {state.status}
                        </div>
                      </>
                    )}
                    
                    <div className="flex items-center space-x-2">
                      {state?.status === 'idle' && (
                        <button
                          onClick={() => actions.loadItem(item.id)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                          title="Load Now"
                        >
                          <Play className="w-4 h-4" />
                        </button>
                      )}
                      
                      <button
                        onClick={() => actions.prefetchItem(item.id)}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                        title="Prefetch"
                      >
                        <Zap className="w-4 h-4" />
                      </button>
                      
                      <button
                        onClick={() => actions.removeItem(item.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        title="Remove"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
                
                {state?.error && (
                  <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-800">
                    Error: {state.error}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  const renderCache = () => (
    <div className="space-y-6">
      {/* Cache Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Cache Size</p>
              <p className="text-2xl font-bold text-gray-900">{Object.keys(cache).length}</p>
            </div>
            <HardDrive className="w-8 h-8 text-gray-400" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Cache Hits</p>
              <p className="text-2xl font-bold text-green-600">{metrics.cacheHits}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Cache Misses</p>
              <p className="text-2xl font-bold text-red-600">{metrics.cacheMisses}</p>
            </div>
            <XCircle className="w-8 h-8 text-red-400" />
          </div>
        </div>
      </div>
      
      {/* Cache Items */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-4 border-b flex items-center justify-between">
          <h3 className="text-lg font-semibold">Cached Items</h3>
          <button
            onClick={actions.clearCache}
            className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            <Trash2 className="w-4 h-4" />
            <span>Clear Cache</span>
          </button>
        </div>
        <div className="divide-y">
          {Object.entries(cache).map(([id, item]) => (
            <div key={id} className="p-4 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{id}</p>
                  <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                    <span>Size: {formatBytes(item.size)}</span>
                    <span>Hits: {item.hits}</span>
                    <span>Created: {new Date(item.timestamp).toLocaleTimeString()}</span>
                    <span>Last Access: {new Date(item.lastAccess).toLocaleTimeString()}</span>
                  </div>
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
              <label className="font-medium">Enable Lazy Loading</label>
              <p className="text-sm text-gray-600">Enable or disable lazy loading functionality</p>
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
              <label className="font-medium">Prefetch on Hover</label>
              <p className="text-sm text-gray-600">Preload items when user hovers over them</p>
            </div>
            <input
              type="checkbox"
              checked={config.prefetchOnHover}
              onChange={(e) => actions.updateConfig({ prefetchOnHover: e.target.checked })}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <label className="font-medium">WebP Support</label>
              <p className="text-sm text-gray-600">Use WebP format when supported</p>
            </div>
            <input
              type="checkbox"
              checked={config.webpSupport}
              onChange={(e) => actions.updateConfig({ webpSupport: e.target.checked })}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <label className="font-medium">Progressive Loading</label>
              <p className="text-sm text-gray-600">Load images progressively</p>
            </div>
            <input
              type="checkbox"
              checked={config.progressiveLoading}
              onChange={(e) => actions.updateConfig({ progressiveLoading: e.target.checked })}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block font-medium mb-2">Intersection Threshold</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={config.threshold}
              onChange={(e) => actions.updateConfig({ threshold: parseFloat(e.target.value) })}
              className="w-full"
            />
            <div className="flex justify-between text-sm text-gray-600 mt-1">
              <span>0%</span>
              <span>{(config.threshold * 100).toFixed(0)}%</span>
              <span>100%</span>
            </div>
          </div>
          
          <div>
            <label className="block font-medium mb-2">Root Margin</label>
            <input
              type="text"
              value={config.rootMargin}
              onChange={(e) => actions.updateConfig({ rootMargin: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="50px"
            />
          </div>
          
          <div>
            <label className="block font-medium mb-2">Cache Size Limit</label>
            <input
              type="number"
              value={config.cacheSize}
              onChange={(e) => actions.updateConfig({ cacheSize: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              min="10"
              max="1000"
            />
          </div>
          
          <div>
            <label className="block font-medium mb-2">Retry Attempts</label>
            <input
              type="number"
              value={config.retryAttempts}
              onChange={(e) => actions.updateConfig({ retryAttempts: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              min="0"
              max="10"
            />
          </div>
          
          <div>
            <label className="block font-medium mb-2">Retry Delay (ms)</label>
            <input
              type="number"
              value={config.retryDelay}
              onChange={(e) => actions.updateConfig({ retryDelay: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              min="100"
              step="100"
            />
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
                a.download = 'lazy-loading-data.json';
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
              onClick={actions.clearCache}
              className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              <Trash2 className="w-4 h-4" />
              <span>Clear Cache</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Add Item Modal
  const AddItemModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold mb-4">Add Lazy Load Item</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Source URL</label>
            <input
              type="text"
              value={newItem.src || ''}
              onChange={(e) => setNewItem({ ...newItem, src: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="https://example.com/image.jpg"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Type</label>
            <select
              value={newItem.type || 'image'}
              onChange={(e) => setNewItem({ ...newItem, type: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="image">Image</option>
              <option value="video">Video</option>
              <option value="audio">Audio</option>
              <option value="component">Component</option>
              <option value="data">Data</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Priority</label>
            <select
              value={newItem.priority || 'medium'}
              onChange={(e) => setNewItem({ ...newItem, priority: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Alt Text (optional)</label>
            <input
              type="text"
              value={newItem.alt || ''}
              onChange={(e) => setNewItem({ ...newItem, alt: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Description for accessibility"
            />
          </div>
          
          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={newItem.critical || false}
                onChange={(e) => setNewItem({ ...newItem, critical: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="text-sm">Critical</span>
            </label>
            
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={newItem.preload || false}
                onChange={(e) => setNewItem({ ...newItem, preload: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="text-sm">Preload</span>
            </label>
          </div>
        </div>
        
        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={() => {
              setShowAddItemModal(false);
              setNewItem({});
            }}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              if (newItem.src) {
                const item: LazyLoadItem = {
                  id: `item-${Date.now()}`,
                  src: newItem.src,
                  type: newItem.type || 'image',
                  priority: newItem.priority || 'medium',
                  alt: newItem.alt,
                  critical: newItem.critical,
                  preload: newItem.preload
                };
                actions.addItem(item);
                setShowAddItemModal(false);
                setNewItem({});
              }
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            disabled={!newItem.src}
          >
            Add Item
          </button>
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
            <Zap className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Lazy Loading Manager</h1>
          </div>
          <p className="text-gray-600">Optimize resource loading with intelligent lazy loading</p>
        </div>

        {/* Status Bar */}
        {renderStatusBar()}

        {/* Navigation */}
        <div className="bg-white rounded-lg shadow-sm border mb-6">
          <div className="flex space-x-1 p-1">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
              { id: 'items', label: 'Items', icon: Target },
              { id: 'cache', label: 'Cache', icon: HardDrive },
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
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="space-y-6">
          {activeTab === 'dashboard' && renderDashboard()}
          {activeTab === 'items' && renderItems()}
          {activeTab === 'cache' && renderCache()}
          {activeTab === 'settings' && renderSettings()}
        </div>

        {/* Modals */}
        {showAddItemModal && <AddItemModal />}
        {showImportModal && <ImportModal />}
      </div>
    </div>
  );
};

export default LazyLoadingManager;