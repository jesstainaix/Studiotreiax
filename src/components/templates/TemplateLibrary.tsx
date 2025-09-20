/**
 * Interface de Seleção e Customização de Templates
 * 
 * Componente React para navegação, preview e customização
 * de templates profissionais
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Card } from '../../ui/card';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Badge } from '../../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Slider } from '../../ui/slider';
import { Switch } from '../../ui/switch';
import { 
  Search, 
  Filter, 
  Eye, 
  Settings, 
  Download, 
  Upload,
  Palette,
  Layout,
  Zap,
  Crown,
  Star,
  Heart,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  RotateCcw
} from 'lucide-react';

import { 
  TemplateManager, 
  ProfessionalTemplate, 
  TemplateStyle,
  TemplateTransition,
  TemplateAnimation
} from '../../lib/templates/TemplateManager';

interface TemplateLibraryProps {
  onTemplateSelected?: (template: ProfessionalTemplate) => void;
  onTemplateCustomized?: (template: ProfessionalTemplate) => void;
  selectedTemplate?: ProfessionalTemplate;
  allowCustomization?: boolean;
}

export const TemplateLibrary: React.FC<TemplateLibraryProps> = ({
  onTemplateSelected,
  onTemplateCustomized,
  selectedTemplate,
  allowCustomization = true
}) => {
  const [templateManager] = useState(() => new TemplateManager());
  const [allTemplates, setAllTemplates] = useState<ProfessionalTemplate[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<ProfessionalTemplate[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [previewTemplate, setPreviewTemplate] = useState<ProfessionalTemplate | null>(null);
  const [customizingTemplate, setCustomizingTemplate] = useState<ProfessionalTemplate | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  
  // Customization state
  const [customStyle, setCustomStyle] = useState<TemplateStyle | null>(null);
  const [customTransitions, setCustomTransitions] = useState<TemplateTransition | null>(null);
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);

  useEffect(() => {
    const templates = templateManager.getTemplatesByCategory();
    setAllTemplates(templates);
    setFilteredTemplates(templates);
  }, [templateManager]);

  useEffect(() => {
    let filtered = allTemplates;

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(template => template.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = templateManager.searchTemplates(searchQuery);
    }

    setFilteredTemplates(filtered);
  }, [searchQuery, selectedCategory, allTemplates, templateManager]);

  const categories = useMemo(() => {
    const categorySet = new Set(allTemplates.map(t => t.category));
    return Array.from(categorySet).map(cat => ({
      value: cat,
      label: cat.charAt(0).toUpperCase() + cat.slice(1),
      count: allTemplates.filter(t => t.category === cat).length
    }));
  }, [allTemplates]);

  const handleTemplateSelect = (template: ProfessionalTemplate) => {
    onTemplateSelected?.(template);
  };

  const handleTemplatePreview = (template: ProfessionalTemplate) => {
    setPreviewTemplate(template);
  };

  const handleTemplateCustomize = (template: ProfessionalTemplate) => {
    setCustomizingTemplate(template);
    setCustomStyle(template.style);
    setCustomTransitions(template.transitions.default);
  };

  const handleFavoriteToggle = (templateId: string) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(templateId)) {
      newFavorites.delete(templateId);
    } else {
      newFavorites.add(templateId);
    }
    setFavorites(newFavorites);
    
    // Persist to localStorage
    localStorage.setItem('template-favorites', JSON.stringify(Array.from(newFavorites)));
  };

  const handleStyleCustomization = (property: keyof TemplateStyle, value: string) => {
    if (!customStyle) return;
    
    const newStyle = { ...customStyle, [property]: value };
    setCustomStyle(newStyle);
  };

  const handleTransitionCustomization = (property: keyof TemplateTransition, value: any) => {
    if (!customTransitions) return;
    
    const newTransitions = { ...customTransitions, [property]: value };
    setCustomTransitions(newTransitions);
  };

  const applyCustomizations = () => {
    if (!customizingTemplate || !customStyle || !customTransitions) return;

    const customizedTemplate = templateManager.createCustomTemplate(customizingTemplate.id, {
      style: customStyle,
      transitions: {
        default: customTransitions,
        alternatives: customizingTemplate.transitions.alternatives
      }
    });

    if (customizedTemplate) {
      onTemplateCustomized?.(customizedTemplate);
      setCustomizingTemplate(null);
    }
  };

  const resetCustomizations = () => {
    if (customizingTemplate) {
      setCustomStyle(customizingTemplate.style);
      setCustomTransitions(customizingTemplate.transitions.default);
    }
  };

  const TemplateCard: React.FC<{ template: ProfessionalTemplate }> = ({ template }) => (
    <Card className="group relative overflow-hidden hover:shadow-lg transition-all duration-300">
      {/* Template Preview */}
      <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 relative overflow-hidden">
        <div 
          className="w-full h-full flex items-center justify-center text-4xl font-bold"
          style={{ 
            backgroundColor: template.style.backgroundColor,
            color: template.style.primaryColor,
            fontFamily: template.style.headerFont
          }}
        >
          {template.name.substring(0, 2).toUpperCase()}
        </div>
        
        {/* Overlay with actions */}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
          <div className="flex space-x-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleTemplatePreview(template)}
            >
              <Eye className="w-4 h-4 mr-1" />
              Preview
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={() => handleTemplateSelect(template)}
            >
              Usar Template
            </Button>
          </div>
        </div>

        {/* Premium badge */}
        {template.isPremium && (
          <Badge className="absolute top-2 right-2 bg-yellow-500 text-white">
            <Crown className="w-3 h-3 mr-1" />
            Premium
          </Badge>
        )}

        {/* Favorite button */}
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => handleFavoriteToggle(template.id)}
        >
          <Heart 
            className={`w-4 h-4 ${favorites.has(template.id) ? 'fill-red-500 text-red-500' : 'text-white'}`} 
          />
        </Button>
      </div>

      {/* Template Info */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-semibold text-lg truncate">{template.name}</h3>
          <Badge variant="outline" className="text-xs">
            {template.category}
          </Badge>
        </div>
        
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
          {template.description}
        </p>

        <div className="flex items-center justify-between">
          <div className="flex space-x-1">
            {template.style.colorScheme?.slice(0, 4).map((color, index) => (
              <div
                key={index}
                className="w-4 h-4 rounded-full border border-gray-300"
                style={{ backgroundColor: color }}
              />
            ))}
          </div>

          {allowCustomization && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleTemplateCustomize(template)}
            >
              <Settings className="w-3 h-3 mr-1" />
              Customizar
            </Button>
          )}
        </div>
      </div>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Biblioteca de Templates</h1>
          <p className="text-gray-600">
            Escolha entre {allTemplates.length} templates profissionais ou crie o seu próprio
          </p>
        </div>

        <div className="flex space-x-2">
          <Button variant="outline">
            <Upload className="w-4 h-4 mr-2" />
            Importar
          </Button>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Filters and Search */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Buscar templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger>
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as categorias</SelectItem>
              {categories.map(category => (
                <SelectItem key={category.value} value={category.value}>
                  {category.label} ({category.count})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Switch id="premium-only" />
              <Label htmlFor="premium-only" className="text-sm">Apenas Premium</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch id="favorites-only" />
              <Label htmlFor="favorites-only" className="text-sm">Favoritos</Label>
            </div>
          </div>
        </div>
      </Card>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredTemplates.map(template => (
          <TemplateCard key={template.id} template={template} />
        ))}
      </div>

      {/* Empty State */}
      {filteredTemplates.length === 0 && (
        <Card className="p-8 text-center">
          <div className="text-gray-400 mb-4">
            <Layout className="w-16 h-16 mx-auto" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Nenhum template encontrado</h3>
          <p className="text-gray-600 mb-4">
            Tente ajustar os filtros ou termos de busca
          </p>
          <Button onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }}>
            Limpar Filtros
          </Button>
        </Card>
      )}

      {/* Preview Modal */}
      {previewTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">{previewTemplate.name}</h2>
                <Button
                  variant="ghost"
                  onClick={() => setPreviewTemplate(null)}
                >
                  ✕
                </Button>
              </div>

              {/* Preview Content */}
              <div className="aspect-video bg-gray-100 rounded-lg mb-4 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-4xl mb-4">🎬</div>
                  <p className="text-gray-600">Preview do template seria exibido aqui</p>
                  <Button
                    className="mt-4"
                    onClick={() => setIsPreviewPlaying(!isPreviewPlaying)}
                  >
                    {isPreviewPlaying ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                    {isPreviewPlaying ? 'Pausar' : 'Reproduzir'} Preview
                  </Button>
                </div>
              </div>

              {/* Template Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-2">Informações</h3>
                  <ul className="space-y-1 text-sm text-gray-600">
                    <li>Categoria: {previewTemplate.category}</li>
                    <li>Layouts: {previewTemplate.layouts.length}</li>
                    <li>Animações: {previewTemplate.animations.length}</li>
                    <li>Premium: {previewTemplate.isPremium ? 'Sim' : 'Não'}</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-2">Cores do Template</h3>
                  <div className="grid grid-cols-4 gap-2">
                    {previewTemplate.style.colorScheme?.map((color, index) => (
                      <div key={index} className="text-center">
                        <div
                          className="w-full h-8 rounded border"
                          style={{ backgroundColor: color }}
                        />
                        <span className="text-xs text-gray-600">{color}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-2 mt-6">
                <Button
                  variant="outline"
                  onClick={() => handleTemplateCustomize(previewTemplate)}
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Customizar
                </Button>
                <Button onClick={() => handleTemplateSelect(previewTemplate)}>
                  Usar Este Template
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Customization Panel */}
      {customizingTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-6xl max-h-[90vh] overflow-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">Customizar: {customizingTemplate.name}</h2>
                <Button
                  variant="ghost"
                  onClick={() => setCustomizingTemplate(null)}
                >
                  ✕
                </Button>
              </div>

              <Tabs defaultValue="style" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="style">
                    <Palette className="w-4 h-4 mr-2" />
                    Estilo
                  </TabsTrigger>
                  <TabsTrigger value="transitions">
                    <Zap className="w-4 h-4 mr-2" />
                    Transições
                  </TabsTrigger>
                  <TabsTrigger value="animations">
                    <Star className="w-4 h-4 mr-2" />
                    Animações
                  </TabsTrigger>
                </TabsList>

                {/* Style Customization */}
                <TabsContent value="style" className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="font-semibold">Cores</h3>
                      
                      <div className="space-y-3">
                        <div>
                          <Label>Cor Primária</Label>
                          <div className="flex items-center space-x-2 mt-1">
                            <input
                              type="color"
                              value={customStyle?.primaryColor || '#000000'}
                              onChange={(e) => handleStyleCustomization('primaryColor', e.target.value)}
                              className="w-12 h-8 rounded border"
                            />
                            <Input
                              value={customStyle?.primaryColor || ''}
                              onChange={(e) => handleStyleCustomization('primaryColor', e.target.value)}
                              placeholder="#000000"
                            />
                          </div>
                        </div>

                        <div>
                          <Label>Cor Secundária</Label>
                          <div className="flex items-center space-x-2 mt-1">
                            <input
                              type="color"
                              value={customStyle?.secondaryColor || '#000000'}
                              onChange={(e) => handleStyleCustomization('secondaryColor', e.target.value)}
                              className="w-12 h-8 rounded border"
                            />
                            <Input
                              value={customStyle?.secondaryColor || ''}
                              onChange={(e) => handleStyleCustomization('secondaryColor', e.target.value)}
                              placeholder="#000000"
                            />
                          </div>
                        </div>

                        <div>
                          <Label>Cor de Destaque</Label>
                          <div className="flex items-center space-x-2 mt-1">
                            <input
                              type="color"
                              value={customStyle?.accentColor || '#000000'}
                              onChange={(e) => handleStyleCustomization('accentColor', e.target.value)}
                              className="w-12 h-8 rounded border"
                            />
                            <Input
                              value={customStyle?.accentColor || ''}
                              onChange={(e) => handleStyleCustomization('accentColor', e.target.value)}
                              placeholder="#000000"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="font-semibold">Tipografia</h3>
                      
                      <div className="space-y-3">
                        <div>
                          <Label>Fonte Principal</Label>
                          <Select
                            value={customStyle?.fontFamily || ''}
                            onValueChange={(value) => handleStyleCustomization('fontFamily', value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Inter, sans-serif">Inter</SelectItem>
                              <SelectItem value="Roboto, sans-serif">Roboto</SelectItem>
                              <SelectItem value="Poppins, sans-serif">Poppins</SelectItem>
                              <SelectItem value="Georgia, serif">Georgia</SelectItem>
                              <SelectItem value="JetBrains Mono, monospace">JetBrains Mono</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label>Fonte de Títulos</Label>
                          <Select
                            value={customStyle?.headerFont || ''}
                            onValueChange={(value) => handleStyleCustomization('headerFont', value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Inter, sans-serif">Inter</SelectItem>
                              <SelectItem value="Roboto Slab, serif">Roboto Slab</SelectItem>
                              <SelectItem value="Poppins, sans-serif">Poppins</SelectItem>
                              <SelectItem value="Playfair Display, serif">Playfair Display</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* Transitions Customization */}
                <TabsContent value="transitions" className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="font-semibold">Tipo de Transição</h3>
                      
                      <Select
                        value={customTransitions?.type || ''}
                        onValueChange={(value) => handleTransitionCustomization('type', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="fade">Fade</SelectItem>
                          <SelectItem value="slide">Slide</SelectItem>
                          <SelectItem value="zoom">Zoom</SelectItem>
                          <SelectItem value="flip">Flip</SelectItem>
                          <SelectItem value="cube">Cube</SelectItem>
                          <SelectItem value="dissolve">Dissolve</SelectItem>
                          <SelectItem value="wipe">Wipe</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-4">
                      <h3 className="font-semibold">Duração</h3>
                      
                      <div>
                        <Label>Duração: {customTransitions?.duration}s</Label>
                        <Slider
                          value={[customTransitions?.duration || 1]}
                          onValueChange={([value]) => handleTransitionCustomization('duration', value)}
                          min={0.1}
                          max={3}
                          step={0.1}
                          className="mt-2"
                        />
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="animations" className="space-y-6">
                  <div className="text-center text-gray-600">
                    <Star className="w-12 h-12 mx-auto mb-4" />
                    <p>Customização de animações será implementada em breve</p>
                  </div>
                </TabsContent>
              </Tabs>

              <div className="flex justify-between items-center mt-8 pt-6 border-t">
                <Button
                  variant="outline"
                  onClick={resetCustomizations}
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Resetar
                </Button>

                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setCustomizingTemplate(null)}
                  >
                    Cancelar
                  </Button>
                  <Button onClick={applyCustomizations}>
                    Aplicar Customização
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};