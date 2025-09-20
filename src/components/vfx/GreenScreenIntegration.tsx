import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Slider } from '../ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Upload, Play, Pause, Download, RotateCcw, Eye, EyeOff } from 'lucide-react';
import { Switch } from '../ui/switch';

interface ChromaKeySettings {
  keyColor: string;
  threshold: number;
  smoothness: number;
  spill: number;
  opacity: number;
  edgeBlur: number;
}

interface VideoLayer {
  id: string;
  name: string;
  type: 'foreground' | 'background';
  file: File | null;
  url: string;
  visible: boolean;
  opacity: number;
  position: { x: number; y: number };
  scale: number;
  rotation: number;
}

const defaultChromaSettings: ChromaKeySettings = {
  keyColor: '#00ff00', // Green
  threshold: 0.4,
  smoothness: 0.1,
  spill: 0.1,
  opacity: 1.0,
  edgeBlur: 0.02
};

const presetColors = [
  { name: 'Verde Padrão', value: '#00ff00' },
  { name: 'Verde Escuro', value: '#008000' },
  { name: 'Azul Chroma', value: '#0000ff' },
  { name: 'Azul Claro', value: '#00bfff' },
  { name: 'Magenta', value: '#ff00ff' },
  { name: 'Personalizado', value: 'custom' }
];

interface GreenScreenIntegrationProps {
  onCompositionReady?: (compositionData: any) => void;
  onExport?: (videoBlob: Blob) => void;
}

export const GreenScreenIntegration: React.FC<GreenScreenIntegrationProps> = ({
  onCompositionReady,
  onExport
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const foregroundVideoRef = useRef<HTMLVideoElement>(null);
  const backgroundVideoRef = useRef<HTMLVideoElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  
  const [chromaSettings, setChromaSettings] = useState<ChromaKeySettings>(defaultChromaSettings);
  const [customColor, setCustomColor] = useState('#00ff00');
  const [selectedPreset, setSelectedPreset] = useState('Verde Padrão');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [layers, setLayers] = useState<VideoLayer[]>([
    {
      id: 'foreground',
      name: 'Vídeo Principal (Green Screen)',
      type: 'foreground',
      file: null,
      url: '',
      visible: true,
      opacity: 1,
      position: { x: 0, y: 0 },
      scale: 1,
      rotation: 0
    },
    {
      id: 'background',
      name: 'Fundo de Substituição',
      type: 'background',
      file: null,
      url: '',
      visible: true,
      opacity: 1,
      position: { x: 0, y: 0 },
      scale: 1,
      rotation: 0
    }
  ]);
  const [showOriginal, setShowOriginal] = useState(false);
  const [processingQuality, setProcessingQuality] = useState<'low' | 'medium' | 'high'>('medium');

  // Chroma key shader fragment
  const createChromaKeyShader = useCallback((settings: ChromaKeySettings) => {
    return `
      precision mediump float;
      uniform sampler2D u_foreground;
      uniform sampler2D u_background;
      uniform vec3 u_keyColor;
      uniform float u_threshold;
      uniform float u_smoothness;
      uniform float u_spill;
      uniform float u_opacity;
      uniform float u_edgeBlur;
      uniform vec2 u_resolution;
      varying vec2 v_texCoord;
      
      float colorDistance(vec3 a, vec3 b) {
        return length(a - b);
      }
      
      void main() {
        vec2 uv = v_texCoord;
        vec4 fgColor = texture2D(u_foreground, uv);
        vec4 bgColor = texture2D(u_background, uv);
        
        // Calculate distance from key color
        float dist = colorDistance(fgColor.rgb, u_keyColor);
        
        // Create alpha mask
        float alpha = smoothstep(u_threshold - u_smoothness, u_threshold + u_smoothness, dist);
        
        // Spill suppression
        vec3 spillColor = fgColor.rgb;
        float spillAmount = max(0.0, u_spill - dist);
        spillColor = mix(spillColor, spillColor * (1.0 - spillAmount), spillAmount);
        
        // Edge blur
        if (u_edgeBlur > 0.0) {
          vec2 texelSize = 1.0 / u_resolution;
          float blur = 0.0;
          for (int x = -2; x <= 2; x++) {
            for (int y = -2; y <= 2; y++) {
              vec2 offset = vec2(float(x), float(y)) * texelSize * u_edgeBlur;
              vec4 sample = texture2D(u_foreground, uv + offset);
              float sampleDist = colorDistance(sample.rgb, u_keyColor);
              blur += smoothstep(u_threshold - u_smoothness, u_threshold + u_smoothness, sampleDist);
            }
          }
          alpha = blur / 25.0;
        }
        
        // Composite
        vec3 finalColor = mix(bgColor.rgb, spillColor, alpha * u_opacity);
        gl_FragColor = vec4(finalColor, 1.0);
      }
    `;
  }, []);

  // Canvas-based chroma key processing
  const processChromaKey = useCallback(() => {
    const canvas = canvasRef.current;
    const fgVideo = foregroundVideoRef.current;
    const bgVideo = backgroundVideoRef.current;
    
    if (!canvas || !fgVideo || !bgVideo) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const width = canvas.width;
    const height = canvas.height;
    
    // Draw background
    ctx.drawImage(bgVideo, 0, 0, width, height);
    
    if (showOriginal) {
      // Show original foreground without chroma key
      ctx.drawImage(fgVideo, 0, 0, width, height);
      return;
    }
    
    // Create temporary canvas for foreground processing
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = width;
    tempCanvas.height = height;
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;
    
    // Draw foreground to temp canvas
    tempCtx.drawImage(fgVideo, 0, 0, width, height);
    
    // Get image data
    const imageData = tempCtx.getImageData(0, 0, width, height);
    const data = imageData.data;
    
    // Parse key color
    const keyColor = {
      r: parseInt(chromaSettings.keyColor.slice(1, 3), 16),
      g: parseInt(chromaSettings.keyColor.slice(3, 5), 16),
      b: parseInt(chromaSettings.keyColor.slice(5, 7), 16)
    };
    
    // Process pixels
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      // Calculate color distance
      const distance = Math.sqrt(
        Math.pow(r - keyColor.r, 2) +
        Math.pow(g - keyColor.g, 2) +
        Math.pow(b - keyColor.b, 2)
      ) / (255 * Math.sqrt(3));
      
      // Apply threshold with smoothness
      let alpha = 1;
      const threshold = chromaSettings.threshold;
      const smoothness = chromaSettings.smoothness;
      
      if (distance < threshold - smoothness) {
        alpha = 0; // Fully transparent
      } else if (distance < threshold + smoothness) {
        // Smooth transition
        alpha = (distance - (threshold - smoothness)) / (2 * smoothness);
      }
      
      // Apply spill suppression
      if (distance < chromaSettings.spill) {
        const spillFactor = 1 - (distance / chromaSettings.spill);
        data[i] = Math.min(255, r * (1 + spillFactor * 0.1));
        data[i + 1] = Math.min(255, g * (1 - spillFactor * 0.2));
        data[i + 2] = Math.min(255, b * (1 + spillFactor * 0.1));
      }
      
      // Set alpha
      data[i + 3] = alpha * 255 * chromaSettings.opacity;
    }
    
    // Apply processed image
    tempCtx.putImageData(imageData, 0, 0);
    
    // Composite onto main canvas
    ctx.globalCompositeOperation = 'source-over';
    ctx.drawImage(tempCanvas, 0, 0);
  }, [chromaSettings, showOriginal]);

  // Animation loop
  const animate = useCallback(() => {
    if (isPlaying) {
      processChromaKey();
      animationFrameRef.current = requestAnimationFrame(animate);
    }
  }, [isPlaying, processChromaKey]);

  // Handle file upload
  const handleFileUpload = (layerId: string, file: File) => {
    const url = URL.createObjectURL(file);
    setLayers(prev => prev.map(layer => 
      layer.id === layerId 
        ? { ...layer, file, url }
        : layer
    ));
  };

  // Handle chroma settings change
  const updateChromaSetting = (key: keyof ChromaKeySettings, value: number | string) => {
    setChromaSettings(prev => ({ ...prev, [key]: value }));
  };

  // Handle preset color change
  const handlePresetChange = (presetName: string) => {
    setSelectedPreset(presetName);
    const preset = presetColors.find(p => p.name === presetName);
    if (preset && preset.value !== 'custom') {
      updateChromaSetting('keyColor', preset.value);
    }
  };

  // Play/Pause
  const handlePlayPause = () => {
    const fgVideo = foregroundVideoRef.current;
    const bgVideo = backgroundVideoRef.current;
    
    if (!fgVideo || !bgVideo) return;
    
    if (isPlaying) {
      fgVideo.pause();
      bgVideo.pause();
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    } else {
      fgVideo.play();
      bgVideo.play();
      animate();
    }
    
    setIsPlaying(!isPlaying);
  };

  // Start recording
  const startRecording = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const stream = canvas.captureStream(30);
    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: 'video/webm;codecs=vp9'
    });
    
    const chunks: Blob[] = [];
    
    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunks.push(event.data);
      }
    };
    
    mediaRecorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' });
      onExport?.(blob);
    };
    
    mediaRecorder.start();
    mediaRecorderRef.current = mediaRecorder;
    setIsRecording(true);
  };

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
    }
    setIsRecording(false);
  };

  // Reset composition
  const resetComposition = () => {
    setIsPlaying(false);
    setChromaSettings(defaultChromaSettings);
    setSelectedPreset('Verde Padrão');
    setShowOriginal(false);
    
    const fgVideo = foregroundVideoRef.current;
    const bgVideo = backgroundVideoRef.current;
    
    if (fgVideo) fgVideo.currentTime = 0;
    if (bgVideo) bgVideo.currentTime = 0;
  };

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>🎬</span>
            Green Screen Integration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* File Upload Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {layers.map(layer => (
              <div key={layer.id} className="space-y-2">
                <label className="text-sm font-medium">{layer.name}</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                  <input
                    type="file"
                    accept="video/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(layer.id, file);
                    }}
                    className="hidden"
                    id={`upload-${layer.id}`}
                  />
                  <label htmlFor={`upload-${layer.id}`} className="cursor-pointer">
                    <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm text-gray-600">
                      {layer.file ? layer.file.name : 'Clique para selecionar vídeo'}
                    </p>
                  </label>
                </div>
                {layer.url && (
                  <video
                    ref={layer.type === 'foreground' ? foregroundVideoRef : backgroundVideoRef}
                    src={layer.url}
                    className="w-full h-24 object-cover rounded"
                    muted
                    loop
                  />
                )}
              </div>
            ))}
          </div>

          {/* Preview Canvas */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Preview da Composição</h3>
              <div className="flex items-center gap-2">
                <Switch
                  checked={showOriginal}
                  onCheckedChange={setShowOriginal}
                  id="show-original"
                />
                <label htmlFor="show-original" className="text-sm">
                  Mostrar Original
                </label>
              </div>
            </div>
            
            <div className="relative bg-black rounded-lg overflow-hidden">
              <canvas
                ref={canvasRef}
                width={640}
                height={360}
                className="w-full h-auto"
              />
            </div>
          </div>

          {/* Controls */}
          <div className="flex justify-center gap-2">
            <Button
              onClick={handlePlayPause}
              disabled={!layers[0].url || !layers[1].url}
              className="flex items-center gap-2"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              {isPlaying ? 'Pausar' : 'Reproduzir'}
            </Button>
            
            <Button
              onClick={resetComposition}
              variant="outline"
              className="flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </Button>
            
            <Button
              onClick={isRecording ? stopRecording : startRecording}
              disabled={!isPlaying}
              variant={isRecording ? 'destructive' : 'default'}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              {isRecording ? 'Parar Gravação' : 'Gravar Composição'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Chroma Key Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Configurações do Chroma Key</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Color Preset */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Cor Chave Predefinida</label>
            <Select value={selectedPreset} onValueChange={handlePresetChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {presetColors.map(preset => (
                  <SelectItem key={preset.name} value={preset.name}>
                    <div className="flex items-center gap-2">
                      {preset.value !== 'custom' && (
                        <div 
                          className="w-4 h-4 rounded-full border" 
                          style={{ backgroundColor: preset.value }}
                        />
                      )}
                      {preset.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Custom Color */}
          {selectedPreset === 'Personalizado' && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Cor Personalizada</label>
              <input
                type="color"
                value={customColor}
                onChange={(e) => {
                  setCustomColor(e.target.value);
                  updateChromaSetting('keyColor', e.target.value);
                }}
                className="w-full h-10 rounded border"
              />
            </div>
          )}

          {/* Threshold */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Limiar: {chromaSettings.threshold.toFixed(2)}
            </label>
            <Slider
              value={[chromaSettings.threshold]}
              onValueChange={([value]) => updateChromaSetting('threshold', value)}
              min={0}
              max={1}
              step={0.01}
            />
          </div>

          {/* Smoothness */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Suavidade: {chromaSettings.smoothness.toFixed(2)}
            </label>
            <Slider
              value={[chromaSettings.smoothness]}
              onValueChange={([value]) => updateChromaSetting('smoothness', value)}
              min={0}
              max={0.5}
              step={0.01}
            />
          </div>

          {/* Spill Suppression */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Supressão de Vazamento: {chromaSettings.spill.toFixed(2)}
            </label>
            <Slider
              value={[chromaSettings.spill]}
              onValueChange={([value]) => updateChromaSetting('spill', value)}
              min={0}
              max={1}
              step={0.01}
            />
          </div>

          {/* Opacity */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Opacidade: {chromaSettings.opacity.toFixed(2)}
            </label>
            <Slider
              value={[chromaSettings.opacity]}
              onValueChange={([value]) => updateChromaSetting('opacity', value)}
              min={0}
              max={1}
              step={0.01}
            />
          </div>

          {/* Edge Blur */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Desfoque das Bordas: {chromaSettings.edgeBlur.toFixed(3)}
            </label>
            <Slider
              value={[chromaSettings.edgeBlur]}
              onValueChange={([value]) => updateChromaSetting('edgeBlur', value)}
              min={0}
              max={0.1}
              step={0.001}
            />
          </div>

          {/* Processing Quality */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Qualidade do Processamento</label>
            <Select value={processingQuality} onValueChange={(value: any) => setProcessingQuality(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Baixa (Rápida)</SelectItem>
                <SelectItem value="medium">Média (Balanceada)</SelectItem>
                <SelectItem value="high">Alta (Lenta)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GreenScreenIntegration;