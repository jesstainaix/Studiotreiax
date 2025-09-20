import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import {
  Eye,
  Volume2,
  Palette,
  Users,
  Activity,
  Camera,
  Zap,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  BarChart3,
  Scan,
  Brain,
  Target,
  Gauge
} from 'lucide-react';

// Interfaces para análise de conteúdo
interface VideoQualityMetrics {
  resolution: { width: number; height: number };
  bitrate: number;
  fps: number;
  noiseLevel: number;
  sharpness: number;
  stability: number;
  colorAccuracy: number;
  exposureBalance: number;
}

interface AudioQualityMetrics {
  volume: number;
  clarity: number;
  backgroundNoise: number;
  dynamicRange: number;
  frequency: {
    bass: number;
    mid: number;
    treble: number;
  };
}

interface ObjectDetection {
  faces: Array<{
    id: string;
    confidence: number;
    position: { x: number; y: number; width: number; height: number };
    emotions: { [key: string]: number };
    age?: number;
    gender?: string;
  }>;
  objects: Array<{
    id: string;
    type: string;
    confidence: number;
    position: { x: number; y: number; width: number; height: number };
  }>;
  text: Array<{
    id: string;
    content: string;
    confidence: number;
    position: { x: number; y: number; width: number; height: number };
  }>;
}

interface ColorAnalysis {
  dominantColors: Array<{
    color: string;
    percentage: number;
    name: string;
  }>;
  colorTemperature: number;
  saturation: number;
  brightness: number;
  contrast: number;
  colorHarmony: 'monochromatic' | 'complementary' | 'triadic' | 'analogous' | 'split-complementary';
}

interface CompositionAnalysis {
  ruleOfThirds: {
    score: number;
    intersectionPoints: Array<{ x: number; y: number; occupied: boolean }>;
  };
  symmetry: {
    horizontal: number;
    vertical: number;
    radial: number;
  };
  leadingLines: Array<{
    start: { x: number; y: number };
    end: { x: number; y: number };
    strength: number;
  }>;
  framing: {
    naturalFrames: number;
    edgeDistribution: { top: number; right: number; bottom: number; left: number };
  };
}

interface MotionAnalysis {
  cameraMovement: {
    pan: number;
    tilt: number;
    zoom: number;
    shake: number;
  };
  objectMovement: Array<{
    objectId: string;
    velocity: { x: number; y: number };
    acceleration: { x: number; y: number };
    trajectory: Array<{ x: number; y: number; timestamp: number }>;
  }>;
  sceneChanges: Array<{
    timestamp: number;
    type: 'cut' | 'fade' | 'dissolve' | 'wipe';
    confidence: number;
  }>;
}

interface ContentAnalysisResult {
  videoQuality: VideoQualityMetrics;
  audioQuality: AudioQualityMetrics;
  objectDetection: ObjectDetection;
  colorAnalysis: ColorAnalysis;
  compositionAnalysis: CompositionAnalysis;
  motionAnalysis: MotionAnalysis;
  overallScore: number;
  recommendations: Array<{
    type: 'critical' | 'warning' | 'suggestion';
    category: string;
    message: string;
    action?: string;
  }>;
  processingTime: number;
  timestamp: Date;
}

interface ContentAnalyzerProps {
  videoElement?: HTMLVideoElement;
  audioContext?: AudioContext;
  onAnalysisComplete?: (result: ContentAnalysisResult) => void;
  onAnalysisProgress?: (progress: number, stage: string) => void;
  autoAnalyze?: boolean;
  analysisDepth?: 'basic' | 'standard' | 'comprehensive';
  className?: string;
}

export const ContentAnalyzer: React.FC<ContentAnalyzerProps> = ({
  videoElement,
  audioContext,
  onAnalysisComplete,
  onAnalysisProgress,
  autoAnalyze = false,
  analysisDepth = 'standard',
  className = ''
}) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [currentStage, setCurrentStage] = useState('');
  const [analysisResult, setAnalysisResult] = useState<ContentAnalysisResult | null>(null);
  const [selectedTab, setSelectedTab] = useState('overview');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const analyzerRef = useRef<any>(null);

  // Inicializar analisadores
  useEffect(() => {
    initializeAnalyzers();
    
    if (autoAnalyze && videoElement) {
      startAnalysis();
    }
  }, [videoElement, autoAnalyze]);

  const initializeAnalyzers = useCallback(() => {
    // Inicializar Web Workers para análise pesada
    if (typeof Worker !== 'undefined') {
      try {
        // Simulação de inicialização de workers para análise
        analyzerRef.current = {
          videoAnalyzer: new Worker(new URL('../../workers/videoAnalyzer.js', import.meta.url)),
          audioAnalyzer: new Worker(new URL('../../workers/audioAnalyzer.js', import.meta.url)),
          objectDetector: new Worker(new URL('../../workers/objectDetector.js', import.meta.url))
        };
      } catch (error) {
        console.warn('Web Workers não disponíveis, usando análise síncrona');
      }
    }
  }, []);

  const startAnalysis = useCallback(async () => {
    if (!videoElement || isAnalyzing) return;

    setIsAnalyzing(true);
    setAnalysisProgress(0);
    setCurrentStage('Iniciando análise...');
    
    const startTime = performance.now();

    try {
      // Análise de qualidade de vídeo
      setCurrentStage('Analisando qualidade de vídeo...');
      const videoQuality = await analyzeVideoQuality(videoElement);
      setAnalysisProgress(15);
      onAnalysisProgress?.(15, 'Qualidade de vídeo analisada');

      // Análise de áudio
      setCurrentStage('Analisando qualidade de áudio...');
      const audioQuality = await analyzeAudioQuality(videoElement, audioContext);
      setAnalysisProgress(30);
      onAnalysisProgress?.(30, 'Qualidade de áudio analisada');

      // Detecção de objetos e faces
      setCurrentStage('Detectando objetos e faces...');
      const objectDetection = await detectObjects(videoElement);
      setAnalysisProgress(50);
      onAnalysisProgress?.(50, 'Objetos e faces detectados');

      // Análise de cores
      setCurrentStage('Analisando cores e iluminação...');
      const colorAnalysis = await analyzeColors(videoElement);
      setAnalysisProgress(65);
      onAnalysisProgress?.(65, 'Cores analisadas');

      // Análise de composição
      setCurrentStage('Analisando composição...');
      const compositionAnalysis = await analyzeComposition(videoElement);
      setAnalysisProgress(80);
      onAnalysisProgress?.(80, 'Composição analisada');

      // Análise de movimento
      setCurrentStage('Analisando movimento...');
      const motionAnalysis = await analyzeMotion(videoElement);
      setAnalysisProgress(95);
      onAnalysisProgress?.(95, 'Movimento analisado');

      // Calcular score geral e recomendações
      setCurrentStage('Gerando recomendações...');
      const overallScore = calculateOverallScore({
        videoQuality,
        audioQuality,
        objectDetection,
        colorAnalysis,
        compositionAnalysis,
        motionAnalysis
      });

      const recommendations = generateRecommendations({
        videoQuality,
        audioQuality,
        objectDetection,
        colorAnalysis,
        compositionAnalysis,
        motionAnalysis
      });

      const processingTime = performance.now() - startTime;

      const result: ContentAnalysisResult = {
        videoQuality,
        audioQuality,
        objectDetection,
        colorAnalysis,
        compositionAnalysis,
        motionAnalysis,
        overallScore,
        recommendations,
        processingTime,
        timestamp: new Date()
      };

      setAnalysisResult(result);
      setAnalysisProgress(100);
      onAnalysisProgress?.(100, 'Análise concluída');
      onAnalysisComplete?.(result);
      
      toast.success(`Análise concluída em ${(processingTime / 1000).toFixed(1)}s`);
    } catch (error) {
      console.error('Erro na análise:', error);
      toast.error('Erro durante a análise de conteúdo');
    } finally {
      setIsAnalyzing(false);
      setCurrentStage('');
    }
  }, [videoElement, audioContext, isAnalyzing, onAnalysisComplete, onAnalysisProgress]);

  // Análise de qualidade de vídeo
  const analyzeVideoQuality = async (video: HTMLVideoElement): Promise<VideoQualityMetrics> => {
    const canvas = canvasRef.current;
    if (!canvas) throw new Error('Canvas não disponível');

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Contexto 2D não disponível');

    // Configurar canvas
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;

    // Calcular métricas de qualidade
    const noiseLevel = calculateNoiseLevel(pixels);
    const sharpness = calculateSharpness(pixels, canvas.width, canvas.height);
    const stability = calculateStability(video);
    const colorAccuracy = calculateColorAccuracy(pixels);
    const exposureBalance = calculateExposureBalance(pixels);

    return {
      resolution: { width: video.videoWidth, height: video.videoHeight },
      bitrate: estimateBitrate(video),
      fps: 30, // Estimativa
      noiseLevel,
      sharpness,
      stability,
      colorAccuracy,
      exposureBalance
    };
  };

  // Análise de qualidade de áudio
  const analyzeAudioQuality = async (
    video: HTMLVideoElement,
    audioCtx?: AudioContext
  ): Promise<AudioQualityMetrics> => {
    if (!audioCtx) {
      // Análise básica sem AudioContext
      return {
        volume: 0.7,
        clarity: 0.8,
        backgroundNoise: 0.2,
        dynamicRange: 0.6,
        frequency: { bass: 0.5, mid: 0.7, treble: 0.6 }
      };
    }

    try {
      const source = audioCtx.createMediaElementSource(video);
      const analyser = audioCtx.createAnalyser();
      source.connect(analyser);
      analyser.connect(audioCtx.destination);

      analyser.fftSize = 2048;
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      analyser.getByteFrequencyData(dataArray);

      // Calcular métricas de áudio
      const volume = calculateAverageVolume(dataArray);
      const clarity = calculateAudioClarity(dataArray);
      const backgroundNoise = calculateBackgroundNoise(dataArray);
      const dynamicRange = calculateDynamicRange(dataArray);
      const frequency = calculateFrequencyDistribution(dataArray);

      return {
        volume,
        clarity,
        backgroundNoise,
        dynamicRange,
        frequency
      };
    } catch (error) {
      console.warn('Erro na análise de áudio:', error);
      return {
        volume: 0.5,
        clarity: 0.5,
        backgroundNoise: 0.3,
        dynamicRange: 0.5,
        frequency: { bass: 0.3, mid: 0.5, treble: 0.4 }
      };
    }
  };

  // Detecção de objetos e faces
  const detectObjects = async (video: HTMLVideoElement): Promise<ObjectDetection> => {
    const canvas = canvasRef.current;
    if (!canvas) throw new Error('Canvas não disponível');

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Contexto 2D não disponível');

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);

    // Simulação de detecção de faces usando análise de pixels
    const faces = await detectFaces(canvas);
    const objects = await detectGeneralObjects(canvas);
    const text = await detectText(canvas);

    return { faces, objects, text };
  };

  // Análise de cores
  const analyzeColors = async (video: HTMLVideoElement): Promise<ColorAnalysis> => {
    const canvas = canvasRef.current;
    if (!canvas) throw new Error('Canvas não disponível');

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Contexto 2D não disponível');

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;

    const dominantColors = extractDominantColors(pixels);
    const colorTemperature = calculateColorTemperature(pixels);
    const saturation = calculateSaturation(pixels);
    const brightness = calculateBrightness(pixels);
    const contrast = calculateContrast(pixels);
    const colorHarmony = determineColorHarmony(dominantColors);

    return {
      dominantColors,
      colorTemperature,
      saturation,
      brightness,
      contrast,
      colorHarmony
    };
  };

  // Análise de composição
  const analyzeComposition = async (video: HTMLVideoElement): Promise<CompositionAnalysis> => {
    const canvas = canvasRef.current;
    if (!canvas) throw new Error('Canvas não disponível');

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Contexto 2D não disponível');

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    
    const ruleOfThirds = analyzeRuleOfThirds(imageData);
    const symmetry = analyzeSymmetry(imageData);
    const leadingLines = detectLeadingLines(imageData);
    const framing = analyzeFraming(imageData);

    return {
      ruleOfThirds,
      symmetry,
      leadingLines,
      framing
    };
  };

  // Análise de movimento
  const analyzeMotion = async (video: HTMLVideoElement): Promise<MotionAnalysis> => {
    // Simulação de análise de movimento
    return {
      cameraMovement: {
        pan: Math.random() * 0.3,
        tilt: Math.random() * 0.2,
        zoom: Math.random() * 0.1,
        shake: Math.random() * 0.4
      },
      objectMovement: [],
      sceneChanges: []
    };
  };

  // Funções auxiliares de cálculo
  const calculateNoiseLevel = (pixels: Uint8ClampedArray): number => {
    let variance = 0;
    let mean = 0;
    
    // Calcular média
    for (let i = 0; i < pixels.length; i += 4) {
      const gray = (pixels[i] + pixels[i + 1] + pixels[i + 2]) / 3;
      mean += gray;
    }
    mean /= (pixels.length / 4);
    
    // Calcular variância
    for (let i = 0; i < pixels.length; i += 4) {
      const gray = (pixels[i] + pixels[i + 1] + pixels[i + 2]) / 3;
      variance += Math.pow(gray - mean, 2);
    }
    variance /= (pixels.length / 4);
    
    return Math.min(Math.sqrt(variance) / 255, 1);
  };

  const calculateSharpness = (pixels: Uint8ClampedArray, width: number, height: number): number => {
    let sharpness = 0;
    const sampleSize = Math.min(1000, width * height / 4);
    
    for (let i = 0; i < sampleSize; i++) {
      const idx = Math.floor(Math.random() * (pixels.length / 4)) * 4;
      if (idx + width * 4 < pixels.length) {
        const current = (pixels[idx] + pixels[idx + 1] + pixels[idx + 2]) / 3;
        const right = (pixels[idx + 4] + pixels[idx + 5] + pixels[idx + 6]) / 3;
        const bottom = (pixels[idx + width * 4] + pixels[idx + width * 4 + 1] + pixels[idx + width * 4 + 2]) / 3;
        
        sharpness += Math.abs(current - right) + Math.abs(current - bottom);
      }
    }
    
    return Math.min(sharpness / (sampleSize * 255), 1);
  };

  const calculateStability = (video: HTMLVideoElement): number => {
    // Simulação de cálculo de estabilidade
    return 0.8 + Math.random() * 0.2;
  };

  const calculateColorAccuracy = (pixels: Uint8ClampedArray): number => {
    // Simulação de cálculo de precisão de cor
    return 0.7 + Math.random() * 0.3;
  };

  const calculateExposureBalance = (pixels: Uint8ClampedArray): number => {
    const histogram = new Array(256).fill(0);
    
    for (let i = 0; i < pixels.length; i += 4) {
      const gray = Math.floor((pixels[i] + pixels[i + 1] + pixels[i + 2]) / 3);
      histogram[gray]++;
    }
    
    // Verificar distribuição
    const total = pixels.length / 4;
    const shadows = histogram.slice(0, 85).reduce((a, b) => a + b, 0) / total;
    const midtones = histogram.slice(85, 170).reduce((a, b) => a + b, 0) / total;
    const highlights = histogram.slice(170, 256).reduce((a, b) => a + b, 0) / total;
    
    // Score baseado na distribuição equilibrada
    const ideal = 1/3;
    const deviation = Math.abs(shadows - ideal) + Math.abs(midtones - ideal) + Math.abs(highlights - ideal);
    
    return Math.max(0, 1 - deviation);
  };

  const estimateBitrate = (video: HTMLVideoElement): number => {
    // Estimativa baseada na resolução e qualidade
    const pixels = video.videoWidth * video.videoHeight;
    return Math.floor(pixels * 0.1); // Estimativa simples
  };

  // Funções de análise de áudio
  const calculateAverageVolume = (dataArray: Uint8Array): number => {
    const sum = dataArray.reduce((a, b) => a + b, 0);
    return (sum / dataArray.length) / 255;
  };

  const calculateAudioClarity = (dataArray: Uint8Array): number => {
    // Análise de clareza baseada na distribuição de frequências
    const midRange = dataArray.slice(dataArray.length * 0.2, dataArray.length * 0.8);
    const midSum = midRange.reduce((a, b) => a + b, 0);
    return (midSum / midRange.length) / 255;
  };

  const calculateBackgroundNoise = (dataArray: Uint8Array): number => {
    // Análise de ruído de fundo
    const lowFreq = dataArray.slice(0, dataArray.length * 0.1);
    const lowSum = lowFreq.reduce((a, b) => a + b, 0);
    return (lowSum / lowFreq.length) / 255;
  };

  const calculateDynamicRange = (dataArray: Uint8Array): number => {
    const max = Math.max(...dataArray);
    const min = Math.min(...dataArray);
    return (max - min) / 255;
  };

  const calculateFrequencyDistribution = (dataArray: Uint8Array) => {
    const third = Math.floor(dataArray.length / 3);
    
    const bass = dataArray.slice(0, third).reduce((a, b) => a + b, 0) / (third * 255);
    const mid = dataArray.slice(third, third * 2).reduce((a, b) => a + b, 0) / (third * 255);
    const treble = dataArray.slice(third * 2).reduce((a, b) => a + b, 0) / (third * 255);
    
    return { bass, mid, treble };
  };

  // Funções de detecção
  const detectFaces = async (canvas: HTMLCanvasElement) => {
    // Simulação de detecção de faces
    const faces = [];
    const numFaces = Math.floor(Math.random() * 3);
    
    for (let i = 0; i < numFaces; i++) {
      faces.push({
        id: `face-${i}`,
        confidence: 0.8 + Math.random() * 0.2,
        position: {
          x: Math.random() * canvas.width * 0.7,
          y: Math.random() * canvas.height * 0.7,
          width: 50 + Math.random() * 100,
          height: 60 + Math.random() * 120
        },
        emotions: {
          happy: Math.random(),
          sad: Math.random() * 0.3,
          angry: Math.random() * 0.2,
          surprised: Math.random() * 0.4,
          neutral: Math.random() * 0.6
        },
        age: 20 + Math.floor(Math.random() * 40),
        gender: Math.random() > 0.5 ? 'male' : 'female'
      });
    }
    
    return faces;
  };

  const detectGeneralObjects = async (canvas: HTMLCanvasElement) => {
    // Simulação de detecção de objetos
    const objects = [];
    const objectTypes = ['person', 'car', 'building', 'tree', 'animal', 'furniture'];
    const numObjects = Math.floor(Math.random() * 5);
    
    for (let i = 0; i < numObjects; i++) {
      objects.push({
        id: `object-${i}`,
        type: objectTypes[Math.floor(Math.random() * objectTypes.length)],
        confidence: 0.6 + Math.random() * 0.4,
        position: {
          x: Math.random() * canvas.width * 0.8,
          y: Math.random() * canvas.height * 0.8,
          width: 30 + Math.random() * 200,
          height: 30 + Math.random() * 200
        }
      });
    }
    
    return objects;
  };

  const detectText = async (canvas: HTMLCanvasElement) => {
    // Simulação de detecção de texto
    return [];
  };

  // Funções de análise de cor
  const extractDominantColors = (pixels: Uint8ClampedArray) => {
    const colorMap = new Map<string, number>();
    
    // Amostragem de cores
    for (let i = 0; i < pixels.length; i += 16) { // Amostragem reduzida
      const r = Math.floor(pixels[i] / 32) * 32;
      const g = Math.floor(pixels[i + 1] / 32) * 32;
      const b = Math.floor(pixels[i + 2] / 32) * 32;
      const color = `rgb(${r},${g},${b})`;
      
      colorMap.set(color, (colorMap.get(color) || 0) + 1);
    }
    
    // Ordenar por frequência
    const sortedColors = Array.from(colorMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    
    const total = sortedColors.reduce((sum, [, count]) => sum + count, 0);
    
    return sortedColors.map(([color, count], index) => ({
      color,
      percentage: (count / total) * 100,
      name: `Cor ${index + 1}`
    }));
  };

  const calculateColorTemperature = (pixels: Uint8ClampedArray): number => {
    let rSum = 0, bSum = 0;
    const sampleSize = pixels.length / 4;
    
    for (let i = 0; i < pixels.length; i += 4) {
      rSum += pixels[i];
      bSum += pixels[i + 2];
    }
    
    const rAvg = rSum / sampleSize;
    const bAvg = bSum / sampleSize;
    
    // Temperatura de cor estimada (K)
    return rAvg > bAvg ? 3200 + (rAvg - bAvg) * 20 : 6500 - (bAvg - rAvg) * 20;
  };

  const calculateSaturation = (pixels: Uint8ClampedArray): number => {
    let satSum = 0;
    const sampleSize = pixels.length / 4;
    
    for (let i = 0; i < pixels.length; i += 4) {
      const r = pixels[i] / 255;
      const g = pixels[i + 1] / 255;
      const b = pixels[i + 2] / 255;
      
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      
      const saturation = max === 0 ? 0 : (max - min) / max;
      satSum += saturation;
    }
    
    return satSum / sampleSize;
  };

  const calculateBrightness = (pixels: Uint8ClampedArray): number => {
    let sum = 0;
    const sampleSize = pixels.length / 4;
    
    for (let i = 0; i < pixels.length; i += 4) {
      const brightness = (pixels[i] + pixels[i + 1] + pixels[i + 2]) / 3;
      sum += brightness;
    }
    
    return (sum / sampleSize) / 255;
  };

  const calculateContrast = (pixels: Uint8ClampedArray): number => {
    const brightness = calculateBrightness(pixels) * 255;
    let variance = 0;
    const sampleSize = pixels.length / 4;
    
    for (let i = 0; i < pixels.length; i += 4) {
      const pixelBrightness = (pixels[i] + pixels[i + 1] + pixels[i + 2]) / 3;
      variance += Math.pow(pixelBrightness - brightness, 2);
    }
    
    return Math.min(Math.sqrt(variance / sampleSize) / 128, 1);
  };

  const determineColorHarmony = (dominantColors: any[]): ColorAnalysis['colorHarmony'] => {
    // Análise simplificada de harmonia de cores
    if (dominantColors.length <= 2) return 'monochromatic';
    return 'complementary'; // Simplificado
  };

  // Funções de análise de composição
  const analyzeRuleOfThirds = (imageData: ImageData) => {
    const { width, height } = imageData;
    const intersectionPoints = [
      { x: width / 3, y: height / 3, occupied: false },
      { x: (width * 2) / 3, y: height / 3, occupied: false },
      { x: width / 3, y: (height * 2) / 3, occupied: false },
      { x: (width * 2) / 3, y: (height * 2) / 3, occupied: false }
    ];
    
    // Verificar ocupação dos pontos (simulado)
    intersectionPoints.forEach(point => {
      point.occupied = Math.random() > 0.6;
    });
    
    const occupiedPoints = intersectionPoints.filter(p => p.occupied).length;
    const score = occupiedPoints / intersectionPoints.length;
    
    return { score, intersectionPoints };
  };

  const analyzeSymmetry = (imageData: ImageData) => {
    // Análise simplificada de simetria
    return {
      horizontal: Math.random() * 0.8,
      vertical: Math.random() * 0.8,
      radial: Math.random() * 0.5
    };
  };

  const detectLeadingLines = (imageData: ImageData) => {
    // Simulação de detecção de linhas guia
    const lines = [];
    const numLines = Math.floor(Math.random() * 3);
    
    for (let i = 0; i < numLines; i++) {
      lines.push({
        start: {
          x: Math.random() * imageData.width,
          y: Math.random() * imageData.height
        },
        end: {
          x: Math.random() * imageData.width,
          y: Math.random() * imageData.height
        },
        strength: Math.random()
      });
    }
    
    return lines;
  };

  const analyzeFraming = (imageData: ImageData) => {
    return {
      naturalFrames: Math.floor(Math.random() * 3),
      edgeDistribution: {
        top: Math.random(),
        right: Math.random(),
        bottom: Math.random(),
        left: Math.random()
      }
    };
  };

  // Cálculo de score geral
  const calculateOverallScore = (analysis: Partial<ContentAnalysisResult>): number => {
    const weights = {
      videoQuality: 0.25,
      audioQuality: 0.20,
      composition: 0.20,
      colors: 0.15,
      objects: 0.10,
      motion: 0.10
    };
    
    let score = 0;
    
    if (analysis.videoQuality) {
      const vq = analysis.videoQuality;
      const videoScore = (vq.sharpness + vq.stability + vq.colorAccuracy + vq.exposureBalance - vq.noiseLevel) / 4;
      score += videoScore * weights.videoQuality;
    }
    
    if (analysis.audioQuality) {
      const aq = analysis.audioQuality;
      const audioScore = (aq.volume + aq.clarity + aq.dynamicRange - aq.backgroundNoise) / 3;
      score += audioScore * weights.audioQuality;
    }
    
    if (analysis.compositionAnalysis) {
      const comp = analysis.compositionAnalysis;
      const compScore = (comp.ruleOfThirds.score + comp.symmetry.horizontal + comp.symmetry.vertical) / 3;
      score += compScore * weights.composition;
    }
    
    if (analysis.colorAnalysis) {
      const colors = analysis.colorAnalysis;
      const colorScore = (colors.saturation + colors.brightness + colors.contrast) / 3;
      score += colorScore * weights.colors;
    }
    
    // Adicionar scores de objetos e movimento
    score += 0.7 * weights.objects; // Simulado
    score += 0.6 * weights.motion; // Simulado
    
    return Math.min(Math.max(score, 0), 1);
  };

  // Geração de recomendações
  const generateRecommendations = (analysis: Partial<ContentAnalysisResult>) => {
    const recommendations = [];
    
    if (analysis.videoQuality) {
      const vq = analysis.videoQuality;
      
      if (vq.noiseLevel > 0.3) {
        recommendations.push({
          type: 'warning' as const,
          category: 'Qualidade de Vídeo',
          message: 'Alto nível de ruído detectado',
          action: 'Aplicar filtro de redução de ruído'
        });
      }
      
      if (vq.sharpness < 0.4) {
        recommendations.push({
          type: 'suggestion' as const,
          category: 'Qualidade de Vídeo',
          message: 'Imagem com baixa nitidez',
          action: 'Aplicar filtro de nitidez'
        });
      }
      
      if (vq.stability < 0.6) {
        recommendations.push({
          type: 'warning' as const,
          category: 'Estabilidade',
          message: 'Vídeo instável detectado',
          action: 'Aplicar estabilização de imagem'
        });
      }
      
      if (vq.exposureBalance < 0.5) {
        recommendations.push({
          type: 'suggestion' as const,
          category: 'Exposição',
          message: 'Exposição desbalanceada',
          action: 'Ajustar curvas de cor'
        });
      }
    }
    
    if (analysis.audioQuality) {
      const aq = analysis.audioQuality;
      
      if (aq.volume < 0.3) {
        recommendations.push({
          type: 'warning' as const,
          category: 'Áudio',
          message: 'Volume muito baixo',
          action: 'Aumentar ganho de áudio'
        });
      }
      
      if (aq.backgroundNoise > 0.4) {
        recommendations.push({
          type: 'warning' as const,
          category: 'Áudio',
          message: 'Alto ruído de fundo',
          action: 'Aplicar filtro de redução de ruído'
        });
      }
      
      if (aq.clarity < 0.5) {
        recommendations.push({
          type: 'suggestion' as const,
          category: 'Áudio',
          message: 'Baixa clareza de áudio',
          action: 'Aplicar equalização'
        });
      }
    }
    
    if (analysis.compositionAnalysis) {
      const comp = analysis.compositionAnalysis;
      
      if (comp.ruleOfThirds.score < 0.3) {
        recommendations.push({
          type: 'suggestion' as const,
          category: 'Composição',
          message: 'Composição pode ser melhorada',
          action: 'Considerar regra dos terços'
        });
      }
    }
    
    if (analysis.colorAnalysis) {
      const colors = analysis.colorAnalysis;
      
      if (colors.saturation < 0.3) {
        recommendations.push({
          type: 'suggestion' as const,
          category: 'Cores',
          message: 'Cores pouco saturadas',
          action: 'Aumentar saturação'
        });
      }
      
      if (colors.contrast < 0.4) {
        recommendations.push({
          type: 'suggestion' as const,
          category: 'Cores',
          message: 'Baixo contraste',
          action: 'Ajustar contraste'
        });
      }
    }
    
    return recommendations;
  };

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600';
    if (score >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 0.8) return 'Excelente';
    if (score >= 0.6) return 'Bom';
    if (score >= 0.4) return 'Regular';
    return 'Precisa Melhorar';
  };

  return (
    <div className={`content-analyzer ${className}`}>
      <canvas ref={canvasRef} className="hidden" />
      
      <Card className="h-full">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Análise de Conteúdo IA
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                onClick={startAnalysis}
                disabled={isAnalyzing || !videoElement}
                size="sm"
                className="flex items-center gap-2"
              >
                {isAnalyzing ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Analisando...
                  </>
                ) : (
                  <>
                    <Scan className="h-4 w-4" />
                    Analisar
                  </>
                )}
              </Button>
            </div>
          </div>
          
          {isAnalyzing && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>{currentStage}</span>
                <span>{analysisProgress}%</span>
              </div>
              <Progress value={analysisProgress} className="h-2" />
            </div>
          )}
        </CardHeader>
        
        <CardContent className="flex-1 overflow-hidden">
          {analysisResult ? (
            <Tabs value={selectedTab} onValueChange={setSelectedTab} className="h-full flex flex-col">
              <TabsList className="grid w-full grid-cols-6">
                <TabsTrigger value="overview">Visão Geral</TabsTrigger>
                <TabsTrigger value="video">Vídeo</TabsTrigger>
                <TabsTrigger value="audio">Áudio</TabsTrigger>
                <TabsTrigger value="objects">Objetos</TabsTrigger>
                <TabsTrigger value="colors">Cores</TabsTrigger>
                <TabsTrigger value="composition">Composição</TabsTrigger>
              </TabsList>
              
              <div className="flex-1 overflow-hidden mt-4">
                <ScrollArea className="h-full">
                  <TabsContent value="overview" className="mt-0 space-y-4">
                    {/* Score Geral */}
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Target className="h-5 w-5" />
                          Score Geral
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center gap-4">
                          <div className="text-3xl font-bold">
                            <span className={getScoreColor(analysisResult.overallScore)}>
                              {Math.round(analysisResult.overallScore * 100)}
                            </span>
                            <span className="text-lg text-muted-foreground">/100</span>
                          </div>
                          <div>
                            <Badge 
                              variant={analysisResult.overallScore >= 0.7 ? 'default' : 'secondary'}
                              className={analysisResult.overallScore >= 0.7 ? 'bg-green-100 text-green-800' : ''}
                            >
                              {getScoreLabel(analysisResult.overallScore)}
                            </Badge>
                            <p className="text-sm text-muted-foreground mt-1">
                              Análise concluída em {(analysisResult.processingTime / 1000).toFixed(1)}s
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    {/* Métricas Rápidas */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2">
                            <Eye className="h-4 w-4 text-blue-500" />
                            <span className="text-sm font-medium">Qualidade Visual</span>
                          </div>
                          <div className="mt-2">
                            <div className="text-2xl font-bold">
                              {Math.round(((analysisResult.videoQuality.sharpness + analysisResult.videoQuality.stability + analysisResult.videoQuality.colorAccuracy) / 3) * 100)}
                            </div>
                            <Progress 
                              value={((analysisResult.videoQuality.sharpness + analysisResult.videoQuality.stability + analysisResult.videoQuality.colorAccuracy) / 3) * 100} 
                              className="h-1 mt-1" 
                            />
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2">
                            <Volume2 className="h-4 w-4 text-green-500" />
                            <span className="text-sm font-medium">Qualidade Áudio</span>
                          </div>
                          <div className="mt-2">
                            <div className="text-2xl font-bold">
                              {Math.round(((analysisResult.audioQuality.volume + analysisResult.audioQuality.clarity) / 2) * 100)}
                            </div>
                            <Progress 
                              value={((analysisResult.audioQuality.volume + analysisResult.audioQuality.clarity) / 2) * 100} 
                              className="h-1 mt-1" 
                            />
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-purple-500" />
                            <span className="text-sm font-medium">Objetos</span>
                          </div>
                          <div className="mt-2">
                            <div className="text-2xl font-bold">
                              {analysisResult.objectDetection.faces.length + analysisResult.objectDetection.objects.length}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {analysisResult.objectDetection.faces.length} faces, {analysisResult.objectDetection.objects.length} objetos
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2">
                            <Palette className="h-4 w-4 text-orange-500" />
                            <span className="text-sm font-medium">Composição</span>
                          </div>
                          <div className="mt-2">
                            <div className="text-2xl font-bold">
                              {Math.round(analysisResult.compositionAnalysis.ruleOfThirds.score * 100)}
                            </div>
                            <Progress 
                              value={analysisResult.compositionAnalysis.ruleOfThirds.score * 100} 
                              className="h-1 mt-1" 
                            />
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                    
                    {/* Recomendações */}
                    {analysisResult.recommendations.length > 0 && (
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-lg flex items-center gap-2">
                            <Zap className="h-5 w-5" />
                            Recomendações
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {analysisResult.recommendations.map((rec, index) => (
                              <Alert key={index} className={`border-l-4 ${
                                rec.type === 'critical' ? 'border-l-red-500 bg-red-50' :
                                rec.type === 'warning' ? 'border-l-yellow-500 bg-yellow-50' :
                                'border-l-blue-500 bg-blue-50'
                              }`}>
                                <div className="flex items-start gap-2">
                                  {rec.type === 'critical' ? (
                                    <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5" />
                                  ) : rec.type === 'warning' ? (
                                    <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5" />
                                  ) : (
                                    <Info className="h-4 w-4 text-blue-500 mt-0.5" />
                                  )}
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                      <Badge variant="outline" className="text-xs">
                                        {rec.category}
                                      </Badge>
                                    </div>
                                    <AlertDescription className="mt-1">
                                      {rec.message}
                                      {rec.action && (
                                        <div className="mt-1 text-sm font-medium">
                                          💡 {rec.action}
                                        </div>
                                      )}
                                    </AlertDescription>
                                  </div>
                                </div>
                              </Alert>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="video" className="mt-0 space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle>Qualidade de Vídeo</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium">Resolução</label>
                            <p className="text-lg">
                              {analysisResult.videoQuality.resolution.width} × {analysisResult.videoQuality.resolution.height}
                            </p>
                          </div>
                          <div>
                            <label className="text-sm font-medium">Bitrate Estimado</label>
                            <p className="text-lg">{analysisResult.videoQuality.bitrate.toLocaleString()} kbps</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium">Nitidez</label>
                            <div className="flex items-center gap-2">
                              <Progress value={analysisResult.videoQuality.sharpness * 100} className="flex-1" />
                              <span className="text-sm">{Math.round(analysisResult.videoQuality.sharpness * 100)}%</span>
                            </div>
                          </div>
                          <div>
                            <label className="text-sm font-medium">Estabilidade</label>
                            <div className="flex items-center gap-2">
                              <Progress value={analysisResult.videoQuality.stability * 100} className="flex-1" />
                              <span className="text-sm">{Math.round(analysisResult.videoQuality.stability * 100)}%</span>
                            </div>
                          </div>
                          <div>
                            <label className="text-sm font-medium">Nível de Ruído</label>
                            <div className="flex items-center gap-2">
                              <Progress value={analysisResult.videoQuality.noiseLevel * 100} className="flex-1" />
                              <span className="text-sm">{Math.round(analysisResult.videoQuality.noiseLevel * 100)}%</span>
                            </div>
                          </div>
                          <div>
                            <label className="text-sm font-medium">Balanço de Exposição</label>
                            <div className="flex items-center gap-2">
                              <Progress value={analysisResult.videoQuality.exposureBalance * 100} className="flex-1" />
                              <span className="text-sm">{Math.round(analysisResult.videoQuality.exposureBalance * 100)}%</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                  
                  <TabsContent value="audio" className="mt-0 space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle>Qualidade de Áudio</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div>
                            <label className="text-sm font-medium">Volume</label>
                            <div className="flex items-center gap-2">
                              <Progress value={analysisResult.audioQuality.volume * 100} className="flex-1" />
                              <span className="text-sm">{Math.round(analysisResult.audioQuality.volume * 100)}%</span>
                            </div>
                          </div>
                          <div>
                            <label className="text-sm font-medium">Clareza</label>
                            <div className="flex items-center gap-2">
                              <Progress value={analysisResult.audioQuality.clarity * 100} className="flex-1" />
                              <span className="text-sm">{Math.round(analysisResult.audioQuality.clarity * 100)}%</span>
                            </div>
                          </div>
                          <div>
                            <label className="text-sm font-medium">Ruído de Fundo</label>
                            <div className="flex items-center gap-2">
                              <Progress value={analysisResult.audioQuality.backgroundNoise * 100} className="flex-1" />
                              <span className="text-sm">{Math.round(analysisResult.audioQuality.backgroundNoise * 100)}%</span>
                            </div>
                          </div>
                          <div>
                            <label className="text-sm font-medium">Faixa Dinâmica</label>
                            <div className="flex items-center gap-2">
                              <Progress value={analysisResult.audioQuality.dynamicRange * 100} className="flex-1" />
                              <span className="text-sm">{Math.round(analysisResult.audioQuality.dynamicRange * 100)}%</span>
                            </div>
                          </div>
                          
                          <div className="pt-4">
                            <label className="text-sm font-medium mb-2 block">Distribuição de Frequências</label>
                            <div className="grid grid-cols-3 gap-4">
                              <div>
                                <label className="text-xs text-muted-foreground">Graves</label>
                                <div className="flex items-center gap-2">
                                  <Progress value={analysisResult.audioQuality.frequency.bass * 100} className="flex-1" />
                                  <span className="text-xs">{Math.round(analysisResult.audioQuality.frequency.bass * 100)}%</span>
                                </div>
                              </div>
                              <div>
                                <label className="text-xs text-muted-foreground">Médios</label>
                                <div className="flex items-center gap-2">
                                  <Progress value={analysisResult.audioQuality.frequency.mid * 100} className="flex-1" />
                                  <span className="text-xs">{Math.round(analysisResult.audioQuality.frequency.mid * 100)}%</span>
                                </div>
                              </div>
                              <div>
                                <label className="text-xs text-muted-foreground">Agudos</label>
                                <div className="flex items-center gap-2">
                                  <Progress value={analysisResult.audioQuality.frequency.treble * 100} className="flex-1" />
                                  <span className="text-xs">{Math.round(analysisResult.audioQuality.frequency.treble * 100)}%</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                  
                  <TabsContent value="objects" className="mt-0 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Faces Detectadas */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            Faces Detectadas ({analysisResult.objectDetection.faces.length})
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          {analysisResult.objectDetection.faces.length > 0 ? (
                            <div className="space-y-3">
                              {analysisResult.objectDetection.faces.map((face, index) => (
                                <div key={face.id} className="p-3 border rounded-lg">
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="font-medium">Face {index + 1}</span>
                                    <Badge variant="outline">
                                      {Math.round(face.confidence * 100)}% confiança
                                    </Badge>
                                  </div>
                                  <div className="text-sm text-muted-foreground space-y-1">
                                    <p>Idade: ~{face.age} anos</p>
                                    <p>Gênero: {face.gender === 'male' ? 'Masculino' : 'Feminino'}</p>
                                    <p>Posição: {Math.round(face.position.x)}, {Math.round(face.position.y)}</p>
                                  </div>
                                  <div className="mt-2">
                                    <label className="text-xs font-medium">Emoções:</label>
                                    <div className="grid grid-cols-2 gap-1 mt-1">
                                      {Object.entries(face.emotions).map(([emotion, value]) => (
                                        <div key={emotion} className="flex items-center gap-1">
                                          <span className="text-xs capitalize">{emotion}:</span>
                                          <span className="text-xs">{Math.round(value * 100)}%</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-muted-foreground text-center py-4">
                              Nenhuma face detectada
                            </p>
                          )}
                        </CardContent>
                      </Card>
                      
                      {/* Objetos Detectados */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Camera className="h-4 w-4" />
                            Objetos Detectados ({analysisResult.objectDetection.objects.length})
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          {analysisResult.objectDetection.objects.length > 0 ? (
                            <div className="space-y-3">
                              {analysisResult.objectDetection.objects.map((obj, index) => (
                                <div key={obj.id} className="p-3 border rounded-lg">
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="font-medium capitalize">{obj.type}</span>
                                    <Badge variant="outline">
                                      {Math.round(obj.confidence * 100)}% confiança
                                    </Badge>
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    <p>Posição: {Math.round(obj.position.x)}, {Math.round(obj.position.y)}</p>
                                    <p>Tamanho: {Math.round(obj.position.width)} × {Math.round(obj.position.height)}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-muted-foreground text-center py-4">
                              Nenhum objeto detectado
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="colors" className="mt-0 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Cores Dominantes */}
                      <Card>
                        <CardHeader>
                          <CardTitle>Cores Dominantes</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {analysisResult.colorAnalysis.dominantColors.map((color, index) => (
                              <div key={index} className="flex items-center gap-3">
                                <div 
                                  className="w-8 h-8 rounded border"
                                  style={{ backgroundColor: color.color }}
                                />
                                <div className="flex-1">
                                  <div className="flex items-center justify-between">
                                    <span className="font-medium">{color.name}</span>
                                    <span className="text-sm text-muted-foreground">
                                      {color.percentage.toFixed(1)}%
                                    </span>
                                  </div>
                                  <Progress value={color.percentage} className="h-2 mt-1" />
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                      
                      {/* Análise de Cor */}
                      <Card>
                        <CardHeader>
                          <CardTitle>Análise de Cor</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div>
                              <label className="text-sm font-medium">Temperatura de Cor</label>
                              <p className="text-lg">{Math.round(analysisResult.colorAnalysis.colorTemperature)}K</p>
                              <p className="text-xs text-muted-foreground">
                                {analysisResult.colorAnalysis.colorTemperature < 4000 ? 'Quente' : 
                                 analysisResult.colorAnalysis.colorTemperature > 6000 ? 'Fria' : 'Neutra'}
                              </p>
                            </div>
                            
                            <div>
                              <label className="text-sm font-medium">Saturação</label>
                              <div className="flex items-center gap-2">
                                <Progress value={analysisResult.colorAnalysis.saturation * 100} className="flex-1" />
                                <span className="text-sm">{Math.round(analysisResult.colorAnalysis.saturation * 100)}%</span>
                              </div>
                            </div>
                            
                            <div>
                              <label className="text-sm font-medium">Brilho</label>
                              <div className="flex items-center gap-2">
                                <Progress value={analysisResult.colorAnalysis.brightness * 100} className="flex-1" />
                                <span className="text-sm">{Math.round(analysisResult.colorAnalysis.brightness * 100)}%</span>
                              </div>
                            </div>
                            
                            <div>
                              <label className="text-sm font-medium">Contraste</label>
                              <div className="flex items-center gap-2">
                                <Progress value={analysisResult.colorAnalysis.contrast * 100} className="flex-1" />
                                <span className="text-sm">{Math.round(analysisResult.colorAnalysis.contrast * 100)}%</span>
                              </div>
                            </div>
                            
                            <div>
                              <label className="text-sm font-medium">Harmonia de Cores</label>
                              <Badge variant="outline" className="mt-1">
                                {analysisResult.colorAnalysis.colorHarmony === 'monochromatic' ? 'Monocromática' :
                                 analysisResult.colorAnalysis.colorHarmony === 'complementary' ? 'Complementar' :
                                 analysisResult.colorAnalysis.colorHarmony === 'triadic' ? 'Triádica' :
                                 analysisResult.colorAnalysis.colorHarmony === 'analogous' ? 'Análoga' :
                                 'Complementar Dividida'}
                              </Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="composition" className="mt-0 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Regra dos Terços */}
                      <Card>
                        <CardHeader>
                          <CardTitle>Regra dos Terços</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div>
                              <label className="text-sm font-medium">Score</label>
                              <div className="flex items-center gap-2">
                                <Progress value={analysisResult.compositionAnalysis.ruleOfThirds.score * 100} className="flex-1" />
                                <span className="text-sm">{Math.round(analysisResult.compositionAnalysis.ruleOfThirds.score * 100)}%</span>
                              </div>
                            </div>
                            
                            <div>
                              <label className="text-sm font-medium mb-2 block">Pontos de Intersecção</label>
                              <div className="grid grid-cols-2 gap-2">
                                {analysisResult.compositionAnalysis.ruleOfThirds.intersectionPoints.map((point, index) => (
                                  <div key={index} className="flex items-center gap-2 text-sm">
                                    <div className={`w-3 h-3 rounded-full ${
                                      point.occupied ? 'bg-green-500' : 'bg-gray-300'
                                    }`} />
                                    <span>Ponto {index + 1}</span>
                                    {point.occupied && <CheckCircle className="h-3 w-3 text-green-500" />}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      
                      {/* Simetria */}
                      <Card>
                        <CardHeader>
                          <CardTitle>Análise de Simetria</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div>
                              <label className="text-sm font-medium">Simetria Horizontal</label>
                              <div className="flex items-center gap-2">
                                <Progress value={analysisResult.compositionAnalysis.symmetry.horizontal * 100} className="flex-1" />
                                <span className="text-sm">{Math.round(analysisResult.compositionAnalysis.symmetry.horizontal * 100)}%</span>
                              </div>
                            </div>
                            
                            <div>
                              <label className="text-sm font-medium">Simetria Vertical</label>
                              <div className="flex items-center gap-2">
                                <Progress value={analysisResult.compositionAnalysis.symmetry.vertical * 100} className="flex-1" />
                                <span className="text-sm">{Math.round(analysisResult.compositionAnalysis.symmetry.vertical * 100)}%</span>
                              </div>
                            </div>
                            
                            <div>
                              <label className="text-sm font-medium">Simetria Radial</label>
                              <div className="flex items-center gap-2">
                                <Progress value={analysisResult.compositionAnalysis.symmetry.radial * 100} className="flex-1" />
                                <span className="text-sm">{Math.round(analysisResult.compositionAnalysis.symmetry.radial * 100)}%</span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      
                      {/* Linhas Guia */}
                      <Card>
                        <CardHeader>
                          <CardTitle>Linhas Guia</CardTitle>
                        </CardHeader>
                        <CardContent>
                          {analysisResult.compositionAnalysis.leadingLines.length > 0 ? (
                            <div className="space-y-3">
                              {analysisResult.compositionAnalysis.leadingLines.map((line, index) => (
                                <div key={index} className="p-3 border rounded-lg">
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="font-medium">Linha {index + 1}</span>
                                    <Badge variant="outline">
                                      {Math.round(line.strength * 100)}% força
                                    </Badge>
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    <p>Início: ({Math.round(line.start.x)}, {Math.round(line.start.y)})</p>
                                    <p>Fim: ({Math.round(line.end.x)}, {Math.round(line.end.y)})</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-muted-foreground text-center py-4">
                              Nenhuma linha guia detectada
                            </p>
                          )}
                        </CardContent>
                      </Card>
                      
                      {/* Enquadramento */}
                      <Card>
                        <CardHeader>
                          <CardTitle>Enquadramento</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div>
                              <label className="text-sm font-medium">Molduras Naturais</label>
                              <p className="text-lg">{analysisResult.compositionAnalysis.framing.naturalFrames}</p>
                            </div>
                            
                            <div>
                              <label className="text-sm font-medium mb-2 block">Distribuição nas Bordas</label>
                              <div className="grid grid-cols-2 gap-2">
                                <div className="text-sm">
                                  <span>Superior: </span>
                                  <span>{Math.round(analysisResult.compositionAnalysis.framing.edgeDistribution.top * 100)}%</span>
                                </div>
                                <div className="text-sm">
                                  <span>Direita: </span>
                                  <span>{Math.round(analysisResult.compositionAnalysis.framing.edgeDistribution.right * 100)}%</span>
                                </div>
                                <div className="text-sm">
                                  <span>Inferior: </span>
                                  <span>{Math.round(analysisResult.compositionAnalysis.framing.edgeDistribution.bottom * 100)}%</span>
                                </div>
                                <div className="text-sm">
                                  <span>Esquerda: </span>
                                  <span>{Math.round(analysisResult.compositionAnalysis.framing.edgeDistribution.left * 100)}%</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>
                </ScrollArea>
              </div>
            </Tabs>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <Brain className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Análise de Conteúdo IA</h3>
              <p className="text-muted-foreground mb-4">
                Clique em "Analisar" para iniciar a análise completa do seu vídeo
              </p>
              <Button 
                onClick={startAnalysis}
                disabled={!videoElement}
                className="flex items-center gap-2"
              >
                <Scan className="h-4 w-4" />
                Iniciar Análise
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ContentAnalyzer;