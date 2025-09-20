import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Badge } from '../ui/badge';
import { 
  Type, 
  Image as ImageIcon, 
  Square, 
  Circle,
  Triangle,
  Star,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Move,
  RotateCw,
  Palette,
  Settings,
  Copy,
  Upload
} from 'lucide-react';
import { SceneLayer, SceneLayerType } from '../../types/SceneLayers';

interface ElementsPanelProps {
  selectedSceneId?: string;
  layers: SceneLayer[];
  selectedLayerId?: string;
  onAddLayer: (layer: Omit<SceneLayer, 'id'>) => void;
  onUpdateLayer: (layerId: string, updates: Partial<SceneLayer>) => void;
  onDeleteLayer: (layerId: string) => void;
  onSelectLayer: (layerId: string) => void;
  className?: string;
}

export const ElementsPanel: React.FC<ElementsPanelProps> = ({
  selectedSceneId,
  layers,
  selectedLayerId,
  onAddLayer,
  onUpdateLayer,
  onDeleteLayer,
  onSelectLayer,
  className = ''
}) => {
  const [activeTab, setActiveTab] = useState('text');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddTextElement = () => {
    if (!selectedSceneId) return;
    
    const newLayer: Omit<SceneLayer, 'id'> = {
      type: 'text',
      name: 'Novo Texto',
      value: 'Digite seu texto aqui',
      x: 0.1,
      y: 0.1,
      width: 0.5,
      height: 0.1,
      z_index: layers.length + 10,
      style: {
        fontSize: '1.2rem',
        fontWeight: 'normal',
        fontFamily: 'Inter, sans-serif',
        color: '#374151',
        textAlign: 'left',
        lineHeight: 1.4
      },
      animation: null,
      visible: true,
      locked: false
    };
    
    onAddLayer(newLayer);
  };

  const handleAddImageElement = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedSceneId) return;

    // Create object URL for preview
    const imageUrl = URL.createObjectURL(file);
    
    const newLayer: Omit<SceneLayer, 'id'> = {
      type: 'image',
      name: file.name,
      src: imageUrl,
      x: 0.1,
      y: 0.1,
      width: 0.3,
      height: 0.2,
      z_index: layers.length + 10,
      style: {
        opacity: 1
      },
      animation: null,
      visible: true,
      locked: false
    };
    
    onAddLayer(newLayer);
  };

  const handleAddGraphicElement = (graphicType: 'rectangle' | 'circle' | 'triangle' | 'icon') => {
    if (!selectedSceneId) return;
    
    const newLayer: Omit<SceneLayer, 'id'> = {
      type: 'graphic',
      name: `Gráfico ${graphicType}`,
      content: graphicType === 'icon' ? {
        type: 'icon',
        name: 'star',
        size: 48,
        color: '#3b82f6'
      } : {
        type: graphicType,
        fill: '#3b82f6',
        border: {
          width: 2,
          color: '#1e40af',
          style: 'solid'
        },
        cornerRadius: graphicType === 'rectangle' ? 4 : 0
      },
      x: 0.1,
      y: 0.1,
      width: 0.2,
      height: 0.2,
      z_index: layers.length + 10,
      style: {
        opacity: 1
      },
      animation: null,
      visible: true,
      locked: false
    };
    
    onAddLayer(newLayer);
  };

  const selectedLayer = layers.find(layer => layer.id === selectedLayerId);

  const formatPosition = (value: number) => `${Math.round(value * 100)}%`;

  return (
    <Card className={`h-full flex flex-col ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Palette className="w-5 h-5" />
          Elementos da Cena
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col gap-4 p-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="text">Texto</TabsTrigger>
            <TabsTrigger value="media">Mídia</TabsTrigger>
            <TabsTrigger value="graphics">Gráficos</TabsTrigger>
          </TabsList>

          {/* Text Elements Tab */}
          <TabsContent value="text" className="flex-1 space-y-4">
            <div className="space-y-2">
              <Button onClick={handleAddTextElement} className="w-full" size="sm">
                <Type className="w-4 h-4 mr-2" />
                Adicionar Texto
              </Button>
              
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" size="sm" onClick={() => {
                  const titleLayer: Omit<SceneLayer, 'id'> = {
                    type: 'text',
                    name: 'Título',
                    value: 'Título Principal',
                    x: 0.1, y: 0.05, width: 0.8, height: 0.15, z_index: layers.length + 10,
                    style: { fontSize: '2rem', fontWeight: 'bold', color: '#1f2937', textAlign: 'center' },
                    animation: null, visible: true, locked: false
                  };
                  onAddLayer(titleLayer);
                }}>
                  Título
                </Button>
                <Button variant="outline" size="sm" onClick={() => {
                  const subtitleLayer: Omit<SceneLayer, 'id'> = {
                    type: 'text',
                    name: 'Subtítulo',
                    value: 'Subtítulo',
                    x: 0.1, y: 0.25, width: 0.8, height: 0.1, z_index: layers.length + 10,
                    style: { fontSize: '1.5rem', fontWeight: 'normal', color: '#4b5563', textAlign: 'center' },
                    animation: null, visible: true, locked: false
                  };
                  onAddLayer(subtitleLayer);
                }}>
                  Subtítulo
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* Media Elements Tab */}
          <TabsContent value="media" className="flex-1 space-y-4">
            <div className="space-y-2">
              <Button onClick={handleAddImageElement} className="w-full" size="sm">
                <ImageIcon className="w-4 h-4 mr-2" />
                Adicionar Imagem
              </Button>
              <Button variant="outline" className="w-full" size="sm">
                <Upload className="w-4 h-4 mr-2" />
                Upload de Vídeo
              </Button>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          </TabsContent>

          {/* Graphics Elements Tab */}
          <TabsContent value="graphics" className="flex-1 space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleAddGraphicElement('rectangle')}
              >
                <Square className="w-4 h-4 mr-1" />
                Retângulo
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleAddGraphicElement('circle')}
              >
                <Circle className="w-4 h-4 mr-1" />
                Círculo
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleAddGraphicElement('triangle')}
              >
                <Triangle className="w-4 h-4 mr-1" />
                Triângulo
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleAddGraphicElement('icon')}
              >
                <Star className="w-4 h-4 mr-1" />
                Ícone
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        {/* Layers List */}
        <div className="border-t pt-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-sm">Camadas ({layers.length})</h4>
            {selectedLayer && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => onDeleteLayer(selectedLayer.id!)}
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            )}
          </div>
          
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {layers
              .sort((a, b) => (b.z_index || 0) - (a.z_index || 0))
              .map((layer) => (
                <div
                  key={layer.id}
                  className={`p-2 border rounded cursor-pointer transition-colors ${
                    selectedLayerId === layer.id 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                  onClick={() => onSelectLayer(layer.id!)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      {layer.type === 'text' && <Type className="w-3 h-3 text-gray-500" />}
                      {layer.type === 'image' && <ImageIcon className="w-3 h-3 text-gray-500" />}
                      {layer.type === 'graphic' && <Square className="w-3 h-3 text-gray-500" />}
                      
                      <span className="text-xs font-medium truncate">
                        {layer.name}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onUpdateLayer(layer.id!, { visible: !layer.visible });
                        }}
                        className="h-6 w-6 p-0"
                      >
                        {layer.visible ? (
                          <Eye className="w-3 h-3" />
                        ) : (
                          <EyeOff className="w-3 h-3 text-gray-400" />
                        )}
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onUpdateLayer(layer.id!, { locked: !layer.locked });
                        }}
                        className="h-6 w-6 p-0"
                      >
                        {layer.locked ? (
                          <Lock className="w-3 h-3 text-gray-400" />
                        ) : (
                          <Unlock className="w-3 h-3" />
                        )}
                      </Button>
                    </div>
                  </div>
                  
                  <div className="text-xs text-gray-500 mt-1">
                    {formatPosition(layer.x)}, {formatPosition(layer.y)}
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Layer Properties */}
        {selectedLayer && (
          <div className="border-t pt-4 space-y-3">
            <h4 className="font-medium text-sm">Propriedades</h4>
            
            <div className="space-y-2">
              <Input
                placeholder="Nome da camada"
                value={selectedLayer.name}
                onChange={(e) => onUpdateLayer(selectedLayer.id!, { name: e.target.value })}
                className="text-xs"
              />
              
              {selectedLayer.type === 'text' && (
                <Input
                  placeholder="Texto"
                  value={selectedLayer.value as string}
                  onChange={(e) => onUpdateLayer(selectedLayer.id!, { value: e.target.value })}
                  className="text-xs"
                />
              )}
              
              {/* Position Controls */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-gray-600">X (%)</label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={Math.round(selectedLayer.x * 100)}
                    onChange={(e) => onUpdateLayer(selectedLayer.id!, { 
                      x: parseInt(e.target.value) / 100 
                    })}
                    className="text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-600">Y (%)</label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={Math.round(selectedLayer.y * 100)}
                    onChange={(e) => onUpdateLayer(selectedLayer.id!, { 
                      y: parseInt(e.target.value) / 100 
                    })}
                    className="text-xs"
                  />
                </div>
              </div>
              
              {/* Size Controls */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-gray-600">Largura (%)</label>
                  <Input
                    type="number"
                    min="1"
                    max="100"
                    value={Math.round(selectedLayer.width * 100)}
                    onChange={(e) => onUpdateLayer(selectedLayer.id!, { 
                      width: parseInt(e.target.value) / 100 
                    })}
                    className="text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-600">Altura (%)</label>
                  <Input
                    type="number"
                    min="1"
                    max="100"
                    value={Math.round(selectedLayer.height * 100)}
                    onChange={(e) => onUpdateLayer(selectedLayer.id!, { 
                      height: parseInt(e.target.value) / 100 
                    })}
                    className="text-xs"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};