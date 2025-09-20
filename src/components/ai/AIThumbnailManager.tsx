import React, { useState, useEffect, useMemo } from 'react';
import { 
  Image, 
  Zap, 
  Settings, 
  BarChart3, 
  Users, 
  Activity, 
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  Download,
  Upload,
  Trash2,
  Edit,
  Eye,
  Play,
  Pause,
  RotateCcw,
  Filter,
  Search,
  Plus,
  Palette,
  Layers,
  Target,
  Sparkles,
  Brain,
  TestTube,
  Share,
  Save,
  RefreshCw
} from 'lucide-react';
import { useAIThumbnail, useThumbnailStats, useThumbnailConfig, useThumbnailProviders } from '../../hooks/useAIThumbnail';
import { Alert, AlertDescription } from '../ui/alert';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Switch } from '../ui/switch';
import { Textarea } from '../ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { toast } from 'sonner';

const AIThumbnailManager: React.FC = () => {
  // Hooks
  const {
    thumbnails,
    templates,
    analyses,
    providers,
    events,
    isInitialized,
    isLoading,
    error,
    actions,
    quick,
    advanced,
    system,
    analytics,
    computed
  } = useAIThumbnail();
  
  const stats = useThumbnailStats();
  const { config, updateConfig } = useThumbnailConfig();
  const { activeProviders } = useThumbnailProviders();
  
  // Local state
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [sortBy, setSortBy] = useState('created');
  const [selectedThumbnail, setSelectedThumbnail] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [testTitle, setTestTitle] = useState('');
  const [testDescription, setTestDescription] = useState('');
  
  // Auto-refresh
  useEffect(() => {
    const interval = setInterval(() => {
      if (isInitialized && !isLoading) {
        actions.refreshStats();
      }
    }, 10000); // 10 seconds
    
    return () => clearInterval(interval);
  }, [isInitialized, isLoading, actions]);
  
  // Demo data generation
  useEffect(() => {
    if (isInitialized && thumbnails.length === 0) {
      const generateDemoData = async () => {
        try {
          // Generate demo thumbnails
          await actions.generateThumbnail({
            templateId: templates[0]?.id || 'template-1',
            title: 'Como Criar Thumbnails Incríveis',
            description: 'Tutorial completo sobre design de thumbnails'
          });
          
          await actions.generateThumbnail({
            templateId: templates[1]?.id || 'template-2',
            title: 'Top 10 Dicas de YouTube',
            description: 'Estratégias para crescer no YouTube'
          });
          
          await actions.generateThumbnail({
            templateId: templates[0]?.id || 'template-1',
            title: 'IA e o Futuro do Design',
            description: 'Como a inteligência artificial está revolucionando'
          });
        } catch (error) {
          console.error('Erro ao gerar dados demo:', error);
        }
      };
      
      generateDemoData();
    }
  }, [isInitialized, thumbnails.length, templates, actions]);
  
  // Filtered and sorted data
  const filteredThumbnails = useMemo(() => {
    let filtered = thumbnails;
    
    if (searchQuery) {
      filtered = filtered.filter(thumbnail => 
        thumbnail.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        thumbnail.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    if (filterCategory !== 'all') {
      filtered = filtered.filter(thumbnail => thumbnail.category === filterCategory);
    }
    
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'score':
          return b.aiAnalysis.contentScore - a.aiAnalysis.contentScore;
        case 'views':
          return b.analytics.views - a.analytics.views;
        case 'ctr':
          return b.analytics.clickThroughRate - a.analytics.clickThroughRate;
        case 'created':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });
  }, [thumbnails, searchQuery, filterCategory, sortBy]);
  
  const filteredTemplates = useMemo(() => {
    return templates.filter(template => 
      searchQuery === '' || 
      template.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [templates, searchQuery]);
  
  // Status cards data
  const statusCards = [
    {
      title: 'Total de Thumbnails',
      value: stats.thumbnailCount.toString(),
      icon: Image,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      change: '+12%'
    },
    {
      title: 'Templates Ativos',
      value: stats.templateCount.toString(),
      icon: Layers,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      change: '+5%'
    },
    {
      title: 'Taxa de Conversão',
      value: `${(stats.overallCTR * 100).toFixed(1)}%`,
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      change: '+8%'
    },
    {
      title: 'Providers Ativos',
      value: activeProviders.length.toString(),
      icon: Zap,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      change: '100%'
    }
  ];
  
  // Tab configuration
  const tabs = [
    { id: 'overview', label: 'Visão Geral', icon: BarChart3 },
    { id: 'thumbnails', label: 'Thumbnails', icon: Image },
    { id: 'templates', label: 'Templates', icon: Layers },
    { id: 'providers', label: 'Providers', icon: Zap },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp },
    { id: 'events', label: 'Eventos', icon: Activity },
    { id: 'settings', label: 'Configurações', icon: Settings }
  ];
  
  // Handle quick actions
  const handleQuickGenerate = async () => {
    if (!testTitle.trim()) {
      toast.error('Digite um título para gerar o thumbnail');
      return;
    }
    
    try {
      await quick.generateQuick(testTitle, testDescription);
      toast.success('Thumbnail gerado com sucesso!');
      setTestTitle('');
      setTestDescription('');
    } catch (error) {
      toast.error('Erro ao gerar thumbnail');
    }
  };
  
  const handleOptimizeAll = async () => {
    try {
      await quick.optimizeAll();
      toast.success('Todos os thumbnails foram otimizados!');
    } catch (error) {
      toast.error('Erro ao otimizar thumbnails');
    }
  };
  
  const handleAnalyzePerformance = async () => {
    try {
      const analysis = await quick.analyzePerformance();
      toast.success('Análise de performance concluída!');
    } catch (error) {
      toast.error('Erro na análise de performance');
    }
  };
  
  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Inicializando sistema de thumbnails...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Geração de Thumbnails com IA</h1>
          <p className="text-gray-600 mt-1">
            Sistema inteligente para criação e otimização de thumbnails
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            onClick={() => actions.refreshStats()}
            variant="outline"
            size="sm"
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Button onClick={handleOptimizeAll} size="sm">
            <Sparkles className="h-4 w-4 mr-2" />
            Otimizar Todos
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
      
      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statusCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{card.title}</p>
                    <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                    <p className="text-xs text-green-600 mt-1">{card.change}</p>
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
        <TabsList className="grid w-full grid-cols-7">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <TabsTrigger key={tab.id} value={tab.id} className="flex items-center space-x-2">
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>
        
        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Zap className="h-5 w-5" />
                  <span>Ações Rápidas</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <Input
                    placeholder="Título do vídeo"
                    value={testTitle}
                    onChange={(e) => setTestTitle(e.target.value)}
                  />
                  <Textarea
                    placeholder="Descrição (opcional)"
                    value={testDescription}
                    onChange={(e) => setTestDescription(e.target.value)}
                    rows={3}
                  />
                  <Button onClick={handleQuickGenerate} className="w-full">
                    <Image className="h-4 w-4 mr-2" />
                    Gerar Thumbnail
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" onClick={handleAnalyzePerformance}>
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Analisar
                  </Button>
                  <Button variant="outline" onClick={() => system.healthCheck()}>
                    <Activity className="h-4 w-4 mr-2" />
                    Status
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="h-5 w-5" />
                  <span>Atividade Recente</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {events.slice(0, 5).map((event, index) => (
                    <div key={index} className="flex items-center space-x-3 p-2 rounded-lg bg-gray-50">
                      <div className={`w-2 h-2 rounded-full ${
                        event.type === 'error' ? 'bg-red-500' :
                        event.type === 'generation' ? 'bg-green-500' :
                        'bg-blue-500'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900 truncate">{event.message}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(event.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Thumbnails Tab */}
        <TabsContent value="thumbnails" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="Buscar thumbnails..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full"
                  />
                </div>
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="Categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="gaming">Gaming</SelectItem>
                    <SelectItem value="education">Educação</SelectItem>
                    <SelectItem value="entertainment">Entretenimento</SelectItem>
                    <SelectItem value="business">Negócios</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="Ordenar por" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="created">Data de Criação</SelectItem>
                    <SelectItem value="score">Pontuação</SelectItem>
                    <SelectItem value="views">Visualizações</SelectItem>
                    <SelectItem value="ctr">Taxa de Cliques</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
          
          {/* Thumbnails Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredThumbnails.map((thumbnail) => (
              <Card key={thumbnail.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="aspect-video bg-gradient-to-br from-blue-500 to-purple-600 relative">
                  <div className="absolute inset-0 flex items-center justify-center text-white font-bold text-lg p-4 text-center">
                    {thumbnail.title}
                  </div>
                  <Badge className="absolute top-2 right-2" variant="secondary">
                    {Math.round(thumbnail.aiAnalysis.contentScore)}
                  </Badge>
                </div>
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <h3 className="font-semibold text-sm truncate">{thumbnail.title}</h3>
                    <p className="text-xs text-gray-600 line-clamp-2">{thumbnail.description}</p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{thumbnail.analytics.views} views</span>
                      <span>{(thumbnail.analytics.clickThroughRate * 100).toFixed(1)}% CTR</span>
                    </div>
                    <div className="flex items-center space-x-2 pt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedThumbnail(thumbnail.id);
                          setShowDetails(true);
                        }}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        Ver
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => actions.optimizeThumbnail(thumbnail.id)}
                      >
                        <Sparkles className="h-3 w-3 mr-1" />
                        Otimizar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => actions.deleteThumbnail(thumbnail.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.map((template) => (
              <Card key={template.id} className="overflow-hidden">
                <div className="aspect-video bg-gradient-to-br from-gray-200 to-gray-300 relative">
                  <div className="absolute inset-0 flex items-center justify-center text-gray-700 font-bold">
                    {template.name}
                  </div>
                  <Badge className="absolute top-2 right-2" variant="outline">
                    {template.category}
                  </Badge>
                </div>
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <h3 className="font-semibold">{template.name}</h3>
                    <p className="text-sm text-gray-600">{template.description}</p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>Estilo: {template.style}</span>
                      <span>{template.category}</span>
                    </div>
                    <div className="flex items-center space-x-2 pt-2">
                      <Button size="sm" variant="outline">
                        <Edit className="h-3 w-3 mr-1" />
                        Editar
                      </Button>
                      <Button size="sm" variant="outline">
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        {/* Providers Tab */}
        <TabsContent value="providers" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {providers.map((provider) => (
              <Card key={provider.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center space-x-2">
                      <Zap className="h-5 w-5" />
                      <span>{provider.name}</span>
                    </CardTitle>
                    <Badge variant={provider.status === 'active' ? 'default' : 'secondary'}>
                      {provider.status}
                    </Badge>
                  </div>
                  <CardDescription>{provider.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span>Requisições:</span>
                      <span>{provider.metrics.totalRequests}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Taxa de Sucesso:</span>
                      <span>
                        {provider.metrics.totalRequests > 0
                          ? Math.round((provider.metrics.successfulRequests / provider.metrics.totalRequests) * 100)
                          : 0}%
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Tempo Médio:</span>
                      <span>{provider.metrics.averageResponseTime}ms</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Uptime:</span>
                      <span>{provider.metrics.uptime}%</span>
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
                <CardTitle>Estatísticas Gerais</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Total de Gerações:</span>
                    <span className="font-semibold">{stats.totalGenerations}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tempo Médio de Geração:</span>
                    <span className="font-semibold">{stats.averageGenerationTime}ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Taxa de Sucesso:</span>
                    <span className="font-semibold">{Math.round(stats.successRate * 100)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>CTR Geral:</span>
                    <span className="font-semibold">{(stats.overallCTR * 100).toFixed(2)}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Top Templates</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.getTemplateStats().slice(0, 5).map((stat, index) => (
                    <div key={index} className="flex items-center justify-between p-2 rounded bg-gray-50">
                      <span className="text-sm font-medium">{stat.template}</span>
                      <div className="text-right">
                        <div className="text-sm font-semibold">{stat.thumbnails} thumbnails</div>
                        <div className="text-xs text-gray-600">{(stat.averageCTR * 100).toFixed(1)}% CTR</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Events Tab */}
        <TabsContent value="events" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Log de Eventos</CardTitle>
              <CardDescription>Histórico de atividades do sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {events.map((event, index) => (
                  <div key={index} className="flex items-start space-x-3 p-3 rounded-lg bg-gray-50">
                    <div className={`w-2 h-2 rounded-full mt-2 ${
                      event.type === 'error' ? 'bg-red-500' :
                      event.type === 'generation' ? 'bg-green-500' :
                      'bg-blue-500'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900">{event.message}</p>
                        <Badge variant="outline" className="text-xs">
                          {event.source}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(event.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Configurações Gerais</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="format">Formato Padrão</Label>
                  <Select value={config.defaultFormat} onValueChange={(value) => updateConfig({ defaultFormat: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="jpg">JPG</SelectItem>
                      <SelectItem value="png">PNG</SelectItem>
                      <SelectItem value="webp">WebP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="quality">Qualidade Padrão: {config.defaultQuality}%</Label>
                  <input
                    type="range"
                    min="1"
                    max="100"
                    value={config.defaultQuality}
                    onChange={(e) => updateConfig({ defaultQuality: parseInt(e.target.value) })}
                    className="w-full"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="auto-optimization">Otimização Automática</Label>
                  <Switch
                    id="auto-optimization"
                    checked={config.autoOptimization}
                    onCheckedChange={(checked) => updateConfig({ autoOptimization: checked })}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="cache">Cache Habilitado</Label>
                  <Switch
                    id="cache"
                    checked={config.cacheEnabled}
                    onCheckedChange={(checked) => updateConfig({ cacheEnabled: checked })}
                  />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Ações do Sistema</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant="outline"
                  onClick={() => system.clearCache()}
                  className="w-full"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Limpar Cache
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => system.backup()}
                  className="w-full"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Criar Backup
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => system.healthCheck()}
                  className="w-full"
                >
                  <Activity className="h-4 w-4 mr-2" />
                  Verificar Sistema
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => actions.exportData()}
                  className="w-full"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Exportar Dados
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
      
      {/* Test Area */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TestTube className="h-5 w-5" />
            <span>Área de Testes</span>
          </CardTitle>
          <CardDescription>
            Teste as funcionalidades do sistema de thumbnails
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              variant="outline"
              onClick={() => quick.generateQuick('Teste de Thumbnail', 'Descrição de teste')}
            >
              <Image className="h-4 w-4 mr-2" />
              Gerar Teste
            </Button>
            <Button
              variant="outline"
              onClick={handleAnalyzePerformance}
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Analisar Performance
            </Button>
            <Button
              variant="outline"
              onClick={() => system.healthCheck()}
            >
              <Activity className="h-4 w-4 mr-2" />
              Health Check
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* Details Modal */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes do Thumbnail</DialogTitle>
            <DialogDescription>
              Informações detalhadas e análise do thumbnail selecionado
            </DialogDescription>
          </DialogHeader>
          {selectedThumbnail && (() => {
            const thumbnail = thumbnails.find(t => t.id === selectedThumbnail);
            if (!thumbnail) return null;
            
            return (
              <div className="space-y-4">
                <div className="aspect-video bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
                  {thumbnail.title}
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2">Informações Básicas</h4>
                    <div className="space-y-1 text-sm">
                      <p><strong>Título:</strong> {thumbnail.title}</p>
                      <p><strong>Categoria:</strong> {thumbnail.category}</p>
                      <p><strong>Template:</strong> {thumbnail.templateId}</p>
                      <p><strong>Criado:</strong> {new Date(thumbnail.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2">Analytics</h4>
                    <div className="space-y-1 text-sm">
                      <p><strong>Visualizações:</strong> {thumbnail.analytics.views}</p>
                      <p><strong>Cliques:</strong> {thumbnail.analytics.clicks}</p>
                      <p><strong>CTR:</strong> {(thumbnail.analytics.clickThroughRate * 100).toFixed(2)}%</p>
                      <p><strong>Tempo Médio:</strong> {thumbnail.analytics.averageViewTime}s</p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Análise de IA</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>Conteúdo: {thumbnail.aiAnalysis.contentScore}/100</div>
                    <div>Apelo Visual: {thumbnail.aiAnalysis.visualAppeal}/100</div>
                    <div>Legibilidade: {thumbnail.aiAnalysis.textReadability}/100</div>
                    <div>Harmonia: {thumbnail.aiAnalysis.colorHarmony}/100</div>
                  </div>
                  
                  {thumbnail.aiAnalysis.suggestions.length > 0 && (
                    <div className="mt-3">
                      <h5 className="font-medium mb-1">Sugestões:</h5>
                      <ul className="text-sm text-gray-600 space-y-1">
                        {thumbnail.aiAnalysis.suggestions.map((suggestion, index) => (
                          <li key={index}>• {suggestion}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AIThumbnailManager;