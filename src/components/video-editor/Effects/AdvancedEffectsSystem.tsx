import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { Card } from '../../ui/card';
import { Button } from '../../ui/button';
import { Slider } from '../../ui/slider';
import { Badge } from '../../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
import { Input } from '../../ui/input';
import { 
  Palette,
  Zap,
  Volume2,
  Eye,
  Layers,
  Settings,
  Play,
  Pause,
  RotateCw,
  Filter,
  Sparkles,
  Waves,
  Circle,
  Square,
  Triangle,
  Star,
  Sun,
  Moon,
  Droplets,
  Wind,
  Image,
  Music,
  Mic,
  Video,
  Type,
  Plus,
  Minus,
  Copy,
  Trash2,
  Download,
  Upload,
  Save,
  FolderOpen,
  Search,
  Grid3X3,
  Sliders,
  Clock,
  Target,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  MoreHorizontal,
  Maximize2,
  Minimize2
} from 'lucide-react';

// Types para Sistema de Efeitos
interface Effect {
  id: string;
  name: string;
  category: EffectCategory;
  type: 'video' | 'audio' | 'transition';
  description: string;
  icon: string;
  parameters: EffectParameter[];
  presets: EffectPreset[];
  gpuAccelerated: boolean;
  realTimePreview: boolean;
  keyframeSupport: boolean;
}

interface EffectParameter {
  id: string;
  name: string;
  type: 'number' | 'color' | 'boolean' | 'select' | 'vector2' | 'vector3';
  value: any;
  defaultValue: any;
  min?: number;
  max?: number;
  step?: number;
  options?: { label: string; value: any }[];
  animatable: boolean;
  group?: string;
}

interface EffectPreset {
  id: string;
  name: string;
  description: string;
  thumbnail?: string;
  parameters: Record<string, any>;
  tags: string[];
}

interface AppliedEffect {
  id: string;
  effectId: string;
  itemId: string;
  enabled: boolean;
  parameters: Record<string, any>;
  keyframes: Keyframe[];
  blendMode: 'normal' | 'multiply' | 'screen' | 'overlay' | 'softLight' | 'hardLight';
  opacity: number;
  mask?: EffectMask;
}

interface Keyframe {
  id: string;
  time: number;
  parameterId: string;
  value: any;
  interpolation: 'linear' | 'bezier' | 'step' | 'ease' | 'easeIn' | 'easeOut';
  handles?: {
    leftX: number;
    leftY: number;
    rightX: number;
    rightY: number;
  };
}

interface EffectMask {
  type: 'rectangle' | 'ellipse' | 'polygon' | 'path';
  points: { x: number; y: number }[];
  feather: number;
  invert: boolean;
}

interface EffectStack {
  itemId: string;
  effects: AppliedEffect[];
}

type EffectCategory = 
  | 'colorCorrection'
  | 'blur'
  | 'distortion' 
  | 'stylize'
  | 'audioFilter'
  | 'audioEffects'
  | 'transition'
  | 'generator'
  | 'composite'
  | 'custom';

interface AdvancedEffectsSystemProps {
  selectedItemId?: string;
  onEffectApply?: (effect: Effect, itemId: string) => void;
  onEffectRemove?: (effectId: string, itemId: string) => void;
  onParameterChange?: (effectId: string, parameterId: string, value: any) => void;
  effectStacks?: EffectStack[];
  currentTime?: number;
}

export const AdvancedEffectsSystem: React.FC<AdvancedEffectsSystemProps> = ({
  selectedItemId,
  onEffectApply,
  onEffectRemove,
  onParameterChange,
  effectStacks = [],
  currentTime = 0
}) => {
  // Estados
  const [activeCategory, setActiveCategory] = useState<EffectCategory>('colorCorrection');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEffect, setSelectedEffect] = useState<Effect | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<EffectPreset | null>(null);
  const [previewEnabled, setPreviewEnabled] = useState(true);
  const [showKeyframes, setShowKeyframes] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['transform']));

  // Refs
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const keyframeCanvasRef = useRef<HTMLCanvasElement>(null);

  // Effect Library - Simulação de biblioteca de efeitos
  const effectLibrary: Effect[] = useMemo(() => [
    // Color Correction
    {
      id: 'brightness_contrast',
      name: 'Brilho e Contraste',
      category: 'colorCorrection',
      type: 'video',
      description: 'Ajusta brilho e contraste da imagem',
      icon: '☀️',
      gpuAccelerated: true,
      realTimePreview: true,
      keyframeSupport: true,
      parameters: [
        {
          id: 'brightness',
          name: 'Brilho',
          type: 'number',
          value: 0,
          defaultValue: 0,
          min: -100,
          max: 100,
          step: 1,
          animatable: true,
          group: 'basic'
        },
        {
          id: 'contrast',
          name: 'Contraste',
          type: 'number',
          value: 0,
          defaultValue: 0,
          min: -100,
          max: 100,
          step: 1,
          animatable: true,
          group: 'basic'
        }
      ],
      presets: [
        {
          id: 'high_contrast',
          name: 'Alto Contraste',
          description: 'Aumenta contraste para mais impacto',
          parameters: { brightness: 10, contrast: 25 },
          tags: ['dramatic', 'bold']
        },
        {
          id: 'soft_look',
          name: 'Visual Suave',
          description: 'Look suave e cinematográfico',
          parameters: { brightness: 5, contrast: -10 },
          tags: ['cinematic', 'soft']
        }
      ]
    },
    {
      id: 'color_balance',
      name: 'Balance de Cor',
      category: 'colorCorrection',
      type: 'video',
      description: 'Ajusta balance de cores em shadows, midtones e highlights',
      icon: '🎨',
      gpuAccelerated: true,
      realTimePreview: true,
      keyframeSupport: true,
      parameters: [
        {
          id: 'shadows_cyan_red',
          name: 'Shadows Cyan-Red',
          type: 'number',
          value: 0,
          defaultValue: 0,
          min: -100,
          max: 100,
          step: 1,
          animatable: true,
          group: 'shadows'
        },
        {
          id: 'shadows_magenta_green',
          name: 'Shadows Magenta-Green',
          type: 'number',
          value: 0,
          defaultValue: 0,
          min: -100,
          max: 100,
          step: 1,
          animatable: true,
          group: 'shadows'
        },
        {
          id: 'midtones_cyan_red',
          name: 'Midtones Cyan-Red',
          type: 'number',
          value: 0,
          defaultValue: 0,
          min: -100,
          max: 100,
          step: 1,
          animatable: true,
          group: 'midtones'
        },
        {
          id: 'highlights_cyan_red',
          name: 'Highlights Cyan-Red',
          type: 'number',
          value: 0,
          defaultValue: 0,
          min: -100,
          max: 100,
          step: 1,
          animatable: true,
          group: 'highlights'
        }
      ],
      presets: [
        {
          id: 'warm_tone',
          name: 'Tom Quente',
          description: 'Adiciona calor à imagem',
          parameters: { 
            shadows_cyan_red: -20, 
            midtones_cyan_red: -15,
            highlights_cyan_red: -10
          },
          tags: ['warm', 'sunset']
        },
        {
          id: 'cool_tone',
          name: 'Tom Frio',
          description: 'Look mais frio e moderno',
          parameters: { 
            shadows_cyan_red: 15, 
            midtones_cyan_red: 10,
            highlights_cyan_red: 5
          },
          tags: ['cool', 'modern']
        }
      ]
    },

    // Blur Effects
    {
      id: 'gaussian_blur',
      name: 'Gaussian Blur',
      category: 'blur',
      type: 'video',
      description: 'Blur gaussiano suave e natural',
      icon: '🌫️',
      gpuAccelerated: true,
      realTimePreview: true,
      keyframeSupport: true,
      parameters: [
        {
          id: 'radius',
          name: 'Raio',
          type: 'number',
          value: 0,
          defaultValue: 0,
          min: 0,
          max: 100,
          step: 0.1,
          animatable: true,
          group: 'basic'
        },
        {
          id: 'quality',
          name: 'Qualidade',
          type: 'select',
          value: 'high',
          defaultValue: 'high',
          options: [
            { label: 'Baixa', value: 'low' },
            { label: 'Média', value: 'medium' },
            { label: 'Alta', value: 'high' }
          ],
          animatable: false,
          group: 'advanced'
        }
      ],
      presets: [
        {
          id: 'subtle_blur',
          name: 'Blur Sutil',
          description: 'Blur suave para efeito dreamy',
          parameters: { radius: 2, quality: 'high' },
          tags: ['subtle', 'dreamy']
        },
        {
          id: 'background_blur',
          name: 'Blur de Fundo',
          description: 'Blur forte para separar foreground',
          parameters: { radius: 15, quality: 'medium' },
          tags: ['background', 'separation']
        }
      ]
    },

    // Audio Effects
    {
      id: 'equalizer',
      name: 'Equalizador',
      category: 'audioEffects',
      type: 'audio',
      description: 'Equalizador de 10 bandas',
      icon: '🎚️',
      gpuAccelerated: false,
      realTimePreview: true,
      keyframeSupport: true,
      parameters: [
        {
          id: 'band_31hz',
          name: '31 Hz',
          type: 'number',
          value: 0,
          defaultValue: 0,
          min: -20,
          max: 20,
          step: 0.1,
          animatable: true,
          group: 'low'
        },
        {
          id: 'band_62hz',
          name: '62 Hz',
          type: 'number',
          value: 0,
          defaultValue: 0,
          min: -20,
          max: 20,
          step: 0.1,
          animatable: true,
          group: 'low'
        },
        {
          id: 'band_125hz',
          name: '125 Hz',
          type: 'number',
          value: 0,
          defaultValue: 0,
          min: -20,
          max: 20,
          step: 0.1,
          animatable: true,
          group: 'low'
        },
        {
          id: 'band_1khz',
          name: '1 kHz',
          type: 'number',
          value: 0,
          defaultValue: 0,
          min: -20,
          max: 20,
          step: 0.1,
          animatable: true,
          group: 'mid'
        },
        {
          id: 'band_8khz',
          name: '8 kHz',
          type: 'number',
          value: 0,
          defaultValue: 0,
          min: -20,
          max: 20,
          step: 0.1,
          animatable: true,
          group: 'high'
        }
      ],
      presets: [
        {
          id: 'voice_enhance',
          name: 'Voice Enhancement',
          description: 'Melhora clareza da voz',
          parameters: { 
            band_125hz: -3,
            band_1khz: 2,
            band_8khz: 3
          },
          tags: ['voice', 'clarity']
        },
        {
          id: 'music_boost',
          name: 'Music Boost',
          description: 'Realça música e graves',
          parameters: { 
            band_31hz: 4,
            band_62hz: 3,
            band_8khz: 2
          },
          tags: ['music', 'bass']
        }
      ]
    },

    // Stylize Effects
    {
      id: 'film_grain',
      name: 'Film Grain',
      category: 'stylize',
      type: 'video',
      description: 'Adiciona textura de grão de filme',
      icon: '📽️',
      gpuAccelerated: true,
      realTimePreview: true,
      keyframeSupport: true,
      parameters: [
        {
          id: 'intensity',
          name: 'Intensidade',
          type: 'number',
          value: 50,
          defaultValue: 50,
          min: 0,
          max: 100,
          step: 1,
          animatable: true,
          group: 'basic'
        },
        {
          id: 'size',
          name: 'Tamanho do Grão',
          type: 'number',
          value: 1,
          defaultValue: 1,
          min: 0.5,
          max: 3,
          step: 0.1,
          animatable: true,
          group: 'basic'
        },
        {
          id: 'color_variation',
          name: 'Variação de Cor',
          type: 'number',
          value: 25,
          defaultValue: 25,
          min: 0,
          max: 100,
          step: 1,
          animatable: true,
          group: 'advanced'
        }
      ],
      presets: [
        {
          id: 'vintage_16mm',
          name: '16mm Vintage',
          description: 'Grão de filme 16mm clássico',
          parameters: { intensity: 75, size: 1.5, color_variation: 40 },
          tags: ['vintage', '16mm', 'classic']
        },
        {
          id: 'modern_grain',
          name: 'Grão Moderno',
          description: 'Grão sutil para look contemporâneo',
          parameters: { intensity: 25, size: 0.8, color_variation: 15 },
          tags: ['modern', 'subtle']
        }
      ]
    }
  ], []);

  // Categories
  const categories = useMemo(() => [
    { id: 'colorCorrection' as EffectCategory, name: 'Color Correction', icon: <Palette className="w-4 h-4" /> },
    { id: 'blur' as EffectCategory, name: 'Blur & Sharpen', icon: <Circle className="w-4 h-4" /> },
    { id: 'distortion' as EffectCategory, name: 'Distortion', icon: <Waves className="w-4 h-4" /> },
    { id: 'stylize' as EffectCategory, name: 'Stylize', icon: <Sparkles className="w-4 h-4" /> },
    { id: 'audioFilter' as EffectCategory, name: 'Audio Filter', icon: <Volume2 className="w-4 h-4" /> },
    { id: 'audioEffects' as EffectCategory, name: 'Audio Effects', icon: <Music className="w-4 h-4" /> },
    { id: 'transition' as EffectCategory, name: 'Transitions', icon: <RotateCw className="w-4 h-4" /> },
    { id: 'generator' as EffectCategory, name: 'Generators', icon: <Zap className="w-4 h-4" /> },
    { id: 'custom' as EffectCategory, name: 'Custom', icon: <Settings className="w-4 h-4" /> }
  ], []);

  // Filtered effects
  const filteredEffects = useMemo(() => {
    return effectLibrary.filter(effect => {
      const matchesCategory = effect.category === activeCategory;
      const matchesSearch = effect.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           effect.description.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && (searchTerm === '' || matchesSearch);
    });
  }, [effectLibrary, activeCategory, searchTerm]);

  // Current effect stack
  const currentStack = useMemo(() => {
    return effectStacks.find(stack => stack.itemId === selectedItemId);
  }, [effectStacks, selectedItemId]);

  // Handle effect application
  const handleApplyEffect = useCallback((effect: Effect) => {
    if (!selectedItemId) return;
    
    onEffectApply?.(effect, selectedItemId);
    setSelectedEffect(effect);
  }, [selectedItemId, onEffectApply]);

  // Handle parameter change
  const handleParameterChange = useCallback((effectId: string, parameterId: string, value: any) => {
    onParameterChange?.(effectId, parameterId, value);
  }, [onParameterChange]);

  // Handle preset application
  const handleApplyPreset = useCallback((preset: EffectPreset) => {
    if (!selectedEffect || !selectedItemId) return;

    Object.entries(preset.parameters).forEach(([parameterId, value]) => {
      handleParameterChange(selectedEffect.id, parameterId, value);
    });

    setSelectedPreset(preset);
  }, [selectedEffect, selectedItemId, handleParameterChange]);

  // Render parameter control
  const renderParameterControl = (parameter: EffectParameter, effectId: string) => {
    const value = parameter.value;

    switch (parameter.type) {
      case 'number':
        return (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">{parameter.name}</label>
              <Input
                type="number"
                value={value}
                onChange={(e) => handleParameterChange(effectId, parameter.id, parseFloat(e.target.value))}
                className="w-20 h-8 text-xs"
                min={parameter.min}
                max={parameter.max}
                step={parameter.step}
              />
            </div>
            <Slider
              value={[value]}
              min={parameter.min}
              max={parameter.max}
              step={parameter.step}
              onValueChange={([newValue]) => handleParameterChange(effectId, parameter.id, newValue)}
              className="w-full"
            />
          </div>
        );

      case 'color':
        return (
          <div className="space-y-2">
            <label className="text-sm font-medium">{parameter.name}</label>
            <div className="flex items-center space-x-2">
              <input
                type="color"
                value={value}
                onChange={(e) => handleParameterChange(effectId, parameter.id, e.target.value)}
                className="w-8 h-8 rounded border border-gray-600"
              />
              <Input
                type="text"
                value={value}
                onChange={(e) => handleParameterChange(effectId, parameter.id, e.target.value)}
                className="flex-1 h-8 text-xs"
              />
            </div>
          </div>
        );

      case 'boolean':
        return (
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">{parameter.name}</label>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleParameterChange(effectId, parameter.id, !value)}
              className={value ? 'bg-blue-600' : ''}
            >
              {value ? 'On' : 'Off'}
            </Button>
          </div>
        );

      case 'select':
        return (
          <div className="space-y-2">
            <label className="text-sm font-medium">{parameter.name}</label>
            <select
              value={value}
              onChange={(e) => handleParameterChange(effectId, parameter.id, e.target.value)}
              className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-sm"
            >
              {parameter.options?.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        );

      default:
        return null;
    }
  };

  // Group parameters
  const groupedParameters = useMemo(() => {
    if (!selectedEffect) return {};

    return selectedEffect.parameters.reduce((groups, param) => {
      const group = param.group || 'other';
      if (!groups[group]) groups[group] = [];
      groups[group].push(param);
      return groups;
    }, {} as Record<string, EffectParameter[]>);
  }, [selectedEffect]);

  // Render keyframe timeline
  const renderKeyframeTimeline = () => {
    if (!showKeyframes || !selectedEffect) return null;

    return (
      <div className="mt-4 p-4 bg-gray-800 rounded-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium">Keyframes</h3>
          <div className="flex items-center space-x-2">
            <Button size="sm" variant="outline">
              <Plus className="w-4 h-4 mr-1" />
              Add Key
            </Button>
            <Button size="sm" variant="outline">
              <Trash2 className="w-4 h-4 mr-1" />
              Delete
            </Button>
          </div>
        </div>
        
        <canvas
          ref={keyframeCanvasRef}
          className="w-full h-20 bg-gray-900 rounded border border-gray-600"
        />
      </div>
    );
  };

  return (
    <div className="h-full bg-gray-900 text-white overflow-hidden">
      <Tabs defaultValue="browser" className="h-full flex flex-col">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="browser">Biblioteca</TabsTrigger>
          <TabsTrigger value="applied">Aplicados</TabsTrigger>
          <TabsTrigger value="presets">Presets</TabsTrigger>
          <TabsTrigger value="custom">Custom</TabsTrigger>
        </TabsList>

        {/* Effect Browser */}
        <TabsContent value="browser" className="flex-1 flex flex-col overflow-hidden">
          {/* Search */}
          <div className="p-4 border-b border-gray-700">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Buscar efeitos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Categories */}
          <div className="p-4 border-b border-gray-700">
            <div className="grid grid-cols-3 gap-2">
              {categories.map(category => (
                <Button
                  key={category.id}
                  variant={activeCategory === category.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveCategory(category.id)}
                  className="flex items-center space-x-1 text-xs"
                >
                  {category.icon}
                  <span>{category.name}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Effects List */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-4 space-y-2">
              {filteredEffects.map(effect => (
                <Card
                  key={effect.id}
                  className="p-3 cursor-pointer hover:bg-gray-800 transition-colors"
                  onClick={() => handleApplyEffect(effect)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-lg">{effect.icon}</span>
                      <div>
                        <h3 className="font-medium text-sm">{effect.name}</h3>
                        <p className="text-xs text-gray-400">{effect.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1">
                      {effect.gpuAccelerated && (
                        <Badge variant="secondary" className="text-xs">GPU</Badge>
                      )}
                      {effect.keyframeSupport && (
                        <Badge variant="outline" className="text-xs">KEY</Badge>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* Applied Effects */}
        <TabsContent value="applied" className="flex-1 flex flex-col overflow-hidden">
          {!selectedItemId ? (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <Layers className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Selecione um item para ver efeitos aplicados</p>
              </div>
            </div>
          ) : !currentStack?.effects.length ? (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum efeito aplicado</p>
                <p className="text-sm">Adicione efeitos da biblioteca</p>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex">
              {/* Effects Stack */}
              <div className="w-1/3 border-r border-gray-700 overflow-y-auto">
                <div className="p-4">
                  <h3 className="font-medium mb-4">Stack de Efeitos</h3>
                  <div className="space-y-2">
                    {currentStack.effects.map((appliedEffect, index) => {
                      const effect = effectLibrary.find(e => e.id === appliedEffect.effectId);
                      if (!effect) return null;

                      return (
                        <Card
                          key={appliedEffect.id}
                          className={`p-3 cursor-pointer transition-colors ${
                            selectedEffect?.id === effect.id ? 'bg-blue-900 border-blue-600' : 'hover:bg-gray-800'
                          }`}
                          onClick={() => setSelectedEffect(effect)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <span className="text-sm">{effect.icon}</span>
                              <span className="text-sm font-medium">{effect.name}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // Toggle enabled
                                }}
                              >
                                {appliedEffect.enabled ? (
                                  <Eye className="w-3 h-3" />
                                ) : (
                                  <EyeOff className="w-3 h-3" />
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onEffectRemove?.(appliedEffect.id, selectedItemId);
                                }}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Effect Parameters */}
              <div className="flex-1 overflow-y-auto">
                {selectedEffect ? (
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h3 className="font-medium text-lg">{selectedEffect.name}</h3>
                        <p className="text-sm text-gray-400">{selectedEffect.description}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPreviewEnabled(!previewEnabled)}
                          className={previewEnabled ? 'bg-green-600' : ''}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Preview
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowKeyframes(!showKeyframes)}
                        >
                          <Clock className="w-4 h-4 mr-1" />
                          Keyframes
                        </Button>
                      </div>
                    </div>

                    {/* Parameter Groups */}
                    <div className="space-y-6">
                      {Object.entries(groupedParameters).map(([groupName, parameters]) => (
                        <div key={groupName}>
                          <Button
                            variant="ghost"
                            className="flex items-center space-x-2 text-sm font-medium mb-3 p-0"
                            onClick={() => {
                              const newExpanded = new Set(expandedGroups);
                              if (newExpanded.has(groupName)) {
                                newExpanded.delete(groupName);
                              } else {
                                newExpanded.add(groupName);
                              }
                              setExpandedGroups(newExpanded);
                            }}
                          >
                            {expandedGroups.has(groupName) ? (
                              <ChevronDown className="w-4 h-4" />
                            ) : (
                              <ChevronRight className="w-4 h-4" />
                            )}
                            <span className="capitalize">{groupName}</span>
                          </Button>
                          
                          {expandedGroups.has(groupName) && (
                            <div className="space-y-4 ml-6">
                              {parameters.map(parameter => (
                                <div key={parameter.id}>
                                  {renderParameterControl(parameter, selectedEffect.id)}
                                  {parameter.animatable && (
                                    <div className="flex items-center space-x-2 mt-2">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-xs"
                                      >
                                        <Plus className="w-3 h-3 mr-1" />
                                        Keyframe
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-xs"
                                      >
                                        <RotateCw className="w-3 h-3 mr-1" />
                                        Reset
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Keyframe Timeline */}
                    {renderKeyframeTimeline()}

                    {/* Effect Preview */}
                    {previewEnabled && (
                      <div className="mt-6">
                        <h4 className="font-medium mb-3">Preview</h4>
                        <canvas
                          ref={previewCanvasRef}
                          className="w-full h-40 bg-gray-800 rounded border border-gray-600"
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-gray-400">
                    <div className="text-center">
                      <Settings className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>Selecione um efeito para editar parâmetros</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </TabsContent>

        {/* Presets */}
        <TabsContent value="presets" className="flex-1 overflow-y-auto">
          <div className="p-4">
            {selectedEffect ? (
              <div>
                <h3 className="font-medium mb-4">Presets para {selectedEffect.name}</h3>
                <div className="grid grid-cols-2 gap-4">
                  {selectedEffect.presets.map(preset => (
                    <Card
                      key={preset.id}
                      className="p-4 cursor-pointer hover:bg-gray-800 transition-colors"
                      onClick={() => handleApplyPreset(preset)}
                    >
                      <h4 className="font-medium text-sm">{preset.name}</h4>
                      <p className="text-xs text-gray-400 mt-1">{preset.description}</p>
                      <div className="flex flex-wrap gap-1 mt-3">
                        {preset.tags.map(tag => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-400">
                <Star className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Selecione um efeito para ver presets disponíveis</p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Custom Effects */}
        <TabsContent value="custom" className="flex-1 overflow-y-auto">
          <div className="p-4">
            <div className="text-center text-gray-400">
              <Zap className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Custom Effects Builder</p>
              <p className="text-sm">Feature coming soon...</p>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdvancedEffectsSystem;