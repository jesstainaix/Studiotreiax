import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Slider } from '../ui/slider';
import { 
  Clock, 
  Plus, 
  Minus, 
  RotateCcw,
  Timer,
  Zap,
  TrendingUp
} from 'lucide-react';
import { HeyGenScene } from '../../lib/pptx/heygen-scene-manager';
import { Badge } from '../ui/badge';

interface SceneDurationEditorProps {
  scene: HeyGenScene;
  onDurationChange: (newDuration: number) => void;
  className?: string;
}

export const SceneDurationEditor: React.FC<SceneDurationEditorProps> = ({
  scene,
  onDurationChange,
  className = ''
}) => {
  const [tempDuration, setTempDuration] = useState(scene.duration);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (!isEditing) {
      setTempDuration(scene.duration);
    }
  }, [scene.duration, isEditing]);

  const handleDurationChange = (value: number[]) => {
    setTempDuration(value[0]);
    setIsEditing(true);
  };

  const applyDurationChange = () => {
    onDurationChange(tempDuration);
    setIsEditing(false);
  };

  const resetDuration = () => {
    setTempDuration(scene.duration);
    setIsEditing(false);
  };

  const adjustDuration = (delta: number) => {
    const newDuration = Math.max(1, Math.min(60, tempDuration + delta));
    setTempDuration(newDuration);
    setIsEditing(true);
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 10);
    return mins > 0 
      ? `${mins}m ${secs}s ${ms > 0 ? `${ms}` : ''}`
      : `${secs}.${ms}s`;
  };

  const getRecommendedDuration = (): number => {
    // Calculate recommended duration based on content length
    const textLength = scene.content?.length || 0;
    const wordsPerMinute = 150; // Average speaking rate
    const charactersPerWord = 5;
    const words = textLength / charactersPerWord;
    const minutes = words / wordsPerMinute;
    const seconds = minutes * 60;
    
    // Add buffer for presentation timing
    return Math.max(3, Math.min(30, seconds + 2));
  };

  const recommendedDuration = getRecommendedDuration();
  const isOptimalDuration = Math.abs(tempDuration - recommendedDuration) <= 2;

  const presetDurations = [
    { label: 'Rápido', value: 3, icon: Zap },
    { label: 'Normal', value: 5, icon: Timer },
    { label: 'Detalhado', value: 8, icon: TrendingUp },
    { label: 'Recomendado', value: recommendedDuration, icon: Clock }
  ];

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Clock className="w-4 h-4" />
          Duração da Cena
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Current Scene Info */}
        <div className="bg-gray-50 p-3 rounded-lg">
          <h4 className="font-medium text-sm text-gray-900 mb-1">{scene.title}</h4>
          <p className="text-xs text-gray-600 mb-2">
            {scene.content ? `${scene.content.length} caracteres` : 'Sem conteúdo'}
          </p>
          
          <div className="flex items-center gap-2">
            <Badge variant={isOptimalDuration ? "default" : "secondary"} className="text-xs">
              {formatDuration(tempDuration)}
            </Badge>
            {isOptimalDuration && (
              <Badge variant="outline" className="text-xs text-green-600">
                Duração Ideal
              </Badge>
            )}
            {isEditing && (
              <Badge variant="outline" className="text-xs text-orange-600">
                Modificado
              </Badge>
            )}
          </div>
        </div>

        {/* Duration Slider */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm">Duração: {formatDuration(tempDuration)}</Label>
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="outline"
                onClick={() => adjustDuration(-0.5)}
                disabled={tempDuration <= 1}
                className="w-6 h-6 p-0"
              >
                <Minus className="w-3 h-3" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => adjustDuration(0.5)}
                disabled={tempDuration >= 60}
                className="w-6 h-6 p-0"
              >
                <Plus className="w-3 h-3" />
              </Button>
            </div>
          </div>

          <Slider
            value={[tempDuration]}
            min={1}
            max={30}
            step={0.5}
            onValueChange={handleDurationChange}
            className="w-full"
          />

          <div className="flex justify-between text-xs text-gray-500">
            <span>1s</span>
            <span>Recomendado: {formatDuration(recommendedDuration)}</span>
            <span>30s</span>
          </div>
        </div>

        {/* Preset Durations */}
        <div className="space-y-2">
          <Label className="text-sm">Predefinições</Label>
          <div className="grid grid-cols-2 gap-2">
            {presetDurations.map((preset) => {
              const Icon = preset.icon;
              const isSelected = Math.abs(tempDuration - preset.value) < 0.1;
              
              return (
                <Button
                  key={preset.label}
                  size="sm"
                  variant={isSelected ? "default" : "outline"}
                  onClick={() => {
                    setTempDuration(preset.value);
                    setIsEditing(true);
                  }}
                  className="flex items-center gap-2 text-xs"
                >
                  <Icon className="w-3 h-3" />
                  {preset.label}
                  <span className="text-xs opacity-70">
                    {formatDuration(preset.value)}
                  </span>
                </Button>
              );
            })}
          </div>
        </div>

        {/* Action Buttons */}
        {isEditing && (
          <div className="flex gap-2 pt-2 border-t">
            <Button
              size="sm"
              onClick={applyDurationChange}
              className="flex-1"
            >
              Aplicar
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={resetDuration}
            >
              <RotateCcw className="w-3 h-3" />
            </Button>
          </div>
        )}

        {/* Duration Analysis */}
        <div className="text-xs text-gray-600 space-y-1">
          <div className="flex justify-between">
            <span>Velocidade de leitura:</span>
            <span>{scene.content ? Math.round((scene.content.length / tempDuration) * 60 / 5) : 0} palavras/min</span>
          </div>
          <div className="flex justify-between">
            <span>Densidade de conteúdo:</span>
            <span className={`${
              tempDuration >= recommendedDuration * 0.8 && tempDuration <= recommendedDuration * 1.2
                ? 'text-green-600' 
                : tempDuration < recommendedDuration * 0.8 
                  ? 'text-orange-600' 
                  : 'text-blue-600'
            }`}>
              {tempDuration >= recommendedDuration * 0.8 && tempDuration <= recommendedDuration * 1.2
                ? 'Ideal' 
                : tempDuration < recommendedDuration * 0.8 
                  ? 'Rápida' 
                  : 'Lenta'
              }
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SceneDurationEditor;