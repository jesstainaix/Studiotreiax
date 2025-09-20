// Interface para sistema de templates de Normas Regulamentadoras
import React, { useState, useEffect, useCallback } from 'react';
import { 
  NRTemplateSystem, 
  NRTemplate, 
  NRCategory, 
  TemplateCustomization,
  ComplianceValidationResult
} from '../../services/NRTemplateSystem';
// import { VideoProject } from '../../types/video'; // Módulo não encontrado - comentado
import { 
  Search, 
  Filter, 
  Download, 
  Play, 
  Settings, 
  CheckCircle, 
  AlertTriangle, 
  FileText, 
  Palette, 
  Type, 
  Image, 
  Volume2,
  Eye,
  Edit3,
  Save,
  Share2,
  X,
  Tag,
  Folder,
  Shield,
  Clock,
  ChevronUp,
  ChevronDown,
  Activity,
  BarChart3,
  TrendingUp,
  Plus
} from 'lucide-react';
import NRTemplateWizard from './NRTemplateWizard';

interface NRTemplateInterfaceProps {
  onTemplateSelected?: (template: NRTemplate) => void;
  onProjectGenerated?: (project: VideoProject) => void;
  onCustomizationSaved?: (templateId: string, customization: TemplateCustomization) => void;
}

interface FilterState {
  category: NRCategory | 'all';
  searchQuery: string;
  compliance: 'all' | 'compliant' | 'non-compliant';
  duration: 'all' | 'short' | 'medium' | 'long';
  sortBy: 'name' | 'category' | 'duration' | 'compliance' | 'recent';
  sortOrder: 'asc' | 'desc';
  tags: string[];
  difficulty: 'all' | 'basic' | 'intermediate' | 'advanced';
  lastUpdated: 'all' | 'week' | 'month' | 'quarter';
}

interface SearchSuggestion {
  text: string;
  type: 'template' | 'category' | 'tag' | 'norma' | 'history';
  count: number;
}

const NRTemplateInterface: React.FC<NRTemplateInterfaceProps> = ({
  onTemplateSelected,
  onProjectGenerated,
  onCustomizationSaved
}) => {
  const [templateSystem] = useState(() => new NRTemplateSystem());
  const [templates, setTemplates] = useState<NRTemplate[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<NRTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<NRTemplate | null>(null);
  const [activeTab, setActiveTab] = useState<'browse' | 'customize' | 'compliance'>('browse');
  const [isLoading, setIsLoading] = useState(false);
  const [validationResults, setValidationResults] = useState<Map<string, ComplianceValidationResult>>(new Map());
  const [showWizard, setShowWizard] = useState(false);

  // Estados de filtro
  const [filters, setFilters] = useState<FilterState>({
    category: 'all',
    searchQuery: '',
    compliance: 'all',
    duration: 'all',
    sortBy: 'name',
    sortOrder: 'asc',
    tags: [],
    difficulty: 'all',
    lastUpdated: 'all'
  });

  // Estados de busca inteligente
  const [searchSuggestions, setSearchSuggestions] = useState<SearchSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [popularTags, setPopularTags] = useState<string[]>(['Seguranca', 'Saude', 'Meio Ambiente', 'Qualidade', 'Treinamento']);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [recentTemplates, setRecentTemplates] = useState<string[]>(['NR-6 EPI', 'NR-10 Eletrica', 'NR-35 Altura']);
  const [isAdvancedFiltersOpen, setIsAdvancedFiltersOpen] = useState(false);
  
  // Estados de analytics
  const [analytics, setAnalytics] = useState({
    mostUsed: 15,
    complianceRate: 87,
    avgUsageTime: 23,
    engagementScore: 8.5
  });

  // Estados de customizacao
  const [customization, setCustomization] = useState<TemplateCustomization>({
    colors: {
      primary: '#1a365d',
      secondary: '#2d3748',
      accent: '#3182ce',
      background: '#f7fafc',
      text: '#2d3748'
    },
    fonts: {
      primary: 'Inter',
      secondary: 'Roboto',
      sizes: { small: 14, medium: 18, large: 24, xlarge: 32 }
    },
    logos: [],
    branding: {
      companyName: '',
      companyLogo: '',
      colors: [],
      watermark: false
    },
    content: {
      language: 'pt-BR',
      terminology: 'technical',
      complexity: 'intermediate',
      examples: 'industry-specific'
    }
  });

  // Inicializacao
  useEffect(() => {
    loadTemplates();
  }, []);

  // Filtros
  useEffect(() => {
    applyFilters();
  }, [templates, filters]);

  const loadTemplates = async () => {
    try {
      setIsLoading(true);
      const allTemplates = templateSystem.getAllTemplates();
      setTemplates(allTemplates);
      
      // Validar compliance de todos os templates
      const validations = new Map<string, ComplianceValidationResult>();
      for (const template of allTemplates) {
        try {
          const validation = templateSystem.validateCompliance(template.id);
          validations.set(template.id, validation);
        } catch (error) {
          console.warn(`Erro ao validar template ${template.id}:`, error);
        }
      }
      setValidationResults(validations);
      
    } catch (error) {
      console.error('Erro ao carregar templates:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Funcao para gerar sugestoes de busca
  const generateSearchSuggestions = useCallback((query: string): SearchSuggestion[] => {
    if (!query || query.length < 2) return [];
    
    const suggestions: SearchSuggestion[] = [];
    const queryLower = query.toLowerCase();
    
    // Sugestoes de templates
    templates.forEach(template => {
      if (template.name.toLowerCase().includes(queryLower)) {
        suggestions.push({
          text: template.name,
          type: 'template',
          count: 1
        });
      }
    });
    
    // Sugestoes de categorias
    const categories = ['safety', 'health', 'environment', 'quality', 'training'];
    categories.forEach(category => {
      if (category.toLowerCase().includes(queryLower)) {
        const count = templates.filter(t => t.category === category).length;
        suggestions.push({
          text: getCategoryLabel(category as NRCategory),
          type: 'category',
          count
        });
      }
    });
    
    // Sugestoes de tags
    const allTags = [...new Set(templates.flatMap(t => t.tags || []))];
    allTags.forEach(tag => {
      if (tag.toLowerCase().includes(queryLower)) {
        const count = templates.filter(t => t.tags?.includes(tag)).length;
        suggestions.push({
          text: tag,
          type: 'tag',
          count
        });
      }
    });
    
    // Sugestoes de historico
    searchHistory.forEach(historyItem => {
      if (historyItem.toLowerCase().includes(queryLower)) {
        suggestions.push({
          text: historyItem,
          type: 'history',
          count: 0
        });
      }
    });
    
    return suggestions.slice(0, 8);
  }, [templates, searchHistory]);

  // Funcao para aplicar filtros
  const applyFilters = useCallback(() => {
    let filtered = [...templates];
    
    // Filtro de categoria
    if (filters.category !== 'all') {
      filtered = filtered.filter(template => template.category === filters.category);
    }
    
    // Filtro de busca
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      filtered = filtered.filter(template => 
        template.name.toLowerCase().includes(query) ||
        template.description.toLowerCase().includes(query) ||
        template.norma.toLowerCase().includes(query) ||
        template.tags?.some(tag => tag.toLowerCase().includes(query))
      );
    }
    
    // Filtro de compliance
    if (filters.compliance !== 'all') {
      filtered = filtered.filter(template => {
        const validation = validationResults.get(template.id);
        if (filters.compliance === 'compliant') {
          return validation?.isCompliant === true;
        } else {
          return validation?.isCompliant === false;
        }
      });
    }
    
    // Filtro de duracao
    if (filters.duration !== 'all') {
      filtered = filtered.filter(template => {
        const duration = template.estimatedDuration;
        switch (filters.duration) {
          case 'short': return duration <= 30;
          case 'medium': return duration > 30 && duration <= 60;
          case 'long': return duration > 60;
          default: return true;
        }
      });
    }
    
    // Filtro de tags
    if (filters.tags.length > 0) {
      filtered = filtered.filter(template => 
        filters.tags.some(tag => template.tags?.includes(tag))
      );
    }
    
    // Filtro de dificuldade
    if (filters.difficulty !== 'all') {
      filtered = filtered.filter(template => template.difficulty === filters.difficulty);
    }
    
    // Filtro de ultima atualizacao
    if (filters.lastUpdated !== 'all') {
      const now = new Date();
      const cutoffDate = new Date();
      
      switch (filters.lastUpdated) {
        case 'week':
          cutoffDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          cutoffDate.setMonth(now.getMonth() - 1);
          break;
        case 'quarter':
          cutoffDate.setMonth(now.getMonth() - 3);
          break;
      }
      
      filtered = filtered.filter(template => {
        const lastUpdate = new Date(template.compliance.lastUpdate);
        return lastUpdate >= cutoffDate;
      });
    }
    
    // Ordenacao
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (filters.sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'category':
          comparison = a.category.localeCompare(b.category);
          break;
        case 'duration':
          comparison = a.estimatedDuration - b.estimatedDuration;
          break;
        case 'compliance':
          const aCompliant = validationResults.get(a.id)?.isCompliant ? 1 : 0;
          const bCompliant = validationResults.get(b.id)?.isCompliant ? 1 : 0;
          comparison = bCompliant - aCompliant;
          break;
        case 'recent':
          const aDate = new Date(a.compliance.lastUpdate);
          const bDate = new Date(b.compliance.lastUpdate);
          comparison = bDate.getTime() - aDate.getTime();
          break;
      }
      
      return filters.sortOrder === 'desc' ? -comparison : comparison;
    });
    
    setFilteredTemplates(filtered);
  }, [templates, filters, validationResults]);

  // Funcoes de manipulacao
  const handleSearchChange = (query: string) => {
    setFilters(prev => ({ ...prev, searchQuery: query }));
    
    if (query.length >= 2) {
      const suggestions = generateSearchSuggestions(query);
      setSearchSuggestions(suggestions);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  const handleSearchSubmit = (query: string) => {
    if (query && !searchHistory.includes(query)) {
      setSearchHistory(prev => [query, ...prev.slice(0, 9)]);
    }
    setShowSuggestions(false);
  };

  const handleTemplateSelect = (template: NRTemplate) => {
    setSelectedTemplate(template);
    onTemplateSelected?.(template);
  };

  const handleGenerateProject = async () => {
    if (!selectedTemplate) return;
    
    try {
      setIsLoading(true);
      const project = templateSystem.generateVideoProject(selectedTemplate.id, customization);
      onProjectGenerated?.(project);
    } catch (error) {
      console.error('Erro ao gerar projeto:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveCustomization = () => {
    if (!selectedTemplate) return;
    
    templateSystem.saveCustomization(selectedTemplate.id, customization);
    onCustomizationSaved?.(selectedTemplate.id, customization);
  };

  // Funcoes auxiliares
  const getCategoryLabel = (category: NRCategory | 'all'): string => {
    const labels = {
      'all': 'Todas as Categorias',
      'safety': 'Seguranca do Trabalho',
      'health': 'Saude Ocupacional',
      'environment': 'Meio Ambiente',
      'quality': 'Qualidade',
      'training': 'Treinamento'
    };
    return labels[category] || category;
  };

  const getDifficultyLabel = (difficulty: string): string => {
    const labels = {
      'basic': 'Basica',
      'intermediate': 'Intermediaria',
      'advanced': 'Avancada'
    };
    return labels[difficulty as keyof typeof labels] || difficulty;
  };

  const getComplianceStatus = (templateId: string) => {
    const validation = validationResults.get(templateId);
    return validation?.isCompliant ? 'Conforme' : 'Nao Conforme';
  };

  const formatDuration = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}min` : `${hours}h`;
  };

  // Renderizacao das abas
  const renderBrowseTab = () => {
    return (
      <div className="space-y-6">
        {/* Barra de busca inteligente */}
        <div className="relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar templates, normas, categorias..."
              value={filters.searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearchSubmit(filters.searchQuery)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          {/* Sugestoes de busca */}
          {showSuggestions && searchSuggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-10 mt-1">
              {searchSuggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setFilters(prev => ({ ...prev, searchQuery: suggestion.text }));
                    handleSearchSubmit(suggestion.text);
                  }}
                  className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    {suggestion.type === 'template' && <FileText className="w-4 h-4 text-blue-500" />}
                    {suggestion.type === 'category' && <Folder className="w-4 h-4 text-green-500" />}
                    {suggestion.type === 'tag' && <Tag className="w-4 h-4 text-purple-500" />}
                    {suggestion.type === 'history' && <Clock className="w-4 h-4 text-gray-500" />}
                    <span>{suggestion.text}</span>
                  </div>
                  {suggestion.count > 0 && (
                    <span className="text-sm text-gray-500">{suggestion.count}</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Tags populares e historico */}
        {(isSearchFocused || filters.searchQuery === '') && (
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Tags Populares</h4>
              <div className="flex flex-wrap gap-2">
                {popularTags.map(tag => (
                  <button
                    key={tag}
                    onClick={() => setFilters(prev => ({ ...prev, searchQuery: tag }))}
                    className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm hover:bg-blue-200"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
            
            {searchHistory.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Buscas Recentes</h4>
                <div className="flex flex-wrap gap-2">
                  {searchHistory.slice(0, 5).map((item, index) => (
                    <button
                      key={index}
                      onClick={() => setFilters(prev => ({ ...prev, searchQuery: item }))}
                      className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200"
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Filtros */}
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium">Filtros</h3>
            <button
              onClick={() => setIsAdvancedFiltersOpen(!isAdvancedFiltersOpen)}
              className="text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              Filtros Avancados
              {isAdvancedFiltersOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {/* Categoria */}
            <div>
              <label className="block text-sm font-medium mb-1">Categoria</label>
              <select
                value={filters.category}
                onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value as any }))}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="all">Todas</option>
                <option value="safety">Seguranca do Trabalho</option>
                <option value="health">Saude Ocupacional</option>
                <option value="environment">Meio Ambiente</option>
                <option value="quality">Qualidade</option>
                <option value="training">Treinamento</option>
              </select>
            </div>
            
            {/* Compliance */}
            <div>
              <label className="block text-sm font-medium mb-1">Conformidade</label>
              <select
                value={filters.compliance}
                onChange={(e) => setFilters(prev => ({ ...prev, compliance: e.target.value as any }))}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="all">Todos</option>
                <option value="compliant">Conformes</option>
                <option value="non-compliant">Nao Conformes</option>
              </select>
            </div>
            
            {/* Duracao */}
            <div>
              <label className="block text-sm font-medium mb-1">Duracao</label>
              <select
                value={filters.duration}
                onChange={(e) => setFilters(prev => ({ ...prev, duration: e.target.value as any }))}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="all">Qualquer periodo</option>
                <option value="short">Ate 30 min</option>
                <option value="medium">30-60 min</option>
                <option value="long">Mais de 1h</option>
              </select>
            </div>
            
            {/* Ordenacao */}
            <div>
              <label className="block text-sm font-medium mb-1">Ordenacao</label>
              <select
                value={filters.sortBy}
                onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value as any }))}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="name">Nome</option>
                <option value="category">Categoria</option>
                <option value="duration-asc">Duracao (crescente)</option>
                <option value="duration-desc">Duracao (decrescente)</option>
                <option value="category-asc">Categoria A-Z</option>
                <option value="recent-desc">Mais Recentes</option>
              </select>
            </div>
            
            {/* Acoes dos Filtros */}
            <div className="flex items-end">
              <div className="flex gap-2">
                <button
                  onClick={() => setFilters(prev => ({ ...prev, sortOrder: prev.sortOrder === 'asc' ? 'desc' : 'asc' }))}
                  className="px-3 py-2 border rounded-lg hover:bg-gray-50"
                >
                  {filters.sortOrder === 'asc' ? '(crescente)' : '(decrescente)'}
                </button>
              </div>
            </div>
          </div>
          
          {/* Filtros Avancados */}
          {isAdvancedFiltersOpen && (
            <div className="mt-4 pt-4 border-t">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Dificuldade */}
                <div>
                  <label className="block text-sm font-medium mb-1">Dificuldade</label>
                  <select
                    value={filters.difficulty}
                    onChange={(e) => setFilters(prev => ({ ...prev, difficulty: e.target.value as any }))}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="all">Todas</option>
                    <option value="basic">Basica</option>
                    <option value="intermediate">Intermediaria</option>
                    <option value="advanced">Avancada</option>
                  </select>
                </div>
                
                {/* Ultima Atualizacao */}
                <div>
                  <label className="block text-sm font-medium mb-1">Ultima Atualizacao</label>
                  <select
                    value={filters.lastUpdated}
                    onChange={(e) => setFilters(prev => ({ ...prev, lastUpdated: e.target.value as any }))}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="all">Qualquer periodo</option>
                    <option value="week">Ultima semana</option>
                    <option value="month">Ultimo mes</option>
                    <option value="quarter">Ultimo trimestre</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Analytics rapidos */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow-sm border text-center">
            <div className="flex items-center justify-center mb-2">
              <TrendingUp className="w-5 h-5 text-blue-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{analytics.mostUsed}</div>
            <div className="text-sm text-gray-600">Mais Usado</div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow-sm border text-center">
            <div className="flex items-center justify-center mb-2">
              <Shield className="w-5 h-5 text-green-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{analytics.complianceRate}%</div>
            <div className="text-sm text-gray-600">Conformidade</div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow-sm border text-center">
            <div className="flex items-center justify-center mb-2">
              <Clock className="w-5 h-5 text-purple-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{analytics.avgUsageTime}min</div>
            <div className="text-sm text-gray-600">Tempo Medio de Uso</div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow-sm border text-center">
            <div className="flex items-center justify-center mb-2">
              <Activity className="w-5 h-5 text-orange-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{analytics.engagementScore}</div>
            <div className="text-sm text-gray-600">Engajamento</div>
          </div>
        </div>

        {/* Lista de templates */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map(template => {
            const validation = validationResults.get(template.id);
            return (
              <div
                key={template.id}
                className={`bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow cursor-pointer ${
                  selectedTemplate?.id === template.id ? 'ring-2 ring-blue-500' : ''
                }`}
                onClick={() => handleTemplateSelect(template)}
              >
                <div className="p-6">
                  {/* Header do card */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">{template.name}</h3>
                      <p className="text-sm text-gray-600">{template.norma}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {validation?.isCompliant ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <AlertTriangle className="w-5 h-5 text-red-500" />
                      )}
                    </div>
                  </div>
                  
                  {/* Descricao */}
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">{template.description}</p>
                  
                  {/* Metadados */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Categoria:</span>
                      <span className="font-medium">{getCategoryLabel(template.category)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Duracao:</span>
                      <span className="font-medium">{formatDuration(template.estimatedDuration)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Dificuldade:</span>
                      <span className="font-medium">{getDifficultyLabel(template.difficulty)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Status:</span>
                      <span className={`font-medium ${
                        validation?.isCompliant ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {getComplianceStatus(template.id)}
                      </span>
                    </div>
                  </div>
                  
                  {/* Tags */}
                  {template.tags && template.tags.length > 0 && (
                    <div className="mb-4">
                      <div className="flex flex-wrap gap-1">
                        {template.tags.slice(0, 3).map(tag => (
                          <span
                            key={tag}
                            className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded"
                          >
                            {tag}
                          </span>
                        ))}
                        {template.tags.length > 3 && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                            +{template.tags.length - 3}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Acoes */}
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTemplateSelect(template);
                        setActiveTab('customize');
                      }}
                      className="flex-1 bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700 flex items-center justify-center gap-1"
                    >
                      <Edit3 className="w-4 h-4" />
                      Personalizar
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTemplateSelect(template);
                        setActiveTab('compliance');
                      }}
                      className="px-3 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50 flex items-center justify-center"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Estado vazio */}
        {filteredTemplates.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum template encontrado</h3>
            <p className="text-gray-600">Tente ajustar os filtros para encontrar templates.</p>
          </div>
        )}
      </div>
    );
  };

  const renderCustomizeTab = () => {
    if (!selectedTemplate) {
      return (
        <div className="text-center py-12">
          <Settings className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Selecione um template</h3>
          <p className="text-gray-600">Escolha um template para personalizar.</p>
        </div>
      );
    }

    return (
      <div className="space-y-8">
        {/* Cores */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Palette className="w-5 h-5" />
            Esquema de Cores
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {Object.entries(customization.colors).map(([key, value]) => (
              <div key={key}>
                <label className="block text-sm font-medium mb-2 capitalize">
                  {key === 'primary' ? 'Primaria' : 
                   key === 'secondary' ? 'Secundaria' :
                   key === 'accent' ? 'Destaque' :
                   key === 'background' ? 'Fundo' : 'Texto'}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={value}
                    onChange={(e) => setCustomization(prev => ({
                      ...prev,
                      colors: { ...prev.colors, [key]: e.target.value }
                    }))}
                    className="w-12 h-10 border rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={value}
                    onChange={(e) => setCustomization(prev => ({
                      ...prev,
                      colors: { ...prev.colors, [key]: e.target.value }
                    }))}
                    className="flex-1 px-3 py-2 border rounded text-sm"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tipografia */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Type className="w-5 h-5" />
            Tipografia
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">Fonte Primaria</label>
              <select
                value={customization.fonts.primary}
                onChange={(e) => setCustomization(prev => ({
                  ...prev,
                  fonts: { ...prev.fonts, primary: e.target.value }
                }))}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="Inter">Inter</option>
                <option value="Roboto">Roboto</option>
                <option value="Open Sans">Open Sans</option>
                <option value="Lato">Lato</option>
                <option value="Montserrat">Montserrat</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Fonte Secundaria</label>
              <select
                value={customization.fonts.secondary}
                onChange={(e) => setCustomization(prev => ({
                  ...prev,
                  fonts: { ...prev.fonts, secondary: e.target.value }
                }))}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="Roboto">Roboto</option>
                <option value="Inter">Inter</option>
                <option value="Open Sans">Open Sans</option>
                <option value="Lato">Lato</option>
                <option value="Source Sans Pro">Source Sans Pro</option>
              </select>
            </div>
          </div>
          
          <div className="mt-4">
            <label className="block text-sm font-medium mb-2">Tamanhos de Fonte</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(customization.fonts.sizes).map(([size, value]) => (
                <div key={size}>
                  <label className="block text-xs text-gray-600 mb-1 capitalize">{size}</label>
                  <input
                    type="number"
                    min="8"
                    max="72"
                    value={value}
                    onChange={(e) => setCustomization(prev => ({
                      ...prev,
                      fonts: {
                        ...prev.fonts,
                        sizes: { ...prev.fonts.sizes, [size]: parseInt(e.target.value) }
                      }
                    }))}
                    className="w-full px-2 py-1 border rounded text-sm"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Branding */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Image className="w-5 h-5" />
            Identidade Visual
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Nome da Empresa</label>
              <input
                type="text"
                value={customization.branding.companyName}
                onChange={(e) => setCustomization(prev => ({
                  ...prev,
                  branding: { ...prev.branding, companyName: e.target.value }
                }))}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="Digite o nome da empresa..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">URL do Logo</label>
              <input
                type="url"
                value={customization.branding.companyLogo}
                onChange={(e) => setCustomization(prev => ({
                  ...prev,
                  branding: { ...prev.branding, companyLogo: e.target.value }
                }))}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="https://exemplo.com/logo.png"
              />
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="watermark"
                checked={customization.branding.watermark}
                onChange={(e) => setCustomization(prev => ({
                  ...prev,
                  branding: { ...prev.branding, watermark: e.target.checked }
                }))}
                className="mr-2"
              />
              <label htmlFor="watermark" className="text-sm">Adicionar marca d'agua</label>
            </div>
          </div>
        </div>

        {/* Conteudo */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Volume2 className="w-5 h-5" />
            Configuracoes de Conteudo
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">Terminologia</label>
              <select
                value={customization.content.terminology}
                onChange={(e) => setCustomization(prev => ({
                  ...prev,
                  content: { ...prev.content, terminology: e.target.value as any }
                }))}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="simple">Simples</option>
                <option value="technical">Tecnica</option>
                <option value="advanced">Avancada</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Complexidade</label>
              <select
                value={customization.content.complexity}
                onChange={(e) => setCustomization(prev => ({
                  ...prev,
                  content: { ...prev.content, complexity: e.target.value as any }
                }))}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="basic">Basica</option>
                <option value="intermediate">Intermediaria</option>
                <option value="advanced">Avancada</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Exemplos</label>
              <select
                value={customization.content.examples}
                onChange={(e) => setCustomization(prev => ({
                  ...prev,
                  content: { ...prev.content, examples: e.target.value as any }
                }))}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="generic">Genericos</option>
                <option value="industry-specific">Especificos da Industria</option>
                <option value="company-specific">Especificos da Empresa</option>
              </select>
            </div>
          </div>
        </div>

        {/* Acoes */}
        <div className="flex gap-4">
          <button
            onClick={handleSaveCustomization}
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Salvar Customizacao
          </button>
          
          <button
            onClick={handleGenerateProject}
            disabled={isLoading}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            <Play className="w-4 h-4" />
            {isLoading ? 'Gerando...' : 'Gerar Projeto'}
          </button>
        </div>
      </div>
    );
  };

  const renderComplianceTab = () => {
    if (!selectedTemplate) {
      return (
        <div className="text-center py-12">
          <CheckCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Selecione um template</h3>
          <p className="text-gray-600">Escolha um template para ver informacoes de compliance.</p>
        </div>
      );
    }

    const validation = validationResults.get(selectedTemplate.id);
    
    return (
      <div className="space-y-6">
        {/* Status geral */}
        <div className={`p-6 rounded-lg border-2 ${
          validation?.isCompliant ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-center gap-3 mb-4">
            {validation?.isCompliant ? 
              <CheckCircle className="w-8 h-8 text-green-600" /> :
              <AlertTriangle className="w-8 h-8 text-red-600" />
            }
            <div>
              <h3 className="text-xl font-semibold">
                {validation?.isCompliant ? 'Template Conforme' : 'Template Nao Conforme'}
              </h3>
              <p className="text-gray-600">{selectedTemplate.norma} - {selectedTemplate.name}</p>
            </div>
          </div>
        </div>

        {/* Informacoes da norma */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold mb-4">Informacoes da Norma</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <span className="text-sm text-gray-600">Norma:</span>
              <p className="font-medium">{selectedTemplate.compliance.normaNumber}</p>
            </div>
            <div>
              <span className="text-sm text-gray-600">Ultima Atualizacao:</span>
              <p className="font-medium">{selectedTemplate.compliance.lastUpdate}</p>
            </div>
          </div>
          
          <div className="mt-4">
            <span className="text-sm text-gray-600">Requisitos:</span>
            <ul className="mt-2 space-y-1">
              {selectedTemplate.compliance.requirements.map((req, index) => (
                <li key={index} className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-sm">{req}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Resultados da validacao */}
        {validation && (
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold mb-4">Resultados da Validacao</h3>
            <div className="space-y-3">
              {validation.results.map((result, index) => (
                <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
                  {result.passed ? 
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" /> :
                    <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5" />
                  }
                  <div className="flex-1">
                    <p className="font-medium">{result.description}</p>
                    <p className="text-sm text-gray-600">{result.message}</p>
                  </div>
                </div>
              ))}
            </div>
            
            {validation.recommendations.length > 0 && (
              <div className="mt-6">
                <h4 className="font-medium mb-2">Recomendacoes:</h4>
                <ul className="space-y-1">
                  {validation.recommendations.map((rec, index) => (
                    <li key={index} className="text-sm text-gray-600">- {rec}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* Wizard Modal */}
      {showWizard && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
            <NRTemplateWizard
              onClose={() => setShowWizard(false)}
              onSave={(template) => {
                setShowWizard(false);
                // Aqui você pode adicionar lógica para salvar o template
              }}
            />
          </div>
        </div>
      )}
      
      {/* Header */}
      <div className="bg-white shadow-sm border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Templates de Normas Regulamentadoras</h1>
            <p className="text-gray-600">Biblioteca completa de templates para treinamentos de seguranca</p>
          </div>
          
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowWizard(true)}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Criar Template
            </button>
            
            {selectedTemplate && (
              <>
                <div className="text-right">
                  <p className="font-medium">{selectedTemplate.name}</p>
                  <p className="text-sm text-gray-600">{selectedTemplate.norma}</p>
                </div>
                <button
                  onClick={handleGenerateProject}
                  disabled={isLoading}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  {isLoading ? 'Gerando...' : 'Gerar Projeto'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b">
        <div className="px-6">
          <div className="flex space-x-8">
            {[
              { id: 'browse', label: 'Navegar', icon: Search },
              { id: 'customize', label: 'Personalizar', icon: Settings },
              { id: 'compliance', label: 'Conformidade', icon: CheckCircle }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Conteudo */}
      <div className="flex-1 overflow-auto p-6">
        {isLoading && (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p>Carregando...</p>
            </div>
          </div>
        )}
        
        {!isLoading && (
          <>
            {activeTab === 'browse' && renderBrowseTab()}
            {activeTab === 'customize' && renderCustomizeTab()}
            {activeTab === 'compliance' && renderComplianceTab()}
          </>
        )}
      </div>
    </div>
  );
};

export default NRTemplateInterface;