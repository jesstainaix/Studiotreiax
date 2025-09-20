import React, { useState, useEffect, useMemo } from 'react';
import { useAIRecommendation, useRecommendationStats, useRecommendationConfig, useUserRecommendations } from '../../hooks/useAIRecommendation';
import { recommendationUtils, type Recommendation, type ContentItem, type RecommendationAlgorithm } from '../../services/aiRecommendationService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Progress } from '../ui/progress';
import { Switch } from '../ui/switch';
import { Slider } from '../ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Alert, AlertDescription } from '../ui/alert';
import { Separator } from '../ui/separator';
import { ScrollArea } from '../ui/scroll-area';
import {
  Brain,
  Users,
  TrendingUp,
  Star,
  Eye,
  Download,
  Heart,
  Share2,
  Clock,
  Target,
  Settings,
  Play,
  Pause,
  RefreshCw,
  Search,
  Filter,
  BarChart3,
  Activity,
  Zap,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info,
  Trash2,
  Edit,
  Plus,
  Minus,
  ArrowUp,
  ArrowDown,
  ExternalLink,
  Database,
  Cpu,
  Memory,
  HardDrive
} from 'lucide-react';

export function AIRecommendationManager() {
  const {
    recommendations,
    contentItems,
    userProfiles,
    algorithms,
    config,
    stats,
    events,
    debugLogs,
    isInitialized,
    isProcessing,
    isTraining,
    error,
    lastUpdate,
    computed,
    actions,
    quickActions,
    advanced,
    system,
    utils,
    clearError
  } = useAIRecommendation();
  
  const enhancedStats = useRecommendationStats();
  const { config: configData, actions: configActions } = useRecommendationConfig();
  
  // Estado local
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedAlgorithm, setSelectedAlgorithm] = useState('all');
  const [selectedUser, setSelectedUser] = useState('');
  const [showDetails, setShowDetails] = useState<string | null>(null);
  const [showError, setShowError] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  
  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      if (userProfiles.length > 0) {
        actions.refreshCache();
      }
    }, 30000); // 30 segundos
    
    return () => clearInterval(interval);
  }, [autoRefresh, userProfiles.length, actions]);
  
  // Gerar dados demo
  useEffect(() => {
    if (isInitialized && contentItems.length === 0) {
      generateDemoData();
    }
  }, [isInitialized, contentItems.length]);
  
  const generateDemoData = () => {
    // Adicionar conteúdo demo
    const demoContent: ContentItem[] = [
      {
        id: 'content_1',
        title: 'Tutorial de Edição Avançada',
        description: 'Aprenda técnicas avançadas de edição de vídeo',
        type: 'video',
        category: 'tutorial',
        tags: ['edição', 'avançado', 'técnicas'],
        metadata: {
          duration: 1800,
          resolution: '4K',
          format: 'mp4',
          size: 2048000000,
          quality: 'ultra',
          language: 'pt-BR',
          author: 'Studio Treiax',
          createdAt: Date.now() - 86400000,
          updatedAt: Date.now()
        },
        analytics: {
          views: 15420,
          downloads: 892,
          likes: 1205,
          shares: 234,
          rating: 4.8,
          engagement: 0.85
        },
        features: ['transitions', 'effects', 'color-grading'],
        thumbnail: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20video%20editing%20tutorial%20thumbnail%20with%20timeline%20and%20effects&image_size=landscape_16_9',
        url: '/content/tutorial-advanced-editing'
      },
      {
        id: 'content_2',
        title: 'Pack de Efeitos Cinematográficos',
        description: 'Coleção de efeitos para criar looks cinematográficos',
        type: 'effect',
        category: 'effects',
        tags: ['cinematográfico', 'efeitos', 'pack'],
        metadata: {
          format: 'preset',
          size: 512000000,
          quality: 'high',
          language: 'universal',
          author: 'Pro Effects',
          createdAt: Date.now() - 172800000,
          updatedAt: Date.now()
        },
        analytics: {
          views: 8930,
          downloads: 1205,
          likes: 892,
          shares: 156,
          rating: 4.6,
          engagement: 0.78
        },
        features: ['luts', 'presets', 'overlays'],
        thumbnail: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=cinematic%20effects%20pack%20preview%20with%20color%20grading%20examples&image_size=landscape_16_9',
        url: '/content/cinematic-effects-pack'
      },
      {
        id: 'content_3',
        title: 'Template de Intro Moderna',
        description: 'Template animado para intros profissionais',
        type: 'template',
        category: 'templates',
        tags: ['intro', 'animação', 'moderno'],
        metadata: {
          duration: 10,
          resolution: '4K',
          format: 'aep',
          size: 1024000000,
          quality: 'ultra',
          language: 'universal',
          author: 'Motion Graphics Pro',
          createdAt: Date.now() - 259200000,
          updatedAt: Date.now()
        },
        analytics: {
          views: 12340,
          downloads: 567,
          likes: 789,
          shares: 123,
          rating: 4.7,
          engagement: 0.82
        },
        features: ['after-effects', 'customizable', 'animated'],
        thumbnail: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=modern%20intro%20template%20preview%20with%20animated%20text%20and%20graphics&image_size=landscape_16_9',
        url: '/content/modern-intro-template'
      }
    ];
    
    demoContent.forEach(item => actions.addContentItem(item));
    
    // Criar perfil de usuário demo
    actions.createUserProfile('user_demo', {
      preferences: {
        categories: ['tutorial', 'effects'],
        contentTypes: ['video', 'effect'],
        qualityPreference: 'ultra',
        languagePreference: 'pt-BR',
        themes: ['cinematic', 'modern'],
        styles: ['professional']
      },
      behavior: {
        viewHistory: ['content_1'],
        downloadHistory: ['content_2'],
        searchHistory: ['efeitos cinematográficos', 'tutorial edição'],
        interactionHistory: [
          {
            itemId: 'content_1',
            action: 'view',
            timestamp: Date.now() - 3600000,
            duration: 1200
          }
        ],
        sessionTime: 3600,
        activeHours: [9, 10, 14, 15, 20, 21]
      },
      demographics: {
        experience: 'intermediate',
        profession: 'content creator'
      },
      goals: ['improve editing skills', 'create professional content']
    });
  };
  
  // Filtrar recomendações
  const filteredRecommendations = useMemo(() => {
    let filtered = recommendations;
    
    if (searchQuery) {
      filtered = utils.search.recommendations(searchQuery);
    }
    
    if (selectedAlgorithm !== 'all') {
      filtered = filtered.filter(r => r.algorithm === selectedAlgorithm);
    }
    
    if (selectedUser) {
      filtered = filtered.filter(r => r.userId === selectedUser);
    }
    
    return filtered;
  }, [recommendations, searchQuery, selectedAlgorithm, selectedUser, utils]);
  
  // Filtrar conteúdo
  const filteredContent = useMemo(() => {
    let filtered = contentItems;
    
    if (searchQuery) {
      filtered = actions.searchContent(searchQuery);
    }
    
    if (selectedCategory !== 'all') {
      filtered = utils.filter.byCategory(filtered, selectedCategory);
    }
    
    return filtered;
  }, [contentItems, searchQuery, selectedCategory, actions, utils]);
  
  // Cards de status
  const statusCards = [
    {
      title: 'Total de Recomendações',
      value: stats.totalRecommendations.toLocaleString(),
      icon: Target,
      color: 'blue',
      change: '+12%'
    },
    {
      title: 'Taxa de Cliques',
      value: `${(stats.clickThroughRate * 100).toFixed(1)}%`,
      icon: Eye,
      color: 'green',
      change: '+5.2%'
    },
    {
      title: 'Usuários Ativos',
      value: stats.userEngagement.activeUsers.toLocaleString(),
      icon: Users,
      color: 'purple',
      change: '+8.1%'
    },
    {
      title: 'Saúde do Sistema',
      value: `${computed.systemHealth.score}%`,
      icon: computed.systemHealth.status === 'healthy' ? CheckCircle : 
            computed.systemHealth.status === 'degraded' ? AlertTriangle : XCircle,
      color: computed.systemHealth.status === 'healthy' ? 'green' : 
             computed.systemHealth.status === 'degraded' ? 'yellow' : 'red',
      change: computed.systemHealth.status
    }
  ];
  
  // Configuração de abas
  const tabs = [
    { id: 'overview', label: 'Visão Geral', icon: BarChart3 },
    { id: 'recommendations', label: 'Recomendações', icon: Target },
    { id: 'content', label: 'Conteúdo', icon: Database },
    { id: 'algorithms', label: 'Algoritmos', icon: Brain },
    { id: 'users', label: 'Usuários', icon: Users },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp },
    { id: 'performance', label: 'Performance', icon: Activity },
    { id: 'events', label: 'Eventos', icon: Clock },
    { id: 'settings', label: 'Configurações', icon: Settings },
    { id: 'debug', label: 'Debug', icon: Info }
  ];
  
  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Inicializando sistema de recomendações...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Brain className="h-8 w-8 text-blue-500" />
            Sistema de Recomendações IA
          </h1>
          <p className="text-muted-foreground mt-1">
            Recomendações inteligentes de conteúdo baseadas em IA
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <Switch
              checked={autoRefresh}
              onCheckedChange={setAutoRefresh}
            />
            <span className="text-sm">Auto-refresh</span>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => actions.refreshCache()}
            disabled={isProcessing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isProcessing ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => quickActions.optimizeAlgorithms()}
            disabled={isProcessing}
          >
            <Zap className="h-4 w-4 mr-2" />
            Otimizar
          </Button>
        </div>
      </div>
      
      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            {error}
            <Button
              variant="ghost"
              size="sm"
              onClick={clearError}
            >
              <XCircle className="h-4 w-4" />
            </Button>
          </AlertDescription>
        </Alert>
      )}
      
      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statusCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {card.title}
                    </p>
                    <p className="text-2xl font-bold">{card.value}</p>
                    <p className={`text-xs ${
                      card.change.startsWith('+') ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {card.change}
                    </p>
                  </div>
                  <Icon className={`h-8 w-8 text-${card.color}-500`} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      
      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5 lg:grid-cols-10">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <TabsTrigger key={tab.id} value={tab.id} className="flex items-center gap-1">
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>
        
        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* System Health */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Saúde do Sistema
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Score Geral</span>
                  <Badge variant={computed.systemHealth.status === 'healthy' ? 'default' : 'destructive'}>
                    {computed.systemHealth.score}%
                  </Badge>
                </div>
                <Progress value={computed.systemHealth.score} className="w-full" />
                
                {computed.systemHealth.issues.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Problemas Detectados:</p>
                    {computed.systemHealth.issues.map((issue, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm text-red-600">
                        <AlertTriangle className="h-4 w-4" />
                        {issue}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Ações Rápidas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  className="w-full justify-start"
                  variant="outline"
                  onClick={() => quickActions.getPersonalizedRecommendations('user_demo')}
                >
                  <Target className="h-4 w-4 mr-2" />
                  Gerar Recomendações Personalizadas
                </Button>
                
                <Button
                  className="w-full justify-start"
                  variant="outline"
                  onClick={() => quickActions.optimizeAlgorithms()}
                >
                  <Brain className="h-4 w-4 mr-2" />
                  Otimizar Algoritmos
                </Button>
                
                <Button
                  className="w-full justify-start"
                  variant="outline"
                  onClick={() => actions.clearCache()}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Limpar Cache
                </Button>
              </CardContent>
            </Card>
          </div>
          
          {/* Recent Events */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Eventos Recentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-64">
                <div className="space-y-2">
                  {events.slice(-10).reverse().map((event, index) => (
                    <div key={event.id} className="flex items-center gap-3 p-2 rounded border">
                      <div className={`w-2 h-2 rounded-full ${
                        event.severity === 'error' ? 'bg-red-500' :
                        event.severity === 'warning' ? 'bg-yellow-500' :
                        'bg-green-500'
                      }`} />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{event.type}</p>
                        <p className="text-xs text-muted-foreground">
                          {utils.format.timestamp(event.timestamp)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Recommendations Tab */}
        <TabsContent value="recommendations" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-64">
                  <Input
                    placeholder="Buscar recomendações..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full"
                  />
                </div>
                
                <Select value={selectedAlgorithm} onValueChange={setSelectedAlgorithm}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Algoritmo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Algoritmos</SelectItem>
                    {algorithms.map(alg => (
                      <SelectItem key={alg.id} value={alg.id}>
                        {alg.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={selectedUser} onValueChange={setSelectedUser}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Usuário" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos os Usuários</SelectItem>
                    {userProfiles.map(user => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.id}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
          
          {/* Recommendations List */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredRecommendations.map(recommendation => {
              const content = contentItems.find(item => item.id === recommendation.itemId);
              if (!content) return null;
              
              return (
                <Card key={recommendation.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      {/* Header */}
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium text-sm">{content.title}</h3>
                          <p className="text-xs text-muted-foreground mt-1">
                            {content.description}
                          </p>
                        </div>
                        <Badge variant="outline" className="ml-2">
                          {recommendationUtils.getPriorityIcon(recommendation.metadata.priority)}
                        </Badge>
                      </div>
                      
                      {/* Metrics */}
                      <div className="flex items-center gap-4 text-xs">
                        <div className="flex items-center gap-1">
                          <Target className="h-3 w-3" />
                          <span>{utils.format.score(recommendation.score)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" />
                          <span>{utils.format.confidence(recommendation.confidence)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Brain className="h-3 w-3" />
                          <span>{recommendationUtils.getAlgorithmIcon(algorithms.find(a => a.id === recommendation.algorithm)?.type || '')}</span>
                        </div>
                      </div>
                      
                      {/* Reasons */}
                      <div className="space-y-1">
                        {recommendation.reasons.slice(0, 2).map((reason, index) => (
                          <p key={index} className="text-xs text-muted-foreground">
                            • {reason}
                          </p>
                        ))}
                      </div>
                      
                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setShowDetails(recommendation.id)}
                        >
                          <Info className="h-3 w-3 mr-1" />
                          Detalhes
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => actions.updateRecommendationStatus(recommendation.id, 'clicked')}
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          Abrir
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => actions.dismissRecommendation(recommendation.id)}
                        >
                          <XCircle className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
        
        {/* Content Tab */}
        <TabsContent value="content" className="space-y-6">
          {/* Content Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-64">
                  <Input
                    placeholder="Buscar conteúdo..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full"
                  />
                </div>
                
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as Categorias</SelectItem>
                    <SelectItem value="tutorial">Tutorial</SelectItem>
                    <SelectItem value="effects">Efeitos</SelectItem>
                    <SelectItem value="templates">Templates</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
          
          {/* Content Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredContent.map(item => (
              <Card key={item.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-0">
                  {/* Thumbnail */}
                  <div className="aspect-video bg-muted rounded-t-lg overflow-hidden">
                    <img
                      src={item.thumbnail}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  <div className="p-4 space-y-3">
                    {/* Header */}
                    <div>
                      <h3 className="font-medium">{item.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {item.description}
                      </p>
                    </div>
                    
                    {/* Metadata */}
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <Eye className="h-4 w-4" />
                        <span>{item.analytics.views.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Download className="h-4 w-4" />
                        <span>{item.analytics.downloads.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span>{item.analytics.rating.toFixed(1)}</span>
                      </div>
                    </div>
                    
                    {/* Tags */}
                    <div className="flex flex-wrap gap-1">
                      {item.tags.slice(0, 3).map(tag => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    
                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <Button size="sm" className="flex-1">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Abrir
                      </Button>
                      <Button size="sm" variant="outline">
                        <Heart className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <Share2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        {/* Algorithms Tab */}
        <TabsContent value="algorithms" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {algorithms.map(algorithm => (
              <Card key={algorithm.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <span>{recommendationUtils.getAlgorithmIcon(algorithm.type)}</span>
                      {algorithm.name}
                    </CardTitle>
                    <Switch
                      checked={algorithm.isEnabled}
                      onCheckedChange={(enabled) => actions.toggleAlgorithm(algorithm.id, enabled)}
                    />
                  </div>
                  <CardDescription>{algorithm.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Performance Metrics */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Precisão</p>
                      <p className="font-medium">{(algorithm.performance.accuracy * 100).toFixed(1)}%</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">CTR</p>
                      <p className="font-medium">{(algorithm.performance.clickThroughRate * 100).toFixed(1)}%</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Diversidade</p>
                      <p className="font-medium">{(algorithm.performance.diversity * 100).toFixed(1)}%</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Novidade</p>
                      <p className="font-medium">{(algorithm.performance.novelty * 100).toFixed(1)}%</p>
                    </div>
                  </div>
                  
                  {/* Weight Slider */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Peso</span>
                      <span className="text-sm font-medium">{algorithm.weight.toFixed(2)}</span>
                    </div>
                    <Slider
                      value={[algorithm.weight]}
                      onValueChange={([value]) => actions.updateAlgorithm(algorithm.id, { weight: value })}
                      max={1}
                      min={0}
                      step={0.1}
                      className="w-full"
                    />
                  </div>
                  
                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => actions.trainAlgorithm(algorithm.id)}
                      disabled={isTraining}
                    >
                      <Brain className="h-4 w-4 mr-2" />
                      Treinar
                    </Button>
                    
                    <Button size="sm" variant="outline">
                      <Settings className="h-4 w-4 mr-2" />
                      Configurar
                    </Button>
                  </div>
                  
                  {/* Training Info */}
                  {algorithm.lastTrained && (
                    <div className="text-xs text-muted-foreground">
                      Último treinamento: {utils.format.timestamp(algorithm.lastTrained)}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configurações do Sistema</CardTitle>
              <CardDescription>
                Configure o comportamento do sistema de recomendações
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* General Settings */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Geral</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Máximo de Recomendações</label>
                    <Input
                      type="number"
                      value={config.maxRecommendations}
                      onChange={(e) => actions.updateConfig({ maxRecommendations: parseInt(e.target.value) })}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Intervalo de Atualização (ms)</label>
                    <Input
                      type="number"
                      value={config.refreshInterval}
                      onChange={(e) => actions.updateConfig({ refreshInterval: parseInt(e.target.value) })}
                    />
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Tempo Real</p>
                    <p className="text-sm text-muted-foreground">Ativar recomendações em tempo real</p>
                  </div>
                  <Switch
                    checked={config.enableRealTime}
                    onCheckedChange={(enabled) => actions.updateConfig({ enableRealTime: enabled })}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Personalização</p>
                    <p className="text-sm text-muted-foreground">Ativar recomendações personalizadas</p>
                  </div>
                  <Switch
                    checked={config.enablePersonalization}
                    onCheckedChange={(enabled) => actions.updateConfig({ enablePersonalization: enabled })}
                  />
                </div>
              </div>
              
              <Separator />
              
              {/* Algorithm Weights */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Pesos dos Fatores</h3>
                
                <div className="space-y-4">
                  {Object.entries(config.weights).map(([key, value]) => (
                    <div key={key} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                        <span className="text-sm font-medium">{value.toFixed(2)}</span>
                      </div>
                      <Slider
                        value={[value]}
                        onValueChange={([newValue]) => actions.updateConfig({
                          weights: { ...config.weights, [key]: newValue }
                        })}
                        max={1}
                        min={0}
                        step={0.1}
                        className="w-full"
                      />
                    </div>
                  ))}
                </div>
              </div>
              
              <Separator />
              
              {/* Actions */}
              <div className="flex items-center gap-2">
                <Button onClick={() => actions.resetConfig()}>
                  Restaurar Padrões
                </Button>
                
                <Button variant="outline" onClick={() => advanced.analytics.exportData('json')}>
                  Exportar Configuração
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Test Area */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Play className="h-5 w-5" />
            Área de Teste
          </CardTitle>
          <CardDescription>
            Teste as funcionalidades do sistema de recomendações
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => quickActions.getPersonalizedRecommendations('user_demo')}
            >
              Gerar Recomendações Demo
            </Button>
            
            <Button
              variant="outline"
              onClick={() => {
                const trending = quickActions.getTrendingContent();
              }}
            >
              Obter Trending
            </Button>
            
            <Button
              variant="outline"
              onClick={() => {
                const similar = quickActions.getSimilarContent('content_1');
              }}
            >
              Conteúdo Similar
            </Button>
            
            <Button
              variant="outline"
              onClick={() => actions.submitFeedback('user_demo', 'content_1', 5, 'Excelente conteúdo!')}
            >
              Enviar Feedback
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* Details Modal */}
      <Dialog open={!!showDetails} onOpenChange={() => setShowDetails(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes da Recomendação</DialogTitle>
            <DialogDescription>
              Informações detalhadas sobre a recomendação selecionada
            </DialogDescription>
          </DialogHeader>
          
          {showDetails && (() => {
            const recommendation = recommendations.find(r => r.id === showDetails);
            const content = contentItems.find(item => item.id === recommendation?.itemId);
            const algorithm = algorithms.find(a => a.id === recommendation?.algorithm);
            
            if (!recommendation || !content) return null;
            
            return (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium">Score</p>
                    <p>{utils.format.score(recommendation.score)}</p>
                  </div>
                  <div>
                    <p className="font-medium">Confiança</p>
                    <p>{utils.format.confidence(recommendation.confidence)}</p>
                  </div>
                  <div>
                    <p className="font-medium">Algoritmo</p>
                    <p>{algorithm?.name || recommendation.algorithm}</p>
                  </div>
                  <div>
                    <p className="font-medium">Prioridade</p>
                    <p className="capitalize">{recommendation.metadata.priority}</p>
                  </div>
                </div>
                
                <div>
                  <p className="font-medium mb-2">Razões</p>
                  <ul className="space-y-1">
                    {recommendation.reasons.map((reason, index) => (
                      <li key={index} className="text-sm">• {reason}</li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <p className="font-medium mb-2">Contexto</p>
                  <div className="text-sm space-y-1">
                    <p>Hora do dia: {recommendation.context.timeOfDay}h</p>
                    <p>Duração da sessão: {recommendation.context.sessionDuration}s</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => actions.updateRecommendationStatus(recommendation.id, 'clicked')}
                  >
                    Marcar como Clicado
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => actions.dismissRecommendation(recommendation.id)}
                  >
                    Dispensar
                  </Button>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}