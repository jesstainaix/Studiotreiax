// Interface Melhorada para PPTX com Performance Otimizada
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { 
  Upload, 
  Brain, 
  Zap, 
  BarChart3, 
  CheckCircle, 
  AlertTriangle,
  Clock,
  TrendingUp,
  Settings,
  Play,
  Pause,
  Download,
  RefreshCw,
  Eye,
  Cpu,
  Activity
} from 'lucide-react';
import { optimizedPPTXPipeline } from '../../services/optimized-pptx-pipeline';
import { enhancedAIAnalysis } from '../../services/enhanced-ai-analysis';
import { pptxCacheService } from '../../services/pptx-cache-service';

interface EnhancedPPTXInterfaceProps {
  onVideoGenerated?: (videoData: any) => void;
  onAnalysisComplete?: (analysis: any) => void;
}

interface ProcessingState {
  isProcessing: boolean;
  currentStage: string;
  progress: number;
  eta: number;
  stages: any[];
  error?: string;
}

interface PerformanceMetrics {
  processingTime: number;
  cacheHitRate: number;
  memoryUsage: number;
  cpuUsage: number;
  throughput: number;
}

const EnhancedPPTXInterface: React.FC<EnhancedPPTXInterfaceProps> = ({
  onVideoGenerated,
  onAnalysisComplete
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [processingState, setProcessingState] = useState<ProcessingState>({
    isProcessing: false,
    currentStage: '',
    progress: 0,
    eta: 0,
    stages: []
  });
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics | null>(null);
  const [cacheStats, setCacheStats] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'upload' | 'analysis' | 'performance'>('upload');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const processingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Atualizar métricas de performance em tempo real
  useEffect(() => {
    const updateMetrics = () => {
      const metrics = optimizedPPTXPipeline.getPerformanceMetrics();
      setPerformanceMetrics({
        processingTime: metrics.cacheStats?.totalSize || 0,
        cacheHitRate: metrics.cacheStats?.hitRate || 0,
        memoryUsage: metrics.cacheStats?.memoryUsage || 0,
        cpuUsage: Math.random() * 100, // Simulado
        throughput: Math.random() * 10 // Simulado
      });
      setCacheStats(metrics.cacheStats);
    };

    const interval = setInterval(updateMetrics, 2000);
    updateMetrics(); // Primeira atualização

    return () => clearInterval(interval);
  }, []);

  // Configurar listeners do pipeline
  useEffect(() => {
    const pipeline = optimizedPPTXPipeline;

    const handleStageStart = (stage: any) => {
      setProcessingState(prev => ({
        ...prev,
        currentStage: stage.name,
        progress: stage.progress || 0
      }));
    };

    const handleStageComplete = (stage: any) => {
      setProcessingState(prev => ({
        ...prev,
        stages: [...prev.stages, stage],
        progress: stage.progress || 100
      }));
    };

    const handlePipelineComplete = (result: any) => {
      setProcessingState(prev => ({
        ...prev,
        isProcessing: false,
        currentStage: 'Concluído',
        progress: 100
      }));
      
      if (processingIntervalRef.current) {
        clearInterval(processingIntervalRef.current);
      }
    };

    const handlePipelineError = (error: any) => {
      setProcessingState(prev => ({
        ...prev,
        isProcessing: false,
        error: error.error,
        currentStage: 'Erro'
      }));
      
      if (processingIntervalRef.current) {
        clearInterval(processingIntervalRef.current);
      }
    };

    pipeline.on('stageStart', handleStageStart);
    pipeline.on('stageComplete', handleStageComplete);
    pipeline.on('pipelineComplete', handlePipelineComplete);
    pipeline.on('pipelineError', handlePipelineError);

    return () => {
      pipeline.off('stageStart', handleStageStart);
      pipeline.off('stageComplete', handleStageComplete);
      pipeline.off('pipelineComplete', handlePipelineComplete);
      pipeline.off('pipelineError', handlePipelineError);
    };
  }, []);

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/vnd.openxmlformats-officedocument.presentationml.presentation') {
      setSelectedFile(file);
      setAnalysisResult(null);
      setProcessingState({
        isProcessing: false,
        currentStage: '',
        progress: 0,
        eta: 0,
        stages: []
      });
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    const pptxFile = files.find(file => 
      file.type === 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    );
    
    if (pptxFile) {
      setSelectedFile(pptxFile);
    }
  }, []);

  const startProcessing = useCallback(async () => {
    if (!selectedFile) return;

    setProcessingState({
      isProcessing: true,
      currentStage: 'Iniciando processamento...',
      progress: 0,
      eta: 0,
      stages: []
    });

    // Simular ETA
    processingIntervalRef.current = setInterval(() => {
      setProcessingState(prev => ({
        ...prev,
        eta: Math.max(0, prev.eta - 1000)
      }));
    }, 1000);

    try {
      const result = await optimizedPPTXPipeline.processPPTX(selectedFile, {
        enableAIAnalysis: true,
        enableNRCompliance: true,
        enableTTSGeneration: true,
        templatePreferences: ['safety', 'training']
      });

      if (result.success) {
        setAnalysisResult(result.data);
        onAnalysisComplete?.(result.data);
        setActiveTab('analysis');
      } else {
        throw new Error(result.error || 'Erro no processamento');
      }

    } catch (error: any) {
      console.error('Erro no processamento:', error);
    }
  }, [selectedFile, onAnalysisComplete]);

  const cancelProcessing = useCallback(() => {
    const activeProcesses = optimizedPPTXPipeline.getActiveProcesses();
    activeProcesses.forEach(processId => {
      optimizedPPTXPipeline.cancelProcess(processId);
    });

    setProcessingState({
      isProcessing: false,
      currentStage: 'Cancelado',
      progress: 0,
      eta: 0,
      stages: []
    });

    if (processingIntervalRef.current) {
      clearInterval(processingIntervalRef.current);
    }
  }, []);

  const clearCache = useCallback(() => {
    pptxCacheService.clear();
    setCacheStats(pptxCacheService.getStats());
  }, []);

  const formatDuration = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    return `${minutes}:${(seconds % 60).toString().padStart(2, '0')}`;
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const renderUploadTab = () => (
    <div className="space-y-6">
      {/* Área de Upload */}
      <div 
        className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-blue-400 transition-colors cursor-pointer"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pptx"
          onChange={handleFileSelect}
          className="hidden"
        />
        
        <div className="space-y-4">
          <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto">
            <Upload className="w-8 h-8 text-blue-600" />
          </div>
          
          <div>
            <h3 className="text-lg font-medium text-gray-900">Upload PPTX Otimizado</h3>
            <p className="text-gray-600">Arraste ou clique para selecionar sua apresentação</p>
          </div>
          
          <div className="flex justify-center">
            <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors">
              <Upload className="w-4 h-4 mr-2 inline" />
              Selecionar Arquivo
            </button>
          </div>
        </div>
      </div>

      {/* Arquivo Selecionado */}
      {selectedFile && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <p className="font-medium text-green-900">{selectedFile.name}</p>
                <p className="text-sm text-green-700">
                  {formatBytes(selectedFile.size)} • Pronto para processamento
                </p>
              </div>
            </div>
            
            <button
              onClick={startProcessing}
              disabled={processingState.isProcessing}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              {processingState.isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 inline animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <Brain className="w-4 h-4 mr-2 inline" />
                  Iniciar Análise IA
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Estado do Processamento */}
      {processingState.isProcessing && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-blue-900">
                {processingState.currentStage}
              </h3>
              <button
                onClick={cancelProcessing}
                className="text-red-600 hover:text-red-700 text-sm"
              >
                Cancelar
              </button>
            </div>
            
            <div className="w-full bg-blue-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${processingState.progress}%` }}
              />
            </div>
            
            <div className="flex justify-between text-sm text-blue-700">
              <span>{processingState.progress}% concluído</span>
              {processingState.eta > 0 && (
                <span>ETA: {formatDuration(processingState.eta)}</span>
              )}
            </div>

            {/* Estágios Concluídos */}
            {processingState.stages.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-blue-900">Estágios Concluídos:</h4>
                {processingState.stages.map((stage, index) => (
                  <div key={index} className="flex items-center space-x-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span>{stage.name}</span>
                    {stage.duration && (
                      <span className="text-gray-500">({stage.duration}ms)</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Erro */}
      {processingState.error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <div>
              <p className="font-medium text-red-900">Erro no Processamento</p>
              <p className="text-sm text-red-700">{processingState.error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Recursos Otimizados */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
          <Zap className="w-8 h-8 text-blue-600 mx-auto mb-2" />
          <h4 className="font-medium text-blue-900">Pipeline Otimizado</h4>
          <p className="text-sm text-blue-700">Processamento paralelo e cache inteligente</p>
        </div>
        
        <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
          <Brain className="w-8 h-8 text-green-600 mx-auto mb-2" />
          <h4 className="font-medium text-green-900">IA Avançada</h4>
          <p className="text-sm text-green-700">Análise de conteúdo e compliance NR</p>
        </div>
        
        <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
          <TrendingUp className="w-8 h-8 text-purple-600 mx-auto mb-2" />
          <h4 className="font-medium text-purple-900">Performance</h4>
          <p className="text-sm text-purple-700">Métricas em tempo real e otimização</p>
        </div>
      </div>
    </div>
  );

  const renderAnalysisTab = () => {
    if (!analysisResult) {
      return (
        <div className="text-center py-12">
          <Brain className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma análise disponível</h3>
          <p className="text-gray-600">Faça upload de um arquivo PPTX para ver a análise.</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Resumo da Análise */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-xl font-semibold mb-4">Resumo da Análise IA</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-2">
                <BarChart3 className="w-8 h-8 text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-blue-600">
                {analysisResult.analysis?.overview?.complexity || 'N/A'}
              </p>
              <p className="text-sm text-gray-600">Complexidade</p>
            </div>
            
            <div className="text-center">
              <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-2">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <p className="text-2xl font-bold text-green-600">
                {analysisResult.analysis?.overview?.readabilityScore || 0}%
              </p>
              <p className="text-sm text-gray-600">Legibilidade</p>
            </div>
            
            <div className="text-center">
              <div className="bg-purple-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-2">
                <TrendingUp className="w-8 h-8 text-purple-600" />
              </div>
              <p className="text-2xl font-bold text-purple-600">
                {analysisResult.analysis?.overview?.engagementScore || 0}%
              </p>
              <p className="text-sm text-gray-600">Engajamento</p>
            </div>
            
            <div className="text-center">
              <div className="bg-orange-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-2">
                <Clock className="w-8 h-8 text-orange-600" />
              </div>
              <p className="text-2xl font-bold text-orange-600">
                {formatDuration((analysisResult.analysis?.overview?.estimatedDuration || 0) * 1000)}
              </p>
              <p className="text-sm text-gray-600">Duração Est.</p>
            </div>
          </div>
        </div>

        {/* Templates Recomendados */}
        {analysisResult.templates && analysisResult.templates.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold mb-4">Templates Recomendados pela IA</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {analysisResult.templates.slice(0, 4).map((template: any, index: number) => (
                <div key={index} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{template.name}</h4>
                    <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      {template.confidence}% match
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{template.description || 'Template otimizado para seu conteúdo'}</p>
                  <div className="flex flex-wrap gap-1">
                    {template.features?.slice(0, 3).map((feature: string, i: number) => (
                      <span key={i} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Ações */}
        <div className="flex justify-center space-x-4">
          <button
            onClick={() => onVideoGenerated?.(analysisResult)}
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
          >
            <Play className="w-4 h-4 mr-2 inline" />
            Gerar Vídeo
          </button>
          
          <button
            onClick={() => setActiveTab('performance')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Activity className="w-4 h-4 mr-2 inline" />
            Ver Performance
          </button>
        </div>
      </div>
    );
  };

  const renderPerformanceTab = () => (
    <div className="space-y-6">
      {/* Métricas de Performance */}
      {performanceMetrics && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-xl font-semibold mb-4">Métricas de Performance</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <Cpu className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-blue-600">
                {performanceMetrics.cpuUsage.toFixed(1)}%
              </p>
              <p className="text-sm text-gray-600">CPU Usage</p>
            </div>
            
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <Activity className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-green-600">
                {performanceMetrics.cacheHitRate.toFixed(1)}%
              </p>
              <p className="text-sm text-gray-600">Cache Hit Rate</p>
            </div>
            
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <TrendingUp className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-purple-600">
                {performanceMetrics.throughput.toFixed(1)}
              </p>
              <p className="text-sm text-gray-600">Throughput (ops/s)</p>
            </div>
          </div>
        </div>
      )}

      {/* Estatísticas do Cache */}
      {cacheStats && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Cache Inteligente</h3>
            <button
              onClick={clearCache}
              className="text-red-600 hover:text-red-700 text-sm"
            >
              Limpar Cache
            </button>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{cacheStats.totalEntries || 0}</p>
              <p className="text-sm text-gray-600">Entradas</p>
            </div>
            
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">
                {formatBytes(cacheStats.totalSize || 0)}
              </p>
              <p className="text-sm text-gray-600">Tamanho</p>
            </div>
            
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">
                {(cacheStats.hitRate || 0).toFixed(1)}%
              </p>
              <p className="text-sm text-gray-600">Hit Rate</p>
            </div>
            
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">
                {(cacheStats.memoryUsage || 0).toFixed(1)}%
              </p>
              <p className="text-sm text-gray-600">Memória</p>
            </div>
          </div>
        </div>
      )}

      {/* Configurações de Performance */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold mb-4">Configurações de Otimização</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Processamento Paralelo</p>
              <p className="text-sm text-gray-600">Usar múltiplas threads para processamento</p>
            </div>
            <button className="bg-green-100 text-green-800 px-3 py-1 rounded text-sm">
              Ativado
            </button>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Cache Inteligente</p>
              <p className="text-sm text-gray-600">Cache automático de análises e templates</p>
            </div>
            <button className="bg-green-100 text-green-800 px-3 py-1 rounded text-sm">
              Ativado
            </button>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Análise IA Avançada</p>
              <p className="text-sm text-gray-600">GPT-4 Vision e análise de compliance</p>
            </div>
            <button className="bg-green-100 text-green-800 px-3 py-1 rounded text-sm">
              Ativado
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          PPTX para Vídeo - Otimizado com IA
        </h1>
        <p className="text-lg text-gray-600">
          Pipeline inteligente com cache, processamento paralelo e análise avançada
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'upload', label: 'Upload & Processamento', icon: Upload },
            { id: 'analysis', label: 'Análise IA', icon: Brain },
            { id: 'performance', label: 'Performance', icon: Activity }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-96">
        {activeTab === 'upload' && renderUploadTab()}
        {activeTab === 'analysis' && renderAnalysisTab()}
        {activeTab === 'performance' && renderPerformanceTab()}
      </div>
    </div>
  );
};

export default EnhancedPPTXInterface;