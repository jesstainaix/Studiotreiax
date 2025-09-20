import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Star, 
  Download, 
  Eye, 
  Heart, 
  ShoppingCart, 
  Grid3X3, 
  List, 
  SortAsc, 
  SortDesc,
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  Tag,
  Clock,
  User,
  Crown,
  Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useTemplates } from '@/hooks/useTemplates';
import { Template, TemplateCategory } from '@/types/templates';

interface TemplateMarketplaceProps {
  onTemplateSelect?: (template: Template) => void;
  onTemplateApply?: (template: Template) => void;
  onTemplatePurchase?: (template: Template) => void;
  className?: string;
}

interface MarketplaceStats {
  totalTemplates: number;
  freeTemplates: number;
  premiumTemplates: number;
  totalDownloads: number;
  averageRating: number;
}

const TemplateMarketplace: React.FC<TemplateMarketplaceProps> = ({
  onTemplateSelect,
  onTemplateApply,
  onTemplatePurchase,
  className = ''
}) => {
  const {
    templates,
    categories,
    filteredTemplates,
    selectedTemplate,
    isLoading,
    searchQuery,
    searchResults,
    filters,
    searchTemplates,
    selectTemplate,
    updateFilters,
    applyTemplate,
    trackTemplateUsage
  } = useTemplates({ enableAnalytics: true });
  
  // Local state
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100]);
  const [showFreeOnly, setShowFreeOnly] = useState(false);
  const [sortBy, setSortBy] = useState('popularity');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [cart, setCart] = useState<Template[]>([]);
  
  // Mock marketplace stats
  const [stats, setStats] = useState<MarketplaceStats>({
    totalTemplates: templates.length,
    freeTemplates: templates.filter(t => t.metadata.license === 'free').length,
    premiumTemplates: templates.filter(t => t.metadata.license === 'premium').length,
    totalDownloads: 15420,
    averageRating: 4.6
  });
  
  // Update stats when templates change
  useEffect(() => {
    setStats({
      totalTemplates: templates.length,
      freeTemplates: templates.filter(t => t.metadata.license === 'free').length,
      premiumTemplates: templates.filter(t => t.metadata.license === 'premium').length,
      totalDownloads: 15420,
      averageRating: 4.6
    });
  }, [templates]);
  
  // Handle search
  const handleSearch = (query: string) => {
    searchTemplates(query);
  };
  
  // Handle filter changes
  const handleFilterChange = (key: string, value: any) => {
    updateFilters({ [key]: value });
  };
  
  // Handle template selection
  const handleTemplateSelect = (template: Template) => {
    selectTemplate(template);
    onTemplateSelect?.(template);
    trackTemplateUsage(template.id, 'view');
  };
  
  // Handle template application
  const handleTemplateApply = async (template: Template) => {
    try {
      await applyTemplate(template.id);
      onTemplateApply?.(template);
      trackTemplateUsage(template.id, 'apply');
    } catch (error) {
      console.error('Erro ao aplicar template:', error);
    }
  };
  
  // Handle template purchase
  const handleTemplatePurchase = (template: Template) => {
    onTemplatePurchase?.(template);
    trackTemplateUsage(template.id, 'purchase');
  };
  
  // Toggle favorite
  const toggleFavorite = (templateId: string) => {
    setFavorites(prev => 
      prev.includes(templateId)
        ? prev.filter(id => id !== templateId)
        : [...prev, templateId]
    );
  };
  
  // Add to cart
  const addToCart = (template: Template) => {
    if (!cart.find(t => t.id === template.id)) {
      setCart(prev => [...prev, template]);
    }
  };
  
  // Remove from cart
  const removeFromCart = (templateId: string) => {
    setCart(prev => prev.filter(t => t.id !== templateId));
  };
  
  // Get display templates (search results or filtered)
  const displayTemplates = searchQuery ? searchResults.map(r => r.template) : filteredTemplates;
  
  // Filter by category
  const categoryFilteredTemplates = selectedCategory === 'all' 
    ? displayTemplates 
    : displayTemplates.filter(t => t.category === selectedCategory);
  
  // Filter by price
  const priceFilteredTemplates = showFreeOnly 
    ? categoryFilteredTemplates.filter(t => t.metadata.license === 'free')
    : categoryFilteredTemplates;
  
  // Sort templates
  const sortedTemplates = [...priceFilteredTemplates].sort((a, b) => {
    const order = sortOrder === 'asc' ? 1 : -1;
    
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name) * order;
      case 'date':
        return (a.createdAt.getTime() - b.createdAt.getTime()) * order;
      case 'price':
        const priceA = a.metadata.pricing.type === 'free' ? 0 : a.metadata.pricing.amount || 0;
        const priceB = b.metadata.pricing.type === 'free' ? 0 : b.metadata.pricing.amount || 0;
        return (priceA - priceB) * order;
      case 'rating':
        // Mock rating based on template id
        const ratingA = 4 + Math.random();
        const ratingB = 4 + Math.random();
        return (ratingA - ratingB) * order;
      case 'popularity':
      default:
        return (parseInt(a.id.split('-')[1]) - parseInt(b.id.split('-')[1])) * order;
    }
  });
  
  // Render template card
  const renderTemplateCard = (template: Template) => {
    const isFavorite = favorites.includes(template.id);
    const inCart = cart.find(t => t.id === template.id);
    const isPremium = template.metadata.license === 'premium';
    const price = template.metadata.pricing.amount || 0;
    
    return (
      <Card 
        key={template.id} 
        className={`group cursor-pointer transition-all duration-200 hover:shadow-lg ${
          selectedTemplate?.id === template.id ? 'ring-2 ring-blue-500' : ''
        }`}
        onClick={() => handleTemplateSelect(template)}
      >
        <CardHeader className="p-0">
          <div className="relative aspect-video overflow-hidden rounded-t-lg">
            <img 
              src={template.thumbnail} 
              alt={template.name}
              className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
            />
            
            {/* Overlay */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200 flex items-center justify-center">
              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex space-x-2">
                <Button size="sm" variant="secondary" onClick={(e) => {
                  e.stopPropagation();
                  setPreviewTemplate(template);
                }}>
                  <Eye className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="secondary" onClick={(e) => {
                  e.stopPropagation();
                  handleTemplateApply(template);
                }}>
                  <Download className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            {/* Premium badge */}
            {isPremium && (
              <Badge className="absolute top-2 left-2 bg-gradient-to-r from-yellow-400 to-orange-500">
                <Crown className="w-3 h-3 mr-1" />
                Premium
              </Badge>
            )}
            
            {/* Duration */}
            <Badge variant="secondary" className="absolute top-2 right-2">
              <Clock className="w-3 h-3 mr-1" />
              {template.duration}s
            </Badge>
            
            {/* Favorite button */}
            <Button
              size="sm"
              variant="ghost"
              className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => {
                e.stopPropagation();
                toggleFavorite(template.id);
              }}
            >
              <Heart className={`w-4 h-4 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-semibold text-sm truncate flex-1">{template.name}</h3>
            <div className="flex items-center space-x-1 ml-2">
              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
              <span className="text-xs text-gray-500">4.{Math.floor(Math.random() * 9)}</span>
            </div>
          </div>
          
          <p className="text-xs text-gray-500 mb-3 line-clamp-2">{template.description}</p>
          
          {/* Tags */}
          <div className="flex flex-wrap gap-1 mb-3">
            {template.tags.slice(0, 2).map(tag => (
              <Badge key={tag} variant="outline" className="text-xs px-1 py-0">
                {tag}
              </Badge>
            ))}
            {template.tags.length > 2 && (
              <Badge variant="outline" className="text-xs px-1 py-0">
                +{template.tags.length - 2}
              </Badge>
            )}
          </div>
          
          {/* Author and price */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1">
              <User className="w-3 h-3 text-gray-400" />
              <span className="text-xs text-gray-500">{template.metadata.author.name}</span>
            </div>
            
            <div className="flex items-center space-x-2">
              {isPremium ? (
                <>
                  <span className="text-sm font-semibold text-green-600">
                    ${price.toFixed(2)}
                  </span>
                  {inCart ? (
                    <Button size="sm" variant="outline" onClick={(e) => {
                      e.stopPropagation();
                      removeFromCart(template.id);
                    }}>
                      <ShoppingCart className="w-3 h-3" />
                    </Button>
                  ) : (
                    <Button size="sm" onClick={(e) => {
                      e.stopPropagation();
                      addToCart(template);
                    }}>
                      <ShoppingCart className="w-3 h-3" />
                    </Button>
                  )}
                </>
              ) : (
                <Badge variant="secondary" className="text-xs">
                  Grátis
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };
  
  // Render template list item
  const renderTemplateListItem = (template: Template) => {
    const isFavorite = favorites.includes(template.id);
    const isPremium = template.metadata.license === 'premium';
    const price = template.metadata.pricing.amount || 0;
    
    return (
      <Card 
        key={template.id} 
        className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
          selectedTemplate?.id === template.id ? 'ring-2 ring-blue-500' : ''
        }`}
        onClick={() => handleTemplateSelect(template)}
      >
        <CardContent className="p-4">
          <div className="flex items-center space-x-4">
            {/* Thumbnail */}
            <div className="relative w-24 h-16 flex-shrink-0 overflow-hidden rounded">
              <img 
                src={template.thumbnail} 
                alt={template.name}
                className="w-full h-full object-cover"
              />
              {isPremium && (
                <Crown className="absolute top-1 left-1 w-3 h-3 text-yellow-400" />
              )}
            </div>
            
            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between mb-1">
                <h3 className="font-semibold text-sm truncate">{template.name}</h3>
                <div className="flex items-center space-x-2 ml-4">
                  <div className="flex items-center space-x-1">
                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                    <span className="text-xs text-gray-500">4.{Math.floor(Math.random() * 9)}</span>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(template.id);
                    }}
                  >
                    <Heart className={`w-4 h-4 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
                  </Button>
                </div>
              </div>
              
              <p className="text-xs text-gray-500 mb-2 line-clamp-1">{template.description}</p>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-1">
                    <User className="w-3 h-3 text-gray-400" />
                    <span className="text-xs text-gray-500">{template.metadata.author.name}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="w-3 h-3 text-gray-400" />
                    <span className="text-xs text-gray-500">{template.duration}s</span>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {isPremium ? (
                    <span className="text-sm font-semibold text-green-600">
                      ${price.toFixed(2)}
                    </span>
                  ) : (
                    <Badge variant="secondary" className="text-xs">
                      Grátis
                    </Badge>
                  )}
                  
                  <Button size="sm" onClick={(e) => {
                    e.stopPropagation();
                    handleTemplateApply(template);
                  }}>
                    <Download className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };
  
  return (
    <div className={`h-full flex flex-col ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Template Marketplace</h2>
          <div className="flex items-center space-x-2">
            {cart.length > 0 && (
              <Button variant="outline" size="sm">
                <ShoppingCart className="w-4 h-4 mr-1" />
                Carrinho ({cart.length})
              </Button>
            )}
          </div>
        </div>
        
        {/* Stats */}
        <div className="grid grid-cols-5 gap-2 mb-4">
          <div className="text-center">
            <div className="text-lg font-bold text-blue-600">{stats.totalTemplates}</div>
            <div className="text-xs text-gray-500">Templates</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-green-600">{stats.freeTemplates}</div>
            <div className="text-xs text-gray-500">Grátis</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-yellow-600">{stats.premiumTemplates}</div>
            <div className="text-xs text-gray-500">Premium</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-purple-600">{stats.totalDownloads.toLocaleString()}</div>
            <div className="text-xs text-gray-500">Downloads</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-orange-600">{stats.averageRating}</div>
            <div className="text-xs text-gray-500">Avaliação</div>
          </div>
        </div>
        
        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Buscar templates..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>
        
        {/* Filters and controls */}
        <div className="flex items-center justify-between space-x-4">
          <div className="flex items-center space-x-2">
            {/* Category filter */}
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {/* Free only toggle */}
            <div className="flex items-center space-x-2">
              <Switch 
                checked={showFreeOnly} 
                onCheckedChange={setShowFreeOnly}
                id="free-only"
              />
              <label htmlFor="free-only" className="text-sm">Apenas grátis</label>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Sort */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="popularity">Popularidade</SelectItem>
                <SelectItem value="name">Nome</SelectItem>
                <SelectItem value="date">Data</SelectItem>
                <SelectItem value="price">Preço</SelectItem>
                <SelectItem value="rating">Avaliação</SelectItem>
              </SelectContent>
            </Select>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            >
              {sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
            </Button>
            
            {/* View mode */}
            <div className="flex border rounded">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid3X3 className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-sm text-gray-500">Carregando templates...</p>
              </div>
            </div>
          ) : sortedTemplates.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <Search className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Nenhum template encontrado</p>
              </div>
            </div>
          ) : (
            <div className={viewMode === 'grid' 
              ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'
              : 'space-y-3'
            }>
              {sortedTemplates.map(template => 
                viewMode === 'grid' 
                  ? renderTemplateCard(template)
                  : renderTemplateListItem(template)
              )}
            </div>
          )}
        </div>
      </ScrollArea>
      
      {/* Template Preview Dialog */}
      <Dialog open={!!previewTemplate} onOpenChange={() => setPreviewTemplate(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{previewTemplate?.name}</DialogTitle>
          </DialogHeader>
          
          {previewTemplate && (
            <div className="space-y-4">
              {/* Preview */}
              <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                <img 
                  src={previewTemplate.thumbnail} 
                  alt={previewTemplate.name}
                  className="w-full h-full object-cover"
                />
              </div>
              
              {/* Details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Detalhes</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Duração:</span>
                      <span>{previewTemplate.duration}s</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Categoria:</span>
                      <span className="capitalize">{previewTemplate.category}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Autor:</span>
                      <span>{previewTemplate.metadata.author.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Licença:</span>
                      <span className="capitalize">{previewTemplate.metadata.license}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Tags</h4>
                  <div className="flex flex-wrap gap-1">
                    {previewTemplate.tags.map(tag => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Actions */}
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setPreviewTemplate(null)}>
                  Fechar
                </Button>
                <Button onClick={() => {
                  handleTemplateApply(previewTemplate);
                  setPreviewTemplate(null);
                }}>
                  <Download className="w-4 h-4 mr-2" />
                  Aplicar Template
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TemplateMarketplace;