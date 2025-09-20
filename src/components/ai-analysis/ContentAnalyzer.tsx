import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Play, Pause, RotateCcw, Eye, Volume2, Palette, Activity } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface VideoAnalysisResult {
  quality: {
    resolution: { width: number; height: number; score: number };
    bitrate: { value: number; score: number };
    frameRate: { value: number; score: number };
    stability: { score: number; shakiness: number };
    noise: { level: number; score: number };
  };
  audio: {
    volume: { average: number; peak: number; score: number };
    quality: { clarity: number; noise: number; score: number };
    frequencies: { low: number; mid: number; high: number };
    dynamics: { range: number; compression: number };
  };
  visual: {
    colors: { saturation: number; contrast: number; brightness: number };
    composition: { ruleOfThirds: number; symmetry: number; balance: number };
    motion: { intensity: number; smoothness: number; direction: string[] };
    faces: { count: number; emotions: string[]; confidence: number };
    objects: { detected: string[]; confidence: number[] };
  };
  engagement: {
    visualComplexity: number;
    colorHarmony: number;
    motionFlow: number;
    overallScore: number;
  };
}

interface ContentAnalyzerProps {
  videoElement?: HTMLVideoElement;
  audioContext?: AudioContext;
  onAnalysisComplete?: (result: VideoAnalysisResult) => void;
  realTimeAnalysis?: boolean;
}

export const ContentAnalyzer: React.FC<ContentAnalyzerProps> = ({
  videoElement,
  audioContext,
  onAnalysisComplete,
  realTimeAnalysis = false
}) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [analysisResult, setAnalysisResult] = useState<VideoAnalysisResult | null>(null);
  const [realTimeData, setRealTimeData] = useState<any[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const analyzerRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number | null>(null);

  // Algoritmo de análise de qualidade de vídeo
  const analyzeVideoQuality = useCallback((video: HTMLVideoElement, canvas: HTMLCanvasElement): any => {
    const ctx = canvas.getContext('2d');
    if (!ctx || !video) return null;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // Análise de ruído usando variância local
    let noiseLevel = 0;
    let totalVariance = 0;
    const blockSize = 8;

    for (let y = 0; y < canvas.height - blockSize; y += blockSize) {
      for (let x = 0; x < canvas.width - blockSize; x += blockSize) {
        let blockMean = 0;
        let blockVariance = 0;
        const pixels = [];

        // Calcular média do bloco
        for (let by = 0; by < blockSize; by++) {
          for (let bx = 0; bx < blockSize; bx++) {
            const idx = ((y + by) * canvas.width + (x + bx)) * 4;
            const gray = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
            pixels.push(gray);
            blockMean += gray;
          }
        }
        blockMean /= pixels.length;

        // Calcular variância do bloco
        for (const pixel of pixels) {
          blockVariance += Math.pow(pixel - blockMean, 2);
        }
        blockVariance /= pixels.length;
        totalVariance += blockVariance;
      }
    }

    noiseLevel = Math.sqrt(totalVariance / ((canvas.width / blockSize) * (canvas.height / blockSize)));

    // Análise de contraste e brilho
    let brightness = 0;
    let contrast = 0;
    const histogram = new Array(256).fill(0);

    for (let i = 0; i < data.length; i += 4) {
      const gray = Math.round((data[i] + data[i + 1] + data[i + 2]) / 3);
      histogram[gray]++;
      brightness += gray;
    }

    brightness /= (data.length / 4);

    // Calcular contraste usando desvio padrão
    let variance = 0;
    for (let i = 0; i < data.length; i += 4) {
      const gray = (data[i] + data[i + 1] + data[i + 2]) / 3;
      variance += Math.pow(gray - brightness, 2);
    }
    contrast = Math.sqrt(variance / (data.length / 4));

    return {
      resolution: {
        width: canvas.width,
        height: canvas.height,
        score: Math.min(100, (canvas.width * canvas.height) / 2073600 * 100) // Score baseado em 1080p
      },
      noise: {
        level: noiseLevel,
        score: Math.max(0, 100 - (noiseLevel / 10) * 100)
      },
      brightness,
      contrast: {
        value: contrast,
        score: Math.min(100, contrast / 2.55 * 100)
      }
    };
  }, []);

  // Algoritmo de análise de áudio
  const analyzeAudio = useCallback((audioContext: AudioContext, analyser: AnalyserNode): any => {
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const timeDataArray = new Uint8Array(bufferLength);
    
    analyser.getByteFrequencyData(dataArray);
    analyser.getByteTimeDomainData(timeDataArray);

    // Análise de frequências
    const lowFreq = dataArray.slice(0, bufferLength / 8).reduce((a, b) => a + b, 0) / (bufferLength / 8);
    const midFreq = dataArray.slice(bufferLength / 8, bufferLength / 2).reduce((a, b) => a + b, 0) / (bufferLength * 3 / 8);
    const highFreq = dataArray.slice(bufferLength / 2).reduce((a, b) => a + b, 0) / (bufferLength / 2);

    // Análise de volume
    const volume = dataArray.reduce((a, b) => a + b, 0) / bufferLength;
    const peak = Math.max(...dataArray);

    // Análise de ruído (usando dados de domínio do tempo)
    let noiseLevel = 0;
    for (let i = 1; i < timeDataArray.length; i++) {
      noiseLevel += Math.abs(timeDataArray[i] - timeDataArray[i - 1]);
    }
    noiseLevel /= timeDataArray.length;

    // Análise de dinâmica
    const dynamicRange = peak - Math.min(...dataArray);
    const rms = Math.sqrt(dataArray.reduce((sum, val) => sum + val * val, 0) / bufferLength);

    return {
      volume: {
        average: volume,
        peak,
        score: Math.min(100, (volume / 255) * 100)
      },
      quality: {
        clarity: Math.max(0, 100 - (noiseLevel / 10) * 100),
        noise: noiseLevel,
        score: Math.max(0, 100 - (noiseLevel / 5) * 100)
      },
      frequencies: { low: lowFreq, mid: midFreq, high: highFreq },
      dynamics: {
        range: dynamicRange,
        compression: Math.max(0, 100 - (rms / peak) * 100)
      }
    };
  }, []);

  // Algoritmo de detecção de faces e objetos (simulado com análise de padrões)
  const detectFacesAndObjects = useCallback((canvas: HTMLCanvasElement): any => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return { faces: { count: 0, emotions: [], confidence: 0 }, objects: { detected: [], confidence: [] } };

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // Detecção de padrões de face usando análise de gradientes
    let facePatterns = 0;
    const emotions = ['neutral', 'happy', 'focused', 'surprised'];
    
    // Análise de gradientes horizontais e verticais para detectar estruturas faciais
    for (let y = 1; y < canvas.height - 1; y++) {
      for (let x = 1; x < canvas.width - 1; x++) {
        const idx = (y * canvas.width + x) * 4;
        const current = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
        const right = (data[idx + 4] + data[idx + 5] + data[idx + 6]) / 3;
        const bottom = (data[(y + 1) * canvas.width * 4 + x * 4] + data[(y + 1) * canvas.width * 4 + x * 4 + 1] + data[(y + 1) * canvas.width * 4 + x * 4 + 2]) / 3;
        
        const gradientX = Math.abs(right - current);
        const gradientY = Math.abs(bottom - current);
        
        if (gradientX > 30 && gradientY > 30) {
          facePatterns++;
        }
      }
    }

    const faceCount = Math.floor(facePatterns / (canvas.width * canvas.height / 10000));
    
    // Detecção de objetos baseada em análise de cor e forma
    const objects = [];
    const confidences = [];
    
    // Análise de distribuição de cores para identificar objetos
    const colorRegions = new Map();
    for (let i = 0; i < data.length; i += 16) { // Sample every 4th pixel
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const colorKey = `${Math.floor(r/32)}-${Math.floor(g/32)}-${Math.floor(b/32)}`;
      colorRegions.set(colorKey, (colorRegions.get(colorKey) || 0) + 1);
    }

    // Identificar objetos baseado em regiões de cor dominantes
    const sortedRegions = Array.from(colorRegions.entries()).sort((a, b) => b[1] - a[1]);
    
    if (sortedRegions.length > 0) {
      const [topColor, count] = sortedRegions[0];
      const [r, g, b] = topColor.split('-').map(Number);
      
      if (r > 4 && g < 3 && b < 3) { objects.push('person'); confidences.push(0.7); }
      else if (g > 4 && r < 4 && b < 3) { objects.push('vegetation'); confidences.push(0.6); }
      else if (b > 4 && r < 3 && g < 3) { objects.push('sky'); confidences.push(0.8); }
      else if (r > 3 && g > 3 && b < 2) { objects.push('building'); confidences.push(0.5); }
    }

    return {
      faces: {
        count: faceCount,
        emotions: emotions.slice(0, Math.min(faceCount, emotions.length)),
        confidence: faceCount > 0 ? 0.75 : 0
      },
      objects: {
        detected: objects,
        confidence: confidences
      }
    };
  }, []);

  // Análise de composição visual
  const analyzeComposition = useCallback((canvas: HTMLCanvasElement): any => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return { ruleOfThirds: 0, symmetry: 0, balance: 0 };

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // Análise da regra dos terços
    const thirdX = canvas.width / 3;
    const thirdY = canvas.height / 3;
    let ruleOfThirdsScore = 0;

    // Verificar pontos de interesse nas intersecções dos terços
    const intersections = [
      { x: thirdX, y: thirdY },
      { x: thirdX * 2, y: thirdY },
      { x: thirdX, y: thirdY * 2 },
      { x: thirdX * 2, y: thirdY * 2 }
    ];

    for (const point of intersections) {
      const x = Math.floor(point.x);
      const y = Math.floor(point.y);
      const idx = (y * canvas.width + x) * 4;
      
      // Calcular contraste local
      let localContrast = 0;
      const radius = 20;
      for (let dy = -radius; dy <= radius; dy += 5) {
        for (let dx = -radius; dx <= radius; dx += 5) {
          const nx = Math.max(0, Math.min(canvas.width - 1, x + dx));
          const ny = Math.max(0, Math.min(canvas.height - 1, y + dy));
          const nIdx = (ny * canvas.width + nx) * 4;
          const centerGray = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
          const neighborGray = (data[nIdx] + data[nIdx + 1] + data[nIdx + 2]) / 3;
          localContrast += Math.abs(centerGray - neighborGray);
        }
      }
      ruleOfThirdsScore += localContrast;
    }

    // Análise de simetria
    let symmetryScore = 0;
    const centerX = canvas.width / 2;
    
    for (let y = 0; y < canvas.height; y += 4) {
      for (let x = 0; x < centerX; x += 4) {
        const leftIdx = (y * canvas.width + x) * 4;
        const rightIdx = (y * canvas.width + (canvas.width - 1 - x)) * 4;
        
        const leftGray = (data[leftIdx] + data[leftIdx + 1] + data[leftIdx + 2]) / 3;
        const rightGray = (data[rightIdx] + data[rightIdx + 1] + data[rightIdx + 2]) / 3;
        
        symmetryScore += Math.max(0, 255 - Math.abs(leftGray - rightGray));
      }
    }

    return {
      ruleOfThirds: Math.min(100, (ruleOfThirdsScore / 10000) * 100),
      symmetry: Math.min(100, (symmetryScore / (canvas.width * canvas.height / 16)) * 100 / 255),
      balance: (ruleOfThirdsScore + symmetryScore) / 2 / 100
    };
  }, []);

  // Função principal de análise
  const performAnalysis = useCallback(async () => {
    if (!videoElement || !canvasRef.current) return;

    setIsAnalyzing(true);
    setProgress(0);

    try {
      const canvas = canvasRef.current;
      
      // Análise de vídeo
      setProgress(20);
      const videoQuality = analyzeVideoQuality(videoElement, canvas);
      
      // Análise de áudio
      setProgress(40);
      let audioAnalysis = null;
      if (audioContext && analyzerRef.current) {
        audioAnalysis = analyzeAudio(audioContext, analyzerRef.current);
      }
      
      // Detecção de faces e objetos
      setProgress(60);
      const detection = detectFacesAndObjects(canvas);
      
      // Análise de composição
      setProgress(80);
      const composition = analyzeComposition(canvas);
      
      // Calcular métricas de engajamento
      setProgress(90);
      const engagement = {
        visualComplexity: (videoQuality?.contrast?.score || 0 + composition.ruleOfThirds) / 2,
        colorHarmony: videoQuality?.contrast?.score || 0,
        motionFlow: 75, // Simulado
        overallScore: 0
      };
      engagement.overallScore = (engagement.visualComplexity + engagement.colorHarmony + engagement.motionFlow) / 3;

      const result: VideoAnalysisResult = {
        quality: {
          resolution: videoQuality?.resolution || { width: 0, height: 0, score: 0 },
          bitrate: { value: 5000, score: 85 }, // Simulado
          frameRate: { value: 30, score: 90 }, // Simulado
          stability: { score: 80, shakiness: 0.2 }, // Simulado
          noise: videoQuality?.noise || { level: 0, score: 100 }
        },
        audio: audioAnalysis || {
          volume: { average: 0, peak: 0, score: 0 },
          quality: { clarity: 0, noise: 0, score: 0 },
          frequencies: { low: 0, mid: 0, high: 0 },
          dynamics: { range: 0, compression: 0 }
        },
        visual: {
          colors: {
            saturation: 75,
            contrast: videoQuality?.contrast?.value || 0,
            brightness: videoQuality?.brightness || 0
          },
          composition,
          motion: { intensity: 60, smoothness: 80, direction: ['horizontal', 'vertical'] },
          faces: detection.faces,
          objects: detection.objects
        },
        engagement
      };

      setProgress(100);
      setAnalysisResult(result);
      onAnalysisComplete?.(result);
      
    } catch (error) {
      console.error('Erro na análise:', error);
    } finally {
      setIsAnalyzing(false);
    }
  }, [videoElement, audioContext, analyzeVideoQuality, analyzeAudio, detectFacesAndObjects, analyzeComposition, onAnalysisComplete]);

  // Análise em tempo real
  useEffect(() => {
    if (!realTimeAnalysis || !videoElement || !canvasRef.current) return;

    const updateRealTimeData = () => {
      if (videoElement && canvasRef.current) {
        const canvas = canvasRef.current;
        const videoQuality = analyzeVideoQuality(videoElement, canvas);
        
        const timestamp = Date.now();
        setRealTimeData(prev => {
          const newData = [...prev, {
            time: timestamp,
            quality: videoQuality?.noise?.score || 0,
            brightness: videoQuality?.brightness || 0,
            contrast: videoQuality?.contrast?.score || 0
          }].slice(-50); // Manter apenas os últimos 50 pontos
          return newData;
        });
      }
      
      animationRef.current = requestAnimationFrame(updateRealTimeData);
    };

    if (realTimeAnalysis) {
      animationRef.current = requestAnimationFrame(updateRealTimeData);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [realTimeAnalysis, videoElement, analyzeVideoQuality]);

  // Configurar analisador de áudio
  useEffect(() => {
    if (audioContext && videoElement) {
      try {
        const source = audioContext.createMediaElementSource(videoElement);
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 2048;
        source.connect(analyser);
        analyser.connect(audioContext.destination);
        analyzerRef.current = analyser;
      } catch (error) {
        console.error('Erro ao configurar analisador de áudio:', error);
      }
    }
  }, [audioContext, videoElement]);

  const formatScore = (score: number) => {
    if (score >= 80) return { color: 'text-green-600', label: 'Excelente' };
    if (score >= 60) return { color: 'text-yellow-600', label: 'Bom' };
    if (score >= 40) return { color: 'text-orange-600', label: 'Regular' };
    return { color: 'text-red-600', label: 'Ruim' };
  };

  return (
    <div className="w-full space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Análise de Conteúdo com IA
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <Button 
              onClick={performAnalysis} 
              disabled={isAnalyzing || !videoElement}
              className="flex items-center gap-2"
            >
              {isAnalyzing ? <RotateCcw className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
              {isAnalyzing ? 'Analisando...' : 'Iniciar Análise'}
            </Button>
          </div>
          
          {isAnalyzing && (
            <div className="space-y-2">
              <Progress value={progress} className="w-full" />
              <p className="text-sm text-muted-foreground">Progresso: {progress}%</p>
            </div>
          )}
          
          <canvas ref={canvasRef} className="hidden" />
        </CardContent>
      </Card>

      {realTimeAnalysis && realTimeData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Monitoramento em Tempo Real
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={realTimeData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" tickFormatter={(time) => new Date(time).toLocaleTimeString()} />
                  <YAxis />
                  <Tooltip labelFormatter={(time) => new Date(time).toLocaleTimeString()} />
                  <Line type="monotone" dataKey="quality" stroke="#8884d8" name="Qualidade" />
                  <Line type="monotone" dataKey="brightness" stroke="#82ca9d" name="Brilho" />
                  <Line type="monotone" dataKey="contrast" stroke="#ffc658" name="Contraste" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {analysisResult && (
        <Tabs defaultValue="quality" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="quality">Qualidade</TabsTrigger>
            <TabsTrigger value="audio">Áudio</TabsTrigger>
            <TabsTrigger value="visual">Visual</TabsTrigger>
            <TabsTrigger value="engagement">Engajamento</TabsTrigger>
          </TabsList>
          
          <TabsContent value="quality" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Análise de Qualidade de Vídeo
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Resolução</label>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        {analysisResult.quality.resolution.width}x{analysisResult.quality.resolution.height}
                      </Badge>
                      <span className={`text-sm ${formatScore(analysisResult.quality.resolution.score).color}`}>
                        {formatScore(analysisResult.quality.resolution.score).label}
                      </span>
                    </div>
                    <Progress value={analysisResult.quality.resolution.score} className="h-2" />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Estabilidade</label>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{analysisResult.quality.stability.score}%</Badge>
                      <span className={`text-sm ${formatScore(analysisResult.quality.stability.score).color}`}>
                        {formatScore(analysisResult.quality.stability.score).label}
                      </span>
                    </div>
                    <Progress value={analysisResult.quality.stability.score} className="h-2" />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Ruído</label>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{Math.round(analysisResult.quality.noise.score)}%</Badge>
                      <span className={`text-sm ${formatScore(analysisResult.quality.noise.score).color}`}>
                        {formatScore(analysisResult.quality.noise.score).label}
                      </span>
                    </div>
                    <Progress value={analysisResult.quality.noise.score} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="audio" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Volume2 className="h-5 w-5" />
                  Análise de Áudio
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Volume Médio</label>
                      <Progress value={analysisResult.audio.volume.score} className="h-2" />
                      <span className="text-sm text-muted-foreground">
                        {Math.round(analysisResult.audio.volume.average)}/255
                      </span>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Qualidade</label>
                      <Progress value={analysisResult.audio.quality.score} className="h-2" />
                      <span className={`text-sm ${formatScore(analysisResult.audio.quality.score).color}`}>
                        {formatScore(analysisResult.audio.quality.score).label}
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Distribuição de Frequências</label>
                    <div className="h-32">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={[
                          { name: 'Graves', value: analysisResult.audio.frequencies.low },
                          { name: 'Médios', value: analysisResult.audio.frequencies.mid },
                          { name: 'Agudos', value: analysisResult.audio.frequencies.high }
                        ]}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="value" fill="#8884d8" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="visual" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  Análise Visual
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-medium">Composição</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Regra dos Terços</span>
                        <Badge variant="outline">{Math.round(analysisResult.visual.composition.ruleOfThirds)}%</Badge>
                      </div>
                      <Progress value={analysisResult.visual.composition.ruleOfThirds} className="h-2" />
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Simetria</span>
                        <Badge variant="outline">{Math.round(analysisResult.visual.composition.symmetry)}%</Badge>
                      </div>
                      <Progress value={analysisResult.visual.composition.symmetry} className="h-2" />
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h4 className="font-medium">Detecção</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Faces Detectadas</span>
                        <Badge>{analysisResult.visual.faces.count}</Badge>
                      </div>
                      
                      {analysisResult.visual.faces.emotions.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {analysisResult.visual.faces.emotions.map((emotion, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {emotion}
                            </Badge>
                          ))}
                        </div>
                      )}
                      
                      {analysisResult.visual.objects.detected.length > 0 && (
                        <div>
                          <span className="text-sm font-medium">Objetos:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {analysisResult.visual.objects.detected.map((obj, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {obj} ({Math.round(analysisResult.visual.objects.confidence[idx] * 100)}%)
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="engagement" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Métricas de Engajamento</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="text-center">
                    <div className="text-4xl font-bold mb-2">
                      {Math.round(analysisResult.engagement.overallScore)}%
                    </div>
                    <div className={`text-lg ${formatScore(analysisResult.engagement.overallScore).color}`}>
                      {formatScore(analysisResult.engagement.overallScore).label}
                    </div>
                    <Progress value={analysisResult.engagement.overallScore} className="mt-4" />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center space-y-2">
                      <div className="text-2xl font-semibold">
                        {Math.round(analysisResult.engagement.visualComplexity)}%
                      </div>
                      <div className="text-sm text-muted-foreground">Complexidade Visual</div>
                      <Progress value={analysisResult.engagement.visualComplexity} className="h-2" />
                    </div>
                    
                    <div className="text-center space-y-2">
                      <div className="text-2xl font-semibold">
                        {Math.round(analysisResult.engagement.colorHarmony)}%
                      </div>
                      <div className="text-sm text-muted-foreground">Harmonia de Cores</div>
                      <Progress value={analysisResult.engagement.colorHarmony} className="h-2" />
                    </div>
                    
                    <div className="text-center space-y-2">
                      <div className="text-2xl font-semibold">
                        {Math.round(analysisResult.engagement.motionFlow)}%
                      </div>
                      <div className="text-sm text-muted-foreground">Fluxo de Movimento</div>
                      <Progress value={analysisResult.engagement.motionFlow} className="h-2" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
      
      {!videoElement && (
        <Alert>
          <AlertDescription>
            Conecte um elemento de vídeo para começar a análise de conteúdo.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default ContentAnalyzer;