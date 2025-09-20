import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Slider } from '../ui/slider';
import { 
  Scissors, 
  Zap, 
  ArrowRight, 
  RotateCcw,
  Layers,
  Wind,
  Sparkles,
  Circle,
  Square,
  Triangle
} from 'lucide-react';
import { HeyGenScene } from '../../lib/pptx/heygen-scene-manager';
import { SceneTransition } from './TimelineEditor';
import { Badge } from '../ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';

interface TransitionEditorProps {
  scene: HeyGenScene;
  onTransitionChange: (transition: SceneTransition) => void;
  className?: string;
}

export const TransitionEditor: React.FC<TransitionEditorProps> = ({
  scene,
  onTransitionChange,
  className = ''
}) => {
  const [selectedTransition, setSelectedTransition] = useState<SceneTransition>({
    id: `transition-${scene.id}`,
    type: 'fade',
    duration: 500,
    easing: 'ease-in-out'
  });

  const transitionTypes = [
    {
      id: 'cut',
      name: 'Corte',
      description: 'Mudança instantânea',
      icon: Scissors,
      duration: 0,
      preview: 'Sem transição'
    },
    {
      id: 'fade',
      name: 'Fade',
      description: 'Dissolução suave',
      icon: Circle,
      duration: 500,
      preview: 'Fade in/out'
    },
    {
      id: 'dissolve',
      name: 'Dissolução',
      description: 'Transição gradual',
      icon: Sparkles,
      duration: 800,
      preview: 'Mistura gradual'
    },
    {
      id: 'slide',
      name: 'Deslizar',
      description: 'Movimento lateral',
      icon: ArrowRight,
      duration: 600,
      preview: 'Slide horizontal'
    },
    {
      id: 'wipe',
      name: 'Limpar',
      description: 'Revelação progressiva',
      icon: Wind,
      duration: 700,
      preview: 'Varredura'
    }
  ];

  const easingOptions = [
    { value: 'linear', label: 'Linear' },
    { value: 'ease-in', label: 'Ease In' },
    { value: 'ease-out', label: 'Ease Out' },
    { value: 'ease-in-out', label: 'Ease In-Out' }
  ];

  const presetDurations = [
    { label: 'Instantâneo', value: 0, icon: Zap },
    { label: 'Rápido', value: 300, icon: Triangle },
    { label: 'Normal', value: 500, icon: Square },
    { label: 'Suave', value: 800, icon: Circle }
  ];

  const handleTransitionTypeChange = (typeId: string) => {
    const transitionType = transitionTypes.find(t => t.id === typeId);
    if (!transitionType) return;

    const newTransition: SceneTransition = {
      ...selectedTransition,
      type: typeId as SceneTransition['type'],
      duration: transitionType.duration
    };

    setSelectedTransition(newTransition);
    
    // Persist transition to scene data
    const transitionData = {
      type: newTransition.type,
      duration: newTransition.duration,
      easing: newTransition.easing,
      properties: newTransition.properties
    };
    
    onTransitionChange(newTransition);
  };

  const handleDurationChange = (value: number[]) => {
    const newTransition = {
      ...selectedTransition,
      duration: value[0]
    };
    setSelectedTransition(newTransition);
    onTransitionChange(newTransition);
  };

  const handleEasingChange = (easing: string) => {
    const newTransition = {
      ...selectedTransition,
      easing: easing as SceneTransition['easing']
    };
    setSelectedTransition(newTransition);
    onTransitionChange(newTransition);
  };

  const formatDuration = (ms: number): string => {
    if (ms === 0) return 'Instantâneo';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const getTransitionPreview = (type: string): string => {
    const transition = transitionTypes.find(t => t.id === type);
    return transition?.preview || 'Preview não disponível';
  };

  const currentTransitionType = transitionTypes.find(t => t.id === selectedTransition.type);

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Layers className="w-4 h-4" />
          Transições
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Scene Info */}
        <div className="bg-gray-50 p-3 rounded-lg">
          <h4 className="font-medium text-sm text-gray-900 mb-1">{scene.title}</h4>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {currentTransitionType?.name || 'Corte'}
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {formatDuration(selectedTransition.duration)}
            </Badge>
          </div>
        </div>

        {/* Transition Type Selection */}
        <div className="space-y-3">
          <Label className="text-sm">Tipo de Transição</Label>
          <div className="grid grid-cols-1 gap-2">
            {transitionTypes.map((transition) => {
              const Icon = transition.icon;
              const isSelected = selectedTransition.type === transition.id;
              
              return (
                <Button
                  key={transition.id}
                  variant={isSelected ? "default" : "outline"}
                  onClick={() => handleTransitionTypeChange(transition.id)}
                  className="justify-start h-auto p-3"
                >
                  <div className="flex items-center gap-3 w-full">
                    <Icon className="w-4 h-4" />
                    <div className="flex-1 text-left">
                      <div className="font-medium text-sm">{transition.name}</div>
                      <div className="text-xs opacity-70">{transition.description}</div>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {formatDuration(transition.duration)}
                    </Badge>
                  </div>
                </Button>
              );
            })}
          </div>
        </div>

        {/* Duration Control (only if not cut) */}
        {selectedTransition.type !== 'cut' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm">
                Duração: {formatDuration(selectedTransition.duration)}
              </Label>
            </div>

            <Slider
              value={[selectedTransition.duration]}
              min={100}
              max={2000}
              step={50}
              onValueChange={handleDurationChange}
              className="w-full"
            />

            <div className="flex justify-between text-xs text-gray-500">
              <span>100ms</span>
              <span>2s</span>
            </div>

            {/* Preset Durations */}
            <div className="grid grid-cols-2 gap-2">
              {presetDurations.slice(1).map((preset) => {
                const Icon = preset.icon;
                const isSelected = Math.abs(selectedTransition.duration - preset.value) < 25;
                
                return (
                  <Button
                    key={preset.label}
                    size="sm"
                    variant={isSelected ? "default" : "outline"}
                    onClick={() => handleDurationChange([preset.value])}
                    className="flex items-center gap-2 text-xs"
                  >
                    <Icon className="w-3 h-3" />
                    {preset.label}
                  </Button>
                );
              })}
            </div>
          </div>
        )}

        {/* Easing Control (only for animated transitions) */}
        {selectedTransition.type !== 'cut' && (
          <div className="space-y-2">
            <Label className="text-sm">Suavização</Label>
            <Select
              value={selectedTransition.easing}
              onValueChange={handleEasingChange}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {easingOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Preview */}
        <div className="bg-gray-50 p-3 rounded-lg">
          <Label className="text-sm text-gray-700 mb-2 block">Preview</Label>
          <div className="text-xs text-gray-600 mb-2">
            {getTransitionPreview(selectedTransition.type)}
          </div>
          
          {/* Visual Preview */}
          <div className="relative h-8 bg-white rounded border overflow-hidden">
            <div className="absolute inset-0 flex">
              <div className="flex-1 bg-blue-100 flex items-center justify-center text-xs">
                Cena Anterior
              </div>
              <div 
                className="bg-gradient-to-r from-blue-100 to-green-100 flex items-center justify-center text-xs transition-all"
                style={{ 
                  width: selectedTransition.type === 'cut' ? '2px' : '20px',
                  transition: `all ${selectedTransition.duration}ms ${selectedTransition.easing}`
                }}
              >
                {selectedTransition.type === 'cut' ? '|' : '→'}
              </div>
              <div className="flex-1 bg-green-100 flex items-center justify-center text-xs">
                {scene.title}
              </div>
            </div>
          </div>
        </div>

        {/* Reset Button */}
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            const defaultTransition: SceneTransition = {
              id: `transition-${scene.id}`,
              type: 'fade',
              duration: 500,
              easing: 'ease-in-out'
            };
            setSelectedTransition(defaultTransition);
            onTransitionChange(defaultTransition);
          }}
          className="w-full flex items-center gap-2"
        >
          <RotateCcw className="w-3 h-3" />
          Restaurar Padrão
        </Button>
      </CardContent>
    </Card>
  );
};

export default TransitionEditor;