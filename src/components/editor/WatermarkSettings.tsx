import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Upload, 
  Image, 
  Type, 
  Move, 
  Eye, 
  EyeOff, 
  RotateCcw, 
  Palette,
  Download,
  Trash2,
  Copy
} from 'lucide-react';

interface WatermarkPosition {
  x: number; // 0-100 percentage
  y: number; // 0-100 percentage
  anchor: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
}

interface TextWatermark {
  text: string;
  fontSize: number;
  fontFamily: string;
  color: string;
  bold: boolean;
  italic: boolean;
  outline: boolean;
  outlineColor: string;
  outlineWidth: number;
}

interface ImageWatermark {
  file: File | null;
  url: string;
  width: number;
  height: number;
  maintainAspectRatio: boolean;
}

interface WatermarkSettings {
  enabled: boolean;
  type: 'text' | 'image' | 'both';
  opacity: number;
  position: WatermarkPosition;
  rotation: number;
  fadeIn: boolean;
  fadeOut: boolean;
  textWatermark: TextWatermark;
  imageWatermark: ImageWatermark;
  blendMode: 'normal' | 'multiply' | 'screen' | 'overlay' | 'soft-light';
  animation: 'none' | 'fade' | 'slide' | 'pulse';
}

interface WatermarkSettingsProps {
  settings: WatermarkSettings;
  onSettingsChange: (settings: WatermarkSettings) => void;
  previewDimensions: { width: number; height: number };
}

const fontFamilies = [
  'Arial',
  'Helvetica',
  'Times New Roman',
  'Georgia',
  'Verdana',
  'Trebuchet MS',
  'Impact',
  'Comic Sans MS',
  'Courier New',
  'Lucida Console'
];

const positionPresets = [
  { name: 'Superior Esquerdo', anchor: 'top-left' as const, x: 5, y: 5 },
  { name: 'Superior Direito', anchor: 'top-right' as const, x: 95, y: 5 },
  { name: 'Inferior Esquerdo', anchor: 'bottom-left' as const, x: 5, y: 95 },
  { name: 'Inferior Direito', anchor: 'bottom-right' as const, x: 95, y: 95 },
  { name: 'Centro', anchor: 'center' as const, x: 50, y: 50 }
];

const blendModes = [
  { value: 'normal', label: 'Normal' },
  { value: 'multiply', label: 'Multiplicar' },
  { value: 'screen', label: 'Tela' },
  { value: 'overlay', label: 'Sobreposição' },
  { value: 'soft-light', label: 'Luz Suave' }
];

const animations = [
  { value: 'none', label: 'Nenhuma' },
  { value: 'fade', label: 'Fade In/Out' },
  { value: 'slide', label: 'Deslizar' },
  { value: 'pulse', label: 'Pulsar' }
];

export const WatermarkSettings: React.FC<WatermarkSettingsProps> = ({
  settings,
  onSettingsChange,
  previewDimensions
}) => {
  const [activeTab, setActiveTab] = useState('general');
  const [dragPosition, setDragPosition] = useState<{ x: number; y: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  const updateSettings = (updates: Partial<WatermarkSettings>) => {
    onSettingsChange({ ...settings, ...updates });
  };

  const updateTextWatermark = (updates: Partial<TextWatermark>) => {
    updateSettings({
      textWatermark: { ...settings.textWatermark, ...updates }
    });
  };

  const updateImageWatermark = (updates: Partial<ImageWatermark>) => {
    updateSettings({
      imageWatermark: { ...settings.imageWatermark, ...updates }
    });
  };

  const updatePosition = (updates: Partial<WatermarkPosition>) => {
    updateSettings({
      position: { ...settings.position, ...updates }
    });
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      updateImageWatermark({ file, url });
      
      // Get image dimensions
      const img = new Image();
      img.onload = () => {
        updateImageWatermark({
          width: Math.min(img.width, 200),
          height: Math.min(img.height, 200)
        });
      };
      img.src = url;
    }
  };

  const handlePositionPreset = (preset: typeof positionPresets[0]) => {
    updatePosition({
      anchor: preset.anchor,
      x: preset.x,
      y: preset.y
    });
  };

  const handlePreviewClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!previewRef.current) return;
    
    const rect = previewRef.current.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    
    updatePosition({ x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) });
  };

  const resetSettings = () => {
    const defaultSettings: WatermarkSettings = {
      enabled: false,
      type: 'text',
      opacity: 80,
      position: { x: 95, y: 95, anchor: 'bottom-right' },
      rotation: 0,
      fadeIn: false,
      fadeOut: false,
      textWatermark: {
        text: 'Meu Canal',
        fontSize: 24,
        fontFamily: 'Arial',
        color: '#ffffff',
        bold: false,
        italic: false,
        outline: true,
        outlineColor: '#000000',
        outlineWidth: 2
      },
      imageWatermark: {
        file: null,
        url: '',
        width: 100,
        height: 100,
        maintainAspectRatio: true
      },
      blendMode: 'normal',
      animation: 'none'
    };
    onSettingsChange(defaultSettings);
  };

  const exportPreset = () => {
    const preset = {
      name: 'Meu Preset',
      settings: { ...settings }
    };
    
    const blob = new Blob([JSON.stringify(preset, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'watermark-preset.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Image className="w-5 h-5" />
              <span>Watermark e Branding</span>
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Switch
                checked={settings.enabled}
                onCheckedChange={(checked) => updateSettings({ enabled: checked })}
              />
              <Badge variant={settings.enabled ? "default" : "secondary"}>
                {settings.enabled ? 'Ativo' : 'Inativo'}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex space-x-2">
              <Button
                variant={settings.type === 'text' ? 'default' : 'outline'}
                size="sm"
                onClick={() => updateSettings({ type: 'text' })}
              >
                <Type className="w-4 h-4 mr-1" />
                Texto
              </Button>
              <Button
                variant={settings.type === 'image' ? 'default' : 'outline'}
                size="sm"
                onClick={() => updateSettings({ type: 'image' })}
              >
                <Image className="w-4 h-4 mr-1" />
                Imagem
              </Button>
              <Button
                variant={settings.type === 'both' ? 'default' : 'outline'}
                size="sm"
                onClick={() => updateSettings({ type: 'both' })}
              >
                <Copy className="w-4 h-4 mr-1" />
                Ambos
              </Button>
            </div>
            
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" onClick={exportPreset}>
                <Download className="w-4 h-4 mr-1" />
                Exportar
              </Button>
              <Button variant="outline" size="sm" onClick={resetSettings}>
                <RotateCcw className="w-4 h-4 mr-1" />
                Reset
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {settings.enabled && (
        <>
          {/* Preview */}
          <Card>
            <CardHeader>
              <CardTitle>Preview Interativo</CardTitle>
            </CardHeader>
            <CardContent>
              <div 
                ref={previewRef}
                className="relative bg-gray-900 rounded-lg overflow-hidden cursor-crosshair"
                style={{ aspectRatio: `${previewDimensions.width}/${previewDimensions.height}` }}
                onClick={handlePreviewClick}
              >
                {/* Video placeholder */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                  <span className="text-white text-lg font-medium">Preview do Vídeo</span>
                </div>
                
                {/* Watermark preview */}
                <div
                  className="absolute pointer-events-none"
                  style={{
                    left: `${settings.position.x}%`,
                    top: `${settings.position.y}%`,
                    transform: `translate(-50%, -50%) rotate(${settings.rotation}deg)`,
                    opacity: settings.opacity / 100,
                    mixBlendMode: settings.blendMode as any
                  }}
                >
                  {(settings.type === 'text' || settings.type === 'both') && (
                    <div
                      style={{
                        fontSize: `${settings.textWatermark.fontSize}px`,
                        fontFamily: settings.textWatermark.fontFamily,
                        color: settings.textWatermark.color,
                        fontWeight: settings.textWatermark.bold ? 'bold' : 'normal',
                        fontStyle: settings.textWatermark.italic ? 'italic' : 'normal',
                        textShadow: settings.textWatermark.outline 
                          ? `0 0 ${settings.textWatermark.outlineWidth}px ${settings.textWatermark.outlineColor}`
                          : 'none'
                      }}
                    >
                      {settings.textWatermark.text}
                    </div>
                  )}
                  
                  {(settings.type === 'image' || settings.type === 'both') && settings.imageWatermark.url && (
                    <img
                      src={settings.imageWatermark.url}
                      alt="Watermark"
                      style={{
                        width: `${settings.imageWatermark.width}px`,
                        height: settings.imageWatermark.maintainAspectRatio 
                          ? 'auto' 
                          : `${settings.imageWatermark.height}px`,
                        maxWidth: '200px',
                        maxHeight: '200px'
                      }}
                    />
                  )}
                </div>
                
                {/* Position indicator */}
                <div
                  className="absolute w-2 h-2 bg-red-500 rounded-full border-2 border-white pointer-events-none"
                  style={{
                    left: `${settings.position.x}%`,
                    top: `${settings.position.y}%`,
                    transform: 'translate(-50%, -50%)'
                  }}
                />
              </div>
              
              <div className="mt-4 text-sm text-gray-600">
                <p>Clique na área de preview para posicionar o watermark</p>
                <p>Posição atual: X: {settings.position.x.toFixed(1)}%, Y: {settings.position.y.toFixed(1)}%</p>
              </div>
            </CardContent>
          </Card>

          {/* Settings Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="general">Geral</TabsTrigger>
              <TabsTrigger value="text">Texto</TabsTrigger>
              <TabsTrigger value="image">Imagem</TabsTrigger>
              <TabsTrigger value="effects">Efeitos</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Posicionamento</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Presets de Posição</Label>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mt-2">
                      {positionPresets.map((preset) => (
                        <Button
                          key={preset.name}
                          variant="outline"
                          size="sm"
                          onClick={() => handlePositionPreset(preset)}
                          className="text-xs"
                        >
                          {preset.name}
                        </Button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Posição X (%)</Label>
                      <Slider
                        value={[settings.position.x]}
                        onValueChange={([value]) => updatePosition({ x: value })}
                        min={0}
                        max={100}
                        step={0.1}
                        className="mt-2"
                      />
                      <span className="text-sm text-gray-500">{settings.position.x.toFixed(1)}%</span>
                    </div>
                    <div>
                      <Label>Posição Y (%)</Label>
                      <Slider
                        value={[settings.position.y]}
                        onValueChange={([value]) => updatePosition({ y: value })}
                        min={0}
                        max={100}
                        step={0.1}
                        className="mt-2"
                      />
                      <span className="text-sm text-gray-500">{settings.position.y.toFixed(1)}%</span>
                    </div>
                  </div>
                  
                  <div>
                    <Label>Rotação (graus)</Label>
                    <Slider
                      value={[settings.rotation]}
                      onValueChange={([value]) => updateSettings({ rotation: value })}
                      min={-180}
                      max={180}
                      step={1}
                      className="mt-2"
                    />
                    <span className="text-sm text-gray-500">{settings.rotation}°</span>
                  </div>
                  
                  <div>
                    <Label>Opacidade</Label>
                    <Slider
                      value={[settings.opacity]}
                      onValueChange={([value]) => updateSettings({ opacity: value })}
                      min={0}
                      max={100}
                      step={1}
                      className="mt-2"
                    />
                    <span className="text-sm text-gray-500">{settings.opacity}%</span>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="text" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Configurações de Texto</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Texto do Watermark</Label>
                    <Input
                      value={settings.textWatermark.text}
                      onChange={(e) => updateTextWatermark({ text: e.target.value })}
                      placeholder="Digite seu texto..."
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Fonte</Label>
                      <Select 
                        value={settings.textWatermark.fontFamily} 
                        onValueChange={(value) => updateTextWatermark({ fontFamily: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {fontFamilies.map((font) => (
                            <SelectItem key={font} value={font}>
                              <span style={{ fontFamily: font }}>{font}</span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label>Tamanho da Fonte</Label>
                      <Input
                        type="number"
                        value={settings.textWatermark.fontSize}
                        onChange={(e) => updateTextWatermark({ fontSize: parseInt(e.target.value) })}
                        min={8}
                        max={72}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Cor do Texto</Label>
                      <div className="flex space-x-2 mt-1">
                        <Input
                          type="color"
                          value={settings.textWatermark.color}
                          onChange={(e) => updateTextWatermark({ color: e.target.value })}
                          className="w-12 h-10 p-1 border rounded"
                        />
                        <Input
                          value={settings.textWatermark.color}
                          onChange={(e) => updateTextWatermark({ color: e.target.value })}
                          placeholder="#ffffff"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Estilo</Label>
                      <div className="flex space-x-2">
                        <Button
                          variant={settings.textWatermark.bold ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => updateTextWatermark({ bold: !settings.textWatermark.bold })}
                        >
                          <strong>B</strong>
                        </Button>
                        <Button
                          variant={settings.textWatermark.italic ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => updateTextWatermark({ italic: !settings.textWatermark.italic })}
                        >
                          <em>I</em>
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Contorno</Label>
                      <Switch
                        checked={settings.textWatermark.outline}
                        onCheckedChange={(checked) => updateTextWatermark({ outline: checked })}
                      />
                    </div>
                    
                    {settings.textWatermark.outline && (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Cor do Contorno</Label>
                          <div className="flex space-x-2 mt-1">
                            <Input
                              type="color"
                              value={settings.textWatermark.outlineColor}
                              onChange={(e) => updateTextWatermark({ outlineColor: e.target.value })}
                              className="w-12 h-10 p-1 border rounded"
                            />
                            <Input
                              value={settings.textWatermark.outlineColor}
                              onChange={(e) => updateTextWatermark({ outlineColor: e.target.value })}
                              placeholder="#000000"
                            />
                          </div>
                        </div>
                        
                        <div>
                          <Label>Largura do Contorno</Label>
                          <Input
                            type="number"
                            value={settings.textWatermark.outlineWidth}
                            onChange={(e) => updateTextWatermark({ outlineWidth: parseInt(e.target.value) })}
                            min={1}
                            max={10}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="image" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Configurações de Imagem</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Upload de Logo/Imagem</Label>
                    <div className="mt-2">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                      <Button
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        {settings.imageWatermark.file ? 'Alterar Imagem' : 'Selecionar Imagem'}
                      </Button>
                    </div>
                    
                    {settings.imageWatermark.url && (
                      <div className="mt-2 p-2 border rounded-lg">
                        <img
                          src={settings.imageWatermark.url}
                          alt="Preview"
                          className="max-w-full max-h-32 object-contain mx-auto"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateImageWatermark({ file: null, url: '' })}
                          className="mt-2 w-full"
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Remover
                        </Button>
                      </div>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Largura (px)</Label>
                      <Input
                        type="number"
                        value={settings.imageWatermark.width}
                        onChange={(e) => updateImageWatermark({ width: parseInt(e.target.value) })}
                        min={10}
                        max={500}
                      />
                    </div>
                    
                    <div>
                      <Label>Altura (px)</Label>
                      <Input
                        type="number"
                        value={settings.imageWatermark.height}
                        onChange={(e) => updateImageWatermark({ height: parseInt(e.target.value) })}
                        min={10}
                        max={500}
                        disabled={settings.imageWatermark.maintainAspectRatio}
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label>Manter Proporção</Label>
                    <Switch
                      checked={settings.imageWatermark.maintainAspectRatio}
                      onCheckedChange={(checked) => updateImageWatermark({ maintainAspectRatio: checked })}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="effects" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Efeitos e Animações</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Modo de Mistura</Label>
                    <Select 
                      value={settings.blendMode} 
                      onValueChange={(value: any) => updateSettings({ blendMode: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {blendModes.map((mode) => (
                          <SelectItem key={mode.value} value={mode.value}>
                            {mode.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label>Animação</Label>
                    <Select 
                      value={settings.animation} 
                      onValueChange={(value: any) => updateSettings({ animation: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {animations.map((animation) => (
                          <SelectItem key={animation.value} value={animation.value}>
                            {animation.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Fade In no Início</Label>
                        <p className="text-xs text-gray-500">Aparece gradualmente</p>
                      </div>
                      <Switch
                        checked={settings.fadeIn}
                        onCheckedChange={(checked) => updateSettings({ fadeIn: checked })}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Fade Out no Final</Label>
                        <p className="text-xs text-gray-500">Desaparece gradualmente</p>
                      </div>
                      <Switch
                        checked={settings.fadeOut}
                        onCheckedChange={(checked) => updateSettings({ fadeOut: checked })}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
};