import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Search, 
  Sparkles, 
  Palette, 
  Zap, 
  Camera, 
  Volume2,
  Play,
  Download,
  Star,
  Filter,
  Settings
} from 'lucide-react';
import { TransitionsLibrary } from './TransitionsLibrary';
import { ParameterControls } from './ParameterControls';
import { EffectsSearch } from './EffectsSearch';
import { EffectsPresets } from './EffectsPresets';
import { useEffectDragDrop } from '../../hooks/useEffectDragDrop';
import { DragPreview } from './DragPreview';
import { useEffectParameters } from '@/hooks/useEffectParameters';

interface Effect {
  id: string;
  name: string;
  category: 'color' | 'blur' | 'distortion' | 'artistic' | 'correction';
  icon: React.ReactNode;
  description: string;
  parameters: EffectParameter[];
  preview: string;
  isPremium?: boolean;
}

interface Transition {
  id: string;
  name: string;
  category: 'fade' | 'slide' | 'zoom' | 'rotate' | 'special';
  icon: React.ReactNode;
  description: string;
  duration: number;
  preview: string;
  isPremium?: boolean;
}

interface EffectParameter {
  id: string;
  name: string;
  type: 'slider' | 'color' | 'select' | 'toggle';
  min?: number;
  max?: number;
  default: any;
  options?: string[];
}

interface AppliedEffect {
  id: string;
  effectId: string;
  name: string;
  parameters: Record<string, any>;
  enabled: boolean;
}

interface EffectsPanelProps {
  onEffectApply: (effect: Effect, parameters: Record<string, any>) => void;
  onTransitionApply: (transition: Transition) => void;
  onTransitionPreview: (transition: Transition) => void;
  onEffectRemove: (effectId: string) => void;
  appliedEffects: AppliedEffect[];
  selectedClipId?: string;
  selectedTransition?: Transition;
}

const EffectsPanel: React.FC<EffectsPanelProps> = ({
  onEffectApply,
  onTransitionApply,
  onTransitionPreview,
  onEffectRemove,
  appliedEffects,
  selectedClipId,
  selectedTransition
}) => {
  const [activeTab, setActiveTab] = useState('effects');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedEffect, setSelectedEffect] = useState<Effect | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  
  // Drag and Drop functionality
  const {
    draggedEffect,
    dropTarget,
    isDragging,
    startEffectDrag,
    endEffectDrag,
    updateDragPosition,
    getDropFeedback
  } = useEffectDragDrop();
  const [effectParameters, setEffectParameters] = useState<Record<string, any>>({});
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);
  const previewRef = useRef<HTMLVideoElement>(null);
  
  // Effect parameters hook
  const {
    currentEffect,
    parameterValues,
    isPreviewEnabled,
    selectEffect,
    changeParameter,
    applyPreset,
    resetParameters,
    savePreset,
    togglePreview,
    getAvailableEffects
  } = useEffectParameters();

  // Biblioteca de efeitos visuais
  const visualEffects: Effect[] = [
    {
      id: 'blur',
      name: 'Desfoque',
      category: 'blur',
      icon: <Blur className="w-4 h-4" />,
      description: 'Aplica desfoque gaussiano à imagem',
      preview: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=blur_effect_preview_video_editing&image_size=square',
      parameters: [
        {
          id: 'intensity',
          name: 'Intensidade',
          type: 'slider',
          min: 0,
          max: 100,
          default: 50
        },
        {
          id: 'type',
          name: 'Tipo',
          type: 'select',
          default: 'gaussian',
          options: ['gaussian', 'motion', 'radial']
        }
      ]
    },
    {
      id: 'sharpen',
      name: 'Nitidez',
      category: 'correction',
      icon: <Focus className="w-4 h-4" />,
      description: 'Aumenta a nitidez e definição da imagem',
      preview: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=sharpen_effect_preview_video_editing&image_size=square',
      parameters: [
        {
          id: 'amount',
          name: 'Quantidade',
          type: 'slider',
          min: 0,
          max: 200,
          default: 100
        },
        {
          id: 'radius',
          name: 'Raio',
          type: 'slider',
          min: 0.1,
          max: 5,
          default: 1
        }
      ]
    },
    {
      id: 'color-grading',
      name: 'Correção de Cor',
      category: 'color',
      icon: <Palette className="w-4 h-4" />,
      description: 'Ajusta cores, matiz e saturação',
      preview: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=color_grading_effect_preview_video&image_size=square',
      parameters: [
        {
          id: 'hue',
          name: 'Matiz',
          type: 'slider',
          min: -180,
          max: 180,
          default: 0
        },
        {
          id: 'saturation',
          name: 'Saturação',
          type: 'slider',
          min: -100,
          max: 100,
          default: 0
        },
        {
          id: 'lightness',
          name: 'Luminosidade',
          type: 'slider',
          min: -100,
          max: 100,
          default: 0
        }
      ]
    },
    {
      id: 'brightness-contrast',
      name: 'Brilho e Contraste',
      category: 'correction',
      icon: <Sun className="w-4 h-4" />,
      description: 'Ajusta brilho e contraste da imagem',
      preview: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=brightness_contrast_effect_preview&image_size=square',
      parameters: [
        {
          id: 'brightness',
          name: 'Brilho',
          type: 'slider',
          min: -100,
          max: 100,
          default: 0
        },
        {
          id: 'contrast',
          name: 'Contraste',
          type: 'slider',
          min: -100,
          max: 100,
          default: 0
        }
      ]
    },
    {
      id: 'saturation',
      name: 'Saturação',
      category: 'color',
      icon: <Droplets className="w-4 h-4" />,
      description: 'Controla a intensidade das cores',
      preview: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=saturation_effect_preview_video&image_size=square',
      parameters: [
        {
          id: 'amount',
          name: 'Quantidade',
          type: 'slider',
          min: -100,
          max: 200,
          default: 0
        }
      ]
    },
    {
      id: 'vignette',
      name: 'Vinheta',
      category: 'artistic',
      icon: <Moon className="w-4 h-4" />,
      description: 'Adiciona escurecimento nas bordas',
      preview: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=vignette_effect_preview_video_editing&image_size=square',
      parameters: [
        {
          id: 'intensity',
          name: 'Intensidade',
          type: 'slider',
          min: 0,
          max: 100,
          default: 50
        },
        {
          id: 'size',
          name: 'Tamanho',
          type: 'slider',
          min: 0,
          max: 100,
          default: 50
        },
        {
          id: 'feather',
          name: 'Suavização',
          type: 'slider',
          min: 0,
          max: 100,
          default: 50
        }
      ]
    }
  ];

  // Biblioteca de transições profissionais
  const transitions: Transition[] = [
    {
      id: 'fade',
      name: 'Fade',
      category: 'fade',
      icon: <Eye className="w-4 h-4" />,
      description: 'Transição suave de opacidade',
      duration: 1000,
      preview: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=fade_transition_preview_video&image_size=square'
    },
    {
      id: 'dissolve',
      name: 'Dissolve',
      category: 'fade',
      icon: <Droplets className="w-4 h-4" />,
      description: 'Dissolução gradual entre clips',
      duration: 1500,
      preview: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=dissolve_transition_preview_video&image_size=square'
    },
    {
      id: 'wipe-right',
      name: 'Wipe Direita',
      category: 'slide',
      icon: <ArrowRight className="w-4 h-4" />,
      description: 'Transição deslizante da esquerda para direita',
      duration: 800,
      preview: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=wipe_right_transition_preview&image_size=square'
    },
    {
      id: 'wipe-down',
      name: 'Wipe Baixo',
      category: 'slide',
      icon: <ArrowDown className="w-4 h-4" />,
      description: 'Transição deslizante de cima para baixo',
      duration: 800,
      preview: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=wipe_down_transition_preview&image_size=square'
    },
    {
      id: 'slide-left',
      name: 'Slide Esquerda',
      category: 'slide',
      icon: <Move className="w-4 h-4" />,
      description: 'Deslizamento para a esquerda',
      duration: 1000,
      preview: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=slide_left_transition_preview&image_size=square'
    },
    {
      id: 'zoom-in',
      name: 'Zoom In',
      category: 'zoom',
      icon: <ZoomIn className="w-4 h-4" />,
      description: 'Aproximação com zoom',
      duration: 1200,
      preview: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=zoom_in_transition_preview&image_size=square'
    },
    {
      id: 'zoom-out',
      name: 'Zoom Out',
      category: 'zoom',
      icon: <ZoomOut className="w-4 h-4" />,
      description: 'Afastamento com zoom',
      duration: 1200,
      preview: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=zoom_out_transition_preview&image_size=square'
    },
    {
      id: 'rotate',
      name: 'Rotação',
      category: 'rotate',
      icon: <RotateCw className="w-4 h-4" />,
      description: 'Transição com rotação',
      duration: 1500,
      preview: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=rotate_transition_preview_video&image_size=square',
      isPremium: true
    }
  ];

  // Filtrar efeitos baseado na busca e categoria
  const filteredEffects = visualEffects.filter(effect => {
    const matchesSearch = effect.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         effect.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || effect.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Filtrar transições baseado na busca
  const filteredTransitions = transitions.filter(transition =>
    transition.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    transition.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Aplicar efeito
  const handleApplyEffect = (effect: Effect) => {
    const parameters = { ...effectParameters };
    // Preencher com valores padrão se não definidos
    effect.parameters.forEach(param => {
      if (!(param.id in parameters)) {
        parameters[param.id] = param.default;
      }
    });
    onEffectApply(effect, parameters);
  };

  const handleEffectClick = (effect: Effect) => {
    selectEffect(effect.id);
    setSelectedEffect(effect);
  };

  const handleParameterChange = (parameterId: string, value: number) => {
    changeParameter(parameterId, value);
    updateParameter(parameterId, value);
    // Aplicar mudança em tempo real se preview estiver ativo
    if (isPreviewEnabled && currentEffect) {
      const updatedEffect = {
        ...currentEffect,
        parameters: currentEffect.parameters.map(param => 
          param.id === parameterId ? { ...param, value } : param
        )
      };
    }
  };

  const handlePresetApply = (preset: any) => {
    applyPreset(preset);
    if (isPreviewEnabled && currentEffect) {
      // Apply preset to current effect
    }
  };

  // Search and filter functions
  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleCategoryFilter = (categories: string[]) => {
    setSelectedCategories(categories);
  };

  // Filter effects based on search and categories
  const filteredEffectsAdvanced = useMemo(() => {
    return visualEffects.filter(effect => {
      const matchesSearch = searchQuery === '' || 
        effect.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        effect.description.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = selectedCategories.length === 0 || 
        selectedCategories.includes(effect.category);
      
      return matchesSearch && matchesCategory;
    });
  }, [visualEffects, searchQuery, selectedCategories]);

  // Get available categories from effects
  const availableCategories = useMemo(() => {
    return [...new Set(visualEffects.map(effect => effect.category))];
  }, [visualEffects]);

  // Atualizar parâmetro do efeito
  const updateParameter = (paramId: string, value: any) => {
    setEffectParameters(prev => ({
      ...prev,
      [paramId]: value
    }));
  };

  // Preview em tempo real
  const togglePreview = () => {
    setIsPreviewPlaying(!isPreviewPlaying);
    if (previewRef.current) {
      if (isPreviewPlaying) {
        previewRef.current.pause();
      } else {
        previewRef.current.play();
      }
    }
  };

  // Resetar parâmetros quando selecionar novo efeito
  useEffect(() => {
    if (selectedEffect) {
      const defaultParams: Record<string, any> = {};
      selectedEffect.parameters.forEach(param => {
        defaultParams[param.id] = param.default;
      });
      setEffectParameters(defaultParams);
    }
  }, [selectedEffect]);

  // Effect to handle global drag and drop events
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      updateDragPosition(e);
    };

    const handleMouseUp = () => {
      endEffectDrag();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        endEffectDrag();
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isDragging, updateDragPosition, endEffectDrag]);

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-900">Efeitos e Transições</h2>
          <Button variant="ghost" size="sm">
            <Settings className="w-4 h-4" />
          </Button>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Buscar efeitos e transições..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-4 mx-4 mt-2">
          <TabsTrigger value="effects" className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            Efeitos
          </TabsTrigger>
          <TabsTrigger value="transitions" className="flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Transições
          </TabsTrigger>
          <TabsTrigger value="presets" className="flex items-center gap-2">
            <Star className="w-4 h-4" />
            Presets
          </TabsTrigger>
          <TabsTrigger value="controls" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Controles
          </TabsTrigger>
        </TabsList>

        {/* Effects Tab */}
        <TabsContent value="effects" className="flex-1 flex flex-col mt-0">
          <EffectsSearch
            onSearch={handleSearch}
            onCategoryFilter={handleCategoryFilter}
            categories={availableCategories}
            selectedCategories={selectedCategories}
          />
          {/* Category Filter */}
          <div className="p-4 border-b border-gray-100">
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedCategory === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory('all')}
              >
                Todos
              </Button>
              <Button
                variant={selectedCategory === 'color' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory('color')}
              >
                Cor
              </Button>
              <Button
                variant={selectedCategory === 'blur' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory('blur')}
              >
                Desfoque
              </Button>
              <Button
                variant={selectedCategory === 'correction' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory('correction')}
              >
                Correção
              </Button>
              <Button
                variant={selectedCategory === 'artistic' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory('artistic')}
              >
                Artístico
              </Button>
            </div>
          </div>

          {/* Effects Grid */}
          <ScrollArea className="flex-1">
            <div className="p-4 grid grid-cols-2 gap-3">
              {filteredEffectsAdvanced.map((effect) => (
                <Card
                  key={effect.id}
                  className={`p-3 cursor-pointer transition-all hover:shadow-md select-none ${
                    selectedEffect?.id === effect.id ? 'ring-2 ring-blue-500' : ''
                  }`}
                  onClick={() => setSelectedEffect(effect)}
                  onMouseDown={(e) => {
                    // Iniciar drag apenas se não for um clique simples
                    const startX = e.clientX;
                    const startY = e.clientY;
                    
                    const handleMouseMove = (moveEvent: MouseEvent) => {
                      const deltaX = Math.abs(moveEvent.clientX - startX);
                      const deltaY = Math.abs(moveEvent.clientY - startY);
                      
                      // Se moveu mais de 5px, iniciar drag
                      if (deltaX > 5 || deltaY > 5) {
                        startEffectDrag({
                          id: effect.id,
                          name: effect.name,
                          type: 'effect',
                          category: effect.category,
                          parameters: effect.parameters,
                          preview: effect.preview
                        }, e as any);
                        
                        document.removeEventListener('mousemove', handleMouseMove);
                        document.removeEventListener('mouseup', handleMouseUp);
                      }
                    };
                    
                    const handleMouseUp = () => {
                      document.removeEventListener('mousemove', handleMouseMove);
                      document.removeEventListener('mouseup', handleMouseUp);
                    };
                    
                    document.addEventListener('mousemove', handleMouseMove);
                    document.addEventListener('mouseup', handleMouseUp);
                  }}
                >
                  <div className="flex flex-col items-center text-center">
                    <img
                      src={effect.preview}
                      alt={effect.name}
                      className="w-16 h-16 object-cover rounded mb-2"
                    />
                    <div className="flex items-center space-x-1 mb-1">
                      {effect.icon}
                      <span className="text-sm font-medium">{effect.name}</span>
                      {effect.isPremium && (
                        <Star className="w-3 h-3 text-yellow-500" />
                      )}
                    </div>
                    <p className="text-xs text-gray-500 line-clamp-2">
                      {effect.description}
                    </p>
                  </div>
                </Card>
              ))}
            </div>
          </ScrollArea>

          {/* Effect Parameters */}
          {selectedEffect && (
            <div className="border-t border-gray-200 p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium">{selectedEffect.name}</h3>
                <div className="flex space-x-2">
                  <Button size="sm" variant="outline" onClick={togglePreview}>
                    {isPreviewPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                  </Button>
                  <Button size="sm" onClick={() => handleApplyEffect(selectedEffect)}>
                    Aplicar
                  </Button>
                </div>
              </div>
              
              <div className="space-y-3">
                {selectedEffect.parameters.map((param) => (
                  <div key={param.id}>
                    <label className="text-xs font-medium text-gray-700 block mb-1">
                      {param.name}
                    </label>
                    {param.type === 'slider' && (
                      <Slider
                        value={[effectParameters[param.id] || param.default]}
                        onValueChange={(value) => updateParameter(param.id, value[0])}
                        min={param.min}
                        max={param.max}
                        step={param.max && param.max > 100 ? 1 : 0.1}
                        className="w-full"
                      />
                    )}
                    {param.type === 'select' && (
                      <select
                        value={effectParameters[param.id] || param.default}
                        onChange={(e) => updateParameter(param.id, e.target.value)}
                        className="w-full p-1 border border-gray-300 rounded text-sm"
                      >
                        {param.options?.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        {/* Transitions Tab */}
        <TabsContent value="transitions" className="flex-1 mt-0">
          <TransitionsLibrary
            onTransitionSelect={onTransitionApply}
            onPreview={onTransitionPreview}
            selectedTransition={selectedTransition}
          />
        </TabsContent>

        {/* Presets Tab */}
        <TabsContent value="presets" className="flex-1 mt-0">
          <div className="p-4 h-full">
            <EffectsPresets
              onPresetApply={(preset) => {
                // Aplicar preset como efeito
                if (onEffectApply) {
                  onEffectApply({
                    id: `preset-${preset.id}`,
                    name: preset.name,
                    category: preset.category,
                    description: preset.description,
                    parameters: preset.parameters,
                    preview: preset.preview || ''
                  }, preset.parameterValues || {});
                }
              }}
            />
          </div>
        </TabsContent>

        {/* Controls Tab */}
        <TabsContent value="controls" className="flex-1 mt-0">
          <ParameterControls
            effect={currentEffect}
            onParameterChange={handleParameterChange}
            onPresetApply={handlePresetApply}
            onReset={resetParameters}
            onSave={savePreset}
            isPreviewEnabled={isPreviewEnabled}
            onPreviewToggle={togglePreview}
          />
        </TabsContent>
      </Tabs>

      {/* Applied Effects */}
      {appliedEffects.length > 0 && (
        <div className="border-t border-gray-200 p-4">
          <h3 className="font-medium mb-2">Efeitos Aplicados</h3>
          <div className="space-y-2">
            {appliedEffects.map((appliedEffect) => (
              <div
                key={appliedEffect.id}
                className="flex items-center justify-between p-2 bg-gray-50 rounded"
              >
                <span className="text-sm">{appliedEffect.name}</span>
                <div className="flex space-x-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onEffectRemove(appliedEffect.id)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    
    {/* Drag Preview */}
    <DragPreview
      draggedEffect={draggedEffect}
      dropTarget={dropTarget}
      isDragging={isDragging}
      canDrop={dropTarget ? getDropFeedback(dropTarget)?.canDrop : false}
      feedbackMessage={dropTarget ? getDropFeedback(dropTarget)?.message : undefined}
    />
    </div>
  );
};

export default EffectsPanel;