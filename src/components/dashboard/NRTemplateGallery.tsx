// Gallery de Templates NR com previews de vídeo e layout masonry
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Play,
  Eye,
  Clock,
  Star,
  Filter,
  Search,
  Grid3X3,
  List,
  ChevronDown,
  Tag,
  Download,
  Share2,
  Heart,
  BookOpen,
  Shield,
  TrendingUp,
  Users,
  Award,
  Zap,
  ArrowRight,
  Loader2,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { templates, nrCategories, Template } from '../../data/templates';
import { toast } from 'sonner';

interface NRTemplateGalleryProps {
  onTemplateSelect?: (template: Template) => void;
  onCreateProject?: (templateId: string) => void;
  maxItems?: number;
  showFilters?: boolean;
  layout?: 'masonry' | 'grid' | 'list';
  className?: string;
}

interface FilterState {
  search: string;
  category: string;
  difficulty: string;
  duration: string;
  sortBy: 'popular' | 'recent' | 'duration' | 'title';
  showFreeOnly: boolean;
}

const NRTemplateGallery: React.FC<NRTemplateGalleryProps> = ({
  onTemplateSelect,
  onCreateProject,
  maxItems = 50,
  showFilters = true,
  layout = 'masonry',
  className = ''
}) => {
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    category: 'all',
    difficulty: 'all',
    duration: 'all',
    sortBy: 'popular',
    showFreeOnly: false
  });
  
  const [currentLayout, setCurrentLayout] = useState<'masonry' | 'grid' | 'list'>(layout);
  const [isLoading, setIsLoading] = useState(false);
  const [hoveredTemplate, setHoveredTemplate] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [viewCounts, setViewCounts] = useState<Map<string, number>>(new Map());
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const itemsPerPage = 12;

  // Filtrar e ordenar templates
  const filteredTemplates = useMemo(() => {
    let filtered = templates.filter(template => {
      // Filtro de busca
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch = 
          template.title.toLowerCase().includes(searchLower) ||
          template.description.toLowerCase().includes(searchLower) ||
          template.tags.some(tag => tag.toLowerCase().includes(searchLower)) ||
          template.nr.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      // Filtro de categoria
      if (filters.category !== 'all' && template.nr !== filters.category) {
        return false;
      }

      // Filtro de dificuldade
      if (filters.difficulty !== 'all' && template.difficulty !== filters.difficulty) {
        return false;
      }

      // Filtro de duração
      if (filters.duration !== 'all') {
        const duration = template.duration;
        switch (filters.duration) {
          case 'short':
            if (duration > 15) return false;
            break;
          case 'medium':
            if (duration <= 15 || duration > 45) return false;
            break;
          case 'long':
            if (duration <= 45) return false;
            break;
        }
      }

      // Filtro de templates gratuitos
      if (filters.showFreeOnly && !template.isFree) {
        return false;
      }

      return true;
    });

    // Ordenação
    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case 'popular':
          const aViews = viewCounts.get(a.id) || 0;
          const bViews = viewCounts.get(b.id) || 0;
          if (a.isPopular && !b.isPopular) return -1;
          if (!a.isPopular && b.isPopular) return 1;
          return bViews - aViews;
        case 'recent':
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        case 'duration':
          return a.duration - b.duration;
        case 'title':
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });

    return filtered;
  }, [templates, filters, viewCounts]);

  // Paginação
  const paginatedTemplates = useMemo(() => {
    const startIndex = 0;
    const endIndex = page * itemsPerPage;
    const result = filteredTemplates.slice(startIndex, endIndex);
    setHasMore(endIndex < filteredTemplates.length);
    return result;
  }, [filteredTemplates, page, itemsPerPage]);

  // Carregar mais templates
  const loadMore = useCallback(() => {
    if (hasMore && !isLoading) {
      setPage(prev => prev + 1);
    }
  }, [hasMore, isLoading]);

  // Manipular seleção de template
  const handleTemplateSelect = useCallback((template: Template) => {
    // Incrementar contador de visualizações
    setViewCounts(prev => {
      const newMap = new Map(prev);
      newMap.set(template.id, (newMap.get(template.id) || 0) + 1);
      return newMap;
    });

    onTemplateSelect?.(template);
    toast.success(`Template "${template.title}" selecionado`);
  }, [onTemplateSelect]);

  // Manipular criação de projeto
  const handleCreateProject = useCallback((template: Template, event: React.MouseEvent) => {
    event.stopPropagation();
    onCreateProject?.(template.id);
    toast.success(`Criando projeto com template "${template.title}"`);
  }, [onCreateProject]);

  // Manipular favoritos
  const toggleFavorite = useCallback((templateId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(templateId)) {
        newFavorites.delete(templateId);
        toast.info('Removido dos favoritos');
      } else {
        newFavorites.add(templateId);
        toast.success('Adicionado aos favoritos');
      }
      return newFavorites;
    });
  }, []);

  // Obter categoria por NR
  const getCategoryInfo = useCallback((nr: string) => {
    return nrCategories.find(cat => cat.name === nr) || {
      name: nr,
      title: nr,
      color: 'bg-gray-500',
      icon: '📋'
    };
  }, []);

  // Obter cor da dificuldade
  const getDifficultyColor = useCallback((difficulty: string) => {
    switch (difficulty) {
      case 'Básico': return 'bg-green-100 text-green-800';
      case 'Intermediário': return 'bg-yellow-100 text-yellow-800';
      case 'Avançado': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }, []);

  // Renderizar card de template
  const renderTemplateCard = useCallback((template: Template, index: number) => {
    const categoryInfo = getCategoryInfo(template.nr);
    const isHovered = hoveredTemplate === template.id;
    const isFavorite = favorites.has(template.id);
    const views = viewCounts.get(template.id) || 0;

    const cardClasses = {
      masonry: `break-inside-avoid mb-6 ${index % 3 === 0 ? 'mt-0' : index % 3 === 1 ? 'mt-4' : 'mt-8'}`,
      grid: 'h-full',
      list: 'w-full'
    };

    return (
      <Card
        key={template.id}
        className={`group cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-0 bg-white/80 backdrop-blur-sm ${cardClasses[currentLayout]} ${
          isHovered ? 'ring-2 ring-blue-500 shadow-2xl' : ''
        }`}
        onMouseEnter={() => setHoveredTemplate(template.id)}
        onMouseLeave={() => setHoveredTemplate(null)}
        onClick={() => handleTemplateSelect(template)}
      >
        {/* Thumbnail com overlay */}
        <div className="relative overflow-hidden rounded-t-lg">
          <img
            src={template.thumbnail}
            alt={template.title}
            className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-110"
            loading="lazy"
          />
          
          {/* Overlay com ações */}
          <div className={`absolute inset-0 bg-black/60 flex items-center justify-center transition-opacity duration-300 ${
            isHovered ? 'opacity-100' : 'opacity-0'
          }`}>
            <div className="flex items-center gap-3">
              <Button
                size="sm"
                className="bg-white/20 backdrop-blur-sm text-white border-white/30 hover:bg-white/30"
                onClick={(e) => {
                  e.stopPropagation();
                  // Preview do template
                }}
              >
                <Eye className="w-4 h-4 mr-2" />
                Preview
              </Button>
              <Button
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white"
                onClick={(e) => handleCreateProject(template, e)}
              >
                <Play className="w-4 h-4 mr-2" />
                Usar
              </Button>
            </div>
          </div>

          {/* Badges de status */}
          <div className="absolute top-3 left-3 flex flex-col gap-2">
            {template.isPopular && (
              <Badge className="bg-orange-500 text-white border-0">
                <Star className="w-3 h-3 mr-1" />
                Popular
              </Badge>
            )}
            {template.isFree && (
              <Badge className="bg-green-500 text-white border-0">
                Grátis
              </Badge>
            )}
          </div>

          {/* Botão de favorito */}
          <Button
            size="sm"
            variant="ghost"
            className={`absolute top-3 right-3 w-8 h-8 p-0 rounded-full transition-colors ${
              isFavorite ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-white/20 backdrop-blur-sm text-white hover:bg-white/30'
            }`}
            onClick={(e) => toggleFavorite(template.id, e)}
          >
            <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
          </Button>
        </div>

        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg font-semibold text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors">
                {template.title}
              </CardTitle>
              <div className="flex items-center gap-2 mt-2">
                <Badge className={`${categoryInfo.color} text-white border-0 text-xs`}>
                  {categoryInfo.icon} {template.nr}
                </Badge>
                <Badge className={`${getDifficultyColor(template.difficulty)} border-0 text-xs`}>
                  {template.difficulty}
                </Badge>
              </div>
            </div>
          </div>
          
          <CardDescription className="text-sm text-gray-600 line-clamp-2 mt-2">
            {template.description}
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-0">
          {/* Métricas */}
          <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {template.duration}min
              </span>
              <span className="flex items-center gap-1">
                <BookOpen className="w-4 h-4" />
                {template.slides} slides
              </span>
              {views > 0 && (
                <span className="flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  {views}
                </span>
              )}
            </div>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-1 mb-4">
            {template.tags.slice(0, 3).map((tag, index) => (
              <Badge key={index} variant="outline" className="text-xs px-2 py-1">
                {tag}
              </Badge>
            ))}
            {template.tags.length > 3 && (
              <Badge variant="outline" className="text-xs px-2 py-1">
                +{template.tags.length - 3}
              </Badge>
            )}
          </div>

          {/* Ações */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                className="text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  // Compartilhar template
                }}
              >
                <Share2 className="w-3 h-3 mr-1" />
                Compartilhar
              </Button>
            </div>
            
            <Button
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs"
              onClick={(e) => handleCreateProject(template, e)}
            >
              Criar Projeto
              <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }, [currentLayout, hoveredTemplate, favorites, viewCounts, getCategoryInfo, getDifficultyColor, handleTemplateSelect, handleCreateProject, toggleFavorite]);

  return (
    <div className={`w-full ${className}`}>
      {/* Header com filtros */}
      {showFilters && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Shield className="w-7 h-7 text-blue-600" />
                Templates NR
                <Badge className="bg-blue-100 text-blue-800 border-0">
                  {filteredTemplates.length} templates
                </Badge>
              </h2>
              <p className="text-gray-600 mt-1">
                Biblioteca completa de templates para Normas Regulamentadoras
              </p>
            </div>
            
            {/* Controles de layout */}
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant={currentLayout === 'masonry' ? 'default' : 'outline'}
                onClick={() => setCurrentLayout('masonry')}
              >
                <Grid3X3 className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant={currentLayout === 'grid' ? 'default' : 'outline'}
                onClick={() => setCurrentLayout('grid')}
              >
                <Grid3X3 className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant={currentLayout === 'list' ? 'default' : 'outline'}
                onClick={() => setCurrentLayout('list')}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Filtros */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Busca */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Buscar templates..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="pl-10"
              />
            </div>

            {/* Categoria */}
            <select
              value={filters.category}
              onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todas as NRs</option>
              {nrCategories.map(category => (
                <option key={category.id} value={category.name}>
                  {category.name} - {category.title.substring(0, 30)}...
                </option>
              ))}
            </select>

            {/* Dificuldade */}
            <select
              value={filters.difficulty}
              onChange={(e) => setFilters(prev => ({ ...prev, difficulty: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todas as dificuldades</option>
              <option value="Básico">Básico</option>
              <option value="Intermediário">Intermediário</option>
              <option value="Avançado">Avançado</option>
            </select>

            {/* Duração */}
            <select
              value={filters.duration}
              onChange={(e) => setFilters(prev => ({ ...prev, duration: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todas as durações</option>
              <option value="short">Curto (≤15min)</option>
              <option value="medium">Médio (16-45min)</option>
              <option value="long">Longo (&gt;45min)</option>
            </select>

            {/* Ordenação */}
            <select
              value={filters.sortBy}
              onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value as any }))}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="popular">Mais populares</option>
              <option value="recent">Mais recentes</option>
              <option value="duration">Duração</option>
              <option value="title">Nome</option>
            </select>
          </div>
        </div>
      )}

      {/* Grid de templates */}
      <div className={`
        ${currentLayout === 'masonry' ? 'columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-6' : ''}
        ${currentLayout === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6' : ''}
        ${currentLayout === 'list' ? 'flex flex-col gap-4' : ''}
      `}>
        {paginatedTemplates.map((template, index) => renderTemplateCard(template, index))}
      </div>

      {/* Loading e Load More */}
      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">Carregando templates...</span>
        </div>
      )}

      {hasMore && !isLoading && (
        <div className="flex items-center justify-center py-8">
          <Button
            onClick={loadMore}
            variant="outline"
            className="px-8 py-3"
          >
            Carregar mais templates
            <ChevronDown className="w-4 h-4 ml-2" />
          </Button>
        </div>
      )}

      {/* Estado vazio */}
      {filteredTemplates.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Nenhum template encontrado
          </h3>
          <p className="text-gray-600 mb-4">
            Tente ajustar os filtros ou termos de busca
          </p>
          <Button
            onClick={() => setFilters({
              search: '',
              category: 'all',
              difficulty: 'all',
              duration: 'all',
              sortBy: 'popular',
              showFreeOnly: false
            })}
            variant="outline"
          >
            Limpar filtros
          </Button>
        </div>
      )}
    </div>
  );
};

export default NRTemplateGallery;