import React, { useState } from 'react';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Input } from '../../ui/input';
import { Slider } from '../../ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
import { 
  Scissors,
  Copy,
  RotateCw,
  RotateCcw,
  FlipHorizontal,
  FlipVertical,
  Crop,
  Move,
  ZoomIn,
  ZoomOut,
  Maximize,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  FastForward,
  Rewind,
  StopCircle,
  Type,
  Settings,
  Crosshair,
  Sparkles,
  Wand2,
  Volume2,
  VolumeX,
  Mic,
  Music,
  Palette,
  Trash2,
  Bold,
  Italic,
  Underline
} from 'lucide-react';

interface EditingTool {
  id: string;
  name: string;
  category: 'selection' | 'transform' | 'crop' | 'audio' | 'text' | 'effects' | 'navigation';
  icon: React.ComponentType<any>;
  description: string;
  shortcut?: string;
  isActive?: boolean;
  hasOptions?: boolean;
}

interface EditingToolsProps {
  selectedItems: string[];
  playbackState: 'playing' | 'paused' | 'stopped';
  currentTime: number;
  duration: number;
  zoom: number;
  onToolSelect: (toolId: string) => void;
  onCut: () => void;
  onCopy: () => void;
  onPaste: () => void;
  onDelete: () => void;
  onTransform: (operation: string, value?: number) => void;
  onPlaybackControl: (action: string) => void;
  onZoomChange: (zoom: number) => void;
  onSeek: (time: number) => void;
}

const AdvancedEditingTools: React.FC<EditingToolsProps> = ({
  selectedItems,
  playbackState,
  currentTime,
  duration,
  zoom,
  onToolSelect,
  onCut,
  onCopy,
  onPaste,
  onDelete,
  onTransform,
  onPlaybackControl,
  onZoomChange,
  onSeek
}) => {
  const [activeTool, setActiveTool] = useState<string>('select');

  // Ferramentas disponíveis
  const tools: EditingTool[] = [
    // Seleção
    {
      id: 'select',
      name: 'Selecionar',
      category: 'selection',
      icon: Crosshair,
      description: 'Ferramenta de seleção padrão',
      shortcut: 'V',
      isActive: true
    },
    {
      id: 'razor',
      name: 'Cortar',
      category: 'selection',
      icon: Scissors,
      description: 'Cortar clips na timeline',
      shortcut: 'C'
    },
    {
      id: 'hand',
      name: 'Mover',
      category: 'navigation',
      icon: Move,
      description: 'Navegar pela timeline',
      shortcut: 'H'
    },

    // Transformação
    {
      id: 'rotate_cw',
      name: 'Girar Horário',
      category: 'transform',
      icon: RotateCw,
      description: 'Girar 90° no sentido horário',
      shortcut: 'Ctrl+R'
    },
    {
      id: 'rotate_ccw',
      name: 'Girar Anti-horário',
      category: 'transform',
      icon: RotateCcw,
      description: 'Girar 90° no sentido anti-horário',
      shortcut: 'Ctrl+Shift+R'
    },
    {
      id: 'flip_h',
      name: 'Espelhar H',
      category: 'transform',
      icon: FlipHorizontal,
      description: 'Espelhar horizontalmente',
      shortcut: 'Ctrl+H'
    },
    {
      id: 'flip_v',
      name: 'Espelhar V',
      category: 'transform',
      icon: FlipVertical,
      description: 'Espelhar verticalmente',
      shortcut: 'Ctrl+Shift+H'
    },

    // Recorte
    {
      id: 'crop',
      name: 'Recortar',
      category: 'crop',
      icon: Crop,
      description: 'Recortar imagem/vídeo',
      shortcut: 'Shift+C',
      hasOptions: true
    },

    // Texto
    {
      id: 'text',
      name: 'Texto',
      category: 'text',
      icon: Type,
      description: 'Adicionar texto',
      shortcut: 'T',
      hasOptions: true
    },

    // Efeitos
    {
      id: 'effects',
      name: 'Efeitos',
      category: 'effects',
      icon: Sparkles,
      description: 'Aplicar efeitos visuais',
      shortcut: 'E',
      hasOptions: true
    }
  ];

  const handleToolSelect = (toolId: string) => {
    setActiveTool(toolId);
    onToolSelect(toolId);
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    const frames = Math.floor((time % 1) * 30);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}:${frames.toString().padStart(2, '0')}`;
  };

  return (
    <div className="border-b bg-white">
      <div className="p-4 space-y-4">
        {/* Controles de Playback */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPlaybackControl('skipBack')}
            >
              <SkipBack className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPlaybackControl('rewind')}
            >
              <Rewind className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              onClick={() => onPlaybackControl(playbackState === 'playing' ? 'pause' : 'play')}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {playbackState === 'playing' ? (
                <Pause className="w-4 h-4" />
              ) : (
                <Play className="w-4 h-4" />
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPlaybackControl('stop')}
            >
              <StopCircle className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPlaybackControl('fastForward')}
            >
              <FastForward className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPlaybackControl('skipForward')}
            >
              <SkipForward className="w-4 h-4" />
            </Button>
          </div>

          {/* Indicador de Tempo */}
          <div className="flex items-center space-x-4">
            <div className="text-sm font-mono">
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>
            <Badge variant="outline">
              {selectedItems.length} item{selectedItems.length !== 1 ? 's' : ''} selecionado{selectedItems.length !== 1 ? 's' : ''}
            </Badge>
          </div>

          {/* Zoom */}
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onZoomChange(Math.max(0.1, zoom - 0.1))}
            >
              <ZoomOut className="w-4 h-4" />
            </Button>
            <div className="text-sm font-mono w-16 text-center">
              {Math.round(zoom * 100)}%
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onZoomChange(Math.min(5, zoom + 0.1))}
            >
              <ZoomIn className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onZoomChange(1)}
            >
              <Maximize className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Ferramentas por Categoria */}
        <Tabs defaultValue="selection" className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="selection">Seleção</TabsTrigger>
            <TabsTrigger value="transform">Transform</TabsTrigger>
            <TabsTrigger value="crop">Recorte</TabsTrigger>
            <TabsTrigger value="text">Texto</TabsTrigger>
            <TabsTrigger value="effects">Efeitos</TabsTrigger>
            <TabsTrigger value="audio">Áudio</TabsTrigger>
          </TabsList>

          <TabsContent value="selection" className="mt-4">
            <div className="flex items-center space-x-2">
              {tools.filter(t => t.category === 'selection' || t.category === 'navigation').map(tool => (
                <Button
                  key={tool.id}
                  variant={activeTool === tool.id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleToolSelect(tool.id)}
                  title={`${tool.description} (${tool.shortcut})`}
                >
                  <tool.icon className="w-4 h-4 mr-2" />
                  {tool.name}
                </Button>
              ))}
              
              <div className="h-6 w-px bg-gray-300 mx-2" />
              
              {/* Ações de Edição */}
              <Button
                variant="outline"
                size="sm"
                onClick={onCut}
                disabled={selectedItems.length === 0}
                title="Cortar (Ctrl+X)"
              >
                <Scissors className="w-4 h-4 mr-2" />
                Cortar
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onCopy}
                disabled={selectedItems.length === 0}
                title="Copiar (Ctrl+C)"
              >
                <Copy className="w-4 h-4 mr-2" />
                Copiar
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onPaste}
                title="Colar (Ctrl+V)"
              >
                <Paste className="w-4 h-4 mr-2" />
                Colar
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onDelete}
                disabled={selectedItems.length === 0}
                title="Deletar (Delete)"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Deletar
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="transform" className="mt-4">
            <div className="flex items-center space-x-2">
              {tools.filter(t => t.category === 'transform').map(tool => (
                <Button
                  key={tool.id}
                  variant="outline"
                  size="sm"
                  onClick={() => onTransform(tool.id)}
                  disabled={selectedItems.length === 0}
                  title={`${tool.description} (${tool.shortcut})`}
                >
                  <tool.icon className="w-4 h-4 mr-2" />
                  {tool.name}
                </Button>
              ))}
              
              <div className="h-6 w-px bg-gray-300 mx-2" />
              
              {/* Controles de Posição */}
              <div className="flex items-center space-x-2">
                <span className="text-sm">Posição:</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onTransform('align_left')}
                  disabled={selectedItems.length === 0}
                >
                  <AlignLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onTransform('align_center')}
                  disabled={selectedItems.length === 0}
                >
                  <AlignCenter className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onTransform('align_right')}
                  disabled={selectedItems.length === 0}
                >
                  <AlignRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="crop" className="mt-4">
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleToolSelect('crop')}
                disabled={selectedItems.length === 0}
              >
                <Crop className="w-4 h-4 mr-2" />
                Ativar Recorte
              </Button>
              
              <div className="flex items-center space-x-2">
                <span className="text-sm">Proporção:</span>
                <select className="text-sm border rounded px-2 py-1">
                  <option value="free">Livre</option>
                  <option value="16:9">16:9</option>
                  <option value="4:3">4:3</option>
                  <option value="1:1">1:1</option>
                  <option value="9:16">9:16</option>
                </select>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => onTransform('reset_crop')}
                disabled={selectedItems.length === 0}
              >
                Resetar
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="text" className="mt-4">
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleToolSelect('text')}
              >
                <Type className="w-4 h-4 mr-2" />
                Adicionar Texto
              </Button>
              
              <div className="flex items-center space-x-2">
                <span className="text-sm">Fonte:</span>
                <select className="text-sm border rounded px-2 py-1 w-32">
                  <option value="Arial">Arial</option>
                  <option value="Helvetica">Helvetica</option>
                  <option value="Times">Times</option>
                  <option value="Georgia">Georgia</option>
                  <option value="Verdana">Verdana</option>
                </select>
              </div>
              
              <div className="flex items-center space-x-2">
                <span className="text-sm">Tamanho:</span>
                <Input
                  type="number"
                  min="8"
                  max="200"
                  defaultValue="24"
                  className="w-16 text-sm"
                />
              </div>
              
              <div className="flex items-center space-x-1">
                <Button variant="outline" size="sm">
                  <Bold className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm">
                  <Italic className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm">
                  <Underline className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="effects" className="mt-4">
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleToolSelect('effects')}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Abrir Efeitos
              </Button>
              
              <Button variant="outline" size="sm">
                <Palette className="w-4 h-4 mr-2" />
                Correção de Cor
              </Button>
              
              <Button variant="outline" size="sm">
                <Wand2 className="w-4 h-4 mr-2" />
                Filtros
              </Button>
              
              <Button variant="outline" size="sm">
                <Wand2 className="w-4 h-4 mr-2" />
                IA Automática
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="audio" className="mt-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Volume2 className="w-4 h-4" />
                <span className="text-sm">Volume:</span>
                <Slider
                  defaultValue={[100]}
                  max={200}
                  step={1}
                  className="w-24"
                />
                <span className="text-sm w-8">100%</span>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => onTransform('mute')}
                disabled={selectedItems.length === 0}
              >
                <VolumeX className="w-4 h-4 mr-2" />
                Mutar
              </Button>
              
              <Button variant="outline" size="sm">
                <Mic className="w-4 h-4 mr-2" />
                Gravar Voz
              </Button>
              
              <Button variant="outline" size="sm">
                <Music className="w-4 h-4 mr-2" />
                Música de Fundo
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        {/* Barra de Tempo Interativa */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <span className="text-sm w-16">{formatTime(currentTime)}</span>
            <div className="flex-1 relative">
              <div className="w-full h-2 bg-gray-200 rounded-full">
                <div 
                  className="h-2 bg-blue-600 rounded-full relative"
                  style={{ width: `${(currentTime / duration) * 100}%` }}
                >
                  <div className="absolute right-0 top-1/2 transform translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-blue-600 rounded-full border-2 border-white shadow cursor-pointer" />
                </div>
              </div>
            </div>
            <span className="text-sm w-16">{formatTime(duration)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedEditingTools;