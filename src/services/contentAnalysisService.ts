import { ContentAnalysis } from '../hooks/useContentAnalysis';

// Interfaces para análise detalhada
interface VideoMetrics {
  resolution: { width: number; height: number };
  bitrate: number;
  fps: number;
  codec: string;
  duration: number;
  fileSize: number;
}

interface AudioMetrics {
  sampleRate: number;
  channels: number;
  bitrate: number;
  codec: string;
  duration: number;
}

interface FrameAnalysis {
  timestamp: number;
  brightness: number;
  contrast: number;
  saturation: number;
  sharpness: number;
  noiseLevel: number;
  motionVector: { x: number; y: number; magnitude: number };
  dominantColors: string[];
  histogram: number[];
  edges: number;
  faces: Array<{ x: number; y: number; width: number; height: number; confidence: number }>;
  objects: Array<{ type: string; confidence: number; bbox: { x: number; y: number; width: number; height: number } }>;
}

interface AudioAnalysis {
  timestamp: number;
  volume: number;
  frequency: Float32Array;
  spectralCentroid: number;
  zeroCrossingRate: number;
  mfcc: number[];
  tempo: number;
  pitch: number;
  harmonicity: number;
}

interface QualityIssue {
  type: 'blur' | 'noise' | 'exposure' | 'audio_distortion' | 'compression' | 'stability' | 'color';
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp?: number;
  description: string;
  suggestion: string;
  confidence: number;
}

interface OptimizationSuggestion {
  type: 'color_correction' | 'stabilization' | 'noise_reduction' | 'audio_enhancement' | 'crop' | 'speed_adjustment';
  priority: 'low' | 'medium' | 'high';
  description: string;
  parameters: Record<string, any>;
  expectedImprovement: number;
}

class ContentAnalysisService {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private audioContext: AudioContext | null = null;
  private analysisCache: Map<string, any> = new Map();
  private workers: Worker[] = [];
  private maxWorkers = navigator.hardwareConcurrency || 4;

  constructor() {
    this.canvas = document.createElement('canvas');
    const ctx = this.canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D context não suportado');
    this.ctx = ctx;
    
    // Inicializar Web Workers para processamento paralelo
    this.initializeWorkers();
  }

  private initializeWorkers(): void {
    const workerCode = `
      // Worker para análise de imagem avançada
      class ImageAnalyzer {
        static analyzeFrame(imageData) {
          const { data, width, height } = imageData;
          const result = {
            brightness: 0,
            contrast: 0,
            saturation: 0,
            sharpness: 0,
            noiseLevel: 0,
            dominantColors: [],
            histogram: new Array(256).fill(0),
            edges: 0
          };
          
          // Análise pixel por pixel
          let rSum = 0, gSum = 0, bSum = 0;
          let rVar = 0, gVar = 0, bVar = 0;
          const colorMap = new Map();
          
          for (let i = 0; i < data.length; i += 4) {
            const r = data[i], g = data[i + 1], b = data[i + 2];
            const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
            
            rSum += r; gSum += g; bSum += b;
            result.histogram[gray]++;
            
            // Agrupar cores para dominância
            const colorKey = \`\${Math.floor(r/32)*32}-\${Math.floor(g/32)*32}-\${Math.floor(b/32)*32}\`;
            colorMap.set(colorKey, (colorMap.get(colorKey) || 0) + 1);
          }
          
          const totalPixels = data.length / 4;
          const avgR = rSum / totalPixels;
          const avgG = gSum / totalPixels;
          const avgB = bSum / totalPixels;
          
          result.brightness = (avgR + avgG + avgB) / 3 / 2.55;
          
          // Calcular variância para contraste
          for (let i = 0; i < data.length; i += 4) {
            const r = data[i], g = data[i + 1], b = data[i + 2];
            rVar += Math.pow(r - avgR, 2);
            gVar += Math.pow(g - avgG, 2);
            bVar += Math.pow(b - avgB, 2);
          }
          
          result.contrast = Math.sqrt((rVar + gVar + bVar) / (3 * totalPixels)) / 2.55;
          
          // Calcular saturação média
          let satSum = 0;
          for (let i = 0; i < data.length; i += 4) {
            const r = data[i] / 255, g = data[i + 1] / 255, b = data[i + 2] / 255;
            const max = Math.max(r, g, b);
            const min = Math.min(r, g, b);
            const sat = max === 0 ? 0 : (max - min) / max;
            satSum += sat;
          }
          result.saturation = (satSum / totalPixels) * 100;
          
          // Detectar bordas para nitidez
          let edgeSum = 0;
          for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
              const idx = (y * width + x) * 4;
              const current = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
              
              // Operador Sobel
              const gx = (
                -1 * this.getPixelGray(data, x-1, y-1, width) + 1 * this.getPixelGray(data, x+1, y-1, width) +
                -2 * this.getPixelGray(data, x-1, y, width) + 2 * this.getPixelGray(data, x+1, y, width) +
                -1 * this.getPixelGray(data, x-1, y+1, width) + 1 * this.getPixelGray(data, x+1, y+1, width)
              );
              
              const gy = (
                -1 * this.getPixelGray(data, x-1, y-1, width) - 2 * this.getPixelGray(data, x, y-1, width) - 1 * this.getPixelGray(data, x+1, y-1, width) +
                1 * this.getPixelGray(data, x-1, y+1, width) + 2 * this.getPixelGray(data, x, y+1, width) + 1 * this.getPixelGray(data, x+1, y+1, width)
              );
              
              const magnitude = Math.sqrt(gx * gx + gy * gy);
              edgeSum += magnitude;
              if (magnitude > 50) result.edges++;
            }
          }
          
          result.sharpness = (edgeSum / ((width - 2) * (height - 2))) / 10;
          
          // Detectar ruído usando variação local
          let noiseSum = 0;
          for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
              const idx = (y * width + x) * 4;
              const current = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
              
              let neighborSum = 0;
              let count = 0;
              for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                  if (dx === 0 && dy === 0) continue;
                  const nIdx = ((y + dy) * width + (x + dx)) * 4;
                  neighborSum += (data[nIdx] + data[nIdx + 1] + data[nIdx + 2]) / 3;
                  count++;
                }
              }
              
              const avgNeighbor = neighborSum / count;
              noiseSum += Math.abs(current - avgNeighbor);
            }
          }
          
          result.noiseLevel = (noiseSum / ((width - 2) * (height - 2))) / 10;
          
          // Extrair cores dominantes
          const sortedColors = Array.from(colorMap.entries())
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5)
            .map(([color]) => \`#\${color.split('-').map(c => parseInt(c).toString(16).padStart(2, '0')).join('')}\`);
          
          result.dominantColors = sortedColors;
          
          return result;
        }
        
        static getPixelGray(data, x, y, width) {
          const idx = (y * width + x) * 4;
          return (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
        }
        
        static detectFaces(imageData) {
          // Algoritmo simplificado de detecção de faces baseado em cor de pele
          const { data, width, height } = imageData;
          const faces = [];
          const skinRegions = [];
          
          // Detectar regiões de cor de pele
          for (let y = 0; y < height; y += 4) {
            for (let x = 0; x < width; x += 4) {
              const idx = (y * width + x) * 4;
              const r = data[idx], g = data[idx + 1], b = data[idx + 2];
              
              if (this.isSkinColor(r, g, b)) {
                skinRegions.push({ x, y });
              }
            }
          }
          
          // Agrupar regiões próximas
          const clusters = this.clusterRegions(skinRegions, 20);
          
          // Converter clusters em faces
          clusters.forEach(cluster => {
            if (cluster.length > 10) { // Mínimo de pixels para ser considerado face
              const minX = Math.min(...cluster.map(p => p.x));
              const maxX = Math.max(...cluster.map(p => p.x));
              const minY = Math.min(...cluster.map(p => p.y));
              const maxY = Math.max(...cluster.map(p => p.y));
              
              const width = maxX - minX;
              const height = maxY - minY;
              
              // Verificar proporções típicas de face
              const aspectRatio = width / height;
              if (aspectRatio > 0.6 && aspectRatio < 1.4 && width > 20 && height > 20) {
                faces.push({
                  x: minX,
                  y: minY,
                  width,
                  height,
                  confidence: Math.min(0.9, cluster.length / 100)
                });
              }
            }
          });
          
          return faces;
        }
        
        static isSkinColor(r, g, b) {
          return r > 95 && g > 40 && b > 20 &&
                 Math.max(r, g, b) - Math.min(r, g, b) > 15 &&
                 Math.abs(r - g) > 15 && r > g && r > b;
        }
        
        static clusterRegions(regions, threshold) {
          const clusters = [];
          const visited = new Set();
          
          regions.forEach((region, i) => {
            if (visited.has(i)) return;
            
            const cluster = [region];
            visited.add(i);
            
            regions.forEach((other, j) => {
              if (i !== j && !visited.has(j)) {
                const distance = Math.sqrt(
                  Math.pow(region.x - other.x, 2) + Math.pow(region.y - other.y, 2)
                );
                
                if (distance < threshold) {
                  cluster.push(other);
                  visited.add(j);
                }
              }
            });
            
            clusters.push(cluster);
          });
          
          return clusters;
        }
      }
      
      self.onmessage = function(e) {
        const { type, imageData, options } = e.data;
        
        try {
          switch (type) {
            case 'analyzeFrame':
              const analysis = ImageAnalyzer.analyzeFrame(imageData);
              self.postMessage({ type: 'frameAnalysis', result: analysis });
              break;
              
            case 'detectFaces':
              const faces = ImageAnalyzer.detectFaces(imageData);
              self.postMessage({ type: 'faceDetection', result: faces });
              break;
              
            default:
              self.postMessage({ type: 'error', error: 'Tipo de análise desconhecido' });
          }
        } catch (error) {
          self.postMessage({ type: 'error', error: error.message });
        }
      };
    `;

    try {
      for (let i = 0; i < Math.min(this.maxWorkers, 2); i++) {
        const blob = new Blob([workerCode], { type: 'application/javascript' });
        const worker = new Worker(URL.createObjectURL(blob));
        this.workers.push(worker);
      }
    } catch (error) {
      console.warn('Web Workers não disponíveis, usando processamento síncrono:', error);
    }
  }

  // Análise completa de vídeo
  async analyzeVideo(videoElement: HTMLVideoElement, options: {
    sampleRate?: number;
    deepAnalysis?: boolean;
    includeAudio?: boolean;
    detectObjects?: boolean;
  } = {}): Promise<{
    frames: FrameAnalysis[];
    audio?: AudioAnalysis[];
    metrics: VideoMetrics;
    qualityIssues: QualityIssue[];
    suggestions: OptimizationSuggestion[];
    overallScore: number;
  }> {
    const {
      sampleRate = 1, // Analisar 1 frame por segundo
      deepAnalysis = false,
      includeAudio = true,
      detectObjects = false
    } = options;

    const duration = videoElement.duration;
    const frameCount = Math.ceil(duration * sampleRate);
    const frames: FrameAnalysis[] = [];
    let audio: AudioAnalysis[] = [];

    // Configurar canvas
    this.canvas.width = Math.min(videoElement.videoWidth, 640); // Limitar para performance
    this.canvas.height = Math.min(videoElement.videoHeight, 360);
    const scaleX = this.canvas.width / videoElement.videoWidth;
    const scaleY = this.canvas.height / videoElement.videoHeight;

    // Obter métricas básicas do vídeo
    const metrics: VideoMetrics = {
      resolution: { width: videoElement.videoWidth, height: videoElement.videoHeight },
      bitrate: 0, // Não disponível via HTML5 Video API
      fps: 30, // Estimativa padrão
      codec: 'unknown',
      duration,
      fileSize: 0
    };

    // Analisar frames
    for (let i = 0; i < frameCount; i++) {
      const timestamp = (i / sampleRate);
      if (timestamp >= duration) break;

      videoElement.currentTime = timestamp;
      await this.waitForSeek(videoElement);

      this.ctx.drawImage(videoElement, 0, 0, this.canvas.width, this.canvas.height);
      const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);

      const frameAnalysis = await this.analyzeFrame(imageData, timestamp, {
        detectFaces: deepAnalysis,
        detectObjects: detectObjects && deepAnalysis,
        calculateMotion: i > 0 ? frames[i - 1] : undefined
      });

      frames.push(frameAnalysis);
    }

    // Análise de áudio
    if (includeAudio) {
      try {
        audio = await this.analyzeAudio(videoElement, { sampleRate });
      } catch (error) {
        console.warn('Erro na análise de áudio:', error);
      }
    }

    // Detectar problemas de qualidade
    const qualityIssues = this.detectQualityIssues(frames, audio);

    // Gerar sugestões de otimização
    const suggestions = this.generateOptimizationSuggestions(frames, audio, qualityIssues);

    // Calcular score geral
    const overallScore = this.calculateOverallScore(frames, audio, qualityIssues);

    return {
      frames,
      audio: audio.length > 0 ? audio : undefined,
      metrics,
      qualityIssues,
      suggestions,
      overallScore
    };
  }

  // Análise detalhada de frame individual
  private async analyzeFrame(
    imageData: ImageData,
    timestamp: number,
    options: {
      detectFaces?: boolean;
      detectObjects?: boolean;
      calculateMotion?: FrameAnalysis;
    } = {}
  ): Promise<FrameAnalysis> {
    const { detectFaces = false, detectObjects = false, calculateMotion } = options;

    // Usar Web Worker se disponível
    if (this.workers.length > 0) {
      return new Promise((resolve, reject) => {
        const worker = this.workers[0];
        const timeout = setTimeout(() => {
          reject(new Error('Timeout na análise do frame'));
        }, 5000);

        worker.onmessage = (e) => {
          clearTimeout(timeout);
          if (e.data.type === 'error') {
            reject(new Error(e.data.error));
          } else {
            const result = e.data.result;
            resolve({
              timestamp,
              brightness: result.brightness,
              contrast: result.contrast,
              saturation: result.saturation,
              sharpness: result.sharpness,
              noiseLevel: result.noiseLevel,
              motionVector: calculateMotion ? this.calculateMotionVector(imageData, calculateMotion) : { x: 0, y: 0, magnitude: 0 },
              dominantColors: result.dominantColors,
              histogram: result.histogram,
              edges: result.edges,
              faces: detectFaces ? result.faces || [] : [],
              objects: detectObjects ? [] : [] // Implementação completa requer TensorFlow.js
            });
          }
        };

        worker.postMessage({ type: 'analyzeFrame', imageData });
      });
    }

    // Fallback para análise síncrona
    return this.analyzeFrameSync(imageData, timestamp, options);
  }

  // Análise síncrona de frame (fallback)
  private analyzeFrameSync(
    imageData: ImageData,
    timestamp: number,
    options: {
      detectFaces?: boolean;
      detectObjects?: boolean;
      calculateMotion?: FrameAnalysis;
    } = {}
  ): FrameAnalysis {
    const { calculateMotion } = options;
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    const totalPixels = width * height;

    let brightness = 0, rSum = 0, gSum = 0, bSum = 0;
    let rVar = 0, gVar = 0, bVar = 0;
    const histogram = new Array(256).fill(0);
    const colorMap = new Map<string, number>();

    // Primeira passada: estatísticas básicas
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i], g = data[i + 1], b = data[i + 2];
      const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
      
      brightness += gray;
      rSum += r; gSum += g; bSum += b;
      histogram[gray]++;
      
      const colorKey = `${Math.floor(r/32)*32}-${Math.floor(g/32)*32}-${Math.floor(b/32)*32}`;
      colorMap.set(colorKey, (colorMap.get(colorKey) || 0) + 1);
    }

    brightness /= totalPixels;
    const avgR = rSum / totalPixels;
    const avgG = gSum / totalPixels;
    const avgB = bSum / totalPixels;

    // Segunda passada: variância para contraste
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i], g = data[i + 1], b = data[i + 2];
      rVar += Math.pow(r - avgR, 2);
      gVar += Math.pow(g - avgG, 2);
      bVar += Math.pow(b - avgB, 2);
    }

    const contrast = Math.sqrt((rVar + gVar + bVar) / (3 * totalPixels)) / 2.55;

    // Calcular saturação
    let satSum = 0;
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i] / 255, g = data[i + 1] / 255, b = data[i + 2] / 255;
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const sat = max === 0 ? 0 : (max - min) / max;
      satSum += sat;
    }
    const saturation = (satSum / totalPixels) * 100;

    // Detectar bordas e calcular nitidez
    let edgeSum = 0, edgeCount = 0;
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4;
        const current = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
        
        // Operador Sobel simplificado
        const right = ((data[idx + 4] + data[idx + 5] + data[idx + 6]) / 3);
        const bottom = ((data[(y + 1) * width * 4 + x * 4] + data[(y + 1) * width * 4 + x * 4 + 1] + data[(y + 1) * width * 4 + x * 4 + 2]) / 3);
        
        const gx = right - current;
        const gy = bottom - current;
        const magnitude = Math.sqrt(gx * gx + gy * gy);
        
        edgeSum += magnitude;
        if (magnitude > 30) edgeCount++;
      }
    }

    const sharpness = (edgeSum / ((width - 2) * (height - 2))) / 10;

    // Calcular nível de ruído
    let noiseSum = 0;
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4;
        const current = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
        
        let neighborSum = 0;
        let count = 0;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            const nIdx = ((y + dy) * width + (x + dx)) * 4;
            neighborSum += (data[nIdx] + data[nIdx + 1] + data[nIdx + 2]) / 3;
            count++;
          }
        }
        
        const avgNeighbor = neighborSum / count;
        noiseSum += Math.abs(current - avgNeighbor);
      }
    }

    const noiseLevel = (noiseSum / ((width - 2) * (height - 2))) / 10;

    // Extrair cores dominantes
    const dominantColors = Array.from(colorMap.entries())
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([color]) => `#${color.split('-').map(c => parseInt(c).toString(16).padStart(2, '0')).join('')}`);

    // Calcular vetor de movimento
    const motionVector = calculateMotion ? 
      this.calculateMotionVector(imageData, calculateMotion) : 
      { x: 0, y: 0, magnitude: 0 };

    return {
      timestamp,
      brightness: brightness / 2.55,
      contrast,
      saturation,
      sharpness: Math.min(100, sharpness),
      noiseLevel: Math.min(100, noiseLevel),
      motionVector,
      dominantColors,
      histogram,
      edges: edgeCount,
      faces: [], // Implementação simplificada
      objects: []
    };
  }

  // Calcular vetor de movimento entre frames
  private calculateMotionVector(currentImageData: ImageData, previousFrame: FrameAnalysis): { x: number; y: number; magnitude: number } {
    // Implementação simplificada usando diferença de histograma
    const currentHist = new Array(256).fill(0);
    const data = currentImageData.data;
    
    for (let i = 0; i < data.length; i += 4) {
      const gray = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
      currentHist[gray]++;
    }
    
    let totalDiff = 0;
    for (let i = 0; i < 256; i++) {
      totalDiff += Math.abs(currentHist[i] - previousFrame.histogram[i]);
    }
    
    const magnitude = totalDiff / (currentImageData.width * currentImageData.height);
    
    // Estimativa simplificada de direção (seria necessário análise de blocos para precisão)
    return {
      x: Math.random() * 2 - 1, // Placeholder
      y: Math.random() * 2 - 1, // Placeholder
      magnitude: Math.min(100, magnitude * 10)
    };
  }

  // Análise de áudio
  private async analyzeAudio(videoElement: HTMLVideoElement, options: { sampleRate: number }): Promise<AudioAnalysis[]> {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    const source = this.audioContext.createMediaElementSource(videoElement);
    const analyser = this.audioContext.createAnalyser();
    analyser.fftSize = 2048;
    
    source.connect(analyser);
    analyser.connect(this.audioContext.destination);

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const frequencyArray = new Float32Array(bufferLength);
    
    const duration = videoElement.duration;
    const sampleInterval = 1 / options.sampleRate;
    const analyses: AudioAnalysis[] = [];

    return new Promise((resolve) => {
      let currentTime = 0;
      
      const analyze = () => {
        if (currentTime >= duration) {
          resolve(analyses);
          return;
        }
        
        analyser.getByteFrequencyData(dataArray);
        analyser.getFloatFrequencyData(frequencyArray);
        
        // Calcular métricas de áudio
        const volume = this.calculateVolume(dataArray);
        const spectralCentroid = this.calculateSpectralCentroid(frequencyArray);
        const zeroCrossingRate = this.calculateZeroCrossingRate(dataArray);
        const mfcc = this.calculateMFCC(frequencyArray);
        const tempo = this.estimateTempo(dataArray, analyses);
        const pitch = this.estimatePitch(frequencyArray);
        const harmonicity = this.calculateHarmonicity(frequencyArray);
        
        analyses.push({
          timestamp: currentTime,
          volume,
          frequency: new Float32Array(frequencyArray),
          spectralCentroid,
          zeroCrossingRate,
          mfcc,
          tempo,
          pitch,
          harmonicity
        });
        
        currentTime += sampleInterval;
        setTimeout(analyze, sampleInterval * 1000);
      };
      
      videoElement.play();
      analyze();
    });
  }

  // Métricas de áudio
  private calculateVolume(dataArray: Uint8Array): number {
    const sum = dataArray.reduce((acc, val) => acc + val, 0);
    return (sum / dataArray.length) / 2.55;
  }

  private calculateSpectralCentroid(frequencyArray: Float32Array): number {
    let weightedSum = 0;
    let magnitudeSum = 0;
    
    for (let i = 0; i < frequencyArray.length; i++) {
      const magnitude = Math.abs(frequencyArray[i]);
      weightedSum += i * magnitude;
      magnitudeSum += magnitude;
    }
    
    return magnitudeSum > 0 ? weightedSum / magnitudeSum : 0;
  }

  private calculateZeroCrossingRate(dataArray: Uint8Array): number {
    let crossings = 0;
    const threshold = 128;
    
    for (let i = 1; i < dataArray.length; i++) {
      if ((dataArray[i] > threshold && dataArray[i-1] <= threshold) ||
          (dataArray[i] <= threshold && dataArray[i-1] > threshold)) {
        crossings++;
      }
    }
    
    return crossings / dataArray.length;
  }

  private calculateMFCC(frequencyArray: Float32Array): number[] {
    // Implementação simplificada de MFCC
    const mfcc = [];
    const numCoefficients = 13;
    
    for (let i = 0; i < numCoefficients; i++) {
      let sum = 0;
      const start = Math.floor(i * frequencyArray.length / numCoefficients);
      const end = Math.floor((i + 1) * frequencyArray.length / numCoefficients);
      
      for (let j = start; j < end; j++) {
        sum += Math.abs(frequencyArray[j]);
      }
      
      mfcc.push(sum / (end - start));
    }
    
    return mfcc;
  }

  private estimateTempo(dataArray: Uint8Array, previousAnalyses: AudioAnalysis[]): number {
    // Estimativa simples baseada em picos de energia
    const energy = dataArray.reduce((acc, val) => acc + val * val, 0);
    const threshold = 10000;
    
    if (energy > threshold && previousAnalyses.length > 0) {
      const lastPeak = previousAnalyses.reverse().find(a => a.volume > 70);
      if (lastPeak) {
        const timeDiff = previousAnalyses[previousAnalyses.length - 1].timestamp - lastPeak.timestamp;
        return timeDiff > 0 ? 60 / timeDiff : 120;
      }
    }
    
    return 120; // BPM padrão
  }

  private estimatePitch(frequencyArray: Float32Array): number {
    // Encontrar pico de frequência dominante
    let maxMagnitude = 0;
    let dominantFreq = 0;
    
    for (let i = 0; i < frequencyArray.length; i++) {
      const magnitude = Math.abs(frequencyArray[i]);
      if (magnitude > maxMagnitude) {
        maxMagnitude = magnitude;
        dominantFreq = i;
      }
    }
    
    // Converter índice para frequência (aproximação)
    return (dominantFreq / frequencyArray.length) * 22050; // Assumindo sample rate de 44.1kHz
  }

  private calculateHarmonicity(frequencyArray: Float32Array): number {
    // Calcular razão harmônica vs ruído
    let harmonicEnergy = 0;
    let totalEnergy = 0;
    
    for (let i = 0; i < frequencyArray.length; i++) {
      const magnitude = Math.abs(frequencyArray[i]);
      totalEnergy += magnitude;
      
      // Considerar harmônicos (múltiplos de frequências baixas)
      if (i % 2 === 0 || i % 3 === 0 || i % 5 === 0) {
        harmonicEnergy += magnitude;
      }
    }
    
    return totalEnergy > 0 ? (harmonicEnergy / totalEnergy) * 100 : 0;
  }

  // Detectar problemas de qualidade
  private detectQualityIssues(frames: FrameAnalysis[], audio?: AudioAnalysis[]): QualityIssue[] {
    const issues: QualityIssue[] = [];
    
    // Análise de frames
    frames.forEach(frame => {
      // Detectar blur
      if (frame.sharpness < 30) {
        issues.push({
          type: 'blur',
          severity: frame.sharpness < 15 ? 'critical' : frame.sharpness < 25 ? 'high' : 'medium',
          timestamp: frame.timestamp,
          description: `Imagem desfocada detectada (nitidez: ${frame.sharpness.toFixed(1)})`,
          suggestion: 'Aplicar filtro de nitidez ou refilmar com melhor foco',
          confidence: 0.8
        });
      }
      
      // Detectar ruído excessivo
      if (frame.noiseLevel > 60) {
        issues.push({
          type: 'noise',
          severity: frame.noiseLevel > 80 ? 'high' : 'medium',
          timestamp: frame.timestamp,
          description: `Alto nível de ruído detectado (${frame.noiseLevel.toFixed(1)})`,
          suggestion: 'Aplicar filtro de redução de ruído',
          confidence: 0.7
        });
      }
      
      // Detectar problemas de exposição
      if (frame.brightness < 20 || frame.brightness > 80) {
        issues.push({
          type: 'exposure',
          severity: (frame.brightness < 10 || frame.brightness > 90) ? 'high' : 'medium',
          timestamp: frame.timestamp,
          description: frame.brightness < 20 ? 'Imagem muito escura' : 'Imagem muito clara',
          suggestion: frame.brightness < 20 ? 'Aumentar brilho e exposição' : 'Reduzir brilho e exposição',
          confidence: 0.9
        });
      }
      
      // Detectar baixo contraste
      if (frame.contrast < 25) {
        issues.push({
          type: 'color',
          severity: frame.contrast < 15 ? 'high' : 'medium',
          timestamp: frame.timestamp,
          description: `Baixo contraste detectado (${frame.contrast.toFixed(1)})`,
          suggestion: 'Aumentar contraste para melhorar definição',
          confidence: 0.8
        });
      }
    });
    
    // Análise de áudio
    if (audio) {
      audio.forEach(sample => {
        // Detectar volume muito baixo ou alto
        if (sample.volume < 20 || sample.volume > 90) {
          issues.push({
            type: 'audio_distortion',
            severity: (sample.volume < 10 || sample.volume > 95) ? 'high' : 'medium',
            timestamp: sample.timestamp,
            description: sample.volume < 20 ? 'Volume muito baixo' : 'Volume muito alto',
            suggestion: sample.volume < 20 ? 'Aumentar volume ou amplificação' : 'Reduzir volume para evitar distorção',
            confidence: 0.8
          });
        }
      });
    }
    
    // Detectar instabilidade (movimento excessivo)
    const avgMotion = frames.reduce((sum, f) => sum + f.motionVector.magnitude, 0) / frames.length;
    if (avgMotion > 70) {
      issues.push({
        type: 'stability',
        severity: avgMotion > 85 ? 'high' : 'medium',
        description: 'Vídeo instável com muito movimento de câmera',
        suggestion: 'Aplicar estabilização de vídeo',
        confidence: 0.7
      });
    }
    
    return issues;
  }

  // Gerar sugestões de otimização
  private generateOptimizationSuggestions(
    frames: FrameAnalysis[], 
    audio?: AudioAnalysis[], 
    issues?: QualityIssue[]
  ): OptimizationSuggestion[] {
    const suggestions: OptimizationSuggestion[] = [];
    
    // Análise estatística dos frames
    const avgBrightness = frames.reduce((sum, f) => sum + f.brightness, 0) / frames.length;
    const avgContrast = frames.reduce((sum, f) => sum + f.contrast, 0) / frames.length;
    const avgSaturation = frames.reduce((sum, f) => sum + f.saturation, 0) / frames.length;
    const avgSharpness = frames.reduce((sum, f) => sum + f.sharpness, 0) / frames.length;
    const avgMotion = frames.reduce((sum, f) => sum + f.motionVector.magnitude, 0) / frames.length;
    
    // Sugestões baseadas em qualidade visual
    if (avgBrightness < 40 || avgBrightness > 70) {
      suggestions.push({
        type: 'color_correction',
        priority: 'high',
        description: avgBrightness < 40 ? 'Corrigir subexposição' : 'Corrigir superexposição',
        parameters: {
          brightness: avgBrightness < 40 ? '+20' : '-15',
          gamma: avgBrightness < 40 ? '1.2' : '0.8'
        },
        expectedImprovement: 25
      });
    }
    
    if (avgContrast < 35) {
      suggestions.push({
        type: 'color_correction',
        priority: 'medium',
        description: 'Aumentar contraste para melhor definição',
        parameters: {
          contrast: '+25',
          curves: 'S-curve'
        },
        expectedImprovement: 20
      });
    }
    
    if (avgSaturation < 40) {
      suggestions.push({
        type: 'color_correction',
        priority: 'low',
        description: 'Aumentar saturação para cores mais vibrantes',
        parameters: {
          saturation: '+15',
          vibrance: '+10'
        },
        expectedImprovement: 15
      });
    }
    
    if (avgSharpness < 40) {
      suggestions.push({
        type: 'noise_reduction',
        priority: 'high',
        description: 'Aplicar filtro de nitidez',
        parameters: {
          unsharpMask: { amount: 0.8, radius: 1.0, threshold: 0.1 },
          method: 'unsharp_mask'
        },
        expectedImprovement: 30
      });
    }
    
    if (avgMotion > 60) {
      suggestions.push({
        type: 'stabilization',
        priority: 'high',
        description: 'Aplicar estabilização de vídeo',
        parameters: {
          method: 'optical_flow',
          smoothing: 0.7,
          cropRatio: 0.1
        },
        expectedImprovement: 35
      });
    }
    
    // Sugestões baseadas em áudio
    if (audio) {
      const avgVolume = audio.reduce((sum, a) => sum + a.volume, 0) / audio.length;
      const avgHarmonicity = audio.reduce((sum, a) => sum + a.harmonicity, 0) / audio.length;
      
      if (avgVolume < 30 || avgVolume > 85) {
        suggestions.push({
          type: 'audio_enhancement',
          priority: 'medium',
          description: avgVolume < 30 ? 'Normalizar volume baixo' : 'Reduzir volume alto',
          parameters: {
            normalize: true,
            targetLevel: '-12dB',
            limiter: avgVolume > 85
          },
          expectedImprovement: 25
        });
      }
      
      if (avgHarmonicity < 40) {
        suggestions.push({
          type: 'audio_enhancement',
          priority: 'low',
          description: 'Reduzir ruído de áudio',
          parameters: {
            noiseReduction: true,
            method: 'spectral_subtraction',
            strength: 0.6
          },
          expectedImprovement: 20
        });
      }
    }
    
    // Sugestões baseadas em aspectos técnicos
    const aspectRatio = frames[0] ? frames[0].timestamp : 1; // Placeholder
    
    // Sugestão de crop inteligente para diferentes plataformas
    suggestions.push({
      type: 'crop',
      priority: 'low',
      description: 'Otimizar para diferentes plataformas',
      parameters: {
        instagram: '1:1',
        youtube: '16:9',
        tiktok: '9:16',
        smart_crop: true
      },
      expectedImprovement: 10
    });
    
    return suggestions.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  // Calcular score geral de qualidade
  private calculateOverallScore(frames: FrameAnalysis[], audio?: AudioAnalysis[], issues?: QualityIssue[]): number {
    let score = 100;
    
    // Penalizar por problemas críticos
    if (issues) {
      issues.forEach(issue => {
        switch (issue.severity) {
          case 'critical': score -= 25; break;
          case 'high': score -= 15; break;
          case 'medium': score -= 8; break;
          case 'low': score -= 3; break;
        }
      });
    }
    
    // Bonificar por qualidade técnica
    const avgSharpness = frames.reduce((sum, f) => sum + f.sharpness, 0) / frames.length;
    const avgContrast = frames.reduce((sum, f) => sum + f.contrast, 0) / frames.length;
    const avgBrightness = frames.reduce((sum, f) => sum + f.brightness, 0) / frames.length;
    
    if (avgSharpness > 60) score += 5;
    if (avgContrast > 50) score += 5;
    if (avgBrightness >= 40 && avgBrightness <= 70) score += 5;
    
    // Bonificar por qualidade de áudio
    if (audio) {
      const avgVolume = audio.reduce((sum, a) => sum + a.volume, 0) / audio.length;
      const avgHarmonicity = audio.reduce((sum, a) => sum + a.harmonicity, 0) / audio.length;
      
      if (avgVolume >= 30 && avgVolume <= 80) score += 5;
      if (avgHarmonicity > 50) score += 5;
    }
    
    return Math.max(0, Math.min(100, score));
  }

  // Utilitários
  private waitForSeek(videoElement: HTMLVideoElement): Promise<void> {
    return new Promise(resolve => {
      const onSeeked = () => {
        videoElement.removeEventListener('seeked', onSeeked);
        resolve();
      };
      videoElement.addEventListener('seeked', onSeeked);
    });
  }

  // Limpeza de recursos
  dispose(): void {
    this.workers.forEach(worker => worker.terminate());
    this.workers = [];
    
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
    }
    
    this.analysisCache.clear();
  }
}

export default ContentAnalysisService;
export type {
  VideoMetrics,
  AudioMetrics,
  FrameAnalysis,
  AudioAnalysis,
  QualityIssue,
  OptimizationSuggestion
};