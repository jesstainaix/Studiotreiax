import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

// Interfaces
export interface ContentTag {
  id: string;
  name: string;
  category: string;
  confidence: number;
  color: string;
  description?: string;
}

export interface ContentCategory {
  id: string;
  name: string;
  description: string;
  tags: ContentTag[];
  color: string;
  icon: string;
}

export interface VideoSegment {
  id: string;
  startTime: number;
  endTime: number;
  duration: number;
  categories: ContentCategory[];
  tags: ContentTag[];
  confidence: number;
  thumbnail?: string;
  description?: string;
}

export interface CategorizationResult {
  videoId: string;
  segments: VideoSegment[];
  overallCategories: ContentCategory[];
  overallTags: ContentTag[];
  processingTime: number;
  confidence: number;
}

export interface CategorizationSettings {
  enableAutoTagging: boolean;
  confidenceThreshold: number;
  maxTagsPerSegment: number;
  enableCustomCategories: boolean;
  customCategories: ContentCategory[];
  analysisDepth: 'basic' | 'detailed' | 'comprehensive';
}

// Store
interface AIContentCategorizationStore {
  // Estado
  isAnalyzing: boolean;
  currentAnalysis: CategorizationResult | null;
  analysisHistory: CategorizationResult[];
  settings: CategorizationSettings;
  availableCategories: ContentCategory[];
  availableTags: ContentTag[];
  
  // Ações
  analyzeContent: (videoId: string, videoUrl: string) => Promise<CategorizationResult>;
  updateSettings: (settings: Partial<CategorizationSettings>) => void;
  addCustomCategory: (category: ContentCategory) => void;
  addCustomTag: (tag: ContentTag) => void;
  removeCustomCategory: (categoryId: string) => void;
  removeCustomTag: (tagId: string) => void;
  exportCategorization: (result: CategorizationResult) => Promise<string>;
  clearHistory: () => void;
}

// Categorias padrão
const defaultCategories: ContentCategory[] = [
  {
    id: 'action',
    name: 'Ação',
    description: 'Cenas com movimento rápido, esportes, atividades dinâmicas',
    tags: [],
    color: '#ef4444',
    icon: 'Zap'
  },
  {
    id: 'dialogue',
    name: 'Diálogo',
    description: 'Conversas, entrevistas, apresentações',
    tags: [],
    color: '#3b82f6',
    icon: 'MessageCircle'
  },
  {
    id: 'nature',
    name: 'Natureza',
    description: 'Paisagens, animais, ambientes naturais',
    tags: [],
    color: '#22c55e',
    icon: 'Trees'
  },
  {
    id: 'technology',
    name: 'Tecnologia',
    description: 'Dispositivos, software, inovação',
    tags: [],
    color: '#8b5cf6',
    icon: 'Cpu'
  },
  {
    id: 'people',
    name: 'Pessoas',
    description: 'Rostos, grupos, interações humanas',
    tags: [],
    color: '#f59e0b',
    icon: 'Users'
  },
  {
    id: 'music',
    name: 'Música',
    description: 'Performances musicais, instrumentos, dança',
    tags: [],
    color: '#ec4899',
    icon: 'Music'
  }
];

// Tags padrão
const defaultTags: ContentTag[] = [
  { id: 'fast-paced', name: 'Ritmo Acelerado', category: 'action', confidence: 0.8, color: '#ef4444' },
  { id: 'slow-motion', name: 'Câmera Lenta', category: 'action', confidence: 0.9, color: '#ef4444' },
  { id: 'interview', name: 'Entrevista', category: 'dialogue', confidence: 0.9, color: '#3b82f6' },
  { id: 'presentation', name: 'Apresentação', category: 'dialogue', confidence: 0.8, color: '#3b82f6' },
  { id: 'landscape', name: 'Paisagem', category: 'nature', confidence: 0.9, color: '#22c55e' },
  { id: 'wildlife', name: 'Vida Selvagem', category: 'nature', confidence: 0.8, color: '#22c55e' },
  { id: 'close-up', name: 'Close-up', category: 'people', confidence: 0.7, color: '#f59e0b' },
  { id: 'group-shot', name: 'Grupo', category: 'people', confidence: 0.8, color: '#f59e0b' },
  { id: 'gadget', name: 'Gadget', category: 'technology', confidence: 0.8, color: '#8b5cf6' },
  { id: 'software', name: 'Software', category: 'technology', confidence: 0.7, color: '#8b5cf6' },
  { id: 'live-performance', name: 'Performance Ao Vivo', category: 'music', confidence: 0.9, color: '#ec4899' },
  { id: 'studio-recording', name: 'Gravação de Estúdio', category: 'music', confidence: 0.8, color: '#ec4899' }
];

// Configurações padrão
const defaultSettings: CategorizationSettings = {
  enableAutoTagging: true,
  confidenceThreshold: 0.7,
  maxTagsPerSegment: 5,
  enableCustomCategories: true,
  customCategories: [],
  analysisDepth: 'detailed'
};

// Funções utilitárias
const generateSegmentId = (): string => {
  return `segment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

const calculateOverallConfidence = (segments: VideoSegment[]): number => {
  if (segments.length === 0) return 0;
  const totalConfidence = segments.reduce((sum, segment) => sum + segment.confidence, 0);
  return totalConfidence / segments.length;
};

const extractOverallCategories = (segments: VideoSegment[]): ContentCategory[] => {
  const categoryMap = new Map<string, ContentCategory>();
  
  segments.forEach(segment => {
    segment.categories.forEach(category => {
      if (!categoryMap.has(category.id)) {
        categoryMap.set(category.id, category);
      }
    });
  });
  
  return Array.from(categoryMap.values());
};

const extractOverallTags = (segments: VideoSegment[]): ContentTag[] => {
  const tagMap = new Map<string, ContentTag>();
  
  segments.forEach(segment => {
    segment.tags.forEach(tag => {
      if (!tagMap.has(tag.id)) {
        tagMap.set(tag.id, tag);
      }
    });
  });
  
  return Array.from(tagMap.values());
};

// Simulação de análise de conteúdo
const simulateContentAnalysis = async (
  videoId: string,
  videoUrl: string,
  settings: CategorizationSettings,
  categories: ContentCategory[],
  tags: ContentTag[]
): Promise<CategorizationResult> => {
  const startTime = Date.now();
  
  // Simular tempo de processamento baseado na profundidade
  const processingTime = {
    basic: 2000,
    detailed: 4000,
    comprehensive: 6000
  }[settings.analysisDepth];
  
  await new Promise(resolve => setTimeout(resolve, processingTime));
  
  // Gerar segmentos simulados
  const segments: VideoSegment[] = [];
  const videoDuration = 300; // 5 minutos simulados
  const segmentCount = Math.floor(videoDuration / 30); // Segmentos de 30 segundos
  
  for (let i = 0; i < segmentCount; i++) {
    const startTime = i * 30;
    const endTime = Math.min((i + 1) * 30, videoDuration);
    
    // Selecionar categorias aleatórias
    const segmentCategories = categories
      .filter(() => Math.random() > 0.6)
      .slice(0, 2);
    
    // Selecionar tags baseadas nas categorias
    const segmentTags = tags
      .filter(tag => 
        segmentCategories.some(cat => cat.id === tag.category) &&
        tag.confidence >= settings.confidenceThreshold
      )
      .slice(0, settings.maxTagsPerSegment);
    
    segments.push({
      id: generateSegmentId(),
      startTime,
      endTime,
      duration: endTime - startTime,
      categories: segmentCategories,
      tags: segmentTags,
      confidence: 0.7 + Math.random() * 0.3,
      description: `Segmento ${i + 1}: ${segmentCategories.map(c => c.name).join(', ')}`
    });
  }
  
  const result: CategorizationResult = {
    videoId,
    segments,
    overallCategories: extractOverallCategories(segments),
    overallTags: extractOverallTags(segments),
    processingTime: Date.now() - startTime,
    confidence: calculateOverallConfidence(segments)
  };
  
  return result;
};

// Store principal
export const useAIContentCategorization = create<AIContentCategorizationStore>()(devtools(
  (set, get) => ({
    // Estado inicial
    isAnalyzing: false,
    currentAnalysis: null,
    analysisHistory: [],
    settings: defaultSettings,
    availableCategories: defaultCategories,
    availableTags: defaultTags,
    
    // Analisar conteúdo
    analyzeContent: async (videoId: string, videoUrl: string) => {
      set({ isAnalyzing: true });
      
      try {
        const { settings, availableCategories, availableTags } = get();
        const allCategories = [...availableCategories, ...settings.customCategories];
        
        const result = await simulateContentAnalysis(
          videoId,
          videoUrl,
          settings,
          allCategories,
          availableTags
        );
        
        set(state => ({
          isAnalyzing: false,
          currentAnalysis: result,
          analysisHistory: [result, ...state.analysisHistory.slice(0, 9)] // Manter últimas 10
        }));
        
        return result;
      } catch (error) {
        set({ isAnalyzing: false });
        throw error;
      }
    },
    
    // Atualizar configurações
    updateSettings: (newSettings: Partial<CategorizationSettings>) => {
      set(state => ({
        settings: { ...state.settings, ...newSettings }
      }));
    },
    
    // Adicionar categoria customizada
    addCustomCategory: (category: ContentCategory) => {
      set(state => ({
        settings: {
          ...state.settings,
          customCategories: [...state.settings.customCategories, category]
        }
      }));
    },
    
    // Adicionar tag customizada
    addCustomTag: (tag: ContentTag) => {
      set(state => ({
        availableTags: [...state.availableTags, tag]
      }));
    },
    
    // Remover categoria customizada
    removeCustomCategory: (categoryId: string) => {
      set(state => ({
        settings: {
          ...state.settings,
          customCategories: state.settings.customCategories.filter(c => c.id !== categoryId)
        }
      }));
    },
    
    // Remover tag customizada
    removeCustomTag: (tagId: string) => {
      set(state => ({
        availableTags: state.availableTags.filter(t => t.id !== tagId)
      }));
    },
    
    // Exportar categorização
    exportCategorization: async (result: CategorizationResult) => {
      // Simular export
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const exportData = {
        videoId: result.videoId,
        timestamp: new Date().toISOString(),
        categories: result.overallCategories,
        tags: result.overallTags,
        segments: result.segments,
        metadata: {
          confidence: result.confidence,
          processingTime: result.processingTime
        }
      };
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json'
      });
      
      const url = URL.createObjectURL(blob);
      return url;
    },
    
    // Limpar histórico
    clearHistory: () => {
      set({ analysisHistory: [] });
    }
  }),
  { name: 'ai-content-categorization' }
));

// Hook para estatísticas
export const useCategorizationStats = () => {
  const { analysisHistory } = useAIContentCategorization();
  
  const stats = {
    totalAnalyses: analysisHistory.length,
    averageConfidence: analysisHistory.length > 0 
      ? analysisHistory.reduce((sum, analysis) => sum + analysis.confidence, 0) / analysisHistory.length
      : 0,
    mostUsedCategories: analysisHistory
      .flatMap(analysis => analysis.overallCategories)
      .reduce((acc, category) => {
        acc[category.name] = (acc[category.name] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    averageProcessingTime: analysisHistory.length > 0
      ? analysisHistory.reduce((sum, analysis) => sum + analysis.processingTime, 0) / analysisHistory.length
      : 0
  };
  
  return stats;
};

export default useAIContentCategorization;