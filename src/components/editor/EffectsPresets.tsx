import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Save, 
  Star, 
  Download, 
  Upload, 
  Trash2, 
  Edit, 
  Copy,
  Heart,
  Sparkles,
  Palette
} from 'lucide-react';

interface Preset {
  id: string;
  name: string;
  description: string;
  category: string;
  parameters: Record<string, any>;
  thumbnail?: string;
  isPopular?: boolean;
  isFavorite?: boolean;
  isCustom?: boolean;
  author?: string;
  downloads?: number;
  rating?: number;
  createdAt: Date;
}

interface EffectsPresetsProps {
  effectId?: string;
  currentParameters: Record<string, any>;
  onPresetApply: (preset: Preset) => void;
  onPresetSave?: (preset: Omit<Preset, 'id' | 'createdAt'>) => void;
}

// Popular presets library
const POPULAR_PRESETS: Preset[] = [
  {
    id: 'vintage-warm',
    name: 'Vintage Quente',
    description: 'Efeito vintage com tons quentes e saturação reduzida',
    category: 'vintage',
    parameters: {
      saturation: 0.7,
      warmth: 0.8,
      vignette: 0.3,
      grain: 0.2,
      contrast: 1.1
    },
    isPopular: true,
    author: 'Studio Treiax',
    downloads: 1250,
    rating: 4.8,
    createdAt: new Date('2024-01-15')
  },
  {
    id: 'cinematic-blue',
    name: 'Cinemático Azul',
    description: 'Look cinemático com tons azuis e contraste elevado',
    category: 'cinematic',
    parameters: {
      temperature: -0.3,
      tint: 0.2,
      contrast: 1.3,
      shadows: -0.2,
      highlights: -0.1
    },
    isPopular: true,
    author: 'Studio Treiax',
    downloads: 980,
    rating: 4.6,
    createdAt: new Date('2024-01-20')
  },
  {
    id: 'soft-portrait',
    name: 'Retrato Suave',
    description: 'Efeito suave ideal para retratos e close-ups',
    category: 'portrait',
    parameters: {
      softness: 0.4,
      brightness: 0.1,
      contrast: 0.9,
      saturation: 1.1,
      skinTone: 0.2
    },
    isPopular: true,
    author: 'Studio Treiax',
    downloads: 756,
    rating: 4.9,
    createdAt: new Date('2024-01-25')
  },
  {
    id: 'dramatic-bw',
    name: 'Preto e Branco Dramático',
    description: 'Conversão P&B com alto contraste e drama',
    category: 'artistic',
    parameters: {
      saturation: 0,
      contrast: 1.5,
      clarity: 0.3,
      shadows: -0.4,
      highlights: 0.2
    },
    isPopular: true,
    author: 'Studio Treiax',
    downloads: 1100,
    rating: 4.7,
    createdAt: new Date('2024-02-01')
  },
  {
    id: 'sunset-glow',
    name: 'Brilho do Pôr do Sol',
    description: 'Efeito dourado inspirado no pôr do sol',
    category: 'lighting',
    parameters: {
      warmth: 0.9,
      brightness: 0.2,
      saturation: 1.2,
      orangeTint: 0.4,
      glow: 0.3
    },
    isPopular: true,
    author: 'Studio Treiax',
    downloads: 890,
    rating: 4.5,
    createdAt: new Date('2024-02-05')
  }
];

export const EffectsPresets: React.FC<EffectsPresetsProps> = ({
  effectId,
  currentParameters,
  onPresetApply,
  onPresetSave
}) => {
  const [customPresets, setCustomPresets] = useState<Preset[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');
  const [newPresetDescription, setNewPresetDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Load custom presets and favorites from localStorage
  useEffect(() => {
    const savedPresets = localStorage.getItem('custom-presets');
    const savedFavorites = localStorage.getItem('favorite-presets');
    
    if (savedPresets) {
      setCustomPresets(JSON.parse(savedPresets));
    }
    
    if (savedFavorites) {
      setFavorites(JSON.parse(savedFavorites));
    }
  }, []);

  // Save custom presets to localStorage
  const saveCustomPresets = (presets: Preset[]) => {
    setCustomPresets(presets);
    localStorage.setItem('custom-presets', JSON.stringify(presets));
  };

  // Save favorites to localStorage
  const saveFavorites = (favs: string[]) => {
    setFavorites(favs);
    localStorage.setItem('favorite-presets', JSON.stringify(favs));
  };

  // Handle preset application
  const handlePresetApply = (preset: Preset) => {
    onPresetApply(preset);
  };

  // Handle saving current parameters as preset
  const handleSavePreset = () => {
    if (!newPresetName.trim()) return;

    const newPreset: Preset = {
      id: `custom-${Date.now()}`,
      name: newPresetName,
      description: newPresetDescription,
      category: 'custom',
      parameters: { ...currentParameters },
      isCustom: true,
      author: 'Você',
      createdAt: new Date()
    };

    const updatedPresets = [...customPresets, newPreset];
    saveCustomPresets(updatedPresets);
    
    if (onPresetSave) {
      onPresetSave(newPreset);
    }

    setNewPresetName('');
    setNewPresetDescription('');
    setShowSaveDialog(false);
  };

  // Handle favorite toggle
  const toggleFavorite = (presetId: string) => {
    const newFavorites = favorites.includes(presetId)
      ? favorites.filter(id => id !== presetId)
      : [...favorites, presetId];
    
    saveFavorites(newFavorites);
  };

  // Handle preset deletion
  const deletePreset = (presetId: string) => {
    const updatedPresets = customPresets.filter(p => p.id !== presetId);
    saveCustomPresets(updatedPresets);
  };

  // Get all presets
  const allPresets = [...POPULAR_PRESETS, ...customPresets];

  // Filter presets by category
  const filteredPresets = selectedCategory === 'all' 
    ? allPresets
    : selectedCategory === 'favorites'
    ? allPresets.filter(p => favorites.includes(p.id))
    : allPresets.filter(p => p.category === selectedCategory);

  const categories = [
    { id: 'all', name: 'Todos', icon: Sparkles },
    { id: 'favorites', name: 'Favoritos', icon: Heart },
    { id: 'vintage', name: 'Vintage', icon: Palette },
    { id: 'cinematic', name: 'Cinemático', icon: Star },
    { id: 'custom', name: 'Personalizados', icon: Edit }
  ];

  return (
    <div className="space-y-4">
      {/* Header with Save Button */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Presets de Efeitos</h3>
        <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
          <DialogTrigger asChild>
            <Button size="sm" className="flex items-center gap-2">
              <Save className="h-4 w-4" />
              Salvar Preset
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Salvar Preset Personalizado</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="preset-name">Nome do Preset</Label>
                <Input
                  id="preset-name"
                  value={newPresetName}
                  onChange={(e) => setNewPresetName(e.target.value)}
                  placeholder="Ex: Meu Efeito Favorito"
                />
              </div>
              <div>
                <Label htmlFor="preset-description">Descrição (opcional)</Label>
                <Textarea
                  id="preset-description"
                  value={newPresetDescription}
                  onChange={(e) => setNewPresetDescription(e.target.value)}
                  placeholder="Descreva quando usar este preset..."
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSavePreset} disabled={!newPresetName.trim()}>
                  Salvar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Category Tabs */}
      <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
        <TabsList className="grid grid-cols-5 w-full">
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <TabsTrigger key={category.id} value={category.id} className="flex items-center gap-1">
                <Icon className="h-3 w-3" />
                <span className="hidden sm:inline">{category.name}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        <TabsContent value={selectedCategory} className="mt-4">
          <ScrollArea className="h-96">
            <div className="grid grid-cols-1 gap-3">
              {filteredPresets.map((preset) => (
                <Card key={preset.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-sm font-medium">{preset.name}</CardTitle>
                        <p className="text-xs text-muted-foreground mt-1">
                          {preset.description}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleFavorite(preset.id)}
                          className="h-6 w-6 p-0"
                        >
                          <Heart 
                            className={`h-3 w-3 ${
                              favorites.includes(preset.id) 
                                ? 'fill-red-500 text-red-500' 
                                : 'text-muted-foreground'
                            }`} 
                          />
                        </Button>
                        {preset.isCustom && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deletePreset(preset.id)}
                            className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {preset.isPopular && (
                          <Badge variant="secondary" className="text-xs">
                            <Star className="h-2 w-2 mr-1" />
                            Popular
                          </Badge>
                        )}
                        {preset.isCustom && (
                          <Badge variant="outline" className="text-xs">
                            Personalizado
                          </Badge>
                        )}
                        {preset.rating && (
                          <span className="text-xs text-muted-foreground">
                            ★ {preset.rating}
                          </span>
                        )}
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handlePresetApply(preset)}
                        className="text-xs"
                      >
                        Aplicar
                      </Button>
                    </div>
                    {preset.author && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Por {preset.author}
                        {preset.downloads && ` • ${preset.downloads} downloads`}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EffectsPresets;