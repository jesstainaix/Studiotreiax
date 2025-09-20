import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { ScrollArea } from '../ui/scroll-area';
import { Separator } from '../ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { toast } from 'sonner';
import {
  Search,
  Command,
  Home,
  Video,
  FileText,
  Users,
  Settings,
  BarChart3,
  Zap,
  Star,
  Clock,
  ArrowRight,
  ChevronRight,
  Bookmark,
  History,
  TrendingUp,
  Filter,
  X,
  Plus,
  Globe,
  Palette,
  Code,
  Database,
  Cloud,
  Shield,
  Cpu,
  Monitor,
  Smartphone,
  Headphones,
  Camera,
  Edit3,
  Play,
  Download,
  Upload,
  Share2,
  Heart,
  MessageCircle,
  Bell,
  User,
  LogOut,
  HelpCircle,
  ExternalLink,
  Layers,
  Grid3X3,
  List,
  Calendar,
  Mail,
  Phone,
  MapPin,
  Target,
  Award,
  Briefcase,
  BookOpen,
  Lightbulb,
  Rocket,
  Sparkles
} from 'lucide-react';

// Interfaces para navegação inteligente
interface NavigationItem {
  id: string;
  title: string;
  description?: string;
  path: string;
  icon: React.ComponentType<any>;
  category: string;
  keywords: string[];
  isNew?: boolean;
  isFavorite?: boolean;
  lastAccessed?: number;
  accessCount: number;
  estimatedTime?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  status?: 'available' | 'coming-soon' | 'beta' | 'deprecated';
  permissions?: string[];
  relatedItems?: string[];
}

interface SearchSuggestion {
  id: string;
  text: string;
  type: 'page' | 'action' | 'content' | 'user' | 'recent';
  icon: React.ComponentType<any>;
  path?: string;
  action?: () => void;
  metadata?: any;
}

interface NavigationContext {
  currentPath: string;
  userRole: string;
  recentItems: string[];
  favorites: string[];
  searchHistory: string[];
  preferences: {
    showDescriptions: boolean;
    groupByCategory: boolean;
    showKeyboardShortcuts: boolean;
    theme: 'light' | 'dark' | 'auto';
  };
}

const SmartNavigation: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Estados principais
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [navigationContext, setNavigationContext] = useState<NavigationContext>({
    currentPath: location.pathname,
    userRole: 'admin',
    recentItems: [],
    favorites: [],
    searchHistory: [],
    preferences: {
      showDescriptions: true,
      groupByCategory: true,
      showKeyboardShortcuts: true,
      theme: 'light'
    }
  });
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [selectedSuggestion, setSelectedSuggestion] = useState(0);

  // Itens de navegação disponíveis
  const navigationItems: NavigationItem[] = useMemo(() => [
    {
      id: 'dashboard',
      title: 'Dashboard',
      description: 'Visão geral e métricas do sistema',
      path: '/dashboard',
      icon: Home,
      category: 'Principal',
      keywords: ['dashboard', 'início', 'home', 'visão geral', 'métricas'],
      accessCount: 45,
      estimatedTime: '2 min',
      difficulty: 'beginner',
      status: 'available'
    },
    {
      id: 'video-editor',
      title: 'Editor de Vídeo',
      description: 'Editor avançado com timeline profissional',
      path: '/editor',
      icon: Video,
      category: 'Criação',
      keywords: ['editor', 'vídeo', 'timeline', 'edição', 'montagem'],
      accessCount: 32,
      estimatedTime: '15 min',
      difficulty: 'intermediate',
      status: 'available',
      isNew: true
    },
    {
      id: 'pptx-converter',
      title: 'Conversor PPTX',
      description: 'Converta apresentações em vídeos automaticamente',
      path: '/converter',
      icon: FileText,
      category: 'Conversão',
      keywords: ['pptx', 'powerpoint', 'converter', 'apresentação', 'slides'],
      accessCount: 28,
      estimatedTime: '5 min',
      difficulty: 'beginner',
      status: 'available'
    },
    {
      id: 'avatars-3d',
      title: 'Avatares 3D',
      description: 'Biblioteca de avatares hiper-realistas',
      path: '/avatars',
      icon: Users,
      category: 'Recursos',
      keywords: ['avatar', '3d', 'personagem', 'realista', 'animação'],
      accessCount: 19,
      estimatedTime: '8 min',
      difficulty: 'intermediate',
      status: 'beta',
      isNew: true
    },
    {
      id: 'tts-premium',
      title: 'TTS Premium',
      description: 'Síntese de voz com múltiplos provedores',
      path: '/tts',
      icon: Headphones,
      category: 'Áudio',
      keywords: ['tts', 'voz', 'síntese', 'áudio', 'narração'],
      accessCount: 15,
      estimatedTime: '3 min',
      difficulty: 'beginner',
      status: 'available'
    },
    {
      id: 'vfx-system',
      title: 'Sistema VFX',
      description: 'Efeitos visuais e transições avançadas',
      path: '/vfx',
      icon: Sparkles,
      category: 'Efeitos',
      keywords: ['vfx', 'efeitos', 'transições', 'visual', 'animação'],
      accessCount: 12,
      estimatedTime: '12 min',
      difficulty: 'advanced',
      status: 'coming-soon'
    },
    {
      id: 'cloud-render',
      title: 'Renderização Cloud',
      description: 'Processamento distribuído na nuvem',
      path: '/render',
      icon: Cloud,
      category: 'Processamento',
      keywords: ['render', 'nuvem', 'cloud', 'processamento', 'distribuído'],
      accessCount: 8,
      estimatedTime: '20 min',
      difficulty: 'advanced',
      status: 'beta'
    },
    {
      id: 'templates-nr',
      title: 'Templates NR',
      description: 'Templates para Normas Regulamentadoras',
      path: '/templates',
      icon: Shield,
      category: 'Templates',
      keywords: ['template', 'norma', 'regulamentadora', 'nr', 'segurança'],
      accessCount: 22,
      estimatedTime: '6 min',
      difficulty: 'beginner',
      status: 'available'
    },
    {
      id: 'analytics',
      title: 'Analytics',
      description: 'Análise detalhada de performance e uso',
      path: '/analytics',
      icon: BarChart3,
      category: 'Análise',
      keywords: ['analytics', 'análise', 'relatório', 'performance', 'dados'],
      accessCount: 18,
      estimatedTime: '10 min',
      difficulty: 'intermediate',
      status: 'available'
    },
    {
      id: 'settings',
      title: 'Configurações',
      description: 'Configurações do sistema e preferências',
      path: '/settings',
      icon: Settings,
      category: 'Sistema',
      keywords: ['configurações', 'settings', 'preferências', 'sistema'],
      accessCount: 25,
      estimatedTime: '4 min',
      difficulty: 'beginner',
      status: 'available'
    }
  ], []);

  // Gerar sugestões baseadas na busca
  const generateSuggestions = useCallback((query: string): SearchSuggestion[] => {
    if (!query.trim()) {
      // Sugestões padrão quando não há busca
      const recentSuggestions: SearchSuggestion[] = navigationContext.recentItems
        .slice(0, 3)
        .map(itemId => {
          const item = navigationItems.find(nav => nav.id === itemId);
          return item ? {
            id: `recent-${item.id}`,
            text: item.title,
            type: 'recent' as const,
            icon: item.icon,
            path: item.path
          } : null;
        })
        .filter(Boolean) as SearchSuggestion[];

      const popularSuggestions: SearchSuggestion[] = navigationItems
        .sort((a, b) => b.accessCount - a.accessCount)
        .slice(0, 5)
        .map(item => ({
          id: `popular-${item.id}`,
          text: item.title,
          type: 'page' as const,
          icon: item.icon,
          path: item.path
        }));

      return [...recentSuggestions, ...popularSuggestions];
    }

    const queryLower = query.toLowerCase();
    const matchedItems: SearchSuggestion[] = [];

    // Buscar em itens de navegação
    navigationItems.forEach(item => {
      const titleMatch = item.title.toLowerCase().includes(queryLower);
      const keywordMatch = item.keywords.some(keyword => 
        keyword.toLowerCase().includes(queryLower)
      );
      const descriptionMatch = item.description?.toLowerCase().includes(queryLower);

      if (titleMatch || keywordMatch || descriptionMatch) {
        matchedItems.push({
          id: `nav-${item.id}`,
          text: item.title,
          type: 'page',
          icon: item.icon,
          path: item.path,
          metadata: {
            description: item.description,
            category: item.category,
            difficulty: item.difficulty,
            status: item.status
          }
        });
      }
    });

    // Adicionar ações rápidas
    const quickActions: SearchSuggestion[] = [];
    
    if (queryLower.includes('criar') || queryLower.includes('novo')) {
      quickActions.push({
        id: 'action-new-project',
        text: 'Criar Novo Projeto',
        type: 'action',
        icon: Plus,
        action: () => {
          navigate('/editor?new=true');
          toast.success('Criando novo projeto...');
        }
      });
    }

    if (queryLower.includes('upload') || queryLower.includes('enviar')) {
      quickActions.push({
        id: 'action-upload',
        text: 'Fazer Upload de Arquivo',
        type: 'action',
        icon: Upload,
        action: () => {
          // Trigger file upload
          const input = document.createElement('input');
          input.type = 'file';
          input.click();
        }
      });
    }

    if (queryLower.includes('ajuda') || queryLower.includes('help')) {
      quickActions.push({
        id: 'action-help',
        text: 'Central de Ajuda',
        type: 'action',
        icon: HelpCircle,
        action: () => {
          window.open('/help', '_blank');
        }
      });
    }

    return [...matchedItems, ...quickActions].slice(0, 8);
  }, [navigationItems, navigationContext.recentItems, navigate]);

  // Atualizar sugestões quando a busca muda
  useEffect(() => {
    const newSuggestions = generateSuggestions(searchQuery);
    setSuggestions(newSuggestions);
    setSelectedSuggestion(0);
  }, [searchQuery, generateSuggestions]);

  // Atualizar contexto quando a rota muda
  useEffect(() => {
    setNavigationContext(prev => ({
      ...prev,
      currentPath: location.pathname
    }));
  }, [location.pathname]);

  // Atalhos de teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + K para abrir command palette
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setShowCommandPalette(true);
      }

      // ESC para fechar command palette
      if (e.key === 'Escape') {
        setShowCommandPalette(false);
        setIsSearchFocused(false);
      }

      // Navegação nas sugestões
      if (isSearchFocused || showCommandPalette) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setSelectedSuggestion(prev => 
            prev < suggestions.length - 1 ? prev + 1 : 0
          );
        }
        
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          setSelectedSuggestion(prev => 
            prev > 0 ? prev - 1 : suggestions.length - 1
          );
        }

        if (e.key === 'Enter') {
          e.preventDefault();
          handleSuggestionSelect(suggestions[selectedSuggestion]);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isSearchFocused, showCommandPalette, suggestions, selectedSuggestion]);

  // Manipular seleção de sugestão
  const handleSuggestionSelect = useCallback((suggestion: SearchSuggestion) => {
    if (suggestion.action) {
      suggestion.action();
    } else if (suggestion.path) {
      navigate(suggestion.path);
      
      // Atualizar histórico de acesso
      const itemId = suggestion.id.replace(/^(nav|recent|popular)-/, '');
      setNavigationContext(prev => ({
        ...prev,
        recentItems: [itemId, ...prev.recentItems.filter(id => id !== itemId)].slice(0, 10)
      }));
    }

    // Adicionar ao histórico de busca
    if (searchQuery.trim()) {
      setNavigationContext(prev => ({
        ...prev,
        searchHistory: [searchQuery, ...prev.searchHistory.filter(q => q !== searchQuery)].slice(0, 10)
      }));
    }

    setSearchQuery('');
    setIsSearchFocused(false);
    setShowCommandPalette(false);
  }, [navigate, searchQuery]);

  // Alternar favorito
  const toggleFavorite = useCallback((itemId: string) => {
    setNavigationContext(prev => ({
      ...prev,
      favorites: prev.favorites.includes(itemId)
        ? prev.favorites.filter(id => id !== itemId)
        : [...prev.favorites, itemId]
    }));
  }, []);

  // Obter itens por categoria
  const itemsByCategory = useMemo(() => {
    const categories: Record<string, NavigationItem[]> = {};
    
    navigationItems.forEach(item => {
      if (!categories[item.category]) {
        categories[item.category] = [];
      }
      categories[item.category].push(item);
    });

    return categories;
  }, [navigationItems]);

  // Renderizar ícone de status
  const renderStatusIcon = (status: NavigationItem['status']) => {
    switch (status) {
      case 'beta':
        return <Badge variant="secondary" className="text-xs">Beta</Badge>;
      case 'coming-soon':
        return <Badge variant="outline" className="text-xs">Em Breve</Badge>;
      case 'deprecated':
        return <Badge variant="destructive" className="text-xs">Descontinuado</Badge>;
      default:
        return null;
    }
  };

  // Renderizar indicador de dificuldade
  const renderDifficultyIndicator = (difficulty: NavigationItem['difficulty']) => {
    const colors = {
      beginner: 'text-green-500',
      intermediate: 'text-yellow-500',
      advanced: 'text-red-500'
    };

    return (
      <div className={`flex items-center space-x-1 ${colors[difficulty || 'beginner']}`}>
        {Array.from({ length: 3 }, (_, i) => (
          <div
            key={i}
            className={`w-1 h-3 rounded ${
              (difficulty === 'beginner' && i === 0) ||
              (difficulty === 'intermediate' && i <= 1) ||
              (difficulty === 'advanced' && i <= 2)
                ? 'bg-current'
                : 'bg-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Barra de busca principal */}
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar páginas, ações ou conteúdo... (Ctrl+K)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
            className="pl-10 pr-4 py-3 text-lg"
          />
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <Badge variant="outline" className="text-xs">
              Ctrl+K
            </Badge>
          </div>
        </div>

        {/* Dropdown de sugestões */}
        {(isSearchFocused || searchQuery) && suggestions.length > 0 && (
          <Card className="absolute top-full left-0 right-0 mt-2 z-50 shadow-lg">
            <CardContent className="p-0">
              <ScrollArea className="max-h-96">
                {suggestions.map((suggestion, index) => {
                  const Icon = suggestion.icon;
                  return (
                    <div
                      key={suggestion.id}
                      className={`flex items-center space-x-3 p-3 cursor-pointer transition-colors ${
                        index === selectedSuggestion ? 'bg-blue-50' : 'hover:bg-gray-50'
                      }`}
                      onClick={() => handleSuggestionSelect(suggestion)}
                    >
                      <Icon className="h-4 w-4 text-gray-500" />
                      <div className="flex-1">
                        <div className="font-medium">{suggestion.text}</div>
                        {suggestion.metadata?.description && (
                          <div className="text-sm text-gray-500">
                            {suggestion.metadata.description}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {suggestion.metadata?.status && renderStatusIcon(suggestion.metadata.status)}
                        {suggestion.type === 'recent' && (
                          <Badge variant="outline" className="text-xs">
                            <Clock className="h-3 w-3 mr-1" />
                            Recente
                          </Badge>
                        )}
                        {suggestion.type === 'action' && (
                          <Badge variant="outline" className="text-xs">
                            <Zap className="h-3 w-3 mr-1" />
                            Ação
                          </Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
              </ScrollArea>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Navegação por categorias */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {Object.entries(itemsByCategory).map(([category, items]) => (
          <Card key={category}>
            <CardHeader>
              <CardTitle className="text-lg">{category}</CardTitle>
              <CardDescription>
                {items.length} {items.length === 1 ? 'item' : 'itens'} disponível{items.length === 1 ? '' : 's'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {items.map(item => {
                  const Icon = item.icon;
                  const isFavorite = navigationContext.favorites.includes(item.id);
                  const isRecent = navigationContext.recentItems.includes(item.id);
                  
                  return (
                    <div
                      key={item.id}
                      className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer group transition-colors"
                      onClick={() => {
                        if (item.status === 'available' || item.status === 'beta') {
                          navigate(item.path);
                        } else {
                          toast.info(`${item.title} estará disponível em breve`);
                        }
                      }}
                    >
                      <div className="relative">
                        <Icon className="h-5 w-5 text-gray-600" />
                        {item.isNew && (
                          <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full" />
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium truncate">{item.title}</span>
                          {renderStatusIcon(item.status)}
                          {isRecent && (
                            <Badge variant="outline" className="text-xs">
                              <Clock className="h-3 w-3" />
                            </Badge>
                          )}
                        </div>
                        
                        {navigationContext.preferences.showDescriptions && item.description && (
                          <div className="text-sm text-gray-500 truncate">
                            {item.description}
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between mt-1">
                          <div className="flex items-center space-x-2">
                            {renderDifficultyIndicator(item.difficulty)}
                            {item.estimatedTime && (
                              <span className="text-xs text-gray-400">
                                ~{item.estimatedTime}
                              </span>
                            )}
                          </div>
                          
                          <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleFavorite(item.id);
                              }}
                            >
                              <Star className={`h-3 w-3 ${
                                isFavorite ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400'
                              }`} />
                            </Button>
                            
                            <Button size="sm" variant="ghost">
                              <ArrowRight className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Seção de favoritos */}
      {navigationContext.favorites.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Star className="h-5 w-5 text-yellow-500" />
              <span>Favoritos</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {navigationContext.favorites.map(favoriteId => {
                const item = navigationItems.find(nav => nav.id === favoriteId);
                if (!item) return null;
                
                const Icon = item.icon;
                
                return (
                  <Button
                    key={item.id}
                    variant="outline"
                    className="h-auto p-3 justify-start"
                    onClick={() => navigate(item.path)}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    <span className="truncate">{item.title}</span>
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Command Palette */}
      {showCommandPalette && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center pt-20 z-50">
          <Card className="w-full max-w-2xl mx-4">
            <CardHeader className="pb-2">
              <div className="flex items-center space-x-2">
                <Command className="h-4 w-4" />
                <span className="font-medium">Command Palette</span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowCommandPalette(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Input
                  placeholder="Digite um comando ou busque por páginas..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                />
                
                <ScrollArea className="max-h-96">
                  <div className="space-y-1">
                    {suggestions.map((suggestion, index) => {
                      const Icon = suggestion.icon;
                      return (
                        <div
                          key={suggestion.id}
                          className={`flex items-center space-x-3 p-2 rounded cursor-pointer ${
                            index === selectedSuggestion ? 'bg-blue-100' : 'hover:bg-gray-50'
                          }`}
                          onClick={() => handleSuggestionSelect(suggestion)}
                        >
                          <Icon className="h-4 w-4" />
                          <span className="flex-1">{suggestion.text}</span>
                          {suggestion.type === 'action' && (
                            <Badge variant="outline" className="text-xs">Ação</Badge>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default SmartNavigation;