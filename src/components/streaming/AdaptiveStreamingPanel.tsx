import React, { useState, useCallback, useMemo } from 'react';
import {
  Play,
  Pause,
  Square,
  Settings,
  Monitor,
  Wifi,
  Activity,
  BarChart3,
  Video,
  Upload,
  Download,
  Zap,
  Clock,
  Users,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  FileVideo,
  Gauge,
  Signal,
  Globe,
  Smartphone,
  Laptop,
  Router,
  Plus,
  Edit,
  Trash2,
  ExternalLink
} from 'lucide-react';
import useAdaptiveStreaming, {
  useStreamingProgress,
  useStreamingStats,
  useStreamSearch,
  useCurrentStream,
  useNetworkMonitoring
} from '../../hooks/useAdaptiveStreaming';
import {
  AdaptiveStream,
  VideoQuality,
  NetworkCondition,
  formatBitrate,
  formatFileSize,
  formatDuration,
  getQualityColor,
  getNetworkQualityIcon,
  getStreamStatusColor
} from '../../services/adaptiveStreamingService';

interface AdaptiveStreamingPanelProps {
  className?: string;
}

const AdaptiveStreamingPanel: React.FC<AdaptiveStreamingPanelProps> = ({ className = '' }) => {
  // Hooks
  const {
    streams,
    networkCondition,
    playerState,
    config,
    stats,
    metrics,
    isLoading,
    error,
    selectedStreamId,
    computed,
    filtered,
    actions,
    quickActions,
    setSelectedStream
  } = useAdaptiveStreaming();
  
  const { progress } = useStreamingProgress();
  const { stats: streamingStats } = useStreamingStats();
  const { currentStream } = useCurrentStream();
  const { monitorNetwork } = useNetworkMonitoring();
  
  // Local state
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [createType, setCreateType] = useState<'stream' | 'quality' | 'config'>('stream');
  
  // Search hook
  const { filteredStreams } = useStreamSearch(searchTerm, {
    status: statusFilter,
    type: typeFilter
  });
  
  // Auto-refresh demo data
  React.useEffect(() => {
    const interval = setInterval(() => {
      actions.refresh();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [actions]);
  
  // Status cards data
  const statusCards = useMemo(() => [
    {
      title: 'Total Streams',
      value: computed.totalStreams.toString(),
      change: '+12%',
      trend: 'up' as const,
      icon: Video,
      color: 'blue'
    },
    {
      title: 'Active Streams',
      value: computed.activeStreams.toString(),
      change: '+8%',
      trend: 'up' as const,
      icon: Play,
      color: 'green'
    },
    {
      title: 'Total Bandwidth',
      value: formatBitrate(computed.totalBandwidth),
      change: '-5%',
      trend: 'down' as const,
      icon: Activity,
      color: 'purple'
    },
    {
      title: 'System Health',
      value: `${Math.round(stats.systemHealth)}%`,
      change: '+3%',
      trend: 'up' as const,
      icon: Gauge,
      color: stats.isHealthy ? 'green' : 'red'
    }
  ], [computed, stats]);
  
  // Tab configuration
  const tabs = [
    { id: 'overview', label: 'Overview', icon: Monitor },
    { id: 'streams', label: 'Streams', icon: Video },
    { id: 'qualities', label: 'Qualities', icon: Settings },
    { id: 'network', label: 'Network', icon: Wifi },
    { id: 'player', label: 'Player', icon: Play },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];
  
  // Helper functions
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'streaming': return Play;
      case 'ready': return CheckCircle;
      case 'preparing': return Clock;
      case 'paused': return Pause;
      case 'error': return XCircle;
      default: return AlertTriangle;
    }
  };
  
  const getStatusColor = (status: string): string => {
    return getStreamStatusColor(status);
  };
  
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'hls': return FileVideo;
      case 'dash': return Video;
      case 'smooth': return Activity;
      default: return Video;
    }
  };
  
  const getConnectionIcon = (type: string) => {
    switch (type) {
      case 'wifi': return Wifi;
      case 'cellular': return Smartphone;
      case 'ethernet': return Laptop;
      default: return Router;
    }
  };
  
  const getTrendIcon = (trend: 'up' | 'down') => {
    return trend === 'up' ? TrendingUp : TrendingDown;
  };
  
  const formatTime = (timestamp: Date): string => {
    return new Intl.DateTimeFormat('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(timestamp);
  };
  
  const formatQuality = (quality: VideoQuality): string => {
    return `${quality.label} (${quality.width}x${quality.height})`;
  };
  
  // Event handlers
  const handleQuickAction = useCallback(async (action: string, streamId?: string) => {
    try {
      switch (action) {
        case 'play':
          if (streamId) await quickActions.quickPlay(streamId);
          break;
        case 'pause':
          if (streamId) await quickActions.quickPause(streamId);
          break;
        case 'optimize':
          await quickActions.quickOptimize();
          break;
        case 'refresh':
          await actions.refresh();
          break;
        case 'monitor':
          await monitorNetwork();
          break;
      }
    } catch (error) {
      console.error('Quick action failed:', error);
    }
  }, [quickActions, actions, monitorNetwork]);
  
  const handleCardExpand = useCallback((cardId: string) => {
    setExpandedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(cardId)) {
        newSet.delete(cardId);
      } else {
        newSet.add(cardId);
      }
      return newSet;
    });
  }, []);
  
  const handleItemSelect = useCallback((itemId: string) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  }, []);
  
  const handleCreateNew = useCallback((type: 'stream' | 'quality' | 'config') => {
    setCreateType(type);
    setShowCreateDialog(true);
  }, []);
  
  // Render functions
  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statusCards.map((card, index) => {
          const IconComponent = card.icon;
          const TrendIcon = getTrendIcon(card.trend);
          
          return (
            <div key={index} className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg bg-${card.color}-100`}>
                    <IconComponent className={`h-5 w-5 text-${card.color}-600`} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">{card.title}</p>
                    <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                  </div>
                </div>
                <div className={`flex items-center space-x-1 text-sm ${
                  card.trend === 'up' ? 'text-green-600' : 'text-red-600'
                }`}>
                  <TrendIcon className="h-4 w-4" />
                  <span>{card.change}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Network Status */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Network Status</h3>
          <button
            onClick={() => handleQuickAction('monitor')}
            className="flex items-center space-x-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Monitor</span>
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex items-center space-x-3">
            <Signal className="h-5 w-5 text-blue-600" />
            <div>
              <p className="text-sm text-gray-600">Bandwidth</p>
              <p className="font-semibold">{formatBitrate(networkCondition.bandwidth)}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <Clock className="h-5 w-5 text-green-600" />
            <div>
              <p className="text-sm text-gray-600">Latency</p>
              <p className="font-semibold">{networkCondition.latency}ms</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <Activity className="h-5 w-5 text-purple-600" />
            <div>
              <p className="text-sm text-gray-600">Packet Loss</p>
              <p className="font-semibold">{networkCondition.packetLoss}%</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {React.createElement(getConnectionIcon(networkCondition.connectionType), {
              className: 'h-5 w-5 text-orange-600'
            })}
            <div>
              <p className="text-sm text-gray-600">Connection</p>
              <p className="font-semibold capitalize">{networkCondition.connectionType}</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Recent Activity */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
        
        <div className="space-y-3">
          {computed.recentActivity.slice(0, 5).map((activity, index) => (
            <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <div className={`p-2 rounded-full ${
                activity.severity === 'high' ? 'bg-red-100 text-red-600' :
                activity.severity === 'medium' ? 'bg-yellow-100 text-yellow-600' :
                'bg-blue-100 text-blue-600'
              }`}>
                <Activity className="h-4 w-4" />
              </div>
              
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{activity.details}</p>
                <p className="text-xs text-gray-500">{formatTime(activity.timestamp)}</p>
              </div>
              
              <span className={`px-2 py-1 text-xs rounded-full ${
                activity.type === 'error' ? 'bg-red-100 text-red-700' :
                activity.type === 'buffer_event' ? 'bg-yellow-100 text-yellow-700' :
                'bg-blue-100 text-blue-700'
              }`}>
                {activity.type.replace('_', ' ')}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
  
  const renderStreamsTab = () => (
    <div className="space-y-6">
      {/* Streams List */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Streams</h3>
            <button
              onClick={() => handleCreateNew('stream')}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>New Stream</span>
            </button>
          </div>
        </div>
        
        <div className="p-6">
          <div className="space-y-4">
            {filteredStreams.map((stream) => {
              const StatusIcon = getStatusIcon(stream.status);
              const TypeIcon = getTypeIcon(stream.type);
              const isExpanded = expandedCards.has(stream.id);
              const isSelected = selectedItems.has(stream.id);
              
              return (
                <div
                  key={stream.id}
                  className={`border rounded-lg p-4 transition-all ${
                    isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleItemSelect(stream.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      
                      <img
                        src={stream.thumbnail}
                        alt={stream.title}
                        className="w-16 h-12 object-cover rounded"
                      />
                      
                      <div>
                        <h4 className="font-semibold text-gray-900">{stream.title}</h4>
                        <p className="text-sm text-gray-600">{stream.description}</p>
                        <div className="flex items-center space-x-4 mt-1">
                          <div className="flex items-center space-x-1">
                            <StatusIcon className={`h-4 w-4 ${getStatusColor(stream.status)}`} />
                            <span className={`text-sm capitalize ${getStatusColor(stream.status)}`}>
                              {stream.status}
                            </span>
                          </div>
                          
                          <div className="flex items-center space-x-1">
                            <TypeIcon className="h-4 w-4 text-gray-500" />
                            <span className="text-sm text-gray-500 uppercase">{stream.type}</span>
                          </div>
                          
                          <div className="flex items-center space-x-1">
                            <Clock className="h-4 w-4 text-gray-500" />
                            <span className="text-sm text-gray-500">{formatDuration(stream.duration)}</span>
                          </div>
                          
                          <div className="flex items-center space-x-1">
                            <Eye className="h-4 w-4 text-gray-500" />
                            <span className="text-sm text-gray-500">{stream.analytics.totalViews}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {stream.status === 'ready' && (
                        <button
                          onClick={() => handleQuickAction('play', stream.id)}
                          className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                          title="Play Stream"
                        >
                          <Play className="h-4 w-4" />
                        </button>
                      )}
                      
                      {stream.status === 'streaming' && (
                        <button
                          onClick={() => handleQuickAction('pause', stream.id)}
                          className="p-2 text-yellow-600 hover:bg-yellow-100 rounded-lg transition-colors"
                          title="Pause Stream"
                        >
                          <Pause className="h-4 w-4" />
                        </button>
                      )}
                      
                      <button
                        onClick={() => setSelectedStream(stream.id)}
                        className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                        title="Select Stream"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </button>
                      
                      <button
                        onClick={() => handleCardExpand(stream.id)}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        title={isExpanded ? 'Collapse' : 'Expand'}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div>
                          <h5 className="font-medium text-gray-900 mb-2">Qualities</h5>
                          <div className="space-y-1">
                            {stream.qualities.map((quality) => (
                              <div key={quality.id} className="flex items-center justify-between text-sm">
                                <span className={getQualityColor(quality.label)}>{quality.label}</span>
                                <span className="text-gray-500">{formatBitrate(quality.bitrate)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        <div>
                          <h5 className="font-medium text-gray-900 mb-2">Metadata</h5>
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Original Size:</span>
                              <span>{formatFileSize(stream.metadata.originalSize)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Compressed:</span>
                              <span>{formatFileSize(stream.metadata.compressedSize)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Compression:</span>
                              <span>{Math.round(stream.metadata.compressionRatio * 100)}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Processing:</span>
                              <span>{stream.metadata.processingTime}s</span>
                            </div>
                          </div>
                        </div>
                        
                        <div>
                          <h5 className="font-medium text-gray-900 mb-2">Analytics</h5>
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Watch Time:</span>
                              <span>{formatDuration(stream.analytics.averageWatchTime)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Quality Switches:</span>
                              <span>{stream.analytics.qualitySwitches}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Buffer Events:</span>
                              <span>{stream.analytics.bufferEvents}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Satisfaction:</span>
                              <span>{Math.round(stream.analytics.userSatisfaction * 100)}%</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
  
  const renderSettingsTab = () => (
    <div className="space-y-6">
      {/* Adaptive Streaming Settings */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Adaptive Streaming</h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-900">Enable Adaptive Streaming</label>
              <p className="text-sm text-gray-600">Automatically adjust quality based on network conditions</p>
            </div>
            <input
              type="checkbox"
              checked={config.adaptive.enabled}
              onChange={(e) => actions.updateConfig({
                adaptive: { ...config.adaptive, enabled: e.target.checked }
              })}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Algorithm</label>
            <select
              value={config.adaptive.algorithm}
              onChange={(e) => actions.updateConfig({
                adaptive: { ...config.adaptive, algorithm: e.target.value as any }
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="bandwidth">Bandwidth-based</option>
              <option value="buffer">Buffer-based</option>
              <option value="hybrid">Hybrid</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Switch Threshold: {config.adaptive.switchThreshold}
            </label>
            <input
              type="range"
              min="0.1"
              max="1"
              step="0.1"
              value={config.adaptive.switchThreshold}
              onChange={(e) => actions.updateConfig({
                adaptive: { ...config.adaptive, switchThreshold: parseFloat(e.target.value) }
              })}
              className="w-full"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Buffer Target: {config.adaptive.bufferTarget}s
            </label>
            <input
              type="range"
              min="5"
              max="30"
              step="1"
              value={config.adaptive.bufferTarget}
              onChange={(e) => actions.updateConfig({
                adaptive: { ...config.adaptive, bufferTarget: parseInt(e.target.value) }
              })}
              className="w-full"
            />
          </div>
        </div>
      </div>
      
      {/* Quality Settings */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quality Settings</h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-900">Auto Quality Selection</label>
              <p className="text-sm text-gray-600">Automatically select best quality for current conditions</p>
            </div>
            <input
              type="checkbox"
              checked={config.quality.autoSelect}
              onChange={(e) => actions.updateConfig({
                quality: { ...config.quality, autoSelect: e.target.checked }
              })}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Preferred Quality</label>
            <select
              value={config.quality.preferredQuality}
              onChange={(e) => actions.updateConfig({
                quality: { ...config.quality, preferredQuality: e.target.value }
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="4k">4K Ultra HD</option>
              <option value="1080p">Full HD (1080p)</option>
              <option value="720p">HD (720p)</option>
              <option value="480p">SD (480p)</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Maximum Quality</label>
            <select
              value={config.quality.maxQuality}
              onChange={(e) => actions.updateConfig({
                quality: { ...config.quality, maxQuality: e.target.value }
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="4k">4K Ultra HD</option>
              <option value="1080p">Full HD (1080p)</option>
              <option value="720p">HD (720p)</option>
              <option value="480p">SD (480p)</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* Network Settings */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Network Settings</h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-900">Bandwidth Estimation</label>
              <p className="text-sm text-gray-600">Continuously estimate available bandwidth</p>
            </div>
            <input
              type="checkbox"
              checked={config.network.bandwidthEstimation}
              onChange={(e) => actions.updateConfig({
                network: { ...config.network, bandwidthEstimation: e.target.checked }
              })}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-900">Latency Optimization</label>
              <p className="text-sm text-gray-600">Optimize for low latency streaming</p>
            </div>
            <input
              type="checkbox"
              checked={config.network.latencyOptimization}
              onChange={(e) => actions.updateConfig({
                network: { ...config.network, latencyOptimization: e.target.checked }
              })}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Preload Segments: {config.network.preloadSegments}
            </label>
            <input
              type="range"
              min="1"
              max="10"
              step="1"
              value={config.network.preloadSegments}
              onChange={(e) => actions.updateConfig({
                network: { ...config.network, preloadSegments: parseInt(e.target.value) }
              })}
              className="w-full"
            />
          </div>
        </div>
      </div>
      
      {/* Actions */}
      <div className="flex space-x-4">
        <button
          onClick={() => actions.resetConfig()}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Reset to Defaults
        </button>
        
        <button
          onClick={() => {
            const config = actions.exportConfig();
            navigator.clipboard.writeText(config);
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Export Config
        </button>
      </div>
    </div>
  );
  
  // Create dialog component
  const CreateDialog = () => {
    const [formData, setFormData] = useState({
      title: '',
      description: '',
      type: 'hls',
      qualities: [] as string[]
    });
    
    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      
      try {
        if (createType === 'stream') {
          await actions.createStream({
            title: formData.title,
            description: formData.description,
            type: formData.type as any,
            duration: 0,
            thumbnail: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=video%20streaming%20adaptive&image_size=landscape_16_9',
            qualities: []
          });
        }
        
        setShowCreateDialog(false);
        setFormData({ title: '', description: '', type: 'hls', qualities: [] });
      } catch (error) {
        console.error('Failed to create:', error);
      }
    };
    
    if (!showCreateDialog) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Create New {createType === 'stream' ? 'Stream' : createType === 'quality' ? 'Quality' : 'Config'}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            {createType === 'stream' && (
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="hls">HLS</option>
                  <option value="dash">DASH</option>
                  <option value="smooth">Smooth Streaming</option>
                </select>
              </div>
            )}
            
            <div className="flex space-x-4 pt-4">
              <button
                type="button"
                onClick={() => setShowCreateDialog(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };
  
  return (
    <div className={`bg-gray-50 min-h-screen ${className}`}>
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Video className="h-6 w-6 text-blue-600" />
              <h1 className="text-xl font-semibold text-gray-900">Adaptive Streaming</h1>
            </div>
            
            {progress.isLoading && (
              <div className="flex items-center space-x-2 text-blue-600">
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span className="text-sm">Processing...</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={() => handleQuickAction('optimize')}
              className="flex items-center space-x-2 px-3 py-1 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
            >
              <Zap className="h-4 w-4" />
              <span>Optimize</span>
            </button>
            
            <button
              onClick={() => handleQuickAction('refresh')}
              className="flex items-center space-x-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </div>
      
      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mx-6 mt-4">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-400 mr-2" />
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      )}
      
      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center space-x-3">
            <RefreshCw className="h-6 w-6 text-blue-600 animate-spin" />
            <span className="text-lg text-gray-600">Loading streaming data...</span>
          </div>
        </div>
      )}
      
      {!isLoading && (
        <div className="p-6">
          {/* Search and Filter Bar */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search streams..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              
              <div className="flex gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Status</option>
                  <option value="streaming">Streaming</option>
                  <option value="ready">Ready</option>
                  <option value="preparing">Preparing</option>
                  <option value="paused">Paused</option>
                  <option value="error">Error</option>
                </select>
                
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Types</option>
                  <option value="hls">HLS</option>
                  <option value="dash">DASH</option>
                  <option value="smooth">Smooth</option>
                </select>
              </div>
            </div>
          </div>
          
          {/* Tabs */}
          <div className="bg-white rounded-lg border border-gray-200 mb-6">
            <div className="border-b border-gray-200">
              <nav className="flex space-x-8 px-6" aria-label="Tabs">
                {tabs.map((tab) => {
                  const IconComponent = tab.icon;
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
                      <IconComponent className="h-4 w-4" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
            
            <div className="p-6">
              {activeTab === 'overview' && renderOverviewTab()}
              {activeTab === 'streams' && renderStreamsTab()}
              {activeTab === 'settings' && renderSettingsTab()}
              {activeTab === 'qualities' && (
                <div className="text-center py-12">
                  <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Quality management coming soon...</p>
                </div>
              )}
              {activeTab === 'network' && (
                <div className="text-center py-12">
                  <Wifi className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Network monitoring coming soon...</p>
                </div>
              )}
              {activeTab === 'player' && (
                <div className="text-center py-12">
                  <Play className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Player controls coming soon...</p>
                </div>
              )}
              {activeTab === 'analytics' && (
                <div className="text-center py-12">
                  <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Analytics dashboard coming soon...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Create Dialog */}
      <CreateDialog />
    </div>
  );
};

export default AdaptiveStreamingPanel;