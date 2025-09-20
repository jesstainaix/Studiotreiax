// Interface para sistema de análise inteligente de PPTX
import React, { useState, useEffect, useCallback } from 'react';
import { 
  PPTXAnalysisSystem, 
  PPTXSlide, 
  PPTXMetadata, 
  ContentAnalysis,
  ConversionOptions,
  ConversionResult
} from '../../services/PPTXAnalysisSystem';
import { VideoProject } from '../../types/video';
import { 
  Upload, 
  FileText, 
  Play, 
  Settings, 
  Download, 
  Eye, 
  Brain, 
  Wand2, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  Users, 
  BarChart3, 
  Image, 
  Type, 
  Volume2, 
  Subtitles,
  Palette,
  Zap,
  Target,
  TrendingUp,
  Lightbulb,
  ArrowRight,
  RefreshCw
} from 'lucide-react';

interface PPTXAnalysisInterfaceProps {
  onProjectGenerated?: (project: VideoProject) => void;
  onAnalysisComplete?: (analysis: ContentAnalysis) => void;
}

interface UploadState {
  isDragging: boolean;
  isUploading: boolean;
  progress: number;
  error: string | null;
}

interface ProcessingState {
  isAnalyzing: boolean;
  isConverting: boolean;
  progress: number;
  currentStep: string;
  eta: number;
}

const PPTXAnalysisInterface: React.FC<PPTXAnalysisInterfaceProps> = ({
  onProjectGenerated,
  onAnalysisComplete
}) => {
  const [analysisSystem] = useState(() => new PPTXAnalysisSystem());
  const [activeTab, setActiveTab] = useState<'upload' | 'analysis' | 'conversion' | 'preview'>('upload');
  
  // Estados de upload
  const [uploadState, setUploadState] = useState<UploadState>({
    isDragging: false,
    isUploading: false,
    progress: 0,
    error: null
  });
  
  // Estados de processamento
  const [processingState, setProcessingState] = useState<ProcessingState>({
    isAnalyzing: false,
    isConverting: false,
    progress: 0,
    currentStep: '',
    eta: 0
  });
  
  // Dados do arquivo
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [slides, setSlides] = useState<PPTXSlide[]>([]);
  const [metadata, setMetadata] = useState<PPTXMetadata | null>(null);
  const [analysis, setAnalysis] = useState<ContentAnalysis | null>(null);
  const [conversionResult, setConversionResult] = useState<ConversionResult | null>(null);
  
  // Configurações de conversão
  const [conversionOptions, setConversionOptions] = useState<ConversionOptions>({
    outputFormat: 'mp4',
    resolution: '1080p',
    framerate: 30,
    quality: 'high',
    includeAnimations: true,
    includeTransitions: true,
    includeNarration: true,
    includeSubtitles: true,
    customBranding: false,
    templateStyle: 'modern'
  });

  // Handlers de upload
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setUploadState(prev => ({ ...prev, isDragging: true }));
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setUploadState(prev => ({ ...prev, isDragging: false }));
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setUploadState(prev => ({ ...prev, isDragging: false }));
    
    const files = Array.from(e.dataTransfer.files);
    const pptxFile = files.find(file => 
      file.name.toLowerCase().endsWith('.pptx') || 
      file.name.toLowerCase().endsWith('.ppt')
    );
    
    if (pptxFile) {
      await handleFileUpload(pptxFile);
    } else {
      setUploadState(prev => ({ 
        ...prev, 
        error: 'Por favor, selecione um arquivo PowerPoint (.pptx ou .ppt)' 
      }));
    }
  }, []);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await handleFileUpload(file);
    }
  }, []);

  const handleFileUpload = async (file: File) => {
    try {
      setUploadState({
        isDragging: false,
        isUploading: true,
        progress: 0,
        error: null
      });
      
      setCurrentFile(file);
      
      // Simular progresso de upload
      for (let i = 0; i <= 100; i += 10) {
        setUploadState(prev => ({ ...prev, progress: i }));
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // Analisar arquivo
      await analyzeFile(file);
      
      setUploadState(prev => ({ ...prev, isUploading: false }));
      setActiveTab('analysis');
      
    } catch (error) {
      console.error('Erro no upload:', error);
      setUploadState({
        isDragging: false,
        isUploading: false,
        progress: 0,
        error: error.message || 'Erro no upload do arquivo'
      });
    }
  };

  const analyzeFile = async (file: File) => {
    try {
      setProcessingState(prev => ({ 
        ...prev, 
        isAnalyzing: true, 
        currentStep: 'Extraindo slides...',
        progress: 0
      }));
      
      // Extrair slides e metadata
      const { slides: extractedSlides, metadata: extractedMetadata } = 
        await analysisSystem.analyzePPTX(file);
      
      setSlides(extractedSlides);
      setMetadata(extractedMetadata);
      
      setProcessingState(prev => ({ 
        ...prev, 
        currentStep: 'Analisando conteúdo...',
        progress: 50
      }));
      
      // Analisar conteúdo
      const contentAnalysis = await analysisSystem.analyzeContent(extractedSlides);
      setAnalysis(contentAnalysis);
      onAnalysisComplete?.(contentAnalysis);
      
      // Aplicar configurações recomendadas
      const recommendedSettings = analysisSystem.getRecommendedSettings(contentAnalysis);
      setConversionOptions(prev => ({ ...prev, ...recommendedSettings }));
      
      setProcessingState(prev => ({ 
        ...prev, 
        isAnalyzing: false,
        progress: 100
      }));
      
    } catch (error) {
      console.error('Erro na análise:', error);
      setProcessingState(prev => ({ ...prev, isAnalyzing: false }));
      throw error;
    }
  };

  const handleConversion = async () => {
    if (!slides.length || !analysis) return;
    
    try {
      setProcessingState(prev => ({ 
        ...prev, 
        isConverting: true,
        currentStep: 'Iniciando conversão...',
        progress: 0
      }));
      
      // Simular progresso de conversão
      const steps = [
        'Preparando projeto...',
        'Convertendo slides...',
        'Aplicando efeitos...',
        'Gerando narração...',
        'Finalizando projeto...'
      ];
      
      for (let i = 0; i < steps.length; i++) {
        setProcessingState(prev => ({ 
          ...prev, 
          currentStep: steps[i],
          progress: (i + 1) * 20
        }));
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      const result = await analysisSystem.convertToVideoProject(
        slides, 
        analysis, 
        conversionOptions
      );
      
      setConversionResult(result);
      
      if (result.success) {
        onProjectGenerated?.(result.videoProject);
        setActiveTab('preview');
      }
      
      setProcessingState(prev => ({ 
        ...prev, 
        isConverting: false,
        progress: 100
      }));
      
    } catch (error) {
      console.error('Erro na conversão:', error);
      setProcessingState(prev => ({ ...prev, isConverting: false }));
    }
  };

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getComplexityColor = (complexity: string): string => {
    switch (complexity) {
      case 'basic': return 'text-green-600 bg-green-100';
      case 'intermediate': return 'text-yellow-600 bg-yellow-100';
      case 'advanced': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getAudienceIcon = (audience: string) => {
    switch (audience) {
      case 'general': return <Users className="w-4 h-4" />;
      case 'technical': return <Settings className="w-4 h-4" />;
      case 'executive': return <Target className="w-4 h-4" />;
      default: return <Users className="w-4 h-4" />;
    }
  };

  const renderUploadTab = () => (
    <div className="space-y-6">
      {/* Área de upload */}
      <div 
        className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
          uploadState.isDragging 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {uploadState.isUploading ? (
          <div className="space-y-4">
            <RefreshCw className="w-12 h-12 text-blue-600 mx-auto animate-spin" />
            <div>
              <p className="text-lg font-medium">Fazendo upload...</p>
              <div className="w-64 bg-gray-200 rounded-full h-2 mx-auto mt-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadState.progress}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-600 mt-1">{uploadState.progress}%</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <Upload className="w-12 h-12 text-gray-400 mx-auto" />
            <div>
              <p className="text-lg font-medium">Arraste seu arquivo PowerPoint aqui</p>
              <p className="text-gray-600">ou clique para selecionar</p>
            </div>
            <input
              type="file"
              accept=".pptx,.ppt"
              onChange={handleFileSelect}
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 cursor-pointer"
            >
              Selecionar Arquivo
            </label>
            <p className="text-sm text-gray-500">Suporta arquivos .pptx e .ppt</p>
          </div>
        )}
      </div>

      {uploadState.error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <p className="text-red-800">{uploadState.error}</p>
          </div>
        </div>
      )}

      {/* Informações sobre o processo */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Brain className="w-5 h-5 text-blue-600" />
          Como funciona a análise inteligente
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <FileText className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <h4 className="font-medium mb-1">1. Extração</h4>
              <p className="text-sm text-gray-600">Extraímos conteúdo, imagens e estrutura dos slides</p>
            </div>
          </div>
          <div className="text-center">
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <Brain className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <h4 className="font-medium mb-1">2. Análise IA</h4>
              <p className="text-sm text-gray-600">IA analisa tópicos, complexidade e público-alvo</p>
            </div>
          </div>
          <div className="text-center">
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <Wand2 className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <h4 className="font-medium mb-1">3. Conversão</h4>
              <p className="text-sm text-gray-600">Geramos projeto de vídeo otimizado automaticamente</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAnalysisTab = () => {
    if (!analysis || !metadata) {
      return (
        <div className="text-center py-12">
          <Brain className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma análise disponível</h3>
          <p className="text-gray-600">Faça upload de um arquivo para ver a análise.</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Resumo geral */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-xl font-semibold mb-4">Resumo da Análise</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-2">
                <FileText className="w-8 h-8 text-blue-600" />
              </div>
              <p className="text-2xl font-bold">{metadata.slideCount}</p>
              <p className="text-sm text-gray-600">Slides</p>
            </div>
            <div className="text-center">
              <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-2">
                <Clock className="w-8 h-8 text-green-600" />
              </div>
              <p className="text-2xl font-bold">{formatDuration(analysis.estimatedDuration)}</p>
              <p className="text-sm text-gray-600">Duração estimada</p>
            </div>
            <div className="text-center">
              <div className={`rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-2 ${
                getComplexityColor(analysis.complexity).replace('text-', 'text-').replace('bg-', 'bg-')
              }`}>
                <BarChart3 className="w-8 h-8" />
              </div>
              <p className="text-2xl font-bold capitalize">{analysis.complexity}</p>
              <p className="text-sm text-gray-600">Complexidade</p>
            </div>
            <div className="text-center">
              <div className="bg-purple-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-2">
                {getAudienceIcon(analysis.targetAudience)}
              </div>
              <p className="text-2xl font-bold capitalize">{analysis.targetAudience}</p>
              <p className="text-sm text-gray-600">Público-alvo</p>
            </div>
          </div>
        </div>

        {/* Tópicos identificados */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Tópicos Identificados
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {analysis.topics.map((topic, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">{topic.name}</h4>
                  <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    {Math.round(topic.confidence * 100)}%
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-2">{topic.category}</p>
                <div className="flex flex-wrap gap-1">
                  {topic.keywords.slice(0, 3).map((keyword, i) => (
                    <span key={i} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pontos principais */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Lightbulb className="w-5 h-5" />
            Pontos Principais
          </h3>
          <ul className="space-y-2">
            {analysis.keyPoints.slice(0, 5).map((point, index) => (
              <li key={index} className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm">{point}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Elementos visuais */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Image className="w-5 h-5" />
            Elementos Visuais Detectados
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {analysis.visualElements.slice(0, 6).map((element, index) => (
              <div key={index} className="border rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium capitalize">{element.type}</span>
                  <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                    {Math.round(element.importance * 100)}%
                  </span>
                </div>
                <p className="text-xs text-gray-600 mb-1">{element.suggestedAnimation}</p>
                <p className="text-xs text-gray-500">{element.enhancementSuggestions[0]}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Botão para próxima etapa */}
        <div className="flex justify-end">
          <button
            onClick={() => setActiveTab('conversion')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            Configurar Conversão
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };

  const renderConversionTab = () => (
    <div className="space-y-6">
      {/* Configurações de vídeo */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Configurações de Vídeo
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium mb-2">Formato</label>
            <select
              value={conversionOptions.outputFormat}
              onChange={(e) => setConversionOptions(prev => ({ 
                ...prev, 
                outputFormat: e.target.value as any 
              }))}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="mp4">MP4</option>
              <option value="webm">WebM</option>
              <option value="mov">MOV</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Resolução</label>
            <select
              value={conversionOptions.resolution}
              onChange={(e) => setConversionOptions(prev => ({ 
                ...prev, 
                resolution: e.target.value as any 
              }))}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="720p">HD (720p)</option>
              <option value="1080p">Full HD (1080p)</option>
              <option value="4k">4K Ultra HD</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Taxa de Quadros</label>
            <select
              value={conversionOptions.framerate}
              onChange={(e) => setConversionOptions(prev => ({ 
                ...prev, 
                framerate: parseInt(e.target.value) as any 
              }))}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value={24}>24 fps</option>
              <option value={30}>30 fps</option>
              <option value={60}>60 fps</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Qualidade</label>
            <select
              value={conversionOptions.quality}
              onChange={(e) => setConversionOptions(prev => ({ 
                ...prev, 
                quality: e.target.value as any 
              }))}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="low">Baixa</option>
              <option value="medium">Média</option>
              <option value="high">Alta</option>
              <option value="ultra">Ultra</option>
            </select>
          </div>
        </div>
      </div>

      {/* Opções de conteúdo */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5" />
          Opções de Conteúdo
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="animations"
                checked={conversionOptions.includeAnimations}
                onChange={(e) => setConversionOptions(prev => ({ 
                  ...prev, 
                  includeAnimations: e.target.checked 
                }))}
                className="mr-3"
              />
              <label htmlFor="animations" className="flex items-center gap-2">
                <Wand2 className="w-4 h-4" />
                Incluir animações
              </label>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="transitions"
                checked={conversionOptions.includeTransitions}
                onChange={(e) => setConversionOptions(prev => ({ 
                  ...prev, 
                  includeTransitions: e.target.checked 
                }))}
                className="mr-3"
              />
              <label htmlFor="transitions" className="flex items-center gap-2">
                <ArrowRight className="w-4 h-4" />
                Incluir transições
              </label>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="narration"
                checked={conversionOptions.includeNarration}
                onChange={(e) => setConversionOptions(prev => ({ 
                  ...prev, 
                  includeNarration: e.target.checked 
                }))}
                className="mr-3"
              />
              <label htmlFor="narration" className="flex items-center gap-2">
                <Volume2 className="w-4 h-4" />
                Incluir narração automática
              </label>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="subtitles"
                checked={conversionOptions.includeSubtitles}
                onChange={(e) => setConversionOptions(prev => ({ 
                  ...prev, 
                  includeSubtitles: e.target.checked 
                }))}
                className="mr-3"
              />
              <label htmlFor="subtitles" className="flex items-center gap-2">
                <Subtitles className="w-4 h-4" />
                Incluir legendas
              </label>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="branding"
                checked={conversionOptions.customBranding}
                onChange={(e) => setConversionOptions(prev => ({ 
                  ...prev, 
                  customBranding: e.target.checked 
                }))}
                className="mr-3"
              />
              <label htmlFor="branding" className="flex items-center gap-2">
                <Palette className="w-4 h-4" />
                Aplicar branding personalizado
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Status de processamento */}
      {processingState.isConverting && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <RefreshCw className="w-6 h-6 text-blue-600 animate-spin" />
            <div>
              <h3 className="font-semibold">Convertendo apresentação...</h3>
              <p className="text-sm text-gray-600">{processingState.currentStep}</p>
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${processingState.progress}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-600 mt-2">{processingState.progress}% concluído</p>
        </div>
      )}

      {/* Botões de ação */}
      <div className="flex gap-4">
        <button
          onClick={() => setActiveTab('analysis')}
          className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Voltar
        </button>
        <button
          onClick={handleConversion}
          disabled={processingState.isConverting || !slides.length}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
        >
          <Play className="w-4 h-4" />
          {processingState.isConverting ? 'Convertendo...' : 'Iniciar Conversão'}
        </button>
      </div>
    </div>
  );

  const renderPreviewTab = () => {
    if (!conversionResult) {
      return (
        <div className="text-center py-12">
          <Eye className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum preview disponível</h3>
          <p className="text-gray-600">Complete a conversão para ver o preview.</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Status da conversão */}
        <div className={`p-6 rounded-lg border-2 ${
          conversionResult.success 
            ? 'bg-green-50 border-green-200' 
            : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-center gap-3 mb-4">
            {conversionResult.success ? 
              <CheckCircle className="w-8 h-8 text-green-600" /> :
              <AlertTriangle className="w-8 h-8 text-red-600" />
            }
            <div>
              <h3 className="text-xl font-semibold">
                {conversionResult.success ? 'Conversão Concluída!' : 'Erro na Conversão'}
              </h3>
              <p className="text-gray-600">
                Processado em {(conversionResult.processingTime / 1000).toFixed(1)}s
              </p>
            </div>
          </div>
        </div>

        {conversionResult.success && (
          <>
            {/* Informações do projeto */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold mb-4">Projeto Gerado</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <span className="text-sm text-gray-600">Nome:</span>
                  <p className="font-medium">{conversionResult.videoProject.name}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Duração:</span>
                  <p className="font-medium">{formatDuration(conversionResult.videoProject.duration)}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Cenas:</span>
                  <p className="font-medium">{conversionResult.videoProject.scenes.length}</p>
                </div>
              </div>
            </div>

            {/* Sugestões */}
            {conversionResult.suggestions.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-blue-600" />
                  Sugestões de Melhoria
                </h3>
                <ul className="space-y-2">
                  {conversionResult.suggestions.map((suggestion, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{suggestion}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Avisos */}
            {conversionResult.warnings.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-600" />
                  Avisos
                </h3>
                <ul className="space-y-2">
                  {conversionResult.warnings.map((warning, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{warning}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Ações */}
            <div className="flex gap-4">
              <button
                onClick={() => onProjectGenerated?.(conversionResult.videoProject)}
                className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Abrir no Editor
              </button>
              <button
                onClick={() => {
                  setActiveTab('upload');
                  setCurrentFile(null);
                  setSlides([]);
                  setMetadata(null);
                  setAnalysis(null);
                  setConversionResult(null);
                }}
                className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700"
              >
                Nova Conversão
              </button>
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-sm border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Análise Inteligente de PPTX</h1>
            <p className="text-gray-600">Converta apresentações em vídeos profissionais automaticamente</p>
          </div>
          
          {currentFile && (
            <div className="text-right">
              <p className="font-medium">{currentFile.name}</p>
              <p className="text-sm text-gray-600">
                {(currentFile.size / 1024 / 1024).toFixed(1)} MB
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b">
        <div className="px-6">
          <div className="flex space-x-8">
            {[
              { id: 'upload', label: 'Upload', icon: Upload },
              { id: 'analysis', label: 'Análise', icon: Brain },
              { id: 'conversion', label: 'Conversão', icon: Settings },
              { id: 'preview', label: 'Preview', icon: Eye }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  disabled={tab.id !== 'upload' && !currentFile}
                  className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm disabled:opacity-50 ${
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

      {/* Conteúdo */}
      <div className="flex-1 overflow-auto p-6">
        {activeTab === 'upload' && renderUploadTab()}
        {activeTab === 'analysis' && renderAnalysisTab()}
        {activeTab === 'conversion' && renderConversionTab()}
        {activeTab === 'preview' && renderPreviewTab()}
      </div>
    </div>
  );
};

export default PPTXAnalysisInterface;