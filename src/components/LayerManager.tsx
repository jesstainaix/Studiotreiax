import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import {
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Layers,
  Plus,
  Trash2,
  Copy,
  ChevronUp,
  ChevronDown,
  Settings,
  Volume2,
  VolumeX
} from 'lucide-react';

export interface Layer {
  id: string;
  name: string;
  type: 'video' | 'audio' | 'text' | 'image' | 'avatar' | 'scene' | 'effect';
  visible: boolean;
  locked: boolean;
  opacity: number;
  volume?: number;
  muted?: boolean;
  order: number;
  duration: number;
  startTime: number;
  color: string;
  items: LayerItem[];
}

export interface LayerItem {
  id: string;
  name: string;
  type: string;
  startTime: number;
  duration: number;
  properties: any;
  selected: boolean;
}

interface LayerManagerProps {
  layers: Layer[];
  onLayersChange: (layers: Layer[]) => void;
  selectedLayerId?: string;
  onLayerSelect: (layerId: string) => void;
  currentTime: number;
  totalDuration: number;
}

const LayerManager: React.FC<LayerManagerProps> = ({
  layers,
  onLayersChange,
  selectedLayerId,
  onLayerSelect,
  currentTime,
  totalDuration
}) => {
  const [draggedLayer, setDraggedLayer] = useState<string | null>(null);

  const updateLayer = useCallback((layerId: string, updates: Partial<Layer>) => {
    const updatedLayers = layers.map(layer => 
      layer.id === layerId ? { ...layer, ...updates } : layer
    );
    onLayersChange(updatedLayers);
  }, [layers, onLayersChange]);

  const toggleVisibility = useCallback((layerId: string) => {
    const layer = layers.find(l => l.id === layerId);
    if (layer) {
      updateLayer(layerId, { visible: !layer.visible });
    }
  }, [layers, updateLayer]);

  const toggleLock = useCallback((layerId: string) => {
    const layer = layers.find(l => l.id === layerId);
    if (layer) {
      updateLayer(layerId, { locked: !layer.locked });
    }
  }, [layers, updateLayer]);

  const toggleMute = useCallback((layerId: string) => {
    const layer = layers.find(l => l.id === layerId);
    if (layer && layer.type === 'audio') {
      updateLayer(layerId, { muted: !layer.muted });
    }
  }, [layers, updateLayer]);

  const changeOpacity = useCallback((layerId: string, opacity: number[]) => {
    updateLayer(layerId, { opacity: opacity[0] });
  }, [updateLayer]);

  const changeVolume = useCallback((layerId: string, volume: number[]) => {
    updateLayer(layerId, { volume: volume[0] });
  }, [updateLayer]);

  const addLayer = useCallback(() => {
    const newLayer: Layer = {
      id: `layer-${Date.now()}`,
      name: `Camada ${layers.length + 1}`,
      type: 'video',
      visible: true,
      locked: false,
      opacity: 100,
      volume: 80,
      muted: false,
      order: layers.length,
      duration: 0,
      startTime: 0,
      color: `hsl(${Math.random() * 360}, 70%, 50%)`,
      items: []
    };
    onLayersChange([...layers, newLayer]);
  }, [layers, onLayersChange]);

  const deleteLayer = useCallback((layerId: string) => {
    const filteredLayers = layers.filter(layer => layer.id !== layerId);
    onLayersChange(filteredLayers);
  }, [layers, onLayersChange]);

  const duplicateLayer = useCallback((layerId: string) => {
    const layer = layers.find(l => l.id === layerId);
    if (layer) {
      const duplicatedLayer: Layer = {
        ...layer,
        id: `layer-${Date.now()}`,
        name: `${layer.name} (Cópia)`,
        order: layers.length
      };
      onLayersChange([...layers, duplicatedLayer]);
    }
  }, [layers, onLayersChange]);

  const moveLayer = useCallback((layerId: string, direction: 'up' | 'down') => {
    const layerIndex = layers.findIndex(l => l.id === layerId);
    if (layerIndex === -1) return;

    const newLayers = [...layers];
    const targetIndex = direction === 'up' ? layerIndex - 1 : layerIndex + 1;

    if (targetIndex >= 0 && targetIndex < layers.length) {
      [newLayers[layerIndex], newLayers[targetIndex]] = [newLayers[targetIndex], newLayers[layerIndex]];
      
      // Update order values
      newLayers.forEach((layer, index) => {
        layer.order = index;
      });
      
      onLayersChange(newLayers);
    }
  }, [layers, onLayersChange]);

  const getLayerTypeIcon = (type: Layer['type']) => {
    switch (type) {
      case 'video': return '🎬';
      case 'audio': return '🎵';
      case 'text': return '📝';
      case 'image': return '🖼️';
      case 'avatar': return '👤';
      case 'scene': return '🏗️';
      case 'effect': return '✨';
      default: return '📄';
    }
  };

  const handleDragStart = (layerId: string) => {
    setDraggedLayer(layerId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetLayerId: string) => {
    e.preventDefault();
    if (draggedLayer && draggedLayer !== targetLayerId) {
      const draggedIndex = layers.findIndex(l => l.id === draggedLayer);
      const targetIndex = layers.findIndex(l => l.id === targetLayerId);
      
      if (draggedIndex !== -1 && targetIndex !== -1) {
        const newLayers = [...layers];
        const [draggedLayerObj] = newLayers.splice(draggedIndex, 1);
        newLayers.splice(targetIndex, 0, draggedLayerObj);
        
        // Update order values
        newLayers.forEach((layer, index) => {
          layer.order = index;
        });
        
        onLayersChange(newLayers);
      }
    }
    setDraggedLayer(null);
  };

  return (
    <Card className="h-full flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Layers className="w-4 h-4" />
            <h3 className="font-medium">Camadas</h3>
          </div>
          <Button size="sm" variant="outline" onClick={addLayer}>
            <Plus className="w-3 h-3 mr-1" />
            Nova
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {layers.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Layers className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Nenhuma camada criada</p>
            <p className="text-xs mt-1">Clique em "Nova" para adicionar uma camada</p>
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {layers
              .sort((a, b) => b.order - a.order) // Show top layers first
              .map((layer) => (
                <div
                  key={layer.id}
                  className={`p-3 rounded-lg border transition-all cursor-pointer ${
                    selectedLayerId === layer.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                  onClick={() => onLayerSelect(layer.id)}
                  draggable
                  onDragStart={() => handleDragStart(layer.id)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, layer.id)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm">{getLayerTypeIcon(layer.type)}</span>
                      <span className="font-medium text-sm truncate">{layer.name}</span>
                      <div 
                        className="w-3 h-3 rounded-full border border-gray-300"
                        style={{ backgroundColor: layer.color }}
                      />
                    </div>
                    
                    <div className="flex items-center space-x-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          moveLayer(layer.id, 'up');
                        }}
                        disabled={layer.order === layers.length - 1}
                      >
                        <ChevronUp className="w-3 h-3" />
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          moveLayer(layer.id, 'down');
                        }}
                        disabled={layer.order === 0}
                      >
                        <ChevronDown className="w-3 h-3" />
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleVisibility(layer.id);
                        }}
                      >
                        {layer.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleLock(layer.id);
                        }}
                      >
                        {layer.locked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                      </Button>
                    </div>
                  </div>

                  {/* Layer Controls */}
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-500 w-12">Opacidade</span>
                      <Slider
                        value={[layer.opacity]}
                        onValueChange={(value) => changeOpacity(layer.id, value)}
                        max={100}
                        step={1}
                        className="flex-1"
                        disabled={layer.locked}
                      />
                      <span className="text-xs text-gray-500 w-8">{layer.opacity}%</span>
                    </div>

                    {layer.type === 'audio' && (
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleMute(layer.id);
                          }}
                        >
                          {layer.muted ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
                        </Button>
                        <Slider
                          value={[layer.volume || 80]}
                          onValueChange={(value) => changeVolume(layer.id, value)}
                          max={100}
                          step={1}
                          className="flex-1"
                          disabled={layer.locked || layer.muted}
                        />
                        <span className="text-xs text-gray-500 w-8">{layer.volume}%</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">
                        {layer.items.length} item{layer.items.length !== 1 ? 's' : ''}
                      </span>
                      
                      <div className="flex items-center space-x-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            duplicateLayer(layer.id);
                          }}
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteLayer(layer.id);
                          }}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            }
          </div>
        )}
      </div>
    </Card>
  );
};

export default LayerManager;