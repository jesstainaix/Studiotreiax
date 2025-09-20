import React, { useState, useEffect } from 'react';
import { 
  Image, 
  Download, 
  Settings, 
  Play, 
  Pause, 
  RotateCcw, 
  Trash2, 
  Eye, 
  Grid, 
  List,
  Filter,
  Wand2,
  Clock,
  Star,
  CheckSquare,
  Square,
  Palette,
  Type,
  Layout
} from 'lucide-react';
import { 
  useAIThumbnailGeneration, 
  useThumbnailStats,
  ThumbnailTemplate,
  GeneratedThumbnail,
  ThumbnailGenerationSettings
} from '../../services/aiThumbnailGenerationService';

// Interfaces
interface AIThumbnailGeneratorProps {
  videoId?: string;
  videoUrl?: string;
  onThumbnailSelect?: (thumbnail: GeneratedThumbnail) => void;
  onThumbnailGenerated?: (thumbnails: GeneratedThumbnail[]) => void;
}

interface TemplateCardProps {
  template: ThumbnailTemplate;
  isSelected: boolean;
  onSelect: (template: ThumbnailTemplate) => void;
}

interface ThumbnailCardProps {
  thumbnail: GeneratedThumbnail;
  isSelected: boolean;
  onSelect: (thumbnail: GeneratedThumbnail) => void;
  onDelete: (thumbnailId: string) => void;
  onPreview: (thumbnail: GeneratedThumbnail) => void;
}

interface SettingsPanelProps {
  settings: ThumbnailGenerationSettings;
  onSettingsChange: (settings: Partial<ThumbnailGenerationSettings>) => void;
  onClose: () => void;
}

// Componente de Card de Template
const TemplateCard: React.FC<TemplateCardProps> = ({ template, isSelected, onSelect }) => {
  return (
    <div 
      className={`relative p-3 rounded-lg border-2 cursor-pointer transition-all duration-200 hover:shadow-md ${
        isSelected 
          ? 'border-blue-500 bg-blue-50 shadow-md' 
          : 'border-gray-200 hover:border-gray-300'
      }`}
      onClick={() => onSelect(template)}
    >
      <div className="aspect-video bg-gray-100 rounded-md mb-2 overflow-hidden">
        <img 
          src={template.preview} 
          alt={template.name}
          className="w-full h-full object-cover"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = `https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=thumbnail%20template%20${template.style}&image_size=landscape_16_9`;
          }}
        />
      </div>
      
      <div className="space-y-1">
        <h4 className="font-medium text-sm text-gray-900">{template.name}</h4>
        <p className="text-xs text-gray-600">{template.description}</p>
        
        <div className="flex items-center gap-2 mt-2">
          <span className={`px-2 py-1 text-xs rounded-full ${
            template.style === 'modern' ? 'bg-blue-100 text-blue-700' :
            template.style === 'cinematic' ? 'bg-purple-100 text-purple-700' :
            template.style === 'vibrant' ? 'bg-orange-100 text-orange-700' :
            template.style === 'minimal' ? 'bg-gray-100 text-gray-700' :
            template.style === 'dark' ? 'bg-gray-800 text-white' :
            'bg-indigo-100 text-indigo-700'
          }`}>
            {template.style}
          </span>
          
          <div className="flex items-center gap-1">
            {template.colorScheme.slice(0, 3).map((color, index) => (
              <div 
                key={index}
                className="w-3 h-3 rounded-full border border-gray-300"
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>
      </div>
      
      {isSelected && (
        <div className="absolute top-2 right-2 bg-blue-500 text-white rounded-full p-1">
          <CheckSquare className="w-3 h-3" />
        </div>
      )}
    </div>
  );
};

// Componente de Card de Thumbnail
const ThumbnailCard: React.FC<ThumbnailCardProps> = ({ 
  thumbnail, 
  isSelected, 
  onSelect, 
  onDelete, 
  onPreview 
}) => {
  const formatTimestamp = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };
  
  return (
    <div className={`relative group rounded-lg border-2 overflow-hidden transition-all duration-200 ${
      isSelected 
        ? 'border-blue-500 shadow-md' 
        : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
    }`}>
      <div className="aspect-video bg-gray-100 relative overflow-hidden">
        <img 
          src={thumbnail.url} 
          alt={thumbnail.title}
          className="w-full h-full object-cover cursor-pointer"
          onClick={() => onSelect(thumbnail)}
        />
        
        {/* Overlay com controles */}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-2">
            <button
              onClick={() => onPreview(thumbnail)}
              className="p-2 bg-white bg-opacity-90 rounded-full hover:bg-opacity-100 transition-all"
              title="Visualizar"
            >
              <Eye className="w-4 h-4 text-gray-700" />
            </button>
            
            <button
              onClick={() => onDelete(thumbnail.id)}
              className="p-2 bg-red-500 bg-opacity-90 rounded-full hover:bg-opacity-100 transition-all"
              title="Excluir"
            >
              <Trash2 className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
        
        {/* Timestamp */}
        <div className="absolute top-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
          {formatTimestamp(thumbnail.timestamp)}
        </div>
        
        {/* Indicador de seleção */}
        {isSelected && (
          <div className="absolute top-2 left-2 bg-blue-500 text-white rounded-full p-1">
            <CheckSquare className="w-3 h-3" />
          </div>
        )}
      </div>
      
      <div className="p-3 space-y-2">
        <h4 className="font-medium text-sm text-gray-900 truncate">{thumbnail.title}</h4>
        
        <div className="flex items-center justify-between text-xs text-gray-600">
          <span>{thumbnail.template.name}</span>
          <div className="flex items-center gap-1">
            <Star className="w-3 h-3 fill-current text-yellow-400" />
            <span>{(thumbnail.confidence * 100).toFixed(0)}%</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 text-xs rounded-full ${
            thumbnail.quality === 'ultra' ? 'bg-green-100 text-green-700' :
            thumbnail.quality === 'high' ? 'bg-blue-100 text-blue-700' :
            thumbnail.quality === 'medium' ? 'bg-yellow-100 text-yellow-700' :
            'bg-gray-100 text-gray-700'
          }`}>
            {thumbnail.quality}
          </span>
          
          {thumbnail.metadata.faceCount > 0 && (
            <span className="text-xs text-gray-500">
              {thumbnail.metadata.faceCount} rosto(s)
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

// Painel de Configurações
const SettingsPanel: React.FC<SettingsPanelProps> = ({ settings, onSettingsChange, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Configurações de Thumbnail</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
        
        <div className="space-y-4">
          {/* Geração Automática */}
          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={settings.autoGenerate}
                onChange={(e) => onSettingsChange({ autoGenerate: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm font-medium">Geração Automática</span>
            </label>
            
            <label className="flex items-center gap-2 ml-6">
              <input
                type="checkbox"
                checked={settings.generateOnKeyframes}
                onChange={(e) => onSettingsChange({ generateOnKeyframes: e.target.checked })}
                disabled={!settings.autoGenerate}
                className="rounded"
              />
              <span className="text-sm text-gray-600">Em keyframes</span>
            </label>
            
            <label className="flex items-center gap-2 ml-6">
              <input
                type="checkbox"
                checked={settings.generateOnSceneChange}
                onChange={(e) => onSettingsChange({ generateOnSceneChange: e.target.checked })}
                disabled={!settings.autoGenerate}
                className="rounded"
              />
              <span className="text-sm text-gray-600">Em mudanças de cena</span>
            </label>
          </div>
          
          {/* Qualidade */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Qualidade</label>
            <select
              value={settings.quality}
              onChange={(e) => onSettingsChange({ quality: e.target.value as any })}
              className="w-full p-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="low">Baixa</option>
              <option value="medium">Média</option>
              <option value="high">Alta</option>
              <option value="ultra">Ultra</option>
            </select>
          </div>
          
          {/* Formato */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Formato</label>
            <select
              value={settings.preferredFormat}
              onChange={(e) => onSettingsChange({ preferredFormat: e.target.value as any })}
              className="w-full p-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="jpg">JPG</option>
              <option value="png">PNG</option>
              <option value="webp">WebP</option>
            </select>
          </div>
          
          {/* Máximo de Thumbnails */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Máximo por Vídeo</label>
            <input
              type="number"
              min="1"
              max="20"
              value={settings.maxThumbnailsPerVideo}
              onChange={(e) => onSettingsChange({ maxThumbnailsPerVideo: parseInt(e.target.value) })}
              className="w-full p-2 border border-gray-300 rounded-md text-sm"
            />
          </div>
          
          {/* Incluir Elementos */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Incluir</label>
            
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={settings.includeTitle}
                onChange={(e) => onSettingsChange({ includeTitle: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm">Título</span>
            </label>
            
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={settings.includeTimestamp}
                onChange={(e) => onSettingsChange({ includeTimestamp: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm">Timestamp</span>
            </label>
          </div>
          
          {/* Melhoramento com IA */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">IA Avançada</label>
            
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={settings.aiEnhancement}
                onChange={(e) => onSettingsChange({ aiEnhancement: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm">Melhoramento automático</span>
            </label>
            
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={settings.faceDetection}
                onChange={(e) => onSettingsChange({ faceDetection: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm">Detecção de rostos</span>
            </label>
            
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={settings.textExtraction}
                onChange={(e) => onSettingsChange({ textExtraction: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm">Extração de texto</span>
            </label>
          </div>
        </div>
        
        <div className="flex gap-2 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

// Componente Principal
const AIThumbnailGenerator: React.FC<AIThumbnailGeneratorProps> = ({
  videoId = 'demo-video',
  videoUrl = '/demo-video.mp4',
  onThumbnailSelect,
  onThumbnailGenerated
}) => {
  const {
    isGenerating,
    isAnalyzing,
    currentAnalysis,
    generatedThumbnails,
    selectedThumbnails,
    settings,
    availableTemplates,
    analyzeVideo,
    generateThumbnails,
    generateSingleThumbnail,
    updateSettings,
    selectThumbnail,
    deselectThumbnail,
    deleteThumbnail,
    exportThumbnails,
    clearThumbnails
  } = useAIThumbnailGeneration();
  
  const stats = useThumbnailStats();
  
  const [activeTab, setActiveTab] = useState<'generate' | 'templates' | 'gallery'>('generate');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedTemplate, setSelectedTemplate] = useState<ThumbnailTemplate | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [previewThumbnail, setPreviewThumbnail] = useState<GeneratedThumbnail | null>(null);
  const [customTimestamp, setCustomTimestamp] = useState('');
  
  // Filtrar thumbnails do vídeo atual
  const videoThumbnails = generatedThumbnails.filter(thumb => thumb.videoId === videoId);
  
  // Handlers
  const handleAnalyzeVideo = async () => {
    try {
      await analyzeVideo(videoId, videoUrl);
    } catch (error) {
      console.error('Erro ao analisar vídeo:', error);
    }
  };
  
  const handleGenerateThumbnails = async () => {
    try {
      const thumbnails = await generateThumbnails(videoId);
      onThumbnailGenerated?.(thumbnails);
    } catch (error) {
      console.error('Erro ao gerar thumbnails:', error);
    }
  };
  
  const handleGenerateCustom = async () => {
    if (!customTimestamp) return;
    
    const timestamp = parseFloat(customTimestamp);
    if (isNaN(timestamp)) return;
    
    try {
      const thumbnail = await generateSingleThumbnail(videoId, timestamp, selectedTemplate || undefined);
      onThumbnailGenerated?.([thumbnail]);
    } catch (error) {
      console.error('Erro ao gerar thumbnail customizado:', error);
    }
  };
  
  const handleThumbnailSelect = (thumbnail: GeneratedThumbnail) => {
    const isSelected = selectedThumbnails.includes(thumbnail.id);
    
    if (isSelected) {
      deselectThumbnail(thumbnail.id);
    } else {
      selectThumbnail(thumbnail.id);
    }
    
    onThumbnailSelect?.(thumbnail);
  };
  
  const handleExportSelected = async () => {
    if (selectedThumbnails.length === 0) return;
    
    try {
      const urls = await exportThumbnails(selectedThumbnails);
    } catch (error) {
      console.error('Erro ao exportar thumbnails:', error);
    }
  };
  
  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Image className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Gerador de Thumbnails IA</h2>
            <p className="text-sm text-gray-600">Crie thumbnails automáticos com inteligência artificial</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            title={`Visualização em ${viewMode === 'grid' ? 'lista' : 'grade'}`}
          >
            {viewMode === 'grid' ? <List className="w-4 h-4" /> : <Grid className="w-4 h-4" />}
          </button>
          
          <button
            onClick={() => setShowSettings(true)}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            title="Configurações"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      {/* Estatísticas */}
      {stats.totalThumbnails > 0 && (
        <div className="p-4 bg-gray-50 border-b border-gray-200">
          <div className="grid grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-lg font-semibold text-gray-900">{stats.totalThumbnails}</div>
              <div className="text-xs text-gray-600">Total</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-gray-900">{(stats.averageConfidence * 100).toFixed(0)}%</div>
              <div className="text-xs text-gray-600">Confiança</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-gray-900">{selectedThumbnails.length}</div>
              <div className="text-xs text-gray-600">Selecionados</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-gray-900">{(stats.averageEmotionScore * 100).toFixed(0)}%</div>
              <div className="text-xs text-gray-600">Emoção</div>
            </div>
          </div>
        </div>
      )}
      
      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        {[
          { id: 'generate', label: 'Gerar', icon: Wand2 },
          { id: 'templates', label: 'Templates', icon: Layout },
          { id: 'gallery', label: 'Galeria', icon: Image }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>
      
      {/* Conteúdo */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'generate' && (
          <div className="h-full p-4 space-y-4">
            {/* Controles de Geração */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-4">
              <h3 className="font-medium text-gray-900">Geração Automática</h3>
              
              <div className="flex gap-2">
                <button
                  onClick={handleAnalyzeVideo}
                  disabled={isAnalyzing}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isAnalyzing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Analisando...
                    </>
                  ) : (
                    <>
                      <Eye className="w-4 h-4" />
                      Analisar Vídeo
                    </>
                  )}
                </button>
                
                <button
                  onClick={handleGenerateThumbnails}
                  disabled={isGenerating || !currentAnalysis}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isGenerating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Gerando...
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-4 h-4" />
                      Gerar Thumbnails
                    </>
                  )}
                </button>
              </div>
              
              {currentAnalysis && (
                <div className="text-sm text-gray-600">
                  <p>✓ Análise concluída: {currentAnalysis.recommendations.length} pontos recomendados</p>
                </div>
              )}
            </div>
            
            {/* Geração Customizada */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-4">
              <h3 className="font-medium text-gray-900">Geração Customizada</h3>
              
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Timestamp (segundos)"
                  value={customTimestamp}
                  onChange={(e) => setCustomTimestamp(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
                
                <button
                  onClick={handleGenerateCustom}
                  disabled={!customTimestamp || isGenerating}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Clock className="w-4 h-4" />
                  Gerar
                </button>
              </div>
              
              {selectedTemplate && (
                <div className="text-sm text-gray-600">
                  Template selecionado: <span className="font-medium">{selectedTemplate.name}</span>
                </div>
              )}
            </div>
          </div>
        )}
        
        {activeTab === 'templates' && (
          <div className="h-full p-4">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {availableTemplates.map(template => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  isSelected={selectedTemplate?.id === template.id}
                  onSelect={setSelectedTemplate}
                />
              ))}
            </div>
          </div>
        )}
        
        {activeTab === 'gallery' && (
          <div className="h-full flex flex-col">
            {/* Controles da Galeria */}
            {videoThumbnails.length > 0 && (
              <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  {videoThumbnails.length} thumbnail(s) • {selectedThumbnails.length} selecionado(s)
                </div>
                
                <div className="flex gap-2">
                  {selectedThumbnails.length > 0 && (
                    <button
                      onClick={handleExportSelected}
                      className="flex items-center gap-2 px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
                    >
                      <Download className="w-4 h-4" />
                      Exportar
                    </button>
                  )}
                  
                  <button
                    onClick={clearThumbnails}
                    className="flex items-center gap-2 px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm"
                  >
                    <Trash2 className="w-4 h-4" />
                    Limpar
                  </button>
                </div>
              </div>
            )}
            
            {/* Lista de Thumbnails */}
            <div className="flex-1 overflow-y-auto p-4">
              {videoThumbnails.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                  <Image className="w-12 h-12 mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">Nenhum thumbnail gerado</p>
                  <p className="text-sm text-center max-w-md">
                    Use a aba "Gerar" para criar thumbnails automáticos ou customizados para este vídeo.
                  </p>
                </div>
              ) : (
                <div className={`grid gap-4 ${
                  viewMode === 'grid' 
                    ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4' 
                    : 'grid-cols-1'
                }`}>
                  {videoThumbnails.map(thumbnail => (
                    <ThumbnailCard
                      key={thumbnail.id}
                      thumbnail={thumbnail}
                      isSelected={selectedThumbnails.includes(thumbnail.id)}
                      onSelect={handleThumbnailSelect}
                      onDelete={deleteThumbnail}
                      onPreview={setPreviewThumbnail}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* Modal de Configurações */}
      {showSettings && (
        <SettingsPanel
          settings={settings}
          onSettingsChange={updateSettings}
          onClose={() => setShowSettings(false)}
        />
      )}
      
      {/* Modal de Preview */}
      {previewThumbnail && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-4 max-w-2xl w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Preview - {previewThumbnail.title}</h3>
              <button
                onClick={() => setPreviewThumbnail(null)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            
            <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden mb-4">
              <img 
                src={previewThumbnail.url} 
                alt={previewThumbnail.title}
                className="w-full h-full object-cover"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Template:</span> {previewThumbnail.template.name}
              </div>
              <div>
                <span className="font-medium">Qualidade:</span> {previewThumbnail.quality}
              </div>
              <div>
                <span className="font-medium">Confiança:</span> {(previewThumbnail.confidence * 100).toFixed(0)}%
              </div>
              <div>
                <span className="font-medium">Rostos:</span> {previewThumbnail.metadata.faceCount}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIThumbnailGenerator;