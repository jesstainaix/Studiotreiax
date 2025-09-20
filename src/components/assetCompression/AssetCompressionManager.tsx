import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  useAssetCompression,
  useAssetCompressionStats,
  useAssetCompressionAssets,
  useAssetCompressionProfiles,
  useAssetCompressionBatches,
  useAssetCompressionEvents,
  useAssetCompressionMetrics,
  useAssetCompressionProcessor
} from '../../hooks/useAssetCompression';
import {
  CompressionAsset,
  CompressionProfile,
  CompressionBatch,
  CompressionSettings,
  CompressionOptimization,
  CompressionEvent
} from '../../utils/assetCompression';
import {
  Play,
  Pause,
  Square,
  Download,
  Upload,
  Settings,
  BarChart3,
  FileImage,
  FileVideo,
  FileAudio,
  Zap,
  Clock,
  HardDrive,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Filter,
  Search,
  MoreHorizontal,
  Eye,
  Trash2,
  Copy,
  Edit,
  Plus,
  Minus,
  ChevronDown,
  ChevronRight,
  Info,
  Maximize2,
  Minimize2
} from 'lucide-react';

interface AssetCompressionManagerProps {
  className?: string;
}

const AssetCompressionManager: React.FC<AssetCompressionManagerProps> = ({ className = '' }) => {
  // Hooks
  const {
    assets,
    profiles,
    batches,
    optimizations,
    config,
    stats,
    metrics,
    events,
    isProcessing,
    isInitialized,
    actions,
    quickActions,
    advanced,
    system,
    utils,
    configuration,
    analytics,
    computed
  } = useAssetCompression();

  const { pendingAssets, processingAssets, completedAssets, failedAssets } = useAssetCompressionAssets();
  const { defaultProfiles, customProfiles, createProfile } = useAssetCompressionProfiles();
  const { activeBatches, completedBatches, pendingBatches } = useAssetCompressionBatches();
  const { recentEvents, errorEvents, successEvents } = useAssetCompressionEvents();
  const { latestMetrics, metricsHistory } = useAssetCompressionMetrics();
  const { processFile, processFiles } = useAssetCompressionProcessor();

  // Local state
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [selectedAssets, setSelectedAssets] = useState<string[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<CompressionAsset | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<CompressionProfile | null>(null);
  const [showAssetModal, setShowAssetModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

  // Auto-refresh effect
  useEffect(() => {
    const interval = setInterval(() => {
      if (isProcessing) {
        analytics.getMetrics();
        analytics.getStats();
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [isProcessing, analytics]);

  // Demo data generation effect
  useEffect(() => {
    if (assets.length === 0 && isInitialized) {
      const generateDemoData = async () => {
        try {
          // Create sample profiles
          createProfile({
            name: 'Web Optimized',
            description: 'Optimized for web delivery',
            settings: {
              quality: 85,
              format: 'webp',
              progressive: true,
              stripMetadata: true,
              enableLossless: false,
              maxWidth: 1920,
              maxHeight: 1080
            },
            isDefault: false,
            isCustom: true
          });

          createProfile({
            name: 'High Quality',
            description: 'Maximum quality with minimal compression',
            settings: {
              quality: 95,
              format: 'original',
              progressive: false,
              stripMetadata: false,
              enableLossless: true,
              maxWidth: 4096,
              maxHeight: 4096
            },
            isDefault: false,
            isCustom: true
          });
        } catch (error) {
          console.error('Failed to generate demo data:', error);
        }
      };

      const timeout = setTimeout(generateDemoData, 1000);
      return () => clearTimeout(timeout);
    }
  }, [assets.length, isInitialized, createProfile]);

  // Filter and sort functions
  const filteredAssets = useMemo(() => {
    let filtered = assets;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(asset =>
        asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.type.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply type filter
    if (filterType !== 'all') {
      filtered = filtered.filter(asset => {
        switch (filterType) {
          case 'image': return asset.type.startsWith('image/');
          case 'video': return asset.type.startsWith('video/');
          case 'audio': return asset.type.startsWith('audio/');
          case 'pending': return asset.status === 'pending';
          case 'processing': return asset.status === 'compressing';
          case 'completed': return asset.status === 'completed';
          case 'failed': return asset.status === 'failed';
          default: return true;
        }
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'name':
          aValue = a.name;
          bValue = b.name;
          break;
        case 'size':
          aValue = a.originalSize;
          bValue = b.originalSize;
          break;
        case 'ratio':
          aValue = a.compressionRatio || 0;
          bValue = b.compressionRatio || 0;
          break;
        case 'created':
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
          break;
        default:
          aValue = a.name;
          bValue = b.name;
      }
      
      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [assets, searchTerm, filterType, sortBy, sortOrder]);

  // Status cards data
  const statusCards = useMemo(() => [
    {
      title: 'Total Assets',
      value: computed.totalAssets.toString(),
      icon: FileImage,
      color: 'bg-blue-500',
      change: '+12%'
    },
    {
      title: 'Active Compressions',
      value: computed.activeCompressions.toString(),
      icon: Zap,
      color: 'bg-yellow-500',
      change: computed.activeCompressions > 0 ? 'Processing' : 'Idle'
    },
    {
      title: 'Total Savings',
      value: `${(computed.totalSavings / (1024 * 1024)).toFixed(1)}MB`,
      icon: HardDrive,
      color: 'bg-green-500',
      change: '+8.5%'
    },
    {
      title: 'Avg Compression',
      value: `${(computed.averageRatio * 100).toFixed(1)}%`,
      icon: TrendingUp,
      color: 'bg-purple-500',
      change: '+2.1%'
    }
  ], [computed]);

  // Tab configuration
  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'assets', label: 'Assets', icon: FileImage },
    { id: 'profiles', label: 'Profiles', icon: Settings },
    { id: 'batches', label: 'Batches', icon: Copy },
    { id: 'performance', label: 'Performance', icon: TrendingUp },
    { id: 'events', label: 'Events', icon: Clock },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'debug', label: 'Debug', icon: Info }
  ];

  // Event handlers
  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    try {
      await processFiles(files, undefined, (progress) => {
      });
    } catch (error) {
      setErrorMessage(`Failed to upload files: ${error}`);
      setShowErrorModal(true);
    }
  }, [processFiles]);

  const handleAssetCompress = useCallback(async (assetId: string, profileId?: string) => {
    try {
      await actions.compressAsset(assetId, profileId);
    } catch (error) {
      setErrorMessage(`Failed to compress asset: ${error}`);
      setShowErrorModal(true);
    }
  }, [actions]);

  const handleBulkCompress = useCallback(async () => {
    try {
      await quickActions.bulkOptimize(selectedAssets, (progress) => {
      });
      setSelectedAssets([]);
    } catch (error) {
      setErrorMessage(`Failed to bulk compress: ${error}`);
      setShowErrorModal(true);
    }
  }, [quickActions, selectedAssets]);

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return FileImage;
    if (type.startsWith('video/')) return FileVideo;
    if (type.startsWith('audio/')) return FileAudio;
    return FileImage;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-500';
      case 'compressing': return 'text-blue-500';
      case 'completed': return 'text-green-500';
      case 'failed': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return Clock;
      case 'compressing': return RefreshCw;
      case 'completed': return CheckCircle;
      case 'failed': return XCircle;
      default: return Clock;
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  return (
    <div className={`asset-compression-manager bg-white rounded-lg shadow-lg ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Zap className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Asset Compression</h2>
            <p className="text-sm text-gray-500">
              {isInitialized ? 'System ready' : 'Initializing...'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            {isExpanded ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </button>
          
          <label className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors cursor-pointer">
            <Upload className="w-4 h-4 mr-2" />
            Upload Files
            <input
              type="file"
              multiple
              accept="image/*,video/*,audio/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
          
          <button
            onClick={() => setShowSettingsModal(true)}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-6">
        {statusCards.map((card, index) => {
          const IconComponent = card.icon;
          return (
            <div key={index} className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{card.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                  <p className="text-xs text-gray-500">{card.change}</p>
                </div>
                <div className={`p-3 rounded-lg ${card.color}`}>
                  <IconComponent className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-6">
          {tabs.map((tab) => {
            const IconComponent = tab.icon;
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
                <IconComponent className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className={`p-6 ${isExpanded ? 'min-h-[600px]' : 'min-h-[400px]'}`}>
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* System Health */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">System Health</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className={`text-2xl font-bold ${
                    computed.systemHealth > 0.8 ? 'text-green-500' : 
                    computed.systemHealth > 0.6 ? 'text-yellow-500' : 'text-red-500'
                  }`}>
                    {(computed.systemHealth * 100).toFixed(0)}%
                  </div>
                  <div className="text-sm text-gray-500">Health Score</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-500">
                    {computed.queueLength}
                  </div>
                  <div className="text-sm text-gray-500">Queue Length</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-500">
                    {formatDuration(computed.timeRemaining)}
                  </div>
                  <div className="text-sm text-gray-500">Time Remaining</div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                <button
                  onClick={() => quickActions.compressAll()}
                  disabled={pendingAssets.length === 0}
                  className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Compress All
                </button>
                
                <button
                  onClick={() => quickActions.optimizeForWeb(selectedAssets)}
                  disabled={selectedAssets.length === 0}
                  className="flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Web Optimize
                </button>
                
                <button
                  onClick={() => quickActions.convertToWebP(selectedAssets)}
                  disabled={selectedAssets.length === 0}
                  className="flex items-center justify-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <FileImage className="w-4 h-4 mr-2" />
                  Convert WebP
                </button>
                
                <button
                  onClick={() => system.cleanup()}
                  className="flex items-center justify-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Cleanup
                </button>
              </div>
            </div>

            {/* Recent Events */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Events</h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {recentEvents.slice(0, 10).map((event, index) => {
                  const IconComponent = event.type === 'compression_completed' ? CheckCircle :
                                     event.type === 'compression_failed' ? XCircle :
                                     event.type === 'compression_started' ? Play : Info;
                  return (
                    <div key={index} className="flex items-center space-x-3 p-2 bg-white rounded border">
                      <IconComponent className={`w-4 h-4 ${
                        event.severity === 'error' ? 'text-red-500' :
                        event.severity === 'success' ? 'text-green-500' :
                        event.severity === 'warning' ? 'text-yellow-500' : 'text-blue-500'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{event.message}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(event.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Assets Tab */}
        {activeTab === 'assets' && (
          <div className="space-y-4">
            {/* Filters and Search */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search assets..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="all">All Types</option>
                <option value="image">Images</option>
                <option value="video">Videos</option>
                <option value="audio">Audio</option>
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
              </select>
              
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="name">Name</option>
                <option value="size">Size</option>
                <option value="ratio">Compression</option>
                <option value="created">Created</option>
              </select>
              
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </button>
            </div>

            {/* Bulk Actions */}
            {selectedAssets.length > 0 && (
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <span className="text-sm text-blue-700">
                  {selectedAssets.length} asset(s) selected
                </span>
                <div className="flex space-x-2">
                  <button
                    onClick={handleBulkCompress}
                    className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
                  >
                    Compress Selected
                  </button>
                  <button
                    onClick={() => setSelectedAssets([])}
                    className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700 transition-colors"
                  >
                    Clear Selection
                  </button>
                </div>
              </div>
            )}

            {/* Assets List */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <input
                          type="checkbox"
                          checked={selectedAssets.length === filteredAssets.length && filteredAssets.length > 0}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedAssets(filteredAssets.map(a => a.id));
                            } else {
                              setSelectedAssets([]);
                            }
                          }}
                          className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                        />
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Asset
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Size
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Compression
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredAssets.map((asset) => {
                      const FileIcon = getFileIcon(asset.type);
                      const StatusIcon = getStatusIcon(asset.status);
                      
                      return (
                        <tr key={asset.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <input
                              type="checkbox"
                              checked={selectedAssets.includes(asset.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedAssets([...selectedAssets, asset.id]);
                                } else {
                                  setSelectedAssets(selectedAssets.filter(id => id !== asset.id));
                                }
                              }}
                              className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <FileIcon className="w-5 h-5 text-gray-400 mr-3" />
                              <div>
                                <div className="text-sm font-medium text-gray-900">{asset.name}</div>
                                <div className="text-sm text-gray-500">{asset.type}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{formatBytes(asset.originalSize)}</div>
                            {asset.compressedSize && (
                              <div className="text-sm text-gray-500">
                                → {formatBytes(asset.compressedSize)}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <StatusIcon className={`w-4 h-4 mr-2 ${getStatusColor(asset.status)}`} />
                              <span className={`text-sm ${getStatusColor(asset.status)}`}>
                                {asset.status}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {asset.compressionRatio ? (
                              <div className="text-sm text-gray-900">
                                {(asset.compressionRatio * 100).toFixed(1)}%
                              </div>
                            ) : (
                              <span className="text-sm text-gray-500">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => {
                                  setSelectedAsset(asset);
                                  setShowAssetModal(true);
                                }}
                                className="text-purple-600 hover:text-purple-900 transition-colors"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              
                              {asset.status === 'pending' && (
                                <button
                                  onClick={() => handleAssetCompress(asset.id)}
                                  className="text-blue-600 hover:text-blue-900 transition-colors"
                                >
                                  <Play className="w-4 h-4" />
                                </button>
                              )}
                              
                              <button
                                onClick={() => actions.deleteAsset(asset.id)}
                                className="text-red-600 hover:text-red-900 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
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

        {/* Placeholder for other tabs */}
        {activeTab === 'profiles' && (
          <div className="text-center py-12">
            <Settings className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Compression Profiles</h3>
            <p className="text-gray-500">Manage compression profiles and settings</p>
          </div>
        )}

        {activeTab === 'batches' && (
          <div className="text-center py-12">
            <Copy className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Batch Processing</h3>
            <p className="text-gray-500">Manage batch compression operations</p>
          </div>
        )}

        {activeTab === 'performance' && (
          <div className="text-center py-12">
            <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Performance Metrics</h3>
            <p className="text-gray-500">View compression performance and analytics</p>
          </div>
        )}

        {activeTab === 'events' && (
          <div className="text-center py-12">
            <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Event Log</h3>
            <p className="text-gray-500">View system events and activity log</p>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="text-center py-12">
            <Settings className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">System Settings</h3>
            <p className="text-gray-500">Configure compression system settings</p>
          </div>
        )}

        {activeTab === 'debug' && (
          <div className="text-center py-12">
            <Info className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Debug Information</h3>
            <p className="text-gray-500">View debug logs and system information</p>
          </div>
        )}
      </div>

      {/* Asset Details Modal */}
      {showAssetModal && selectedAsset && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Asset Details</h3>
              <button
                onClick={() => setShowAssetModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <p className="text-sm text-gray-900">{selectedAsset.name}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <p className="text-sm text-gray-900">{selectedAsset.type}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Original Size</label>
                  <p className="text-sm text-gray-900">{formatBytes(selectedAsset.originalSize)}</p>
                </div>
                
                {selectedAsset.compressedSize && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Compressed Size</label>
                    <p className="text-sm text-gray-900">{formatBytes(selectedAsset.compressedSize)}</p>
                  </div>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <div className="flex items-center">
                  <div className={`w-2 h-2 rounded-full mr-2 ${getStatusColor(selectedAsset.status).replace('text-', 'bg-')}`}></div>
                  <span className="text-sm text-gray-900">{selectedAsset.status}</span>
                </div>
              </div>
              
              {selectedAsset.compressionRatio && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Compression Ratio</label>
                  <p className="text-sm text-gray-900">{(selectedAsset.compressionRatio * 100).toFixed(1)}%</p>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Created</label>
                <p className="text-sm text-gray-900">{new Date(selectedAsset.createdAt).toLocaleString()}</p>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowAssetModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Close
              </button>
              
              {selectedAsset.status === 'pending' && (
                <button
                  onClick={() => {
                    handleAssetCompress(selectedAsset.id);
                    setShowAssetModal(false);
                  }}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Compress
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Error Modal */}
      {showErrorModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Error</h3>
              <button
                onClick={() => setShowErrorModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            <div className="mb-4">
              <div className="flex items-center mb-2">
                <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
                <span className="text-sm font-medium text-red-700">Operation Failed</span>
              </div>
              <p className="text-sm text-gray-600">{errorMessage}</p>
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
};

export default AssetCompressionManager;