import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Filter,
  RefreshCw,
  Settings,
  TrendingUp,
  Users,
  FileText,
  Brain,
  Target,
  BarChart3,
  Zap,
  Star,
  Eye,
  ThumbsUp,
  Share2,
  Clock,
  CheckCircle,
  AlertCircle,
  Info,
  Plus,
  Play,
  Pause,
  RotateCcw,
  Download,
  Upload,
  Trash2,
  Edit,
  ChevronDown,
  ChevronRight,
  Activity,
  Layers,
  Database,
  Cpu,
  Globe,
  BookOpen,
  Video,
  FileImage,
  Tool,
  Award,
  Lightbulb
} from 'lucide-react';
import {
  useContentRecommendation,
  useRecommendationProgress,
  useRecommendationStats,
  useRecommendationConfig,
  useRecommendationSearch,
  useCurrentUser,
  useRecommendationEngines,
  useRecommendationAnalytics
} from '../../hooks/useContentRecommendation';
import {
  UserProfile,
  ContentItem,
  Recommendation,
  RecommendationEngine,
  ABTestExperiment,
  formatNumber,
  formatPercentage,
  formatDuration,
  getEngagementColor,
  getDifficultyIcon,
  getContentTypeIcon
} from '../../services/contentRecommendationService';

interface ContentRecommendationPanelProps {
  className?: string;
}

const ContentRecommendationPanel: React.FC<ContentRecommendationPanelProps> = ({ className = '' }) => {
  // Hooks
  const {
    userProfiles,
    contentItems,
    recommendations,
    engines,
    experiments,
    isLoading,
    error,
    selectedUserId,
    selectedContentId,
    selectedEngineId,
    config,
    stats,
    computed,
    actions,
    quickActions,
    setSelectedUser,
    setSelectedContent,
    setSelectedEngine,
    autoRefresh,
    setAutoRefresh
  } = useContentRecommendation();
  
  const { progress, isProcessing, currentStep, startProgress, updateProgress, completeProgress } = useRecommendationProgress();
  
  // Local state
  const [activeTab, setActiveTab] = useState('overview');
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [createType, setCreateType] = useState<'user' | 'content' | 'engine' | 'experiment'>('user');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  
  // Auto-refresh demo data
  useEffect(() => {
    const generateDemoData = async () => {
      if (userProfiles.length === 0) {
        // Create demo user profiles
        const demoUsers = [
          {
            preferences: {
              categories: ['technology', 'design'],
              tags: ['react', 'ui/ux', 'javascript'],
              contentTypes: ['video', 'tutorial'],
              languages: ['en', 'pt'],
              difficulty: 'intermediate' as const,
              duration: { min: 10, max: 60 }
            },
            behavior: {
              viewHistory: [],
              searchHistory: ['react hooks', 'design patterns'],
              bookmarks: [],
              ratings: [],
              timeSpent: {},
              completionRate: 0.75,
              engagementScore: 0.8
            },
            demographics: {
              age: 28,
              location: 'São Paulo, BR',
              timezone: 'America/Sao_Paulo',
              device: 'desktop' as const
            }
          },
          {
            preferences: {
              categories: ['business', 'marketing'],
              tags: ['strategy', 'analytics', 'growth'],
              contentTypes: ['article', 'course'],
              languages: ['en'],
              difficulty: 'advanced' as const,
              duration: { min: 30, max: 120 }
            },
            behavior: {
              viewHistory: [],
              searchHistory: ['marketing strategy', 'data analytics'],
              bookmarks: [],
              ratings: [],
              timeSpent: {},
              completionRate: 0.85,
              engagementScore: 0.9
            },
            demographics: {
              age: 35,
              location: 'New York, US',
              timezone: 'America/New_York',
              device: 'mobile' as const
            }
          }
        ];
        
        for (const userData of demoUsers) {
          await actions.createUserProfile(userData);
        }
        
        // Create demo content
        const demoContent = [
          {
            title: 'Advanced React Patterns',
            description: 'Learn advanced React patterns and best practices',
            type: 'video' as const,
            category: 'technology',
            tags: ['react', 'javascript', 'patterns'],
            difficulty: 'advanced' as const,
            duration: 45,
            language: 'en',
            author: {
              id: 'author-1',
              name: 'John Doe',
              reputation: 95
            },
            metadata: {
              views: 15420,
              likes: 1240,
              shares: 89,
              comments: 156,
              rating: 4.7,
              completionRate: 0.82,
              trending: true,
              featured: true,
              premium: false
            },
            content: {
              thumbnail: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=modern%20react%20development%20coding%20tutorial%20thumbnail&image_size=landscape_16_9',
              url: '/content/react-patterns',
              size: 125000000
            },
            analytics: {
              clickThroughRate: 0.15,
              engagementRate: 0.78,
              conversionRate: 0.12,
              retentionRate: 0.85
            }
          },
          {
            title: 'UI/UX Design Fundamentals',
            description: 'Master the fundamentals of user interface and experience design',
            type: 'course' as const,
            category: 'design',
            tags: ['ui/ux', 'design', 'fundamentals'],
            difficulty: 'beginner' as const,
            duration: 120,
            language: 'en',
            author: {
              id: 'author-2',
              name: 'Jane Smith',
              reputation: 88
            },
            metadata: {
              views: 8750,
              likes: 892,
              shares: 45,
              comments: 78,
              rating: 4.5,
              completionRate: 0.75,
              trending: false,
              featured: true,
              premium: true
            },
            content: {
              thumbnail: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=ui%20ux%20design%20fundamentals%20course%20thumbnail%20modern%20interface&image_size=landscape_16_9',
              url: '/content/ui-ux-fundamentals',
              size: 250000000
            },
            analytics: {
              clickThroughRate: 0.12,
              engagementRate: 0.72,
              conversionRate: 0.18,
              retentionRate: 0.80
            }
          }
        ];
        
        for (const contentData of demoContent) {
          await actions.addContentItem(contentData);
        }
      }
    };
    
    generateDemoData();
  }, [userProfiles.length, actions]);
  
  // Status cards data
  const statusCards = useMemo(() => [
    {
      title: 'Total Users',
      value: formatNumber(computed.totalUsers),
      change: '+12%',
      trend: 'up' as const,
      icon: Users,
      color: 'blue'
    },
    {
      title: 'Content Items',
      value: formatNumber(computed.totalContent),
      change: '+8%',
      trend: 'up' as const,
      icon: FileText,
      color: 'green'
    },
    {
      title: 'Recommendations',
      value: formatNumber(computed.totalRecommendations),
      change: '+25%',
      trend: 'up' as const,
      icon: Target,
      color: 'purple'
    },
    {
      title: 'System Health',
      value: `${Math.round(stats.systemHealth)}%`,
      change: stats.isHealthy ? 'Healthy' : 'Issues',
      trend: stats.isHealthy ? 'up' : 'down' as const,
      icon: Activity,
      color: stats.isHealthy ? 'green' : 'red'
    }
  ], [computed, stats]);
  
  // Tab configuration
  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'content', label: 'Content', icon: FileText },
    { id: 'recommendations', label: 'Recommendations', icon: Target },
    { id: 'engines', label: 'Engines', icon: Brain },
    { id: 'experiments', label: 'A/B Tests', icon: Zap },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];
  
  // Helper functions
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
      case 'running':
      case 'healthy':
        return CheckCircle;
      case 'inactive':
      case 'paused':
      case 'warning':
        return AlertCircle;
      default:
        return Info;
    }
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'running':
      case 'healthy':
        return 'text-green-600';
      case 'inactive':
      case 'paused':
      case 'warning':
        return 'text-yellow-600';
      default:
        return 'text-gray-600';
    }
  };
  
  const getEngineIcon = (type: string) => {
    switch (type) {
      case 'collaborative_filtering':
        return Users;
      case 'content_based':
        return FileText;
      case 'matrix_factorization':
        return Layers;
      case 'deep_learning':
        return Brain;
      case 'hybrid':
        return Cpu;
      default:
        return Database;
    }
  };
  
  const getAlgorithmIcon = (algorithm: string) => {
    switch (algorithm) {
      case 'collaborative':
        return Users;
      case 'content_based':
        return FileText;
      case 'hybrid':
        return Cpu;
      case 'trending':
        return TrendingUp;
      case 'personalized':
        return Target;
      default:
        return Brain;
    }
  };
  
  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return TrendingUp;
      case 'down':
        return TrendingUp; // Will be rotated with CSS
      default:
        return Activity;
    }
  };
  
  const formatTime = (timestamp: Date | number) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };
  
  const formatSentiment = (score: number) => {
    if (score > 0.6) return { label: 'Positive', color: 'text-green-600' };
    if (score > 0.4) return { label: 'Neutral', color: 'text-yellow-600' };
    return { label: 'Negative', color: 'text-red-600' };
  };
  
  const handleQuickAction = async (action: string, id?: string) => {
    startProgress(`Executing ${action}...`);
    
    try {
      switch (action) {
        case 'refresh':
          updateProgress(25, 'Refreshing data...');
          await actions.refresh();
          break;
        case 'optimize':
          updateProgress(25, 'Optimizing system...');
          await quickActions.quickOptimize();
          break;
        case 'generate':
          if (selectedUserId) {
            updateProgress(25, 'Generating recommendations...');
            await quickActions.quickGenerateRecommendations(selectedUserId);
          }
          break;
        case 'train':
          if (id) {
            updateProgress(25, 'Training engine...');
            await actions.trainEngine(id);
          }
          break;
        default:
          break;
      }
      
      updateProgress(100, 'Completed!');
      completeProgress();
    } catch (error) {
      console.error('Quick action failed:', error);
      completeProgress();
    }
  };
  
  const toggleCardExpansion = (cardId: string) => {
    const newExpanded = new Set(expandedCards);
    if (newExpanded.has(cardId)) {
      newExpanded.delete(cardId);
    } else {
      newExpanded.add(cardId);
    }
    setExpandedCards(newExpanded);
  };
  
  const toggleItemSelection = (itemId: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    setSelectedItems(newSelected);
  };
  
  const renderCreateDialog = () => {
    if (!showCreateDialog) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md">
          <h3 className="text-lg font-semibold mb-4">
            Create New {createType.charAt(0).toUpperCase() + createType.slice(1)}
          </h3>
          
          <div className="space-y-4">
            {createType === 'user' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    User Type
                  </label>
                  <select className="w-full p-2 border border-gray-300 rounded-md">
                    <option value="regular">Regular User</option>
                    <option value="premium">Premium User</option>
                    <option value="admin">Admin User</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Preferences
                  </label>
                  <textarea 
                    className="w-full p-2 border border-gray-300 rounded-md"
                    rows={3}
                    placeholder="Enter user preferences..."
                  />
                </div>
              </>
            )}
            
            {createType === 'content' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Content Title
                  </label>
                  <input 
                    type="text" 
                    className="w-full p-2 border border-gray-300 rounded-md"
                    placeholder="Enter content title..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Content Type
                  </label>
                  <select className="w-full p-2 border border-gray-300 rounded-md">
                    <option value="video">Video</option>
                    <option value="article">Article</option>
                    <option value="course">Course</option>
                    <option value="tutorial">Tutorial</option>
                    <option value="template">Template</option>
                    <option value="tool">Tool</option>
                  </select>
                </div>
              </>
            )}
            
            {createType === 'engine' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Engine Name
                  </label>
                  <input 
                    type="text" 
                    className="w-full p-2 border border-gray-300 rounded-md"
                    placeholder="Enter engine name..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Engine Type
                  </label>
                  <select className="w-full p-2 border border-gray-300 rounded-md">
                    <option value="collaborative_filtering">Collaborative Filtering</option>
                    <option value="content_based">Content-Based</option>
                    <option value="matrix_factorization">Matrix Factorization</option>
                    <option value="deep_learning">Deep Learning</option>
                    <option value="hybrid">Hybrid</option>
                  </select>
                </div>
              </>
            )}
            
            {createType === 'experiment' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Experiment Name
                  </label>
                  <input 
                    type="text" 
                    className="w-full p-2 border border-gray-300 rounded-md"
                    placeholder="Enter experiment name..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea 
                    className="w-full p-2 border border-gray-300 rounded-md"
                    rows={3}
                    placeholder="Enter experiment description..."
                  />
                </div>
              </>
            )}
          </div>
          
          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={() => setShowCreateDialog(false)}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                // Handle create action
                setShowCreateDialog(false);
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Create
            </button>
          </div>
        </div>
      </div>
    );
  };
  
  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Target className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Content Recommendation System
              </h2>
              <p className="text-sm text-gray-600">
                Intelligent content recommendations with ML algorithms
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="auto-refresh"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded border-gray-300"
              />
              <label htmlFor="auto-refresh" className="text-sm text-gray-600">
                Auto-refresh
              </label>
            </div>
            
            <button
              onClick={() => handleQuickAction('refresh')}
              disabled={isLoading}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
              title="Refresh Data"
            >
              <RefreshCw className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            
            <button
              onClick={() => setShowCreateDialog(true)}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Create</span>
            </button>
          </div>
        </div>
        
        {/* Progress Bar */}
        {isProcessing && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
              <span>{currentStep}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </div>
      
      {/* Error Alert */}
      {error && (
        <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
            <span className="text-red-800">{error}</span>
          </div>
        </div>
      )}
      
      {/* Loading State */}
      {isLoading && !isProcessing && (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 text-purple-600 animate-spin" />
        </div>
      )}
      
      {/* Content */}
      {!isLoading && (
        <>
          {/* Status Cards */}
          <div className="p-6 border-b border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {statusCards.map((card, index) => {
                const IconComponent = card.icon;
                const TrendIcon = getTrendIcon(card.trend);
                
                return (
                  <div key={index} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className={`p-2 rounded-lg ${
                        card.color === 'blue' ? 'bg-blue-100' :
                        card.color === 'green' ? 'bg-green-100' :
                        card.color === 'purple' ? 'bg-purple-100' :
                        card.color === 'red' ? 'bg-red-100' : 'bg-gray-100'
                      }`}>
                        <IconComponent className={`h-5 w-5 ${
                          card.color === 'blue' ? 'text-blue-600' :
                          card.color === 'green' ? 'text-green-600' :
                          card.color === 'purple' ? 'text-purple-600' :
                          card.color === 'red' ? 'text-red-600' : 'text-gray-600'
                        }`} />
                      </div>
                      <div className={`flex items-center space-x-1 text-sm ${
                        card.trend === 'up' ? 'text-green-600' :
                        card.trend === 'down' ? 'text-red-600' : 'text-gray-600'
                      }`}>
                        <TrendIcon className={`h-4 w-4 ${
                          card.trend === 'down' ? 'rotate-180' : ''
                        }`} />
                        <span>{card.change}</span>
                      </div>
                    </div>
                    <div className="mt-3">
                      <p className="text-2xl font-semibold text-gray-900">{card.value}</p>
                      <p className="text-sm text-gray-600">{card.title}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* Search and Filter Bar */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center space-x-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search users, content, recommendations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              
              <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors">
                <Filter className="h-5 w-5" />
              </button>
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
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === tab.id
                        ? 'border-purple-500 text-purple-600'
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
          
          {/* Tab Content */}
          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* System Health */}
                  <div className="bg-gray-50 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">System Health</h3>
                      <div className={`flex items-center space-x-2 ${
                        stats.isHealthy ? 'text-green-600' : 'text-red-600'
                      }`}>
                        <Activity className="h-5 w-5" />
                        <span className="font-medium">{Math.round(stats.systemHealth)}%</span>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Click-through Rate</span>
                        <span className="font-medium">{formatPercentage(stats.clickThroughRate)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Conversion Rate</span>
                        <span className="font-medium">{formatPercentage(stats.conversionRate)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">User Satisfaction</span>
                        <span className="font-medium">{formatPercentage(stats.userSatisfaction)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Coverage Rate</span>
                        <span className="font-medium">{formatPercentage(stats.coverageRate)}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Quick Actions */}
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => handleQuickAction('optimize')}
                        className="p-3 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors flex items-center space-x-2"
                      >
                        <Zap className="h-4 w-4 text-yellow-600" />
                        <span className="text-sm font-medium">Optimize</span>
                      </button>
                      
                      <button
                        onClick={() => handleQuickAction('generate')}
                        disabled={!selectedUserId}
                        className="p-3 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors flex items-center space-x-2 disabled:opacity-50"
                      >
                        <Target className="h-4 w-4 text-purple-600" />
                        <span className="text-sm font-medium">Generate</span>
                      </button>
                      
                      <button
                        onClick={() => actions.cleanup()}
                        className="p-3 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors flex items-center space-x-2"
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                        <span className="text-sm font-medium">Cleanup</span>
                      </button>
                      
                      <button
                        onClick={() => actions.refresh()}
                        className="p-3 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors flex items-center space-x-2"
                      >
                        <RefreshCw className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium">Refresh</span>
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* Recent Activity */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
                  
                  <div className="space-y-3">
                    {computed.recentActivity.slice(0, 5).map((activity, index) => (
                      <div key={index} className="flex items-center justify-between py-2">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-white rounded-lg">
                            {activity.type === 'view' && <Eye className="h-4 w-4 text-blue-600" />}
                            {activity.type === 'like' && <ThumbsUp className="h-4 w-4 text-green-600" />}
                            {activity.type === 'share' && <Share2 className="h-4 w-4 text-purple-600" />}
                            {activity.type === 'complete' && <CheckCircle className="h-4 w-4 text-green-600" />}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              User {activity.type}ed content
                            </p>
                            <p className="text-xs text-gray-600">
                              {formatTime(activity.timestamp)}
                            </p>
                          </div>
                        </div>
                        
                        <div className="text-sm text-gray-600">
                          {activity.duration && `${Math.round(activity.duration / 60)}m`}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            
            {/* Users Tab */}
            {activeTab === 'users' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">
                    User Profiles ({userProfiles.length})
                  </h3>
                  <button
                    onClick={() => {
                      setCreateType('user');
                      setShowCreateDialog(true);
                    }}
                    className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors flex items-center space-x-2"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add User</span>
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {userProfiles.map((user) => {
                    const isExpanded = expandedCards.has(user.id);
                    const isSelected = selectedItems.has(user.id);
                    
                    return (
                      <div
                        key={user.id}
                        className={`bg-white border rounded-lg p-4 transition-all ${
                          isSelected ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleItemSelection(user.id)}
                              className="rounded border-gray-300"
                            />
                            <div className="p-2 bg-blue-100 rounded-lg">
                              <Users className="h-4 w-4 text-blue-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">User {user.id.slice(-8)}</p>
                              <p className="text-xs text-gray-600">{user.demographics.device}</p>
                            </div>
                          </div>
                          
                          <button
                            onClick={() => toggleCardExpansion(user.id)}
                            className="p-1 text-gray-400 hover:text-gray-600"
                          >
                            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                          </button>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Engagement</span>
                            <span className={`font-medium ${getEngagementColor(user.behavior.engagementScore)}`}>
                              {formatPercentage(user.behavior.engagementScore)}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Completion Rate</span>
                            <span className="font-medium">{formatPercentage(user.behavior.completionRate)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Preferences</span>
                            <span className="font-medium">{user.preferences.categories.length} categories</span>
                          </div>
                        </div>
                        
                        {isExpanded && (
                          <div className="mt-4 pt-4 border-t border-gray-200 space-y-3">
                            <div>
                              <p className="text-sm font-medium text-gray-900 mb-1">Categories</p>
                              <div className="flex flex-wrap gap-1">
                                {user.preferences.categories.map((category, idx) => (
                                  <span key={idx} className="px-2 py-1 bg-gray-100 text-xs rounded">
                                    {category}
                                  </span>
                                ))}
                              </div>
                            </div>
                            
                            <div>
                              <p className="text-sm font-medium text-gray-900 mb-1">Tags</p>
                              <div className="flex flex-wrap gap-1">
                                {user.preferences.tags.slice(0, 3).map((tag, idx) => (
                                  <span key={idx} className="px-2 py-1 bg-blue-100 text-xs rounded text-blue-700">
                                    {tag}
                                  </span>
                                ))}
                                {user.preferences.tags.length > 3 && (
                                  <span className="px-2 py-1 bg-gray-100 text-xs rounded">
                                    +{user.preferences.tags.length - 3}
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex justify-between items-center pt-2">
                              <button
                                onClick={() => setSelectedUser(user.id)}
                                className="text-sm text-purple-600 hover:text-purple-700 font-medium"
                              >
                                Select User
                              </button>
                              <div className="flex space-x-2">
                                <button className="p-1 text-gray-400 hover:text-gray-600">
                                  <Edit className="h-4 w-4" />
                                </button>
                                <button className="p-1 text-gray-400 hover:text-red-600">
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            
            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* General Settings */}
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">General Settings</h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Auto-refresh Interval (seconds)
                        </label>
                        <input
                          type="number"
                          min="10"
                          max="300"
                          className="w-full p-2 border border-gray-300 rounded-md"
                          defaultValue="30"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Max Recommendations per User
                        </label>
                        <input
                          type="number"
                          min="5"
                          max="100"
                          className="w-full p-2 border border-gray-300 rounded-md"
                          defaultValue={config.realTime.maxRecommendations}
                        />
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="real-time"
                          checked={config.realTime.enabled}
                          className="rounded border-gray-300"
                        />
                        <label htmlFor="real-time" className="text-sm text-gray-700">
                          Enable Real-time Updates
                        </label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="personalization"
                          checked={config.personalization.enabled}
                          className="rounded border-gray-300"
                        />
                        <label htmlFor="personalization" className="text-sm text-gray-700">
                          Enable Personalization
                        </label>
                      </div>
                    </div>
                  </div>
                  
                  {/* Filter Settings */}
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Filter Settings</h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Minimum Rating
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="5"
                          step="0.1"
                          className="w-full p-2 border border-gray-300 rounded-md"
                          defaultValue={config.filters.minRating}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Max Content Age (days)
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="365"
                          className="w-full p-2 border border-gray-300 rounded-md"
                          defaultValue={config.filters.maxAge}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Diversity Threshold
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="1"
                          step="0.1"
                          className="w-full p-2 border border-gray-300 rounded-md"
                          defaultValue={config.filters.diversityThreshold}
                        />
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="exclude-viewed"
                          checked={config.filters.excludeViewed}
                          className="rounded border-gray-300"
                        />
                        <label htmlFor="exclude-viewed" className="text-sm text-gray-700">
                          Exclude Previously Viewed Content
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Configuration Actions */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Configuration</h3>
                  
                  <div className="flex space-x-4">
                    <button
                      onClick={() => {
                        const config = actions.exportConfig();
                        const blob = new Blob([config], { type: 'application/json' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = 'recommendation-config.json';
                        a.click();
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center space-x-2"
                    >
                      <Download className="h-4 w-4" />
                      <span>Export Config</span>
                    </button>
                    
                    <button
                      onClick={() => {
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.accept = '.json';
                        input.onchange = (e) => {
                          const file = (e.target as HTMLInputElement).files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (e) => {
                              const content = e.target?.result as string;
                              actions.importConfig(content);
                            };
                            reader.readAsText(file);
                          }
                        };
                        input.click();
                      }}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center space-x-2"
                    >
                      <Upload className="h-4 w-4" />
                      <span>Import Config</span>
                    </button>
                    
                    <button
                      onClick={() => actions.resetConfig()}
                      className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors flex items-center space-x-2"
                    >
                      <RotateCcw className="h-4 w-4" />
                      <span>Reset to Default</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}
      
      {/* Create Dialog */}
      {renderCreateDialog()}
    </div>
  );
};

export default ContentRecommendationPanel;