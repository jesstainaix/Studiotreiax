import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Slider } from '../ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Switch } from '../ui/switch';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import { Separator } from '../ui/separator';
import {
  Settings,
  Layers,
  Palette,
  Zap,
  Eye,
  Download,
  Upload,
  Save,
  RotateCcw,
  Copy,
  Trash2,
  Plus,
  ChevronDown,
  ChevronUp,
  Lock,
  Unlock,
  Sparkles,
  Film,
  Type,
  Square
} from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible';
import { toast } from 'sonner';

// Import VFX components
import { GSAPAnimations, AnimationTemplate } from './GSAPAnimations';
import { ThreeJSParticles, ParticleEffect } from './ThreeJSParticles';
import { GreenScreenIntegration, GreenScreenConfig } from './GreenScreenIntegration';
import { TemplateMotionGraphics } from './TemplateMotionGraphics';
import { VFXPreviewSystem } from './VFXPreviewSystem';

interface VFXEffect {
  id: string;
  name: string;
  type: 'gsap' | 'particles' | 'greenscreen' | 'motion-graphics';
  enabled: boolean;
  settings: any;
  layer: number;
  startTime: number;
  duration: number;
  opacity: number;
  blendMode: string;
}

interface VFXProject {
  id: string;
  name: string;
  description: string;
  effects: VFXEffect[];
  globalSettings: {
    resolution: { width: number; height: number };
    frameRate: number;
    duration: number;
    backgroundColor: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface VFXConfigInterfaceProps {
  onExport?: (project: VFXProject) => void;
  onSave?: (project: VFXProject) => void;
  initialProject?: VFXProject;
}

const defaultProject: VFXProject = {
  id: 'new-project',
  name: 'Novo Projeto VFX',
  description: 'Projeto de efeitos visuais',
  effects: [],
  globalSettings: {
    resolution: { width: 1920, height: 1080 },
    frameRate: 30,
    duration: 10,
    backgroundColor: '#000000'
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

const effectTypes = [
  {
    type: 'gsap' as const,
    name: 'GSAP Animation',
    icon: Zap,
    description: 'Animações suaves e profissionais'
  },
  {
    type: 'particles' as const,
    name: 'Particle Effects',
    icon: Sparkles,
    description: 'Efeitos de partículas 3D'
  },
  {
    type: 'greenscreen' as const,
    name: 'Green Screen',
    icon: Film,
    description: 'Composição de vídeo chroma key'
  },
  {
    type: 'motion-graphics' as const,
    name: 'Motion Graphics',
    icon: Type,
    description: 'Gráficos animados e templates'
  }
];

const blendModes = [
  'normal', 'multiply', 'screen', 'overlay', 'soft-light',
  'hard-light', 'color-dodge', 'color-burn', 'darken', 'lighten',
  'difference', 'exclusion', 'hue', 'saturation', 'color', 'luminosity'
];

const resolutionPresets = [
  { name: '4K UHD', width: 3840, height: 2160 },
  { name: 'Full HD', width: 1920, height: 1080 },
  { name: 'HD', width: 1280, height: 720 },
  { name: 'SD', width: 854, height: 480 },
  { name: 'Square', width: 1080, height: 1080 },
  { name: 'Vertical', width: 1080, height: 1920 }
];

const EffectConfigPanel: React.FC<{
  effect: VFXEffect;
  onUpdate: (effect: VFXEffect) => void;
  onDelete: (effectId: string) => void;
}> = ({ effect, onUpdate, onDelete }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLocked, setIsLocked] = useState(false);

  const handleSettingChange = (key: string, value: any) => {
    onUpdate({
      ...effect,
      settings: {
        ...effect.settings,
        [key]: value
      }
    });
  };

  const handlePropertyChange = (key: keyof VFXEffect, value: any) => {
    onUpdate({
      ...effect,
      [key]: value
    });
  };

  const renderEffectSettings = () => {
    switch (effect.type) {
      case 'gsap':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Tipo de Animação</Label>
              <Select
                value={effect.settings.animation || 'fadeIn'}
                onValueChange={(value) => handleSettingChange('animation', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fadeIn">Fade In</SelectItem>
                  <SelectItem value="slideIn">Slide In</SelectItem>
                  <SelectItem value="rotateIn">Rotate In</SelectItem>
                  <SelectItem value="scaleIn">Scale In</SelectItem>
                  <SelectItem value="bounceIn">Bounce In</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Cor: {effect.settings.color || '#ff6b35'}</Label>
              <input
                type="color"
                value={effect.settings.color || '#ff6b35'}
                onChange={(e) => handleSettingChange('color', e.target.value)}
                className="w-full h-10 rounded border"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Easing</Label>
              <Select
                value={effect.settings.easing || 'power2.out'}
                onValueChange={(value) => handleSettingChange('easing', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="power1.out">Power 1 Out</SelectItem>
                  <SelectItem value="power2.out">Power 2 Out</SelectItem>
                  <SelectItem value="power3.out">Power 3 Out</SelectItem>
                  <SelectItem value="back.out(1.7)">Back Out</SelectItem>
                  <SelectItem value="elastic.out(1, 0.3)">Elastic Out</SelectItem>
                  <SelectItem value="bounce.out">Bounce Out</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );
        
      case 'particles':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Tipo de Efeito</Label>
              <Select
                value={effect.settings.effectType || 'sparkles'}
                onValueChange={(value) => handleSettingChange('effectType', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sparkles">Sparkles</SelectItem>
                  <SelectItem value="fire">Fire</SelectItem>
                  <SelectItem value="smoke">Smoke</SelectItem>
                  <SelectItem value="snow">Snow</SelectItem>
                  <SelectItem value="rain">Rain</SelectItem>
                  <SelectItem value="stars">Stars</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Quantidade de Partículas: {effect.settings.particleCount || 100}</Label>
              <Slider
                value={[effect.settings.particleCount || 100]}
                onValueChange={([value]) => handleSettingChange('particleCount', value)}
                min={10}
                max={1000}
                step={10}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Tamanho: {effect.settings.size || 2}</Label>
              <Slider
                value={[effect.settings.size || 2]}
                onValueChange={([value]) => handleSettingChange('size', value)}
                min={0.5}
                max={10}
                step={0.1}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Velocidade: {effect.settings.speed || 1}</Label>
              <Slider
                value={[effect.settings.speed || 1]}
                onValueChange={([value]) => handleSettingChange('speed', value)}
                min={0.1}
                max={5}
                step={0.1}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Cor das Partículas</Label>
              <input
                type="color"
                value={effect.settings.color || '#9d4edd'}
                onChange={(e) => handleSettingChange('color', e.target.value)}
                className="w-full h-10 rounded border"
              />
            </div>
          </div>
        );
        
      case 'greenscreen':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Cor Chroma Key</Label>
              <input
                type="color"
                value={effect.settings.chromaColor || '#00ff00'}
                onChange={(e) => handleSettingChange('chromaColor', e.target.value)}
                className="w-full h-10 rounded border"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Tolerância: {((effect.settings.tolerance || 0.3) * 100).toFixed(0)}%</Label>
              <Slider
                value={[effect.settings.tolerance || 0.3]}
                onValueChange={([value]) => handleSettingChange('tolerance', value)}
                min={0}
                max={1}
                step={0.01}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Suavização: {((effect.settings.smoothness || 0.1) * 100).toFixed(0)}%</Label>
              <Slider
                value={[effect.settings.smoothness || 0.1]}
                onValueChange={([value]) => handleSettingChange('smoothness', value)}
                min={0}
                max={1}
                step={0.01}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Derramamento: {((effect.settings.spillSuppression || 0.5) * 100).toFixed(0)}%</Label>
              <Slider
                value={[effect.settings.spillSuppression || 0.5]}
                onValueChange={([value]) => handleSettingChange('spillSuppression', value)}
                min={0}
                max={1}
                step={0.01}
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                checked={effect.settings.edgeBlur || false}
                onCheckedChange={(checked) => handleSettingChange('edgeBlur', checked)}
                id={`edge-blur-${effect.id}`}
              />
              <Label htmlFor={`edge-blur-${effect.id}`}>Desfoque nas Bordas</Label>
            </div>
          </div>
        );
        
      case 'motion-graphics':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Texto</Label>
              <Input
                value={effect.settings.text || 'Motion Graphics'}
                onChange={(e) => handleSettingChange('text', e.target.value)}
                placeholder="Digite seu texto..."
              />
            </div>
            
            <div className="space-y-2">
              <Label>Tamanho da Fonte: {effect.settings.fontSize || 48}px</Label>
              <Slider
                value={[effect.settings.fontSize || 48]}
                onValueChange={([value]) => handleSettingChange('fontSize', value)}
                min={12}
                max={120}
                step={1}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Família da Fonte</Label>
              <Select
                value={effect.settings.fontFamily || 'Arial'}
                onValueChange={(value) => handleSettingChange('fontFamily', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Arial">Arial</SelectItem>
                  <SelectItem value="Helvetica">Helvetica</SelectItem>
                  <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                  <SelectItem value="Georgia">Georgia</SelectItem>
                  <SelectItem value="Verdana">Verdana</SelectItem>
                  <SelectItem value="Impact">Impact</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Cor do Texto</Label>
              <input
                type="color"
                value={effect.settings.color || '#ffffff'}
                onChange={(e) => handleSettingChange('color', e.target.value)}
                className="w-full h-10 rounded border"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Escala: {((effect.settings.scale || 1) * 100).toFixed(0)}%</Label>
              <Slider
                value={[effect.settings.scale || 1]}
                onValueChange={([value]) => handleSettingChange('scale', value)}
                min={0.1}
                max={3}
                step={0.1}
              />
            </div>
          </div>
        );
        
      default:
        return <div>Configurações não disponíveis para este tipo de efeito.</div>;
    }
  };

  const effectTypeInfo = effectTypes.find(t => t.type === effect.type);
  const Icon = effectTypeInfo?.icon || Square;

  return (
    <Card className="mb-4">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Icon className="w-5 h-5" />
                <div>
                  <CardTitle className="text-sm">{effect.name}</CardTitle>
                  <p className="text-xs text-gray-500">
                    Camada {effect.layer} • {effect.startTime}s - {effect.startTime + effect.duration}s
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Badge variant={effect.enabled ? 'default' : 'secondary'}>
                  {effect.enabled ? 'Ativo' : 'Inativo'}
                </Badge>
                
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsLocked(!isLocked);
                  }}
                >
                  {isLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                </Button>
                
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(effect.id);
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
                
                {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="pt-0">
            <div className="space-y-6">
              {/* Basic Properties */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nome do Efeito</Label>
                  <Input
                    value={effect.name}
                    onChange={(e) => handlePropertyChange('name', e.target.value)}
                    disabled={isLocked}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Camada</Label>
                  <Input
                    type="number"
                    value={effect.layer}
                    onChange={(e) => handlePropertyChange('layer', parseInt(e.target.value))}
                    min={1}
                    max={100}
                    disabled={isLocked}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Tempo de Início (s)</Label>
                  <Input
                    type="number"
                    value={effect.startTime}
                    onChange={(e) => handlePropertyChange('startTime', parseFloat(e.target.value))}
                    min={0}
                    step={0.1}
                    disabled={isLocked}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Duração (s)</Label>
                  <Input
                    type="number"
                    value={effect.duration}
                    onChange={(e) => handlePropertyChange('duration', parseFloat(e.target.value))}
                    min={0.1}
                    step={0.1}
                    disabled={isLocked}
                  />
                </div>
              </div>
              
              {/* Advanced Properties */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Opacidade: {(effect.opacity * 100).toFixed(0)}%</Label>
                  <Slider
                    value={[effect.opacity]}
                    onValueChange={([value]) => handlePropertyChange('opacity', value)}
                    min={0}
                    max={1}
                    step={0.01}
                    disabled={isLocked}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Modo de Mistura</Label>
                  <Select
                    value={effect.blendMode}
                    onValueChange={(value) => handlePropertyChange('blendMode', value)}
                    disabled={isLocked}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {blendModes.map(mode => (
                        <SelectItem key={mode} value={mode}>
                          {mode}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={effect.enabled}
                    onCheckedChange={(checked) => handlePropertyChange('enabled', checked)}
                    id={`enabled-${effect.id}`}
                    disabled={isLocked}
                  />
                  <Label htmlFor={`enabled-${effect.id}`}>Efeito Ativo</Label>
                </div>
              </div>
              
              <Separator />
              
              {/* Effect-specific Settings */}
              <div>
                <h4 className="font-medium mb-4">Configurações Específicas</h4>
                {!isLocked ? renderEffectSettings() : (
                  <div className="text-center py-4 text-gray-500">
                    <Lock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>Efeito bloqueado para edição</p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};

export const VFXConfigInterface: React.FC<VFXConfigInterfaceProps> = ({
  onExport,
  onSave,
  initialProject
}) => {
  const [project, setProject] = useState<VFXProject>(initialProject || defaultProject);
  const [selectedEffectType, setSelectedEffectType] = useState<string>('');
  const [showPreview, setShowPreview] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    if (initialProject) {
      setProject(initialProject);
    }
  }, [initialProject]);

  const addEffect = useCallback((type: VFXEffect['type']) => {
    const newEffect: VFXEffect = {
      id: `effect-${Date.now()}`,
      name: `${effectTypes.find(t => t.type === type)?.name || 'Novo Efeito'}`,
      type,
      enabled: true,
      settings: {},
      layer: project.effects.length + 1,
      startTime: 0,
      duration: 3,
      opacity: 1,
      blendMode: 'normal'
    };
    
    setProject(prev => ({
      ...prev,
      effects: [...prev.effects, newEffect],
      updatedAt: new Date().toISOString()
    }));
    
    toast.success(`Efeito ${newEffect.name} adicionado!`);
  }, [project.effects.length]);

  const updateEffect = useCallback((updatedEffect: VFXEffect) => {
    setProject(prev => ({
      ...prev,
      effects: prev.effects.map(effect => 
        effect.id === updatedEffect.id ? updatedEffect : effect
      ),
      updatedAt: new Date().toISOString()
    }));
  }, []);

  const deleteEffect = useCallback((effectId: string) => {
    setProject(prev => ({
      ...prev,
      effects: prev.effects.filter(effect => effect.id !== effectId),
      updatedAt: new Date().toISOString()
    }));
    
    toast.success('Efeito removido!');
  }, []);

  const duplicateEffect = useCallback((effectId: string) => {
    const effectToDuplicate = project.effects.find(e => e.id === effectId);
    if (effectToDuplicate) {
      const duplicatedEffect: VFXEffect = {
        ...effectToDuplicate,
        id: `effect-${Date.now()}`,
        name: `${effectToDuplicate.name} (Cópia)`,
        layer: project.effects.length + 1
      };
      
      setProject(prev => ({
        ...prev,
        effects: [...prev.effects, duplicatedEffect],
        updatedAt: new Date().toISOString()
      }));
      
      toast.success('Efeito duplicado!');
    }
  }, [project.effects]);

  const updateGlobalSettings = useCallback((key: string, value: any) => {
    setProject(prev => ({
      ...prev,
      globalSettings: {
        ...prev.globalSettings,
        [key]: value
      },
      updatedAt: new Date().toISOString()
    }));
  }, []);

  const handleSave = useCallback(() => {
    onSave?.(project);
    toast.success('Projeto salvo com sucesso!');
  }, [project, onSave]);

  const handleExport = useCallback(async () => {
    setIsExporting(true);
    try {
      await onExport?.(project);
      toast.success('Projeto exportado com sucesso!');
    } catch (error) {
      toast.error('Erro ao exportar projeto');
    } finally {
      setIsExporting(false);
    }
  }, [project, onExport]);

  const handleImportProject = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedProject = JSON.parse(e.target?.result as string);
          setProject(importedProject);
          toast.success('Projeto importado com sucesso!');
        } catch (error) {
          toast.error('Erro ao importar projeto');
        }
      };
      reader.readAsText(file);
    }
  }, []);

  const sortedEffects = [...project.effects].sort((a, b) => a.layer - b.layer);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Interface de Configuração VFX
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Configure e gerencie todos os efeitos visuais do seu projeto
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPreview(!showPreview)}
              >
                <Eye className="w-4 h-4" />
                {showPreview ? 'Ocultar' : 'Preview'}
              </Button>
              
              <Button variant="outline" size="sm" onClick={handleSave}>
                <Save className="w-4 h-4" />
                Salvar
              </Button>
              
              <Button 
                size="sm" 
                onClick={handleExport}
                disabled={isExporting}
              >
                <Download className="w-4 h-4" />
                {isExporting ? 'Exportando...' : 'Exportar'}
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <Tabs defaultValue="effects" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="effects">Efeitos</TabsTrigger>
              <TabsTrigger value="global">Global</TabsTrigger>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
              <TabsTrigger value="export">Exportar</TabsTrigger>
            </TabsList>

            <TabsContent value="effects" className="space-y-6">
              {/* Add Effect Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Adicionar Efeito</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {effectTypes.map(effectType => {
                      const Icon = effectType.icon;
                      return (
                        <Button
                          key={effectType.type}
                          variant="outline"
                          className="h-auto p-4 flex flex-col items-center gap-2"
                          onClick={() => addEffect(effectType.type)}
                        >
                          <Icon className="w-8 h-8" />
                          <div className="text-center">
                            <div className="font-medium">{effectType.name}</div>
                            <div className="text-xs text-gray-500">{effectType.description}</div>
                          </div>
                        </Button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Effects List */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Efeitos do Projeto ({project.effects.length})</h3>
                  
                  {project.effects.length > 0 && (
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        <RotateCcw className="w-4 h-4" />
                        Resetar Todos
                      </Button>
                    </div>
                  )}
                </div>
                
                {project.effects.length === 0 ? (
                  <Card>
                    <CardContent className="text-center py-12">
                      <Layers className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <h3 className="font-medium mb-2">Nenhum efeito adicionado</h3>
                      <p className="text-gray-600 mb-4">
                        Comece adicionando um efeito visual ao seu projeto
                      </p>
                      <Button onClick={() => addEffect('gsap')}>
                        <Plus className="w-4 h-4 mr-2" />
                        Adicionar Primeiro Efeito
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <ScrollArea className="h-96">
                    <div className="space-y-2 pr-4">
                      {sortedEffects.map(effect => (
                        <EffectConfigPanel
                          key={effect.id}
                          effect={effect}
                          onUpdate={updateEffect}
                          onDelete={deleteEffect}
                        />
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </div>
            </TabsContent>

            <TabsContent value="global" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Configurações Globais</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Project Info */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Nome do Projeto</Label>
                      <Input
                        value={project.name}
                        onChange={(e) => setProject(prev => ({ ...prev, name: e.target.value }))}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Descrição</Label>
                      <Input
                        value={project.description}
                        onChange={(e) => setProject(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Descreva seu projeto..."
                      />
                    </div>
                  </div>
                  
                  <Separator />
                  
                  {/* Resolution Settings */}
                  <div className="space-y-4">
                    <h4 className="font-medium">Resolução e Qualidade</h4>
                    
                    <div className="space-y-2">
                      <Label>Preset de Resolução</Label>
                      <Select onValueChange={(value) => {
                        const preset = resolutionPresets.find(p => p.name === value);
                        if (preset) {
                          updateGlobalSettings('resolution', { width: preset.width, height: preset.height });
                        }
                      }}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um preset" />
                        </SelectTrigger>
                        <SelectContent>
                          {resolutionPresets.map(preset => (
                            <SelectItem key={preset.name} value={preset.name}>
                              {preset.name} ({preset.width}x{preset.height})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Largura</Label>
                        <Input
                          type="number"
                          value={project.globalSettings.resolution.width}
                          onChange={(e) => updateGlobalSettings('resolution', {
                            ...project.globalSettings.resolution,
                            width: parseInt(e.target.value)
                          })}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Altura</Label>
                        <Input
                          type="number"
                          value={project.globalSettings.resolution.height}
                          onChange={(e) => updateGlobalSettings('resolution', {
                            ...project.globalSettings.resolution,
                            height: parseInt(e.target.value)
                          })}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Frame Rate: {project.globalSettings.frameRate} FPS</Label>
                      <Slider
                        value={[project.globalSettings.frameRate]}
                        onValueChange={([value]) => updateGlobalSettings('frameRate', value)}
                        min={15}
                        max={60}
                        step={1}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Duração Total: {project.globalSettings.duration}s</Label>
                      <Slider
                        value={[project.globalSettings.duration]}
                        onValueChange={([value]) => updateGlobalSettings('duration', value)}
                        min={1}
                        max={60}
                        step={0.1}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Cor de Fundo</Label>
                      <input
                        type="color"
                        value={project.globalSettings.backgroundColor}
                        onChange={(e) => updateGlobalSettings('backgroundColor', e.target.value)}
                        className="w-full h-10 rounded border"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="timeline" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Timeline dos Efeitos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-sm text-gray-600">
                      Duração total: {project.globalSettings.duration}s
                    </div>
                    
                    {/* Timeline visualization would go here */}
                    <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                      <div className="text-center text-gray-500">
                        <Film className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>Visualização da Timeline</p>
                        <p className="text-sm">Em desenvolvimento</p>
                      </div>
                    </div>
                    
                    {/* Effects summary */}
                    <div className="space-y-2">
                      <h4 className="font-medium">Resumo dos Efeitos</h4>
                      {sortedEffects.map(effect => (
                        <div key={effect.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">L{effect.layer}</Badge>
                            <span className="text-sm">{effect.name}</span>
                          </div>
                          <div className="text-xs text-gray-500">
                            {effect.startTime}s - {effect.startTime + effect.duration}s
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="export" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Exportar e Importar</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Export Section */}
                    <div className="space-y-4">
                      <h4 className="font-medium">Exportar Projeto</h4>
                      
                      <div className="space-y-2">
                        <Button 
                          className="w-full" 
                          onClick={handleExport}
                          disabled={isExporting}
                        >
                          <Download className="w-4 h-4 mr-2" />
                          {isExporting ? 'Exportando...' : 'Exportar como JSON'}
                        </Button>
                        
                        <Button variant="outline" className="w-full">
                          <Film className="w-4 h-4 mr-2" />
                          Renderizar Vídeo
                        </Button>
                      </div>
                      
                      <div className="text-xs text-gray-500">
                        <p>• JSON: Salva configurações do projeto</p>
                        <p>• Vídeo: Renderiza resultado final</p>
                      </div>
                    </div>
                    
                    {/* Import Section */}
                    <div className="space-y-4">
                      <h4 className="font-medium">Importar Projeto</h4>
                      
                      <div className="space-y-2">
                        <label htmlFor="import-file">
                          <Button variant="outline" className="w-full">
                            <Upload className="w-4 h-4 mr-2" />
                            Importar JSON
                          </Button>
                        </label>
                        <input
                          id="import-file"
                          type="file"
                          accept=".json"
                          onChange={handleImportProject}
                          className="hidden"
                        />
                      </div>
                      
                      <div className="text-xs text-gray-500">
                        <p>• Carregue um projeto salvo anteriormente</p>
                        <p>• Substitui o projeto atual</p>
                      </div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  {/* Project Stats */}
                  <div className="space-y-4">
                    <h4 className="font-medium">Estatísticas do Projeto</h4>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <div className="text-2xl font-bold">{project.effects.length}</div>
                        <div className="text-sm text-gray-600">Efeitos</div>
                      </div>
                      
                      <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <div className="text-2xl font-bold">{project.globalSettings.duration}s</div>
                        <div className="text-sm text-gray-600">Duração</div>
                      </div>
                      
                      <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <div className="text-2xl font-bold">
                          {project.globalSettings.resolution.width}x{project.globalSettings.resolution.height}
                        </div>
                        <div className="text-sm text-gray-600">Resolução</div>
                      </div>
                      
                      <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <div className="text-2xl font-bold">{project.globalSettings.frameRate}</div>
                        <div className="text-sm text-gray-600">FPS</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Preview Panel */}
      {showPreview && (
        <VFXPreviewSystem
          layers={project.effects.map(effect => ({
            id: effect.id,
            name: effect.name,
            type: effect.type as any,
            enabled: effect.enabled,
            opacity: effect.opacity,
            blendMode: effect.blendMode,
            startTime: effect.startTime,
            duration: effect.duration,
            settings: effect.settings
          }))}
          onLayersChange={(layers) => {
            const updatedEffects = layers.map(layer => {
              const existingEffect = project.effects.find(e => e.id === layer.id);
              return existingEffect ? {
                ...existingEffect,
                enabled: layer.enabled,
                opacity: layer.opacity,
                blendMode: layer.blendMode,
                startTime: layer.startTime,
                duration: layer.duration
              } : existingEffect;
            }).filter(Boolean) as VFXEffect[];
            
            setProject(prev => ({
              ...prev,
              effects: updatedEffects,
              updatedAt: new Date().toISOString()
            }));
          }}
          onExport={handleExport}
        />
      )}
    </div>
  );
};

export default VFXConfigInterface;