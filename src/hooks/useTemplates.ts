import { useState, useEffect, useCallback } from 'react';
import { 
  Template, 
  TemplateCategory, 
  TemplateFilter, 
  AutomationWorkflow, 
  TemplateAnalytics,
  SmartSuggestion,
  TemplateSearchResult
} from '../types/templates';
import { TemplateEngine } from '../services/templateEngine';
import { AutomationEngine } from '../services/automationEngine';

interface UseTemplatesOptions {
  projectId?: string;
  autoLoad?: boolean;
  enableAnalytics?: boolean;
}

interface UseTemplatesReturn {
  // Templates
  templates: Template[];
  categories: TemplateCategory[];
  filteredTemplates: Template[];
  selectedTemplate: Template | null;
  
  // Loading states
  isLoading: boolean;
  isApplying: boolean;
  isSearching: boolean;
  
  // Filters and search
  filters: TemplateFilter;
  searchQuery: string;
  searchResults: TemplateSearchResult[];
  
  // Analytics and suggestions
  analytics: TemplateAnalytics | null;
  suggestions: SmartSuggestion[];
  
  // Automation
  workflows: AutomationWorkflow[];
  activeWorkflows: AutomationWorkflow[];
  
  // Actions
  loadTemplates: () => Promise<void>;
  searchTemplates: (query: string) => Promise<void>;
  applyTemplate: (templateId: string, options?: any) => Promise<void>;
  selectTemplate: (template: Template | null) => void;
  updateFilters: (filters: Partial<TemplateFilter>) => void;
  
  // Template management
  createTemplate: (template: Omit<Template, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Template>;
  updateTemplate: (templateId: string, updates: Partial<Template>) => Promise<void>;
  deleteTemplate: (templateId: string) => Promise<void>;
  duplicateTemplate: (templateId: string) => Promise<Template>;
  
  // Automation
  createWorkflow: (workflow: Omit<AutomationWorkflow, 'id' | 'createdAt'>) => Promise<AutomationWorkflow>;
  executeWorkflow: (workflowId: string) => Promise<void>;
  toggleWorkflow: (workflowId: string, enabled: boolean) => Promise<void>;
  
  // Analytics
  trackTemplateUsage: (templateId: string, action: string) => void;
  getTemplateAnalytics: (templateId: string) => Promise<TemplateAnalytics>;
  
  // Smart suggestions
  getSuggestions: (context?: any) => Promise<SmartSuggestion[]>;
  applySuggestion: (suggestionId: string) => Promise<void>;
}

// Mock data for development
const mockTemplates: Template[] = [
  {
    id: 'template-1',
    name: 'Intro Moderno',
    description: 'Template de introdução com animações modernas',
    category: 'intro',
    tags: ['moderno', 'animação', 'profissional'],
    thumbnail: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=modern%20video%20intro%20template%20with%20sleek%20animations&image_size=landscape_16_9',
    duration: 5,
    elements: [],
    animations: [],
    constraints: {
      minDuration: 3,
      maxDuration: 10,
      requiredElements: ['text'],
      supportedFormats: ['mp4', 'mov']
    },
    metadata: {
      version: '1.0',
      author: {
        id: 'author-1',
        name: 'Studio Templates',
        avatar: ''
      },
      license: 'free',
      pricing: { type: 'free' },
      compatibility: ['web', 'mobile'],
      performance: {
        renderTime: 2.5,
        memoryUsage: 150,
        complexity: 'medium'
      }
    },
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: 'template-2',
    name: 'Transição Suave',
    description: 'Template de transição com efeitos suaves',
    category: 'transition',
    tags: ['transição', 'suave', 'elegante'],
    thumbnail: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=smooth%20video%20transition%20template%20with%20elegant%20effects&image_size=landscape_16_9',
    duration: 2,
    elements: [],
    animations: [],
    constraints: {
      minDuration: 1,
      maxDuration: 5,
      requiredElements: [],
      supportedFormats: ['mp4', 'mov']
    },
    metadata: {
      version: '1.0',
      author: {
        id: 'author-1',
        name: 'Studio Templates',
        avatar: ''
      },
      license: 'premium',
      pricing: { type: 'paid', amount: 9.99, currency: 'USD' },
      compatibility: ['web', 'mobile'],
      performance: {
        renderTime: 1.2,
        memoryUsage: 80,
        complexity: 'low'
      }
    },
    createdAt: new Date('2024-01-02'),
    updatedAt: new Date('2024-01-02')
  }
];

const mockCategories: TemplateCategory[] = [
  { id: 'intro', name: 'Introduções', description: 'Templates de abertura', icon: 'play' },
  { id: 'transition', name: 'Transições', description: 'Efeitos de transição', icon: 'shuffle' },
  { id: 'outro', name: 'Encerramentos', description: 'Templates de fechamento', icon: 'square' },
  { id: 'social', name: 'Redes Sociais', description: 'Templates para redes sociais', icon: 'share' }
];

const mockWorkflows: AutomationWorkflow[] = [
  {
    id: 'workflow-1',
    name: 'Auto Intro + Outro',
    description: 'Adiciona automaticamente intro e outro ao vídeo',
    enabled: true,
    trigger: {
      type: 'project_created',
      conditions: []
    },
    actions: [
      {
        type: 'apply_template',
        parameters: { templateId: 'template-1', position: 'start' }
      }
    ],
    createdAt: new Date('2024-01-01')
  }
];

export const useTemplates = (options: UseTemplatesOptions = {}): UseTemplatesReturn => {
  const { projectId, autoLoad = true, enableAnalytics = true } = options;
  
  // State
  const [templates, setTemplates] = useState<Template[]>([]);
  const [categories, setCategories] = useState<TemplateCategory[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<TemplateSearchResult[]>([]);
  const [analytics, setAnalytics] = useState<TemplateAnalytics | null>(null);
  const [suggestions, setSuggestions] = useState<SmartSuggestion[]>([]);
  const [workflows, setWorkflows] = useState<AutomationWorkflow[]>([]);
  const [activeWorkflows, setActiveWorkflows] = useState<AutomationWorkflow[]>([]);
  
  const [filters, setFilters] = useState<TemplateFilter>({
    categories: [],
    tags: [],
    license: 'all',
    duration: { min: 0, max: 60 },
    complexity: 'all',
    sortBy: 'popularity',
    sortOrder: 'desc'
  });
  
  // Engines
  const templateEngine = new TemplateEngine();
  const automationEngine = new AutomationEngine();
  
  // Filtered templates based on current filters
  const filteredTemplates = templates.filter(template => {
    // Category filter
    if (filters.categories.length > 0 && !filters.categories.includes(template.category)) {
      return false;
    }
    
    // Tags filter
    if (filters.tags.length > 0 && !filters.tags.some(tag => template.tags.includes(tag))) {
      return false;
    }
    
    // License filter
    if (filters.license !== 'all' && template.metadata.license !== filters.license) {
      return false;
    }
    
    // Duration filter
    if (template.duration < filters.duration.min || template.duration > filters.duration.max) {
      return false;
    }
    
    // Complexity filter
    if (filters.complexity !== 'all' && template.metadata.performance.complexity !== filters.complexity) {
      return false;
    }
    
    return true;
  }).sort((a, b) => {
    const order = filters.sortOrder === 'asc' ? 1 : -1;
    
    switch (filters.sortBy) {
      case 'name':
        return a.name.localeCompare(b.name) * order;
      case 'date':
        return (a.createdAt.getTime() - b.createdAt.getTime()) * order;
      case 'duration':
        return (a.duration - b.duration) * order;
      case 'downloads':
        return (parseInt(b.id.split('-')[1]) - parseInt(a.id.split('-')[1])) * order;
      case 'popular':
        return (parseInt(b.id.split('-')[1]) - parseInt(a.id.split('-')[1])) * order;
      case 'popularity':
      default:
        // Mock popularity based on template id for now
        return (parseInt(a.id.split('-')[1]) - parseInt(b.id.split('-')[1])) * order;
    }
  });
  
  // Load templates
  const loadTemplates = useCallback(async () => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setTemplates(mockTemplates);
      setCategories(mockCategories);
      setWorkflows(mockWorkflows);
      setActiveWorkflows(mockWorkflows.filter(w => w.enabled));
    } catch (error) {
      console.error('Erro ao carregar templates:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  // Search templates
  const searchTemplates = useCallback(async (query: string) => {
    setSearchQuery(query);
    setIsSearching(true);
    
    try {
      // Simulate search API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const results = templates
        .filter(template => 
          template.name.toLowerCase().includes(query.toLowerCase()) ||
          template.description.toLowerCase().includes(query.toLowerCase()) ||
          template.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
        )
        .map(template => ({
          template,
          score: Math.random(), // Mock relevance score
          matchedFields: ['name', 'description'] // Mock matched fields
        }));
      
      const searchResult: TemplateSearchResult = {
        templates: results.map(r => r.template),
        total: results.length,
        page: 1,
        limit: results.length,
        filters: filters
      };
      setSearchResults([searchResult]);
    } catch (error) {
      console.error('Erro na busca:', error);
    } finally {
      setIsSearching(false);
    }
  }, [templates]);
  
  // Apply template
  const applyTemplate = useCallback(async (templateId: string, options: any = {}) => {
    setIsApplying(true);
    
    try {
      const template = templates.find(t => t.id === templateId);
      if (!template) throw new Error('Template não encontrado');
      
      // Use template engine to apply template
      await templateEngine.applyTemplate(template, options);
      
      // Track usage if analytics enabled
      if (enableAnalytics) {
        trackTemplateUsage(templateId, 'apply');
      }
      
      console.log('Template aplicado com sucesso:', template.name);
    } catch (error) {
      console.error('Erro ao aplicar template:', error);
      throw error;
    } finally {
      setIsApplying(false);
    }
  }, [templates, templateEngine, enableAnalytics]);
  
  // Select template
  const selectTemplate = useCallback((template: Template | null) => {
    setSelectedTemplate(template);
    
    if (template && enableAnalytics) {
      trackTemplateUsage(template.id, 'select');
    }
  }, [enableAnalytics]);
  
  // Update filters
  const updateFilters = useCallback((newFilters: Partial<TemplateFilter>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);
  
  // Template management
  const createTemplate = useCallback(async (templateData: Omit<Template, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newTemplate: Template = {
      ...templateData,
      id: `template-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    setTemplates(prev => [...prev, newTemplate]);
    return newTemplate;
  }, []);
  
  const updateTemplate = useCallback(async (templateId: string, updates: Partial<Template>) => {
    setTemplates(prev => prev.map(template => 
      template.id === templateId 
        ? { ...template, ...updates, updatedAt: new Date() }
        : template
    ));
  }, []);
  
  const deleteTemplate = useCallback(async (templateId: string) => {
    setTemplates(prev => prev.filter(template => template.id !== templateId));
  }, []);
  
  const duplicateTemplate = useCallback(async (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (!template) throw new Error('Template não encontrado');
    
    const { id, createdAt, updatedAt, ...templateData } = template;
    const duplicated = await createTemplate({
      ...templateData,
      name: `${template.name} (Cópia)`
    });
    
    return duplicated;
  }, [templates, createTemplate]);
  
  // Automation
  const createWorkflow = useCallback(async (workflowData: Omit<AutomationWorkflow, 'id' | 'createdAt'>) => {
    const newWorkflow: AutomationWorkflow = {
      ...workflowData,
      id: `workflow-${Date.now()}`,
      createdAt: new Date()
    };
    
    setWorkflows(prev => [...prev, newWorkflow]);
    
    if (newWorkflow.enabled) {
      setActiveWorkflows(prev => [...prev, newWorkflow]);
    }
    
    return newWorkflow;
  }, []);
  
  const executeWorkflow = useCallback(async (workflowId: string) => {
    const workflow = workflows.find(w => w.id === workflowId);
    if (!workflow) throw new Error('Workflow não encontrado');
    
    // Execute workflow logic here
    console.log('Executing workflow:', workflow.name);
  }, [workflows, automationEngine]);
  
  const toggleWorkflow = useCallback(async (workflowId: string, enabled: boolean) => {
    setWorkflows(prev => prev.map(workflow => 
      workflow.id === workflowId 
        ? { ...workflow, enabled }
        : workflow
    ));
    
    if (enabled) {
      const workflow = workflows.find(w => w.id === workflowId);
      if (workflow) {
        setActiveWorkflows(prev => [...prev, { ...workflow, enabled }]);
      }
    } else {
      setActiveWorkflows(prev => prev.filter(w => w.id !== workflowId));
    }
  }, [workflows]);
  
  // Analytics
  const trackTemplateUsage = useCallback((templateId: string, action: string) => {
    if (!enableAnalytics) return;
    
    console.log('Tracking template usage:', { templateId, action, timestamp: new Date() });
    // Here you would send analytics data to your backend
  }, [enableAnalytics]);
  
  const getTemplateAnalytics = useCallback(async (templateId: string): Promise<TemplateAnalytics> => {
    // Mock analytics data
    const mockAnalytics: TemplateAnalytics = {
      downloads: Math.floor(Math.random() * 1000),
      views: Math.floor(Math.random() * 5000),
      likes: Math.floor(Math.random() * 500),
      rating: 4.2 + Math.random() * 0.8,
      reviews: Math.floor(Math.random() * 100),
      trending: Math.random() > 0.8,
      featured: Math.random() > 0.9
    };
    
    return mockAnalytics;
  }, []);
  
  // Smart suggestions
  const getSuggestions = useCallback(async (context: any = {}): Promise<SmartSuggestion[]> => {
    // Mock smart suggestions
    const mockSuggestions: SmartSuggestion[] = [
      {
        id: 'suggestion-1',
        type: 'template',
        title: 'Adicionar Introdução',
        description: 'Baseado no seu conteúdo, recomendamos adicionar uma introdução moderna',
        confidence: 0.85,
        templateId: 'template-1',
        reasoning: 'Vídeos com introdução têm 40% mais engajamento',
        preview: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=video%20intro%20suggestion%20preview&image_size=landscape_16_9',
        data: { templateId: 'template-1' }
      },
      {
        id: 'suggestion-2',
        type: 'automation',
        title: 'Otimizar Transições',
        description: 'Detectamos cortes abruptos que podem ser suavizados',
        confidence: 0.72,
        workflowId: 'workflow-1',
        reasoning: 'Transições suaves melhoram a experiência do espectador',
        preview: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=smooth%20transition%20optimization%20preview&image_size=landscape_16_9',
        data: { workflowId: 'workflow-1' }
      }
    ];
    
    setSuggestions(mockSuggestions);
    return mockSuggestions;
  }, []);
  
  const applySuggestion = useCallback(async (suggestionId: string) => {
    const suggestion = suggestions.find(s => s.id === suggestionId);
    if (!suggestion) throw new Error('Sugestão não encontrada');
    
    if (suggestion.type === 'template' && suggestion.templateId) {
      await applyTemplate(suggestion.templateId);
    } else if (suggestion.type === 'automation' && suggestion.workflowId) {
      await executeWorkflow(suggestion.workflowId);
    }
    
    // Remove applied suggestion
    setSuggestions(prev => prev.filter(s => s.id !== suggestionId));
  }, [suggestions, applyTemplate, executeWorkflow]);
  
  // Auto-load templates on mount
  useEffect(() => {
    if (autoLoad) {
      loadTemplates();
    }
  }, [autoLoad, loadTemplates]);
  
  // Auto-generate suggestions when templates change
  useEffect(() => {
    if (templates.length > 0) {
      getSuggestions();
    }
  }, [templates, getSuggestions]);
  
  return {
    // Templates
    templates,
    categories,
    filteredTemplates,
    selectedTemplate,
    
    // Loading states
    isLoading,
    isApplying,
    isSearching,
    
    // Filters and search
    filters,
    searchQuery,
    searchResults,
    
    // Analytics and suggestions
    analytics,
    suggestions,
    
    // Automation
    workflows,
    activeWorkflows,
    
    // Actions
    loadTemplates,
    searchTemplates,
    applyTemplate,
    selectTemplate,
    updateFilters,
    
    // Template management
    createTemplate,
    updateTemplate,
    deleteTemplate,
    duplicateTemplate,
    
    // Automation
    createWorkflow,
    executeWorkflow,
    toggleWorkflow,
    
    // Analytics
    trackTemplateUsage,
    getTemplateAnalytics,
    
    // Smart suggestions
    getSuggestions,
    applySuggestion
  };
};

export default useTemplates;