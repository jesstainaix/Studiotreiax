import { create } from 'zustand';

// Interfaces para sugestões inteligentes
export interface EditingSuggestion {
  id: string;
  type: 'cut' | 'transition' | 'effect' | 'audio' | 'color' | 'speed' | 'text' | 'layout';
  title: string;
  description: string;
  confidence: number; // 0-1
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  timestamp?: number;
  duration?: number;
  clipId?: string;
  trackId?: string;
  parameters?: Record<string, any>;
  preview?: {
    before: string;
    after: string;
  };
  reasoning: string;
  impact: {
    engagement: number;
    quality: number;
    accessibility: number;
    performance: number;
  };
  tags: string[];
  createdAt: number;
  appliedAt?: number;
  status: 'pending' | 'applied' | 'rejected' | 'expired';
}

export interface EditingRule {
  id: string;
  name: string;
  description: string;
  category: string;
  conditions: {
    contentType?: string[];
    duration?: { min?: number; max?: number };
    quality?: { min?: number; max?: number };
    audioLevel?: { min?: number; max?: number };
    sceneChange?: boolean;
    silence?: { duration: number };
    motion?: { level: 'low' | 'medium' | 'high' };
    faces?: { count: number };
    text?: { present: boolean };
    custom?: (context: any) => boolean;
  };
  action: {
    type: EditingSuggestion['type'];
    parameters: Record<string, any>;
    priority: EditingSuggestion['priority'];
  };
  enabled: boolean;
  weight: number;
}

export interface ContentContext {
  clipId: string;
  type: 'video' | 'audio' | 'image' | 'text';
  duration: number;
  timestamp: number;
  metadata: {
    resolution?: { width: number; height: number };
    fps?: number;
    bitrate?: number;
    audioChannels?: number;
    audioSampleRate?: number;
    fileSize?: number;
    format?: string;
  };
  analysis: {
    scenes?: Array<{ start: number; end: number; type: string }>;
    faces?: Array<{ timestamp: number; count: number; emotions: string[] }>;
    objects?: Array<{ timestamp: number; objects: string[]; confidence: number }>;
    text?: Array<{ timestamp: number; text: string; confidence: number }>;
    audio?: {
      volume: number[];
      silence: Array<{ start: number; end: number }>;
      speech: Array<{ start: number; end: number; confidence: number }>;
      music: Array<{ start: number; end: number; genre?: string }>;
    };
    motion?: Array<{ timestamp: number; level: number; direction?: string }>;
    quality?: {
      sharpness: number;
      brightness: number;
      contrast: number;
      saturation: number;
      noise: number;
    };
    engagement?: {
      predicted: number;
      factors: string[];
    };
  };
  relationships: {
    previousClip?: string;
    nextClip?: string;
    trackClips?: string[];
    dependencies?: string[];
  };
}

export interface SuggestionFilter {
  types?: EditingSuggestion['type'][];
  priorities?: EditingSuggestion['priority'][];
  categories?: string[];
  minConfidence?: number;
  maxAge?: number; // em milissegundos
  status?: EditingSuggestion['status'][];
  tags?: string[];
  clipIds?: string[];
  trackIds?: string[];
}

export interface SuggestionBatch {
  id: string;
  name: string;
  description: string;
  suggestions: string[]; // IDs das sugestões
  estimatedTime: number;
  impact: {
    engagement: number;
    quality: number;
    accessibility: number;
  };
  createdAt: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

export interface SmartEditingState {
  // Estado
  suggestions: EditingSuggestion[];
  rules: EditingRule[];
  contexts: Record<string, ContentContext>;
  batches: SuggestionBatch[];
  
  // Configurações
  autoGenerate: boolean;
  autoApply: boolean;
  confidenceThreshold: number;
  maxSuggestions: number;
  enabledCategories: string[];
  
  // UI
  selectedSuggestion: string | null;
  filterOptions: SuggestionFilter;
  sortBy: 'confidence' | 'priority' | 'timestamp' | 'impact';
  sortOrder: 'asc' | 'desc';
  groupBy: 'type' | 'category' | 'priority' | 'clip' | 'none';
  showPreview: boolean;
  
  // Status
  isAnalyzing: boolean;
  isGenerating: boolean;
  isApplying: boolean;
  lastAnalysis: number | null;
  
  // Estatísticas
  stats: {
    totalGenerated: number;
    totalApplied: number;
    totalRejected: number;
    averageConfidence: number;
    categoryBreakdown: Record<string, number>;
    impactMetrics: {
      engagement: number;
      quality: number;
      accessibility: number;
    };
  };
}

export interface SmartEditingActions {
  // Análise e geração
  analyzeContent: (clipIds: string[]) => Promise<void>;
  generateSuggestions: (context: ContentContext) => Promise<EditingSuggestion[]>;
  refreshSuggestions: (clipIds?: string[]) => Promise<void>;
  
  // Gerenciamento de sugestões
  applySuggestion: (suggestionId: string) => Promise<void>;
  rejectSuggestion: (suggestionId: string) => void;
  batchApply: (suggestionIds: string[]) => Promise<void>;
  clearSuggestions: (filter?: SuggestionFilter) => void;
  
  // Regras
  addRule: (rule: Omit<EditingRule, 'id'>) => void;
  updateRule: (ruleId: string, updates: Partial<EditingRule>) => void;
  removeRule: (ruleId: string) => void;
  toggleRule: (ruleId: string) => void;
  
  // Contexto
  updateContext: (clipId: string, context: Partial<ContentContext>) => void;
  removeContext: (clipId: string) => void;
  
  // Batches
  createBatch: (name: string, suggestionIds: string[]) => string;
  processBatch: (batchId: string) => Promise<void>;
  removeBatch: (batchId: string) => void;
  
  // Filtros e ordenação
  setFilter: (filter: Partial<SuggestionFilter>) => void;
  setSorting: (sortBy: SmartEditingState['sortBy'], order: SmartEditingState['sortOrder']) => void;
  setGrouping: (groupBy: SmartEditingState['groupBy']) => void;
  
  // UI
  selectSuggestion: (suggestionId: string | null) => void;
  togglePreview: () => void;
  
  // Configurações
  updateSettings: (settings: Partial<Pick<SmartEditingState, 'autoGenerate' | 'autoApply' | 'confidenceThreshold' | 'maxSuggestions' | 'enabledCategories'>>) => void;
  
  // Utilitários
  getSuggestionsByClip: (clipId: string) => EditingSuggestion[];
  getSuggestionsByType: (type: EditingSuggestion['type']) => EditingSuggestion[];
  getFilteredSuggestions: () => EditingSuggestion[];
  exportSuggestions: (format: 'json' | 'csv') => string;
  importSuggestions: (data: string, format: 'json' | 'csv') => void;
}

type SmartEditingStore = SmartEditingState & SmartEditingActions;

// Regras padrão do sistema
const defaultRules: EditingRule[] = [
  {
    id: 'remove-silence',
    name: 'Remover Silêncios Longos',
    description: 'Remove silêncios maiores que 3 segundos',
    category: 'audio',
    conditions: {
      silence: { duration: 3 }
    },
    action: {
      type: 'cut',
      parameters: { removeGaps: true },
      priority: 'medium'
    },
    enabled: true,
    weight: 0.8
  },
  {
    id: 'scene-transitions',
    name: 'Adicionar Transições entre Cenas',
    description: 'Adiciona transições suaves entre mudanças de cena',
    category: 'transitions',
    conditions: {
      sceneChange: true
    },
    action: {
      type: 'transition',
      parameters: { type: 'fade', duration: 0.5 },
      priority: 'low'
    },
    enabled: true,
    weight: 0.6
  },
  {
    id: 'enhance-low-quality',
    name: 'Melhorar Qualidade Baixa',
    description: 'Aplica filtros para melhorar vídeos de baixa qualidade',
    category: 'quality',
    conditions: {
      quality: { max: 0.5 }
    },
    action: {
      type: 'effect',
      parameters: { sharpen: 0.3, denoise: 0.2 },
      priority: 'high'
    },
    enabled: true,
    weight: 0.9
  },
  {
    id: 'normalize-audio',
    name: 'Normalizar Áudio',
    description: 'Normaliza níveis de áudio inconsistentes',
    category: 'audio',
    conditions: {
      audioLevel: { min: 0.1, max: 0.9 }
    },
    action: {
      type: 'audio',
      parameters: { normalize: true, targetLevel: -12 },
      priority: 'medium'
    },
    enabled: true,
    weight: 0.7
  },
  {
    id: 'speed-up-slow-parts',
    name: 'Acelerar Partes Lentas',
    description: 'Acelera seções com pouco movimento',
    category: 'pacing',
    conditions: {
      motion: { level: 'low' },
      duration: { min: 5 }
    },
    action: {
      type: 'speed',
      parameters: { factor: 1.5 },
      priority: 'low'
    },
    enabled: false,
    weight: 0.5
  },
  {
    id: 'add-captions',
    name: 'Adicionar Legendas',
    description: 'Sugere adicionar legendas para melhor acessibilidade',
    category: 'accessibility',
    conditions: {
      contentType: ['video'],
      text: { present: false }
    },
    action: {
      type: 'text',
      parameters: { generateCaptions: true },
      priority: 'medium'
    },
    enabled: true,
    weight: 0.8
  }
];

// Store principal
export const useSmartEditing = create<SmartEditingStore>((set, get) => ({
  // Estado inicial
  suggestions: [],
  rules: defaultRules,
  contexts: {},
  batches: [],
  
  // Configurações
  autoGenerate: true,
  autoApply: false,
  confidenceThreshold: 0.7,
  maxSuggestions: 50,
  enabledCategories: ['audio', 'quality', 'transitions', 'accessibility'],
  
  // UI
  selectedSuggestion: null,
  filterOptions: {},
  sortBy: 'confidence',
  sortOrder: 'desc',
  groupBy: 'type',
  showPreview: true,
  
  // Status
  isAnalyzing: false,
  isGenerating: false,
  isApplying: false,
  lastAnalysis: null,
  
  // Estatísticas
  stats: {
    totalGenerated: 0,
    totalApplied: 0,
    totalRejected: 0,
    averageConfidence: 0,
    categoryBreakdown: {},
    impactMetrics: {
      engagement: 0,
      quality: 0,
      accessibility: 0
    }
  },

  // Análise e geração
  analyzeContent: async (clipIds: string[]) => {
    set({ isAnalyzing: true });
    
    try {
      // Simular análise de conteúdo
      for (const clipId of clipIds) {
        const mockContext: ContentContext = {
          clipId,
          type: 'video',
          duration: Math.random() * 60 + 10,
          timestamp: Date.now(),
          metadata: {
            resolution: { width: 1920, height: 1080 },
            fps: 30,
            bitrate: 5000000
          },
          analysis: {
            scenes: [
              { start: 0, end: 15, type: 'intro' },
              { start: 15, end: 45, type: 'content' },
              { start: 45, end: 60, type: 'outro' }
            ],
            audio: {
              volume: Array.from({ length: 60 }, () => Math.random()),
              silence: [{ start: 10, end: 13 }],
              speech: [{ start: 0, end: 10, confidence: 0.9 }]
            },
            quality: {
              sharpness: Math.random(),
              brightness: Math.random(),
              contrast: Math.random(),
              saturation: Math.random(),
              noise: Math.random()
            },
            engagement: {
              predicted: Math.random(),
              factors: ['visual_appeal', 'audio_quality']
            }
          },
          relationships: {}
        };
        
        get().updateContext(clipId, mockContext);
      }
      
      set({ lastAnalysis: Date.now() });
      
      // Gerar sugestões automaticamente se habilitado
      if (get().autoGenerate) {
        await get().refreshSuggestions(clipIds);
      }
    } finally {
      set({ isAnalyzing: false });
    }
  },

  generateSuggestions: async (context: ContentContext): Promise<EditingSuggestion[]> => {
    const { rules, enabledCategories, confidenceThreshold } = get();
    const suggestions: EditingSuggestion[] = [];
    
    for (const rule of rules) {
      if (!rule.enabled || !enabledCategories.includes(rule.category)) {
        continue;
      }
      
      // Verificar condições da regra
      let matches = true;
      
      if (rule.conditions.duration) {
        const { min, max } = rule.conditions.duration;
        if (min && context.duration < min) matches = false;
        if (max && context.duration > max) matches = false;
      }
      
      if (rule.conditions.quality && context.analysis.quality) {
        const { min, max } = rule.conditions.quality;
        const avgQuality = Object.values(context.analysis.quality).reduce((a, b) => a + b, 0) / 5;
        if (min && avgQuality < min) matches = false;
        if (max && avgQuality > max) matches = false;
      }
      
      if (rule.conditions.silence && context.analysis.audio?.silence) {
        const hasSilence = context.analysis.audio.silence.some(
          s => (s.end - s.start) >= rule.conditions.silence!.duration
        );
        if (!hasSilence) matches = false;
      }
      
      if (matches) {
        const confidence = Math.min(0.95, rule.weight + Math.random() * 0.2);
        
        if (confidence >= confidenceThreshold) {
          const suggestion: EditingSuggestion = {
            id: `${rule.id}-${context.clipId}-${Date.now()}`,
            type: rule.action.type,
            title: rule.name,
            description: rule.description,
            confidence,
            priority: rule.action.priority,
            category: rule.category,
            clipId: context.clipId,
            parameters: rule.action.parameters,
            reasoning: `Regra "${rule.name}" aplicada com base na análise do conteúdo`,
            impact: {
              engagement: Math.random() * 0.3 + 0.1,
              quality: Math.random() * 0.4 + 0.2,
              accessibility: Math.random() * 0.2 + 0.1,
              performance: Math.random() * 0.1 + 0.05
            },
            tags: [rule.category, rule.action.type],
            createdAt: Date.now(),
            status: 'pending'
          };
          
          suggestions.push(suggestion);
        }
      }
    }
    
    return suggestions;
  },

  refreshSuggestions: async (clipIds?: string[]) => {
    set({ isGenerating: true });
    
    try {
      const { contexts, maxSuggestions } = get();
      const targetClips = clipIds || Object.keys(contexts);
      const newSuggestions: EditingSuggestion[] = [];
      
      for (const clipId of targetClips) {
        const context = contexts[clipId];
        if (context) {
          const clipSuggestions = await get().generateSuggestions(context);
          newSuggestions.push(...clipSuggestions);
        }
      }
      
      // Limitar número de sugestões
      const limitedSuggestions = newSuggestions
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, maxSuggestions);
      
      set(state => ({
        suggestions: [...state.suggestions, ...limitedSuggestions],
        stats: {
          ...state.stats,
          totalGenerated: state.stats.totalGenerated + limitedSuggestions.length,
          averageConfidence: limitedSuggestions.reduce((sum, s) => sum + s.confidence, 0) / limitedSuggestions.length || 0
        }
      }));
    } finally {
      set({ isGenerating: false });
    }
  },

  // Gerenciamento de sugestões
  applySuggestion: async (suggestionId: string) => {
    set({ isApplying: true });
    
    try {
      const suggestion = get().suggestions.find(s => s.id === suggestionId);
      if (!suggestion) return;
      
      // Simular aplicação da sugestão
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      set(state => ({
        suggestions: state.suggestions.map(s => 
          s.id === suggestionId 
            ? { ...s, status: 'applied', appliedAt: Date.now() }
            : s
        ),
        stats: {
          ...state.stats,
          totalApplied: state.stats.totalApplied + 1
        }
      }));
    } finally {
      set({ isApplying: false });
    }
  },

  rejectSuggestion: (suggestionId: string) => {
    set(state => ({
      suggestions: state.suggestions.map(s => 
        s.id === suggestionId ? { ...s, status: 'rejected' } : s
      ),
      stats: {
        ...state.stats,
        totalRejected: state.stats.totalRejected + 1
      }
    }));
  },

  batchApply: async (suggestionIds: string[]) => {
    set({ isApplying: true });
    
    try {
      for (const id of suggestionIds) {
        await get().applySuggestion(id);
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    } finally {
      set({ isApplying: false });
    }
  },

  clearSuggestions: (filter?: SuggestionFilter) => {
    if (!filter) {
      set({ suggestions: [] });
      return;
    }
    
    set(state => ({
      suggestions: state.suggestions.filter(suggestion => {
        if (filter.types && !filter.types.includes(suggestion.type)) return true;
        if (filter.priorities && !filter.priorities.includes(suggestion.priority)) return true;
        if (filter.status && !filter.status.includes(suggestion.status)) return true;
        if (filter.minConfidence && suggestion.confidence < filter.minConfidence) return true;
        if (filter.clipIds && suggestion.clipId && !filter.clipIds.includes(suggestion.clipId)) return true;
        return false;
      })
    }));
  },

  // Regras
  addRule: (rule: Omit<EditingRule, 'id'>) => {
    const newRule: EditingRule = {
      ...rule,
      id: `rule-${Date.now()}`
    };
    
    set(state => ({
      rules: [...state.rules, newRule]
    }));
  },

  updateRule: (ruleId: string, updates: Partial<EditingRule>) => {
    set(state => ({
      rules: state.rules.map(rule => 
        rule.id === ruleId ? { ...rule, ...updates } : rule
      )
    }));
  },

  removeRule: (ruleId: string) => {
    set(state => ({
      rules: state.rules.filter(rule => rule.id !== ruleId)
    }));
  },

  toggleRule: (ruleId: string) => {
    set(state => ({
      rules: state.rules.map(rule => 
        rule.id === ruleId ? { ...rule, enabled: !rule.enabled } : rule
      )
    }));
  },

  // Contexto
  updateContext: (clipId: string, context: Partial<ContentContext>) => {
    set(state => ({
      contexts: {
        ...state.contexts,
        [clipId]: { ...state.contexts[clipId], ...context } as ContentContext
      }
    }));
  },

  removeContext: (clipId: string) => {
    set(state => {
      const { [clipId]: removed, ...rest } = state.contexts;
      return { contexts: rest };
    });
  },

  // Batches
  createBatch: (name: string, suggestionIds: string[]) => {
    const batchId = `batch-${Date.now()}`;
    const suggestions = get().suggestions.filter(s => suggestionIds.includes(s.id));
    
    const batch: SuggestionBatch = {
      id: batchId,
      name,
      description: `Lote com ${suggestionIds.length} sugestões`,
      suggestions: suggestionIds,
      estimatedTime: suggestionIds.length * 2, // 2 segundos por sugestão
      impact: {
        engagement: suggestions.reduce((sum, s) => sum + s.impact.engagement, 0) / suggestions.length,
        quality: suggestions.reduce((sum, s) => sum + s.impact.quality, 0) / suggestions.length,
        accessibility: suggestions.reduce((sum, s) => sum + s.impact.accessibility, 0) / suggestions.length
      },
      createdAt: Date.now(),
      status: 'pending'
    };
    
    set(state => ({
      batches: [...state.batches, batch]
    }));
    
    return batchId;
  },

  processBatch: async (batchId: string) => {
    const batch = get().batches.find(b => b.id === batchId);
    if (!batch) return;
    
    set(state => ({
      batches: state.batches.map(b => 
        b.id === batchId ? { ...b, status: 'processing' } : b
      )
    }));
    
    try {
      await get().batchApply(batch.suggestions);
      
      set(state => ({
        batches: state.batches.map(b => 
          b.id === batchId ? { ...b, status: 'completed' } : b
        )
      }));
    } catch (error) {
      set(state => ({
        batches: state.batches.map(b => 
          b.id === batchId ? { ...b, status: 'failed' } : b
        )
      }));
    }
  },

  removeBatch: (batchId: string) => {
    set(state => ({
      batches: state.batches.filter(b => b.id !== batchId)
    }));
  },

  // Filtros e ordenação
  setFilter: (filter: Partial<SuggestionFilter>) => {
    set(state => ({
      filterOptions: { ...state.filterOptions, ...filter }
    }));
  },

  setSorting: (sortBy: SmartEditingState['sortBy'], order: SmartEditingState['sortOrder']) => {
    set({ sortBy, sortOrder: order });
  },

  setGrouping: (groupBy: SmartEditingState['groupBy']) => {
    set({ groupBy });
  },

  // UI
  selectSuggestion: (suggestionId: string | null) => {
    set({ selectedSuggestion: suggestionId });
  },

  togglePreview: () => {
    set(state => ({ showPreview: !state.showPreview }));
  },

  // Configurações
  updateSettings: (settings) => {
    set(state => ({ ...state, ...settings }));
  },

  // Utilitários
  getSuggestionsByClip: (clipId: string) => {
    return get().suggestions.filter(s => s.clipId === clipId);
  },

  getSuggestionsByType: (type: EditingSuggestion['type']) => {
    return get().suggestions.filter(s => s.type === type);
  },

  getFilteredSuggestions: () => {
    const { suggestions, filterOptions, sortBy, sortOrder } = get();
    
    let filtered = suggestions.filter(suggestion => {
      if (filterOptions.types && !filterOptions.types.includes(suggestion.type)) return false;
      if (filterOptions.priorities && !filterOptions.priorities.includes(suggestion.priority)) return false;
      if (filterOptions.status && !filterOptions.status.includes(suggestion.status)) return false;
      if (filterOptions.minConfidence && suggestion.confidence < filterOptions.minConfidence) return false;
      if (filterOptions.clipIds && suggestion.clipId && !filterOptions.clipIds.includes(suggestion.clipId)) return false;
      if (filterOptions.maxAge) {
        const age = Date.now() - suggestion.createdAt;
        if (age > filterOptions.maxAge) return false;
      }
      return true;
    });
    
    // Ordenar
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'confidence':
          comparison = a.confidence - b.confidence;
          break;
        case 'priority':
          const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
          comparison = priorityOrder[a.priority] - priorityOrder[b.priority];
          break;
        case 'timestamp':
          comparison = a.createdAt - b.createdAt;
          break;
        case 'impact':
          const aImpact = Object.values(a.impact).reduce((sum, val) => sum + val, 0);
          const bImpact = Object.values(b.impact).reduce((sum, val) => sum + val, 0);
          comparison = aImpact - bImpact;
          break;
      }
      
      return sortOrder === 'desc' ? -comparison : comparison;
    });
    
    return filtered;
  },

  exportSuggestions: (format: 'json' | 'csv') => {
    const suggestions = get().getFilteredSuggestions();
    
    if (format === 'json') {
      return JSON.stringify(suggestions, null, 2);
    } else {
      const headers = ['ID', 'Type', 'Title', 'Confidence', 'Priority', 'Category', 'Status'];
      const rows = suggestions.map(s => [
        s.id,
        s.type,
        s.title,
        s.confidence.toString(),
        s.priority,
        s.category,
        s.status
      ]);
      
      return [headers, ...rows].map(row => row.join(',')).join('\n');
    }
  },

  importSuggestions: (data: string, format: 'json' | 'csv') => {
    try {
      let importedSuggestions: EditingSuggestion[] = [];
      
      if (format === 'json') {
        importedSuggestions = JSON.parse(data);
      } else {
        // Implementar parser CSV se necessário
        console.warn('CSV import not implemented yet');
        return;
      }
      
      set(state => ({
        suggestions: [...state.suggestions, ...importedSuggestions]
      }));
    } catch (error) {
      console.error('Failed to import suggestions:', error);
    }
  }
}));

// Funções utilitárias
export const createCustomRule = (
  name: string,
  description: string,
  category: string,
  conditions: EditingRule['conditions'],
  action: EditingRule['action']
): Omit<EditingRule, 'id'> => {
  return {
    name,
    description,
    category,
    conditions,
    action,
    enabled: true,
    weight: 0.7
  };
};

export const calculateSuggestionImpact = (suggestion: EditingSuggestion): number => {
  const weights = {
    engagement: 0.4,
    quality: 0.3,
    accessibility: 0.2,
    performance: 0.1
  };
  
  return Object.entries(suggestion.impact).reduce(
    (total, [key, value]) => total + value * weights[key as keyof typeof weights],
    0
  );
};

export const groupSuggestionsByCategory = (suggestions: EditingSuggestion[]): Record<string, EditingSuggestion[]> => {
  return suggestions.reduce((groups, suggestion) => {
    const category = suggestion.category;
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(suggestion);
    return groups;
  }, {} as Record<string, EditingSuggestion[]>);
};

export const formatSuggestionSummary = (suggestion: EditingSuggestion): string => {
  const impact = calculateSuggestionImpact(suggestion);
  const confidence = Math.round(suggestion.confidence * 100);
  
  return `${suggestion.title} (${confidence}% confiança, ${Math.round(impact * 100)}% impacto)`;
};

// Hook personalizado para usar o serviço
export const useSmartEditingSuggestions = () => {
  const store = useSmartEditing();
  
  return {
    ...store,
    filteredSuggestions: store.getFilteredSuggestions(),
    suggestionsByCategory: groupSuggestionsByCategory(store.getFilteredSuggestions()),
    totalImpact: store.getFilteredSuggestions().reduce(
      (total, suggestion) => total + calculateSuggestionImpact(suggestion),
      0
    )
  };
};