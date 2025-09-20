import React, { useState, useRef, useCallback, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  Copy, 
  Move, 
  RotateCcw, 
  RotateCw, 
  ZoomIn, 
  ZoomOut, 
  Grid, 
  Layers, 
  Type, 
  Image, 
  Video, 
  Music, 
  Square, 
  Circle, 
  Triangle, 
  Star, 
  Heart, 
  Play, 
  Pause, 
  Save, 
  Download, 
  Upload, 
  Settings, 
  Palette, 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  Bold, 
  Italic, 
  Underline,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useTemplates } from '@/hooks/useTemplates';
import { Template, TemplateElement, Animation, TemplateConstraints } from '@/types/templates';

interface TemplateBuilderProps {
  template?: Template;
  onSave?: (template: Template) => void;
  onPreview?: (template: Template) => void;
  onExport?: (template: Template) => void;
  className?: string;
}

interface BuilderElement extends TemplateElement {
  id: string;
  selected: boolean;
  locked: boolean;
  visible: boolean;
  zIndex: number;
}

interface CanvasState {
  zoom: number;
  pan: { x: number; y: number };
  showGrid: boolean;
  snapToGrid: boolean;
  gridSize: number;
}

interface LayerGroup {
  id: string;
  name: string;
  elements: string[];
  collapsed: boolean;
  visible: boolean;
  locked: boolean;
}

const TemplateBuilder: React.FC<TemplateBuilderProps> = ({
  template,
  onSave,
  onPreview,
  onExport,
  className = ''
}) => {
  // Canvas and elements state
  const [elements, setElements] = useState<BuilderElement[]>([]);
  const [selectedElements, setSelectedElements] = useState<string[]>([]);
  const [canvasState, setCanvasState] = useState<CanvasState>({
    zoom: 1,
    pan: { x: 0, y: 0 },
    showGrid: true,
    snapToGrid: true,
    gridSize: 20
  });
  
  // Template metadata
  const [templateName, setTemplateName] = useState(template?.name || 'Novo Template');
  const [templateDescription, setTemplateDescription] = useState(template?.description || '');
  const [templateCategory, setTemplateCategory] = useState(template?.category || 'social');
  const [templateTags, setTemplateTags] = useState<string[]>(template?.tags || []);
  const [templateDuration, setTemplateDuration] = useState(template?.duration || 30);
  
  // UI state
  const [activeTab, setActiveTab] = useState('elements');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [layerGroups, setLayerGroups] = useState<LayerGroup[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  
  // Refs
  const canvasRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ isDragging: boolean; startPos: { x: number; y: number } }>({ 
    isDragging: false, 
    startPos: { x: 0, y: 0 } 
  });
  
  // Load template data
  useEffect(() => {
    if (template) {
      const builderElements: BuilderElement[] = template.elements.map((el, index) => ({
        ...el,
        id: `element-${index}`,
        selected: false,
        locked: false,
        visible: true,
        zIndex: index
      }));
      setElements(builderElements);
    }
  }, [template]);
  
  // Element creation functions
  const createElement = useCallback((type: TemplateElement['type']) => {
    const newElement: BuilderElement = {
      id: `element-${Date.now()}`,
      type,
      position: { x: 100, y: 100 },
      size: { width: 200, height: 100 },
      rotation: 0,
      opacity: 1,
      selected: true,
      locked: false,
      visible: true,
      zIndex: elements.length,
      properties: getDefaultProperties(type),
      animations: [],
      constraints: {
        minWidth: 50,
        minHeight: 50,
        maxWidth: 1920,
        maxHeight: 1080,
        aspectRatio: null,
        lockAspectRatio: false
      }
    };
    
    setElements(prev => [...prev, newElement]);
    setSelectedElements([newElement.id]);
  }, [elements.length]);
  
  // Get default properties for element type
  const getDefaultProperties = (type: TemplateElement['type']) => {
    switch (type) {
      case 'text':
        return {
          content: 'Texto de exemplo',
          fontSize: 24,
          fontFamily: 'Arial',
          fontWeight: 'normal',
          color: '#000000',
          textAlign: 'left',
          lineHeight: 1.2
        };
      case 'image':
        return {
          src: 'https://via.placeholder.com/200x100',
          alt: 'Imagem',
          objectFit: 'cover'
        };
      case 'video':
        return {
          src: '',
          poster: 'https://via.placeholder.com/200x100',
          autoplay: false,
          loop: false,
          muted: true
        };
      case 'audio':
        return {
          src: '',
          autoplay: false,
          loop: false,
          volume: 0.5
        };
      case 'shape':
        return {
          shape: 'rectangle',
          fill: '#3b82f6',
          stroke: '#1e40af',
          strokeWidth: 2
        };
      default:
        return {};
    }
  };
  
  // Element manipulation
  const selectElement = useCallback((elementId: string, multiSelect = false) => {
    if (multiSelect) {
      setSelectedElements(prev => 
        prev.includes(elementId)
          ? prev.filter(id => id !== elementId)
          : [...prev, elementId]
      );
    } else {
      setSelectedElements([elementId]);
    }
    
    setElements(prev => prev.map(el => ({
      ...el,
      selected: multiSelect 
        ? (el.id === elementId ? !el.selected : el.selected)
        : el.id === elementId
    })));
  }, []);
  
  const updateElement = useCallback((elementId: string, updates: Partial<BuilderElement>) => {
    setElements(prev => prev.map(el => 
      el.id === elementId ? { ...el, ...updates } : el
    ));
  }, []);
  
  const deleteElement = useCallback((elementId: string) => {
    setElements(prev => prev.filter(el => el.id !== elementId));
    setSelectedElements(prev => prev.filter(id => id !== elementId));
  }, []);
  
  const duplicateElement = useCallback((elementId: string) => {
    const element = elements.find(el => el.id === elementId);
    if (element) {
      const newElement: BuilderElement = {
        ...element,
        id: `element-${Date.now()}`,
        position: {
          x: element.position.x + 20,
          y: element.position.y + 20
        },
        selected: true,
        zIndex: elements.length
      };
      
      setElements(prev => [...prev, newElement]);
      setSelectedElements([newElement.id]);
    }
  }, [elements]);
  
  // Canvas operations
  const zoomIn = () => {
    setCanvasState(prev => ({ ...prev, zoom: Math.min(prev.zoom * 1.2, 5) }));
  };
  
  const zoomOut = () => {
    setCanvasState(prev => ({ ...prev, zoom: Math.max(prev.zoom / 1.2, 0.1) }));
  };
  
  const resetZoom = () => {
    setCanvasState(prev => ({ ...prev, zoom: 1, pan: { x: 0, y: 0 } }));
  };
  
  // Save template
  const saveTemplate = useCallback(() => {
    const templateData: Template = {
      id: template?.id || `template-${Date.now()}`,
      name: templateName,
      description: templateDescription,
      category: templateCategory as any,
      tags: templateTags,
      thumbnail: 'https://via.placeholder.com/400x300',
      duration: templateDuration,
      elements: elements.map(({ id, selected, locked, visible, zIndex, ...el }) => el),
      createdAt: template?.createdAt || new Date(),
      updatedAt: new Date(),
      metadata: {
        author: {
          id: 'user-1',
          name: 'Usuário',
          avatar: ''
        },
        license: 'free',
        pricing: {
          type: 'free',
          amount: 0
        },
        analytics: {
          views: 0,
          downloads: 0,
          likes: 0,
          rating: 0
        }
      }
    };
    
    onSave?.(templateData);
  }, [templateName, templateDescription, templateCategory, templateTags, templateDuration, elements, template, onSave]);
  
  // Preview template
  const previewTemplate = useCallback(() => {
    const templateData: Template = {
      id: template?.id || `template-${Date.now()}`,
      name: templateName,
      description: templateDescription,
      category: templateCategory as any,
      tags: templateTags,
      thumbnail: 'https://via.placeholder.com/400x300',
      duration: templateDuration,
      elements: elements.map(({ id, selected, locked, visible, zIndex, ...el }) => el),
      createdAt: template?.createdAt || new Date(),
      updatedAt: new Date(),
      metadata: {
        author: {
          id: 'user-1',
          name: 'Usuário',
          avatar: ''
        },
        license: 'free',
        pricing: {
          type: 'free',
          amount: 0
        },
        analytics: {
          views: 0,
          downloads: 0,
          likes: 0,
          rating: 0
        }
      }
    };
    
    onPreview?.(templateData);
    setShowPreview(true);
  }, [templateName, templateDescription, templateCategory, templateTags, templateDuration, elements, template, onPreview]);
  
  // Render element on canvas
  const renderElement = (element: BuilderElement) => {
    const style: React.CSSProperties = {
      position: 'absolute',
      left: element.position.x,
      top: element.position.y,
      width: element.size.width,
      height: element.size.height,
      transform: `rotate(${element.rotation}deg)`,
      opacity: element.opacity,
      zIndex: element.zIndex,
      border: element.selected ? '2px solid #3b82f6' : 'none',
      cursor: 'move',
      display: element.visible ? 'block' : 'none'
    };
    
    let content;
    
    switch (element.type) {
      case 'text':
        content = (
          <div
            style={{
              fontSize: element.properties.fontSize,
              fontFamily: element.properties.fontFamily,
              fontWeight: element.properties.fontWeight,
              color: element.properties.color,
              textAlign: element.properties.textAlign,
              lineHeight: element.properties.lineHeight,
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              padding: '8px'
            }}
          >
            {element.properties.content}
          </div>
        );
        break;
        
      case 'image':
        content = (
          <img
            src={element.properties.src}
            alt={element.properties.alt}
            style={{
              width: '100%',
              height: '100%',
              objectFit: element.properties.objectFit
            }}
          />
        );
        break;
        
      case 'video':
        content = (
          <video
            src={element.properties.src}
            poster={element.properties.poster}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
            muted
          />
        );
        break;
        
      case 'shape':
        const shapeStyle = {
          width: '100%',
          height: '100%',
          backgroundColor: element.properties.fill,
          border: `${element.properties.strokeWidth}px solid ${element.properties.stroke}`
        };
        
        if (element.properties.shape === 'circle') {
          shapeStyle.borderRadius = '50%';
        } else if (element.properties.shape === 'rounded') {
          shapeStyle.borderRadius = '8px';
        }
        
        content = <div style={shapeStyle} />;
        break;
        
      default:
        content = (
          <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-500">
            {element.type}
          </div>
        );
    }
    
    return (
      <div
        key={element.id}
        style={style}
        onClick={(e) => {
          e.stopPropagation();
          selectElement(element.id, e.ctrlKey || e.metaKey);
        }}
        className={element.locked ? 'pointer-events-none' : ''}
      >
        {content}
        
        {/* Selection handles */}
        {element.selected && (
          <>
            <div className="absolute -top-1 -left-1 w-2 h-2 bg-blue-500 border border-white rounded-full" />
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 border border-white rounded-full" />
            <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-blue-500 border border-white rounded-full" />
            <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-blue-500 border border-white rounded-full" />
          </>
        )}
      </div>
    );
  };
  
  // Get selected element for properties panel
  const selectedElement = selectedElements.length === 1 
    ? elements.find(el => el.id === selectedElements[0])
    : null;
  
  return (
    <div className={`h-full flex ${className}`}>
      {/* Left Sidebar - Tools and Elements */}
      <div className="w-64 border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h3 className="font-semibold mb-4">Template Builder</h3>
          
          {/* Template Info */}
          <div className="space-y-2 mb-4">
            <Input
              placeholder="Nome do template"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
            />
            <Textarea
              placeholder="Descrição"
              value={templateDescription}
              onChange={(e) => setTemplateDescription(e.target.value)}
              rows={2}
            />
          </div>
          
          {/* Actions */}
          <div className="flex space-x-2">
            <Button size="sm" onClick={saveTemplate}>
              <Save className="w-4 h-4 mr-1" />
              Salvar
            </Button>
            <Button size="sm" variant="outline" onClick={previewTemplate}>
              <Play className="w-4 h-4 mr-1" />
              Preview
            </Button>
          </div>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="elements">Elementos</TabsTrigger>
            <TabsTrigger value="layers">Camadas</TabsTrigger>
            <TabsTrigger value="assets">Assets</TabsTrigger>
          </TabsList>
          
          <TabsContent value="elements" className="flex-1 p-4">
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Texto</h4>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => createElement('text')}
                >
                  <Type className="w-4 h-4 mr-2" />
                  Adicionar Texto
                </Button>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Mídia</h4>
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => createElement('image')}
                  >
                    <Image className="w-4 h-4 mr-2" />
                    Adicionar Imagem
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => createElement('video')}
                  >
                    <Video className="w-4 h-4 mr-2" />
                    Adicionar Vídeo
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => createElement('audio')}
                  >
                    <Music className="w-4 h-4 mr-2" />
                    Adicionar Áudio
                  </Button>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Formas</h4>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => createElement('shape')}
                  >
                    <Square className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => createElement('shape')}
                  >
                    <Circle className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => createElement('shape')}
                  >
                    <Triangle className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => createElement('shape')}
                  >
                    <Star className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="layers" className="flex-1 p-4">
            <ScrollArea className="h-full">
              <div className="space-y-2">
                {elements
                  .sort((a, b) => b.zIndex - a.zIndex)
                  .map(element => (
                    <div
                      key={element.id}
                      className={`flex items-center space-x-2 p-2 rounded cursor-pointer ${
                        element.selected ? 'bg-blue-100' : 'hover:bg-gray-100'
                      }`}
                      onClick={() => selectElement(element.id)}
                    >
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          updateElement(element.id, { visible: !element.visible });
                        }}
                      >
                        {element.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          updateElement(element.id, { locked: !element.locked });
                        }}
                      >
                        {element.locked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                      </Button>
                      
                      <div className="flex-1 text-sm truncate">
                        {element.type === 'text' 
                          ? element.properties.content || 'Texto'
                          : `${element.type.charAt(0).toUpperCase()}${element.type.slice(1)}`
                        }
                      </div>
                      
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          duplicateElement(element.id);
                        }}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteElement(element.id);
                        }}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  ))
                }
              </div>
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="assets" className="flex-1 p-4">
            <div className="text-center text-gray-500 text-sm">
              Assets em breve...
            </div>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Main Canvas Area */}
      <div className="flex-1 flex flex-col">
        {/* Canvas Toolbar */}
        <div className="p-2 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button size="sm" variant="outline" onClick={zoomOut}>
              <ZoomOut className="w-4 h-4" />
            </Button>
            <span className="text-sm font-mono">{Math.round(canvasState.zoom * 100)}%</span>
            <Button size="sm" variant="outline" onClick={zoomIn}>
              <ZoomIn className="w-4 h-4" />
            </Button>
            <Button size="sm" variant="outline" onClick={resetZoom}>
              Ajustar
            </Button>
            
            <Separator orientation="vertical" className="h-6" />
            
            <Button
              size="sm"
              variant={canvasState.showGrid ? 'default' : 'outline'}
              onClick={() => setCanvasState(prev => ({ ...prev, showGrid: !prev.showGrid }))}
            >
              <Grid className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">
              {selectedElements.length} selecionado(s)
            </span>
          </div>
        </div>
        
        {/* Canvas */}
        <div className="flex-1 overflow-hidden bg-gray-100">
          <div
            ref={canvasRef}
            className="relative w-full h-full"
            style={{
              transform: `scale(${canvasState.zoom}) translate(${canvasState.pan.x}px, ${canvasState.pan.y}px)`,
              transformOrigin: 'center center'
            }}
            onClick={() => setSelectedElements([])}
          >
            {/* Grid */}
            {canvasState.showGrid && (
              <div
                className="absolute inset-0 opacity-20"
                style={{
                  backgroundImage: `
                    linear-gradient(to right, #000 1px, transparent 1px),
                    linear-gradient(to bottom, #000 1px, transparent 1px)
                  `,
                  backgroundSize: `${canvasState.gridSize}px ${canvasState.gridSize}px`
                }}
              />
            )}
            
            {/* Canvas background */}
            <div 
              className="absolute bg-white shadow-lg"
              style={{
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)',
                width: 1920,
                height: 1080
              }}
            >
              {/* Elements */}
              {elements.map(renderElement)}
            </div>
          </div>
        </div>
      </div>
      
      {/* Right Sidebar - Properties */}
      <div className="w-80 border-l border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h3 className="font-semibold">Propriedades</h3>
        </div>
        
        <ScrollArea className="flex-1 p-4">
          {selectedElement ? (
            <div className="space-y-4">
              {/* Transform */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Transformação</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">X</Label>
                      <Input
                        type="number"
                        value={selectedElement.position.x}
                        onChange={(e) => updateElement(selectedElement.id, {
                          position: { ...selectedElement.position, x: Number(e.target.value) }
                        })}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Y</Label>
                      <Input
                        type="number"
                        value={selectedElement.position.y}
                        onChange={(e) => updateElement(selectedElement.id, {
                          position: { ...selectedElement.position, y: Number(e.target.value) }
                        })}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">Largura</Label>
                      <Input
                        type="number"
                        value={selectedElement.size.width}
                        onChange={(e) => updateElement(selectedElement.id, {
                          size: { ...selectedElement.size, width: Number(e.target.value) }
                        })}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Altura</Label>
                      <Input
                        type="number"
                        value={selectedElement.size.height}
                        onChange={(e) => updateElement(selectedElement.id, {
                          size: { ...selectedElement.size, height: Number(e.target.value) }
                        })}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-xs">Rotação: {selectedElement.rotation}°</Label>
                    <Slider
                      value={[selectedElement.rotation]}
                      onValueChange={([value]) => updateElement(selectedElement.id, { rotation: value })}
                      min={-180}
                      max={180}
                      step={1}
                    />
                  </div>
                  
                  <div>
                    <Label className="text-xs">Opacidade: {Math.round(selectedElement.opacity * 100)}%</Label>
                    <Slider
                      value={[selectedElement.opacity * 100]}
                      onValueChange={([value]) => updateElement(selectedElement.id, { opacity: value / 100 })}
                      min={0}
                      max={100}
                      step={1}
                    />
                  </div>
                </CardContent>
              </Card>
              
              {/* Type-specific properties */}
              {selectedElement.type === 'text' && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Texto</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label className="text-xs">Conteúdo</Label>
                      <Textarea
                        value={selectedElement.properties.content}
                        onChange={(e) => updateElement(selectedElement.id, {
                          properties: { ...selectedElement.properties, content: e.target.value }
                        })}
                        rows={3}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs">Fonte</Label>
                        <Select
                          value={selectedElement.properties.fontFamily}
                          onValueChange={(value) => updateElement(selectedElement.id, {
                            properties: { ...selectedElement.properties, fontFamily: value }
                          })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Arial">Arial</SelectItem>
                            <SelectItem value="Helvetica">Helvetica</SelectItem>
                            <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                            <SelectItem value="Georgia">Georgia</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label className="text-xs">Tamanho</Label>
                        <Input
                          type="number"
                          value={selectedElement.properties.fontSize}
                          onChange={(e) => updateElement(selectedElement.id, {
                            properties: { ...selectedElement.properties, fontSize: Number(e.target.value) }
                          })}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label className="text-xs">Cor</Label>
                      <Input
                        type="color"
                        value={selectedElement.properties.color}
                        onChange={(e) => updateElement(selectedElement.id, {
                          properties: { ...selectedElement.properties, color: e.target.value }
                        })}
                      />
                    </div>
                    
                    <div className="flex space-x-1">
                      <Button
                        size="sm"
                        variant={selectedElement.properties.textAlign === 'left' ? 'default' : 'outline'}
                        onClick={() => updateElement(selectedElement.id, {
                          properties: { ...selectedElement.properties, textAlign: 'left' }
                        })}
                      >
                        <AlignLeft className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant={selectedElement.properties.textAlign === 'center' ? 'default' : 'outline'}
                        onClick={() => updateElement(selectedElement.id, {
                          properties: { ...selectedElement.properties, textAlign: 'center' }
                        })}
                      >
                        <AlignCenter className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant={selectedElement.properties.textAlign === 'right' ? 'default' : 'outline'}
                        onClick={() => updateElement(selectedElement.id, {
                          properties: { ...selectedElement.properties, textAlign: 'right' }
                        })}
                      >
                        <AlignRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
              
              {selectedElement.type === 'shape' && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Forma</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label className="text-xs">Preenchimento</Label>
                      <Input
                        type="color"
                        value={selectedElement.properties.fill}
                        onChange={(e) => updateElement(selectedElement.id, {
                          properties: { ...selectedElement.properties, fill: e.target.value }
                        })}
                      />
                    </div>
                    
                    <div>
                      <Label className="text-xs">Borda</Label>
                      <Input
                        type="color"
                        value={selectedElement.properties.stroke}
                        onChange={(e) => updateElement(selectedElement.id, {
                          properties: { ...selectedElement.properties, stroke: e.target.value }
                        })}
                      />
                    </div>
                    
                    <div>
                      <Label className="text-xs">Espessura da borda</Label>
                      <Input
                        type="number"
                        value={selectedElement.properties.strokeWidth}
                        onChange={(e) => updateElement(selectedElement.id, {
                          properties: { ...selectedElement.properties, strokeWidth: Number(e.target.value) }
                        })}
                      />
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <div className="text-center text-gray-500 text-sm mt-8">
              Selecione um elemento para editar suas propriedades
            </div>
          )}
        </ScrollArea>
      </div>
      
      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Preview do Template</DialogTitle>
          </DialogHeader>
          
          <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
            <div className="w-full h-full bg-white relative">
              {elements.map(element => {
                const previewStyle: React.CSSProperties = {
                  position: 'absolute',
                  left: `${(element.position.x / 1920) * 100}%`,
                  top: `${(element.position.y / 1080) * 100}%`,
                  width: `${(element.size.width / 1920) * 100}%`,
                  height: `${(element.size.height / 1080) * 100}%`,
                  transform: `rotate(${element.rotation}deg)`,
                  opacity: element.opacity,
                  zIndex: element.zIndex
                };
                
                return (
                  <div key={element.id} style={previewStyle}>
                    {element.type === 'text' && (
                      <div
                        style={{
                          fontSize: `${(element.properties.fontSize / 1920) * 100}vw`,
                          fontFamily: element.properties.fontFamily,
                          color: element.properties.color,
                          textAlign: element.properties.textAlign,
                          width: '100%',
                          height: '100%',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                      >
                        {element.properties.content}
                      </div>
                    )}
                    
                    {element.type === 'image' && (
                      <img
                        src={element.properties.src}
                        alt={element.properties.alt}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: element.properties.objectFit
                        }}
                      />
                    )}
                    
                    {element.type === 'shape' && (
                      <div
                        style={{
                          width: '100%',
                          height: '100%',
                          backgroundColor: element.properties.fill,
                          border: `${element.properties.strokeWidth}px solid ${element.properties.stroke}`,
                          borderRadius: element.properties.shape === 'circle' ? '50%' : '0'
                        }}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TemplateBuilder;