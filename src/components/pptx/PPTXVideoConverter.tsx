// Conversor PPTX para Vídeo - Versão Otimizada e Integrada
import React, { useState, useCallback, useEffect } from 'react';
import { 
  Upload, 
  Brain, 
  Video, 
  Settings, 
  Activity,
  CheckCircle,
  AlertTriangle,
  Clock,
  Zap,
  TrendingUp,
  Download,
  Play,
  Pause,
  BarChart3
} from 'lucide-react';

// Importar todos os serviços otimizados
import { optimizedPPTXPipeline } from '../../services/optimized-pptx-pipeline';
import { enhancedAIAnalysis } from '../../services/enhanced-ai-analysis';
import { dynamicTemplateSystem } from '../../services/dynamic-template-system';
import { optimizedTTSService } from '../../services/optimized-tts-service';
import { performanceMetricsService } from '../../services/performance-metrics-service';

interface PPTXVideoConverterProps {
  onVideoGenerated?: (videoData: any) => void;
  className?: string;
}

interface ConversionState {
  stage: 'idle' | 'uploading' | 'analyzing' | 'generating' | 'completed' | 'error';
  progress: number;
  message: string;
  error?: string;
  startTime?: number;
  estimatedCompletion?: number;
}

interface ConversionResult {
  success: boolean;
  videoProject: any;
  analysis: any;
  templates: any[];
  audioData: any;
  performance: any;
  recommendations: string[];
}

const PPTXVideoConverter: React.FC<PPTXVideoConverterProps> = ({
  onVideoGenerated,
  className = ''
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [conversionState, setConversionState] = useState<ConversionState>({
    stage: 'idle',
    progress: 0,
    message: 'Pronto para processar'
  });
  const [result, setResult] = useState<ConversionResult | null>(null);
  const [performanceData, setPerformanceData] = useState<any>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Configurações avançadas
  const [advancedConfig, setAdvancedConfig] = useState({
    enableParallelProcessing: true,
    enableAIAnalysis: true,
    enableNRCompliance: true,
    enableTTSGeneration: true,
    qualityMode: 'balanced' as 'fast' | 'balanced' | 'quality',
    templatePreferences: ['safety', 'training'],
    customVoice: 'pt-BR-FranciscaNeural'
  });

  // Monitorar métricas de performance
  useEffect(() => {
    const updatePerformance = async () => {
      try {
        const metrics = await performanceMetricsService.collectMetrics();
        setPerformanceData(metrics);
      } catch (error) {
        console.warn('Erro ao coletar métricas:', error);
      }
    };

    const interval = setInterval(updatePerformance, 3000);
    updatePerformance();

    return () => clearInterval(interval);
  }, []);

  // Configurar listeners dos serviços
  useEffect(() => {
    const handlePipelineProgress = (data: any) => {
      setConversionState(prev => ({
        ...prev,
        progress: data.progress || prev.progress,
        message: data.message || prev.message
      }));
    };

    const handlePipelineComplete = (data: any) => {
      setConversionState(prev => ({
        ...prev,
        stage: 'completed',
        progress: 100,
        message: 'Conversão concluída com sucesso!'
      }));
    };

    const handlePipelineError = (data: any) => {
      setConversionState(prev => ({
        ...prev,
        stage: 'error',
        error: data.error,
        message: 'Erro na conversão'
      }));
    };

    // Registrar listeners
    optimizedPPTXPipeline.on('stageStart', handlePipelineProgress);
    optimizedPPTXPipeline.on('stageComplete', handlePipelineProgress);
    optimizedPPTXPipeline.on('pipelineComplete', handlePipelineComplete);
    optimizedPPTXPipeline.on('pipelineError', handlePipelineError);

    return () => {
      optimizedPPTXPipeline.off('stageStart', handlePipelineProgress);
      optimizedPPTXPipeline.off('stageComplete', handlePipelineProgress);
      optimizedPPTXPipeline.off('pipelineComplete', handlePipelineComplete);
      optimizedPPTXPipeline.off('pipelineError', handlePipelineError);
    };
  }, []);

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/vnd.openxmlformats-officedocument.presentationml.presentation') {
      setSelectedFile(file);
      setResult(null);
      setConversionState({
        stage: 'idle',
        progress: 0,
        message: 'Arquivo selecionado - pronto para conversão'
      });
    }
  }, []);

  const startConversion = useCallback(async () => {
    if (!selectedFile) return;

    setConversionState({
      stage: 'uploading',
      progress: 5,
      message: 'Iniciando conversão otimizada...',
      startTime: Date.now(),
      estimatedCompletion: Date.now() + 30000 // 30 segundos estimados
    });

    try {
      // Etapa 1: Processamento com pipeline otimizado
      setConversionState(prev => ({
        ...prev,
        stage: 'analyzing',
        progress: 20,
        message: 'Analisando PPTX com IA avançada...'
      }));

      const pipelineResult = await optimizedPPTXPipeline.processPPTX(selectedFile, {
        enableAIAnalysis: advancedConfig.enableAIAnalysis,
        enableNRCompliance: advancedConfig.enableNRCompliance,
        enableTTSGeneration: advancedConfig.enableTTSGeneration,
        templatePreferences: advancedConfig.templatePreferences
      });

      if (!pipelineResult.success) {
        throw new Error(pipelineResult.error || 'Erro no pipeline de processamento');
      }

      // Etapa 2: Análise avançada de conteúdo
      setConversionState(prev => ({
        ...prev,
        progress: 40,
        message: 'Executando análise avançada de conteúdo...'
      }));

      const contentAnalysis = await enhancedAIAnalysis.analyzeContent(
        pipelineResult.data.analysis,
        {
          includeVisualAnalysis: true,
          includeDeepLearning: advancedConfig.qualityMode === 'quality'
        }
      );

      // Etapa 3: Geração de templates dinâmicos
      setConversionState(prev => ({
        ...prev,
        progress: 60,
        message: 'Gerando templates dinâmicos...'
      }));

      const templates = await dynamicTemplateSystem.generateMultipleTemplates(
        contentAnalysis,
        3,
        {
          category: advancedConfig.templatePreferences[0],
          performance: advancedConfig.qualityMode
        }
      );

      // Etapa 4: Geração de áudio TTS (se habilitado)
      let audioData = null;
      if (advancedConfig.enableTTSGeneration) {
        setConversionState(prev => ({
          ...prev,
          progress: 80,
          message: 'Gerando narração com TTS otimizado...'
        }));

        const ttsBatch = await optimizedTTSService.generateFromPPTXContent(
          pipelineResult.data.analysis,
          {
            includeNotes: true,
            generateCombined: true
          }
        );

        audioData = ttsBatch;
      }

      // Etapa 5: Compilar resultado final
      setConversionState(prev => ({
        ...prev,
        progress: 95,
        message: 'Finalizando projeto de vídeo...'
      }));

      const finalResult: ConversionResult = {
        success: true,
        videoProject: {
          id: `video-${Date.now()}`,
          name: selectedFile.name.replace('.pptx', ''),
          source: 'pptx-conversion',
          analysis: contentAnalysis,
          templates: templates,
          audioData: audioData,
          createdAt: new Date(),
          duration: contentAnalysis.overview.estimatedDuration,
          quality: advancedConfig.qualityMode
        },
        analysis: contentAnalysis,
        templates: templates,
        audioData: audioData,
        performance: pipelineResult,
        recommendations: contentAnalysis.recommendations.map(r => r.description)
      };

      setResult(finalResult);
      setConversionState({
        stage: 'completed',
        progress: 100,
        message: 'Conversão concluída com sucesso!'
      });

      // Notificar componente pai
      onVideoGenerated?.(finalResult.videoProject);

    } catch (error: any) {
      console.error('Erro na conversão:', error);
      setConversionState({
        stage: 'error',
        progress: 0,
        message: 'Erro na conversão',
        error: error.message
      });
    }
  }, [selectedFile, advancedConfig, onVideoGenerated]);

  const resetConverter = useCallback(() => {
    setSelectedFile(null);
    setResult(null);
    setConversionState({
      stage: 'idle',
      progress: 0,
      message: 'Pronto para processar'
    });
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

  return (
    <div className={`max-w-6xl mx-auto p-6 space-y-6 ${className}`}>
      {/* Header com Status */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Conversor PPTX para Vídeo - Otimizado
            </h1>
            <p className="text-gray-600">
              Pipeline inteligente com IA, cache e processamento paralelo
            </p>
          </div>
          
          {performanceData && (
            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center space-x-1">
                <Activity className="w-4 h-4 text-blue-600" />
                <span>CPU: {performanceData.system?.cpuUsage?.toFixed(1) || 0}%</span>
              </div>
              <div className="flex items-center space-x-1">
                <TrendingUp className="w-4 h-4 text-green-600" />
                <span>Cache: {performanceData.cache?.hitRate?.toFixed(1) || 0}%</span>
              </div>
              <div className="flex items-center space-x-1">
                <Zap className="w-4 h-4 text-purple-600" />
                <span>Throughput: {performanceData.processing?.currentThroughput?.toFixed(1) || 0}</span>
              </div>
            </div>
          )}
        </div>

        {/* Indicador de Status */}
        <div className="flex items-center space-x-4">
          <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${
            conversionState.stage === 'completed' ? 'bg-green-100 text-green-800' :
            conversionState.stage === 'error' ? 'bg-red-100 text-red-800' :
            conversionState.stage !== 'idle' ? 'bg-blue-100 text-blue-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {conversionState.stage === 'completed' ? <CheckCircle className="w-4 h-4" /> :
             conversionState.stage === 'error' ? <AlertTriangle className="w-4 h-4" /> :
             conversionState.stage !== 'idle' ? <Clock className="w-4 h-4 animate-pulse" /> :
             <Settings className="w-4 h-4" />}
            <span className="capitalize">{conversionState.message}</span>
          </div>
          
          {conversionState.stage !== 'idle' && conversionState.stage !== 'completed' && (
            <div className="flex-1 max-w-xs">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${conversionState.progress}%` }}
                />
              </div>
              <div className="text-xs text-gray-600 mt-1">
                {conversionState.progress}% concluído
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Upload Area */}
      {conversionState.stage === 'idle' && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="space-y-6">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
              <div className="space-y-4">
                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto">
                  <Upload className="w-8 h-8 text-blue-600" />
                </div>
                
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Upload PPTX</h3>
                  <p className="text-gray-600">Selecione sua apresentação para conversão inteligente</p>
                </div>
                
                <input
                  type="file"
                  accept=".pptx"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 cursor-pointer transition-colors"
                >
                  <Upload className="w-4 h-4 mr-2 inline" />
                  Selecionar Arquivo
                </label>
              </div>
            </div>

            {selectedFile && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="font-medium text-green-900">{selectedFile.name}</p>
                      <p className="text-sm text-green-700">
                        {formatBytes(selectedFile.size)} • Pronto para conversão
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setShowAdvanced(!showAdvanced)}
                      className="text-blue-600 hover:text-blue-700 text-sm"
                    >
                      <Settings className="w-4 h-4 mr-1 inline" />
                      {showAdvanced ? 'Ocultar' : 'Configurações'}
                    </button>
                    
                    <button
                      onClick={startConversion}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <Brain className="w-4 h-4 mr-2 inline" />
                      Converter para Vídeo
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Configurações Avançadas */}
            {showAdvanced && selectedFile && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Configurações Avançadas</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Modo de Qualidade</label>
                      <select
                        value={advancedConfig.qualityMode}
                        onChange={(e) => setAdvancedConfig(prev => ({
                          ...prev,
                          qualityMode: e.target.value as any
                        }))}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="fast">Rápido (menos de 15s)</option>
                        <option value="balanced">Balanceado (menos de 30s)</option>
                        <option value="quality">Alta Qualidade (menos de 60s)</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">Voz TTS</label>
                      <select
                        value={advancedConfig.customVoice}
                        onChange={(e) => setAdvancedConfig(prev => ({
                          ...prev,
                          customVoice: e.target.value
                        }))}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="pt-BR-FranciscaNeural">Francisca (Feminina)</option>
                        <option value="pt-BR-AntonioNeural">Antonio (Masculina)</option>
                        <option value="pt-BR-BrendaNeural">Brenda (Feminina)</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={advancedConfig.enableParallelProcessing}
                          onChange={(e) => setAdvancedConfig(prev => ({
                            ...prev,
                            enableParallelProcessing: e.target.checked
                          }))}
                          className="mr-2"
                        />
                        <span className="text-sm">Processamento Paralelo</span>
                      </label>
                      
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={advancedConfig.enableAIAnalysis}
                          onChange={(e) => setAdvancedConfig(prev => ({
                            ...prev,
                            enableAIAnalysis: e.target.checked
                          }))}
                          className="mr-2"
                        />
                        <span className="text-sm">Análise IA Avançada</span>
                      </label>
                      
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={advancedConfig.enableNRCompliance}
                          onChange={(e) => setAdvancedConfig(prev => ({
                            ...prev,
                            enableNRCompliance: e.target.checked
                          }))}
                          className="mr-2"
                        />
                        <span className="text-sm">Análise de Compliance NR</span>
                      </label>
                      
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={advancedConfig.enableTTSGeneration}
                          onChange={(e) => setAdvancedConfig(prev => ({
                            ...prev,
                            enableTTSGeneration: e.target.checked
                          }))}
                          className="mr-2"
                        />
                        <span className="text-sm">Geração de Áudio TTS</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Resultado da Conversão */}
      {result && conversionState.stage === 'completed' && (
        <div className="space-y-6">
          {/* Resumo do Projeto */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-xl font-semibold mb-4 flex items-center">
              <Video className="w-6 h-6 mr-2 text-green-600" />
              Projeto de Vídeo Gerado
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-2">
                  <Clock className="w-8 h-8 text-blue-600" />
                </div>
                <p className="text-2xl font-bold text-blue-600">
                  {formatDuration(result.videoProject.duration * 1000)}
                </p>
                <p className="text-sm text-gray-600">Duração</p>
              </div>
              
              <div className="text-center">
                <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-2">
                  <BarChart3 className="w-8 h-8 text-green-600" />
                </div>
                <p className="text-2xl font-bold text-green-600">
                  {result.analysis.overview.complexity}
                </p>
                <p className="text-sm text-gray-600">Complexidade</p>
              </div>
              
              <div className="text-center">
                <div className="bg-purple-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-2">
                  <Brain className="w-8 h-8 text-purple-600" />
                </div>
                <p className="text-2xl font-bold text-purple-600">
                  {result.templates.length}
                </p>
                <p className="text-sm text-gray-600">Templates</p>
              </div>
              
              <div className="text-center">
                <div className="bg-orange-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-2">
                  <TrendingUp className="w-8 h-8 text-orange-600" />
                </div>
                <p className="text-2xl font-bold text-orange-600">
                  {result.analysis.qualityMetrics.contentQuality.toFixed(0)}%
                </p>
                <p className="text-sm text-gray-600">Qualidade</p>
              </div>
            </div>
          </div>

          {/* Recomendações */}
          {result.recommendations.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Brain className="w-5 h-5 mr-2 text-blue-600" />
                Recomendações da IA
              </h3>
              <ul className="space-y-2">
                {result.recommendations.slice(0, 5).map((recommendation, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <CheckCircle className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{recommendation}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Ações */}
          <div className="flex justify-center space-x-4">
            <button
              onClick={() => onVideoGenerated?.(result.videoProject)}
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
            >
              <Play className="w-4 h-4 mr-2 inline" />
              Abrir no Editor
            </button>
            
            <button
              onClick={resetConverter}
              className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors"
            >
              <Upload className="w-4 h-4 mr-2 inline" />
              Nova Conversão
            </button>
          </div>
        </div>
      )}

      {/* Erro */}
      {conversionState.stage === 'error' && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="w-8 h-8 text-red-600" />
            <div>
              <h3 className="text-lg font-semibold text-red-900">Erro na Conversão</h3>
              <p className="text-red-700">{conversionState.error}</p>
            </div>
          </div>
          
          <div className="mt-4 flex space-x-2">
            <button
              onClick={startConversion}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              Tentar Novamente
            </button>
            
            <button
              onClick={resetConverter}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Resetar
            </button>
          </div>
        </div>
      )}

      {/* Recursos Otimizados */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 text-center">
          <Zap className="w-8 h-8 text-blue-600 mx-auto mb-2" />
          <h4 className="font-medium text-blue-900">Pipeline Otimizado</h4>
          <p className="text-sm text-blue-700">Cache inteligente e processamento paralelo</p>
        </div>
        
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 text-center">
          <Brain className="w-8 h-8 text-green-600 mx-auto mb-2" />
          <h4 className="font-medium text-green-900">IA Avançada</h4>
          <p className="text-sm text-green-700">Análise de conteúdo e templates dinâmicos</p>
        </div>
        
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 text-center">
          <Activity className="w-8 h-8 text-purple-600 mx-auto mb-2" />
          <h4 className="font-medium text-purple-900">Monitoramento</h4>
          <p className="text-sm text-purple-700">Métricas em tempo real e otimização</p>
        </div>
      </div>
    </div>
  );
};

export default PPTXVideoConverter;