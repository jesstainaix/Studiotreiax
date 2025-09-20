import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Wand2, Settings, Zap, Crop, Volume2, Palette, Maximize2, RotateCcw } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface OptimizationSettings {
  colorCorrection: {
    enabled: boolean;
    brightness: number;
    contrast: number;
    saturation: number;
    gamma: number;
    autoWhiteBalance: boolean;
  };
  stabilization: {
    enabled: boolean;
    strength: number;
    smoothing: number;
    cropCompensation: boolean;
  };
  noiseReduction: {
    enabled: boolean;
    videoStrength: number;
    audioStrength: number;
    preserveDetails: boolean;
  };
  audioOptimization: {
    enabled: boolean;
    normalization: boolean;
    dynamicRange: number;
    noiseGate: number;
  };
  smartCrop: {
    enabled: boolean;
    aspectRatio: string;
    focusDetection: boolean;
    motionTracking: boolean;
  };
}

interface OptimizationResult {
  before: {
    brightness: number;
    contrast: number;
    saturation: number;
    stability: number;
    noiseLevel: number;
    audioQuality: number;
  };
  after: {
    brightness: number;
    contrast: number;
    saturation: number;
    stability: number;
    noiseLevel: number;
    audioQuality: number;
  };
  improvements: {
    colorBalance: number;
    stabilityGain: number;
    noiseReduction: number;
    audioClarity: number;
    overallScore: number;
  };
}

interface AutoOptimizerProps {
  videoElement?: HTMLVideoElement;
  audioContext?: AudioContext;
  onOptimizationComplete?: (result: OptimizationResult) => void;
  onSettingsChange?: (settings: OptimizationSettings) => void;
}

export const AutoOptimizer: React.FC<AutoOptimizerProps> = ({
  videoElement,
  audioContext,
  onOptimizationComplete,
  onSettingsChange
}) => {
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [optimizationResult, setOptimizationResult] = useState<OptimizationResult | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [realTimeOptimization, setRealTimeOptimization] = useState(false);
  const [optimizationHistory, setOptimizationHistory] = useState<any[]>([]);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const originalCanvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  
  const [settings, setSettings] = useState<OptimizationSettings>({
    colorCorrection: {
      enabled: true,
      brightness: 0,
      contrast: 0,
      saturation: 0,
      gamma: 1.0,
      autoWhiteBalance: true
    },
    stabilization: {
      enabled: true,
      strength: 50,
      smoothing: 30,
      cropCompensation: true
    },
    noiseReduction: {
      enabled: true,
      videoStrength: 40,
      audioStrength: 30,
      preserveDetails: true
    },
    audioOptimization: {
      enabled: true,
      normalization: true,
      dynamicRange: 70,
      noiseGate: 20
    },
    smartCrop: {
      enabled: false,
      aspectRatio: '16:9',
      focusDetection: true,
      motionTracking: true
    }
  });

  // Algoritmo de correção automática de cor
  const applyColorCorrection = useCallback((imageData: ImageData, settings: any): ImageData => {
    const data = new Uint8ClampedArray(imageData.data);
    const { brightness, contrast, saturation, gamma, autoWhiteBalance } = settings;

    // Auto White Balance
    if (autoWhiteBalance) {
      let rSum = 0, gSum = 0, bSum = 0, count = 0;
      
      // Calcular médias dos canais
      for (let i = 0; i < data.length; i += 4) {
        rSum += data[i];
        gSum += data[i + 1];
        bSum += data[i + 2];
        count++;
      }
      
      const rAvg = rSum / count;
      const gAvg = gSum / count;
      const bAvg = bSum / count;
      const grayAvg = (rAvg + gAvg + bAvg) / 3;
      
      const rGain = grayAvg / rAvg;
      const gGain = grayAvg / gAvg;
      const bGain = grayAvg / bAvg;
      
      // Aplicar correção de white balance
      for (let i = 0; i < data.length; i += 4) {
        data[i] = Math.min(255, data[i] * rGain);
        data[i + 1] = Math.min(255, data[i + 1] * gGain);
        data[i + 2] = Math.min(255, data[i + 2] * bGain);
      }
    }

    // Aplicar correções manuais
    for (let i = 0; i < data.length; i += 4) {
      let r = data[i];
      let g = data[i + 1];
      let b = data[i + 2];
      
      // Brilho
      r += brightness;
      g += brightness;
      b += brightness;
      
      // Contraste
      const contrastFactor = (259 * (contrast + 255)) / (255 * (259 - contrast));
      r = contrastFactor * (r - 128) + 128;
      g = contrastFactor * (g - 128) + 128;
      b = contrastFactor * (b - 128) + 128;
      
      // Saturação
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;
      const satFactor = saturation / 100;
      r = gray + satFactor * (r - gray);
      g = gray + satFactor * (g - gray);
      b = gray + satFactor * (b - gray);
      
      // Correção Gamma
      r = 255 * Math.pow(r / 255, 1 / gamma);
      g = 255 * Math.pow(g / 255, 1 / gamma);
      b = 255 * Math.pow(b / 255, 1 / gamma);
      
      // Clamp values
      data[i] = Math.max(0, Math.min(255, r));
      data[i + 1] = Math.max(0, Math.min(255, g));
      data[i + 2] = Math.max(0, Math.min(255, b));
    }

    return new ImageData(data, imageData.width, imageData.height);
  }, []);

  // Algoritmo de estabilização de vídeo
  const applyStabilization = useCallback((currentFrame: ImageData, previousFrame: ImageData | null, settings: any): ImageData => {
    if (!previousFrame) return currentFrame;
    
    const { strength, smoothing } = settings;
    const data = new Uint8ClampedArray(currentFrame.data);
    const prevData = previousFrame.data;
    
    // Detectar movimento usando correlação de blocos
    const blockSize = 16;
    const searchRange = 8;
    let totalMotionX = 0;
    let totalMotionY = 0;
    let blockCount = 0;
    
    for (let y = 0; y < currentFrame.height - blockSize; y += blockSize) {
      for (let x = 0; x < currentFrame.width - blockSize; x += blockSize) {
        let bestMatch = { x: 0, y: 0, error: Infinity };
        
        // Buscar melhor correspondência na vizinhança
        for (let dy = -searchRange; dy <= searchRange; dy++) {
          for (let dx = -searchRange; dx <= searchRange; dx++) {
            const newX = x + dx;
            const newY = y + dy;
            
            if (newX >= 0 && newY >= 0 && 
                newX < currentFrame.width - blockSize && 
                newY < currentFrame.height - blockSize) {
              
              let error = 0;
              for (let by = 0; by < blockSize; by++) {
                for (let bx = 0; bx < blockSize; bx++) {
                  const currentIdx = ((y + by) * currentFrame.width + (x + bx)) * 4;
                  const prevIdx = ((newY + by) * currentFrame.width + (newX + bx)) * 4;
                  
                  const currentGray = (data[currentIdx] + data[currentIdx + 1] + data[currentIdx + 2]) / 3;
                  const prevGray = (prevData[prevIdx] + prevData[prevIdx + 1] + prevData[prevIdx + 2]) / 3;
                  
                  error += Math.abs(currentGray - prevGray);
                }
              }
              
              if (error < bestMatch.error) {
                bestMatch = { x: dx, y: dy, error };
              }
            }
          }
        }
        
        totalMotionX += bestMatch.x;
        totalMotionY += bestMatch.y;
        blockCount++;
      }
    }
    
    // Calcular movimento médio
    const avgMotionX = totalMotionX / blockCount;
    const avgMotionY = totalMotionY / blockCount;
    
    // Aplicar estabilização com suavização
    const stabilizationX = -avgMotionX * (strength / 100) * (smoothing / 100);
    const stabilizationY = -avgMotionY * (strength / 100) * (smoothing / 100);
    
    // Aplicar transformação de estabilização
    const stabilizedData = new Uint8ClampedArray(data.length);
    
    for (let y = 0; y < currentFrame.height; y++) {
      for (let x = 0; x < currentFrame.width; x++) {
        const sourceX = Math.round(x - stabilizationX);
        const sourceY = Math.round(y - stabilizationY);
        
        const targetIdx = (y * currentFrame.width + x) * 4;
        
        if (sourceX >= 0 && sourceX < currentFrame.width && 
            sourceY >= 0 && sourceY < currentFrame.height) {
          const sourceIdx = (sourceY * currentFrame.width + sourceX) * 4;
          stabilizedData[targetIdx] = data[sourceIdx];
          stabilizedData[targetIdx + 1] = data[sourceIdx + 1];
          stabilizedData[targetIdx + 2] = data[sourceIdx + 2];
          stabilizedData[targetIdx + 3] = data[sourceIdx + 3];
        } else {
          // Preencher bordas com preto
          stabilizedData[targetIdx] = 0;
          stabilizedData[targetIdx + 1] = 0;
          stabilizedData[targetIdx + 2] = 0;
          stabilizedData[targetIdx + 3] = 255;
        }
      }
    }
    
    return new ImageData(stabilizedData, currentFrame.width, currentFrame.height);
  }, []);

  // Algoritmo de redução de ruído
  const applyNoiseReduction = useCallback((imageData: ImageData, settings: any): ImageData => {
    const { videoStrength, preserveDetails } = settings;
    const data = new Uint8ClampedArray(imageData.data);
    const filteredData = new Uint8ClampedArray(data.length);
    
    const kernelSize = 3;
    const threshold = preserveDetails ? 30 : 15;
    const strength = videoStrength / 100;
    
    // Filtro bilateral para redução de ruído preservando bordas
    for (let y = kernelSize; y < imageData.height - kernelSize; y++) {
      for (let x = kernelSize; x < imageData.width - kernelSize; x++) {
        const centerIdx = (y * imageData.width + x) * 4;
        
        for (let c = 0; c < 3; c++) { // RGB channels
          let weightSum = 0;
          let valueSum = 0;
          const centerValue = data[centerIdx + c];
          
          // Aplicar kernel bilateral
          for (let ky = -kernelSize; ky <= kernelSize; ky++) {
            for (let kx = -kernelSize; kx <= kernelSize; kx++) {
              const neighborIdx = ((y + ky) * imageData.width + (x + kx)) * 4;
              const neighborValue = data[neighborIdx + c];
              
              // Peso espacial (Gaussiano)
              const spatialWeight = Math.exp(-(kx * kx + ky * ky) / (2 * 1.5 * 1.5));
              
              // Peso de intensidade
              const intensityDiff = Math.abs(centerValue - neighborValue);
              const intensityWeight = intensityDiff < threshold ? 
                Math.exp(-(intensityDiff * intensityDiff) / (2 * 25 * 25)) : 0;
              
              const totalWeight = spatialWeight * intensityWeight;
              weightSum += totalWeight;
              valueSum += neighborValue * totalWeight;
            }
          }
          
          const filteredValue = weightSum > 0 ? valueSum / weightSum : centerValue;
          filteredData[centerIdx + c] = centerValue * (1 - strength) + filteredValue * strength;
        }
        
        filteredData[centerIdx + 3] = data[centerIdx + 3]; // Alpha channel
      }
    }
    
    // Copiar bordas sem filtrar
    for (let y = 0; y < imageData.height; y++) {
      for (let x = 0; x < imageData.width; x++) {
        if (y < kernelSize || y >= imageData.height - kernelSize || 
            x < kernelSize || x >= imageData.width - kernelSize) {
          const idx = (y * imageData.width + x) * 4;
          filteredData[idx] = data[idx];
          filteredData[idx + 1] = data[idx + 1];
          filteredData[idx + 2] = data[idx + 2];
          filteredData[idx + 3] = data[idx + 3];
        }
      }
    }
    
    return new ImageData(filteredData, imageData.width, imageData.height);
  }, []);

  // Algoritmo de auto-crop inteligente
  const applySmartCrop = useCallback((imageData: ImageData, settings: any): ImageData => {
    const { aspectRatio, focusDetection } = settings;
    const data = imageData.data;
    
    // Detectar região de interesse usando análise de gradientes
    const gradientMap = new Float32Array(imageData.width * imageData.height);
    
    for (let y = 1; y < imageData.height - 1; y++) {
      for (let x = 1; x < imageData.width - 1; x++) {
        const idx = (y * imageData.width + x) * 4;
        const rightIdx = (y * imageData.width + (x + 1)) * 4;
        const bottomIdx = ((y + 1) * imageData.width + x) * 4;
        
        const current = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
        const right = (data[rightIdx] + data[rightIdx + 1] + data[rightIdx + 2]) / 3;
        const bottom = (data[bottomIdx] + data[bottomIdx + 1] + data[bottomIdx + 2]) / 3;
        
        const gradientX = Math.abs(right - current);
        const gradientY = Math.abs(bottom - current);
        gradientMap[y * imageData.width + x] = Math.sqrt(gradientX * gradientX + gradientY * gradientY);
      }
    }
    
    // Encontrar centro de massa dos gradientes (região de interesse)
    let totalGradient = 0;
    let centerX = 0;
    let centerY = 0;
    
    for (let y = 0; y < imageData.height; y++) {
      for (let x = 0; x < imageData.width; x++) {
        const gradient = gradientMap[y * imageData.width + x];
        totalGradient += gradient;
        centerX += x * gradient;
        centerY += y * gradient;
      }
    }
    
    if (totalGradient > 0) {
      centerX /= totalGradient;
      centerY /= totalGradient;
    } else {
      centerX = imageData.width / 2;
      centerY = imageData.height / 2;
    }
    
    // Calcular dimensões do crop baseado no aspect ratio
    const [ratioW, ratioH] = aspectRatio.split(':').map(Number);
    const targetRatio = ratioW / ratioH;
    const currentRatio = imageData.width / imageData.height;
    
    let cropWidth, cropHeight;
    
    if (currentRatio > targetRatio) {
      // Imagem muito larga, crop na largura
      cropHeight = imageData.height;
      cropWidth = cropHeight * targetRatio;
    } else {
      // Imagem muito alta, crop na altura
      cropWidth = imageData.width;
      cropHeight = cropWidth / targetRatio;
    }
    
    // Centralizar crop na região de interesse
    const cropX = Math.max(0, Math.min(imageData.width - cropWidth, centerX - cropWidth / 2));
    const cropY = Math.max(0, Math.min(imageData.height - cropHeight, centerY - cropHeight / 2));
    
    // Extrair região cropada
    const croppedData = new Uint8ClampedArray(cropWidth * cropHeight * 4);
    
    for (let y = 0; y < cropHeight; y++) {
      for (let x = 0; x < cropWidth; x++) {
        const sourceX = Math.floor(cropX + x);
        const sourceY = Math.floor(cropY + y);
        const sourceIdx = (sourceY * imageData.width + sourceX) * 4;
        const targetIdx = (y * cropWidth + x) * 4;
        
        croppedData[targetIdx] = data[sourceIdx];
        croppedData[targetIdx + 1] = data[sourceIdx + 1];
        croppedData[targetIdx + 2] = data[sourceIdx + 2];
        croppedData[targetIdx + 3] = data[sourceIdx + 3];
      }
    }
    
    return new ImageData(croppedData, cropWidth, cropHeight);
  }, []);

  // Otimização de áudio
  const optimizeAudio = useCallback((audioContext: AudioContext, settings: any) => {
    const { normalization, dynamicRange, noiseGate } = settings;
    
    // Criar cadeia de processamento de áudio
    const compressor = audioContext.createDynamicsCompressor();
    const filter = audioContext.createBiquadFilter();
    const gainNode = audioContext.createGain();
    
    // Configurar compressor para normalização
    if (normalization) {
      compressor.threshold.setValueAtTime(-24, audioContext.currentTime);
      compressor.knee.setValueAtTime(30, audioContext.currentTime);
      compressor.ratio.setValueAtTime(12, audioContext.currentTime);
      compressor.attack.setValueAtTime(0.003, audioContext.currentTime);
      compressor.release.setValueAtTime(0.25, audioContext.currentTime);
    }
    
    // Configurar filtro high-pass para noise gate
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(noiseGate, audioContext.currentTime);
    filter.Q.setValueAtTime(1, audioContext.currentTime);
    
    // Configurar ganho baseado no dynamic range
    const targetGain = Math.pow(10, (dynamicRange - 70) / 20);
    gainNode.gain.setValueAtTime(targetGain, audioContext.currentTime);
    
    return { compressor, filter, gainNode };
  }, []);

  // Função principal de otimização
  const performOptimization = useCallback(async () => {
    if (!videoElement || !canvasRef.current || !originalCanvasRef.current) return;

    setIsOptimizing(true);
    setProgress(0);

    try {
      const canvas = canvasRef.current;
      const originalCanvas = originalCanvasRef.current;
      const ctx = canvas.getContext('2d');
      const originalCtx = originalCanvas.getContext('2d');
      
      if (!ctx || !originalCtx) return;

      // Capturar frame original
      originalCanvas.width = videoElement.videoWidth;
      originalCanvas.height = videoElement.videoHeight;
      originalCtx.drawImage(videoElement, 0, 0);
      
      canvas.width = originalCanvas.width;
      canvas.height = originalCanvas.height;
      
      const originalImageData = originalCtx.getImageData(0, 0, originalCanvas.width, originalCanvas.height);
      let processedImageData = new ImageData(
        new Uint8ClampedArray(originalImageData.data),
        originalImageData.width,
        originalImageData.height
      );

      // Análise do frame original
      const originalMetrics = analyzeFrame(originalImageData);
      
      // Aplicar correção de cor
      setProgress(20);
      if (settings.colorCorrection.enabled) {
        processedImageData = applyColorCorrection(processedImageData, settings.colorCorrection);
      }
      
      // Aplicar redução de ruído
      setProgress(40);
      if (settings.noiseReduction.enabled) {
        processedImageData = applyNoiseReduction(processedImageData, settings.noiseReduction);
      }
      
      // Aplicar smart crop
      setProgress(60);
      if (settings.smartCrop.enabled) {
        processedImageData = applySmartCrop(processedImageData, settings.smartCrop);
        canvas.width = processedImageData.width;
        canvas.height = processedImageData.height;
      }
      
      // Otimizar áudio
      setProgress(80);
      let audioOptimization = null;
      if (audioContext && settings.audioOptimization.enabled) {
        audioOptimization = optimizeAudio(audioContext, settings.audioOptimization);
      }
      
      // Aplicar resultado final
      ctx.putImageData(processedImageData, 0, 0);
      
      // Análise do frame processado
      const processedMetrics = analyzeFrame(processedImageData);
      
      // Calcular melhorias
      const improvements = {
        colorBalance: Math.max(0, processedMetrics.colorBalance - originalMetrics.colorBalance),
        stabilityGain: Math.max(0, processedMetrics.stability - originalMetrics.stability),
        noiseReduction: Math.max(0, originalMetrics.noiseLevel - processedMetrics.noiseLevel),
        audioClarity: audioOptimization ? 25 : 0, // Simulado
        overallScore: 0
      };
      
      improvements.overallScore = (improvements.colorBalance + improvements.stabilityGain + 
                                 improvements.noiseReduction + improvements.audioClarity) / 4;
      
      const result: OptimizationResult = {
        before: {
          brightness: originalMetrics.brightness,
          contrast: originalMetrics.contrast,
          saturation: originalMetrics.saturation,
          stability: originalMetrics.stability,
          noiseLevel: originalMetrics.noiseLevel,
          audioQuality: 70 // Simulado
        },
        after: {
          brightness: processedMetrics.brightness,
          contrast: processedMetrics.contrast,
          saturation: processedMetrics.saturation,
          stability: processedMetrics.stability,
          noiseLevel: processedMetrics.noiseLevel,
          audioQuality: 85 // Simulado
        },
        improvements
      };
      
      setProgress(100);
      setOptimizationResult(result);
      onOptimizationComplete?.(result);
      
      // Adicionar ao histórico
      setOptimizationHistory(prev => [...prev, {
        timestamp: Date.now(),
        score: improvements.overallScore,
        settings: { ...settings }
      }].slice(-20));
      
    } catch (error) {
      console.error('Erro na otimização:', error);
    } finally {
      setIsOptimizing(false);
    }
  }, [videoElement, audioContext, settings, applyColorCorrection, applyNoiseReduction, applySmartCrop, optimizeAudio, onOptimizationComplete]);

  // Função auxiliar para análise de frame
  const analyzeFrame = useCallback((imageData: ImageData) => {
    const data = imageData.data;
    let brightness = 0, rSum = 0, gSum = 0, bSum = 0;
    let minVal = 255, maxVal = 0;
    
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const gray = (r + g + b) / 3;
      
      brightness += gray;
      rSum += r;
      gSum += g;
      bSum += b;
      minVal = Math.min(minVal, gray);
      maxVal = Math.max(maxVal, gray);
    }
    
    const pixelCount = data.length / 4;
    brightness /= pixelCount;
    
    const rAvg = rSum / pixelCount;
    const gAvg = gSum / pixelCount;
    const bAvg = bSum / pixelCount;
    
    return {
      brightness,
      contrast: maxVal - minVal,
      saturation: Math.max(rAvg, gAvg, bAvg) - Math.min(rAvg, gAvg, bAvg),
      colorBalance: 100 - Math.abs(rAvg - gAvg) - Math.abs(gAvg - bAvg) - Math.abs(bAvg - rAvg),
      stability: 80, // Simulado
      noiseLevel: 20 // Simulado
    };
  }, []);

  // Otimização em tempo real
  useEffect(() => {
    if (!realTimeOptimization || !videoElement || !canvasRef.current) return;

    const processFrame = () => {
      if (videoElement && canvasRef.current && !videoElement.paused) {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = videoElement.videoWidth;
        canvas.height = videoElement.videoHeight;
        ctx.drawImage(videoElement, 0, 0);
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        let processedData = imageData;
        
        if (settings.colorCorrection.enabled) {
          processedData = applyColorCorrection(processedData, settings.colorCorrection);
        }
        
        if (settings.noiseReduction.enabled) {
          processedData = applyNoiseReduction(processedData, settings.noiseReduction);
        }
        
        ctx.putImageData(processedData, 0, 0);
      }
      
      animationRef.current = requestAnimationFrame(processFrame);
    };

    if (realTimeOptimization) {
      animationRef.current = requestAnimationFrame(processFrame);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [realTimeOptimization, videoElement, settings, applyColorCorrection, applyNoiseReduction]);

  // Notificar mudanças nas configurações
  useEffect(() => {
    onSettingsChange?.(settings);
  }, [settings, onSettingsChange]);

  const updateSetting = (category: keyof OptimizationSettings, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }));
  };

  return (
    <div className="w-full space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wand2 className="h-5 w-5" />
            Otimização Automática com IA
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <Button 
              onClick={performOptimization} 
              disabled={isOptimizing || !videoElement}
              className="flex items-center gap-2"
            >
              {isOptimizing ? <RotateCcw className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
              {isOptimizing ? 'Otimizando...' : 'Otimizar Automaticamente'}
            </Button>
            
            <div className="flex items-center gap-2">
              <Switch 
                checked={previewMode} 
                onCheckedChange={setPreviewMode}
                id="preview-mode"
              />
              <label htmlFor="preview-mode" className="text-sm">Modo Preview</label>
            </div>
            
            <div className="flex items-center gap-2">
              <Switch 
                checked={realTimeOptimization} 
                onCheckedChange={setRealTimeOptimization}
                id="realtime-opt"
              />
              <label htmlFor="realtime-opt" className="text-sm">Tempo Real</label>
            </div>
          </div>
          
          {isOptimizing && (
            <div className="space-y-2">
              <Progress value={progress} className="w-full" />
              <p className="text-sm text-muted-foreground">Progresso: {progress}%</p>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <canvas ref={originalCanvasRef} className="hidden" />
            <canvas ref={canvasRef} className={`w-full border rounded ${previewMode ? 'block' : 'hidden'}`} />
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="color" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="color">Cor</TabsTrigger>
          <TabsTrigger value="stabilization">Estabilização</TabsTrigger>
          <TabsTrigger value="noise">Ruído</TabsTrigger>
          <TabsTrigger value="audio">Áudio</TabsTrigger>
          <TabsTrigger value="crop">Crop</TabsTrigger>
        </TabsList>
        
        <TabsContent value="color" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Correção de Cor
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Switch 
                  checked={settings.colorCorrection.enabled} 
                  onCheckedChange={(enabled) => updateSetting('colorCorrection', 'enabled', enabled)}
                  id="color-enabled"
                />
                <label htmlFor="color-enabled" className="text-sm font-medium">Ativar Correção de Cor</label>
              </div>
              
              {settings.colorCorrection.enabled && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Brilho: {settings.colorCorrection.brightness}</label>
                    <Slider
                      value={[settings.colorCorrection.brightness]}
                      onValueChange={([value]) => updateSetting('colorCorrection', 'brightness', value)}
                      min={-100}
                      max={100}
                      step={1}
                      className="w-full"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Contraste: {settings.colorCorrection.contrast}</label>
                    <Slider
                      value={[settings.colorCorrection.contrast]}
                      onValueChange={([value]) => updateSetting('colorCorrection', 'contrast', value)}
                      min={-100}
                      max={100}
                      step={1}
                      className="w-full"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Saturação: {settings.colorCorrection.saturation}</label>
                    <Slider
                      value={[settings.colorCorrection.saturation]}
                      onValueChange={([value]) => updateSetting('colorCorrection', 'saturation', value)}
                      min={-100}
                      max={100}
                      step={1}
                      className="w-full"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Gamma: {settings.colorCorrection.gamma.toFixed(1)}</label>
                    <Slider
                      value={[settings.colorCorrection.gamma]}
                      onValueChange={([value]) => updateSetting('colorCorrection', 'gamma', value)}
                      min={0.1}
                      max={3.0}
                      step={0.1}
                      className="w-full"
                    />
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Switch 
                      checked={settings.colorCorrection.autoWhiteBalance} 
                      onCheckedChange={(enabled) => updateSetting('colorCorrection', 'autoWhiteBalance', enabled)}
                      id="auto-wb"
                    />
                    <label htmlFor="auto-wb" className="text-sm">Balanço de Branco Automático</label>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="stabilization" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Maximize2 className="h-5 w-5" />
                Estabilização de Vídeo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Switch 
                  checked={settings.stabilization.enabled} 
                  onCheckedChange={(enabled) => updateSetting('stabilization', 'enabled', enabled)}
                  id="stab-enabled"
                />
                <label htmlFor="stab-enabled" className="text-sm font-medium">Ativar Estabilização</label>
              </div>
              
              {settings.stabilization.enabled && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Força: {settings.stabilization.strength}%</label>
                    <Slider
                      value={[settings.stabilization.strength]}
                      onValueChange={([value]) => updateSetting('stabilization', 'strength', value)}
                      min={0}
                      max={100}
                      step={1}
                      className="w-full"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Suavização: {settings.stabilization.smoothing}%</label>
                    <Slider
                      value={[settings.stabilization.smoothing]}
                      onValueChange={([value]) => updateSetting('stabilization', 'smoothing', value)}
                      min={0}
                      max={100}
                      step={1}
                      className="w-full"
                    />
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Switch 
                      checked={settings.stabilization.cropCompensation} 
                      onCheckedChange={(enabled) => updateSetting('stabilization', 'cropCompensation', enabled)}
                      id="crop-comp"
                    />
                    <label htmlFor="crop-comp" className="text-sm">Compensação de Crop</label>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="noise" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Redução de Ruído</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Switch 
                  checked={settings.noiseReduction.enabled} 
                  onCheckedChange={(enabled) => updateSetting('noiseReduction', 'enabled', enabled)}
                  id="noise-enabled"
                />
                <label htmlFor="noise-enabled" className="text-sm font-medium">Ativar Redução de Ruído</label>
              </div>
              
              {settings.noiseReduction.enabled && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Força (Vídeo): {settings.noiseReduction.videoStrength}%</label>
                    <Slider
                      value={[settings.noiseReduction.videoStrength]}
                      onValueChange={([value]) => updateSetting('noiseReduction', 'videoStrength', value)}
                      min={0}
                      max={100}
                      step={1}
                      className="w-full"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Força (Áudio): {settings.noiseReduction.audioStrength}%</label>
                    <Slider
                      value={[settings.noiseReduction.audioStrength]}
                      onValueChange={([value]) => updateSetting('noiseReduction', 'audioStrength', value)}
                      min={0}
                      max={100}
                      step={1}
                      className="w-full"
                    />
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Switch 
                      checked={settings.noiseReduction.preserveDetails} 
                      onCheckedChange={(enabled) => updateSetting('noiseReduction', 'preserveDetails', enabled)}
                      id="preserve-details"
                    />
                    <label htmlFor="preserve-details" className="text-sm">Preservar Detalhes</label>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="audio" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Volume2 className="h-5 w-5" />
                Otimização de Áudio
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Switch 
                  checked={settings.audioOptimization.enabled} 
                  onCheckedChange={(enabled) => updateSetting('audioOptimization', 'enabled', enabled)}
                  id="audio-enabled"
                />
                <label htmlFor="audio-enabled" className="text-sm font-medium">Ativar Otimização de Áudio</label>
              </div>
              
              {settings.audioOptimization.enabled && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Switch 
                      checked={settings.audioOptimization.normalization} 
                      onCheckedChange={(enabled) => updateSetting('audioOptimization', 'normalization', enabled)}
                      id="normalization"
                    />
                    <label htmlFor="normalization" className="text-sm">Normalização Automática</label>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Faixa Dinâmica: {settings.audioOptimization.dynamicRange}%</label>
                    <Slider
                      value={[settings.audioOptimization.dynamicRange]}
                      onValueChange={([value]) => updateSetting('audioOptimization', 'dynamicRange', value)}
                      min={0}
                      max={100}
                      step={1}
                      className="w-full"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Noise Gate: {settings.audioOptimization.noiseGate}Hz</label>
                    <Slider
                      value={[settings.audioOptimization.noiseGate]}
                      onValueChange={([value]) => updateSetting('audioOptimization', 'noiseGate', value)}
                      min={0}
                      max={200}
                      step={5}
                      className="w-full"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="crop" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crop className="h-5 w-5" />
                Auto-Crop Inteligente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Switch 
                  checked={settings.smartCrop.enabled} 
                  onCheckedChange={(enabled) => updateSetting('smartCrop', 'enabled', enabled)}
                  id="crop-enabled"
                />
                <label htmlFor="crop-enabled" className="text-sm font-medium">Ativar Auto-Crop</label>
              </div>
              
              {settings.smartCrop.enabled && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Aspect Ratio</label>
                    <select 
                      value={settings.smartCrop.aspectRatio}
                      onChange={(e) => updateSetting('smartCrop', 'aspectRatio', e.target.value)}
                      className="w-full p-2 border rounded"
                    >
                      <option value="16:9">16:9 (Widescreen)</option>
                      <option value="4:3">4:3 (Standard)</option>
                      <option value="1:1">1:1 (Square)</option>
                      <option value="9:16">9:16 (Vertical)</option>
                    </select>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Switch 
                      checked={settings.smartCrop.focusDetection} 
                      onCheckedChange={(enabled) => updateSetting('smartCrop', 'focusDetection', enabled)}
                      id="focus-detection"
                    />
                    <label htmlFor="focus-detection" className="text-sm">Detecção de Foco</label>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Switch 
                      checked={settings.smartCrop.motionTracking} 
                      onCheckedChange={(enabled) => updateSetting('smartCrop', 'motionTracking', enabled)}
                      id="motion-tracking"
                    />
                    <label htmlFor="motion-tracking" className="text-sm">Rastreamento de Movimento</label>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {optimizationResult && (
        <Card>
          <CardHeader>
            <CardTitle>Resultados da Otimização</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-medium">Antes vs Depois</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Brilho:</span>
                    <div className="flex gap-2">
                      <Badge variant="outline">{Math.round(optimizationResult.before.brightness)}</Badge>
                      <span>→</span>
                      <Badge>{Math.round(optimizationResult.after.brightness)}</Badge>
                    </div>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-sm">Contraste:</span>
                    <div className="flex gap-2">
                      <Badge variant="outline">{Math.round(optimizationResult.before.contrast)}</Badge>
                      <span>→</span>
                      <Badge>{Math.round(optimizationResult.after.contrast)}</Badge>
                    </div>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-sm">Ruído:</span>
                    <div className="flex gap-2">
                      <Badge variant="outline">{Math.round(optimizationResult.before.noiseLevel)}</Badge>
                      <span>→</span>
                      <Badge>{Math.round(optimizationResult.after.noiseLevel)}</Badge>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <h4 className="font-medium">Melhorias</h4>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-sm">Balanço de Cor</span>
                      <span className="text-sm font-medium">+{Math.round(optimizationResult.improvements.colorBalance)}%</span>
                    </div>
                    <Progress value={optimizationResult.improvements.colorBalance} className="h-2" />
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-sm">Redução de Ruído</span>
                      <span className="text-sm font-medium">+{Math.round(optimizationResult.improvements.noiseReduction)}%</span>
                    </div>
                    <Progress value={optimizationResult.improvements.noiseReduction} className="h-2" />
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-sm">Clareza de Áudio</span>
                      <span className="text-sm font-medium">+{Math.round(optimizationResult.improvements.audioClarity)}%</span>
                    </div>
                    <Progress value={optimizationResult.improvements.audioClarity} className="h-2" />
                  </div>
                </div>
                
                <div className="pt-4 border-t">
                  <div className="text-center">
                    <div className="text-2xl font-bold mb-1">
                      {Math.round(optimizationResult.improvements.overallScore)}%
                    </div>
                    <div className="text-sm text-muted-foreground">Melhoria Geral</div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {optimizationHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Histórico de Otimizações</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={optimizationHistory}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="timestamp" 
                    tickFormatter={(timestamp) => new Date(timestamp).toLocaleTimeString()}
                  />
                  <YAxis />
                  <Tooltip 
                    labelFormatter={(timestamp) => new Date(timestamp).toLocaleString()}
                    formatter={(value) => [`${Math.round(value)}%`, 'Score de Melhoria']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="score" 
                    stroke="#8884d8" 
                    strokeWidth={2}
                    dot={{ fill: '#8884d8' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
      
      {!videoElement && (
        <Alert>
          <AlertDescription>
            Conecte um elemento de vídeo para começar a otimização automática.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default AutoOptimizer;