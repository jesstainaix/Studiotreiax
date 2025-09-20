import React, { useState, useEffect, useCallback } from 'react';
import { 
  Play, 
  Pause, 
  Download, 
  Eye, 
  Settings, 
  Zap, 
  Clock, 
  Star, 
  Filter,
  BarChart3,
  Trash2,
  Edit3,
  Share2,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Loader2,
  Brain,
  Target,
  Sparkles,
  TrendingUp
} from 'lucide-react';
import { useHighlightDetection, HighlightMoment, HighlightType, HighlightFilters } from '../../services/aiHighlightDetectionService';
import { toast } from 'sonner';

interface AIHighlightDetectorProps {
  videoId: string;
  videoUrl: string;
  onHighlightSelect?: (highlight: HighlightMoment) => void;
  onExportComplete?: (exportUrl: string) => void;
}

interface HighlightCard {
  highlight: HighlightMoment;
  isPlaying: boolean;
  onPlay: () => void;
  onPause: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onExport: (format: 'mp4' | 'gif' | 'webm') => void;
  onShare: () => void;
}

const HighlightTypeIcons: Record<HighlightType, React.ReactNode> = {
  'action-sequence': <Zap className="w-4 h-4" />,
  'emotional-peak': <Star className="w-4 h-4" />,
  'dialogue-highlight': <Brain className="w-4 h-4" />,
  'visual-spectacle': <Sparkles className="w-4 h-4" />,
  'music-climax': <TrendingUp className="w-4 h-4" />,
  'comedy-moment': <Star className="w-4 h-4" />,
  'dramatic-pause': <Clock className="w-4 h-4" />,
  'transition-effect': <RefreshCw className="w-4 h-4" />,
  'key-information': <Target className="w-4 h-4" />,
  'user-engagement': <TrendingUp className="w-4 h-4" />
};

const HighlightTypeColors: Record<HighlightType, string> = {
  'action-sequence': 'bg-red-500',
  'emotional-peak': 'bg-purple-500',
  'dialogue-highlight': 'bg-blue-500',
  'visual-spectacle': 'bg-green-500',
  'music-climax': 'bg-yellow-500',
  'comedy-moment': 'bg-pink-500',
  'dramatic-pause': 'bg-gray-500',
  'transition-effect': 'bg-indigo-500',
  'key-information': 'bg-orange-500',
  'user-engagement': 'bg-cyan-500'
};

const HighlightCard: React.FC<HighlightCard> = ({
  highlight,
  isPlaying,
  onPlay,
  onPause,
  onEdit,
  onDelete,
  onExport,
  onShare
}) => {
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return 'text-green-500';
    if (confidence >= 0.7) return 'text-yellow-500';
    return 'text-red-500';
  };

  const handleExport = async (format: 'mp4' | 'gif' | 'webm') => {
    setIsExporting(true);
    setShowExportMenu(false);
    
    try {
      await onExport(format);
      toast.success(`Highlight exportado como ${format.toUpperCase()}`);
    } catch (error) {
      toast.error('Erro ao exportar highlight');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-lg transition-shadow">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <div className={`p-2 rounded-full ${HighlightTypeColors[highlight.type]} text-white`}>
            {HighlightTypeIcons[highlight.type]}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {highlight.title}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {formatTime(highlight.startTime)} - {formatTime(highlight.endTime)}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-1">
          <span className={`text-sm font-medium ${getConfidenceColor(highlight.confidence)}`}>
            {Math.round(highlight.confidence * 100)}%
          </span>
          {highlight.metadata.reviewStatus === 'approved' && (
            <CheckCircle className="w-4 h-4 text-green-500" />
          )}
        </div>
      </div>

      {/* Thumbnail */}
      {highlight.thumbnail && (
        <div className="mb-3">
          <img 
            src={highlight.thumbnail} 
            alt={highlight.title}
            className="w-full h-32 object-cover rounded-lg"
          />
        </div>
      )}

      {/* Description */}
      <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
        {highlight.description}
      </p>

      {/* Tags */}
      {highlight.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {highlight.tags.map((tag, index) => (
            <span 
              key={index}
              className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-xs rounded-full text-gray-600 dark:text-gray-300"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 mb-3 text-xs text-gray-500 dark:text-gray-400">
        <div className="text-center">
          <div className="font-medium">{Math.round(highlight.duration)}s</div>
          <div>Duração</div>
        </div>
        <div className="text-center">
          <div className="font-medium">{highlight.metadata.viewCount}</div>
          <div>Visualizações</div>
        </div>
        <div className="text-center">
          <div className="font-medium">{highlight.metadata.exportCount}</div>
          <div>Exportações</div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-2">
          <button
            onClick={isPlaying ? onPause : onPlay}
            className="p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
          
          <button
            onClick={onEdit}
            className="p-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            <Edit3 className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={onShare}
            className="p-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
          >
            <Share2 className="w-4 h-4" />
          </button>
          
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              disabled={isExporting}
              className="p-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              {isExporting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
            </button>
            
            {showExportMenu && (
              <div className="absolute right-0 mt-2 w-32 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-10">
                <button
                  onClick={() => handleExport('mp4')}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded-t-lg"
                >
                  MP4
                </button>
                <button
                  onClick={() => handleExport('gif')}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  GIF
                </button>
                <button
                  onClick={() => handleExport('webm')}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded-b-lg"
                >
                  WebM
                </button>
              </div>
            )}
          </div>
          
          <button
            onClick={onDelete}
            className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

const AIHighlightDetector: React.FC<AIHighlightDetectorProps> = ({
  videoId,
  videoUrl,
  onHighlightSelect,
  onExportComplete
}) => {
  const {
    highlights,
    isAnalyzing,
    analysisProgress,
    settings,
    stats,
    analyzeVideo,
    getHighlights,
    updateHighlight,
    deleteHighlight,
    exportHighlight,
    generateHighlightReel,
    updateSettings,
    getAnalysisStats
  } = useHighlightDetection();

  const [activeTab, setActiveTab] = useState<'highlights' | 'settings' | 'stats'>('highlights');
  const [filters, setFilters] = useState<HighlightFilters>({});
  const [showFilters, setShowFilters] = useState(false);
  const [playingHighlight, setPlayingHighlight] = useState<string | null>(null);
  const [selectedHighlights, setSelectedHighlights] = useState<string[]>([]);
  const [showSettings, setShowSettings] = useState(false);

  const filteredHighlights = getHighlights(videoId, filters);
  const analysisStats = getAnalysisStats(videoId);

  useEffect(() => {
    // Auto-analisar se não há highlights para este vídeo
    if (filteredHighlights.length === 0 && !isAnalyzing) {
      handleAnalyze();
    }
  }, [videoId]);

  const handleAnalyze = useCallback(async () => {
    try {
      await analyzeVideo(videoId, videoUrl);
      toast.success('Análise de highlights concluída!');
    } catch (error) {
      toast.error('Erro na análise de highlights');
    }
  }, [videoId, videoUrl, analyzeVideo]);

  const handleHighlightPlay = useCallback((highlightId: string) => {
    setPlayingHighlight(highlightId);
    const highlight = filteredHighlights.find(h => h.id === highlightId);
    if (highlight && onHighlightSelect) {
      onHighlightSelect(highlight);
    }
  }, [filteredHighlights, onHighlightSelect]);

  const handleHighlightPause = useCallback(() => {
    setPlayingHighlight(null);
  }, []);

  const handleHighlightEdit = useCallback((highlightId: string) => {
    // Implementar edição de highlight
    toast.info('Funcionalidade de edição em desenvolvimento');
  }, []);

  const handleHighlightDelete = useCallback((highlightId: string) => {
    deleteHighlight(highlightId);
    toast.success('Highlight removido');
  }, [deleteHighlight]);

  const handleHighlightExport = useCallback(async (highlightId: string, format: 'mp4' | 'gif' | 'webm') => {
    try {
      const exportUrl = await exportHighlight(highlightId, format);
      if (onExportComplete) {
        onExportComplete(exportUrl);
      }
      return exportUrl;
    } catch (error) {
      throw error;
    }
  }, [exportHighlight, onExportComplete]);

  const handleHighlightShare = useCallback((highlightId: string) => {
    const highlight = filteredHighlights.find(h => h.id === highlightId);
    if (highlight) {
      // Implementar compartilhamento
      navigator.clipboard.writeText(`Highlight: ${highlight.title} (${highlight.startTime}s - ${highlight.endTime}s)`);
      toast.success('Link do highlight copiado!');
    }
  }, [filteredHighlights]);

  const handleGenerateReel = useCallback(async () => {
    try {
      const reel = await generateHighlightReel(videoId, 60); // 1 minuto
      toast.success(`Reel gerado com ${reel.length} highlights`);
    } catch (error) {
      toast.error('Erro ao gerar reel');
    }
  }, [videoId, generateHighlightReel]);

  const handleFilterChange = useCallback((newFilters: Partial<HighlightFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const handleSettingsChange = useCallback((newSettings: any) => {
    updateSettings(newSettings);
    toast.success('Configurações atualizadas');
  }, [updateSettings]);

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-500 rounded-lg">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Detecção de Highlights
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {filteredHighlights.length} highlights encontrados
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center space-x-2"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Analisando...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  <span>Analisar</span>
                </>
              )}
            </button>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className="p-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              <Filter className="w-4 h-4" />
            </button>

            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        {isAnalyzing && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Progresso da Análise
              </span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {analysisProgress}%
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${analysisProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex space-x-1">
          {[
            { id: 'highlights', label: 'Highlights', icon: <Star className="w-4 h-4" /> },
            { id: 'settings', label: 'Configurações', icon: <Settings className="w-4 h-4" /> },
            { id: 'stats', label: 'Estatísticas', icon: <BarChart3 className="w-4 h-4" /> }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-2 rounded-lg flex items-center space-x-2 transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {tab.icon}
              <span className="text-sm">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="p-4 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tipos de Highlight
              </label>
              <select
                multiple
                value={filters.types || []}
                onChange={(e) => {
                  const types = Array.from(e.target.selectedOptions, option => option.value) as HighlightType[];
                  handleFilterChange({ types });
                }}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="action-sequence">Sequência de Ação</option>
                <option value="emotional-peak">Pico Emocional</option>
                <option value="dialogue-highlight">Diálogo Importante</option>
                <option value="visual-spectacle">Espetáculo Visual</option>
                <option value="music-climax">Clímax Musical</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Confiança Mínima
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={filters.minConfidence || 0}
                onChange={(e) => handleFilterChange({ minConfidence: parseFloat(e.target.value) })}
                className="w-full"
              />
              <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {Math.round((filters.minConfidence || 0) * 100)}%
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Duração Mínima (s)
              </label>
              <input
                type="number"
                min="1"
                max="60"
                value={filters.minDuration || ''}
                onChange={(e) => handleFilterChange({ minDuration: parseInt(e.target.value) || undefined })}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Qualquer duração"
              />
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="p-4">
        {activeTab === 'highlights' && (
          <div>
            {filteredHighlights.length === 0 ? (
              <div className="text-center py-12">
                <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Nenhum highlight encontrado
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  Execute a análise para detectar momentos importantes no vídeo
                </p>
                <button
                  onClick={handleAnalyze}
                  disabled={isAnalyzing}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  {isAnalyzing ? 'Analisando...' : 'Iniciar Análise'}
                </button>
              </div>
            ) : (
              <>
                {/* Actions */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {selectedHighlights.length > 0 && `${selectedHighlights.length} selecionados`}
                    </span>
                  </div>
                  
                  <button
                    onClick={handleGenerateReel}
                    className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors flex items-center space-x-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Gerar Reel</span>
                  </button>
                </div>

                {/* Highlights Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredHighlights.map(highlight => (
                    <HighlightCard
                      key={highlight.id}
                      highlight={highlight}
                      isPlaying={playingHighlight === highlight.id}
                      onPlay={() => handleHighlightPlay(highlight.id)}
                      onPause={handleHighlightPause}
                      onEdit={() => handleHighlightEdit(highlight.id)}
                      onDelete={() => handleHighlightDelete(highlight.id)}
                      onExport={(format) => handleHighlightExport(highlight.id, format)}
                      onShare={() => handleHighlightShare(highlight.id)}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Configurações de Detecção
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Sensibilidade
                  </label>
                  <select
                    value={settings.sensitivity}
                    onChange={(e) => handleSettingsChange({ sensitivity: e.target.value })}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="low">Baixa</option>
                    <option value="medium">Média</option>
                    <option value="high">Alta</option>
                    <option value="custom">Personalizada</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Duração Mínima (s)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={settings.minHighlightDuration}
                    onChange={(e) => handleSettingsChange({ minHighlightDuration: parseInt(e.target.value) })}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Duração Máxima (s)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="300"
                    value={settings.maxHighlightDuration}
                    onChange={(e) => handleSettingsChange({ maxHighlightDuration: parseInt(e.target.value) })}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Limite de Confiança
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={settings.confidenceThreshold}
                    onChange={(e) => handleSettingsChange({ confidenceThreshold: parseFloat(e.target.value) })}
                    className="w-full"
                  />
                  <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {Math.round(settings.confidenceThreshold * 100)}%
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3">
                Pós-processamento
              </h4>
              
              <div className="space-y-3">
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={settings.postProcessing.mergeNearbyHighlights}
                    onChange={(e) => handleSettingsChange({
                      postProcessing: {
                        ...settings.postProcessing,
                        mergeNearbyHighlights: e.target.checked
                      }
                    })}
                    className="rounded"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Mesclar highlights próximos
                  </span>
                </label>

                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={settings.postProcessing.generateThumbnails}
                    onChange={(e) => handleSettingsChange({
                      postProcessing: {
                        ...settings.postProcessing,
                        generateThumbnails: e.target.checked
                      }
                    })}
                    className="rounded"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Gerar thumbnails automaticamente
                  </span>
                </label>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Estatísticas de Análise
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {analysisStats.highlightsFound}
                  </div>
                  <div className="text-sm text-blue-600 dark:text-blue-400">
                    Highlights Encontrados
                  </div>
                </div>
                
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {Math.round(analysisStats.averageScore * 100)}%
                  </div>
                  <div className="text-sm text-green-600 dark:text-green-400">
                    Confiança Média
                  </div>
                </div>
                
                <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {analysisStats.totalSegments}
                  </div>
                  <div className="text-sm text-purple-600 dark:text-purple-400">
                    Segmentos Analisados
                  </div>
                </div>
                
                <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                    {Math.round(analysisStats.processingTime / 1000)}s
                  </div>
                  <div className="text-sm text-orange-600 dark:text-orange-400">
                    Tempo de Processamento
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3">
                  Distribuição por Tipo
                </h4>
                
                <div className="space-y-2">
                  {Object.entries(analysisStats.typeBreakdown).map(([type, count]) => (
                    <div key={type} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-full ${HighlightTypeColors[type as HighlightType]} text-white`}>
                          {HighlightTypeIcons[type as HighlightType]}
                        </div>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {type.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </span>
                      </div>
                      <span className="text-sm font-bold text-gray-600 dark:text-gray-400">
                        {count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIHighlightDetector;