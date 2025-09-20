import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Grid3X3,
  List,
  Play,
  Star,
  Clock,
  Users,
  Download,
  Eye,
  Heart,
  Shield,
  AlertTriangle,
  HardHat,
  Zap,
  Flame,
  Wind,
  Droplets,
  Truck,
  Building,
  Factory
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

// Types
interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  nrType: string;
  duration: number;
  thumbnail: string;
  previewUrl: string;
  isPremium: boolean;
  rating: number;
  downloads: number;
  tags: string[];
  createdAt: string;
}

// Mock data for NR templates
const mockTemplates: Template[] = [
  {
    id: '1',
    name: 'Segurança em Altura - NR-35',
    description: 'Template completo para treinamento de trabalho em altura com procedimentos de segurança',
    category: 'Segurança',
    nrType: 'NR-35',
    duration: 45,
    thumbnail: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=safety%20training%20height%20work%20construction%20helmet&image_size=landscape_16_9',
    previewUrl: '#',
    isPremium: false,
    rating: 4.8,
    downloads: 1250,
    tags: ['altura', 'segurança', 'construção', 'EPI'],
    createdAt: '2024-01-15'
  },
  {
    id: '2',
    name: 'Prevenção de Acidentes - NR-10',
    description: 'Treinamento essencial sobre segurança em instalações e serviços em eletricidade',
    category: 'Elétrica',
    nrType: 'NR-10',
    duration: 60,
    thumbnail: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=electrical%20safety%20training%20power%20lines%20helmet&image_size=landscape_16_9',
    previewUrl: '#',
    isPremium: true,
    rating: 4.9,
    downloads: 2100,
    tags: ['eletricidade', 'prevenção', 'instalações', 'choque'],
    createdAt: '2024-01-10'
  },
  {
    id: '3',
    name: 'Máquinas e Equipamentos - NR-12',
    description: 'Segurança no trabalho em máquinas e equipamentos industriais',
    category: 'Industrial',
    nrType: 'NR-12',
    duration: 50,
    thumbnail: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=industrial%20machinery%20safety%20factory%20equipment&image_size=landscape_16_9',
    previewUrl: '#',
    isPremium: false,
    rating: 4.7,
    downloads: 890,
    tags: ['máquinas', 'equipamentos', 'industrial', 'proteção'],
    createdAt: '2024-01-08'
  },
  {
    id: '4',
    name: 'Espaços Confinados - NR-33',
    description: 'Procedimentos de segurança para trabalho em espaços confinados',
    category: 'Segurança',
    nrType: 'NR-33',
    duration: 55,
    thumbnail: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=confined%20space%20safety%20training%20tank%20entry&image_size=landscape_16_9',
    previewUrl: '#',
    isPremium: true,
    rating: 4.6,
    downloads: 670,
    tags: ['confinado', 'atmosfera', 'resgate', 'monitoramento'],
    createdAt: '2024-01-05'
  },
  {
    id: '5',
    name: 'Caldeiras e Vasos - NR-13',
    description: 'Segurança na operação de caldeiras, vasos de pressão e tubulações',
    category: 'Industrial',
    nrType: 'NR-13',
    duration: 70,
    thumbnail: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=boiler%20pressure%20vessel%20industrial%20safety&image_size=landscape_16_9',
    previewUrl: '#',
    isPremium: true,
    rating: 4.8,
    downloads: 540,
    tags: ['caldeiras', 'pressão', 'vapor', 'inspeção'],
    createdAt: '2024-01-03'
  },
  {
    id: '6',
    name: 'Transporte de Cargas - NR-11',
    description: 'Normas de segurança para transporte, movimentação e armazenagem de materiais',
    category: 'Logística',
    nrType: 'NR-11',
    duration: 40,
    thumbnail: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=forklift%20cargo%20transport%20warehouse%20safety&image_size=landscape_16_9',
    previewUrl: '#',
    isPremium: false,
    rating: 4.5,
    downloads: 780,
    tags: ['transporte', 'empilhadeira', 'armazenagem', 'carga'],
    createdAt: '2024-01-01'
  }
];

const nrCategories = [
  { id: 'all', name: 'Todas as NRs', icon: Grid3X3, count: mockTemplates.length },
  { id: 'NR-10', name: 'NR-10 - Elétrica', icon: Zap, count: mockTemplates.filter(t => t.nrType === 'NR-10').length },
  { id: 'NR-11', name: 'NR-11 - Transporte', icon: Truck, count: mockTemplates.filter(t => t.nrType === 'NR-11').length },
  { id: 'NR-12', name: 'NR-12 - Máquinas', icon: Factory, count: mockTemplates.filter(t => t.nrType === 'NR-12').length },
  { id: 'NR-13', name: 'NR-13 - Caldeiras', icon: Flame, count: mockTemplates.filter(t => t.nrType === 'NR-13').length },
  { id: 'NR-33', name: 'NR-33 - Confinados', icon: Wind, count: mockTemplates.filter(t => t.nrType === 'NR-33').length },
  { id: 'NR-35', name: 'NR-35 - Altura', icon: Building, count: mockTemplates.filter(t => t.nrType === 'NR-35').length }
];

const TemplateCard: React.FC<{ template: Template; viewMode: 'grid' | 'list' }> = ({ template, viewMode }) => {
  const handlePreview = () => {
    toast.info(`Abrindo preview: ${template.name}`);
  };

  const handleDownload = () => {
    toast.success(`Template "${template.name}" adicionado ao projeto`);
  };

  const handleFavorite = () => {
    toast.success('Template adicionado aos favoritos');
  };

  if (viewMode === 'list') {
    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <img
              src={template.thumbnail}
              alt={template.name}
              className="w-24 h-16 object-cover rounded"
            />
            <div className="flex-1">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-heading font-semibold text-gray-900">{template.name}</h3>
                  <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                </div>
                {template.isPremium && (
                  <Badge variant="warning" className="ml-2">
                    Premium
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {template.duration}min
                </div>
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  {template.rating}
                </div>
                <div className="flex items-center gap-1">
                  <Download className="h-4 w-4" />
                  {template.downloads}
                </div>
                <Badge variant="outline">{template.nrType}</Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex flex-wrap gap-1">
                  {template.tags.slice(0, 3).map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
                
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={handleFavorite}>
                    <Heart className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={handlePreview}>
                    <Eye className="h-4 w-4 mr-1" />
                    Preview
                  </Button>
                  <Button size="sm" onClick={handleDownload}>
                    <Download className="h-4 w-4 mr-1" />
                    Usar
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="hover:shadow-md transition-shadow group">
      <div className="relative">
        <img
          src={template.thumbnail}
          alt={template.name}
          className="w-full h-48 object-cover rounded-t-lg"
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded-t-lg" />
        <div className="absolute top-2 right-2 flex gap-2">
          {template.isPremium && (
            <Badge variant="warning">
              Premium
            </Badge>
          )}
          <Badge variant="outline" className="bg-white/90">
            {template.nrType}
          </Badge>
        </div>
        <Button
          variant="secondary"
          size="sm"
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={handlePreview}
        >
          <Play className="h-4 w-4 mr-1" />
          Preview
        </Button>
      </div>
      
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-heading font-semibold text-gray-900 line-clamp-2">{template.name}</h3>
          <Button variant="ghost" size="sm" onClick={handleFavorite}>
            <Heart className="h-4 w-4" />
          </Button>
        </div>
        
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{template.description}</p>
        
        <div className="flex items-center gap-3 text-sm text-gray-500 mb-3">
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            {template.duration}min
          </div>
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            {template.rating}
          </div>
          <div className="flex items-center gap-1">
            <Download className="h-4 w-4" />
            {template.downloads}
          </div>
        </div>
        
        <div className="flex flex-wrap gap-1 mb-4">
          {template.tags.slice(0, 2).map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
        
        <Button className="w-full" onClick={handleDownload}>
          <Download className="h-4 w-4 mr-2" />
          Usar Template
        </Button>
      </CardContent>
    </Card>
  );
};

export default function Templates() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState('popular');

  const filteredTemplates = useMemo(() => {
    let filtered = mockTemplates;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(template =>
        template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())) ||
        template.nrType.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(template => template.nrType === selectedCategory);
    }

    // Sort templates
    switch (sortBy) {
      case 'popular':
        filtered.sort((a, b) => b.downloads - a.downloads);
        break;
      case 'rating':
        filtered.sort((a, b) => b.rating - a.rating);
        break;
      case 'newest':
        filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'duration':
        filtered.sort((a, b) => a.duration - b.duration);
        break;
    }

    return filtered;
  }, [searchTerm, selectedCategory, sortBy]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-gray-900">Templates NR</h1>
          <p className="text-gray-600 mt-1">Biblioteca completa de templates para treinamentos de segurança</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            <Grid3X3 className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar templates por nome, descrição, tags ou NR..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
          >
            <option value="popular">Mais Populares</option>
            <option value="rating">Melhor Avaliados</option>
            <option value="newest">Mais Recentes</option>
            <option value="duration">Menor Duração</option>
          </select>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar - Categories */}
        <div className="lg:w-64">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-heading">Categorias NR</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="space-y-1">
                {nrCategories.map((category) => {
                  const Icon = category.icon;
                  const isActive = selectedCategory === category.id;
                  
                  return (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition-colors ${
                        isActive ? 'bg-primary-50 text-primary-700 border-r-2 border-primary-500' : 'text-gray-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`h-4 w-4 ${isActive ? 'text-primary-600' : 'text-gray-400'}`} />
                        <span className="font-medium text-sm">{category.name}</span>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {category.count}
                      </Badge>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {/* Results Header */}
          <div className="flex items-center justify-between mb-6">
            <p className="text-gray-600">
              {filteredTemplates.length} template{filteredTemplates.length !== 1 ? 's' : ''} encontrado{filteredTemplates.length !== 1 ? 's' : ''}
              {selectedCategory !== 'all' && (
                <span className="ml-1">em {nrCategories.find(c => c.id === selectedCategory)?.name}</span>
              )}
            </p>
          </div>

          {/* Templates Grid/List */}
          {filteredTemplates.length === 0 ? (
            <Card className="p-12 text-center">
              <div className="text-gray-400 mb-4">
                <Search className="h-16 w-16 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum template encontrado</h3>
              <p className="text-gray-600">Tente ajustar os filtros ou termos de busca</p>
            </Card>
          ) : (
            <div className={viewMode === 'grid' 
              ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6'
              : 'space-y-4'
            }>
              {filteredTemplates.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  viewMode={viewMode}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}