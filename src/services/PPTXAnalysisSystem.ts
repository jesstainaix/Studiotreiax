// Sistema de análise inteligente de PPTX com conversão automática
import { VideoProject, VideoScene, VideoAsset } from '../types/video';
import { NRTemplateSystem } from './NRTemplateSystem';
import { AdvancedVFXEngine } from './AdvancedVFXEngine';

// Interfaces para análise de PPTX
interface PPTXSlide {
  id: string;
  title: string;
  content: string;
  images: PPTXImage[];
  shapes: PPTXShape[];
  animations: PPTXAnimation[];
  notes: string;
  layout: string;
  background: PPTXBackground;
  duration: number;
}

interface PPTXImage {
  id: string;
  src: string;
  alt: string;
  position: { x: number; y: number; width: number; height: number };
  zIndex: number;
}

interface PPTXShape {
  id: string;
  type: 'rectangle' | 'circle' | 'arrow' | 'line' | 'text';
  content?: string;
  style: {
    fill: string;
    stroke: string;
    strokeWidth: number;
    fontSize?: number;
    fontFamily?: string;
  };
  position: { x: number; y: number; width: number; height: number };
}

interface PPTXAnimation {
  id: string;
  type: 'entrance' | 'emphasis' | 'exit' | 'motion';
  effect: string;
  target: string;
  delay: number;
  duration: number;
  easing: string;
}

interface PPTXBackground {
  type: 'solid' | 'gradient' | 'image';
  value: string;
  opacity: number;
}

interface PPTXMetadata {
  title: string;
  author: string;
  subject: string;
  keywords: string[];
  slideCount: number;
  createdDate: Date;
  modifiedDate: Date;
  language: string;
}

// Interfaces para análise de conteúdo
interface ContentAnalysis {
  topics: Topic[];
  complexity: 'basic' | 'intermediate' | 'advanced';
  targetAudience: 'general' | 'technical' | 'executive';
  estimatedDuration: number;
  keyPoints: string[];
  suggestedNarration: NarrationSuggestion[];
  visualElements: VisualElement[];
  interactiveElements: InteractiveElement[];
}

interface Topic {
  name: string;
  confidence: number;
  category: string;
  keywords: string[];
  slides: string[];
}

interface NarrationSuggestion {
  slideId: string;
  text: string;
  timing: { start: number; end: number };
  voice: 'male' | 'female';
  tone: 'professional' | 'casual' | 'enthusiastic';
  speed: number;
}

interface VisualElement {
  type: 'chart' | 'diagram' | 'image' | 'icon' | 'text';
  slideId: string;
  importance: number;
  suggestedAnimation: string;
  enhancementSuggestions: string[];
}

interface InteractiveElement {
  type: 'quiz' | 'poll' | 'clickable' | 'hover';
  slideId: string;
  description: string;
  implementation: string;
}

// Interfaces para conversão
interface ConversionOptions {
  outputFormat: 'mp4' | 'webm' | 'mov';
  resolution: '720p' | '1080p' | '4k';
  framerate: 24 | 30 | 60;
  quality: 'low' | 'medium' | 'high' | 'ultra';
  includeAnimations: boolean;
  includeTransitions: boolean;
  includeNarration: boolean;
  includeSubtitles: boolean;
  customBranding: boolean;
  templateStyle: string;
}

interface ConversionResult {
  success: boolean;
  videoProject: VideoProject;
  analysisReport: ContentAnalysis;
  suggestions: string[];
  warnings: string[];
  processingTime: number;
}

// Sistema principal
export class PPTXAnalysisSystem {
  private nrTemplateSystem: NRTemplateSystem;
  private vfxEngine: AdvancedVFXEngine;
  private aiModels: Map<string, any>;
  private processingQueue: Map<string, any>;

  constructor() {
    this.nrTemplateSystem = new NRTemplateSystem();
    this.vfxEngine = new AdvancedVFXEngine(); // Inicializado sem canvas, será configurado depois
    this.aiModels = new Map();
    this.processingQueue = new Map();
    this.initializeAIModels();
  }

  // Método para inicializar VFX com canvas quando disponível
  public initializeVFXEngine(canvas: HTMLCanvasElement, webglCanvas: HTMLCanvasElement): void {
    if (this.vfxEngine && !this.vfxEngine.isCanvasInitialized()) {
      this.vfxEngine.initializeWithCanvas(canvas, webglCanvas);
    }
  }

  // Verificar se VFX está pronto para uso
  public isVFXReady(): boolean {
    return this.vfxEngine?.isCanvasInitialized() || false;
  }

  private async initializeAIModels(): Promise<void> {
    try {
      // Inicializar modelos de IA para análise de conteúdo
      this.aiModels.set('textAnalysis', {
        model: 'bert-base-multilingual',
        tokenizer: 'bert-tokenizer',
        loaded: false
      });

      this.aiModels.set('imageAnalysis', {
        model: 'resnet50',
        classifier: 'imagenet',
        loaded: false
      });

      this.aiModels.set('speechSynthesis', {
        model: 'tacotron2',
        vocoder: 'waveglow',
        loaded: false
      });

      // Carregar modelos em background
      this.loadAIModels();
    } catch (error) {
      console.error('Erro ao inicializar modelos de IA:', error);
    }
  }

  private async loadAIModels(): Promise<void> {
    for (const [name, config] of this.aiModels) {
      try {
        // Simular carregamento de modelo
        await new Promise(resolve => setTimeout(resolve, 1000));
        config.loaded = true;
      } catch (error) {
        console.error(`Erro ao carregar modelo ${name}:`, error);
      }
    }
  }

  // Análise de arquivo PPTX
  async analyzePPTX(file: File): Promise<{ slides: PPTXSlide[]; metadata: PPTXMetadata }> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const slides = await this.extractSlides(arrayBuffer);
      const metadata = await this.extractMetadata(arrayBuffer);

      return { slides, metadata };
    } catch (error) {
      console.error('Erro ao analisar PPTX:', error);
      throw new Error('Falha na análise do arquivo PPTX');
    }
  }

  private async extractSlides(arrayBuffer: ArrayBuffer): Promise<PPTXSlide[]> {
    // Implementação simplificada - em produção usaria biblioteca como pptx-parser
    const slides: PPTXSlide[] = [];
    
    // Simular extração de slides
    for (let i = 0; i < 10; i++) {
      slides.push({
        id: `slide-${i + 1}`,
        title: `Slide ${i + 1}`,
        content: `Conteúdo do slide ${i + 1}`,
        images: [],
        shapes: [],
        animations: [],
        notes: '',
        layout: 'title-content',
        background: {
          type: 'solid',
          value: '#ffffff',
          opacity: 1
        },
        duration: 5
      });
    }

    return slides;
  }

  private async extractMetadata(arrayBuffer: ArrayBuffer): Promise<PPTXMetadata> {
    return {
      title: 'Apresentação Exemplo',
      author: 'Usuário',
      subject: 'Treinamento',
      keywords: ['segurança', 'trabalho', 'nr'],
      slideCount: 10,
      createdDate: new Date(),
      modifiedDate: new Date(),
      language: 'pt-BR'
    };
  }

  // Análise inteligente de conteúdo
  async analyzeContent(slides: PPTXSlide[]): Promise<ContentAnalysis> {
    try {
      const topics = await this.extractTopics(slides);
      const complexity = this.determineComplexity(slides);
      const targetAudience = this.identifyTargetAudience(slides);
      const estimatedDuration = this.calculateDuration(slides);
      const keyPoints = this.extractKeyPoints(slides);
      const suggestedNarration = await this.generateNarrationSuggestions(slides);
      const visualElements = this.analyzeVisualElements(slides);
      const interactiveElements = this.suggestInteractiveElements(slides);

      return {
        topics,
        complexity,
        targetAudience,
        estimatedDuration,
        keyPoints,
        suggestedNarration,
        visualElements,
        interactiveElements
      };
    } catch (error) {
      console.error('Erro na análise de conteúdo:', error);
      throw new Error('Falha na análise de conteúdo');
    }
  }

  private async extractTopics(slides: PPTXSlide[]): Promise<Topic[]> {
    const topics: Topic[] = [];
    
    // Análise usando IA para identificar tópicos
    const allText = slides.map(slide => `${slide.title} ${slide.content}`).join(' ');
    
    // Simular análise de tópicos
    topics.push({
      name: 'Segurança do Trabalho',
      confidence: 0.95,
      category: 'NR',
      keywords: ['segurança', 'epi', 'acidente', 'prevenção'],
      slides: slides.slice(0, 3).map(s => s.id)
    });

    topics.push({
      name: 'Equipamentos de Proteção',
      confidence: 0.88,
      category: 'EPI',
      keywords: ['capacete', 'luvas', 'óculos', 'proteção'],
      slides: slides.slice(3, 6).map(s => s.id)
    });

    return topics;
  }

  private determineComplexity(slides: PPTXSlide[]): 'basic' | 'intermediate' | 'advanced' {
    const totalWords = slides.reduce((acc, slide) => {
      return acc + slide.content.split(' ').length;
    }, 0);

    const avgWordsPerSlide = totalWords / slides.length;
    const hasComplexShapes = slides.some(slide => slide.shapes.length > 5);
    const hasAnimations = slides.some(slide => slide.animations.length > 0);

    if (avgWordsPerSlide > 100 || hasComplexShapes || hasAnimations) {
      return 'advanced';
    } else if (avgWordsPerSlide > 50) {
      return 'intermediate';
    } else {
      return 'basic';
    }
  }

  private identifyTargetAudience(slides: PPTXSlide[]): 'general' | 'technical' | 'executive' {
    const technicalTerms = ['API', 'algoritmo', 'implementação', 'arquitetura', 'protocolo'];
    const executiveTerms = ['ROI', 'estratégia', 'investimento', 'resultados', 'performance'];
    
    const allText = slides.map(slide => `${slide.title} ${slide.content}`).join(' ').toLowerCase();
    
    const technicalCount = technicalTerms.filter(term => allText.includes(term)).length;
    const executiveCount = executiveTerms.filter(term => allText.includes(term)).length;
    
    if (technicalCount > executiveCount && technicalCount > 2) {
      return 'technical';
    } else if (executiveCount > 2) {
      return 'executive';
    } else {
      return 'general';
    }
  }

  private calculateDuration(slides: PPTXSlide[]): number {
    return slides.reduce((total, slide) => {
      const baseTime = 30; // 30 segundos base por slide
      const contentTime = Math.max(slide.content.split(' ').length * 0.5, 10);
      const animationTime = slide.animations.length * 2;
      
      return total + baseTime + contentTime + animationTime;
    }, 0);
  }

  private extractKeyPoints(slides: PPTXSlide[]): string[] {
    const keyPoints: string[] = [];
    
    slides.forEach(slide => {
      // Extrair pontos principais baseado em títulos e conteúdo
      if (slide.title) {
        keyPoints.push(slide.title);
      }
      
      // Extrair frases importantes do conteúdo
      const sentences = slide.content.split('.');
      sentences.forEach(sentence => {
        if (sentence.length > 20 && sentence.length < 100) {
          keyPoints.push(sentence.trim());
        }
      });
    });
    
    return keyPoints.slice(0, 10); // Limitar a 10 pontos principais
  }

  private async generateNarrationSuggestions(slides: PPTXSlide[]): Promise<NarrationSuggestion[]> {
    const suggestions: NarrationSuggestion[] = [];
    let currentTime = 0;
    
    for (const slide of slides) {
      const duration = slide.duration || 30;
      const narrationText = this.generateNarrationText(slide);
      
      suggestions.push({
        slideId: slide.id,
        text: narrationText,
        timing: { start: currentTime, end: currentTime + duration },
        voice: 'female',
        tone: 'professional',
        speed: 1.0
      });
      
      currentTime += duration;
    }
    
    return suggestions;
  }

  private generateNarrationText(slide: PPTXSlide): string {
    let narration = '';
    
    if (slide.title) {
      narration += `${slide.title}. `;
    }
    
    if (slide.content) {
      // Simplificar e adaptar o conteúdo para narração
      const adaptedContent = slide.content
        .replace(/\n/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      
      narration += adaptedContent;
    }
    
    return narration;
  }

  private analyzeVisualElements(slides: PPTXSlide[]): VisualElement[] {
    const elements: VisualElement[] = [];
    
    slides.forEach(slide => {
      // Analisar imagens
      slide.images.forEach(image => {
        elements.push({
          type: 'image',
          slideId: slide.id,
          importance: 0.8,
          suggestedAnimation: 'fadeIn',
          enhancementSuggestions: ['Adicionar legenda', 'Melhorar resolução']
        });
      });
      
      // Analisar formas e gráficos
      slide.shapes.forEach(shape => {
        if (shape.type === 'rectangle' || shape.type === 'circle') {
          elements.push({
            type: 'diagram',
            slideId: slide.id,
            importance: 0.6,
            suggestedAnimation: 'slideIn',
            enhancementSuggestions: ['Adicionar sombra', 'Melhorar contraste']
          });
        }
      });
    });
    
    return elements;
  }

  private suggestInteractiveElements(slides: PPTXSlide[]): InteractiveElement[] {
    const elements: InteractiveElement[] = [];
    
    slides.forEach((slide, index) => {
      // Sugerir quiz a cada 3 slides
      if ((index + 1) % 3 === 0) {
        elements.push({
          type: 'quiz',
          slideId: slide.id,
          description: 'Quiz de verificação de conhecimento',
          implementation: 'Adicionar pergunta de múltipla escolha baseada no conteúdo'
        });
      }
      
      // Sugerir elementos clicáveis para slides com muitas imagens
      if (slide.images.length > 2) {
        elements.push({
          type: 'clickable',
          slideId: slide.id,
          description: 'Elementos clicáveis para exploração',
          implementation: 'Tornar imagens clicáveis para mostrar detalhes'
        });
      }
    });
    
    return elements;
  }

  // Conversão para projeto de vídeo
  async convertToVideoProject(
    slides: PPTXSlide[],
    analysis: ContentAnalysis,
    options: ConversionOptions
  ): Promise<ConversionResult> {
    try {
      const startTime = Date.now();
      
      const videoProject = await this.createVideoProject(slides, analysis, options);
      const suggestions = this.generateConversionSuggestions(analysis, options);
      const warnings = this.validateConversion(slides, options);
      
      const processingTime = Date.now() - startTime;
      
      return {
        success: true,
        videoProject,
        analysisReport: analysis,
        suggestions,
        warnings,
        processingTime
      };
    } catch (error) {
      console.error('Erro na conversão:', error);
      return {
        success: false,
        videoProject: {} as VideoProject,
        analysisReport: analysis,
        suggestions: [],
        warnings: [`Erro na conversão: ${error.message}`],
        processingTime: 0
      };
    }
  }

  private async createVideoProject(
    slides: PPTXSlide[],
    analysis: ContentAnalysis,
    options: ConversionOptions
  ): Promise<VideoProject> {
    const scenes: VideoScene[] = [];
    const assets: VideoAsset[] = [];
    
    // Converter cada slide em uma cena
    for (let i = 0; i < slides.length; i++) {
      const slide = slides[i];
      const narration = analysis.suggestedNarration.find(n => n.slideId === slide.id);
      
      const scene: VideoScene = {
        id: `scene-${i + 1}`,
        name: slide.title || `Cena ${i + 1}`,
        duration: slide.duration || 30,
        startTime: i * (slide.duration || 30),
        layers: [],
        transitions: {
          in: options.includeTransitions ? 'fadeIn' : 'none',
          out: options.includeTransitions ? 'fadeOut' : 'none'
        },
        audio: narration ? {
          id: `audio-${i + 1}`,
          type: 'tts',
          text: narration.text,
          voice: narration.voice,
          volume: 0.8,
          startTime: 0,
          duration: slide.duration || 30
        } : undefined
      };
      
      // Adicionar camadas baseadas no conteúdo do slide
      this.addSlideLayersToScene(slide, scene, options);
      
      scenes.push(scene);
    }
    
    const project: VideoProject = {
      id: `project-${Date.now()}`,
      name: 'Projeto PPTX Convertido',
      description: 'Projeto gerado automaticamente a partir de apresentação PPTX',
      duration: scenes.reduce((total, scene) => total + scene.duration, 0),
      resolution: {
        width: options.resolution === '4k' ? 3840 : options.resolution === '1080p' ? 1920 : 1280,
        height: options.resolution === '4k' ? 2160 : options.resolution === '1080p' ? 1080 : 720
      },
      framerate: options.framerate,
      scenes,
      assets,
      settings: {
        quality: options.quality,
        format: options.outputFormat,
        includeSubtitles: options.includeSubtitles,
        customBranding: options.customBranding
      },
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date(),
        version: '1.0',
        tags: analysis.topics.map(t => t.name)
      }
    };
    
    return project;
  }

  private addSlideLayersToScene(slide: PPTXSlide, scene: VideoScene, options: ConversionOptions): void {
    // Adicionar fundo
    scene.layers.push({
      id: `bg-${slide.id}`,
      type: 'background',
      name: 'Fundo',
      visible: true,
      locked: false,
      opacity: 1,
      blendMode: 'normal',
      startTime: 0,
      duration: scene.duration,
      properties: {
        color: slide.background.value,
        type: slide.background.type
      }
    });
    
    // Adicionar título
    if (slide.title) {
      scene.layers.push({
        id: `title-${slide.id}`,
        type: 'text',
        name: 'Título',
        visible: true,
        locked: false,
        opacity: 1,
        blendMode: 'normal',
        startTime: 0,
        duration: scene.duration,
        properties: {
          text: slide.title,
          fontSize: 48,
          fontFamily: 'Inter',
          color: '#333333',
          position: { x: 100, y: 100 },
          animation: options.includeAnimations ? 'slideInFromTop' : 'none'
        }
      });
    }
    
    // Adicionar conteúdo
    if (slide.content) {
      scene.layers.push({
        id: `content-${slide.id}`,
        type: 'text',
        name: 'Conteúdo',
        visible: true,
        locked: false,
        opacity: 1,
        blendMode: 'normal',
        startTime: 1,
        duration: scene.duration - 1,
        properties: {
          text: slide.content,
          fontSize: 24,
          fontFamily: 'Inter',
          color: '#666666',
          position: { x: 100, y: 200 },
          animation: options.includeAnimations ? 'fadeIn' : 'none'
        }
      });
    }
    
    // Adicionar imagens
    slide.images.forEach((image, index) => {
      scene.layers.push({
        id: `image-${slide.id}-${index}`,
        type: 'image',
        name: `Imagem ${index + 1}`,
        visible: true,
        locked: false,
        opacity: 1,
        blendMode: 'normal',
        startTime: 2 + index * 0.5,
        duration: scene.duration - (2 + index * 0.5),
        properties: {
          src: image.src,
          position: image.position,
          animation: options.includeAnimations ? 'zoomIn' : 'none'
        }
      });
    });
  }

  private generateConversionSuggestions(analysis: ContentAnalysis, options: ConversionOptions): string[] {
    const suggestions: string[] = [];
    
    if (analysis.complexity === 'advanced' && options.quality === 'low') {
      suggestions.push('Considere usar qualidade mais alta para conteúdo complexo');
    }
    
    if (analysis.visualElements.length > 10 && !options.includeAnimations) {
      suggestions.push('Adicionar animações pode melhorar a experiência visual');
    }
    
    if (analysis.estimatedDuration > 600 && options.resolution === '4k') {
      suggestions.push('Vídeos longos em 4K podem ter arquivos muito grandes');
    }
    
    if (analysis.targetAudience === 'technical' && !options.includeSubtitles) {
      suggestions.push('Legendas podem ser úteis para conteúdo técnico');
    }
    
    return suggestions;
  }

  private validateConversion(slides: PPTXSlide[], options: ConversionOptions): string[] {
    const warnings: string[] = [];
    
    const hasLargeImages = slides.some(slide => slide.images.length > 5);
    if (hasLargeImages && options.quality === 'ultra') {
      warnings.push('Muitas imagens com qualidade ultra podem causar lentidão');
    }
    
    const hasComplexAnimations = slides.some(slide => slide.animations.length > 3);
    if (hasComplexAnimations && options.framerate === 60) {
      warnings.push('Animações complexas em 60fps podem exigir muito processamento');
    }
    
    const totalDuration = slides.reduce((total, slide) => total + (slide.duration || 30), 0);
    if (totalDuration > 1800) { // 30 minutos
      warnings.push('Vídeos muito longos podem ter problemas de performance');
    }
    
    return warnings;
  }

  // Métodos utilitários
  getSupportedFormats(): string[] {
    return ['pptx', 'ppt', 'odp'];
  }

  getRecommendedSettings(analysis: ContentAnalysis): Partial<ConversionOptions> {
    const settings: Partial<ConversionOptions> = {};
    
    // Baseado na complexidade
    switch (analysis.complexity) {
      case 'basic':
        settings.quality = 'medium';
        settings.resolution = '720p';
        settings.framerate = 24;
        break;
      case 'intermediate':
        settings.quality = 'high';
        settings.resolution = '1080p';
        settings.framerate = 30;
        break;
      case 'advanced':
        settings.quality = 'ultra';
        settings.resolution = '1080p';
        settings.framerate = 30;
        break;
    }
    
    // Baseado no público-alvo
    switch (analysis.targetAudience) {
      case 'general':
        settings.includeSubtitles = true;
        settings.includeAnimations = true;
        break;
      case 'technical':
        settings.includeSubtitles = true;
        settings.includeAnimations = false;
        break;
      case 'executive':
        settings.includeSubtitles = false;
        settings.includeAnimations = true;
        break;
    }
    
    return settings;
  }

  async getProcessingStatus(jobId: string): Promise<{ progress: number; status: string; eta: number }> {
    const job = this.processingQueue.get(jobId);
    if (!job) {
      throw new Error('Job não encontrado');
    }
    
    return {
      progress: job.progress || 0,
      status: job.status || 'pending',
      eta: job.eta || 0
    };
  }
}

export default PPTXAnalysisSystem;