import React, { useState, useEffect, useMemo } from 'react';
import {
  useThumbnailGeneration,
  useThumbnailGenerationStats,
  useThumbnailGenerationConfig
} from '../../hooks/useThumbnailGeneration';
import {
  ThumbnailTemplate,
  GeneratedThumbnail,
  ThumbnailGenerationConfig
} from '../../services/thumbnailGenerationService';
import {
  Play,
  Pause,
  Square,
  Download,
  Upload,
  Settings,
  BarChart3,
  Zap,
  Image,
  Layers,
  Palette,
  Sparkles,
  Eye,
  Copy,
  Trash2,
  Edit,
  Plus,
  Search,
  Filter,
  SortAsc,
  SortDesc,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock,
  TrendingUp,
  Users,
  Target,
  Cpu,
  HardDrive,
  Wifi,
  WifiOff,
  Activity,
  PieChart,
  BarChart,
  LineChart,
  Calendar,
  FileText,
  Save,
  FolderOpen,
  Share2,
  Star,
  Heart,
  ThumbsUp,
  MessageSquare,
  ExternalLink,
  Maximize2,
  Minimize2,
  RotateCcw,
  Sliders,
  Wand2,
  Scissors,
  Crop,
  Contrast,
  Sun,
  Moon,
  Droplets,
  Wind
} from 'lucide-react';

interface ThumbnailGenerationManagerProps {
  className?: string;
}

const ThumbnailGenerationManager: React.FC<ThumbnailGenerationManagerProps> = ({ className = '' }) => {
  // Hooks
  const {
    templates,
    generatedThumbnails,
    config,
    stats,
    events,
    isGenerating,
    isOptimizing,
    selectedTemplate,
    selectedThumbnail,
    generationProgress,
    error,
    searchQuery,
    categoryFilter,
    qualityFilter,
    sortBy,
    sortOrder,
    isRealTimeEnabled,
    connectionStatus,
    lastSync,
    filteredTemplates,
    filteredThumbnails,
    totalTemplates,
    totalThumbnails,
    averageQuality,
    isHealthy,
    canGenerate,
    recentEvents,
    actions,
    quickActions,
    advancedFeatures,
    systemOperations,
    utilities,
    configHelpers,
    analyticsHelpers,
    computedValues,
    autoRefresh,
    setAutoRefresh
  } = useThumbnailGeneration();

  // Local state
  const [activeTab, setActiveTab] = useState('overview');
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showThumbnailModal, setShowThumbnailModal] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [selectedTemplateForEdit, setSelectedTemplateForEdit] = useState<ThumbnailTemplate | null>(null);
  const [selectedThumbnailForView, setSelectedThumbnailForView] = useState<GeneratedThumbnail | null>(null);
  const [isGeneratingDemo, setIsGeneratingDemo] = useState(false);

  // Auto-refresh effect
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      if (!isGenerating && !isOptimizing) {
        systemOperations.refresh();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [autoRefresh, isGenerating, isOptimizing, systemOperations]);

  // Demo data generation
  useEffect(() => {
    const generateDemoData = async () => {
      if (templates.length === 0 && !isGeneratingDemo) {
        setIsGeneratingDemo(true);
        try {
          await quickActions.createYouTubeTemplate();
          await quickActions.createInstagramTemplate();
          
          // Generate some demo thumbnails
          if (templates.length > 0) {
            await actions.generateThumbnail(templates[0].id);
          }
        } catch (error) {
          console.error('Failed to generate demo data:', error);
        } finally {
          setIsGeneratingDemo(false);
        }
      }
    };

    const timer = setTimeout(generateDemoData, 1000);
    return () => clearTimeout(timer);
  }, [templates.length, isGeneratingDemo, quickActions, actions, templates]);

  // Filtered and sorted data
  const processedTemplates = useMemo(() => {
    return filteredTemplates.sort((a, b) => {
      const aValue = a[sortBy as keyof ThumbnailTemplate];
      const bValue = b[sortBy as keyof ThumbnailTemplate];
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortOrder === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
      }
      
      return 0;
    });
  }, [filteredTemplates, sortBy, sortOrder]);

  const processedThumbnails = useMemo(() => {
    return filteredThumbnails.sort((a, b) => {
      const aValue = a[sortBy as keyof GeneratedThumbnail];
      const bValue = b[sortBy as keyof GeneratedThumbnail];
      
      if (aValue instanceof Date && bValue instanceof Date) {
        return sortOrder === 'asc' 
          ? aValue.getTime() - bValue.getTime()
          : bValue.getTime() - aValue.getTime();
      }
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
      }
      
      return 0;
    });
  }, [filteredThumbnails, sortBy, sortOrder]);

  // Status cards data
  const statusCards = [
    {
      title: 'Templates',
      value: totalTemplates.toLocaleString(),
      change: '+12%',
      trend: 'up' as const,
      icon: Layers,
      color: 'blue'
    },
    {
      title: 'Thumbnails',
      value: totalThumbnails.toLocaleString(),
      change: '+8%',
      trend: 'up' as const,
      icon: Image,
      color: 'green'
    },
    {
      title: 'Avg Quality',
      value: `${Math.round(averageQuality)}%`,
      change: '+5%',
      trend: 'up' as const,
      icon: Star,
      color: 'yellow'
    },
    {
      title: 'Success Rate',
      value: `${Math.round(stats.successRate)}%`,
      change: '+2%',
      trend: 'up' as const,
      icon: Target,
      color: 'purple'
    }
  ];

  // Tab configuration
  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'templates', label: 'Templates', icon: Layers },
    { id: 'thumbnails', label: 'Thumbnails', icon: Image },
    { id: 'generation', label: 'Generation', icon: Zap },
    { id: 'optimization', label: 'Optimization', icon: Sparkles },
    { id: 'analytics', label: 'Analytics', icon: PieChart },
    { id: 'realtime', label: 'Real-time', icon: Activity },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  // Helper functions
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'connected':
      case 'ready':
        return 'text-green-600';
      case 'warning':
      case 'disconnected':
        return 'text-yellow-600';
      case 'error':
      case 'failed':
        return 'text-red-600';
      case 'active':
      case 'generating':
        return 'text-blue-600';
      default:
        return 'text-gray-600';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  return (
    <div className={`thumbnail-generation-manager bg-white rounded-lg shadow-lg ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Image className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Thumbnail Generation</h2>
              <p className="text-sm text-gray-500">AI-powered thumbnail creation and optimization</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* Real-time status */}
            <div className="flex items-center space-x-2">
              {isRealTimeEnabled ? (
                <Wifi className={`w-4 h-4 ${connectionStatus === 'connected' ? 'text-green-500' : 'text-yellow-500'}`} />
              ) : (
                <WifiOff className="w-4 h-4 text-gray-400" />
              )}
              <span className={`text-xs font-medium ${getStatusColor(connectionStatus)}`}>
                {connectionStatus}
              </span>
            </div>
            
            {/* Auto-refresh toggle */}
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`p-2 rounded-lg transition-colors ${
                autoRefresh 
                  ? 'bg-green-100 text-green-600 hover:bg-green-200' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              title={autoRefresh ? 'Disable auto-refresh' : 'Enable auto-refresh'}
            >
              <RefreshCw className={`w-4 h-4 ${autoRefresh ? 'animate-spin' : ''}`} />
            </button>
            
            {/* Quick actions */}
            <button
              onClick={() => quickActions.generateForAllPlatforms('')}
              disabled={!canGenerate || isGenerating}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Zap className="w-4 h-4 mr-2" />
              Quick Generate
            </button>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
            <span className="text-red-700">{error}</span>
          </div>
        </div>
      )}

      {/* Loading State */}
      {(isGenerating || isOptimizing) && (
        <div className="mx-6 mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-3"></div>
              <span className="text-blue-700">
                {isGenerating ? 'Generating thumbnails...' : 'Optimizing thumbnails...'}
              </span>
            </div>
            <span className="text-blue-600 font-medium">{Math.round(generationProgress)}%</span>
          </div>
          <div className="mt-2 w-full bg-blue-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${generationProgress}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Status Cards */}
      <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statusCards.map((card, index) => {
          const IconComponent = card.icon;
          return (
            <div key={index} className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{card.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                </div>
                <div className={`p-3 rounded-full bg-${card.color}-100`}>
                  <IconComponent className={`w-6 h-6 text-${card.color}-600`} />
                </div>
              </div>
              <div className="mt-2 flex items-center">
                <TrendingUp className={`w-4 h-4 mr-1 ${
                  card.trend === 'up' ? 'text-green-500' : 'text-red-500'
                }`} />
                <span className={`text-sm font-medium ${
                  card.trend === 'up' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {card.change}
                </span>
                <span className="text-sm text-gray-500 ml-1">vs last month</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tabs */}
      <div className="px-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => {
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
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
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100">Generation Rate</p>
                    <p className="text-2xl font-bold">{stats.generationRate}/min</p>
                  </div>
                  <Zap className="w-8 h-8 text-blue-200" />
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100">Optimization Savings</p>
                    <p className="text-2xl font-bold">{Math.round(stats.optimizationSavings)}%</p>
                  </div>
                  <Sparkles className="w-8 h-8 text-green-200" />
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100">Avg Generation Time</p>
                    <p className="text-2xl font-bold">{formatDuration(stats.averageGenerationTime)}</p>
                  </div>
                  <Clock className="w-8 h-8 text-purple-200" />
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
              <div className="space-y-3">
                {recentEvents.slice(0, 5).map((event, index) => (
                  <div key={index} className="flex items-center justify-between py-2">
                    <div className="flex items-center space-x-3">
                      <div className={`w-2 h-2 rounded-full ${
                        event.type === 'generation_completed' ? 'bg-green-500' :
                        event.type === 'generation_failed' ? 'bg-red-500' :
                        event.type === 'optimization_completed' ? 'bg-blue-500' :
                        'bg-gray-500'
                      }`}></div>
                      <span className="text-sm text-gray-900">
                        {event.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(event.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* System Health */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">System Health</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Overall Status</span>
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${
                        isHealthy ? 'bg-green-500' : 'bg-red-500'
                      }`}></div>
                      <span className={`text-sm font-medium ${
                        isHealthy ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {isHealthy ? 'Healthy' : 'Issues Detected'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Generation Capacity</span>
                    <span className={`text-sm font-medium ${
                      canGenerate ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {canGenerate ? 'Available' : 'Limited'}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Real-time Sync</span>
                    <span className={`text-sm font-medium ${getStatusColor(connectionStatus)}`}>
                      {connectionStatus}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="space-y-2">
                  <button
                    onClick={() => quickActions.createYouTubeTemplate()}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    Create YouTube Template
                  </button>
                  <button
                    onClick={() => quickActions.createInstagramTemplate()}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    Create Instagram Template
                  </button>
                  <button
                    onClick={() => quickActions.optimizeAll()}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    Optimize All Thumbnails
                  </button>
                  <button
                    onClick={() => quickActions.exportAll()}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    Export All Thumbnails
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Templates Tab */}
        {activeTab === 'templates' && (
          <div className="space-y-6">
            {/* Templates Header */}
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Templates ({totalTemplates})</h3>
              <div className="flex items-center space-x-3">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search templates..."
                    value={searchQuery}
                    onChange={(e) => utilities.search(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                
                {/* Category Filter */}
                <select
                  value={categoryFilter}
                  onChange={(e) => utilities.filterByCategory(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">All Categories</option>
                  <option value="youtube">YouTube</option>
                  <option value="instagram">Instagram</option>
                  <option value="facebook">Facebook</option>
                  <option value="twitter">Twitter</option>
                  <option value="custom">Custom</option>
                </select>
                
                {/* Sort */}
                <button
                  onClick={() => utilities.sort(sortBy, sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  {sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
                </button>
                
                {/* Add Template */}
                <button
                  onClick={() => setShowTemplateModal(true)}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Template
                </button>
              </div>
            </div>

            {/* Templates Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {processedTemplates.map((template) => (
                <div key={template.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-900">{template.name}</h4>
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => {
                          setSelectedTemplateForEdit(template);
                          setShowTemplateModal(true);
                        }}
                        className="p-1 text-gray-400 hover:text-gray-600"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => actions.duplicateTemplate(template.id)}
                        className="p-1 text-gray-400 hover:text-gray-600"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => actions.deleteTemplate(template.id)}
                        className="p-1 text-gray-400 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-3">{template.description}</p>
                  
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                    <span>{template.width} × {template.height}</span>
                    <span className="px-2 py-1 bg-gray-100 rounded">{template.category}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => actions.generateThumbnail(template.id)}
                      disabled={!canGenerate || isGenerating}
                      className="px-3 py-1 bg-purple-600 text-white text-sm rounded hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <Zap className="w-3 h-3 mr-1" />
                      Generate
                    </button>
                    
                    <button
                      onClick={() => actions.previewTemplate(template.id)}
                      className="px-3 py-1 border border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-50 transition-colors"
                    >
                      <Eye className="w-3 h-3 mr-1" />
                      Preview
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {processedTemplates.length === 0 && (
              <div className="text-center py-12">
                <Layers className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No templates found</h3>
                <p className="text-gray-500 mb-4">Create your first template to get started</p>
                <button
                  onClick={() => setShowTemplateModal(true)}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Template
                </button>
              </div>
            )}
          </div>
        )}

        {/* Thumbnails Tab */}
        {activeTab === 'thumbnails' && (
          <div className="space-y-6">
            {/* Thumbnails Header */}
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Generated Thumbnails ({totalThumbnails})</h3>
              <div className="flex items-center space-x-3">
                {/* Quality Filter */}
                <select
                  value={qualityFilter}
                  onChange={(e) => utilities.filterByQuality(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">All Qualities</option>
                  <option value="low">Low Quality</option>
                  <option value="medium">Medium Quality</option>
                  <option value="high">High Quality</option>
                  <option value="ultra">Ultra Quality</option>
                </select>
                
                {/* Bulk Actions */}
                <button
                  onClick={() => quickActions.optimizeAll()}
                  disabled={isOptimizing || processedThumbnails.length === 0}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Optimize All
                </button>
                
                <button
                  onClick={() => quickActions.exportAll()}
                  disabled={processedThumbnails.length === 0}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export All
                </button>
              </div>
            </div>

            {/* Thumbnails Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {processedThumbnails.map((thumbnail) => (
                <div key={thumbnail.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                  {/* Thumbnail Preview */}
                  <div className="aspect-video bg-gray-100 relative">
                    <img
                      src={thumbnail.url}
                      alt={thumbnail.templateId}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjE4MCIgdmlld0JveD0iMCAwIDMyMCAxODAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMjAiIGhlaWdodD0iMTgwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xNDQgNzJIMTc2VjEwOEgxNDRWNzJaIiBmaWxsPSIjOUI5QkEwIi8+Cjwvc3ZnPgo=';
                      }}
                    />
                    
                    {/* Quality Badge */}
                    <div className="absolute top-2 right-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded ${
                        thumbnail.metadata.quality >= 90 ? 'bg-green-100 text-green-800' :
                        thumbnail.metadata.quality >= 70 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {Math.round(thumbnail.metadata.quality)}%
                      </span>
                    </div>
                    
                    {/* Actions Overlay */}
                    <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center opacity-0 hover:opacity-100">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            setSelectedThumbnailForView(thumbnail);
                            setShowThumbnailModal(true);
                          }}
                          className="p-2 bg-white rounded-full text-gray-700 hover:bg-gray-100 transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => actions.optimizeThumbnail(thumbnail.id)}
                          className="p-2 bg-white rounded-full text-gray-700 hover:bg-gray-100 transition-colors"
                        >
                          <Sparkles className="w-4 h-4" />
                        </button>
                        <a
                          href={thumbnail.url}
                          download
                          className="p-2 bg-white rounded-full text-gray-700 hover:bg-gray-100 transition-colors"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                      </div>
                    </div>
                  </div>
                  
                  {/* Thumbnail Info */}
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-900">
                        {thumbnail.metadata.format.toUpperCase()}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatFileSize(thumbnail.metadata.fileSize)}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                      <span>{thumbnail.metadata.width} × {thumbnail.metadata.height}</span>
                      <span>{new Date(thumbnail.createdAt).toLocaleDateString()}</span>
                    </div>
                    
                    {/* Analytics */}
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-1">
                          <Eye className="w-3 h-3 text-gray-400" />
                          <span className="text-gray-600">{thumbnail.analytics.views}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <ThumbsUp className="w-3 h-3 text-gray-400" />
                          <span className="text-gray-600">{thumbnail.analytics.likes}</span>
                        </div>
                      </div>
                      <span className={`font-medium ${
                        thumbnail.analytics.score >= 80 ? 'text-green-600' :
                        thumbnail.analytics.score >= 60 ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        {Math.round(thumbnail.analytics.score)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {processedThumbnails.length === 0 && (
              <div className="text-center py-12">
                <Image className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No thumbnails generated</h3>
                <p className="text-gray-500 mb-4">Generate your first thumbnail from a template</p>
                <button
                  onClick={() => setActiveTab('templates')}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <Layers className="w-4 h-4 mr-2" />
                  View Templates
                </button>
              </div>
            )}
          </div>
        )}

        {/* Generation Tab */}
        {activeTab === 'generation' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Thumbnail Generation</h3>
            
            {/* Generation Controls */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h4 className="font-medium text-gray-900 mb-4">Quick Generation</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <button
                  onClick={() => actions.quickGenerate('youtube')}
                  disabled={!canGenerate || isGenerating}
                  className="p-4 border border-gray-300 rounded-lg hover:bg-white hover:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <div className="text-center">
                    <div className="w-12 h-12 bg-red-100 rounded-lg mx-auto mb-2 flex items-center justify-center">
                      <Play className="w-6 h-6 text-red-600" />
                    </div>
                    <span className="text-sm font-medium text-gray-900">YouTube</span>
                    <p className="text-xs text-gray-500 mt-1">1920×1080</p>
                  </div>
                </button>
                
                <button
                  onClick={() => actions.quickGenerate('instagram')}
                  disabled={!canGenerate || isGenerating}
                  className="p-4 border border-gray-300 rounded-lg hover:bg-white hover:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <div className="text-center">
                    <div className="w-12 h-12 bg-pink-100 rounded-lg mx-auto mb-2 flex items-center justify-center">
                      <Image className="w-6 h-6 text-pink-600" />
                    </div>
                    <span className="text-sm font-medium text-gray-900">Instagram</span>
                    <p className="text-xs text-gray-500 mt-1">1080×1080</p>
                  </div>
                </button>
                
                <button
                  onClick={() => actions.quickGenerate('facebook')}
                  disabled={!canGenerate || isGenerating}
                  className="p-4 border border-gray-300 rounded-lg hover:bg-white hover:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <div className="text-center">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg mx-auto mb-2 flex items-center justify-center">
                      <Share2 className="w-6 h-6 text-blue-600" />
                    </div>
                    <span className="text-sm font-medium text-gray-900">Facebook</span>
                    <p className="text-xs text-gray-500 mt-1">1200×630</p>
                  </div>
                </button>
                
                <button
                  onClick={() => actions.quickGenerate('twitter')}
                  disabled={!canGenerate || isGenerating}
                  className="p-4 border border-gray-300 rounded-lg hover:bg-white hover:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <div className="text-center">
                    <div className="w-12 h-12 bg-sky-100 rounded-lg mx-auto mb-2 flex items-center justify-center">
                      <MessageSquare className="w-6 h-6 text-sky-600" />
                    </div>
                    <span className="text-sm font-medium text-gray-900">Twitter</span>
                    <p className="text-xs text-gray-500 mt-1">1200×675</p>
                  </div>
                </button>
              </div>
            </div>
            
            {/* Batch Generation */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h4 className="font-medium text-gray-900 mb-4">Batch Generation</h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Templates
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {templates.slice(0, 6).map((template) => (
                      <label key={template.id} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                        <input
                          type="checkbox"
                          className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                        />
                        <div className="flex-1">
                          <span className="text-sm font-medium text-gray-900">{template.name}</span>
                          <p className="text-xs text-gray-500">{template.width}×{template.height}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
                
                <button
                  onClick={() => actions.generateBatch(templates.map(t => t.id))}
                  disabled={!canGenerate || isGenerating}
                  className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Generate Selected
                </button>
              </div>
            </div>
            
            {/* AI Generation */}
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-6">
              <h4 className="font-medium text-gray-900 mb-4">AI-Powered Generation</h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Video URL or Description
                  </label>
                  <input
                    type="text"
                    placeholder="Enter video URL or describe your content..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Style
                    </label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                      <option>Modern & Clean</option>
                      <option>Bold & Dramatic</option>
                      <option>Minimalist</option>
                      <option>Colorful & Fun</option>
                      <option>Professional</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Platform
                    </label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                      <option>YouTube</option>
                      <option>Instagram</option>
                      <option>Facebook</option>
                      <option>Twitter</option>
                      <option>All Platforms</option>
                    </select>
                  </div>
                </div>
                
                <button
                  onClick={() => actions.generateFromVideo('')}
                  disabled={!canGenerate || isGenerating}
                  className="w-full px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <Wand2 className="w-4 h-4 mr-2" />
                  Generate with AI
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Settings</h3>
            
            {/* Generation Settings */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h4 className="font-medium text-gray-900 mb-4">Generation Settings</h4>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Default Quality Level
                    </label>
                    <select 
                      value={config.qualityLevel}
                      onChange={(e) => actions.updateConfig({ qualityLevel: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="low">Low (Fast)</option>
                      <option value="medium">Medium (Balanced)</option>
                      <option value="high">High (Quality)</option>
                      <option value="ultra">Ultra (Best)</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Output Format
                    </label>
                    <select 
                      value={config.outputFormat}
                      onChange={(e) => actions.updateConfig({ outputFormat: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="jpg">JPEG</option>
                      <option value="png">PNG</option>
                      <option value="webp">WebP</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={config.aiOptimization}
                      onChange={(e) => actions.updateConfig({ aiOptimization: e.target.checked })}
                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Enable AI Optimization</span>
                  </label>
                  <p className="text-xs text-gray-500 mt-1 ml-6">
                    Automatically optimize thumbnails using AI algorithms
                  </p>
                </div>
                
                <div>
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={config.autoGenerate}
                      onChange={(e) => actions.updateConfig({ autoGenerate: e.target.checked })}
                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Auto-generate on template save</span>
                  </label>
                </div>
              </div>
            </div>
            
            {/* Performance Settings */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h4 className="font-medium text-gray-900 mb-4">Performance Settings</h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Compression Level: {Math.round(config.compression * 100)}%
                  </label>
                  <input
                    type="range"
                    min="0.1"
                    max="1"
                    step="0.1"
                    value={config.compression}
                    onChange={(e) => actions.updateConfig({ compression: parseFloat(e.target.value) })}
                    className="w-full"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max File Size (MB)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={config.maxFileSize / (1024 * 1024)}
                    onChange={(e) => actions.updateConfig({ maxFileSize: parseInt(e.target.value) * 1024 * 1024 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={config.enableCaching}
                      onChange={(e) => actions.updateConfig({ enableCaching: e.target.checked })}
                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Enable Caching</span>
                  </label>
                </div>
              </div>
            </div>
            
            {/* System Actions */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h4 className="font-medium text-gray-900 mb-4">System Actions</h4>
              <div className="space-y-3">
                <button
                  onClick={() => systemOperations.performMaintenance()}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Run Maintenance
                </button>
                
                <button
                  onClick={() => actions.clearCache()}
                  className="w-full px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
                >
                  <HardDrive className="w-4 h-4 mr-2" />
                  Clear Cache
                </button>
                
                <button
                  onClick={() => utilities.exportData()}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export Data
                </button>
                
                <button
                  onClick={() => systemOperations.resetWithConfirmation(window.confirm('Are you sure you want to reset all data?'))}
                  className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Reset System
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Template Modal */}
      {showTemplateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {selectedTemplateForEdit ? 'Edit Template' : 'Create Template'}
              </h3>
              <button
                onClick={() => {
                  setShowTemplateModal(false);
                  setSelectedTemplateForEdit(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <Square className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Template Name
                  </label>
                  <input
                    type="text"
                    defaultValue={selectedTemplateForEdit?.name || ''}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Enter template name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <select 
                    defaultValue={selectedTemplateForEdit?.category || 'custom'}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="youtube">YouTube</option>
                    <option value="instagram">Instagram</option>
                    <option value="facebook">Facebook</option>
                    <option value="twitter">Twitter</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  defaultValue={selectedTemplateForEdit?.description || ''}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Describe your template"
                ></textarea>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Width (px)
                  </label>
                  <input
                    type="number"
                    defaultValue={selectedTemplateForEdit?.width || 1920}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Height (px)
                  </label>
                  <input
                    type="number"
                    defaultValue={selectedTemplateForEdit?.height || 1080}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quality
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="ultra">Ultra</option>
                  </select>
                </div>
              </div>
              
              <div className="flex items-center justify-end space-x-3 pt-4">
                <button
                  onClick={() => {
                    setShowTemplateModal(false);
                    setSelectedTemplateForEdit(null);
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (selectedTemplateForEdit) {
                      actions.updateTemplate(selectedTemplateForEdit.id, {});
                    } else {
                      actions.createTemplate({});
                    }
                    setShowTemplateModal(false);
                    setSelectedTemplateForEdit(null);
                  }}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {selectedTemplateForEdit ? 'Update' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Thumbnail Modal */}
      {showThumbnailModal && selectedThumbnailForView && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Thumbnail Details</h3>
              <button
                onClick={() => {
                  setShowThumbnailModal(false);
                  setSelectedThumbnailForView(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <Square className="w-5 h-5" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Thumbnail Preview */}
              <div>
                <img
                  src={selectedThumbnailForView.url}
                  alt="Thumbnail"
                  className="w-full rounded-lg border border-gray-200"
                />
                
                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => actions.optimizeThumbnail(selectedThumbnailForView.id)}
                      className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      Optimize
                    </button>
                    
                    <a
                      href={selectedThumbnailForView.url}
                      download
                      className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </a>
                    
                    <button
                      onClick={() => navigator.clipboard.writeText(selectedThumbnailForView.url)}
                      className="px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Copy URL
                    </button>
                  </div>
                  
                  <button
                    onClick={() => actions.deleteThumbnail(selectedThumbnailForView.id)}
                    className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </button>
                </div>
              </div>
              
              {/* Thumbnail Info */}
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Technical Details</h4>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Format:</span>
                      <span className="text-sm font-medium text-gray-900">
                        {selectedThumbnailForView.metadata.format.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Dimensions:</span>
                      <span className="text-sm font-medium text-gray-900">
                        {selectedThumbnailForView.metadata.width} × {selectedThumbnailForView.metadata.height}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">File Size:</span>
                      <span className="text-sm font-medium text-gray-900">
                        {formatFileSize(selectedThumbnailForView.metadata.fileSize)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Quality:</span>
                      <span className={`text-sm font-medium ${
                        selectedThumbnailForView.metadata.quality >= 90 ? 'text-green-600' :
                        selectedThumbnailForView.metadata.quality >= 70 ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        {Math.round(selectedThumbnailForView.metadata.quality)}%
                      </span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Analytics</h4>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Views:</span>
                      <span className="text-sm font-medium text-gray-900">
                        {selectedThumbnailForView.analytics.views.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Likes:</span>
                      <span className="text-sm font-medium text-gray-900">
                        {selectedThumbnailForView.analytics.likes.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Shares:</span>
                      <span className="text-sm font-medium text-gray-900">
                        {selectedThumbnailForView.analytics.shares.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Score:</span>
                      <span className={`text-sm font-medium ${
                        selectedThumbnailForView.analytics.score >= 80 ? 'text-green-600' :
                        selectedThumbnailForView.analytics.score >= 60 ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        {Math.round(selectedThumbnailForView.analytics.score)}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Generation Info</h4>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Created:</span>
                      <span className="text-sm font-medium text-gray-900">
                        {new Date(selectedThumbnailForView.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Template:</span>
                      <span className="text-sm font-medium text-gray-900">
                        {selectedThumbnailForView.templateId}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Generation Time:</span>
                      <span className="text-sm font-medium text-gray-900">
                        {formatDuration(selectedThumbnailForView.metadata.generationTime)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Config Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">System Configuration</h3>
              <button
                onClick={() => setShowConfigModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <Square className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-6">
              {/* AI Settings */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">AI Settings</h4>
                <div className="space-y-3">
                  <label className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">Enable AI Optimization</span>
                    <button
                      onClick={() => actions.updateConfig({ aiOptimization: !config.aiOptimization })}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        config.aiOptimization ? 'bg-purple-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          config.aiOptimization ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </label>
                  
                  <label className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">Auto-generate on save</span>
                    <button
                      onClick={() => actions.updateConfig({ autoGenerate: !config.autoGenerate })}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        config.autoGenerate ? 'bg-purple-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          config.autoGenerate ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </label>
                </div>
              </div>
              
              {/* Performance Settings */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Performance Settings</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Compression Level: {Math.round(config.compression * 100)}%
                    </label>
                    <input
                      type="range"
                      min="0.1"
                      max="1"
                      step="0.1"
                      value={config.compression}
                      onChange={(e) => actions.updateConfig({ compression: parseFloat(e.target.value) })}
                      className="w-full"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Max File Size (MB)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="50"
                      value={config.maxFileSize / (1024 * 1024)}
                      onChange={(e) => actions.updateConfig({ maxFileSize: parseInt(e.target.value) * 1024 * 1024 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-end space-x-3 pt-4">
                <button
                  onClick={() => setShowConfigModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    systemOperations.refresh();
                    setShowConfigModal(false);
                  }}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save & Apply
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ThumbnailGenerationManager;