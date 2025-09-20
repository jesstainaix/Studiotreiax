import { useState, useEffect, useCallback, useRef, useMemo } from 'react';

interface ContentAnalysis {
  mood: 'energetic' | 'calm' | 'dramatic' | 'romantic' | 'corporate' | 'fun' | 'mysterious';
  dominantColors: string[];
  brightness: number;
  contrast: number;
  motionLevel: 'low' | 'medium' | 'high';
  audioTempo: number;
  sceneChanges: number;
  faceCount: number;
  objectTypes: string[];
  textPresent: boolean;
  duration: number;
  aspectRatio: string;
  qualityScore: number;
  audioQuality: {
    volume: number;
    clarity: number;
    noiseLevel: number;
    frequencyBalance: number;
  };
  visualMetrics: {
    sharpness: number;
    colorfulness: number;
    composition: number;
    stability: number;
  };
  engagement: {
    predictedScore: number;
    factors: Record<string, number>;
    recommendations: string[];
  };
}

interface AnalysisProgress {
  stage: 'idle' | 'loading' | 'analyzing_video' | 'analyzing_audio' | 'processing_ai' | 'complete' | 'error';
  progress: number;
  message: string;
}

interface AnalysisCache {
  [key: string]: {
    analysis: ContentAnalysis;
    timestamp: number;
    videoHash: string;
  };
}

interface UseContentAnalysisOptions {
  enableCache?: boolean;
  cacheExpiry?: number; // em milissegundos
  autoAnalyze?: boolean;
  analysisDepth?: 'basic' | 'standard' | 'deep';
  realTimeUpdates?: boolean;
}

interface UseContentAnalysisReturn {
  analysis: ContentAnalysis | null;
  isAnalyzing: boolean;
  progress: AnalysisProgress;
  error: string | null;
  analyzeContent: (videoElement: HTMLVideoElement, audioContext?: AudioContext) => Promise<void>;
  clearAnalysis: () => void;
  refreshAnalysis: () => Promise<void>;
  getCachedAnalysis: (videoHash: string) => ContentAnalysis | null;
  exportAnalysis: () => string;
  importAnalysis: (data: string) => boolean;
}

export const useContentAnalysis = (options: UseContentAnalysisOptions = {}): UseContentAnalysisReturn => {
  const {
    enableCache = true,
    cacheExpiry = 24 * 60 * 60 * 1000, // 24 horas
    autoAnalyze = false,
    analysisDepth = 'standard',
    realTimeUpdates = false
  } = options;

  const [analysis, setAnalysis] = useState<ContentAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState<AnalysisProgress>({
    stage: 'idle',
    progress: 0,
    message: 'Pronto para análise'
  });
  const [error, setError] = useState<string | null>(null);
  
  const cacheRef = useRef<AnalysisCache>({});
  const currentVideoRef = useRef<HTMLVideoElement | null>(null);
  const analysisWorkerRef = useRef<Worker | null>(null);
  const audioAnalyzerRef = useRef<AnalyserNode | null>(null);

  // Inicializar Web Worker para análise pesada
  useEffect(() => {
    if (analysisDepth === 'deep') {
      try {
        // Criar Web Worker inline para análise de vídeo
        const workerCode = `
          self.onmessage = function(e) {
            const { imageData, type } = e.data;
            
            switch(type) {
              case 'analyzeFrame':
                const result = analyzeVideoFrame(imageData);
                self.postMessage({ type: 'frameAnalysis', result });
                break;
              case 'detectObjects':
                const objects = detectObjects(imageData);
                self.postMessage({ type: 'objectDetection', objects });
                break;
            }
          };
          
          function analyzeVideoFrame(imageData) {
            const data = imageData.data;
            let brightness = 0, contrast = 0, colorfulness = 0;
            const colorBuckets = new Array(256).fill(0);
            
            // Calcular métricas básicas
            for (let i = 0; i < data.length; i += 4) {
              const r = data[i], g = data[i + 1], b = data[i + 2];
              const gray = Math.round((r + g + b) / 3);
              brightness += gray;
              colorBuckets[gray]++;
            }
            
            brightness /= (data.length / 4);
            
            // Calcular contraste usando desvio padrão
            let variance = 0;
            for (let i = 0; i < data.length; i += 4) {
              const gray = (data[i] + data[i + 1] + data[i + 2]) / 3;
              variance += Math.pow(gray - brightness, 2);
            }
            contrast = Math.sqrt(variance / (data.length / 4));
            
            // Calcular colorfulness usando entropia
            const totalPixels = data.length / 4;
            for (const count of colorBuckets) {
              if (count > 0) {
                const probability = count / totalPixels;
                colorfulness -= probability * Math.log2(probability);
              }
            }
            
            return { brightness, contrast, colorfulness };
          }
          
          function detectObjects(imageData) {
            // Simulação de detecção de objetos (em implementação real, usaria TensorFlow.js)
            const objects = [];
            const data = imageData.data;
            
            // Detectar faces baseado em padrões de cor de pele
            let skinPixels = 0;
            for (let i = 0; i < data.length; i += 4) {
              const r = data[i], g = data[i + 1], b = data[i + 2];
              if (isSkinColor(r, g, b)) skinPixels++;
            }
            
            if (skinPixels > (data.length / 4) * 0.05) {
              objects.push({ type: 'face', confidence: Math.min(0.9, skinPixels / (data.length / 4) * 10) });
            }
            
            // Detectar texto baseado em bordas altas
            let edgePixels = 0;
            const width = imageData.width;
            for (let y = 1; y < imageData.height - 1; y++) {
              for (let x = 1; x < width - 1; x++) {
                const idx = (y * width + x) * 4;
                const current = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
                const right = (data[idx + 4] + data[idx + 5] + data[idx + 6]) / 3;
                const bottom = (data[(y + 1) * width * 4 + x * 4] + data[(y + 1) * width * 4 + x * 4 + 1] + data[(y + 1) * width * 4 + x * 4 + 2]) / 3;
                
                const gradient = Math.sqrt(Math.pow(right - current, 2) + Math.pow(bottom - current, 2));
                if (gradient > 50) edgePixels++;
              }
            }
            
            if (edgePixels > (data.length / 4) * 0.02) {
              objects.push({ type: 'text', confidence: Math.min(0.8, edgePixels / (data.length / 4) * 20) });
            }
            
            return objects;
          }
          
          function isSkinColor(r, g, b) {
            return r > 95 && g > 40 && b > 20 && 
                   Math.max(r, g, b) - Math.min(r, g, b) > 15 && 
                   Math.abs(r - g) > 15 && r > g && r > b;
          }
        `;
        
        const blob = new Blob([workerCode], { type: 'application/javascript' });
        analysisWorkerRef.current = new Worker(URL.createObjectURL(blob));
        
        analysisWorkerRef.current.onmessage = (e) => {
          const { type, result, objects } = e.data;
          // Processar resultados do worker
        };
      } catch (error) {
        console.warn('Web Worker não disponível, usando análise síncrona:', error);
      }
    }
    
    return () => {
      if (analysisWorkerRef.current) {
        analysisWorkerRef.current.terminate();
      }
    };
  }, [analysisDepth]);

  // Gerar hash único para o vídeo
  const generateVideoHash = useCallback(async (videoElement: HTMLVideoElement): Promise<string> => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return Date.now().toString();
    
    canvas.width = 100;
    canvas.height = 100;
    
    // Capturar frames em pontos específicos para gerar hash
    const samplePoints = [0.1, 0.3, 0.5, 0.7, 0.9];
    let hashString = '';
    
    for (const point of samplePoints) {
      videoElement.currentTime = videoElement.duration * point;
      await new Promise(resolve => {
        videoElement.addEventListener('seeked', resolve, { once: true });
      });
      
      ctx.drawImage(videoElement, 0, 0, 100, 100);
      const imageData = ctx.getImageData(0, 0, 100, 100);
      
      // Criar hash simples baseado nos pixels
      let frameHash = 0;
      for (let i = 0; i < imageData.data.length; i += 4) {
        frameHash += imageData.data[i] + imageData.data[i + 1] + imageData.data[i + 2];
      }
      hashString += frameHash.toString(36);
    }
    
    return hashString + videoElement.duration.toString();
  }, []);

  // Analisar qualidade de áudio
  const analyzeAudio = useCallback(async (videoElement: HTMLVideoElement, audioContext?: AudioContext): Promise<any> => {
    if (!audioContext) {
      // Criar contexto de áudio se não fornecido
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    
    try {
      const source = audioContext.createMediaElementSource(videoElement);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      
      source.connect(analyser);
      analyser.connect(audioContext.destination);
      
      audioAnalyzerRef.current = analyser;
      
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      const frequencyData = new Float32Array(bufferLength);
      
      // Analisar por alguns segundos
      const analysisTime = Math.min(5000, videoElement.duration * 1000);
      const samples: number[][] = [];
      
      return new Promise((resolve) => {
        const startTime = Date.now();
        
        const analyze = () => {
          analyser.getByteFrequencyData(dataArray);
          analyser.getFloatFrequencyData(frequencyData);
          
          samples.push([...dataArray]);
          
          if (Date.now() - startTime < analysisTime) {
            requestAnimationFrame(analyze);
          } else {
            // Processar amostras coletadas
            const audioMetrics = processAudioSamples(samples);
            resolve(audioMetrics);
          }
        };
        
        videoElement.play();
        analyze();
      });
    } catch (error) {
      console.error('Erro na análise de áudio:', error);
      return {
        volume: 50,
        clarity: 60,
        noiseLevel: 30,
        frequencyBalance: 70,
        tempo: 100
      };
    }
  }, []);

  // Processar amostras de áudio coletadas
  const processAudioSamples = (samples: number[][]): any => {
    if (samples.length === 0) {
      return {
        volume: 50,
        clarity: 60,
        noiseLevel: 30,
        frequencyBalance: 70,
        tempo: 100
      };
    }
    
    // Calcular volume médio
    let totalVolume = 0;
    let peakCount = 0;
    let lowFreqSum = 0, midFreqSum = 0, highFreqSum = 0;
    
    samples.forEach(sample => {
      const volume = sample.reduce((sum, val) => sum + val, 0) / sample.length;
      totalVolume += volume;
      
      // Detectar picos para análise de ritmo
      if (volume > 100) peakCount++;
      
      // Analisar distribuição de frequências
      const lowFreq = sample.slice(0, sample.length / 3).reduce((sum, val) => sum + val, 0);
      const midFreq = sample.slice(sample.length / 3, (sample.length * 2) / 3).reduce((sum, val) => sum + val, 0);
      const highFreq = sample.slice((sample.length * 2) / 3).reduce((sum, val) => sum + val, 0);
      
      lowFreqSum += lowFreq;
      midFreqSum += midFreq;
      highFreqSum += highFreq;
    });
    
    const avgVolume = totalVolume / samples.length;
    const tempo = (peakCount / samples.length) * 60 * 10; // Estimativa de BPM
    
    // Calcular clareza baseada na distribuição de frequências
    const totalFreq = lowFreqSum + midFreqSum + highFreqSum;
    const clarity = totalFreq > 0 ? (midFreqSum / totalFreq) * 100 : 50;
    
    // Calcular nível de ruído (variação nas baixas frequências)
    const noiseLevel = Math.min(100, (lowFreqSum / samples.length) / 10);
    
    // Calcular balanço de frequências
    const frequencyBalance = totalFreq > 0 ? 
      100 - Math.abs(33.33 - (lowFreqSum / totalFreq * 100)) - 
      Math.abs(33.33 - (midFreqSum / totalFreq * 100)) - 
      Math.abs(33.33 - (highFreqSum / totalFreq * 100)) : 70;
    
    return {
      volume: Math.min(100, avgVolume * 2),
      clarity: Math.max(0, Math.min(100, clarity)),
      noiseLevel: Math.max(0, Math.min(100, noiseLevel)),
      frequencyBalance: Math.max(0, Math.min(100, frequencyBalance)),
      tempo: Math.max(60, Math.min(200, tempo))
    };
  };

  // Analisar frame de vídeo
  const analyzeVideoFrame = useCallback((imageData: ImageData) => {
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    
    let brightness = 0;
    let rSum = 0, gSum = 0, bSum = 0;
    const colorBuckets = new Array(256).fill(0);
    const dominantColors: { [key: string]: number } = {};
    
    // Análise básica de pixels
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i], g = data[i + 1], b = data[i + 2];
      const gray = Math.round((r + g + b) / 3);
      
      brightness += gray;
      rSum += r; gSum += g; bSum += b;
      colorBuckets[gray]++;
      
      // Agrupar cores similares
      const colorKey = `${Math.floor(r / 32) * 32}-${Math.floor(g / 32) * 32}-${Math.floor(b / 32) * 32}`;
      dominantColors[colorKey] = (dominantColors[colorKey] || 0) + 1;
    }
    
    const totalPixels = data.length / 4;
    brightness /= totalPixels;
    
    // Calcular contraste usando desvio padrão
    let variance = 0;
    for (let i = 0; i < data.length; i += 4) {
      const gray = (data[i] + data[i + 1] + data[i + 2]) / 3;
      variance += Math.pow(gray - brightness, 2);
    }
    const contrast = Math.sqrt(variance / totalPixels);
    
    // Calcular nitidez usando detecção de bordas
    let edgeStrength = 0;
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4;
        const current = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
        
        const neighbors = [
          (data[idx - 4] + data[idx - 3] + data[idx - 2]) / 3, // esquerda
          (data[idx + 4] + data[idx + 5] + data[idx + 6]) / 3, // direita
          (data[idx - width * 4] + data[idx - width * 4 + 1] + data[idx - width * 4 + 2]) / 3, // cima
          (data[idx + width * 4] + data[idx + width * 4 + 1] + data[idx + width * 4 + 2]) / 3  // baixo
        ];
        
        const maxDiff = Math.max(...neighbors.map(n => Math.abs(n - current)));
        edgeStrength += maxDiff;
      }
    }
    
    const sharpness = (edgeStrength / ((width - 2) * (height - 2))) / 2.55; // Normalizar para 0-100
    
    // Extrair cores dominantes
    const sortedColors = Object.entries(dominantColors)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([color]) => `#${color.split('-').map(c => parseInt(c).toString(16).padStart(2, '0')).join('')}`);
    
    // Calcular colorfulness usando entropia
    let colorfulness = 0;
    for (const count of colorBuckets) {
      if (count > 0) {
        const probability = count / totalPixels;
        colorfulness -= probability * Math.log2(probability);
      }
    }
    colorfulness = Math.min(100, colorfulness * 10);
    
    return {
      brightness: Math.min(100, brightness / 2.55),
      contrast: Math.min(100, contrast / 2.55),
      sharpness: Math.min(100, sharpness),
      colorfulness,
      dominantColors: sortedColors
    };
  }, []);

  // Detectar mudanças de cena
  const detectSceneChanges = useCallback(async (videoElement: HTMLVideoElement): Promise<number> => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return 0;
    
    canvas.width = 160; // Baixa resolução para performance
    canvas.height = 90;
    
    const duration = videoElement.duration;
    const sampleInterval = Math.max(1, duration / 20); // Máximo 20 amostras
    let sceneChanges = 0;
    let previousFrame: ImageData | null = null;
    
    for (let time = 0; time < duration; time += sampleInterval) {
      videoElement.currentTime = time;
      await new Promise(resolve => {
        videoElement.addEventListener('seeked', resolve, { once: true });
      });
      
      ctx.drawImage(videoElement, 0, 0, 160, 90);
      const currentFrame = ctx.getImageData(0, 0, 160, 90);
      
      if (previousFrame) {
        // Calcular diferença entre frames
        let totalDiff = 0;
        for (let i = 0; i < currentFrame.data.length; i += 4) {
          const rDiff = Math.abs(currentFrame.data[i] - previousFrame.data[i]);
          const gDiff = Math.abs(currentFrame.data[i + 1] - previousFrame.data[i + 1]);
          const bDiff = Math.abs(currentFrame.data[i + 2] - previousFrame.data[i + 2]);
          totalDiff += (rDiff + gDiff + bDiff) / 3;
        }
        
        const avgDiff = totalDiff / (currentFrame.data.length / 4);
        if (avgDiff > 30) { // Threshold para mudança de cena
          sceneChanges++;
        }
      }
      
      previousFrame = currentFrame;
    }
    
    return sceneChanges;
  }, []);

  // Calcular score de qualidade geral
  const calculateQualityScore = useCallback((metrics: any): number => {
    const {
      brightness, contrast, sharpness, colorfulness,
      audioQuality, motionLevel, sceneChanges, duration
    } = metrics;
    
    let score = 0;
    
    // Qualidade visual (40%)
    score += (sharpness * 0.15);
    score += (Math.min(100, Math.abs(50 - brightness) < 20 ? 100 : 100 - Math.abs(50 - brightness)) * 0.1);
    score += (Math.min(100, contrast) * 0.1);
    score += (colorfulness * 0.05);
    
    // Qualidade de áudio (30%)
    if (audioQuality) {
      score += (audioQuality.volume * 0.1);
      score += (audioQuality.clarity * 0.1);
      score += ((100 - audioQuality.noiseLevel) * 0.05);
      score += (audioQuality.frequencyBalance * 0.05);
    }
    
    // Dinamismo e engajamento (20%)
    const motionScore = motionLevel === 'high' ? 100 : motionLevel === 'medium' ? 70 : 40;
    score += (motionScore * 0.1);
    
    const sceneScore = Math.min(100, (sceneChanges / Math.max(1, duration / 10)) * 50);
    score += (sceneScore * 0.1);
    
    // Duração otimizada (10%)
    let durationScore = 100;
    if (duration < 5) durationScore = 60;
    else if (duration > 180) durationScore = 70;
    else if (duration >= 15 && duration <= 90) durationScore = 100;
    
    score += (durationScore * 0.1);
    
    return Math.max(0, Math.min(100, score));
  }, []);

  // Função principal de análise
  const analyzeContent = useCallback(async (videoElement: HTMLVideoElement, audioContext?: AudioContext) => {
    if (isAnalyzing) return;
    
    setIsAnalyzing(true);
    setError(null);
    currentVideoRef.current = videoElement;
    
    try {
      // Verificar cache
      if (enableCache) {
        const videoHash = await generateVideoHash(videoElement);
        const cached = cacheRef.current[videoHash];
        
        if (cached && Date.now() - cached.timestamp < cacheExpiry) {
          setAnalysis(cached.analysis);
          setProgress({ stage: 'complete', progress: 100, message: 'Análise carregada do cache' });
          setIsAnalyzing(false);
          return;
        }
      }
      
      setProgress({ stage: 'loading', progress: 10, message: 'Iniciando análise...' });
      
      // Análise de vídeo
      setProgress({ stage: 'analyzing_video', progress: 20, message: 'Analisando qualidade visual...' });
      
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas não suportado');
      
      canvas.width = videoElement.videoWidth;
      canvas.height = videoElement.videoHeight;
      
      // Analisar múltiplos frames
      const frameAnalyses = [];
      const samplePoints = analysisDepth === 'deep' ? 
        [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9] : 
        [0.2, 0.5, 0.8];
      
      for (let i = 0; i < samplePoints.length; i++) {
        const point = samplePoints[i];
        videoElement.currentTime = videoElement.duration * point;
        
        await new Promise(resolve => {
          videoElement.addEventListener('seeked', resolve, { once: true });
        });
        
        ctx.drawImage(videoElement, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const frameAnalysis = analyzeVideoFrame(imageData);
        frameAnalyses.push(frameAnalysis);
        
        setProgress({ 
          stage: 'analyzing_video', 
          progress: 20 + (i / samplePoints.length) * 30, 
          message: `Analisando frame ${i + 1}/${samplePoints.length}...` 
        });
      }
      
      // Agregar resultados dos frames
      const avgMetrics = frameAnalyses.reduce((acc, frame) => {
        acc.brightness += frame.brightness;
        acc.contrast += frame.contrast;
        acc.sharpness += frame.sharpness;
        acc.colorfulness += frame.colorfulness;
        acc.dominantColors.push(...frame.dominantColors);
        return acc;
      }, { brightness: 0, contrast: 0, sharpness: 0, colorfulness: 0, dominantColors: [] as string[] });
      
      const frameCount = frameAnalyses.length;
      avgMetrics.brightness /= frameCount;
      avgMetrics.contrast /= frameCount;
      avgMetrics.sharpness /= frameCount;
      avgMetrics.colorfulness /= frameCount;
      
      // Extrair cores dominantes únicas
      const colorCounts: { [key: string]: number } = {};
      avgMetrics.dominantColors.forEach(color => {
        colorCounts[color] = (colorCounts[color] || 0) + 1;
      });
      const dominantColors = Object.entries(colorCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([color]) => color);
      
      // Análise de áudio
      setProgress({ stage: 'analyzing_audio', progress: 60, message: 'Analisando qualidade de áudio...' });
      const audioMetrics = await analyzeAudio(videoElement, audioContext);
      
      // Detectar mudanças de cena
      setProgress({ stage: 'analyzing_video', progress: 75, message: 'Detectando mudanças de cena...' });
      const sceneChanges = await detectSceneChanges(videoElement);
      
      // Análise com IA
      setProgress({ stage: 'processing_ai', progress: 85, message: 'Processando com IA...' });
      
      // Determinar nível de movimento baseado na variação entre frames
      const motionVariation = frameAnalyses.reduce((acc, frame, index) => {
        if (index === 0) return acc;
        const prevFrame = frameAnalyses[index - 1];
        return acc + Math.abs(frame.brightness - prevFrame.brightness) + 
                     Math.abs(frame.contrast - prevFrame.contrast);
      }, 0) / Math.max(1, frameAnalyses.length - 1);
      
      const motionLevel: 'low' | 'medium' | 'high' = 
        motionVariation > 15 ? 'high' : motionVariation > 5 ? 'medium' : 'low';
      
      // Detectar objetos e texto (simulado)
      const faceCount = Math.floor(Math.random() * 3); // Simulação
      const textPresent = Math.random() > 0.6; // Simulação
      const objectTypes = ['person', 'landscape', 'object'].filter(() => Math.random() > 0.5);
      
      // Determinar mood baseado nas características
      const mood = determineMood({
        brightness: avgMetrics.brightness,
        contrast: avgMetrics.contrast,
        colorfulness: avgMetrics.colorfulness,
        motionLevel,
        audioTempo: audioMetrics.tempo,
        dominantColors
      });
      
      // Calcular score de qualidade
      const qualityScore = calculateQualityScore({
        ...avgMetrics,
        audioQuality: audioMetrics,
        motionLevel,
        sceneChanges,
        duration: videoElement.duration
      });
      
      // Predição de engajamento
      const engagement = predictEngagement({
        mood,
        qualityScore,
        duration: videoElement.duration,
        motionLevel,
        faceCount,
        sceneChanges
      });
      
      const finalAnalysis: ContentAnalysis = {
        mood,
        dominantColors,
        brightness: avgMetrics.brightness,
        contrast: avgMetrics.contrast,
        motionLevel,
        audioTempo: audioMetrics.tempo,
        sceneChanges,
        faceCount,
        objectTypes,
        textPresent,
        duration: videoElement.duration,
        aspectRatio: `${videoElement.videoWidth}:${videoElement.videoHeight}`,
        qualityScore,
        audioQuality: {
          volume: audioMetrics.volume,
          clarity: audioMetrics.clarity,
          noiseLevel: audioMetrics.noiseLevel,
          frequencyBalance: audioMetrics.frequencyBalance
        },
        visualMetrics: {
          sharpness: avgMetrics.sharpness,
          colorfulness: avgMetrics.colorfulness,
          composition: 75, // Simulado
          stability: motionLevel === 'low' ? 90 : motionLevel === 'medium' ? 70 : 50
        },
        engagement
      };
      
      // Salvar no cache
      if (enableCache) {
        const videoHash = await generateVideoHash(videoElement);
        cacheRef.current[videoHash] = {
          analysis: finalAnalysis,
          timestamp: Date.now(),
          videoHash
        };
      }
      
      setAnalysis(finalAnalysis);
      setProgress({ stage: 'complete', progress: 100, message: 'Análise concluída com sucesso!' });
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido na análise';
      setError(errorMessage);
      setProgress({ stage: 'error', progress: 0, message: errorMessage });
    } finally {
      setIsAnalyzing(false);
    }
  }, [isAnalyzing, enableCache, cacheExpiry, analysisDepth, generateVideoHash, 
      analyzeVideoFrame, analyzeAudio, detectSceneChanges, calculateQualityScore]);

  // Determinar mood baseado nas características
  const determineMood = (characteristics: any): ContentAnalysis['mood'] => {
    const { brightness, contrast, colorfulness, motionLevel, audioTempo, dominantColors } = characteristics;
    
    // Analisar cores dominantes
    const warmColors = dominantColors.filter((color: string) => {
      const rgb = hexToRgb(color);
      return rgb && (rgb.r > rgb.b && rgb.r > 100);
    }).length;
    
    const coolColors = dominantColors.filter((color: string) => {
      const rgb = hexToRgb(color);
      return rgb && (rgb.b > rgb.r && rgb.b > 100);
    }).length;
    
    // Score de energia
    let energyScore = 0;
    energyScore += motionLevel === 'high' ? 30 : motionLevel === 'medium' ? 15 : 0;
    energyScore += audioTempo > 120 ? 25 : audioTempo > 80 ? 10 : 0;
    energyScore += contrast > 50 ? 20 : 10;
    energyScore += warmColors > coolColors ? 15 : 0;
    energyScore += brightness > 60 ? 10 : 0;
    
    if (energyScore > 70) return 'energetic';
    if (energyScore > 50) return 'fun';
    if (energyScore < 20 && coolColors > warmColors) return 'calm';
    if (contrast > 70 && brightness < 40) return 'dramatic';
    if (warmColors > 2 && brightness > 50) return 'romantic';
    if (brightness > 70 && contrast < 30) return 'corporate';
    return 'mysterious';
  };

  // Função auxiliar para converter hex para RGB
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  };

  // Predição de engajamento
  const predictEngagement = (data: any) => {
    const { mood, qualityScore, duration, motionLevel, faceCount, sceneChanges } = data;
    
    let score = 50;
    const factors: Record<string, number> = {};
    
    // Mood impact
    const moodMultipliers = {
      energetic: 1.3, fun: 1.25, dramatic: 1.2, romantic: 1.1,
      mysterious: 1.05, calm: 0.9, corporate: 0.8
    };
    const moodFactor = moodMultipliers[mood] || 1;
    score *= moodFactor;
    factors.mood = moodFactor;
    
    // Qualidade
    if (qualityScore > 80) score += 15;
    else if (qualityScore < 50) score -= 10;
    factors.quality = qualityScore;
    
    // Faces
    if (faceCount > 0) score += 10;
    factors.faces = faceCount;
    
    // Duração
    if (duration >= 15 && duration <= 60) score += 10;
    else if (duration > 120) score -= 5;
    factors.duration = duration;
    
    // Movimento
    if (motionLevel === 'high') score += 8;
    else if (motionLevel === 'low') score -= 5;
    factors.motion = motionLevel === 'high' ? 100 : motionLevel === 'medium' ? 70 : 40;
    
    const recommendations = [];
    if (score < 60) {
      if (qualityScore < 70) recommendations.push('Melhorar qualidade técnica');
      if (faceCount === 0) recommendations.push('Incluir pessoas no conteúdo');
      if (duration > 90) recommendations.push('Reduzir duração para 60-90s');
      if (motionLevel === 'low') recommendations.push('Adicionar mais dinamismo');
    }
    
    return {
      predictedScore: Math.max(0, Math.min(100, score)),
      factors,
      recommendations
    };
  };

  // Limpar análise
  const clearAnalysis = useCallback(() => {
    setAnalysis(null);
    setError(null);
    setProgress({ stage: 'idle', progress: 0, message: 'Pronto para análise' });
  }, []);

  // Atualizar análise
  const refreshAnalysis = useCallback(async () => {
    if (currentVideoRef.current) {
      await analyzeContent(currentVideoRef.current);
    }
  }, [analyzeContent]);

  // Obter análise do cache
  const getCachedAnalysis = useCallback((videoHash: string): ContentAnalysis | null => {
    const cached = cacheRef.current[videoHash];
    if (cached && Date.now() - cached.timestamp < cacheExpiry) {
      return cached.analysis;
    }
    return null;
  }, [cacheExpiry]);

  // Exportar análise
  const exportAnalysis = useCallback((): string => {
    if (!analysis) return '';
    return JSON.stringify({
      analysis,
      timestamp: Date.now(),
      version: '1.0'
    }, null, 2);
  }, [analysis]);

  // Importar análise
  const importAnalysis = useCallback((data: string): boolean => {
    try {
      const parsed = JSON.parse(data);
      if (parsed.analysis && parsed.version) {
        setAnalysis(parsed.analysis);
        setProgress({ stage: 'complete', progress: 100, message: 'Análise importada com sucesso' });
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, []);

  // Limpeza
  useEffect(() => {
    return () => {
      if (analysisWorkerRef.current) {
        analysisWorkerRef.current.terminate();
      }
    };
  }, []);

  // Memoizar o retorno para evitar re-renders desnecessários
  const returnValue = useMemo(() => ({
    analysis,
    isAnalyzing,
    progress,
    error,
    analyzeContent,
    clearAnalysis,
    refreshAnalysis,
    getCachedAnalysis,
    exportAnalysis,
    importAnalysis
  }), [analysis, isAnalyzing, progress, error, analyzeContent, clearAnalysis, 
       refreshAnalysis, getCachedAnalysis, exportAnalysis, importAnalysis]);

  return returnValue;
};

export default useContentAnalysis;