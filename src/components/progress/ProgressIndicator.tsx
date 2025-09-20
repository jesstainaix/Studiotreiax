// Componente React para exibição de indicadores de progresso detalhados
import React, { useState, useEffect, useCallback } from 'react';
import { ProgressIndicatorService, ProgressState, ProgressEvent, PerformanceMetrics } from '../../services/progress-indicator.service';
import { Progress } from '../ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { 
  Play, 
  Pause, 
  Square, 
  Clock, 
  Zap, 
  BarChart3, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Loader2,
  TrendingUp,
  MemoryStick,
  HardDrive
} from 'lucide-react';

interface ProgressIndicatorProps {
  progressService: ProgressIndicatorService;
  showDetailedMetrics?: boolean;
  showPerformanceChart?: boolean;
  onPause?: () => void;
  onResume?: () => void;
  onStop?: () => void;
  className?: string;
}

interface ProgressDisplayState {
  state: ProgressState;
  metrics: PerformanceMetrics;
  isVisible: boolean;
  expandedSteps: Set<string>;
}

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  progressService,
  showDetailedMetrics = true,
  showPerformanceChart = false,
  onPause,
  onResume,
  onStop,
  className = ''
}) => {
  const [displayState, setDisplayState] = useState<ProgressDisplayState>({
    state: progressService.getState(),
    metrics: progressService.getPerformanceMetrics(),
    isVisible: false,
    expandedSteps: new Set()
  });

  // Atualizar estado quando o serviço emitir eventos
  const handleProgressUpdate = useCallback((event: ProgressEvent) => {
    setDisplayState(prev => ({
      ...prev,
      state: progressService.getState(),
      metrics: progressService.getPerformanceMetrics(),
      isVisible: true
    }));
  }, [progressService]);

  // Configurar listeners de eventos
  useEffect(() => {
    progressService.on('progress', handleProgressUpdate);
    progressService.on('status_changed', handleProgressUpdate);
    
    return () => {
      progressService.off('progress', handleProgressUpdate);
      progressService.off('status_changed', handleProgressUpdate);
    };
  }, [progressService, handleProgressUpdate]);

  // Toggle expansão de etapa
  const toggleStepExpansion = (stepId: string) => {
    setDisplayState(prev => {
      const newExpanded = new Set(prev.expandedSteps);
      if (newExpanded.has(stepId)) {
        newExpanded.delete(stepId);
      } else {
        newExpanded.add(stepId);
      }
      return { ...prev, expandedSteps: newExpanded };
    });
  };

  // Obter ícone de status
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'running':
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'paused':
        return <Pause className="w-4 h-4 text-yellow-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  // Obter cor da barra de progresso
  const getProgressColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500';
      case 'failed':
        return 'bg-red-500';
      case 'running':
        return 'bg-blue-500';
      case 'paused':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-300';
    }
  };

  // Formatar duração
  const formatDuration = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  // Formatar bytes
  const formatBytes = (bytes: number): string => {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${Math.round(bytes / Math.pow(1024, i) * 100) / 100} ${sizes[i]}`;
  };

  if (!displayState.isVisible || displayState.state.status === 'idle') {
    return null;
  }

  const { state, metrics } = displayState;
  const summary = progressService.getProgressSummary();

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Progresso Geral */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              {getStatusIcon(state.status)}
              Progresso do Processamento
            </CardTitle>
            <div className="flex items-center gap-2">
              {state.status === 'processing' && onPause && (
                <Button size="sm" variant="outline" onClick={onPause}>
                  <Pause className="w-4 h-4" />
                </Button>
              )}
              {state.status === 'paused' && onResume && (
                <Button size="sm" variant="outline" onClick={onResume}>
                  <Play className="w-4 h-4" />
                </Button>
              )}
              {onStop && (
                <Button size="sm" variant="outline" onClick={onStop}>
                  <Square className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Barra de Progresso Principal */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progresso Geral</span>
              <span className="font-medium">{Math.round(state.overallProgress)}%</span>
            </div>
            <Progress 
              value={state.overallProgress} 
              className="h-3"
            />
          </div>

          {/* Informações Resumidas */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-500" />
              <div>
                <div className="font-medium">ETA</div>
                <div className="text-gray-600">{summary.eta}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-gray-500" />
              <div>
                <div className="font-medium">Taxa</div>
                <div className="text-gray-600">{summary.rate}/s</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-gray-500" />
              <div>
                <div className="font-medium">Etapas</div>
                <div className="text-gray-600">{state.completedSteps}/{state.totalSteps}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-gray-500" />
              <div>
                <div className="font-medium">Status</div>
                <Badge variant={state.status === 'processing' ? 'default' : 'secondary'}>
                  {state.status}
                </Badge>
              </div>
            </div>
          </div>

          {/* Etapa Atual */}
          {state.currentStep && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Etapa Atual: {state.steps.find(s => s.id === state.currentStep)?.name}</span>
                <span className="font-medium">{Math.round(state.currentStepProgress)}%</span>
              </div>
              <Progress 
                value={state.currentStepProgress} 
                className="h-2"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detalhes das Etapas */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Detalhes das Etapas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {state.steps.map((step) => (
              <div key={step.id} className="border rounded-lg p-3">
                <div 
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => toggleStepExpansion(step.id)}
                >
                  <div className="flex items-center gap-3">
                    {getStatusIcon(step.status)}
                    <div>
                      <div className="font-medium">{step.name}</div>
                      <div className="text-sm text-gray-600">{step.description}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {step.duration && (
                      <span className="text-sm text-gray-500">
                        {formatDuration(step.duration)}
                      </span>
                    )}
                    <Badge variant="outline">
                      {Math.round(step.weight * 100)}%
                    </Badge>
                  </div>
                </div>

                {/* Sub-etapas expandidas */}
                {displayState.expandedSteps.has(step.id) && step.subSteps && (
                  <div className="mt-3 ml-6 space-y-2">
                    {step.subSteps.map((subStep) => (
                      <div key={subStep.id} className="flex items-center gap-2 text-sm">
                        {getStatusIcon(subStep.status)}
                        <span>{subStep.name}</span>
                        {subStep.duration && (
                          <span className="text-gray-500 ml-auto">
                            {formatDuration(subStep.duration)}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Erro da etapa */}
                {step.error && (
                  <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                    <strong>Erro:</strong> {step.error.message}
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Métricas Detalhadas */}
      {showDetailedMetrics && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Métricas de Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Estatísticas de Processamento */}
              <div className="space-y-3">
                <h4 className="font-medium text-sm">Processamento</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Slides Processados:</span>
                    <span className="font-medium">{state.metadata.processedSlides}/{state.metadata.totalSlides}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Imagens Processadas:</span>
                    <span className="font-medium">{state.metadata.processedImages}/{state.metadata.totalImages}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Elementos Processados:</span>
                    <span className="font-medium">{state.metadata.processedShapes}/{state.metadata.totalShapes}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Taxa de Cache:</span>
                    <span className="font-medium">{Math.round(state.metadata.cacheHitRate * 100)}%</span>
                  </div>
                </div>
              </div>

              {/* Métricas de Performance */}
              <div className="space-y-3">
                <h4 className="font-medium text-sm">Performance</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Duração Média:</span>
                    <span className="font-medium">{formatDuration(metrics.averageStepDuration)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Throughput:</span>
                    <span className="font-medium">{Math.round(metrics.throughput * 100) / 100}/s</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Etapa Mais Lenta:</span>
                    <span className="font-medium text-red-600">{metrics.slowestStep || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Etapa Mais Rápida:</span>
                    <span className="font-medium text-green-600">{metrics.fastestStep || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Uso de Recursos */}
              <div className="space-y-3">
                <h4 className="font-medium text-sm">Recursos</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-1">
                      <MemoryStick className="w-3 h-3" />
                      Memória Atual:
                    </span>
                    <span className="font-medium">{formatBytes(state.metadata.memoryUsage)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-1">
                      <HardDrive className="w-3 h-3" />
                      Pico de Memória:
                    </span>
                    <span className="font-medium">{formatBytes(metrics.memoryPeakUsage)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tamanho do Arquivo:</span>
                    <span className="font-medium">{formatBytes(state.metadata.fileSize)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Erros/Avisos:</span>
                    <span className="font-medium">
                      <span className="text-red-600">{state.metadata.errorCount}</span>/
                      <span className="text-yellow-600">{state.metadata.warningCount}</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Gargalos */}
            {metrics.bottlenecks.length > 0 && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                <h4 className="font-medium text-sm text-yellow-800 mb-2">Gargalos Identificados:</h4>
                <ul className="text-sm text-yellow-700 space-y-1">
                  {metrics.bottlenecks.map((bottleneck, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <AlertCircle className="w-3 h-3" />
                      {bottleneck}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ProgressIndicator;