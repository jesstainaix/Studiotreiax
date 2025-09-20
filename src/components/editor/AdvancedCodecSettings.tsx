import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AlertTriangle, Info, Settings, Zap, HardDrive, Clock } from 'lucide-react';

export interface CodecSettings {
  // Video Codec
  videoCodec: 'h264' | 'h265' | 'vp9' | 'av1';
  profile: string;
  level: string;
  
  // Quality Settings
  quality: 'constant' | 'variable' | 'constrained';
  crf: number; // Constant Rate Factor (0-51)
  bitrate: number; // kbps
  maxBitrate: number; // kbps
  bufferSize: number; // kbps
  
  // Resolution & Frame Rate
  resolution: { width: number; height: number };
  frameRate: number;
  aspectRatio: string;
  
  // Advanced Video
  keyframeInterval: number; // seconds
  bFrames: number;
  referenceFrames: number;
  motionEstimation: 'fast' | 'medium' | 'slow' | 'veryslow';
  
  // Audio Settings
  audioCodec: 'aac' | 'mp3' | 'opus' | 'flac';
  audioBitrate: number;
  audioSampleRate: number;
  audioChannels: 1 | 2 | 6 | 8;
  
  // Hardware Acceleration
  hardwareAcceleration: boolean;
  gpuType: 'nvidia' | 'amd' | 'intel' | 'auto';
  
  // Advanced Options
  twoPass: boolean;
  fastStart: boolean;
  pixelFormat: 'yuv420p' | 'yuv422p' | 'yuv444p';
}

interface AdvancedCodecSettingsProps {
  settings: CodecSettings;
  onChange: (settings: CodecSettings) => void;
  onPreset: (preset: string) => void;
}

const codecProfiles = {
  h264: {
    profiles: ['baseline', 'main', 'high', 'high10', 'high422', 'high444'],
    levels: ['3.0', '3.1', '3.2', '4.0', '4.1', '4.2', '5.0', '5.1', '5.2'],
    description: 'Amplamente compatível, boa qualidade'
  },
  h265: {
    profiles: ['main', 'main10', 'main422-10', 'main444-10'],
    levels: ['3.0', '3.1', '4.0', '4.1', '5.0', '5.1', '5.2', '6.0', '6.1', '6.2'],
    description: 'Melhor compressão, menor compatibilidade'
  },
  vp9: {
    profiles: ['profile0', 'profile1', 'profile2', 'profile3'],
    levels: ['10', '11', '20', '21', '30', '31', '40', '41', '50', '51', '52', '60', '61', '62'],
    description: 'Código aberto, boa para web'
  },
  av1: {
    profiles: ['main', 'high', 'professional'],
    levels: ['2.0', '2.1', '3.0', '3.1', '4.0', '4.1', '5.0', '5.1', '5.2', '5.3'],
    description: 'Mais recente, melhor compressão'
  }
};

const qualityPresets = {
  'ultra-fast': { crf: 28, preset: 'ultrafast', description: 'Codificação muito rápida, qualidade baixa' },
  'fast': { crf: 23, preset: 'fast', description: 'Codificação rápida, boa qualidade' },
  'medium': { crf: 20, preset: 'medium', description: 'Equilibrio entre velocidade e qualidade' },
  'slow': { crf: 18, preset: 'slow', description: 'Codificação lenta, alta qualidade' },
  'veryslow': { crf: 15, preset: 'veryslow', description: 'Codificação muito lenta, qualidade máxima' }
};

const resolutionPresets = [
  { name: '4K UHD', width: 3840, height: 2160, ratio: '16:9' },
  { name: '1440p QHD', width: 2560, height: 1440, ratio: '16:9' },
  { name: '1080p FHD', width: 1920, height: 1080, ratio: '16:9' },
  { name: '720p HD', width: 1280, height: 720, ratio: '16:9' },
  { name: '480p SD', width: 854, height: 480, ratio: '16:9' },
  { name: '1080p Vertical', width: 1080, height: 1920, ratio: '9:16' },
  { name: '720p Vertical', width: 720, height: 1280, ratio: '9:16' },
  { name: 'Square 1080', width: 1080, height: 1080, ratio: '1:1' }
];

export const AdvancedCodecSettings: React.FC<AdvancedCodecSettingsProps> = ({
  settings,
  onChange,
  onPreset
}) => {
  const [activeTab, setActiveTab] = useState('video');
  const [estimatedSize, setEstimatedSize] = useState(0);
  const [estimatedTime, setEstimatedTime] = useState(0);

  const updateSettings = (updates: Partial<CodecSettings>) => {
    onChange({ ...settings, ...updates });
  };

  const applyQualityPreset = (presetKey: string) => {
    const preset = qualityPresets[presetKey as keyof typeof qualityPresets];
    if (preset) {
      updateSettings({
        crf: preset.crf,
        motionEstimation: presetKey as any
      });
      onPreset(presetKey);
    }
  };

  const applyResolutionPreset = (preset: typeof resolutionPresets[0]) => {
    updateSettings({
      resolution: { width: preset.width, height: preset.height },
      aspectRatio: preset.ratio
    });
  };

  // Estimate file size and encoding time
  useEffect(() => {
    const duration = 120; // 2 minutes example
    const pixels = settings.resolution.width * settings.resolution.height;
    const complexity = settings.videoCodec === 'h265' ? 0.7 : settings.videoCodec === 'vp9' ? 0.8 : 1;
    
    // Rough estimation based on bitrate and complexity
    const estimatedBitrate = settings.quality === 'constant' ? settings.bitrate : 
      settings.bitrate * (1 - (settings.crf - 15) / 36); // CRF adjustment
    
    const sizeInMB = (estimatedBitrate * duration * complexity) / (8 * 1024);
    const timeMultiplier = settings.motionEstimation === 'veryslow' ? 4 : 
      settings.motionEstimation === 'slow' ? 2.5 : 
      settings.motionEstimation === 'medium' ? 1.5 : 
      settings.motionEstimation === 'fast' ? 1 : 0.5;
    
    const baseTime = (pixels / 1000000) * duration * timeMultiplier;
    
    setEstimatedSize(sizeInMB);
    setEstimatedTime(baseTime);
  }, [settings]);

  const formatFileSize = (mb: number) => {
    if (mb < 1024) return `${mb.toFixed(1)} MB`;
    return `${(mb / 1024).toFixed(2)} GB`;
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      {/* Quick Presets */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Zap className="w-5 h-5" />
            <span>Presets Rápidos</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {Object.entries(qualityPresets).map(([key, preset]) => (
              <Button
                key={key}
                variant="outline"
                size="sm"
                onClick={() => applyQualityPreset(key)}
                className="flex flex-col h-auto p-3"
              >
                <span className="font-medium capitalize">{key.replace('-', ' ')}</span>
                <span className="text-xs text-gray-500">CRF {preset.crf}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Estimation Panel */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="flex items-center justify-center space-x-1 text-sm text-gray-600 mb-1">
                <HardDrive className="w-4 h-4" />
                <span>Tamanho Estimado</span>
              </div>
              <div className="text-lg font-semibold">{formatFileSize(estimatedSize)}</div>
            </div>
            <div>
              <div className="flex items-center justify-center space-x-1 text-sm text-gray-600 mb-1">
                <Clock className="w-4 h-4" />
                <span>Tempo de Codificação</span>
              </div>
              <div className="text-lg font-semibold">{formatTime(estimatedTime)}</div>
            </div>
            <div>
              <div className="flex items-center justify-center space-x-1 text-sm text-gray-600 mb-1">
                <Settings className="w-4 h-4" />
                <span>Qualidade</span>
              </div>
              <div className="text-lg font-semibold">
                {settings.quality === 'constant' ? 'Constante' : 
                 settings.quality === 'variable' ? 'Variável' : 'Restrita'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Advanced Settings Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="video">Vídeo</TabsTrigger>
          <TabsTrigger value="audio">Áudio</TabsTrigger>
          <TabsTrigger value="advanced">Avançado</TabsTrigger>
          <TabsTrigger value="hardware">Hardware</TabsTrigger>
        </TabsList>

        <TabsContent value="video" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Codec de Vídeo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Codec</Label>
                  <Select 
                    value={settings.videoCodec} 
                    onValueChange={(value: any) => updateSettings({ videoCodec: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(codecProfiles).map(([codec, info]) => (
                        <SelectItem key={codec} value={codec}>
                          <div className="flex flex-col">
                            <span className="font-medium">{codec.toUpperCase()}</span>
                            <span className="text-xs text-gray-500">{info.description}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>Perfil</Label>
                  <Select 
                    value={settings.profile} 
                    onValueChange={(value) => updateSettings({ profile: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {codecProfiles[settings.videoCodec].profiles.map((profile) => (
                        <SelectItem key={profile} value={profile}>
                          {profile}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Resolução</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {resolutionPresets.map((preset) => (
                    <Button
                      key={preset.name}
                      variant={settings.resolution.width === preset.width ? "default" : "outline"}
                      size="sm"
                      onClick={() => applyResolutionPreset(preset)}
                      className="justify-start"
                    >
                      <span className="font-medium">{preset.name}</span>
                      <Badge variant="secondary" className="ml-auto">
                        {preset.ratio}
                      </Badge>
                    </Button>
                  ))}
                </div>
                
                <div className="grid grid-cols-3 gap-2 mt-2">
                  <div>
                    <Label className="text-xs">Largura</Label>
                    <Input
                      type="number"
                      value={settings.resolution.width}
                      onChange={(e) => updateSettings({
                        resolution: { ...settings.resolution, width: parseInt(e.target.value) }
                      })}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Altura</Label>
                    <Input
                      type="number"
                      value={settings.resolution.height}
                      onChange={(e) => updateSettings({
                        resolution: { ...settings.resolution, height: parseInt(e.target.value) }
                      })}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">FPS</Label>
                    <Select 
                      value={settings.frameRate.toString()} 
                      onValueChange={(value) => updateSettings({ frameRate: parseInt(value) })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="24">24 fps</SelectItem>
                        <SelectItem value="25">25 fps</SelectItem>
                        <SelectItem value="30">30 fps</SelectItem>
                        <SelectItem value="50">50 fps</SelectItem>
                        <SelectItem value="60">60 fps</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Modo de Qualidade</Label>
                  <Badge variant="outline">
                    {settings.quality === 'constant' ? 'CRF' : 'Bitrate'}
                  </Badge>
                </div>
                <Select 
                  value={settings.quality} 
                  onValueChange={(value: any) => updateSettings({ quality: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="constant">Qualidade Constante (CRF)</SelectItem>
                    <SelectItem value="variable">Bitrate Variável (VBR)</SelectItem>
                    <SelectItem value="constrained">Bitrate Restrito (CBR)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {settings.quality === 'constant' ? (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>Fator de Taxa Constante (CRF)</Label>
                    <span className="text-sm text-gray-600">{settings.crf}</span>
                  </div>
                  <Slider
                    value={[settings.crf]}
                    onValueChange={([value]) => updateSettings({ crf: value })}
                    min={0}
                    max={51}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Melhor qualidade (0)</span>
                    <span>Menor arquivo (51)</span>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Bitrate (kbps)</Label>
                    <Input
                      type="number"
                      value={settings.bitrate}
                      onChange={(e) => updateSettings({ bitrate: parseInt(e.target.value) })}
                    />
                  </div>
                  <div>
                    <Label>Bitrate Máximo (kbps)</Label>
                    <Input
                      type="number"
                      value={settings.maxBitrate}
                      onChange={(e) => updateSettings({ maxBitrate: parseInt(e.target.value) })}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audio" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configurações de Áudio</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Codec de Áudio</Label>
                  <Select 
                    value={settings.audioCodec} 
                    onValueChange={(value: any) => updateSettings({ audioCodec: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="aac">AAC (Recomendado)</SelectItem>
                      <SelectItem value="mp3">MP3</SelectItem>
                      <SelectItem value="opus">Opus</SelectItem>
                      <SelectItem value="flac">FLAC (Sem perda)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>Bitrate de Áudio (kbps)</Label>
                  <Select 
                    value={settings.audioBitrate.toString()} 
                    onValueChange={(value) => updateSettings({ audioBitrate: parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="128">128 kbps</SelectItem>
                      <SelectItem value="192">192 kbps</SelectItem>
                      <SelectItem value="256">256 kbps</SelectItem>
                      <SelectItem value="320">320 kbps</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Taxa de Amostragem</Label>
                  <Select 
                    value={settings.audioSampleRate.toString()} 
                    onValueChange={(value) => updateSettings({ audioSampleRate: parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="44100">44.1 kHz</SelectItem>
                      <SelectItem value="48000">48 kHz</SelectItem>
                      <SelectItem value="96000">96 kHz</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>Canais</Label>
                  <Select 
                    value={settings.audioChannels.toString()} 
                    onValueChange={(value) => updateSettings({ audioChannels: parseInt(value) as any })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Mono</SelectItem>
                      <SelectItem value="2">Estéreo</SelectItem>
                      <SelectItem value="6">5.1 Surround</SelectItem>
                      <SelectItem value="8">7.1 Surround</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configurações Avançadas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Estimação de Movimento</Label>
                  <Select 
                    value={settings.motionEstimation} 
                    onValueChange={(value: any) => updateSettings({ motionEstimation: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fast">Rápido</SelectItem>
                      <SelectItem value="medium">Médio</SelectItem>
                      <SelectItem value="slow">Lento</SelectItem>
                      <SelectItem value="veryslow">Muito Lento</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>Formato de Pixel</Label>
                  <Select 
                    value={settings.pixelFormat} 
                    onValueChange={(value: any) => updateSettings({ pixelFormat: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="yuv420p">YUV 4:2:0 (Padrão)</SelectItem>
                      <SelectItem value="yuv422p">YUV 4:2:2</SelectItem>
                      <SelectItem value="yuv444p">YUV 4:4:4</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Intervalo de Keyframe (s)</Label>
                  <Input
                    type="number"
                    value={settings.keyframeInterval}
                    onChange={(e) => updateSettings({ keyframeInterval: parseInt(e.target.value) })}
                    min={1}
                    max={10}
                  />
                </div>
                <div>
                  <Label>B-Frames</Label>
                  <Input
                    type="number"
                    value={settings.bFrames}
                    onChange={(e) => updateSettings({ bFrames: parseInt(e.target.value) })}
                    min={0}
                    max={16}
                  />
                </div>
                <div>
                  <Label>Frames de Referência</Label>
                  <Input
                    type="number"
                    value={settings.referenceFrames}
                    onChange={(e) => updateSettings({ referenceFrames: parseInt(e.target.value) })}
                    min={1}
                    max={16}
                  />
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Codificação em Duas Passadas</Label>
                    <p className="text-xs text-gray-500">Melhor qualidade, tempo dobrado</p>
                  </div>
                  <Switch
                    checked={settings.twoPass}
                    onCheckedChange={(checked) => updateSettings({ twoPass: checked })}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Fast Start</Label>
                    <p className="text-xs text-gray-500">Otimizado para streaming</p>
                  </div>
                  <Switch
                    checked={settings.fastStart}
                    onCheckedChange={(checked) => updateSettings({ fastStart: checked })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="hardware" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Zap className="w-5 h-5" />
                <span>Aceleração por Hardware</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Ativar Aceleração por Hardware</Label>
                  <p className="text-xs text-gray-500">Usa GPU para codificação mais rápida</p>
                </div>
                <Switch
                  checked={settings.hardwareAcceleration}
                  onCheckedChange={(checked) => updateSettings({ hardwareAcceleration: checked })}
                />
              </div>
              
              {settings.hardwareAcceleration && (
                <div>
                  <Label>Tipo de GPU</Label>
                  <Select 
                    value={settings.gpuType} 
                    onValueChange={(value: any) => updateSettings({ gpuType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto">Detecção Automática</SelectItem>
                      <SelectItem value="nvidia">NVIDIA (NVENC)</SelectItem>
                      <SelectItem value="amd">AMD (VCE)</SelectItem>
                      <SelectItem value="intel">Intel (Quick Sync)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-start space-x-2">
                  <Info className="w-4 h-4 text-blue-600 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium">Dica sobre Hardware</p>
                    <p>A aceleração por hardware pode ser 5-10x mais rápida, mas pode ter qualidade ligeiramente inferior em alguns casos.</p>
                  </div>
                </div>
              </div>
              
              {!settings.hardwareAcceleration && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <div className="flex items-start space-x-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5" />
                    <div className="text-sm text-amber-800">
                      <p className="font-medium">Codificação por Software</p>
                      <p>Usando CPU para codificação. Será mais lento mas com melhor qualidade.</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};