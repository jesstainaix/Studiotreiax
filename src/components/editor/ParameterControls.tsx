import React, { useState, useEffect, useCallback } from 'react';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { EffectsPresets } from './EffectsPresets';
import { 
  RotateCcw, 
  Save, 
  Download, 
  Settings, 
  Sliders,
  Palette,
  Star
} from 'lucide-react';

export interface ParameterValue {
  id: string;
  name: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
  category: 'color' | 'transform' | 'filter' | 'audio' | 'timing';
}

export interface EffectParameter {
  id: string;
  name: string;
  description?: string;
  parameters: ParameterValue[];
  presets?: ParameterPreset[];
}

export interface ParameterPreset {
  id: string;
  name: string;
  description?: string;
  values: Record<string, number>;
}

export interface ParameterControlsProps {
  effect?: EffectParameter;
  onParameterChange: (parameterId: string, value: number) => void;
  onPresetApply: (preset: ParameterPreset) => void;
  onReset: () => void;
  onSave: (name: string) => void;
  isPreviewEnabled?: boolean;
  onPreviewToggle?: () => void;
  className?: string;
}

const CATEGORY_ICONS = {
  color: Palette,
  transform: Camera,
  filter: Zap,
  audio: Volume2,
  timing: Settings
};

const CATEGORY_COLORS = {
  color: 'bg-pink-100 text-pink-800',
  transform: 'bg-blue-100 text-blue-800',
  filter: 'bg-purple-100 text-purple-800',
  audio: 'bg-green-100 text-green-800',
  timing: 'bg-orange-100 text-orange-800'
};

export const ParameterControls: React.FC<ParameterControlsProps> = ({
  effect,
  onParameterChange,
  onPresetApply,
  onReset,
  onSave,
  isPreviewEnabled = true,
  onPreviewToggle,
  className = ''
}) => {
  const [currentValues, setCurrentValues] = useState<Record<string, number>>({});
  const [presetName, setPresetName] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Initialize current values when effect changes
  useEffect(() => {
    if (effect) {
      const initialValues: Record<string, number> = {};
      effect.parameters.forEach(param => {
        initialValues[param.id] = param.value;
      });
      setCurrentValues(initialValues);
    }
  }, [effect]);

  const handleParameterChange = useCallback((parameterId: string, value: number) => {
    setCurrentValues(prev => ({
      ...prev,
      [parameterId]: value
    }));
    onParameterChange(parameterId, value);
  }, [onParameterChange]);

  const handlePresetApply = useCallback((preset: ParameterPreset) => {
    setCurrentValues(preset.values);
    onPresetApply(preset);
  }, [onPresetApply]);

  const handleReset = useCallback(() => {
    if (effect) {
      const resetValues: Record<string, number> = {};
      effect.parameters.forEach(param => {
        resetValues[param.id] = param.value;
      });
      setCurrentValues(resetValues);
      onReset();
    }
  }, [effect, onReset]);

  const handleSave = useCallback(() => {
    if (presetName.trim()) {
      onSave(presetName.trim());
      setPresetName('');
      setShowSaveDialog(false);
    }
  }, [presetName, onSave]);

  const getParametersByCategory = useCallback((category: string) => {
    if (!effect) return [];
    if (category === 'all') return effect.parameters;
    return effect.parameters.filter(param => param.category === category);
  }, [effect]);

  const getCategories = useCallback(() => {
    if (!effect) return [];
    const categories = [...new Set(effect.parameters.map(param => param.category))];
    return categories;
  }, [effect]);

  if (!effect) {
    return (
      <Card className={`w-full ${className}`}>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">
            <Settings className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Selecione um efeito para ajustar os parâmetros</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const categories = getCategories();
  const filteredParameters = getParametersByCategory(selectedCategory);

  return (
    <Card className={`w-full ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">{effect.name}</CardTitle>
          <div className="flex items-center gap-2">
            {onPreviewToggle && (
              <Button
                variant="outline"
                size="sm"
                onClick={onPreviewToggle}
                className={isPreviewEnabled ? 'bg-blue-50' : ''}
              >
                {isPreviewEnabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={handleReset}>
              <RotateCcw className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowSaveDialog(true)}>
              <Save className="w-4 h-4" />
            </Button>
          </div>
        </div>
        {effect.description && (
          <p className="text-sm text-gray-600">{effect.description}</p>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        <Tabs defaultValue="parameters" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="parameters">
              <Sliders className="h-4 w-4 mr-2" />
              Parâmetros
            </TabsTrigger>
            <TabsTrigger value="presets">
              <Star className="h-4 w-4 mr-2" />
              Presets
            </TabsTrigger>
            <TabsTrigger value="library">
              <Palette className="h-4 w-4 mr-2" />
              Biblioteca
            </TabsTrigger>
          </TabsList>

          <TabsContent value="parameters" className="space-y-4">
            {/* Category Filter */}
            {categories.length > 1 && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Categoria</Label>
                <div className="flex flex-wrap gap-2">
                  <Badge
                    variant={selectedCategory === 'all' ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => setSelectedCategory('all')}
                  >
                    Todos
                  </Badge>
                  {categories.map((category) => {
                    const Icon = CATEGORY_ICONS[category as keyof typeof CATEGORY_ICONS];
                    return (
                      <Badge
                        key={category}
                        variant={selectedCategory === category ? 'default' : 'outline'}
                        className={`cursor-pointer flex items-center gap-1 ${
                          selectedCategory === category ? CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS] : ''
                        }`}
                        onClick={() => setSelectedCategory(category)}
                      >
                        <Icon className="w-3 h-3" />
                        {category}
                      </Badge>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Parameters */}
            <div className="space-y-4">
              {filteredParameters.map((parameter) => {
                const Icon = CATEGORY_ICONS[parameter.category];
                return (
                  <div key={parameter.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4 text-gray-500" />
                        <Label className="text-sm font-medium">{parameter.name}</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          value={currentValues[parameter.id] || parameter.value}
                          onChange={(e) => handleParameterChange(parameter.id, parseFloat(e.target.value) || 0)}
                          min={parameter.min}
                          max={parameter.max}
                          step={parameter.step}
                          className="w-16 h-8 text-xs"
                        />
                        {parameter.unit && (
                          <span className="text-xs text-gray-500">{parameter.unit}</span>
                        )}
                      </div>
                    </div>
                    <Slider
                      value={[currentValues[parameter.id] || parameter.value]}
                      onValueChange={([value]) => handleParameterChange(parameter.id, value)}
                      min={parameter.min}
                      max={parameter.max}
                      step={parameter.step}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>{parameter.min}{parameter.unit}</span>
                      <span>{parameter.max}{parameter.unit}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="presets" className="space-y-4">
            {/* Presets */}
            {effect.presets && effect.presets.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Presets</Label>
                <div className="flex flex-wrap gap-2">
                  {effect.presets.map((preset) => (
                    <Button
                      key={preset.id}
                      variant="outline"
                      size="sm"
                      onClick={() => handlePresetApply(preset)}
                      className="text-xs"
                    >
                      {preset.name}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="library" className="space-y-4">
            <EffectsPresets onPresetApply={handlePresetApply} />
          </TabsContent>
        </Tabs>



        {/* Save Dialog */}
        {showSaveDialog && (
          <div className="space-y-3 p-3 border rounded-lg bg-gray-50">
            <Label className="text-sm font-medium">Salvar Preset</Label>
            <Input
              placeholder="Nome do preset..."
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSave()}
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSave} disabled={!presetName.trim()}>
                Salvar
              </Button>
              <Button size="sm" variant="outline" onClick={() => setShowSaveDialog(false)}>
                Cancelar
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ParameterControls;