import React, { useState, useEffect } from 'react';
import {
  Tag,
  Folder,
  Settings,
  Play,
  Download,
  Plus,
  X,
  BarChart3,
  Clock,
  Target,
  Palette,
  Filter,
  Search,
  Eye,
  Edit3
} from 'lucide-react';
import {
  useAIContentCategorization,
  useCategorizationStats,
  ContentTag,
  ContentCategory,
  VideoSegment,
  CategorizationResult,
  CategorizationSettings
} from '../../services/aiContentCategorizationService';

interface AIContentCategorizerProps {
  videoId: string;
  videoUrl: string;
  onCategorySelect?: (category: ContentCategory) => void;
  onTagSelect?: (tag: ContentTag) => void;
  onSegmentSelect?: (segment: VideoSegment) => void;
  onExportComplete?: (exportUrl: string) => void;
}

// Componente para exibir uma categoria
const CategoryCard: React.FC<{
  category: ContentCategory;
  onClick?: () => void;
  isSelected?: boolean;
}> = ({ category, onClick, isSelected }) => {
  return (
    <div
      onClick={onClick}
      className={`p-3 rounded-lg border cursor-pointer transition-all ${
        isSelected
          ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
      }`}
    >
      <div className="flex items-center space-x-2 mb-2">
        <div
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: category.color }}
        />
        <Folder className="w-4 h-4" />
        <span className="font-medium text-sm">{category.name}</span>
      </div>
      <p className="text-xs text-gray-600 dark:text-gray-400">
        {category.description}
      </p>
      {category.tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {category.tags.slice(0, 3).map(tag => (
            <span
              key={tag.id}
              className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-xs rounded"
            >
              {tag.name}
            </span>
          ))}
          {category.tags.length > 3 && (
            <span className="text-xs text-gray-500">+{category.tags.length - 3}</span>
          )}
        </div>
      )}
    </div>
  );
};

// Componente para exibir uma tag
const TagChip: React.FC<{
  tag: ContentTag;
  onClick?: () => void;
  onRemove?: () => void;
  showConfidence?: boolean;
}> = ({ tag, onClick, onRemove, showConfidence = true }) => {
  return (
    <div
      className="inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs border cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
      style={{ borderColor: tag.color, color: tag.color }}
      onClick={onClick}
    >
      <Tag className="w-3 h-3" />
      <span>{tag.name}</span>
      {showConfidence && (
        <span className="text-gray-500">({Math.round(tag.confidence * 100)}%)</span>
      )}
      {onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="ml-1 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-full p-0.5"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </div>
  );
};

// Componente para exibir um segmento
const SegmentCard: React.FC<{
  segment: VideoSegment;
  onClick?: () => void;
  onPlay?: () => void;
}> = ({ segment, onClick, onPlay }) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div
      onClick={onClick}
      className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-gray-300 dark:hover:border-gray-600 cursor-pointer"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <Clock className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium">
            {formatTime(segment.startTime)} - {formatTime(segment.endTime)}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-xs text-gray-500">
            {Math.round(segment.confidence * 100)}%
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPlay?.();
            }}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            <Play className="w-3 h-3" />
          </button>
        </div>
      </div>
      
      {segment.description && (
        <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
          {segment.description}
        </p>
      )}
      
      <div className="space-y-2">
        {segment.categories.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {segment.categories.map(category => (
              <span
                key={category.id}
                className="px-2 py-1 text-xs rounded"
                style={{ 
                  backgroundColor: `${category.color}20`,
                  color: category.color,
                  border: `1px solid ${category.color}40`
                }}
              >
                {category.name}
              </span>
            ))}
          </div>
        )}
        
        {segment.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {segment.tags.map(tag => (
              <TagChip
                key={tag.id}
                tag={tag}
                showConfidence={false}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Componente principal
const AIContentCategorizer: React.FC<AIContentCategorizerProps> = ({
  videoId,
  videoUrl,
  onCategorySelect,
  onTagSelect,
  onSegmentSelect,
  onExportComplete
}) => {
  const {
    isAnalyzing,
    currentAnalysis,
    settings,
    availableCategories,
    availableTags,
    analyzeContent,
    updateSettings,
    addCustomCategory,
    addCustomTag,
    exportCategorization
  } = useAIContentCategorization();
  
  const stats = useCategorizationStats();
  
  const [activeTab, setActiveTab] = useState<'analysis' | 'categories' | 'tags' | 'settings' | 'stats'>('analysis');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [showAddTag, setShowAddTag] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: '', description: '', color: '#3b82f6' });
  const [newTag, setNewTag] = useState({ name: '', category: '', color: '#3b82f6' });
  
  // Executar análise automaticamente
  useEffect(() => {
    if (videoId && videoUrl && !currentAnalysis) {
      handleAnalyze();
    }
  }, [videoId, videoUrl]);
  
  const handleAnalyze = async () => {
    try {
      await analyzeContent(videoId, videoUrl);
    } catch (error) {
      console.error('Erro na análise:', error);
    }
  };
  
  const handleExport = async () => {
    if (!currentAnalysis) return;
    
    try {
      const exportUrl = await exportCategorization(currentAnalysis);
      onExportComplete?.(exportUrl);
      
      // Download automático
      const link = document.createElement('a');
      link.href = exportUrl;
      link.download = `categorization_${videoId}_${Date.now()}.json`;
      link.click();
    } catch (error) {
      console.error('Erro no export:', error);
    }
  };
  
  const handleAddCategory = () => {
    if (newCategory.name && newCategory.description) {
      const category: ContentCategory = {
        id: `custom_${Date.now()}`,
        name: newCategory.name,
        description: newCategory.description,
        color: newCategory.color,
        icon: 'Folder',
        tags: []
      };
      
      addCustomCategory(category);
      setNewCategory({ name: '', description: '', color: '#3b82f6' });
      setShowAddCategory(false);
    }
  };
  
  const handleAddTag = () => {
    if (newTag.name && newTag.category) {
      const tag: ContentTag = {
        id: `custom_tag_${Date.now()}`,
        name: newTag.name,
        category: newTag.category,
        confidence: 0.8,
        color: newTag.color
      };
      
      addCustomTag(tag);
      setNewTag({ name: '', category: '', color: '#3b82f6' });
      setShowAddTag(false);
    }
  };
  
  const filteredSegments = currentAnalysis?.segments.filter(segment => {
    if (!searchTerm) return true;
    return (
      segment.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      segment.categories.some(cat => cat.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      segment.tags.some(tag => tag.name.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }) || [];
  
  const filteredCategories = availableCategories.filter(category => {
    if (!searchTerm) return true;
    return category.name.toLowerCase().includes(searchTerm.toLowerCase());
  });
  
  const filteredTags = availableTags.filter(tag => {
    if (!searchTerm) return true;
    if (selectedCategory && tag.category !== selectedCategory) return false;
    return tag.name.toLowerCase().includes(searchTerm.toLowerCase());
  });
  
  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-2">
          <Folder className="w-5 h-5 text-purple-500" />
          <h3 className="font-semibold">Categorização de Conteúdo</h3>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            className="px-3 py-1 bg-purple-500 text-white rounded text-sm hover:bg-purple-600 disabled:opacity-50 flex items-center space-x-1"
          >
            <Target className="w-4 h-4" />
            <span>{isAnalyzing ? 'Analisando...' : 'Analisar'}</span>
          </button>
          
          {currentAnalysis && (
            <button
              onClick={handleExport}
              className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600 flex items-center space-x-1"
            >
              <Download className="w-4 h-4" />
              <span>Exportar</span>
            </button>
          )}
        </div>
      </div>
      
      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        {[
          { id: 'analysis', name: 'Análise', icon: BarChart3 },
          { id: 'categories', name: 'Categorias', icon: Folder },
          { id: 'tags', name: 'Tags', icon: Tag },
          { id: 'settings', name: 'Configurações', icon: Settings },
          { id: 'stats', name: 'Estatísticas', icon: BarChart3 }
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 px-4 py-2 border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="text-sm">{tab.name}</span>
            </button>
          );
        })}
      </div>
      
      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {/* Análise */}
        {activeTab === 'analysis' && (
          <div className="h-full p-4 overflow-y-auto">
            {isAnalyzing ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-4"></div>
                  <p className="text-gray-600 dark:text-gray-400">Analisando conteúdo...</p>
                </div>
              </div>
            ) : currentAnalysis ? (
              <div className="space-y-6">
                {/* Resumo */}
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Resumo da Análise</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Segmentos:</span>
                      <p className="font-medium">{currentAnalysis.segments.length}</p>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Categorias:</span>
                      <p className="font-medium">{currentAnalysis.overallCategories.length}</p>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Tags:</span>
                      <p className="font-medium">{currentAnalysis.overallTags.length}</p>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Confiança:</span>
                      <p className="font-medium">{Math.round(currentAnalysis.confidence * 100)}%</p>
                    </div>
                  </div>
                </div>
                
                {/* Busca */}
                <div className="flex items-center space-x-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Buscar segmentos..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800"
                    />
                  </div>
                </div>
                
                {/* Segmentos */}
                <div className="space-y-3">
                  <h4 className="font-medium">Segmentos ({filteredSegments.length})</h4>
                  {filteredSegments.map(segment => (
                    <SegmentCard
                      key={segment.id}
                      segment={segment}
                      onClick={() => onSegmentSelect?.(segment)}
                      onPlay={() => onSegmentPlay?.(segment)}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">Clique em "Analisar" para começar</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AIContentCategorizer;