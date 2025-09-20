import React, { useState, useEffect, useRef } from 'react';
import { usePerformanceOptimizations } from '../../hooks/usePerformanceOptimizations';
import type { PerformanceConfig, LazyLoadItem, CompressedAsset, VirtualItem } from '../../hooks/usePerformanceOptimizations';
import { 
  Activity, 
  Zap, 
  Image, 
  List, 
  BarChart3, 
  Settings, 
  Play, 
  Pause, 
  RefreshCw, 
  Download, 
  Upload, 
  Trash2, 
  Eye, 
  EyeOff, 
  Gauge, 
  MemoryStick, 
  HardDrive, 
  Clock, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Loader, 
  FileImage, 
  FileText, 
  Monitor, 
  Cpu, 
  Wifi, 
  WifiOff
} from 'lucide-react';

interface PerformanceOptimizationsManagerProps {
  className?: string;
}

const PerformanceOptimizationsManager: React.FC<PerformanceOptimizationsManagerProps> = ({ className = '' }) => {
  const {
    metrics,
    config,
    isOptimizing,
    isInitialized,
    registerLazyItem,
    observeLazyItem,
    compressImage,
    compressText,
    setupVirtualScrolling,
    updateConfig,
    exportData,
    importData,
    getLazyLoadItems,
    getCompressedAssets,
    getVirtualItems
  } = usePerformanceOptimizations();

  const [activeTab, setActiveTab] = useState('dashboard');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [compressionResults, setCompressionResults] = useState<Array<{ original: File; compressed: Blob; ratio: number }>>([]);
  const [virtualScrollItems, setVirtualScrollItems] = useState<any[]>([]);
  const [lazyLoadItems, setLazyLoadItems] = useState<LazyLoadItem[]>([]);
  const [compressedAssets, setCompressedAssets] = useState<CompressedAsset[]>([]);
  const [virtualItems, setVirtualItems] = useState<VirtualItem[]>([]);
  const [editingConfig, setEditingConfig] = useState<Partial<PerformanceConfig> | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const virtualScrollRef = useRef<HTMLDivElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);

  // Auto-refresh data
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      setLazyLoadItems(getLazyLoadItems());
      setCompressedAssets(getCompressedAssets());
      setVirtualItems(getVirtualItems());
    }, 2000);

    return () => clearInterval(interval);
  }, [autoRefresh, getLazyLoadItems, getCompressedAssets, getVirtualItems]);

  // Initialize data
  useEffect(() => {
    if (isInitialized) {
      setLazyLoadItems(getLazyLoadItems());
      setCompressedAssets(getCompressedAssets());
      setVirtualItems(getVirtualItems());
    }
  }, [isInitialized, getLazyLoadItems, getCompressedAssets, getVirtualItems]);

  // Handle file compression
  const handleFileCompression = async () => {
    if (!selectedFiles) return;

    const results: Array<{ original: File; compressed: Blob; ratio: number }> = [];

    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      
      try {
        if (file.type.startsWith('image/')) {
          const compressed = await compressImage(file);
          const ratio = compressed.size / file.size;
          results.push({ original: file, compressed, ratio });
        } else if (file.type.startsWith('text/')) {
          const text = await file.text();
          const compressed = await compressText(text);
          const blob = new Blob([compressed]);
          const ratio = blob.size / file.size;
          results.push({ original: file, compressed: blob, ratio });
        }
      } catch (error) {
        console.error(`Failed to compress ${file.name}:`, error);
      }
    }

    setCompressionResults(results);
  };

  // Setup virtual scrolling demo
  const setupVirtualScrollDemo = () => {
    const items = Array.from({ length: 10000 }, (_, i) => ({
      id: i,
      title: `Item ${i + 1}`,
      description: `Description for item ${i + 1}`,
      value: Math.random() * 100
    }));

    setVirtualScrollItems(items);

    if (virtualScrollRef.current) {
      setupVirtualScrolling(
        virtualScrollRef.current,
        items,
        (item, index) => {
          const div = document.createElement('div');
          div.className = 'p-4 border-b border-gray-200 flex justify-between items-center';
          div.innerHTML = `
            <div>
              <h4 class="font-medium">${item.title}</h4>
              <p class="text-sm text-gray-600">${item.description}</p>
            </div>
            <div class="text-right">
              <span class="text-lg font-bold">${item.value.toFixed(1)}</span>
            </div>
          `;
          return div;
        }
      );
    }
  };

  // Register lazy load demo items
  const setupLazyLoadDemo = () => {
    const demoItems = Array.from({ length: 50 }, (_, i) => ({
      id: `demo-${i}`,
      src: `https://picsum.photos/300/200?random=${i}`,
      alt: `Demo image ${i + 1}`,
      priority: (i < 10 ? 'high' : i < 30 ? 'medium' : 'low') as 'high' | 'medium' | 'low'
    }));

    demoItems.forEach(item => {
      registerLazyItem(item);
    });
  };

  // Handle configuration update
  const handleConfigUpdate = () => {
    if (editingConfig) {
      updateConfig(editingConfig);
      setEditingConfig(null);
    }
  };

  // Handle data export
  const handleExport = () => {
    const data = exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `performance-optimizations-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Handle data import
  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const data = e.target?.result as string;
      if (data) {
        importData(data);
      }
    };
    reader.readAsText(file);
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  const getStatusIcon = (status: 'success' | 'error' | 'loading' | 'idle') => {
    switch (status) {
      case 'success': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'loading': return <Loader className="w-4 h-4 text-blue-500 animate-spin" />;
      default: return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: Activity },
    { id: 'lazy-loading', label: 'Lazy Loading', icon: Eye },
    { id: 'compression', label: 'Compression', icon: FileImage },
    { id: 'virtual-dom', label: 'Virtual DOM', icon: List },
    { id: 'metrics', label: 'Metrics', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  return (
    <div className={`bg-white rounded-lg shadow-lg ${className}`}>
      {/* Header */}
      <div className="border-b border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Zap className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Performance Optimizations</h2>
              <p className="text-sm text-gray-600">
                Advanced performance optimization and monitoring system
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`p-2 rounded-lg transition-colors ${
                autoRefresh 
                  ? 'bg-green-100 text-green-600 hover:bg-green-200' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              title={autoRefresh ? 'Disable auto-refresh' : 'Enable auto-refresh'}
            >
              {autoRefresh ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
            </button>
            {isOptimizing && (
              <div className="flex items-center space-x-2 text-blue-600">
                <Loader className="w-4 h-4 animate-spin" />
                <span className="text-sm">Optimizing...</span>
              </div>
            )}
          </div>
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
                    ? 'border-purple-500 text-purple-600'
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
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-600">FPS</p>
                    <p className="text-2xl font-bold text-blue-900">{metrics.generalStats.fps}</p>
                  </div>
                  <Gauge className="w-8 h-8 text-blue-600" />
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-600">Memory Usage</p>
                    <p className="text-2xl font-bold text-green-900">{formatBytes(metrics.generalStats.memoryUsage)}</p>
                  </div>
                  <MemoryStick className="w-8 h-8 text-green-600" />
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-600">Bundle Size</p>
                    <p className="text-2xl font-bold text-purple-900">{formatBytes(metrics.generalStats.bundleSize)}</p>
                  </div>
                  <HardDrive className="w-8 h-8 text-purple-600" />
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-orange-50 to-orange-100 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-orange-600">Load Time</p>
                    <p className="text-2xl font-bold text-orange-900">{metrics.generalStats.loadTime.toFixed(0)}ms</p>
                  </div>
                  <Clock className="w-8 h-8 text-orange-600" />
                </div>
              </div>
            </div>

            {/* Performance Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Lazy Loading Stats */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Eye className="w-5 h-5 mr-2" />
                  Lazy Loading
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Total Items:</span>
                    <span className="font-medium">{metrics.lazyLoadStats.totalItems}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Loaded:</span>
                    <span className="font-medium text-green-600">{metrics.lazyLoadStats.loadedItems}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Failed:</span>
                    <span className="font-medium text-red-600">{metrics.lazyLoadStats.failedItems}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Cache Hit Rate:</span>
                    <span className="font-medium">{formatPercentage(metrics.lazyLoadStats.cacheHitRate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Avg Load Time:</span>
                    <span className="font-medium">{metrics.lazyLoadStats.averageLoadTime.toFixed(0)}ms</span>
                  </div>
                </div>
              </div>

              {/* Compression Stats */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <FileImage className="w-5 h-5 mr-2" />
                  Compression
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Original Size:</span>
                    <span className="font-medium">{formatBytes(metrics.compressionStats.originalSize)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Compressed:</span>
                    <span className="font-medium text-green-600">{formatBytes(metrics.compressionStats.compressedSize)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Saved:</span>
                    <span className="font-medium text-blue-600">{formatBytes(metrics.compressionStats.savedBytes)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Ratio:</span>
                    <span className="font-medium">{formatPercentage(metrics.compressionStats.compressionRatio)}</span>
                  </div>
                </div>
              </div>

              {/* Virtual DOM Stats */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <List className="w-5 h-5 mr-2" />
                  Virtual DOM
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Total Items:</span>
                    <span className="font-medium">{metrics.virtualDOMStats.totalItems}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Rendered:</span>
                    <span className="font-medium text-green-600">{metrics.virtualDOMStats.renderedItems}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Render Time:</span>
                    <span className="font-medium">{metrics.virtualDOMStats.renderTime.toFixed(2)}ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Memory:</span>
                    <span className="font-medium">{formatBytes(metrics.virtualDOMStats.memoryUsage)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={setupLazyLoadDemo}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                >
                  <Eye className="w-4 h-4" />
                  <span>Setup Lazy Load Demo</span>
                </button>
                <button
                  onClick={setupVirtualScrollDemo}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                >
                  <List className="w-4 h-4" />
                  <span>Setup Virtual Scroll Demo</span>
                </button>
                <button
                  onClick={handleExport}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Export Data</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'lazy-loading' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Lazy Loading Management</h3>
              <button
                onClick={setupLazyLoadDemo}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <Play className="w-4 h-4" />
                <span>Setup Demo</span>
              </button>
            </div>

            {/* Lazy Load Items */}
            <div className="bg-gray-50 rounded-lg overflow-hidden">
              <div className="px-4 py-3 bg-gray-100 border-b border-gray-200">
                <h4 className="font-medium text-gray-900">Registered Items ({lazyLoadItems.length})</h4>
              </div>
              <div className="max-h-96 overflow-y-auto">
                {lazyLoadItems.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <Eye className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No lazy load items registered</p>
                    <p className="text-sm">Click "Setup Demo" to create sample items</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {lazyLoadItems.map((item) => (
                      <div key={item.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                            {item.loaded ? (
                              <img src={item.src} alt={item.alt} className="w-full h-full object-cover rounded-lg" />
                            ) : (
                              <FileImage className="w-6 h-6 text-gray-400" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{item.id}</p>
                            <p className="text-sm text-gray-600">{item.alt}</p>
                            <div className="flex items-center space-x-2 mt-1">
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                item.priority === 'high' ? 'bg-red-100 text-red-800' :
                                item.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-green-100 text-green-800'
                              }`}>
                                {item.priority}
                              </span>
                              {item.loadTime && (
                                <span className="text-xs text-gray-500">{item.loadTime.toFixed(0)}ms</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(
                            item.error ? 'error' : 
                            item.loading ? 'loading' : 
                            item.loaded ? 'success' : 'idle'
                          )}
                          {item.retryCount > 0 && (
                            <span className="text-xs text-orange-600">Retry: {item.retryCount}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'compression' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Asset Compression</h3>
            </div>

            {/* File Upload */}
            <div className="bg-gray-50 p-6 rounded-lg border-2 border-dashed border-gray-300">
              <div className="text-center">
                <FileImage className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <h4 className="text-lg font-medium text-gray-900 mb-2">Upload Files for Compression</h4>
                <p className="text-gray-600 mb-4">Select images or text files to compress</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*,text/*"
                  onChange={(e) => setSelectedFiles(e.target.files)}
                  className="hidden"
                />
                <div className="flex justify-center space-x-2">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Select Files
                  </button>
                  {selectedFiles && (
                    <button
                      onClick={handleFileCompression}
                      disabled={isOptimizing}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
                    >
                      {isOptimizing ? <Loader className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                      <span>Compress</span>
                    </button>
                  )}
                </div>
                {selectedFiles && (
                  <p className="text-sm text-gray-600 mt-2">
                    {selectedFiles.length} file(s) selected
                  </p>
                )}
              </div>
            </div>

            {/* Compression Results */}
            {compressionResults.length > 0 && (
              <div className="bg-gray-50 rounded-lg overflow-hidden">
                <div className="px-4 py-3 bg-gray-100 border-b border-gray-200">
                  <h4 className="font-medium text-gray-900">Compression Results</h4>
                </div>
                <div className="divide-y divide-gray-200">
                  {compressionResults.map((result, index) => (
                    <div key={index} className="p-4 flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          {result.original.type.startsWith('image/') ? (
                            <FileImage className="w-5 h-5 text-blue-600" />
                          ) : (
                            <FileText className="w-5 h-5 text-blue-600" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{result.original.name}</p>
                          <p className="text-sm text-gray-600">
                            {formatBytes(result.original.size)} → {formatBytes(result.compressed.size)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-medium ${
                          result.ratio < 0.8 ? 'text-green-600' : 
                          result.ratio < 0.9 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {formatPercentage(result.ratio)}
                        </p>
                        <p className="text-sm text-gray-600">
                          {formatBytes(result.original.size - result.compressed.size)} saved
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Compressed Assets */}
            <div className="bg-gray-50 rounded-lg overflow-hidden">
              <div className="px-4 py-3 bg-gray-100 border-b border-gray-200">
                <h4 className="font-medium text-gray-900">Compressed Assets ({compressedAssets.length})</h4>
              </div>
              <div className="max-h-96 overflow-y-auto">
                {compressedAssets.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <FileImage className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No compressed assets</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {compressedAssets.map((asset) => (
                      <div key={asset.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                            <FileImage className="w-5 h-5 text-purple-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{asset.id}</p>
                            <p className="text-sm text-gray-600">{asset.format} • Quality: {asset.quality}</p>
                            <p className="text-sm text-gray-600">
                              {formatBytes(asset.originalSize)} → {formatBytes(asset.compressedSize)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center space-x-2">
                            {asset.cached && <CheckCircle className="w-4 h-4 text-green-500" />}
                            <span className="text-sm text-gray-600">
                              {formatPercentage(asset.compressedSize / asset.originalSize)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'virtual-dom' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Virtual DOM Management</h3>
              <button
                onClick={setupVirtualScrollDemo}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
              >
                <Play className="w-4 h-4" />
                <span>Setup Demo</span>
              </button>
            </div>

            {/* Virtual Scroll Demo */}
            <div className="bg-gray-50 rounded-lg overflow-hidden">
              <div className="px-4 py-3 bg-gray-100 border-b border-gray-200">
                <h4 className="font-medium text-gray-900">
                  Virtual Scroll Demo ({virtualScrollItems.length} items)
                </h4>
              </div>
              <div
                ref={virtualScrollRef}
                className="h-96 overflow-y-auto"
                style={{ contain: 'layout style paint' }}
              >
                {virtualScrollItems.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <List className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No virtual scroll items</p>
                    <p className="text-sm">Click "Setup Demo" to create 10,000 items</p>
                  </div>
                ) : (
                  <div className="p-4 text-center text-gray-600">
                    <p>Virtual scrolling active with {virtualScrollItems.length} items</p>
                    <p className="text-sm">Scroll to see virtualization in action</p>
                  </div>
                )}
              </div>
            </div>

            {/* Virtual Items Stats */}
            <div className="bg-gray-50 rounded-lg overflow-hidden">
              <div className="px-4 py-3 bg-gray-100 border-b border-gray-200">
                <h4 className="font-medium text-gray-900">Virtual Items ({virtualItems.length})</h4>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {virtualItems.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <Monitor className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No virtual items tracked</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {virtualItems.slice(0, 20).map((item) => (
                      <div key={item.id} className="p-3 flex items-center justify-between text-sm">
                        <div className="flex items-center space-x-3">
                          <span className="font-medium text-gray-900">#{item.index}</span>
                          <span className="text-gray-600">Height: {item.height}px</span>
                          <span className="text-gray-600">Offset: {item.offset}px</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          {item.visible && <Eye className="w-4 h-4 text-green-500" />}
                          {item.rendered && <CheckCircle className="w-4 h-4 text-blue-500" />}
                        </div>
                      </div>
                    ))}
                    {virtualItems.length > 20 && (
                      <div className="p-3 text-center text-gray-500 text-sm">
                        ... and {virtualItems.length - 20} more items
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'metrics' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Performance Metrics</h3>

            {/* Real-time Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-4 flex items-center">
                  <Cpu className="w-5 h-5 mr-2" />
                  System Performance
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">FPS:</span>
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${
                        metrics.generalStats.fps >= 55 ? 'bg-green-500' :
                        metrics.generalStats.fps >= 30 ? 'bg-yellow-500' : 'bg-red-500'
                      }`} />
                      <span className="font-medium">{metrics.generalStats.fps}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Memory Usage:</span>
                    <span className="font-medium">{formatBytes(metrics.generalStats.memoryUsage)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Bundle Size:</span>
                    <span className="font-medium">{formatBytes(metrics.generalStats.bundleSize)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Load Time:</span>
                    <span className="font-medium">{metrics.generalStats.loadTime.toFixed(0)}ms</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Interaction Delay:</span>
                    <span className="font-medium">{metrics.generalStats.interactionDelay.toFixed(0)}ms</span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-4 flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2" />
                  Optimization Impact
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Lazy Load Efficiency:</span>
                    <span className="font-medium text-green-600">
                      {formatPercentage(metrics.lazyLoadStats.cacheHitRate)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Compression Ratio:</span>
                    <span className="font-medium text-blue-600">
                      {formatPercentage(metrics.compressionStats.compressionRatio)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Virtual DOM Efficiency:</span>
                    <span className="font-medium text-purple-600">
                      {metrics.virtualDOMStats.totalItems > 0 
                        ? formatPercentage(metrics.virtualDOMStats.renderedItems / metrics.virtualDOMStats.totalItems)
                        : '0%'
                      }
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Bytes Saved:</span>
                    <span className="font-medium text-green-600">
                      {formatBytes(metrics.compressionStats.savedBytes)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Performance Alerts */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-medium text-yellow-800 mb-2 flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2" />
                Performance Alerts
              </h4>
              <div className="space-y-2 text-sm">
                {metrics.generalStats.fps < 30 && (
                  <div className="flex items-center space-x-2 text-red-600">
                    <XCircle className="w-4 h-4" />
                    <span>Low FPS detected ({metrics.generalStats.fps})</span>
                  </div>
                )}
                {metrics.generalStats.memoryUsage > 100 * 1024 * 1024 && (
                  <div className="flex items-center space-x-2 text-orange-600">
                    <AlertTriangle className="w-4 h-4" />
                    <span>High memory usage ({formatBytes(metrics.generalStats.memoryUsage)})</span>
                  </div>
                )}
                {metrics.generalStats.loadTime > 3000 && (
                  <div className="flex items-center space-x-2 text-red-600">
                    <Clock className="w-4 h-4" />
                    <span>Slow load time ({metrics.generalStats.loadTime.toFixed(0)}ms)</span>
                  </div>
                )}
                {metrics.lazyLoadStats.failedItems > 0 && (
                  <div className="flex items-center space-x-2 text-red-600">
                    <XCircle className="w-4 h-4" />
                    <span>{metrics.lazyLoadStats.failedItems} lazy load failures</span>
                  </div>
                )}
                {metrics.generalStats.fps >= 30 && 
                 metrics.generalStats.memoryUsage <= 100 * 1024 * 1024 && 
                 metrics.generalStats.loadTime <= 3000 && 
                 metrics.lazyLoadStats.failedItems === 0 && (
                  <div className="flex items-center space-x-2 text-green-600">
                    <CheckCircle className="w-4 h-4" />
                    <span>All performance metrics are healthy</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Performance Settings</h3>
              <div className="flex space-x-2">
                <button
                  onClick={handleExport}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Export</span>
                </button>
                <input
                  ref={importInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  className="hidden"
                />
                <button
                  onClick={() => importInputRef.current?.click()}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                >
                  <Upload className="w-4 h-4" />
                  <span>Import</span>
                </button>
              </div>
            </div>

            {/* Configuration Sections */}
            <div className="space-y-6">
              {/* Lazy Loading Config */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-4 flex items-center">
                  <Eye className="w-5 h-5 mr-2" />
                  Lazy Loading Configuration
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Root Margin
                    </label>
                    <input
                      type="text"
                      value={editingConfig?.lazyLoad?.rootMargin ?? config.lazyLoad.rootMargin}
                      onChange={(e) => setEditingConfig(prev => ({
                        ...prev,
                        lazyLoad: { ...config.lazyLoad, ...prev?.lazyLoad, rootMargin: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Threshold
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="1"
                      step="0.1"
                      value={editingConfig?.lazyLoad?.threshold ?? config.lazyLoad.threshold}
                      onChange={(e) => setEditingConfig(prev => ({
                        ...prev,
                        lazyLoad: { ...config.lazyLoad, ...prev?.lazyLoad, threshold: parseFloat(e.target.value) }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Max Concurrent Loads
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={editingConfig?.lazyLoad?.maxConcurrentLoads ?? config.lazyLoad.maxConcurrentLoads}
                      onChange={(e) => setEditingConfig(prev => ({
                        ...prev,
                        lazyLoad: { ...config.lazyLoad, ...prev?.lazyLoad, maxConcurrentLoads: parseInt(e.target.value) }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Retry Attempts
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="10"
                      value={editingConfig?.lazyLoad?.retryAttempts ?? config.lazyLoad.retryAttempts}
                      onChange={(e) => setEditingConfig(prev => ({
                        ...prev,
                        lazyLoad: { ...config.lazyLoad, ...prev?.lazyLoad, retryAttempts: parseInt(e.target.value) }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={editingConfig?.lazyLoad?.enableIntersectionObserver ?? config.lazyLoad.enableIntersectionObserver}
                      onChange={(e) => setEditingConfig(prev => ({
                        ...prev,
                        lazyLoad: { ...config.lazyLoad, ...prev?.lazyLoad, enableIntersectionObserver: e.target.checked }
                      }))}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Enable Intersection Observer</span>
                  </label>
                </div>
              </div>

              {/* Compression Config */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-4 flex items-center">
                  <FileImage className="w-5 h-5 mr-2" />
                  Compression Configuration
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Image Quality
                    </label>
                    <input
                      type="number"
                      min="0.1"
                      max="1"
                      step="0.1"
                      value={editingConfig?.compression?.imageQuality ?? config.compression.imageQuality}
                      onChange={(e) => setEditingConfig(prev => ({
                        ...prev,
                        compression: { ...config.compression, ...prev?.compression, imageQuality: parseFloat(e.target.value) }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Min Compression Size (bytes)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={editingConfig?.compression?.minCompressionSize ?? config.compression.minCompressionSize}
                      onChange={(e) => setEditingConfig(prev => ({
                        ...prev,
                        compression: { ...config.compression, ...prev?.compression, minCompressionSize: parseInt(e.target.value) }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={editingConfig?.compression?.enableImageCompression ?? config.compression.enableImageCompression}
                      onChange={(e) => setEditingConfig(prev => ({
                        ...prev,
                        compression: { ...config.compression, ...prev?.compression, enableImageCompression: e.target.checked }
                      }))}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Enable Image Compression</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={editingConfig?.compression?.enableWebP ?? config.compression.enableWebP}
                      onChange={(e) => setEditingConfig(prev => ({
                        ...prev,
                        compression: { ...config.compression, ...prev?.compression, enableWebP: e.target.checked }
                      }))}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Enable WebP Format</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={editingConfig?.compression?.enableBrotli ?? config.compression.enableBrotli}
                      onChange={(e) => setEditingConfig(prev => ({
                        ...prev,
                        compression: { ...config.compression, ...prev?.compression, enableBrotli: e.target.checked }
                      }))}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Enable Brotli Compression</span>
                  </label>
                </div>
              </div>

              {/* Virtual DOM Config */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-4 flex items-center">
                  <List className="w-5 h-5 mr-2" />
                  Virtual DOM Configuration
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Item Height (px)
                    </label>
                    <input
                      type="number"
                      min="20"
                      max="200"
                      value={editingConfig?.virtualDOM?.itemHeight ?? config.virtualDOM.itemHeight}
                      onChange={(e) => setEditingConfig(prev => ({
                        ...prev,
                        virtualDOM: { ...config.virtualDOM, ...prev?.virtualDOM, itemHeight: parseInt(e.target.value) }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Overscan
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="20"
                      value={editingConfig?.virtualDOM?.overscan ?? config.virtualDOM.overscan}
                      onChange={(e) => setEditingConfig(prev => ({
                        ...prev,
                        virtualDOM: { ...config.virtualDOM, ...prev?.virtualDOM, overscan: parseInt(e.target.value) }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={editingConfig?.virtualDOM?.enableVirtualization ?? config.virtualDOM.enableVirtualization}
                      onChange={(e) => setEditingConfig(prev => ({
                        ...prev,
                        virtualDOM: { ...config.virtualDOM, ...prev?.virtualDOM, enableVirtualization: e.target.checked }
                      }))}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Enable Virtualization</span>
                  </label>
                </div>
              </div>

              {/* General Settings */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-4 flex items-center">
                  <Settings className="w-5 h-5 mr-2" />
                  General Settings
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cache Strategy
                    </label>
                    <select
                      value={editingConfig?.cacheStrategy ?? config.cacheStrategy}
                      onChange={(e) => setEditingConfig(prev => ({
                        ...prev,
                        cacheStrategy: e.target.value as 'lru' | 'lfu' | 'fifo'
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="lru">LRU (Least Recently Used)</option>
                      <option value="lfu">LFU (Least Frequently Used)</option>
                      <option value="fifo">FIFO (First In, First Out)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Max Cache Entries
                    </label>
                    <input
                      type="number"
                      min="100"
                      max="10000"
                      value={editingConfig?.maxCacheEntries ?? config.maxCacheEntries}
                      onChange={(e) => setEditingConfig(prev => ({
                        ...prev,
                        maxCacheEntries: parseInt(e.target.value)
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={editingConfig?.enablePerformanceMonitoring ?? config.enablePerformanceMonitoring}
                      onChange={(e) => setEditingConfig(prev => ({
                        ...prev,
                        enablePerformanceMonitoring: e.target.checked
                      }))}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Enable Performance Monitoring</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={editingConfig?.enableDebugMode ?? config.enableDebugMode}
                      onChange={(e) => setEditingConfig(prev => ({
                        ...prev,
                        enableDebugMode: e.target.checked
                      }))}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Enable Debug Mode</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Save Configuration */}
            {editingConfig && (
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setEditingConfig(null)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfigUpdate}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Save Configuration</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PerformanceOptimizationsManager;