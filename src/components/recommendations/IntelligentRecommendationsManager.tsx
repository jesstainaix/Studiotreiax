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
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { Progress } from '../ui/progress';
import { Separator } from '../ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import {
  Brain,
  Users,
  FileText,
  Target,
  TrendingUp,
  Star,
  Activity,
  Settings,
  Search,
  Filter,
  RefreshCw,
  Play,
  Pause,
  BarChart3,
  PieChart,
  LineChart,
  Zap,
  Lightbulb,
  Heart,
  ThumbsUp,
  ThumbsDown,
  Eye,
  Clock,
  Award,
  Sparkles,
  Cpu,
  Database,
  Globe,
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info,
  Download,
  Upload,
  Share2,
  BookOpen,
  Video,
  Music,
  Image,
  FileIcon
} from 'lucide-react';
import {
  useIntelligentRecommendations,
  useRecommendationStats,
  useRecommendationConfig,
  useUserRecommendations,
  useRecommendationAnalytics,
  useRecommendationModels,
  useRecommendationFeedback
} from '../../hooks/useIntelligentRecommendations';
import {
  RecommendationItem,
  ContentItem,
  UserProfile,
  MLModel
} from '../../services/intelligentRecommendationsService';

interface IntelligentRecommendationsManagerProps {
  className?: string;
}

const IntelligentRecommendationsManager: React.FC<IntelligentRecommendationsManagerProps> = ({
  className = ''
}) => {
  // Main hook
  const {
    userProfiles,
    contentItems,
    recommendations,
    models,
    config,
    stats,
    events,
    isProcessing,
    error,
    isInitialized,
    activeUsers,
    trendingContent,
    topRecommendations,
    recentEvents,
    modelPerformance,
    actions,
    quickActions,
    advancedFeatures,
    systemOps,
    utilities,
    configAndAnalytics,
    debug,
    computed,
    autoRefresh,
    setAutoRefresh,
    refreshInterval,
    setRefreshInterval
  } = useIntelligentRecommendations();
  
  // Specialized hooks
  const recommendationStats = useRecommendationStats();
  const { config: currentConfig, updateConfig } = useRecommendationConfig();
  const { analytics, refreshAnalytics } = useRecommendationAnalytics();
  const { models: mlModels, isTraining, createModel } = useRecommendationModels();
  const { recordClick, provideFeedback } = useRecommendationFeedback();
  
  // Local state
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [selectedContent, setSelectedContent] = useState<string>('');
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('score');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedRecommendation, setSelectedRecommendation] = useState<RecommendationItem | null>(null);
  const [showRecommendationModal, setShowRecommendationModal] = useState(false);
  const [isGeneratingDemo, setIsGeneratingDemo] = useState(false);
  
  // Auto-refresh effect
  useEffect(() => {
    if (!autoRefresh || !isInitialized) return;
    
    const interval = setInterval(() => {
      actions.refreshData();
    }, refreshInterval);
    
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, isInitialized, actions]);
  
  // Demo data generation
  const generateDemoData = async () => {
    setIsGeneratingDemo(true);
    try {
      // Generate demo recommendations for existing users
      for (const user of userProfiles.slice(0, 3)) {
        await actions.recommend(user.id, { context: 'demo', limit: 5 });
      }
    } catch (error) {
      console.error('Failed to generate demo data:', error);
    } finally {
      setIsGeneratingDemo(false);
    }
  };
  
  // Filtered and sorted data
  const filteredRecommendations = useMemo(() => {
    let filtered = recommendations;
    
    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(rec => 
        rec.content.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rec.content.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rec.content.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    
    // Apply type filter
    if (filterType !== 'all') {
      filtered = filtered.filter(rec => rec.content.type === filterType);
    }
    
    // Apply user filter
    if (selectedUser) {
      filtered = filtered.filter(rec => rec.userId === selectedUser);
    }
    
    // Sort
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'score':
          aValue = a.score;
          bValue = b.score;
          break;
        case 'confidence':
          aValue = a.confidence;
          bValue = b.confidence;
          break;
        case 'timestamp':
          aValue = new Date(a.timestamp).getTime();
          bValue = new Date(b.timestamp).getTime();
          break;
        case 'popularity':
          aValue = a.content.popularity;
          bValue = b.content.popularity;
          break;
        default:
          aValue = a.score;
          bValue = b.score;
      }
      
      if (sortOrder === 'asc') {
        return aValue - bValue;
      } else {
        return bValue - aValue;
      }
    });
    
    return filtered;
  }, [recommendations, searchQuery, filterType, selectedUser, sortBy, sortOrder]);
  
  const filteredContent = useMemo(() => {
    let filtered = contentItems;
    
    if (searchQuery) {
      filtered = filtered.filter(item => 
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    
    if (filterType !== 'all') {
      filtered = filtered.filter(item => item.type === filterType);
    }
    
    return filtered;
  }, [contentItems, searchQuery, filterType]);
  
  // Status cards data
  const statusCards = [
    {
      title: 'Total Users',
      value: computed.totalUsers,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      change: '+12%',
      changeType: 'positive' as const
    },
    {
      title: 'Content Items',
      value: computed.totalContent,
      icon: FileText,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      change: '+8%',
      changeType: 'positive' as const
    },
    {
      title: 'Recommendations',
      value: computed.totalRecommendations,
      icon: Target,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      change: '+25%',
      changeType: 'positive' as const
    },
    {
      title: 'Avg Score',
      value: computed.averageScore.toFixed(2),
      icon: Star,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      change: '+5%',
      changeType: 'positive' as const
    }
  ];
  
  // Tab configuration
  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'recommendations', label: 'Recommendations', icon: Target },
    { id: 'content', label: 'Content', icon: FileText },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'models', label: 'ML Models', icon: Brain },
    { id: 'analytics', label: 'Analytics', icon: PieChart },
    { id: 'realtime', label: 'Real-time', icon: Activity },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];
  
  // Content type icons
  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case 'video': return Video;
      case 'audio': return Music;
      case 'image': return Image;
      case 'document': return BookOpen;
      case 'template': return FileIcon;
      default: return FileText;
    }
  };
  
  // Recommendation score color
  const getScoreColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600';
    if (score >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };
  
  // Handle recommendation click
  const handleRecommendationClick = async (recommendation: RecommendationItem) => {
    setSelectedRecommendation(recommendation);
    setShowRecommendationModal(true);
    
    // Record interaction
    try {
      await recordClick(recommendation.userId, recommendation.id, {
        type: 'click',
        timestamp: new Date().toISOString(),
        context: 'manager_view'
      });
    } catch (error) {
      console.error('Failed to record click:', error);
    }
  };
  
  // Handle feedback
  const handleFeedback = async (recommendationId: string, userId: string, rating: number) => {
    try {
      await provideFeedback(userId, recommendationId, {
        rating,
        timestamp: new Date().toISOString(),
        source: 'manager_interface'
      });
    } catch (error) {
      console.error('Failed to provide feedback:', error);
    }
  };
  
  if (!isInitialized) {
    return (
      <div className={`flex items-center justify-center h-64 ${className}`}>
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Initializing Intelligent Recommendations...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Brain className="h-8 w-8 text-blue-600" />
            Intelligent Recommendations
          </h1>
          <p className="text-gray-600 mt-1">
            Advanced AI-powered content recommendation system
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={autoRefresh ? 'bg-green-50 border-green-200' : ''}
          >
            {autoRefresh ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            {autoRefresh ? 'Pause' : 'Start'} Auto-refresh
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={actions.refreshData}
            disabled={isProcessing}
          >
            <RefreshCw className={`h-4 w-4 ${isProcessing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={generateDemoData}
            disabled={isGeneratingDemo}
          >
            <Sparkles className={`h-4 w-4 ${isGeneratingDemo ? 'animate-spin' : ''}`} />
            Generate Demo
          </Button>
        </div>
      </div>
      
      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {/* Loading State */}
      {isProcessing && (
        <Alert>
          <RefreshCw className="h-4 w-4 animate-spin" />
          <AlertDescription>
            Processing recommendations... This may take a few moments.
          </AlertDescription>
        </Alert>
      )}
      
      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statusCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{card.title}</p>
                    <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                    <p className={`text-sm ${
                      card.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {card.change} from last period
                    </p>
                  </div>
                  <div className={`p-3 rounded-lg ${card.bgColor}`}>
                    <Icon className={`h-6 w-6 ${card.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      
      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <TabsTrigger key={tab.id} value={tab.id} className="flex items-center gap-2">
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>
        
        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* System Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  System Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">System Health</span>
                  <Badge variant={computed.isHealthy ? 'default' : 'destructive'}>
                    {computed.isHealthy ? 'Healthy' : 'Issues Detected'}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Processing Status</span>
                  <Badge variant={isProcessing ? 'secondary' : 'outline'}>
                    {computed.processingStatus}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Data Status</span>
                  <Badge variant={computed.hasData ? 'default' : 'secondary'}>
                    {computed.hasData ? 'Data Available' : 'No Data'}
                  </Badge>
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Active Users</span>
                    <span className="font-medium">{computed.activeUserCount}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Trending Content</span>
                    <span className="font-medium">{computed.trendingContentCount}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Top Recommendations</span>
                    <span className="font-medium">{computed.topRecommendationCount}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentEvents.slice(0, 5).map((event, index) => (
                    <div key={index} className="flex items-center gap-3 p-2 rounded-lg bg-gray-50">
                      <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{event.type}</p>
                        <p className="text-xs text-gray-600">
                          {new Date(event.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                  
                  {recentEvents.length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-4">
                      No recent activity
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Performance Metrics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {((computed.averageScore || 0) * 100).toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-600">Average Score</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {computed.totalRecommendations}
                  </div>
                  <div className="text-sm text-gray-600">Total Recommendations</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {computed.totalModels}
                  </div>
                  <div className="text-sm text-gray-600">Active Models</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Recommendations Tab */}
        <TabsContent value="recommendations" className="space-y-6">
          {/* Controls */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="Search recommendations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full"
                  />
                </div>
                
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="video">Video</SelectItem>
                    <SelectItem value="audio">Audio</SelectItem>
                    <SelectItem value="document">Document</SelectItem>
                    <SelectItem value="template">Template</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={selectedUser} onValueChange={setSelectedUser}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="Filter by user" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Users</SelectItem>
                    {userProfiles.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.id}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="score">Score</SelectItem>
                    <SelectItem value="confidence">Confidence</SelectItem>
                    <SelectItem value="timestamp">Date</SelectItem>
                    <SelectItem value="popularity">Popularity</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
          
          {/* Recommendations List */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredRecommendations.map((recommendation) => {
              const ContentIcon = getContentTypeIcon(recommendation.content.type);
              return (
                <Card 
                  key={recommendation.id} 
                  className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => handleRecommendationClick(recommendation)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-blue-50 rounded-lg">
                        <ContentIcon className="h-5 w-5 text-blue-600" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 truncate">
                          {recommendation.content.title}
                        </h3>
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {recommendation.content.description}
                        </p>
                        
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className="text-xs">
                            {recommendation.content.type}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            User: {recommendation.userId}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center gap-2">
                            <Star className="h-4 w-4 text-yellow-500" />
                            <span className={`text-sm font-medium ${getScoreColor(recommendation.score)}`}>
                              {(recommendation.score * 100).toFixed(1)}%
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleFeedback(recommendation.id, recommendation.userId, 1);
                              }}
                            >
                              <ThumbsUp className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleFeedback(recommendation.id, recommendation.userId, -1);
                              }}
                            >
                              <ThumbsDown className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          
          {filteredRecommendations.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center">
                <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No Recommendations Found
                </h3>
                <p className="text-gray-600 mb-4">
                  Try adjusting your search criteria or generate new recommendations.
                </p>
                <Button onClick={generateDemoData} disabled={isGeneratingDemo}>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate Demo Recommendations
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        {/* Content Tab */}
        <TabsContent value="content" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredContent.map((content) => {
              const ContentIcon = getContentTypeIcon(content.type);
              return (
                <Card key={content.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-green-50 rounded-lg">
                        <ContentIcon className="h-5 w-5 text-green-600" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 truncate">
                          {content.title}
                        </h3>
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {content.description}
                        </p>
                        
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className="text-xs">
                            {content.type}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {content.category}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center gap-2">
                            <Star className="h-4 w-4 text-yellow-500" />
                            <span className="text-sm font-medium">
                              {content.rating?.toFixed(1) || 'N/A'}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Eye className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-600">
                              {content.views || 0}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
        
        {/* Users Tab */}
        <TabsContent value="users" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {userProfiles.map((user) => (
              <Card key={user.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-purple-50 rounded-lg">
                      <Users className="h-5 w-5 text-purple-600" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 truncate">
                        {user.id}
                      </h3>
                      
                      <div className="mt-2 space-y-1">
                        <div className="text-sm text-gray-600">
                          <span className="font-medium">Preferences:</span>
                        </div>
                        
                        {user.preferences?.contentTypes && (
                          <div className="flex flex-wrap gap-1">
                            {user.preferences.contentTypes.slice(0, 3).map((type, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {type}
                              </Badge>
                            ))}
                          </div>
                        )}
                        
                        {user.preferences?.topics && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {user.preferences.topics.slice(0, 3).map((topic, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {topic}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between mt-3">
                        <div className="text-sm text-gray-600">
                          <span className="font-medium">Activity:</span> Active
                        </div>
                        
                        <Button size="sm" variant="outline">
                          View Profile
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        {/* Models Tab */}
        <TabsContent value="models" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">ML Models</h2>
            <Button onClick={() => createModel('collaborative_filtering')} disabled={isTraining}>
              <Brain className="h-4 w-4 mr-2" />
              {isTraining ? 'Training...' : 'Train New Model'}
            </Button>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {mlModels.map((model) => (
              <Card key={model.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-indigo-50 rounded-lg">
                      <Brain className="h-5 w-5 text-indigo-600" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 truncate">
                        {model.name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {model.type}
                      </p>
                      
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant={model.status === 'active' ? 'default' : 'secondary'}>
                          {model.status}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          v{model.version}
                        </Badge>
                      </div>
                      
                      <div className="mt-3">
                        <div className="flex justify-between text-sm mb-1">
                          <span>Accuracy</span>
                          <span className="font-medium">
                            {(model.accuracy * 100).toFixed(1)}%
                          </span>
                        </div>
                        <Progress value={model.accuracy * 100} className="h-2" />
                      </div>
                      
                      <div className="flex items-center justify-between mt-3">
                        <div className="text-sm text-gray-600">
                          Updated: {new Date(model.lastTrained).toLocaleDateString()}
                        </div>
                        
                        <div className="flex gap-1">
                          <Button size="sm" variant="outline">
                            <Settings className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="outline">
                            <BarChart3 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Recommendation Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Click-through Rate</span>
                    <span className="text-lg font-bold text-green-600">12.5%</span>
                  </div>
                  <Progress value={12.5} className="h-2" />
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Conversion Rate</span>
                    <span className="text-lg font-bold text-blue-600">8.3%</span>
                  </div>
                  <Progress value={8.3} className="h-2" />
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">User Satisfaction</span>
                    <span className="text-lg font-bold text-purple-600">87%</span>
                  </div>
                  <Progress value={87} className="h-2" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LineChart className="h-5 w-5" />
                  Content Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {['video', 'audio', 'document', 'template'].map((type) => {
                    const count = contentItems.filter(item => item.type === type).length;
                    const percentage = contentItems.length > 0 ? (count / contentItems.length) * 100 : 0;
                    
                    return (
                      <div key={type} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                          <span className="text-sm font-medium capitalize">{type}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600">{count}</span>
                          <span className="text-sm font-medium">{percentage.toFixed(1)}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Real-time Tab */}
        <TabsContent value="realtime" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Real-time Processing
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Real-time Processing</span>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={systemOps.startRealTime}
                    >
                      <Play className="h-4 w-4 mr-1" />
                      Start
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={systemOps.stopRealTime}
                    >
                      <Pause className="h-4 w-4 mr-1" />
                      Stop
                    </Button>
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-3">
                  <h4 className="font-medium">Recent Events</h4>
                  {recentEvents.slice(0, 10).map((event, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{event.type}</span>
                          <span className="text-xs text-gray-500">
                            {new Date(event.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        {event.data && (
                          <p className="text-xs text-gray-600 mt-1">
                            {JSON.stringify(event.data).substring(0, 100)}...
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                System Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Auto Refresh</label>
                  <div className="flex items-center gap-2 mt-1">
                    <Button
                      size="sm"
                      variant={autoRefresh ? 'default' : 'outline'}
                      onClick={() => setAutoRefresh(!autoRefresh)}
                    >
                      {autoRefresh ? 'Enabled' : 'Disabled'}
                    </Button>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium">Refresh Interval (ms)</label>
                  <Input
                    type="number"
                    value={refreshInterval}
                    onChange={(e) => setRefreshInterval(Number(e.target.value))}
                    className="mt-1"
                    min={5000}
                    max={300000}
                    step={5000}
                  />
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-3">
                <h4 className="font-medium">System Actions</h4>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={actions.refreshData}
                    disabled={isProcessing}
                  >
                    <RefreshCw className="h-4 w-4 mr-1" />
                    Refresh Data
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={systemOps.checkHealth}
                  >
                    <Shield className="h-4 w-4 mr-1" />
                    Health Check
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={debug.logState}
                  >
                    <Info className="h-4 w-4 mr-1" />
                    Debug State
                  </Button>
                  
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={actions.resetSystem}
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    Reset System
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Recommendation Details Modal */}
      <Dialog open={showRecommendationModal} onOpenChange={setShowRecommendationModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Recommendation Details
            </DialogTitle>
            <DialogDescription>
              Detailed information about this recommendation
            </DialogDescription>
          </DialogHeader>
          
          {selectedRecommendation && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Content Title</label>
                  <p className="text-sm font-medium">{selectedRecommendation.content.title}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-600">User ID</label>
                  <p className="text-sm font-medium">{selectedRecommendation.userId}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-600">Score</label>
                  <p className={`text-sm font-medium ${getScoreColor(selectedRecommendation.score)}`}>
                    {(selectedRecommendation.score * 100).toFixed(1)}%
                  </p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-600">Confidence</label>
                  <p className="text-sm font-medium">
                    {(selectedRecommendation.confidence * 100).toFixed(1)}%
                  </p>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-600">Description</label>
                <p className="text-sm mt-1">{selectedRecommendation.content.description}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-600">Tags</label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {selectedRecommendation.content.tags.map((tag, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-600">Reasoning</label>
                <p className="text-sm mt-1 text-gray-600">
                  {selectedRecommendation.reasoning || 'No reasoning provided'}
                </p>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowRecommendationModal(false)}
                >
                  Close
                </Button>
                <Button
                  onClick={() => {
                    handleFeedback(selectedRecommendation.id, selectedRecommendation.userId, 1);
                    setShowRecommendationModal(false);
                  }}
                >
                  <ThumbsUp className="h-4 w-4 mr-1" />
                  Like
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default IntelligentRecommendationsManager;