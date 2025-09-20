import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

// Interfaces
export interface ThumbnailTemplate {
  id: string;
  name: string;
  description: string;
  style: 'modern' | 'classic' | 'cinematic' | 'minimal' | 'vibrant' | 'dark';
  layout: 'center' | 'split' | 'overlay' | 'grid' | 'banner';
  textPosition: 'top' | 'bottom' | 'center' | 'left' | 'right';
  colorScheme: string[];
  fontFamily: string;
  preview: string;
}

export interface ThumbnailElement {
  id: string;
  type: 'text' | 'image' | 'shape' | 'icon';
  content: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  style: {
    fontSize?: number;
    fontWeight?: string;
    color?: string;
    backgroundColor?: string;
    borderRadius?: number;
    opacity?: number;
    rotation?: number;
  };
  animation?: {
    type: 'fade' | 'slide' | 'zoom' | 'bounce';
    duration: number;
    delay: number;
  };
}

export interface GeneratedThumbnail {
  id: string;
  videoId: string;
  timestamp: number;
  title: string;
  description?: string;
  template: ThumbnailTemplate;
  elements: ThumbnailElement[];
  dimensions: { width: number; height: number };
  quality: 'low' | 'medium' | 'high' | 'ultra';
  format: 'jpg' | 'png' | 'webp';
  url: string;
  confidence: number;
  generatedAt: Date;
  metadata: {
    sceneType: string;
    dominantColors: string[];
    faceCount: number;
    textDetected: boolean;
    emotionScore: number;
  };
}

export interface ThumbnailGenerationSettings {
  autoGenerate: boolean;
  generateOnKeyframes: boolean;
  generateOnSceneChange: boolean;
  maxThumbnailsPerVideo: number;
  preferredDimensions: { width: number; height: number };
  preferredFormat: 'jpg' | 'png' | 'webp';
  quality: 'low' | 'medium' | 'high' | 'ultra';
  includeTitle: boolean;
  includeTimestamp: boolean;
  preferredStyles: string[];
  customTemplates: ThumbnailTemplate[];
  aiEnhancement: boolean;
  faceDetection: boolean;
  textExtraction: boolean;
}

export interface ThumbnailAnalysis {
  videoId: string;
  keyframes: number[];
  sceneChanges: number[];
  faceDetections: Array<{
    timestamp: number;
    faces: Array<{
      confidence: number;
      emotion: string;
      position: { x: number; y: number; width: number; height: number };
    }>;
  }>;
  dominantColors: Array<{
    timestamp: number;
    colors: string[];
  }>;
  textDetections: Array<{
    timestamp: number;
    text: string;
    confidence: number;
  }>;
  recommendations: Array<{
    timestamp: number;
    reason: string;
    confidence: number;
  }>;
}

// Store
interface AIThumbnailGenerationStore {
  // Estado
  isGenerating: boolean;
  isAnalyzing: boolean;
  currentAnalysis: ThumbnailAnalysis | null;
  generatedThumbnails: GeneratedThumbnail[];
  selectedThumbnails: string[];
  settings: ThumbnailGenerationSettings;
  availableTemplates: ThumbnailTemplate[];
  
  // Ações
  analyzeVideo: (videoId: string, videoUrl: string) => Promise<ThumbnailAnalysis>;
  generateThumbnails: (videoId: string, timestamps?: number[]) => Promise<GeneratedThumbnail[]>;
  generateSingleThumbnail: (videoId: string, timestamp: number, template?: ThumbnailTemplate) => Promise<GeneratedThumbnail>;
  updateSettings: (settings: Partial<ThumbnailGenerationSettings>) => void;
  addCustomTemplate: (template: ThumbnailTemplate) => void;
  removeCustomTemplate: (templateId: string) => void;
  selectThumbnail: (thumbnailId: string) => void;
  deselectThumbnail: (thumbnailId: string) => void;
  deleteThumbnail: (thumbnailId: string) => void;
  exportThumbnails: (thumbnailIds: string[]) => Promise<string[]>;
  clearThumbnails: () => void;
}

// Templates padrão
const defaultTemplates: ThumbnailTemplate[] = [
  {
    id: 'modern-center',
    name: 'Moderno Central',
    description: 'Layout moderno com foco central',
    style: 'modern',
    layout: 'center',
    textPosition: 'bottom',
    colorScheme: ['#3b82f6', '#1e40af', '#ffffff'],
    fontFamily: 'Inter',
    preview: '/thumbnails/templates/modern-center.jpg'
  },
  {
    id: 'cinematic-overlay',
    name: 'Cinemático com Overlay',
    description: 'Estilo cinematográfico com sobreposição de texto',
    style: 'cinematic',
    layout: 'overlay',
    textPosition: 'center',
    colorScheme: ['#000000', '#ffffff', '#f59e0b'],
    fontFamily: 'Roboto',
    preview: '/thumbnails/templates/cinematic-overlay.jpg'
  },
  {
    id: 'vibrant-split',
    name: 'Vibrante Dividido',
    description: 'Layout dividido com cores vibrantes',
    style: 'vibrant',
    layout: 'split',
    textPosition: 'left',
    colorScheme: ['#ef4444', '#f97316', '#eab308'],
    fontFamily: 'Poppins',
    preview: '/thumbnails/templates/vibrant-split.jpg'
  },
  {
    id: 'minimal-clean',
    name: 'Minimalista Limpo',
    description: 'Design minimalista e limpo',
    style: 'minimal',
    layout: 'center',
    textPosition: 'top',
    colorScheme: ['#ffffff', '#f3f4f6', '#374151'],
    fontFamily: 'Source Sans Pro',
    preview: '/thumbnails/templates/minimal-clean.jpg'
  },
  {
    id: 'dark-gaming',
    name: 'Gaming Escuro',
    description: 'Estilo gaming com tema escuro',
    style: 'dark',
    layout: 'banner',
    textPosition: 'center',
    colorScheme: ['#1f2937', '#374151', '#10b981'],
    fontFamily: 'Orbitron',
    preview: '/thumbnails/templates/dark-gaming.jpg'
  },
  {
    id: 'classic-professional',
    name: 'Clássico Profissional',
    description: 'Layout clássico para conteúdo profissional',
    style: 'classic',
    layout: 'grid',
    textPosition: 'bottom',
    colorScheme: ['#1e40af', '#3b82f6', '#ffffff'],
    fontFamily: 'Times New Roman',
    preview: '/thumbnails/templates/classic-professional.jpg'
  }
];

// Configurações padrão
const defaultSettings: ThumbnailGenerationSettings = {
  autoGenerate: true,
  generateOnKeyframes: true,
  generateOnSceneChange: true,
  maxThumbnailsPerVideo: 10,
  preferredDimensions: { width: 1280, height: 720 },
  preferredFormat: 'jpg',
  quality: 'high',
  includeTitle: true,
  includeTimestamp: false,
  preferredStyles: ['modern', 'cinematic'],
  customTemplates: [],
  aiEnhancement: true,
  faceDetection: true,
  textExtraction: true
};

// Funções utilitárias
const generateThumbnailId = (): string => {
  return `thumb_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

const formatTimestamp = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
};

const extractDominantColors = (imageData: ImageData): string[] => {
  // Simulação de extração de cores dominantes
  const colors = [
    '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
    '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1'
  ];
  return colors.slice(0, 3);
};

const detectFaces = async (imageUrl: string): Promise<any[]> => {
  // Simulação de detecção de rostos
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const faceCount = Math.floor(Math.random() * 4);
  const faces = [];
  
  for (let i = 0; i < faceCount; i++) {
    faces.push({
      confidence: 0.8 + Math.random() * 0.2,
      emotion: ['happy', 'neutral', 'surprised', 'focused'][Math.floor(Math.random() * 4)],
      position: {
        x: Math.random() * 0.6,
        y: Math.random() * 0.6,
        width: 0.1 + Math.random() * 0.2,
        height: 0.1 + Math.random() * 0.2
      }
    });
  }
  
  return faces;
};

const extractText = async (imageUrl: string): Promise<string[]> => {
  // Simulação de extração de texto
  await new Promise(resolve => setTimeout(resolve, 300));
  
  const possibleTexts = [
    'TUTORIAL', 'REVIEW', 'GAMEPLAY', 'VLOG', 'NEWS',
    'LIVE', 'STREAM', 'EPISODE', 'PART 1', 'FINALE'
  ];
  
  return Math.random() > 0.7 ? [possibleTexts[Math.floor(Math.random() * possibleTexts.length)]] : [];
};

// Simulação de análise de vídeo
const simulateVideoAnalysis = async (
  videoId: string,
  videoUrl: string,
  settings: ThumbnailGenerationSettings
): Promise<ThumbnailAnalysis> => {
  const videoDuration = 300; // 5 minutos simulados
  
  // Gerar keyframes (a cada 10 segundos)
  const keyframes: number[] = [];
  for (let i = 0; i < videoDuration; i += 10) {
    keyframes.push(i);
  }
  
  // Gerar mudanças de cena (aleatórias)
  const sceneChanges: number[] = [];
  for (let i = 0; i < videoDuration; i += 15 + Math.random() * 20) {
    sceneChanges.push(Math.floor(i));
  }
  
  // Simular detecções de rosto
  const faceDetections = [];
  for (const timestamp of keyframes) {
    if (Math.random() > 0.4) {
      const faces = await detectFaces(`${videoUrl}?t=${timestamp}`);
      faceDetections.push({ timestamp, faces });
    }
  }
  
  // Simular cores dominantes
  const dominantColors = keyframes.map(timestamp => ({
    timestamp,
    colors: extractDominantColors(new ImageData(1, 1)) // Simulação
  }));
  
  // Simular detecções de texto
  const textDetections = [];
  for (const timestamp of keyframes) {
    if (Math.random() > 0.6) {
      const texts = await extractText(`${videoUrl}?t=${timestamp}`);
      if (texts.length > 0) {
        textDetections.push({
          timestamp,
          text: texts[0],
          confidence: 0.8 + Math.random() * 0.2
        });
      }
    }
  }
  
  // Gerar recomendações
  const recommendations = [];
  
  // Recomendações baseadas em rostos
  faceDetections.forEach(detection => {
    if (detection.faces.length > 0) {
      const avgEmotion = detection.faces.reduce((sum, face) => {
        return sum + (face.emotion === 'happy' ? 1 : 0.5);
      }, 0) / detection.faces.length;
      
      recommendations.push({
        timestamp: detection.timestamp,
        reason: `${detection.faces.length} rosto(s) detectado(s) com boa expressão`,
        confidence: avgEmotion
      });
    }
  });
  
  // Recomendações baseadas em mudanças de cena
  sceneChanges.forEach(timestamp => {
    recommendations.push({
      timestamp,
      reason: 'Mudança de cena detectada',
      confidence: 0.7
    });
  });
  
  // Ordenar recomendações por confiança
  recommendations.sort((a, b) => b.confidence - a.confidence);
  
  return {
    videoId,
    keyframes,
    sceneChanges,
    faceDetections,
    dominantColors,
    textDetections,
    recommendations: recommendations.slice(0, settings.maxThumbnailsPerVideo)
  };
};

// Simulação de geração de thumbnail
const simulateThumbnailGeneration = async (
  videoId: string,
  timestamp: number,
  template: ThumbnailTemplate,
  settings: ThumbnailGenerationSettings,
  analysis?: ThumbnailAnalysis
): Promise<GeneratedThumbnail> => {
  // Simular tempo de geração
  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
  
  // Encontrar dados da análise para este timestamp
  const colorData = analysis?.dominantColors.find(c => Math.abs(c.timestamp - timestamp) < 5);
  const faceData = analysis?.faceDetections.find(f => Math.abs(f.timestamp - timestamp) < 5);
  const textData = analysis?.textDetections.find(t => Math.abs(t.timestamp - timestamp) < 5);
  
  // Gerar elementos baseados no template
  const elements: ThumbnailElement[] = [];
  
  // Adicionar título se habilitado
  if (settings.includeTitle) {
    elements.push({
      id: 'title',
      type: 'text',
      content: textData?.text || 'Video Title',
      position: { x: 50, y: template.textPosition === 'top' ? 20 : 80 },
      size: { width: 80, height: 15 },
      style: {
        fontSize: 48,
        fontWeight: 'bold',
        color: template.colorScheme[2] || '#ffffff'
      }
    });
  }
  
  // Adicionar timestamp se habilitado
  if (settings.includeTimestamp) {
    elements.push({
      id: 'timestamp',
      type: 'text',
      content: formatTimestamp(timestamp),
      position: { x: 85, y: 5 },
      size: { width: 12, height: 5 },
      style: {
        fontSize: 16,
        color: '#ffffff',
        backgroundColor: 'rgba(0,0,0,0.7)',
        borderRadius: 4
      }
    });
  }
  
  // Adicionar elementos decorativos baseados no template
  if (template.layout === 'overlay') {
    elements.push({
      id: 'overlay',
      type: 'shape',
      content: '',
      position: { x: 0, y: 70 },
      size: { width: 100, height: 30 },
      style: {
        backgroundColor: 'rgba(0,0,0,0.5)'
      }
    });
  }
  
  const thumbnail: GeneratedThumbnail = {
    id: generateThumbnailId(),
    videoId,
    timestamp,
    title: textData?.text || `Thumbnail ${formatTimestamp(timestamp)}`,
    template,
    elements,
    dimensions: settings.preferredDimensions,
    quality: settings.quality,
    format: settings.preferredFormat,
    url: `https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=video%20thumbnail%20${template.style}%20style&image_size=landscape_16_9`,
    confidence: 0.7 + Math.random() * 0.3,
    generatedAt: new Date(),
    metadata: {
      sceneType: template.style,
      dominantColors: colorData?.colors || ['#3b82f6', '#1e40af'],
      faceCount: faceData?.faces.length || 0,
      textDetected: !!textData,
      emotionScore: faceData?.faces.reduce((sum, face) => {
        return sum + (face.emotion === 'happy' ? 1 : 0.5);
      }, 0) / (faceData?.faces.length || 1) || 0.5
    }
  };
  
  return thumbnail;
};

// Store principal
export const useAIThumbnailGeneration = create<AIThumbnailGenerationStore>()(devtools(
  (set, get) => ({
    // Estado inicial
    isGenerating: false,
    isAnalyzing: false,
    currentAnalysis: null,
    generatedThumbnails: [],
    selectedThumbnails: [],
    settings: defaultSettings,
    availableTemplates: defaultTemplates,
    
    // Analisar vídeo
    analyzeVideo: async (videoId: string, videoUrl: string) => {
      set({ isAnalyzing: true });
      
      try {
        const { settings } = get();
        const analysis = await simulateVideoAnalysis(videoId, videoUrl, settings);
        
        set({ 
          isAnalyzing: false,
          currentAnalysis: analysis
        });
        
        return analysis;
      } catch (error) {
        set({ isAnalyzing: false });
        throw error;
      }
    },
    
    // Gerar thumbnails
    generateThumbnails: async (videoId: string, timestamps?: number[]) => {
      set({ isGenerating: true });
      
      try {
        const { settings, availableTemplates, currentAnalysis } = get();
        const allTemplates = [...availableTemplates, ...settings.customTemplates];
        
        let targetTimestamps = timestamps;
        if (!targetTimestamps && currentAnalysis) {
          // Usar recomendações da análise
          targetTimestamps = currentAnalysis.recommendations
            .slice(0, settings.maxThumbnailsPerVideo)
            .map(rec => rec.timestamp);
        }
        
        if (!targetTimestamps || targetTimestamps.length === 0) {
          // Fallback para keyframes
          targetTimestamps = [30, 60, 120, 180, 240]; // Timestamps padrão
        }
        
        const thumbnails: GeneratedThumbnail[] = [];
        
        for (const timestamp of targetTimestamps) {
          // Selecionar template baseado nas preferências
          const preferredTemplates = allTemplates.filter(t => 
            settings.preferredStyles.includes(t.style)
          );
          const template = preferredTemplates.length > 0 
            ? preferredTemplates[Math.floor(Math.random() * preferredTemplates.length)]
            : allTemplates[Math.floor(Math.random() * allTemplates.length)];
          
          const thumbnail = await simulateThumbnailGeneration(
            videoId,
            timestamp,
            template,
            settings,
            currentAnalysis || undefined
          );
          
          thumbnails.push(thumbnail);
        }
        
        set(state => ({
          isGenerating: false,
          generatedThumbnails: [...state.generatedThumbnails, ...thumbnails]
        }));
        
        return thumbnails;
      } catch (error) {
        set({ isGenerating: false });
        throw error;
      }
    },
    
    // Gerar thumbnail único
    generateSingleThumbnail: async (videoId: string, timestamp: number, template?: ThumbnailTemplate) => {
      const { settings, availableTemplates, currentAnalysis } = get();
      const allTemplates = [...availableTemplates, ...settings.customTemplates];
      
      const selectedTemplate = template || allTemplates[0];
      
      const thumbnail = await simulateThumbnailGeneration(
        videoId,
        timestamp,
        selectedTemplate,
        settings,
        currentAnalysis || undefined
      );
      
      set(state => ({
        generatedThumbnails: [...state.generatedThumbnails, thumbnail]
      }));
      
      return thumbnail;
    },
    
    // Atualizar configurações
    updateSettings: (newSettings: Partial<ThumbnailGenerationSettings>) => {
      set(state => ({
        settings: { ...state.settings, ...newSettings }
      }));
    },
    
    // Adicionar template customizado
    addCustomTemplate: (template: ThumbnailTemplate) => {
      set(state => ({
        settings: {
          ...state.settings,
          customTemplates: [...state.settings.customTemplates, template]
        }
      }));
    },
    
    // Remover template customizado
    removeCustomTemplate: (templateId: string) => {
      set(state => ({
        settings: {
          ...state.settings,
          customTemplates: state.settings.customTemplates.filter(t => t.id !== templateId)
        }
      }));
    },
    
    // Selecionar thumbnail
    selectThumbnail: (thumbnailId: string) => {
      set(state => ({
        selectedThumbnails: [...state.selectedThumbnails, thumbnailId]
      }));
    },
    
    // Desselecionar thumbnail
    deselectThumbnail: (thumbnailId: string) => {
      set(state => ({
        selectedThumbnails: state.selectedThumbnails.filter(id => id !== thumbnailId)
      }));
    },
    
    // Deletar thumbnail
    deleteThumbnail: (thumbnailId: string) => {
      set(state => ({
        generatedThumbnails: state.generatedThumbnails.filter(t => t.id !== thumbnailId),
        selectedThumbnails: state.selectedThumbnails.filter(id => id !== thumbnailId)
      }));
    },
    
    // Exportar thumbnails
    exportThumbnails: async (thumbnailIds: string[]) => {
      const { generatedThumbnails } = get();
      const thumbnailsToExport = generatedThumbnails.filter(t => 
        thumbnailIds.includes(t.id)
      );
      
      // Simular export
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return thumbnailsToExport.map(thumbnail => thumbnail.url);
    },
    
    // Limpar thumbnails
    clearThumbnails: () => {
      set({ 
        generatedThumbnails: [],
        selectedThumbnails: [],
        currentAnalysis: null
      });
    }
  }),
  { name: 'ai-thumbnail-generation' }
));

// Hook para estatísticas
export const useThumbnailStats = () => {
  const { generatedThumbnails } = useAIThumbnailGeneration();
  
  const stats = {
    totalThumbnails: generatedThumbnails.length,
    averageConfidence: generatedThumbnails.length > 0
      ? generatedThumbnails.reduce((sum, thumb) => sum + thumb.confidence, 0) / generatedThumbnails.length
      : 0,
    templateUsage: generatedThumbnails.reduce((acc, thumb) => {
      acc[thumb.template.name] = (acc[thumb.template.name] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    qualityDistribution: generatedThumbnails.reduce((acc, thumb) => {
      acc[thumb.quality] = (acc[thumb.quality] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    averageEmotionScore: generatedThumbnails.length > 0
      ? generatedThumbnails.reduce((sum, thumb) => sum + thumb.metadata.emotionScore, 0) / generatedThumbnails.length
      : 0
  };
  
  return stats;
};

export default useAIThumbnailGeneration;