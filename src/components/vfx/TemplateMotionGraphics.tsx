import React, { useState, useRef, useEffect, useCallback } from 'react';
import { gsap } from 'gsap';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Slider } from '../ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import { 
  Play, 
  Pause, 
  Download, 
  Copy, 
  Edit3, 
  Type, 
  Square, 
  Circle, 
  Triangle, 
  Star,
  Zap,
  Sparkles,
  Heart,
  ArrowRight,
  RotateCw,
  Move,
  Palette
} from 'lucide-react';

interface MotionTemplate {
  id: string;
  name: string;
  category: 'text' | 'shapes' | 'transitions' | 'effects' | 'logos' | 'social';
  description: string;
  duration: number;
  preview: string;
  settings: TemplateSettings;
  keyframes: Keyframe[];
  thumbnail?: string;
}

interface TemplateSettings {
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  color?: string;
  backgroundColor?: string;
  strokeColor?: string;
  strokeWidth?: number;
  scale?: number;
  rotation?: number;
  opacity?: number;
  blur?: number;
  shadow?: boolean;
  shadowColor?: string;
  shadowBlur?: number;
  shadowOffsetX?: number;
  shadowOffsetY?: number;
  gradient?: {
    enabled: boolean;
    colors: string[];
    direction: number;
  };
  animation?: {
    easing: string;
    delay: number;
    repeat: number;
    yoyo: boolean;
  };
}

interface Keyframe {
  time: number;
  properties: Record<string, any>;
  easing?: string;
}

const defaultSettings: TemplateSettings = {
  text: 'Sample Text',
  fontSize: 48,
  fontFamily: 'Arial',
  color: '#ffffff',
  backgroundColor: 'transparent',
  strokeColor: '#000000',
  strokeWidth: 0,
  scale: 1,
  rotation: 0,
  opacity: 1,
  blur: 0,
  shadow: false,
  shadowColor: '#000000',
  shadowBlur: 10,
  shadowOffsetX: 5,
  shadowOffsetY: 5,
  gradient: {
    enabled: false,
    colors: ['#ff6b35', '#f7931e'],
    direction: 0
  },
  animation: {
    easing: 'power2.out',
    delay: 0,
    repeat: 0,
    yoyo: false
  }
};

const motionTemplates: MotionTemplate[] = [
  // Text Templates
  {
    id: 'text-fade-in',
    name: 'Fade In Text',
    category: 'text',
    description: 'Texto que aparece suavemente com fade',
    duration: 2,
    preview: 'Fade In',
    settings: { ...defaultSettings, text: 'Fade In Text' },
    keyframes: [
      { time: 0, properties: { opacity: 0, y: 20 } },
      { time: 1, properties: { opacity: 1, y: 0 }, easing: 'power2.out' }
    ]
  },
  {
    id: 'text-typewriter',
    name: 'Typewriter Effect',
    category: 'text',
    description: 'Efeito de máquina de escrever',
    duration: 3,
    preview: 'Type...',
    settings: { ...defaultSettings, text: 'Typewriter Effect' },
    keyframes: [
      { time: 0, properties: { width: 0 } },
      { time: 2, properties: { width: '100%' }, easing: 'none' }
    ]
  },
  {
    id: 'text-bounce',
    name: 'Bouncy Text',
    category: 'text',
    description: 'Texto com animação de bounce',
    duration: 1.5,
    preview: 'Bounce!',
    settings: { ...defaultSettings, text: 'Bouncy Text' },
    keyframes: [
      { time: 0, properties: { scale: 0, rotation: -180 } },
      { time: 0.8, properties: { scale: 1.2, rotation: 0 }, easing: 'back.out(1.7)' },
      { time: 1, properties: { scale: 1 }, easing: 'power2.out' }
    ]
  },
  {
    id: 'text-glitch',
    name: 'Glitch Text',
    category: 'text',
    description: 'Efeito de glitch digital',
    duration: 2,
    preview: 'GL1TCH',
    settings: { ...defaultSettings, text: 'Glitch Text', color: '#00ff00' },
    keyframes: [
      { time: 0, properties: { x: 0, opacity: 1 } },
      { time: 0.1, properties: { x: -5, opacity: 0.8 } },
      { time: 0.2, properties: { x: 5, opacity: 1 } },
      { time: 0.3, properties: { x: -2, opacity: 0.9 } },
      { time: 0.4, properties: { x: 0, opacity: 1 } }
    ]
  },
  
  // Shape Templates
  {
    id: 'shape-morph',
    name: 'Shape Morph',
    category: 'shapes',
    description: 'Transformação entre formas geométricas',
    duration: 2,
    preview: '○→□',
    settings: { ...defaultSettings, color: '#9d4edd' },
    keyframes: [
      { time: 0, properties: { borderRadius: '50%', rotation: 0 } },
      { time: 1, properties: { borderRadius: '0%', rotation: 180 }, easing: 'power2.inOut' }
    ]
  },
  {
    id: 'shape-pulse',
    name: 'Pulsing Circle',
    category: 'shapes',
    description: 'Círculo com efeito de pulsação',
    duration: 1,
    preview: '●',
    settings: { ...defaultSettings, color: '#ff6b35' },
    keyframes: [
      { time: 0, properties: { scale: 1, opacity: 1 } },
      { time: 0.5, properties: { scale: 1.3, opacity: 0.7 }, easing: 'power2.out' },
      { time: 1, properties: { scale: 1, opacity: 1 }, easing: 'power2.in' }
    ]
  },
  
  // Transition Templates
  {
    id: 'transition-slide',
    name: 'Slide Transition',
    category: 'transitions',
    description: 'Transição deslizante lateral',
    duration: 1,
    preview: '→',
    settings: { ...defaultSettings },
    keyframes: [
      { time: 0, properties: { x: '-100%', opacity: 0 } },
      { time: 0.8, properties: { x: '0%', opacity: 1 }, easing: 'power3.out' }
    ]
  },
  {
    id: 'transition-zoom',
    name: 'Zoom Transition',
    category: 'transitions',
    description: 'Transição com zoom dramático',
    duration: 1.2,
    preview: '⚡',
    settings: { ...defaultSettings },
    keyframes: [
      { time: 0, properties: { scale: 0, rotation: -90, opacity: 0 } },
      { time: 0.7, properties: { scale: 1.1, rotation: 0, opacity: 1 }, easing: 'back.out(2)' },
      { time: 1, properties: { scale: 1 }, easing: 'power2.out' }
    ]
  },
  
  // Effect Templates
  {
    id: 'effect-particles',
    name: 'Particle Burst',
    category: 'effects',
    description: 'Explosão de partículas',
    duration: 2,
    preview: '✨',
    settings: { ...defaultSettings, color: '#ffd700' },
    keyframes: [
      { time: 0, properties: { scale: 0, opacity: 0 } },
      { time: 0.3, properties: { scale: 1.5, opacity: 1 }, easing: 'power2.out' },
      { time: 1.5, properties: { scale: 2, opacity: 0 }, easing: 'power2.in' }
    ]
  },
  {
    id: 'effect-neon',
    name: 'Neon Glow',
    category: 'effects',
    description: 'Efeito de brilho neon',
    duration: 1.5,
    preview: '💫',
    settings: { 
      ...defaultSettings, 
      color: '#00ffff',
      shadow: true,
      shadowColor: '#00ffff',
      shadowBlur: 20
    },
    keyframes: [
      { time: 0, properties: { opacity: 0.5, shadowBlur: 5 } },
      { time: 0.5, properties: { opacity: 1, shadowBlur: 30 }, easing: 'power2.out' },
      { time: 1, properties: { opacity: 0.8, shadowBlur: 15 }, easing: 'power2.in' }
    ]
  },
  
  // Logo Templates
  {
    id: 'logo-reveal',
    name: 'Logo Reveal',
    category: 'logos',
    description: 'Revelação dramática de logo',
    duration: 2.5,
    preview: '🎯',
    settings: { ...defaultSettings },
    keyframes: [
      { time: 0, properties: { scale: 0, rotation: -180, opacity: 0 } },
      { time: 1, properties: { scale: 1.2, rotation: 0, opacity: 1 }, easing: 'back.out(1.7)' },
      { time: 1.5, properties: { scale: 1 }, easing: 'power2.out' }
    ]
  },
  
  // Social Media Templates
  {
    id: 'social-like',
    name: 'Like Animation',
    category: 'social',
    description: 'Animação de curtida para redes sociais',
    duration: 1,
    preview: '❤️',
    settings: { ...defaultSettings, color: '#ff3040' },
    keyframes: [
      { time: 0, properties: { scale: 0, rotation: -30 } },
      { time: 0.4, properties: { scale: 1.3, rotation: 0 }, easing: 'back.out(3)' },
      { time: 0.8, properties: { scale: 1 }, easing: 'power2.out' }
    ]
  }
];

const fontFamilies = [
  'Arial', 'Helvetica', 'Times New Roman', 'Georgia', 'Verdana',
  'Courier New', 'Impact', 'Comic Sans MS', 'Trebuchet MS', 'Arial Black'
];

const easingOptions = [
  'none', 'power1.out', 'power2.out', 'power3.out', 'power4.out',
  'back.out(1.7)', 'elastic.out(1, 0.3)', 'bounce.out', 'circ.out', 'expo.out'
];

interface TemplateMotionGraphicsProps {
  onTemplateSelect?: (template: MotionTemplate) => void;
  onExport?: (template: MotionTemplate, settings: TemplateSettings) => void;
}

const TemplatePreview: React.FC<{
  template: MotionTemplate;
  settings: TemplateSettings;
  isPlaying: boolean;
}> = ({ template, settings, isPlaying }) => {
  const elementRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);

  const createTimeline = useCallback(() => {
    if (!elementRef.current) return;

    // Clear previous timeline
    if (timelineRef.current) {
      timelineRef.current.kill();
    }

    const element = elementRef.current;
    const tl = gsap.timeline({ repeat: -1, yoyo: settings.animation?.yoyo });

    // Set initial state
    gsap.set(element, {
      ...template.keyframes[0]?.properties,
      fontSize: settings.fontSize,
      color: settings.color,
      fontFamily: settings.fontFamily,
      scale: settings.scale,
      rotation: settings.rotation,
      opacity: settings.opacity
    });

    // Add keyframes to timeline
    template.keyframes.forEach((keyframe, index) => {
      if (index === 0) return; // Skip initial state
      
      tl.to(element, {
        ...keyframe.properties,
        duration: keyframe.time - (template.keyframes[index - 1]?.time || 0),
        ease: keyframe.easing || settings.animation?.easing || 'power2.out',
        delay: index === 1 ? settings.animation?.delay || 0 : 0
      });
    });

    timelineRef.current = tl;
    
    if (!isPlaying) {
      tl.pause();
    }
  }, [template, settings, isPlaying]);

  useEffect(() => {
    createTimeline();
    
    return () => {
      if (timelineRef.current) {
        timelineRef.current.kill();
      }
    };
  }, [createTimeline]);

  useEffect(() => {
    if (timelineRef.current) {
      if (isPlaying) {
        timelineRef.current.play();
      } else {
        timelineRef.current.pause();
      }
    }
  }, [isPlaying]);

  const getElementStyle = () => {
    const style: React.CSSProperties = {
      fontSize: settings.fontSize,
      fontFamily: settings.fontFamily,
      color: settings.color,
      backgroundColor: settings.backgroundColor,
      transform: `scale(${settings.scale}) rotate(${settings.rotation}deg)`,
      opacity: settings.opacity,
      filter: settings.blur ? `blur(${settings.blur}px)` : undefined,
      border: settings.strokeWidth ? `${settings.strokeWidth}px solid ${settings.strokeColor}` : undefined,
      textShadow: settings.shadow ? `${settings.shadowOffsetX}px ${settings.shadowOffsetY}px ${settings.shadowBlur}px ${settings.shadowColor}` : undefined,
      background: settings.gradient?.enabled 
        ? `linear-gradient(${settings.gradient.direction}deg, ${settings.gradient.colors.join(', ')})` 
        : settings.backgroundColor,
      WebkitBackgroundClip: settings.gradient?.enabled ? 'text' : undefined,
      WebkitTextFillColor: settings.gradient?.enabled ? 'transparent' : undefined,
      padding: '10px',
      borderRadius: '8px',
      display: 'inline-block',
      whiteSpace: 'nowrap'
    };
    
    return style;
  };

  const renderElement = () => {
    switch (template.category) {
      case 'text':
        return (
          <div ref={elementRef} style={getElementStyle()}>
            {settings.text || template.preview}
          </div>
        );
      case 'shapes':
        return (
          <div 
            ref={elementRef} 
            style={{
              ...getElementStyle(),
              width: '60px',
              height: '60px',
              backgroundColor: settings.color,
              borderRadius: template.id.includes('circle') ? '50%' : '8px'
            }}
          />
        );
      default:
        return (
          <div ref={elementRef} style={getElementStyle()}>
            {template.preview}
          </div>
        );
    }
  };

  return (
    <div className="flex items-center justify-center h-32 bg-gray-900 rounded-lg overflow-hidden">
      {renderElement()}
    </div>
  );
};

export const TemplateMotionGraphics: React.FC<TemplateMotionGraphicsProps> = ({
  onTemplateSelect,
  onExport
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState<MotionTemplate | null>(null);
  const [customSettings, setCustomSettings] = useState<TemplateSettings>(defaultSettings);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const categories = ['all', 'text', 'shapes', 'transitions', 'effects', 'logos', 'social'];
  
  const categoryIcons = {
    text: Type,
    shapes: Square,
    transitions: ArrowRight,
    effects: Sparkles,
    logos: Star,
    social: Heart
  };

  const filteredTemplates = motionTemplates.filter(template => {
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleTemplateSelect = (template: MotionTemplate) => {
    setSelectedTemplate(template);
    setCustomSettings({ ...defaultSettings, ...template.settings });
    onTemplateSelect?.(template);
  };

  const handleSettingChange = (key: keyof TemplateSettings, value: any) => {
    setCustomSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleNestedSettingChange = (parentKey: keyof TemplateSettings, childKey: string, value: any) => {
    setCustomSettings(prev => ({
      ...prev,
      [parentKey]: {
        ...prev[parentKey] as any,
        [childKey]: value
      }
    }));
  };

  const handleExport = () => {
    if (selectedTemplate) {
      onExport?.(selectedTemplate, customSettings);
    }
  };

  const handleDuplicate = () => {
    if (selectedTemplate) {
      const duplicatedTemplate: MotionTemplate = {
        ...selectedTemplate,
        id: `${selectedTemplate.id}-copy-${Date.now()}`,
        name: `${selectedTemplate.name} (Cópia)`,
        settings: customSettings
      };
      setSelectedTemplate(duplicatedTemplate);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>🎨</span>
            Template Motion Graphics
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Search and Filter */}
          <div className="space-y-4 mb-6">
            <Input
              placeholder="Buscar templates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
            
            <div className="flex flex-wrap gap-2">
              {categories.map(category => {
                const Icon = category !== 'all' ? categoryIcons[category as keyof typeof categoryIcons] : null;
                return (
                  <Button
                    key={category}
                    variant={selectedCategory === category ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedCategory(category)}
                    className="flex items-center gap-2"
                  >
                    {Icon && <Icon className="w-4 h-4" />}
                    {category === 'all' ? 'Todos' : category.charAt(0).toUpperCase() + category.slice(1)}
                  </Button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Template Library */}
            <div className="lg:col-span-2 space-y-4">
              <h3 className="font-semibold">Biblioteca de Templates</h3>
              <ScrollArea className="h-96">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pr-4">
                  {filteredTemplates.map(template => {
                    const Icon = categoryIcons[template.category as keyof typeof categoryIcons];
                    return (
                      <Card 
                        key={template.id} 
                        className={`cursor-pointer transition-all hover:shadow-lg ${
                          selectedTemplate?.id === template.id ? 'ring-2 ring-blue-500' : ''
                        }`}
                        onClick={() => handleTemplateSelect(template)}
                      >
                        <CardContent className="p-4">
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium">{template.name}</h4>
                              <Badge variant="secondary" className="flex items-center gap-1">
                                {Icon && <Icon className="w-3 h-3" />}
                                {template.category}
                              </Badge>
                            </div>
                            
                            <TemplatePreview
                              template={template}
                              settings={selectedTemplate?.id === template.id ? customSettings : template.settings}
                              isPlaying={selectedTemplate?.id === template.id && isPlaying}
                            />
                            
                            <p className="text-sm text-gray-600">{template.description}</p>
                            
                            <div className="flex justify-between items-center text-xs text-gray-500">
                              <span>{template.duration}s</span>
                              <div className="flex gap-1">
                                <Button size="sm" variant="ghost" onClick={(e) => {
                                  e.stopPropagation();
                                  handleTemplateSelect(template);
                                }}>
                                  <Edit3 className="w-3 h-3" />
                                </Button>
                                <Button size="sm" variant="ghost" onClick={(e) => {
                                  e.stopPropagation();
                                  navigator.clipboard.writeText(JSON.stringify(template));
                                }}>
                                  <Copy className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>

            {/* Template Editor */}
            <div className="space-y-4">
              {selectedTemplate ? (
                <>
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">Editor de Template</h3>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setIsPlaying(!isPlaying)}
                      >
                        {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      </Button>
                      <Button size="sm" variant="outline" onClick={handleDuplicate}>
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button size="sm" onClick={handleExport}>
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <Card>
                    <CardContent className="p-4">
                      <TemplatePreview
                        template={selectedTemplate}
                        settings={customSettings}
                        isPlaying={isPlaying}
                      />
                    </CardContent>
                  </Card>

                  <Tabs defaultValue="content" className="w-full">
                    <TabsList className="grid w-full grid-cols-4">
                      <TabsTrigger value="content">Conteúdo</TabsTrigger>
                      <TabsTrigger value="style">Estilo</TabsTrigger>
                      <TabsTrigger value="effects">Efeitos</TabsTrigger>
                      <TabsTrigger value="animation">Animação</TabsTrigger>
                    </TabsList>

                    <TabsContent value="content" className="space-y-4">
                      {selectedTemplate.category === 'text' && (
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Texto</label>
                          <Input
                            value={customSettings.text || ''}
                            onChange={(e) => handleSettingChange('text', e.target.value)}
                            placeholder="Digite seu texto..."
                          />
                        </div>
                      )}
                      
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Família da Fonte</label>
                        <Select
                          value={customSettings.fontFamily}
                          onValueChange={(value) => handleSettingChange('fontFamily', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {fontFamilies.map(font => (
                              <SelectItem key={font} value={font}>{font}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-medium">
                          Tamanho da Fonte: {customSettings.fontSize}px
                        </label>
                        <Slider
                          value={[customSettings.fontSize || 48]}
                          onValueChange={([value]) => handleSettingChange('fontSize', value)}
                          min={12}
                          max={120}
                          step={1}
                        />
                      </div>
                    </TabsContent>

                    <TabsContent value="style" className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Cor Principal</label>
                        <input
                          type="color"
                          value={customSettings.color}
                          onChange={(e) => handleSettingChange('color', e.target.value)}
                          className="w-full h-10 rounded border"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Cor de Fundo</label>
                        <input
                          type="color"
                          value={customSettings.backgroundColor}
                          onChange={(e) => handleSettingChange('backgroundColor', e.target.value)}
                          className="w-full h-10 rounded border"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-medium">
                          Escala: {((customSettings.scale || 1) * 100).toFixed(0)}%
                        </label>
                        <Slider
                          value={[customSettings.scale || 1]}
                          onValueChange={([value]) => handleSettingChange('scale', value)}
                          min={0.1}
                          max={3}
                          step={0.1}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-medium">
                          Rotação: {customSettings.rotation || 0}°
                        </label>
                        <Slider
                          value={[customSettings.rotation || 0]}
                          onValueChange={([value]) => handleSettingChange('rotation', value)}
                          min={-180}
                          max={180}
                          step={1}
                        />
                      </div>
                    </TabsContent>

                    <TabsContent value="effects" className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">
                          Opacidade: {((customSettings.opacity || 1) * 100).toFixed(0)}%
                        </label>
                        <Slider
                          value={[customSettings.opacity || 1]}
                          onValueChange={([value]) => handleSettingChange('opacity', value)}
                          min={0}
                          max={1}
                          step={0.01}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-medium">
                          Desfoque: {customSettings.blur || 0}px
                        </label>
                        <Slider
                          value={[customSettings.blur || 0]}
                          onValueChange={([value]) => handleSettingChange('blur', value)}
                          min={0}
                          max={20}
                          step={0.5}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Sombra</label>
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={customSettings.shadow || false}
                            onChange={(e) => handleSettingChange('shadow', e.target.checked)}
                            className="rounded"
                          />
                          <span className="text-sm">Ativar sombra</span>
                        </div>
                      </div>
                      
                      {customSettings.shadow && (
                        <>
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Cor da Sombra</label>
                            <input
                              type="color"
                              value={customSettings.shadowColor}
                              onChange={(e) => handleSettingChange('shadowColor', e.target.value)}
                              className="w-full h-10 rounded border"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <label className="text-sm font-medium">
                              Desfoque da Sombra: {customSettings.shadowBlur}px
                            </label>
                            <Slider
                              value={[customSettings.shadowBlur || 10]}
                              onValueChange={([value]) => handleSettingChange('shadowBlur', value)}
                              min={0}
                              max={50}
                              step={1}
                            />
                          </div>
                        </>
                      )}
                    </TabsContent>

                    <TabsContent value="animation" className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Easing</label>
                        <Select
                          value={customSettings.animation?.easing}
                          onValueChange={(value) => handleNestedSettingChange('animation', 'easing', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {easingOptions.map(easing => (
                              <SelectItem key={easing} value={easing}>{easing}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-medium">
                          Delay: {customSettings.animation?.delay || 0}s
                        </label>
                        <Slider
                          value={[customSettings.animation?.delay || 0]}
                          onValueChange={([value]) => handleNestedSettingChange('animation', 'delay', value)}
                          min={0}
                          max={5}
                          step={0.1}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-medium">
                          Repetições: {customSettings.animation?.repeat || 0}
                        </label>
                        <Slider
                          value={[customSettings.animation?.repeat || 0]}
                          onValueChange={([value]) => handleNestedSettingChange('animation', 'repeat', value)}
                          min={0}
                          max={10}
                          step={1}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Yoyo (Ida e Volta)</label>
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={customSettings.animation?.yoyo || false}
                            onChange={(e) => handleNestedSettingChange('animation', 'yoyo', e.target.checked)}
                            className="rounded"
                          />
                          <span className="text-sm">Ativar yoyo</span>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Palette className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Selecione um template para começar a editar</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TemplateMotionGraphics;