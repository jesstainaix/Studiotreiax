import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Slider } from '../../ui/slider';
import { Progress } from '../../ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
import { Input } from '../../ui/input';
import { 
  Palette,
  Sparkles,
  Wand2,
  Eye,
  EyeOff,
  Settings,
  Download,
  Upload,
  Heart,
  Star,
  Layers,
  Filter,
  Contrast,
  Sun,
  Moon,
  Droplets,
  Wind,
  Zap,
  Waves,
  Camera,
  Film,
  Image,
  Paintbrush,
  Eraser,
  RotateCcw,
  RotateCw,
  FlipHorizontal,
  FlipVertical,
  Maximize,
  Minimize,
  Move,
  MousePointer,
  Hand,
  Scissors,
  Copy,
  Trash2,
  Undo,
  Redo,
  Save,
  FolderOpen,
  Search,
  Plus,
  Minus,
  X,
  Check,
  AlertTriangle,
  Info,
  RefreshCw,
  Shuffle,
  Grid3X3,
  Circle,
  Square,
  Triangle,
  Hexagon,
  Timer,
  Clock,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  VolumeX,
  Sliders,
  Gauge,
  Target,
  Crosshair,
  Aperture,
  Focus,
  Blur,
  Rainbow,
  Flame,
  Snowflake,
  Cloudy,
  Lightbulb,
  Flashlight,
  Sunset,
  Sunrise
} from 'lucide-react';

// Tipos para efeitos
interface Effect {
  id: string;
  name: string;
  category: EffectCategory;
  icon: React.ReactNode;
  description: string;
  parameters: EffectParameter[];
  previewUrl?: string;
  isPremium?: boolean;
  tags: string[];
}

interface EffectParameter {
  id: string;
  name: string;
  type: 'slider' | 'color' | 'select' | 'checkbox' | 'number';
  min?: number;
  max?: number;
  step?: number;
  defaultValue: any;
  options?: string[];
  unit?: string;
}

interface AppliedEffect {
  id: string;
  effectId: string;
  name: string;
  parameters: Record<string, any>;
  opacity: number;
  blendMode: string;
  enabled: boolean;
  duration?: number;
  startTime?: number;
}

interface Transition {
  id: string;
  name: string;
  type: 'cut' | 'fade' | 'slide' | 'zoom' | 'rotate' | 'custom';
  duration: number;
  easing: string;
  parameters: Record<string, any>;
  icon: React.ReactNode;
  previewUrl?: string;
}

type EffectCategory = 'color' | 'blur' | 'artistic' | 'lighting' | 'distortion' | 'vintage' | 'modern' | 'cinematic';

interface EffectsTransitionsSystemProps {
  selectedClip?: string;
  onEffectApply: (effect: AppliedEffect) => void;
  onEffectRemove: (effectId: string) => void;
  onTransitionApply: (transition: Transition) => void;
  className?: string;
}

const AdvancedEffectsTransitionsSystem: React.FC<EffectsTransitionsSystemProps> = ({
  selectedClip,
  onEffectApply,
  onEffectRemove,
  onTransitionApply,
  className = ''
}) => {
  // State management
  const [activeTab, setActiveTab] = useState<'effects' | 'transitions' | 'presets'>('effects');
  const [selectedCategory, setSelectedCategory] = useState<EffectCategory | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [appliedEffects, setAppliedEffects] = useState<AppliedEffect[]>([]);
  const [selectedEffect, setSelectedEffect] = useState<Effect | null>(null);
  const [previewEnabled, setPreviewEnabled] = useState(true);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [customPresets, setCustomPresets] = useState<any[]>([]);

  // Biblioteca de efeitos
  const effectsLibrary: Effect[] = useMemo(() => [
    // Efeitos de Cor
    {
      id: 'brightness-contrast',
      name: 'Brilho e Contraste',
      category: 'color',
      icon: <Sun className="w-4 h-4" />,
      description: 'Ajuste de brilho e contraste da imagem',
      tags: ['basic', 'color', 'adjustment'],
      parameters: [
        { id: 'brightness', name: 'Brilho', type: 'slider', min: -100, max: 100, step: 1, defaultValue: 0, unit: '%' },
        { id: 'contrast', name: 'Contraste', type: 'slider', min: -100, max: 100, step: 1, defaultValue: 0, unit: '%' }
      ]
    },
    {
      id: 'saturation-hue',
      name: 'Saturação e Matiz',
      category: 'color',
      icon: <Rainbow className="w-4 h-4" />,
      description: 'Controle de saturação de cores e rotação de matiz',
      tags: ['color', 'saturation', 'hue'],
      parameters: [
        { id: 'saturation', name: 'Saturação', type: 'slider', min: -100, max: 100, step: 1, defaultValue: 0, unit: '%' },
        { id: 'hue', name: 'Matiz', type: 'slider', min: -180, max: 180, step: 1, defaultValue: 0, unit: '°' }
      ]
    },
    {
      id: 'color-balance',
      name: 'Balanço de Cores',
      category: 'color',
      icon: <Palette className="w-4 h-4" />,
      description: 'Ajuste fino do balanço de cores RGB',
      tags: ['color', 'balance', 'rgb'],
      parameters: [
        { id: 'red', name: 'Vermelho', type: 'slider', min: -100, max: 100, step: 1, defaultValue: 0, unit: '%' },
        { id: 'green', name: 'Verde', type: 'slider', min: -100, max: 100, step: 1, defaultValue: 0, unit: '%' },
        { id: 'blue', name: 'Azul', type: 'slider', min: -100, max: 100, step: 1, defaultValue: 0, unit: '%' }
      ]
    },
    
    // Efeitos de Desfoque
    {
      id: 'gaussian-blur',
      name: 'Desfoque Gaussiano',
      category: 'blur',
      icon: <Blur className="w-4 h-4" />,
      description: 'Desfoque suave e uniforme',
      tags: ['blur', 'gaussian', 'smooth'],
      parameters: [
        { id: 'radius', name: 'Raio', type: 'slider', min: 0, max: 50, step: 0.1, defaultValue: 5, unit: 'px' }
      ]
    },
    {
      id: 'motion-blur',
      name: 'Desfoque de Movimento',
      category: 'blur',
      icon: <Wind className="w-4 h-4" />,
      description: 'Simula movimento com desfoque direcional',
      tags: ['blur', 'motion', 'speed'],
      parameters: [
        { id: 'angle', name: 'Ângulo', type: 'slider', min: 0, max: 360, step: 1, defaultValue: 0, unit: '°' },
        { id: 'distance', name: 'Distância', type: 'slider', min: 0, max: 100, step: 1, defaultValue: 10, unit: 'px' }
      ]
    },
    {
      id: 'radial-blur',
      name: 'Desfoque Radial',
      category: 'blur',
      icon: <Target className="w-4 h-4" />,
      description: 'Desfoque circular a partir de um ponto central',
      tags: ['blur', 'radial', 'circular'],
      parameters: [
        { id: 'amount', name: 'Intensidade', type: 'slider', min: 0, max: 100, step: 1, defaultValue: 20, unit: '%' },
        { id: 'centerX', name: 'Centro X', type: 'slider', min: 0, max: 100, step: 1, defaultValue: 50, unit: '%' },
        { id: 'centerY', name: 'Centro Y', type: 'slider', min: 0, max: 100, step: 1, defaultValue: 50, unit: '%' }
      ]
    },

    // Efeitos Artísticos
    {
      id: 'vintage-film',
      name: 'Filme Vintage',
      category: 'vintage',
      icon: <Film className="w-4 h-4" />,
      description: 'Efeito de filme antigo com grão e vinheta',
      tags: ['vintage', 'film', 'retro'],
      parameters: [
        { id: 'grain', name: 'Grão', type: 'slider', min: 0, max: 100, step: 1, defaultValue: 30, unit: '%' },
        { id: 'vignette', name: 'Vinheta', type: 'slider', min: 0, max: 100, step: 1, defaultValue: 40, unit: '%' },
        { id: 'sepia', name: 'Sépia', type: 'slider', min: 0, max: 100, step: 1, defaultValue: 50, unit: '%' }
      ]
    },
    {
      id: 'neon-glow',
      name: 'Brilho Neon',
      category: 'modern',
      icon: <Zap className="w-4 h-4" />,
      description: 'Efeito de brilho neon vibrante',
      tags: ['modern', 'neon', 'glow'],
      isPremium: true,
      parameters: [
        { id: 'intensity', name: 'Intensidade', type: 'slider', min: 0, max: 100, step: 1, defaultValue: 60, unit: '%' },
        { id: 'color', name: 'Cor', type: 'color', defaultValue: '#00ffff' },
        { id: 'spread', name: 'Espalhamento', type: 'slider', min: 1, max: 20, step: 1, defaultValue: 5, unit: 'px' }
      ]
    },
    {
      id: 'oil-painting',
      name: 'Pintura a Óleo',
      category: 'artistic',
      icon: <Paintbrush className="w-4 h-4" />,
      description: 'Transforma vídeo em estilo pintura a óleo',
      tags: ['artistic', 'painting', 'oil'],
      parameters: [
        { id: 'brushSize', name: 'Tamanho do Pincel', type: 'slider', min: 1, max: 20, step: 1, defaultValue: 5, unit: 'px' },
        { id: 'smoothness', name: 'Suavidade', type: 'slider', min: 0, max: 100, step: 1, defaultValue: 70, unit: '%' }
      ]
    },

    // Efeitos de Iluminação
    {
      id: 'light-rays',
      name: 'Raios de Luz',
      category: 'lighting',
      icon: <Sunrise className="w-4 h-4" />,
      description: 'Adiciona raios de luz volumétricos',
      tags: ['lighting', 'rays', 'dramatic'],
      isPremium: true,
      parameters: [
        { id: 'intensity', name: 'Intensidade', type: 'slider', min: 0, max: 100, step: 1, defaultValue: 50, unit: '%' },
        { id: 'angle', name: 'Ângulo', type: 'slider', min: 0, max: 360, step: 1, defaultValue: 45, unit: '°' },
        { id: 'sourceX', name: 'Origem X', type: 'slider', min: 0, max: 100, step: 1, defaultValue: 25, unit: '%' },
        { id: 'sourceY', name: 'Origem Y', type: 'slider', min: 0, max: 100, step: 1, defaultValue: 25, unit: '%' }
      ]
    },
    {
      id: 'lens-flare',
      name: 'Lens Flare',
      category: 'lighting',
      icon: <Lightbulb className="w-4 h-4" />,
      description: 'Efeito de reflexo de lente',
      tags: ['lighting', 'lens', 'flare'],
      parameters: [
        { id: 'brightness', name: 'Brilho', type: 'slider', min: 0, max: 200, step: 1, defaultValue: 100, unit: '%' },
        { id: 'flareType', name: 'Tipo', type: 'select', defaultValue: 'standard', options: ['standard', 'anamorphic', 'vintage'] }
      ]
    },

    // Efeitos de Distorção
    {
      id: 'wave-distortion',
      name: 'Distorção de Onda',
      category: 'distortion',
      icon: <Waves className="w-4 h-4" />,
      description: 'Distorção ondulatória da imagem',
      tags: ['distortion', 'wave', 'wavy'],
      parameters: [
        { id: 'amplitude', name: 'Amplitude', type: 'slider', min: 0, max: 50, step: 1, defaultValue: 10, unit: 'px' },
        { id: 'frequency', name: 'Frequência', type: 'slider', min: 0.1, max: 5, step: 0.1, defaultValue: 1, unit: 'Hz' },
        { id: 'direction', name: 'Direção', type: 'select', defaultValue: 'horizontal', options: ['horizontal', 'vertical', 'both'] }
      ]
    },
    {
      id: 'glitch-digital',
      name: 'Glitch Digital',
      category: 'distortion',
      icon: <Zap className="w-4 h-4" />,
      description: 'Efeito de falha digital',
      tags: ['distortion', 'glitch', 'digital'],
      isPremium: true,
      parameters: [
        { id: 'intensity', name: 'Intensidade', type: 'slider', min: 0, max: 100, step: 1, defaultValue: 30, unit: '%' },
        { id: 'speed', name: 'Velocidade', type: 'slider', min: 0.1, max: 10, step: 0.1, defaultValue: 2, unit: 'fps' },
        { id: 'colorShift', name: 'Deslocamento de Cor', type: 'checkbox', defaultValue: true }
      ]
    }
  ], []);

  // Biblioteca de transições
  const transitionsLibrary: Transition[] = useMemo(() => [
    {
      id: 'fade-in-out',
      name: 'Fade In/Out',
      type: 'fade',
      duration: 1,
      easing: 'ease-in-out',
      icon: <Eye className="w-4 h-4" />,
      parameters: { opacity: { start: 0, end: 1 } }
    },
    {
      id: 'slide-left',
      name: 'Deslizar Esquerda',
      type: 'slide',
      duration: 0.8,
      easing: 'ease-out',
      icon: <Move className="w-4 h-4" />,
      parameters: { direction: 'left', distance: 100 }
    },
    {
      id: 'zoom-in',
      name: 'Zoom In',
      type: 'zoom',
      duration: 1.2,
      easing: 'ease-in-out',
      icon: <Maximize className="w-4 h-4" />,
      parameters: { scale: { start: 0.8, end: 1 } }
    },
    {
      id: 'rotate-360',
      name: 'Rotação 360°',
      type: 'rotate',
      duration: 2,
      easing: 'linear',
      icon: <RotateCw className="w-4 h-4" />,
      parameters: { angle: 360 }
    }
  ], []);

  // Categorias de efeitos
  const categories = [
    { id: 'all', name: 'Todos', icon: <Grid3X3 className="w-4 h-4" /> },
    { id: 'color', name: 'Cor', icon: <Palette className="w-4 h-4" /> },
    { id: 'blur', name: 'Desfoque', icon: <Blur className="w-4 h-4" /> },
    { id: 'artistic', name: 'Artístico', icon: <Paintbrush className="w-4 h-4" /> },
    { id: 'lighting', name: 'Iluminação', icon: <Lightbulb className="w-4 h-4" /> },
    { id: 'distortion', name: 'Distorção', icon: <Waves className="w-4 h-4" /> },
    { id: 'vintage', name: 'Vintage', icon: <Film className="w-4 h-4" /> },
    { id: 'modern', name: 'Moderno', icon: <Zap className="w-4 h-4" /> },
    { id: 'cinematic', name: 'Cinemático', icon: <Camera className="w-4 h-4" /> }
  ];

  // Filtrar efeitos
  const filteredEffects = useMemo(() => {
    return effectsLibrary.filter(effect => {
      const matchesCategory = selectedCategory === 'all' || effect.category === selectedCategory;
      const matchesSearch = effect.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           effect.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchesCategory && matchesSearch;
    });
  }, [effectsLibrary, selectedCategory, searchTerm]);

  // Aplicar efeito
  const handleEffectApply = useCallback((effect: Effect) => {
    const appliedEffect: AppliedEffect = {
      id: `applied-${Date.now()}`,
      effectId: effect.id,
      name: effect.name,
      parameters: effect.parameters.reduce((acc, param) => {
        acc[param.id] = param.defaultValue;
        return acc;
      }, {} as Record<string, any>),
      opacity: 100,
      blendMode: 'normal',
      enabled: true
    };

    setAppliedEffects(prev => [...prev, appliedEffect]);
    onEffectApply(appliedEffect);
  }, [onEffectApply]);

  // Remover efeito
  const handleEffectRemove = useCallback((effectId: string) => {
    setAppliedEffects(prev => prev.filter(e => e.id !== effectId));
    onEffectRemove(effectId);
  }, [onEffectRemove]);

  // Alternar favorito
  const toggleFavorite = useCallback((effectId: string) => {
    setFavorites(prev => 
      prev.includes(effectId) 
        ? prev.filter(id => id !== effectId)
        : [...prev, effectId]
    );
  }, []);

  // Componente de parâmetro de efeito
  const EffectParameter: React.FC<{ 
    parameter: EffectParameter; 
    value: any; 
    onChange: (value: any) => void 
  }> = ({ parameter, value, onChange }) => {
    switch (parameter.type) {
      case 'slider':
        return (
          <div className="space-y-2">
            <label className="text-sm text-gray-300">{parameter.name}</label>
            <div className="flex items-center space-x-2">
              <Slider
                value={[value]}
                onValueChange={(vals) => onChange(vals[0])}
                min={parameter.min}
                max={parameter.max}
                step={parameter.step}
                className="flex-1"
              />
              <span className="text-xs text-gray-400 w-16 text-right">
                {value}{parameter.unit}
              </span>
            </div>
          </div>
        );

      case 'color':
        return (
          <div className="space-y-2">
            <label className="text-sm text-gray-300">{parameter.name}</label>
            <div className="flex items-center space-x-2">
              <input
                type="color"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-8 h-8 rounded border border-gray-600"
              />
              <Input
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="flex-1 bg-gray-700 border-gray-600 text-white"
              />
            </div>
          </div>
        );

      case 'select':
        return (
          <div className="space-y-2">
            <label className="text-sm text-gray-300">{parameter.name}</label>
            <select
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
            >
              {parameter.options?.map(option => (
                <option key={option} value={option}>
                  {option.charAt(0).toUpperCase() + option.slice(1)}
                </option>
              ))}
            </select>
          </div>
        );

      case 'checkbox':
        return (
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={value}
              onChange={(e) => onChange(e.target.checked)}
              className="rounded border-gray-600"
            />
            <label className="text-sm text-gray-300">{parameter.name}</label>
          </div>
        );

      case 'number':
        return (
          <div className="space-y-2">
            <label className="text-sm text-gray-300">{parameter.name}</label>
            <Input
              type="number"
              value={value}
              onChange={(e) => onChange(Number(e.target.value))}
              min={parameter.min}
              max={parameter.max}
              step={parameter.step}
              className="bg-gray-700 border-gray-600 text-white"
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={`flex flex-col h-full bg-gray-900 ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <h2 className="text-lg font-semibold text-white mb-4">Efeitos e Transições</h2>
        
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList className="grid w-full grid-cols-3 bg-gray-800">
            <TabsTrigger value="effects" className="text-sm">Efeitos</TabsTrigger>
            <TabsTrigger value="transitions" className="text-sm">Transições</TabsTrigger>
            <TabsTrigger value="presets" className="text-sm">Presets</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="flex-1 overflow-hidden">
        <Tabs value={activeTab} className="h-full">
          {/* Painel de Efeitos */}
          <TabsContent value="effects" className="h-full p-0">
            <div className="flex h-full">
              {/* Lista de efeitos */}
              <div className="w-1/2 border-r border-gray-700 flex flex-col">
                {/* Filtros e busca */}
                <div className="p-4 border-b border-gray-700 space-y-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Buscar efeitos..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 bg-gray-800 border-gray-600 text-white"
                    />
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {categories.map(category => (
                      <Button
                        key={category.id}
                        variant={selectedCategory === category.id ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedCategory(category.id as any)}
                        className={`text-xs ${
                          selectedCategory === category.id 
                            ? "bg-blue-600 border-blue-500" 
                            : "bg-gray-700 border-gray-600"
                        }`}
                      >
                        {category.icon}
                        <span className="ml-1">{category.name}</span>
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Lista de efeitos */}
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                  {filteredEffects.map(effect => (
                    <Card 
                      key={effect.id} 
                      className={`cursor-pointer transition-all hover:bg-gray-700 ${
                        selectedEffect?.id === effect.id ? 'ring-2 ring-blue-500' : ''
                      } bg-gray-800 border-gray-700`}
                      onClick={() => setSelectedEffect(effect)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            {effect.icon}
                            <div>
                              <h4 className="text-sm font-medium text-white">{effect.name}</h4>
                              <p className="text-xs text-gray-400">{effect.description}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-1">
                            {effect.isPremium && (
                              <Badge variant="secondary" className="text-xs bg-yellow-600">
                                Premium
                              </Badge>
                            )}
                            
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleFavorite(effect.id);
                              }}
                              className="p-1 h-6 w-6"
                            >
                              <Heart 
                                className={`w-3 h-3 ${
                                  favorites.includes(effect.id) 
                                    ? 'fill-red-500 text-red-500' 
                                    : 'text-gray-400'
                                }`} 
                              />
                            </Button>
                            
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEffectApply(effect);
                              }}
                              className="bg-gray-700 border-gray-600 h-6 px-2 text-xs"
                            >
                              <Plus className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Painel de parâmetros */}
              <div className="w-1/2 flex flex-col">
                {selectedEffect ? (
                  <div className="flex-1 p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium text-white">{selectedEffect.name}</h3>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEffectApply(selectedEffect)}
                        className="bg-blue-600 border-blue-500"
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Aplicar
                      </Button>
                    </div>

                    <p className="text-sm text-gray-400">{selectedEffect.description}</p>

                    <div className="space-y-4">
                      {selectedEffect.parameters.map(parameter => (
                        <EffectParameter
                          key={parameter.id}
                          parameter={parameter}
                          value={parameter.defaultValue}
                          onChange={(value) => {
                            // Aqui você pode implementar preview em tempo real
                            console.log(`Parameter ${parameter.id} changed to:`, value);
                          }}
                        />
                      ))}
                    </div>

                    {previewEnabled && (
                      <div className="mt-6">
                        <div className="aspect-video bg-gray-800 rounded border border-gray-700 flex items-center justify-center">
                          <div className="text-center text-gray-400">
                            <Eye className="w-8 h-8 mx-auto mb-2" />
                            <p className="text-sm">Preview do Efeito</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center text-gray-400">
                      <Wand2 className="w-12 h-12 mx-auto mb-4" />
                      <p>Selecione um efeito para visualizar os parâmetros</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Painel de Transições */}
          <TabsContent value="transitions" className="h-full p-4">
            <div className="grid grid-cols-2 gap-4">
              {transitionsLibrary.map(transition => (
                <Card 
                  key={transition.id}
                  className="cursor-pointer hover:bg-gray-700 bg-gray-800 border-gray-700"
                  onClick={() => onTransitionApply(transition)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      {transition.icon}
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-white">{transition.name}</h4>
                        <p className="text-xs text-gray-400">
                          {transition.duration}s • {transition.easing}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-gray-700 border-gray-600"
                      >
                        <Play className="w-3 h-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Painel de Presets */}
          <TabsContent value="presets" className="h-full p-4">
            <div className="text-center text-gray-400">
              <Settings className="w-12 h-12 mx-auto mb-4" />
              <p>Presets personalizados em desenvolvimento</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Efeitos aplicados */}
      {appliedEffects.length > 0 && (
        <div className="border-t border-gray-700 p-4">
          <h3 className="text-sm font-medium text-white mb-3">Efeitos Aplicados</h3>
          <div className="space-y-2">
            {appliedEffects.map(effect => (
              <div 
                key={effect.id}
                className="flex items-center justify-between p-2 bg-gray-800 rounded border border-gray-700"
              >
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={effect.enabled}
                    onChange={(e) => {
                      const updated = appliedEffects.map(ae => 
                        ae.id === effect.id ? { ...ae, enabled: e.target.checked } : ae
                      );
                      setAppliedEffects(updated);
                    }}
                    className="rounded"
                  />
                  <span className="text-sm text-white">{effect.name}</span>
                  <Badge variant="outline" className="text-xs">
                    {effect.opacity}%
                  </Badge>
                </div>
                
                <div className="flex items-center space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="p-1 h-6 w-6"
                  >
                    <Settings className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEffectRemove(effect.id)}
                    className="p-1 h-6 w-6 text-red-400 hover:text-red-300"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedEffectsTransitionsSystem;