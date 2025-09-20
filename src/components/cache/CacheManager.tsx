import React, { useState, useEffect, useMemo } from 'react';
import {
  Database,
  Activity,
  Settings,
  BarChart3,
  Zap,
  HardDrive,
  Clock,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Trash2,
  Download,
  Upload,
  Compress,
  Archive,
  Search,
  Filter,
  MoreVertical,
  Info,
  Gauge
} from 'lucide-react';
import {
  useCache,
  useCacheStats,
  useCacheConfig,
  useCacheEntries,
  useCacheDebug,
  useCachePerformance
} from '../../hooks/useCache';

const CacheManager: React.FC = () => {
  // Hooks
  const stats = useCacheStats();
  const config = useCacheConfig();
  const entries = useCacheEntries();
  const debug = useCacheDebug();
  const performance = useCachePerformance();
  
  // Local state
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTag, setFilterTag] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  
  // Auto refresh effect
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      // Trigger refresh by updating a dummy state
      setActiveTab(prev => prev);
    }, 5000);
    
    return () => clearInterval(interval);
  }, [autoRefresh]);
  
  // Generate demo data
  const generateDemoData = () => {
    const demoEntries = [
      { key: 'user:123', value: { name: 'John Doe', email: 'john@example.com' }, tags: ['user', 'profile'] },
      { key: 'video:456', value: { title: 'Sample Video', duration: 120 }, tags: ['video', 'media'] },
      { key: 'project:789', value: { name: 'Studio Project', status: 'active' }, tags: ['project', 'workspace'] },
      { key: 'settings:ui', value: { theme: 'dark', language: 'en' }, tags: ['settings', 'ui'] },
      { key: 'analytics:daily', value: { views: 1250, clicks: 89 }, tags: ['analytics', 'metrics'] }
    ];
    
    return demoEntries;
  };
  
  const demoData = generateDemoData();
  
  // Filter entries
  const filteredEntries = useMemo(() => {
    let filtered = entries.entries;
    
    if (searchTerm) {
      filtered = filtered.filter(entry => 
        entry.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
        JSON.stringify(entry.value).toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (filterTag) {
      filtered = filtered.filter(entry => 
        entry.tags.includes(filterTag)
      );
    }
    
    return filtered;
  }, [entries.entries, searchTerm, filterTag]);
  
  // Get all unique tags
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    entries.entries.forEach(entry => {
      entry.tags.forEach(tag => tags.add(tag));
    });
    return Array.from(tags);
  }, [entries.entries]);
  
  // Status cards data
  const statusCards = [
    {
      title: 'Hit Rate',
      value: `${stats.hitRate.toFixed(1)}%`,
      icon: TrendingUp,
      color: stats.getStatusColor(stats.hitRate),
      trend: stats.hitRate >= 80 ? 'up' : stats.hitRate >= 60 ? 'stable' : 'down'
    },
    {
      title: 'Total Entries',
      value: stats.totalEntries.toLocaleString(),
      icon: Database,
      color: 'text-blue-600',
      trend: 'up'
    },
    {
      title: 'Cache Size',
      value: stats.formatSize(stats.totalSize),
      icon: HardDrive,
      color: 'text-purple-600',
      trend: 'up'
    },
    {
      title: 'Evictions',
      value: stats.evictions.toLocaleString(),
      icon: AlertTriangle,
      color: stats.evictions > 100 ? 'text-red-600' : 'text-yellow-600',
      trend: stats.evictions > 100 ? 'down' : 'stable'
    }
  ];
  
  // Tabs configuration
  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'entries', label: 'Entries', icon: Database },
    { id: 'performance', label: 'Performance', icon: Gauge },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'debug', label: 'Debug', icon: Activity }
  ];
  
  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="bg-blue-100 p-2 rounded-lg">
            <Database className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Cache Manager</h2>
            <p className="text-sm text-gray-600">Advanced caching system with intelligent optimization</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-600">Auto Refresh</label>
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                autoRefresh ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  autoRefresh ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
          
          <button
            onClick={() => stats.optimize()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
          >
            <Zap className="h-4 w-4 mr-2" />
            Optimize
          </button>
        </div>
      </div>
      
      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statusCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div key={index} className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{card.title}</p>
                  <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
                </div>
                <div className={`p-2 rounded-lg ${card.color.replace('text-', 'bg-').replace('-600', '-100')}`}>
                  <Icon className={`h-6 w-6 ${card.color}`} />
                </div>
              </div>
              <div className="flex items-center mt-2">
                <TrendingUp className={`h-4 w-4 mr-1 ${
                  card.trend === 'up' ? 'text-green-600' : 
                  card.trend === 'down' ? 'text-red-600' : 'text-gray-600'
                }`} />
                <span className="text-xs text-gray-500">
                  {card.trend === 'up' ? 'Improving' : 
                   card.trend === 'down' ? 'Declining' : 'Stable'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
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
                <Icon className="h-4 w-4 mr-2" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>
      
      {/* Tab Content */}
      <div className="space-y-6">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Performance Summary */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-4">Performance Summary</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className={`text-2xl font-bold ${stats.getStatusColor(performance.performance.hitRate)}`}>
                    {performance.performance.hitRate.toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-600">Hit Rate</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {performance.performance.utilizationRate.toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-600">Utilization</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {performance.performance.compressionEffectiveness.toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-600">Compression</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {performance.performance.efficiency.toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-600">Efficiency</div>
                </div>
              </div>
            </div>
            
            {/* Recommendations */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-4">Recommendations</h4>
              <div className="space-y-2">
                {performance.recommendations.map((rec, index) => (
                  <div key={index} className="flex items-start space-x-2">
                    <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-700">{rec}</span>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Quick Actions */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-4">Quick Actions</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <button
                  onClick={() => stats.optimize()}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
                >
                  <Zap className="h-4 w-4 mr-2" />
                  Optimize
                </button>
                <button
                  onClick={() => stats.cleanup()}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Cleanup
                </button>
                <button
                  onClick={() => stats.resetStats()}
                  className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors flex items-center justify-center"
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Reset Stats
                </button>
                <button
                  onClick={() => debug.exportLogs()}
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Entries Tab */}
        {activeTab === 'entries' && (
          <div className="space-y-6">
            {/* Search and Filter */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search entries..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="sm:w-48">
                <select
                  value={filterTag}
                  onChange={(e) => setFilterTag(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Tags</option>
                  {allTags.map(tag => (
                    <option key={tag} value={tag}>{tag}</option>
                  ))}
                </select>
              </div>
            </div>
            
            {/* Entries List */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium text-gray-900">Cache Entries</h4>
                <span className="text-sm text-gray-600">
                  {filteredEntries.length} of {entries.totalEntries} entries
                </span>
              </div>
              
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {filteredEntries.length > 0 ? filteredEntries.map((entry) => (
                  <div key={entry.id} className="bg-white rounded-lg p-4 border">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-gray-900">{entry.key}</span>
                          {entry.compressed && (
                            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                              Compressed
                            </span>
                          )}
                          <span className={`text-xs px-2 py-1 rounded ${
                            entry.priority === 'critical' ? 'bg-red-100 text-red-800' :
                            entry.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                            entry.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {entry.priority}
                          </span>
                        </div>
                        <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                          <span>Size: {stats.formatSize(entry.size)}</span>
                          <span>Accessed: {entry.accessCount} times</span>
                          <span>Age: {Math.floor((Date.now() - entry.timestamp) / 1000)}s</span>
                        </div>
                        <div className="flex items-center space-x-2 mt-2">
                          {entry.tags.map(tag => (
                            <span key={tag} className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button className="text-gray-400 hover:text-gray-600">
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-8">
                    <Database className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No cache entries</h3>
                    <p className="text-gray-600">Cache entries will appear here as data is cached.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Performance Tab */}
        {activeTab === 'performance' && (
          <div className="space-y-6">
            {/* Performance Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-4">Cache Efficiency</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Hit Rate</span>
                    <span className={`font-medium ${stats.getStatusColor(performance.performance.hitRate)}`}>
                      {performance.performance.hitRate.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        performance.performance.hitRate >= 80 ? 'bg-green-600' :
                        performance.performance.hitRate >= 60 ? 'bg-yellow-600' : 'bg-red-600'
                      }`}
                      style={{ width: `${performance.performance.hitRate}%` }}
                    ></div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Miss Rate</span>
                    <span className="font-medium text-gray-900">
                      {performance.performance.missRate.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-red-600 h-2 rounded-full"
                      style={{ width: `${performance.performance.missRate}%` }}
                    ></div>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-4">Resource Utilization</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Entries</span>
                    <span className="font-medium text-gray-900">
                      {performance.performance.utilizationRate.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        performance.performance.utilizationRate >= 90 ? 'bg-red-600' :
                        performance.performance.utilizationRate >= 70 ? 'bg-yellow-600' : 'bg-green-600'
                      }`}
                      style={{ width: `${performance.performance.utilizationRate}%` }}
                    ></div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Size</span>
                    <span className="font-medium text-gray-900">
                      {performance.performance.sizeUtilizationRate.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        performance.performance.sizeUtilizationRate >= 90 ? 'bg-red-600' :
                        performance.performance.sizeUtilizationRate >= 70 ? 'bg-yellow-600' : 'bg-green-600'
                      }`}
                      style={{ width: `${performance.performance.sizeUtilizationRate}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Performance Status */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-4">Performance Status</h4>
              <div className="flex items-center space-x-4">
                {performance.isOptimal ? (
                  <div className="flex items-center space-x-2 text-green-600">
                    <CheckCircle className="h-5 w-5" />
                    <span className="font-medium">Optimal Performance</span>
                  </div>
                ) : performance.needsAttention ? (
                  <div className="flex items-center space-x-2 text-red-600">
                    <XCircle className="h-5 w-5" />
                    <span className="font-medium">Needs Attention</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2 text-yellow-600">
                    <AlertTriangle className="h-5 w-5" />
                    <span className="font-medium">Room for Improvement</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            {/* Cache Configuration */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-4">Cache Configuration</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Entries</label>
                  <input
                    type="number"
                    value={config.config.maxEntries}
                    onChange={(e) => config.updateConfig({ maxEntries: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Size</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={config.maxSizeFormatted}
                      readOnly
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-100"
                    />
                    <span className="text-sm text-gray-600">MB</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Default TTL</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={config.defaultTTLFormatted}
                      readOnly
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-100"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Eviction Policy</label>
                  <select
                    value={config.config.evictionPolicy}
                    onChange={(e) => config.updateConfig({ evictionPolicy: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="lru">Least Recently Used (LRU)</option>
                    <option value="lfu">Least Frequently Used (LFU)</option>
                    <option value="fifo">First In, First Out (FIFO)</option>
                    <option value="ttl">Time To Live (TTL)</option>
                  </select>
                </div>
              </div>
            </div>
            
            {/* Feature Toggles */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-4">Features</h4>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium text-gray-700">Compression</span>
                    <p className="text-xs text-gray-500">Automatically compress large cache entries</p>
                  </div>
                  <button
                    onClick={() => config.updateConfig({ enableCompression: !config.isCompressionEnabled })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      config.isCompressionEnabled ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        config.isCompressionEnabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium text-gray-700">Persistence</span>
                    <p className="text-xs text-gray-500">Save cache to localStorage</p>
                  </div>
                  <button
                    onClick={() => config.updateConfig({ enablePersistence: !config.isPersistenceEnabled })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      config.isPersistenceEnabled ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        config.isPersistenceEnabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
            
            {/* Actions */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-4">Actions</h4>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => config.resetConfig()}
                  className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
                >
                  Reset to Defaults
                </button>
                <button
                  onClick={() => debug.exportLogs()}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  Export Configuration
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Debug Tab */}
        {activeTab === 'debug' && (
          <div className="space-y-6">
            {/* Debug Actions */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-4">Debug Actions</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <button
                  onClick={() => debug.addLog('info', 'Manual test log entry')}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
                >
                  <Activity className="h-4 w-4 mr-2" />
                  Add Log
                </button>
                <button
                  onClick={() => debug.exportLogs()}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export Logs
                </button>
                <button
                  onClick={() => debug.clearLogs()}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear Logs
                </button>
                <button
                  onClick={() => stats.resetStats()}
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center"
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Reset Stats
                </button>
              </div>
            </div>
            
            {/* Debug Logs */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-4">Debug Logs</h4>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {debug.logs.map((log) => {
                  const getLogColor = (level: string) => {
                    switch (level) {
                      case 'error': return 'text-red-600 bg-red-50 border-red-200';
                      case 'warn': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
                      case 'info': return 'text-blue-600 bg-blue-50 border-blue-200';
                      case 'debug': return 'text-gray-600 bg-gray-50 border-gray-200';
                      default: return 'text-gray-600 bg-gray-50 border-gray-200';
                    }
                  };
                  
                  return (
                    <div
                      key={log.id}
                      className={`p-3 rounded border text-sm ${getLogColor(log.level)}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium uppercase">{log.level}</span>
                          <span className="text-gray-500">•</span>
                          <span>{log.source}</span>
                        </div>
                        <span className="text-xs text-gray-500">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="mt-1">{log.message}</div>
                      {log.data && (
                        <div className="mt-2 text-xs text-gray-600">
                          <pre className="whitespace-pre-wrap">{JSON.stringify(log.data, null, 2)}</pre>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              
              {debug.logs.length === 0 && (
                <div className="text-center py-8">
                  <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No debug logs</h3>
                  <p className="text-gray-600">Debug logs will appear here as the cache system runs.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CacheManager;