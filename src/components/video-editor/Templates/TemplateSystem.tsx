import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import {
  Search,
  Filter,
  Grid,
  List,
  Play,
  Download,
  Heart,
  Star,
  Clock,
  Zap,
  Settings,
  Wand2,
  Sparkles,
  TrendingUp,
  Users,
  Eye,
  ThumbsUp,
  Share2,
  Bookmark,
  MoreVertical,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Info
} from 'lucide-react';
import {
  Template,
  TemplateCategory,
  TemplateFilter,
  TemplateSearchResult,
  AutomationWorkflow,
  SmartSuggestion,
  TemplateAnalytics
} from '../../../types/templates';
import { templateEngine } from '../../../services/templateEngine';
import { automationEngine } from '../../../services/automationEngine';

interface TemplateSystemProps {
  onTemplateApply?: (template: Template, options?: any) => void;
  onWorkflowCreate?: (workflow: AutomationWorkflow) => void;
  projectData?: any;
  className?: string;
}

interface TemplateSystemState {
  templates: Template[];
  filteredTemplates: Template[];
  selectedTemplate: Template | null;
  searchQuery: string;
  selectedCategory: TemplateCategory | 'all';
  viewMode: 'grid' | 'list';
  sortBy: 'popular' | 'recent' | 'rating' | 'name';
  filters: TemplateFilter;
  isLoading: boolean;
  smartSuggestions: SmartSuggestion[];
  workflows: AutomationWorkflow[];
  analytics: TemplateAnalytics | null;
  favorites: string[];
  recentlyUsed: string[];
}

export const TemplateSystem: React.FC<TemplateSystemProps> = ({
  onTemplateApply,
  onWorkflowCreate,
  projectData,
  className = ''
}) => {
  const [state, setState] = useState<TemplateSystemState>({
    templates: [],
    filteredTemplates: [],
    selectedTemplate: null,
    searchQuery: '',
    selectedCategory: 'all',
    viewMode: 'grid',
    sortBy: 'popular',
    filters: {
      categories: [],
      tags: [],
      difficulty: [],
      duration: { min: 0, max: 300 },
      aspectRatio: [],
      priceRange: { min: 0, max: 1000 },
      license: [],
      features: []
    },
    isLoading: false,
    smartSuggestions: [],
    workflows: [],
    analytics: null,
    favorites: [],
    recentlyUsed: []
  });

  const [showFilters, setShowFilters] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [applyingTemplate, setApplyingTemplate] = useState<string | null>(null);

  // Carregar dados iniciais
  useEffect(() => {
    loadInitialData();
  }, []);

  // Filtrar templates quando critérios mudarem
  useEffect(() => {
    filterTemplates();
  }, [state.templates, state.searchQuery, state.selectedCategory, state.sortBy, state.filters]);

  // Carregar dados iniciais
  const loadInitialData = async () => {
    setState(prev => ({ ...prev, isLoading: true }));
    
    try {
      // Carregar templates (simulado)
      const templates = await loadTemplates();
      
      // Carregar sugestões inteligentes
      const suggestions = await loadSmartSuggestions();
      
      // Carregar workflows
      const workflows = automationEngine.getWorkflows();
      
      // Carregar analytics
      const analytics = await loadAnalytics();
      
      // Carregar favoritos e recentes do localStorage
      const favorites = JSON.parse(localStorage.getItem('template-favorites') || '[]');
      const recentlyUsed = JSON.parse(localStorage.getItem('template-recent') || '[]');
      
      setState(prev => ({
        ...prev,
        templates,
        smartSuggestions: suggestions,
        workflows,
        analytics,
        favorites,
        recentlyUsed,
        isLoading: false
      }));
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar templates');
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  // Filtrar templates
  const filterTemplates = useCallback(() => {
    let filtered = [...state.templates];
    
    // Filtro por busca
    if (state.searchQuery) {
      const query = state.searchQuery.toLowerCase();
      filtered = filtered.filter(template => 
        template.name.toLowerCase().includes(query) ||
        template.description.toLowerCase().includes(query) ||
        template.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }
    
    // Filtro por categoria
    if (state.selectedCategory !== 'all') {
      filtered = filtered.filter(template => template.category === state.selectedCategory);
    }
    
    // Filtros avançados
    if (state.filters.categories.length > 0) {
      filtered = filtered.filter(template => 
        state.filters.categories.includes(template.category)
      );
    }
    
    if (state.filters.tags.length > 0) {
      filtered = filtered.filter(template => 
        state.filters.tags.some(tag => template.tags.includes(tag))
      );
    }
    
    if (state.filters.difficulty.length > 0) {
      filtered = filtered.filter(template => 
        state.filters.difficulty.includes(template.metadata.difficulty)
      );
    }
    
    // Filtro por duração
    filtered = filtered.filter(template => 
      template.duration >= state.filters.duration.min &&
      template.duration <= state.filters.duration.max
    );
    
    // Filtro por aspect ratio
    if (state.filters.aspectRatio.length > 0) {
      filtered = filtered.filter(template => 
        state.filters.aspectRatio.includes(template.aspectRatio)
      );
    }
    
    // Ordenação
    filtered.sort((a, b) => {
      switch (state.sortBy) {
        case 'popular':
          return b.analytics.downloads - a.analytics.downloads;
        case 'recent':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'rating':
          return b.analytics.rating - a.analytics.rating;
        case 'name':
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });
    
    setState(prev => ({ ...prev, filteredTemplates: filtered }));
  }, [state.templates, state.searchQuery, state.selectedCategory, state.sortBy, state.filters]);

  // Aplicar template
  const handleApplyTemplate = async (template: Template, options: any = {}) => {
    if (!template) return;
    
    setApplyingTemplate(template.id);
    
    try {
      // Aplicar template usando o engine
      const result = await templateEngine.applyTemplate(template, projectData, options);
      
      // Adicionar aos recentes
      const newRecent = [template.id, ...state.recentlyUsed.filter(id => id !== template.id)].slice(0, 10);
      localStorage.setItem('template-recent', JSON.stringify(newRecent));
      setState(prev => ({ ...prev, recentlyUsed: newRecent }));
      
      // Callback para o componente pai
      onTemplateApply?.(template, { ...options, result });
      
      toast.success(`Template "${template.name}" aplicado com sucesso!`);
    } catch (error) {
      console.error('Erro ao aplicar template:', error);
      toast.error('Erro ao aplicar template');
    } finally {
      setApplyingTemplate(null);
    }
  };

  // Alternar favorito
  const toggleFavorite = (templateId: string) => {
    const newFavorites = state.favorites.includes(templateId)
      ? state.favorites.filter(id => id !== templateId)
      : [...state.favorites, templateId];
    
    localStorage.setItem('template-favorites', JSON.stringify(newFavorites));
    setState(prev => ({ ...prev, favorites: newFavorites }));
  };

  // Visualizar template
  const handlePreviewTemplate = (template: Template) => {
    setState(prev => ({ ...prev, selectedTemplate: template }));
    setShowPreview(true);
  };

  // Criar workflow automático
  const createAutoWorkflow = async (template: Template) => {
    try {
      const workflow = {
        id: `auto_${template.id}_${Date.now()}`,
        name: `Auto: ${template.name}`,
        description: `Aplicação automática do template ${template.name}`,
        rules: [{
          id: `rule_${Date.now()}`,
          name: `Aplicar ${template.name}`,
          description: 'Regra de aplicação automática',
          trigger: {
            type: 'contentAdded' as any,
            config: {}
          },
          conditions: [
            {
              type: 'aspectRatio',
              operator: 'equals',
              value: template.aspectRatio
            }
          ],
          actions: [
            {
              type: 'applyTemplate',
              config: { templateId: template.id }
            }
          ],
          enabled: true,
          priority: 1,
          createdAt: new Date(),
          updatedAt: new Date()
        }],
        enabled: true,
        stats: {
          executions: 0,
          successRate: 0,
          averageExecutionTime: 0,
          errors: []
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      automationEngine.registerWorkflow(workflow);
      onWorkflowCreate?.(workflow);
      
      setState(prev => ({
        ...prev,
        workflows: [...prev.workflows, workflow]
      }));
      
      toast.success('Workflow de automação criado!');
    } catch (error) {
      console.error('Erro ao criar workflow:', error);
      toast.error('Erro ao criar workflow de automação');
    }
  };

  // Renderizar card de template
  const renderTemplateCard = (template: Template) => {
    const isFavorite = state.favorites.includes(template.id);
    const isRecent = state.recentlyUsed.includes(template.id);
    const isApplying = applyingTemplate === template.id;
    
    return (
      <Card key={template.id} className="group hover:shadow-lg transition-all duration-200">
        <div className="relative">
          <img
            src={template.thumbnail}
            alt={template.name}
            className="w-full h-32 object-cover rounded-t-lg"
          />
          
          {/* Overlay com ações */}
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-t-lg flex items-center justify-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => handlePreviewTemplate(template)}
            >
              <Eye className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              onClick={() => handleApplyTemplate(template)}
              disabled={isApplying}
            >
              {isApplying ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Play className="w-4 h-4" />
              )}
            </Button>
          </div>
          
          {/* Badges */}
          <div className="absolute top-2 left-2 flex gap-1">
            {template.analytics.featured && (
              <Badge variant="secondary" className="text-xs">
                <Star className="w-3 h-3 mr-1" />
                Destaque
              </Badge>
            )}
            {template.analytics.trending && (
              <Badge variant="destructive" className="text-xs">
                <TrendingUp className="w-3 h-3 mr-1" />
                Trending
              </Badge>
            )}
            {isRecent && (
              <Badge variant="outline" className="text-xs">
                <Clock className="w-3 h-3 mr-1" />
                Recente
              </Badge>
            )}
          </div>
          
          {/* Favorito */}
          <Button
            size="sm"
            variant="ghost"
            className="absolute top-2 right-2 p-1 h-auto"
            onClick={() => toggleFavorite(template.id)}
          >
            <Heart className={`w-4 h-4 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-white'}`} />
          </Button>
        </div>
        
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-semibold text-sm truncate flex-1">{template.name}</h3>
            <Button
              size="sm"
              variant="ghost"
              className="p-1 h-auto ml-2"
              onClick={() => createAutoWorkflow(template)}
            >
              <Zap className="w-4 h-4" />
            </Button>
          </div>
          
          <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
            {template.description}
          </p>
          
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
            <span>{template.duration}s</span>
            <span>{template.aspectRatio}</span>
            <div className="flex items-center gap-1">
              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
              <span>{template.analytics.rating.toFixed(1)}</span>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Download className="w-3 h-3" />
                <span>{template.analytics.downloads}</span>
              </div>
              <div className="flex items-center gap-1">
                <ThumbsUp className="w-3 h-3" />
                <span>{template.analytics.likes}</span>
              </div>
            </div>
            
            <Badge variant="outline" className="text-xs">
              {template.pricing.type === 'free' ? 'Grátis' : `$${template.pricing.price}`}
            </Badge>
          </div>
          
          <div className="flex flex-wrap gap-1 mt-2">
            {template.tags.slice(0, 3).map(tag => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

  // Renderizar item de lista
  const renderTemplateListItem = (template: Template) => {
    const isFavorite = state.favorites.includes(template.id);
    const isApplying = applyingTemplate === template.id;
    
    return (
      <Card key={template.id} className="mb-2">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <img
              src={template.thumbnail}
              alt={template.name}
              className="w-16 h-16 object-cover rounded"
            />
            
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold">{template.name}</h3>
                {template.analytics.featured && (
                  <Badge variant="secondary" className="text-xs">
                    <Star className="w-3 h-3 mr-1" />
                    Destaque
                  </Badge>
                )}
              </div>
              
              <p className="text-sm text-muted-foreground mb-2">
                {template.description}
              </p>
              
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span>{template.duration}s</span>
                <span>{template.aspectRatio}</span>
                <div className="flex items-center gap-1">
                  <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                  <span>{template.analytics.rating.toFixed(1)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Download className="w-3 h-3" />
                  <span>{template.analytics.downloads}</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => toggleFavorite(template.id)}
              >
                <Heart className={`w-4 h-4 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
              </Button>
              
              <Button
                size="sm"
                variant="outline"
                onClick={() => handlePreviewTemplate(template)}
              >
                <Eye className="w-4 h-4 mr-2" />
                Visualizar
              </Button>
              
              <Button
                size="sm"
                onClick={() => handleApplyTemplate(template)}
                disabled={isApplying}
              >
                {isApplying ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Play className="w-4 h-4 mr-2" />
                )}
                Aplicar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className={`template-system ${className}`}>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold">Sistema de Templates</h2>
            <p className="text-muted-foreground">
              Explore, aplique e automatize templates para seus vídeos
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="w-4 h-4 mr-2" />
              Filtros
            </Button>
            
            <Select value={state.viewMode} onValueChange={(value: 'grid' | 'list') => 
              setState(prev => ({ ...prev, viewMode: value }))
            }>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="grid">
                  <div className="flex items-center gap-2">
                    <Grid className="w-4 h-4" />
                    Grade
                  </div>
                </SelectItem>
                <SelectItem value="list">
                  <div className="flex items-center gap-2">
                    <List className="w-4 h-4" />
                    Lista
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {/* Barra de busca e filtros rápidos */}
        <div className="flex items-center gap-4 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar templates..."
              value={state.searchQuery}
              onChange={(e) => setState(prev => ({ ...prev, searchQuery: e.target.value }))}
              className="pl-10"
            />
          </div>
          
          <Select value={state.selectedCategory} onValueChange={(value: any) => 
            setState(prev => ({ ...prev, selectedCategory: value }))
          }>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as categorias</SelectItem>
              <SelectItem value="business">Negócios</SelectItem>
              <SelectItem value="social">Redes Sociais</SelectItem>
              <SelectItem value="education">Educação</SelectItem>
              <SelectItem value="entertainment">Entretenimento</SelectItem>
              <SelectItem value="marketing">Marketing</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={state.sortBy} onValueChange={(value: any) => 
            setState(prev => ({ ...prev, sortBy: value }))
          }>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="popular">Mais populares</SelectItem>
              <SelectItem value="recent">Mais recentes</SelectItem>
              <SelectItem value="rating">Melhor avaliados</SelectItem>
              <SelectItem value="name">Nome A-Z</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <Tabs defaultValue="templates" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="suggestions">Sugestões IA</TabsTrigger>
          <TabsTrigger value="workflows">Automações</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>
        
        <TabsContent value="templates" className="mt-6">
          {state.isLoading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-8 h-8 animate-spin" />
            </div>
          ) : (
            <div className={state.viewMode === 'grid' 
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
              : 'space-y-2'
            }>
              {state.filteredTemplates.map(template => 
                state.viewMode === 'grid' 
                  ? renderTemplateCard(template)
                  : renderTemplateListItem(template)
              )}
            </div>
          )}
          
          {state.filteredTemplates.length === 0 && !state.isLoading && (
            <div className="text-center py-12">
              <Search className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum template encontrado</h3>
              <p className="text-muted-foreground">
                Tente ajustar os filtros ou termos de busca
              </p>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="suggestions" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {state.smartSuggestions.map(suggestion => (
              <Card key={suggestion.id}>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-blue-500" />
                    <CardTitle className="text-lg">{suggestion.title}</CardTitle>
                    <Badge variant="secondary">{suggestion.confidence}% confiança</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    {suggestion.description}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-muted-foreground">
                      Baseado em: {suggestion.reasoning}
                    </div>
                    
                    <Button size="sm" onClick={() => {
                      // Implementar aplicação da sugestão
                      toast.success('Sugestão aplicada!');
                    }}>
                      <Wand2 className="w-4 h-4 mr-2" />
                      Aplicar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="workflows" className="mt-6">
          <div className="space-y-4">
            {state.workflows.map(workflow => (
              <Card key={workflow.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{workflow.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {workflow.description}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={workflow.enabled}
                        onCheckedChange={(enabled) => {
                          if (enabled) {
                            automationEngine.enableWorkflow(workflow.id);
                          } else {
                            automationEngine.disableWorkflow(workflow.id);
                          }
                          
                          setState(prev => ({
                            ...prev,
                            workflows: prev.workflows.map(w => 
                              w.id === workflow.id ? { ...w, enabled } : w
                            )
                          }));
                        }}
                      />
                      
                      <Button size="sm" variant="outline">
                        <Settings className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="grid grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground">Execuções</div>
                      <div className="font-semibold">{workflow.stats.executions}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Taxa de Sucesso</div>
                      <div className="font-semibold">
                        {(workflow.stats.successRate * 100).toFixed(1)}%
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Regras</div>
                      <div className="font-semibold">{workflow.rules.length}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Status</div>
                      <div className="flex items-center gap-1">
                        {workflow.enabled ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-gray-400" />
                        )}
                        <span className="font-semibold">
                          {workflow.enabled ? 'Ativo' : 'Inativo'}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="analytics" className="mt-6">
          {state.analytics && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Download className="w-5 h-5 text-blue-500" />
                    <span className="text-sm font-medium">Total de Downloads</span>
                  </div>
                  <div className="text-2xl font-bold">{state.analytics.totalDownloads}</div>
                  <div className="text-xs text-muted-foreground">
                    +{state.analytics.monthlyGrowth}% este mês
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-5 h-5 text-green-500" />
                    <span className="text-sm font-medium">Usuários Ativos</span>
                  </div>
                  <div className="text-2xl font-bold">{state.analytics.activeUsers}</div>
                  <div className="text-xs text-muted-foreground">
                    Últimos 30 dias
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Star className="w-5 h-5 text-yellow-500" />
                    <span className="text-sm font-medium">Avaliação Média</span>
                  </div>
                  <div className="text-2xl font-bold">{state.analytics.averageRating.toFixed(1)}</div>
                  <div className="text-xs text-muted-foreground">
                    Baseado em {state.analytics.totalReviews} avaliações
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-5 h-5 text-purple-500" />
                    <span className="text-sm font-medium">Templates Populares</span>
                  </div>
                  <div className="text-2xl font-bold">{state.analytics.popularTemplates}</div>
                  <div className="text-xs text-muted-foreground">
                    Top 10 mais usados
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
      
      {/* Dialog de Preview */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              {state.selectedTemplate?.name}
            </DialogTitle>
          </DialogHeader>
          
          {state.selectedTemplate && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <video
                  src={state.selectedTemplate.preview}
                  poster={state.selectedTemplate.thumbnail}
                  controls
                  className="w-full rounded-lg"
                />
              </div>
              
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Descrição</h3>
                  <p className="text-sm text-muted-foreground">
                    {state.selectedTemplate.description}
                  </p>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-2">Detalhes</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>Duração: {state.selectedTemplate.duration}s</div>
                    <div>Proporção: {state.selectedTemplate.aspectRatio}</div>
                    <div>Resolução: {state.selectedTemplate.resolution.width}x{state.selectedTemplate.resolution.height}</div>
                    <div>Categoria: {state.selectedTemplate.category}</div>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-2">Tags</h3>
                  <div className="flex flex-wrap gap-1">
                    {state.selectedTemplate.tags.map(tag => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={() => {
                      handleApplyTemplate(state.selectedTemplate!);
                      setShowPreview(false);
                    }}
                    disabled={applyingTemplate === state.selectedTemplate.id}
                  >
                    {applyingTemplate === state.selectedTemplate.id ? (
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Play className="w-4 h-4 mr-2" />
                    )}
                    Aplicar Template
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={() => createAutoWorkflow(state.selectedTemplate!)}
                  >
                    <Zap className="w-4 h-4 mr-2" />
                    Criar Automação
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Funções auxiliares para carregar dados (simuladas)
async function loadTemplates(): Promise<Template[]> {
  // Simulação de templates
  return [
    {
      id: 'template-1',
      name: 'Apresentação Corporativa',
      description: 'Template profissional para apresentações de negócios',
      category: 'business',
      tags: ['corporativo', 'apresentação', 'profissional'],
      thumbnail: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=corporate%20presentation%20template%20professional%20business&image_size=landscape_4_3',
      preview: '/previews/corporate.mp4',
      elements: [],
      duration: 60,
      aspectRatio: '16:9',
      resolution: { width: 1920, height: 1080 },
      metadata: {
        difficulty: 'beginner',
        estimatedTime: 300,
        requiredAssets: [],
        compatibleFormats: ['mp4'],
        features: ['text', 'transitions'],
        industry: ['business'],
        mood: ['professional'],
        colorScheme: ['#1e40af', '#ffffff']
      },
      version: '1.0.0',
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-01-15'),
      author: {
        id: 'author-1',
        name: 'Studio Templates',
        verified: true,
        rating: 4.8,
        totalTemplates: 25
      },
      license: {
        type: 'free',
        usage: ['commercial'],
        restrictions: [],
        attribution: false
      },
      pricing: {
        type: 'free'
      },
      analytics: {
        downloads: 1250,
        views: 3400,
        likes: 89,
        rating: 4.7,
        reviews: 23,
        trending: true,
        featured: true
      }
    },
    {
      id: 'template-2',
      name: 'Redes Sociais Moderno',
      description: 'Template dinâmico para posts em redes sociais',
      category: 'social',
      tags: ['social', 'moderno', 'dinâmico'],
      thumbnail: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=modern%20social%20media%20template%20colorful%20dynamic&image_size=square',
      preview: '/previews/social.mp4',
      elements: [],
      duration: 15,
      aspectRatio: '1:1',
      resolution: { width: 1080, height: 1080 },
      metadata: {
        difficulty: 'beginner',
        estimatedTime: 180,
        requiredAssets: [],
        compatibleFormats: ['mp4'],
        features: ['animations', 'effects'],
        industry: ['marketing'],
        mood: ['energetic'],
        colorScheme: ['#ff6b6b', '#4ecdc4']
      },
      version: '1.2.0',
      createdAt: new Date('2024-01-20'),
      updatedAt: new Date('2024-01-22'),
      author: {
        id: 'author-2',
        name: 'Creative Hub',
        verified: true,
        rating: 4.9,
        totalTemplates: 42
      },
      license: {
        type: 'premium',
        usage: ['commercial'],
        restrictions: [],
        attribution: false
      },
      pricing: {
        type: 'paid',
        price: 9.99,
        currency: 'USD'
      },
      analytics: {
        downloads: 890,
        views: 2100,
        likes: 156,
        rating: 4.9,
        reviews: 34,
        trending: false,
        featured: false
      }
    }
  ];
}

async function loadSmartSuggestions(): Promise<SmartSuggestion[]> {
  return [
    {
      id: 'suggestion-1',
      type: 'template',
      title: 'Template Corporativo Recomendado',
      description: 'Baseado no seu conteúdo, recomendamos este template profissional',
      confidence: 85,
      reasoning: 'Análise de conteúdo e histórico de uso',
      templateId: 'template-1',
      createdAt: new Date()
    }
  ];
}

async function loadAnalytics(): Promise<TemplateAnalytics> {
  return {
    totalDownloads: 15420,
    activeUsers: 1250,
    averageRating: 4.6,
    totalReviews: 892,
    popularTemplates: 8,
    monthlyGrowth: 12.5
  };
}

export default TemplateSystem;