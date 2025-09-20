// Browser-compatible EventEmitter implementation
class SimpleEventEmitter {
  private events: { [key: string]: Function[] } = {};

  on(event: string, callback: Function) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);
  }

  emit(event: string, data?: any) {
    if (this.events[event]) {
      this.events[event].forEach(callback => callback(data));
    }
  }

  off(event: string, callback: Function) {
    if (this.events[event]) {
      this.events[event] = this.events[event].filter(cb => cb !== callback);
    }
  }
}

export interface VisionAnalysisResult {
  id: string;
  timestamp: number;
  confidence: number;
  objects: DetectedObject[];
  scenes: SceneAnalysis[];
  faces: FaceDetection[];
  text: TextDetection[];
  emotions: EmotionAnalysis[];
  quality: QualityMetrics;
}

export interface DetectedObject {
  id: string;
  label: string;
  confidence: number;
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  timestamp: number;
}

export interface SceneAnalysis {
  id: string;
  type: 'indoor' | 'outdoor' | 'studio' | 'nature' | 'urban' | 'unknown';
  lighting: 'bright' | 'dim' | 'natural' | 'artificial' | 'mixed';
  mood: 'happy' | 'sad' | 'neutral' | 'energetic' | 'calm';
  confidence: number;
  timestamp: number;
  duration: number;
}

export interface FaceDetection {
  id: string;
  confidence: number;
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  landmarks: {
    leftEye: { x: number; y: number };
    rightEye: { x: number; y: number };
    nose: { x: number; y: number };
    mouth: { x: number; y: number };
  };
  age?: number;
  gender?: 'male' | 'female' | 'unknown';
  emotion?: string;
  timestamp: number;
}

export interface TextDetection {
  id: string;
  text: string;
  confidence: number;
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  language?: string;
  timestamp: number;
}

export interface EmotionAnalysis {
  id: string;
  emotion: 'happy' | 'sad' | 'angry' | 'surprised' | 'fear' | 'disgust' | 'neutral';
  confidence: number;
  intensity: number;
  timestamp: number;
}

export interface QualityMetrics {
  sharpness: number;
  brightness: number;
  contrast: number;
  saturation: number;
  noise: number;
  stability: number;
  overallScore: number;
}

export interface VisionAnalysisOptions {
  detectObjects?: boolean;
  analyzeScenes?: boolean;
  detectFaces?: boolean;
  detectText?: boolean;
  analyzeEmotions?: boolean;
  assessQuality?: boolean;
  frameInterval?: number; // Intervalo entre frames analisados (em segundos)
  confidenceThreshold?: number;
}

export class VisionAnalysisService extends SimpleEventEmitter {
  private isAnalyzing = false;
  private analysisResults: Map<string, VisionAnalysisResult[]> = new Map();

  constructor() {
    super();
  }

  async analyzeVideo(
    videoElement: HTMLVideoElement,
    options: VisionAnalysisOptions = {}
  ): Promise<VisionAnalysisResult[]> {
    if (this.isAnalyzing) {
      throw new Error('Análise já em andamento');
    }

    this.isAnalyzing = true;
    const videoId = this.generateId();
    const results: VisionAnalysisResult[] = [];

    try {
      this.emit('analysisStarted', { videoId, duration: videoElement.duration });

      const frameInterval = options.frameInterval || 1; // Analisar a cada 1 segundo
      const totalFrames = Math.floor(videoElement.duration / frameInterval);

      for (let i = 0; i < totalFrames; i++) {
        const timestamp = i * frameInterval;
        videoElement.currentTime = timestamp;

        // Aguardar o frame carregar
        await this.waitForVideoFrame(videoElement);

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;
        canvas.width = videoElement.videoWidth;
        canvas.height = videoElement.videoHeight;
        ctx.drawImage(videoElement, 0, 0);

        const frameAnalysis = await this.analyzeFrame(canvas, timestamp, options);
        results.push(frameAnalysis);

        this.emit('frameAnalyzed', {
          videoId,
          frameIndex: i,
          totalFrames,
          timestamp,
          result: frameAnalysis
        });
      }

      this.analysisResults.set(videoId, results);
      this.emit('analysisCompleted', { videoId, results });
      return results;
    } catch (error) {
      this.emit('analysisError', { videoId, error });
      throw error;
    } finally {
      this.isAnalyzing = false;
    }
  }

  async analyzeFrame(
    canvas: HTMLCanvasElement,
    timestamp: number,
    options: VisionAnalysisOptions = {}
  ): Promise<VisionAnalysisResult> {
    const result: VisionAnalysisResult = {
      id: this.generateId(),
      timestamp,
      confidence: 0,
      objects: [],
      scenes: [],
      faces: [],
      text: [],
      emotions: [],
      quality: {
        sharpness: 0,
        brightness: 0,
        contrast: 0,
        saturation: 0,
        noise: 0,
        stability: 0,
        overallScore: 0
      }
    };

    const ctx = canvas.getContext('2d')!;
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    // Simular análise de diferentes aspectos
    if (options.detectObjects !== false) {
      result.objects = await this.detectObjects(imageData, timestamp);
    }

    if (options.analyzeScenes !== false) {
      result.scenes = await this.analyzeScenes(imageData, timestamp);
    }

    if (options.detectFaces !== false) {
      result.faces = await this.detectFaces(imageData, timestamp);
    }

    if (options.detectText !== false) {
      result.text = await this.detectText(imageData, timestamp);
    }

    if (options.analyzeEmotions !== false) {
      result.emotions = await this.analyzeEmotions(imageData, timestamp);
    }

    if (options.assessQuality !== false) {
      result.quality = await this.assessQuality(imageData);
    }

    // Calcular confiança geral
    result.confidence = this.calculateOverallConfidence(result);

    return result;
  }

  private async detectObjects(imageData: ImageData, timestamp: number): Promise<DetectedObject[]> {
    // Simular detecção de objetos
    await this.delay(100);

    const objects: DetectedObject[] = [];
    const possibleObjects = ['person', 'car', 'tree', 'building', 'animal', 'furniture'];

    // Simular alguns objetos detectados
    for (let i = 0; i < Math.random() * 3; i++) {
      objects.push({
        id: this.generateId(),
        label: possibleObjects[Math.floor(Math.random() * possibleObjects.length)],
        confidence: 0.7 + Math.random() * 0.3,
        boundingBox: {
          x: Math.random() * imageData.width * 0.5,
          y: Math.random() * imageData.height * 0.5,
          width: 50 + Math.random() * 100,
          height: 50 + Math.random() * 100
        },
        timestamp
      });
    }

    return objects;
  }

  private async analyzeScenes(imageData: ImageData, timestamp: number): Promise<SceneAnalysis[]> {
    // Simular análise de cena
    await this.delay(150);

    const scenes: SceneAnalysis[] = [{
      id: this.generateId(),
      type: ['indoor', 'outdoor', 'studio', 'nature', 'urban'][Math.floor(Math.random() * 5)] as any,
      lighting: ['bright', 'dim', 'natural', 'artificial', 'mixed'][Math.floor(Math.random() * 5)] as any,
      mood: ['happy', 'sad', 'neutral', 'energetic', 'calm'][Math.floor(Math.random() * 5)] as any,
      confidence: 0.6 + Math.random() * 0.4,
      timestamp,
      duration: 1
    }];

    return scenes;
  }

  private async detectFaces(imageData: ImageData, timestamp: number): Promise<FaceDetection[]> {
    // Simular detecção de rostos
    await this.delay(200);

    const faces: FaceDetection[] = [];
    const faceCount = Math.floor(Math.random() * 3);

    for (let i = 0; i < faceCount; i++) {
      const x = Math.random() * imageData.width * 0.7;
      const y = Math.random() * imageData.height * 0.7;
      const width = 80 + Math.random() * 40;
      const height = 100 + Math.random() * 50;

      faces.push({
        id: this.generateId(),
        confidence: 0.8 + Math.random() * 0.2,
        boundingBox: { x, y, width, height },
        landmarks: {
          leftEye: { x: x + width * 0.3, y: y + height * 0.3 },
          rightEye: { x: x + width * 0.7, y: y + height * 0.3 },
          nose: { x: x + width * 0.5, y: y + height * 0.5 },
          mouth: { x: x + width * 0.5, y: y + height * 0.7 }
        },
        age: 20 + Math.floor(Math.random() * 40),
        gender: Math.random() > 0.5 ? 'male' : 'female',
        emotion: ['happy', 'sad', 'neutral', 'surprised'][Math.floor(Math.random() * 4)],
        timestamp
      });
    }

    return faces;
  }

  private async detectText(imageData: ImageData, timestamp: number): Promise<TextDetection[]> {
    // Simular detecção de texto
    await this.delay(120);

    const texts: TextDetection[] = [];
    const possibleTexts = ['TITLE', 'SUBTITLE', 'LOGO', 'CAPTION', 'WATERMARK'];

    if (Math.random() > 0.7) {
      texts.push({
        id: this.generateId(),
        text: possibleTexts[Math.floor(Math.random() * possibleTexts.length)],
        confidence: 0.85 + Math.random() * 0.15,
        boundingBox: {
          x: Math.random() * imageData.width * 0.5,
          y: Math.random() * imageData.height * 0.5,
          width: 100 + Math.random() * 200,
          height: 20 + Math.random() * 40
        },
        language: 'pt-BR',
        timestamp
      });
    }

    return texts;
  }

  private async analyzeEmotions(imageData: ImageData, timestamp: number): Promise<EmotionAnalysis[]> {
    // Simular análise de emoções
    await this.delay(180);

    const emotions: EmotionAnalysis[] = [];
    const emotionTypes = ['happy', 'sad', 'angry', 'surprised', 'fear', 'disgust', 'neutral'] as const;

    if (Math.random() > 0.5) {
      emotions.push({
        id: this.generateId(),
        emotion: emotionTypes[Math.floor(Math.random() * emotionTypes.length)],
        confidence: 0.7 + Math.random() * 0.3,
        intensity: Math.random(),
        timestamp
      });
    }

    return emotions;
  }

  private async assessQuality(imageData: ImageData): Promise<QualityMetrics> {
    // Simular avaliação de qualidade
    await this.delay(100);

    const sharpness = 0.5 + Math.random() * 0.5;
    const brightness = 0.4 + Math.random() * 0.6;
    const contrast = 0.3 + Math.random() * 0.7;
    const saturation = 0.4 + Math.random() * 0.6;
    const noise = Math.random() * 0.3;
    const stability = 0.7 + Math.random() * 0.3;

    const overallScore = (sharpness + brightness + contrast + saturation + (1 - noise) + stability) / 6;

    return {
      sharpness,
      brightness,
      contrast,
      saturation,
      noise,
      stability,
      overallScore
    };
  }

  private calculateOverallConfidence(result: VisionAnalysisResult): number {
    const confidences = [
      ...result.objects.map(o => o.confidence),
      ...result.scenes.map(s => s.confidence),
      ...result.faces.map(f => f.confidence),
      ...result.text.map(t => t.confidence),
      ...result.emotions.map(e => e.confidence),
      result.quality.overallScore
    ];

    return confidences.length > 0 ? confidences.reduce((a, b) => a + b, 0) / confidences.length : 0;
  }

  private waitForVideoFrame(video: HTMLVideoElement): Promise<void> {
    return new Promise((resolve) => {
      const onSeeked = () => {
        video.removeEventListener('seeked', onSeeked);
        resolve();
      };
      video.addEventListener('seeked', onSeeked);
    });
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  getAnalysisResults(videoId?: string): VisionAnalysisResult[] {
    if (videoId) {
      return this.analysisResults.get(videoId) || [];
    }
    return Array.from(this.analysisResults.values()).flat();
  }

  clearResults(videoId?: string): void {
    if (videoId) {
      this.analysisResults.delete(videoId);
    } else {
      this.analysisResults.clear();
    }
  }

  isProcessing(): boolean {
    return this.isAnalyzing;
  }
}

// Função específica para análise de PPTX com GPT-4 Vision
export async function analyzePPTXWithGPT4Vision(
  file: File,
  options: {
    extractText?: boolean;
    analyzeImages?: boolean;
    detectLayouts?: boolean;
    summarizeContent?: boolean;
  } = {}
): Promise<{
  slides: Array<{
    slideNumber: number;
    text: string[];
    images: Array<{
      description: string;
      confidence: number;
    }>;
    layout: string;
    summary?: string;
  }>;
  overallSummary: string;
  confidence: number;
}> {
  try {
    // Simular análise de PPTX
    await new Promise(resolve => setTimeout(resolve, 1500));

    const slideCount = Math.floor(Math.random() * 10) + 5;
    const slides = [];

    for (let i = 1; i <= slideCount; i++) {
      slides.push({
        slideNumber: i,
        text: [
          `Título do Slide ${i}`,
          `Conteúdo principal do slide ${i}`,
          `Pontos importantes identificados`
        ],
        images: [
          {
            description: `Imagem ${i}: Gráfico ou diagrama relevante`,
            confidence: 0.85 + Math.random() * 0.15
          }
        ],
        layout: ['title-slide', 'content', 'two-column', 'image-text'][Math.floor(Math.random() * 4)],
        summary: options.summarizeContent ? `Resumo do slide ${i}: Conteúdo focado em...` : undefined
      });
    }

    return {
      slides,
      overallSummary: 'Apresentação analisada com sucesso. Conteúdo focado em temas principais identificados pela IA.',
      confidence: 0.88
    };
  } catch (error) {
    console.error('Erro na análise PPTX:', error);
    throw new Error('Falha na análise do arquivo PPTX');
  }
}

export const visionAnalysisService = new VisionAnalysisService();
export default visionAnalysisService;