/**
 * Complete Pipeline Interface
 * Interface completa e moderna para o pipeline PPTX→Vídeo
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Progress } from '../ui/progress'
import { Badge } from '../ui/badge'
import { 
  Upload, 
  FileText, 
  Video, 
  Play, 
  CheckCircle, 
  Clock, 
  Zap,
  Brain,
  BarChart3,
  X,
  ChevronRight,
  ChevronDown,
  Film,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner'

// Import enhanced pipeline services with robust error handling
import { enhancedPipelineApiService } from '../../services/enhancedPipelineApiService';
import { robustEnhancedPipelineService } from '../../services/robustEnhancedPipelineService';
import { errorHandlingService, ErrorType, ErrorSeverity } from '../../services/errorHandlingService';
import type { PipelineJob } from '../../services/pipelineApiService';

// Import apenas os serviços existentes
import { 
  type CompletePipelineData 
} from '../../services/pipelineOrchestrationService'

interface CompletePipelineInterfaceProps {
  onPipelineComplete?: (data: CompletePipelineData) => void
  onNavigateToEditor?: (data: CompletePipelineData) => void
  className?: string
}

export const CompletePipelineInterface: React.FC<CompletePipelineInterfaceProps> = ({
  onPipelineComplete,
  onNavigateToEditor,
  className = ''
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [currentJob, setCurrentJob] = useState<PipelineJob | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [completedData, setCompletedData] = useState<CompletePipelineData | null>(null)
  const [isExpanded, setIsExpanded] = useState(false)
  const [recentJobs, setRecentJobs] = useState<PipelineJob[]>([])
  const [stats, setStats] = useState<any>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editingData, setEditingData] = useState<CompletePipelineData | null>(null)
  
  // Estados adicionais para melhor tracking de progresso
  const [detailedProgress, setDetailedProgress] = useState<{
    overallProgress: number;
    currentStage: string;
    stageProgress: number;
    estimatedTimeRemaining: string;
    elapsedTime: string;
    startTime?: Date;
  }>({
    overallProgress: 0,
    currentStage: '',
    stageProgress: 0,
    estimatedTimeRemaining: '',
    elapsedTime: ''
  })
  
  const [isPolling, setIsPolling] = useState(false)
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const [errorHistory, setErrorHistory] = useState<Array<{id: string, message: string, timestamp: Date}>>([])
  const [performanceMetrics, setPerformanceMetrics] = useState<{
    averageProcessingTime: number;
    successRate: number;
    activeJobs: number;
  } | null>(null)

  // Load recent jobs and stats on component mount
  useEffect(() => {
    loadRecentJobs()
    loadStats()
  }, [])

  const loadRecentJobs = async () => {
    try {
      const response = await pipelineApiService.getUserJobs()
      if (response.success && response.data) {
        setRecentJobs(response.data.slice(0, 5)) // Show last 5 jobs
      }
    } catch (error) {
      console.error('Error loading recent jobs:', error)
    }
  }

  const loadStats = async () => {
    try {
      const response = await enhancedPipelineApiService.getPipelineStatsRobust()
      if (response.success && response.data) {
        setStats(response.data)
      } else {
        console.warn('Failed to load stats:', response.error)
      }
    } catch (error) {
      await errorHandlingService.handleError(error, {
        service: 'CompletePipelineInterface',
        method: 'loadStats',
        environment: process.env.NODE_ENV as 'development' | 'production' | 'test' || 'development'
      }, {
        type: ErrorType.API,
        severity: ErrorSeverity.LOW
      })
    }
  }

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.name.toLowerCase().endsWith('.pptx') && !file.name.toLowerCase().endsWith('.ppt')) {
        toast.error('Por favor, selecione um arquivo PowerPoint (.pptx ou .ppt)')
        return
      }

      // Validate file size (100MB limit)
      if (file.size > 100 * 1024 * 1024) {
        toast.error('Arquivo muito grande. Limite máximo: 100MB')
        return
      }

      setSelectedFile(file)
      toast.success(`Arquivo selecionado: ${file.name}`)
    }
  }, [])

  // Função aprimorada de polling de progresso com error handling robusto
  const startProgressPolling = useCallback((jobId: string) => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current)
    }

    setIsPolling(true)
    setDetailedProgress(prev => ({
      ...prev,
      startTime: new Date(),
      elapsedTime: '0s'
    }))

    // Usar o monitoramento robusto em vez do polling manual
    enhancedPipelineApiService.monitorJobRobust(jobId, {
      onProgress: (job: PipelineJob) => {
        setCurrentJob(job)

        // Calcular tempo decorrido
        const elapsedSeconds = Math.floor((Date.now() - (detailedProgress.startTime?.getTime() || Date.now())) / 1000)
        const elapsedTime = formatDuration(elapsedSeconds)

        // Estimar tempo restante baseado no progresso atual
        let estimatedTimeRemaining = ''
        if (job.progress > 0 && job.progress < 100) {
          const totalEstimatedSeconds = (elapsedSeconds / job.progress) * 100
          const remainingSeconds = totalEstimatedSeconds - elapsedSeconds
          estimatedTimeRemaining = formatDuration(Math.max(0, remainingSeconds))
        }

        // Obter progresso do stage atual
        const currentStageInfo = getCurrentStageInfo(job)

        setDetailedProgress({
          overallProgress: job.progress,
          currentStage: job.currentStage,
          stageProgress: currentStageInfo.progress,
          estimatedTimeRemaining,
          elapsedTime,
          startTime: detailedProgress.startTime || new Date()
        })
      },

      onComplete: (job: PipelineJob) => {
        stopProgressPolling()
        setIsRunning(false)
        
        if (job.result) {
          setCompletedData({
            pptxFile: selectedFile!,
            finalVideoUrl: job.result.videoUrl,
            exportSettings: { 
              quality: 'high',
              format: 'mp4'
            }
          })
          toast.success('Pipeline concluído com sucesso!')
        }
      },

      onError: (error: string) => {
        stopProgressPolling()
        setIsRunning(false)
        
        const errorItem = { 
          id: Date.now().toString(), 
          message: error, 
          timestamp: new Date() 
        }
        setErrorHistory(prev => [errorItem, ...prev.slice(0, 4)])
        toast.error(`Pipeline falhou: ${error}`)
      },

      onRetry: (attempt: number) => {
        toast.info(`Tentando novamente... (tentativa ${attempt})`)
      }
    })
  }, [detailedProgress.startTime, selectedFile])

  const stopProgressPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current)
      pollingIntervalRef.current = null
    }
    setIsPolling(false)
  }, [])

  // Função utilitária para obter informações do stage atual
  const getCurrentStageInfo = (job: PipelineJob) => {
    const currentStage = job.stages[job.currentStage as keyof typeof job.stages]
    return {
      progress: currentStage?.progress || 0,
      status: currentStage?.status || 'pending',
      duration: currentStage?.duration || 0
    }
  }

  // Função utilitária para formatar duração
  const formatDuration = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    if (minutes < 60) return `${minutes}m ${remainingSeconds}s`
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return `${hours}h ${remainingMinutes}m`
  }

  // Função para obter cor do progresso baseada no status
  const getProgressColor = (progress: number, status: string) => {
    if (status === 'failed') return 'bg-red-500'
    if (status === 'completed') return 'bg-green-500'
    if (progress > 75) return 'bg-blue-500'
    if (progress > 50) return 'bg-yellow-500'
    return 'bg-gray-500'
  }

  // Iniciar pipeline com error handling robusto
  const startPipeline = async () => {
    if (!selectedFile) {
      toast.error('Selecione um arquivo primeiro')
      return
    }

    try {
      setIsRunning(true)
      setErrorHistory([]) // Limpar histórico de erros
      
      // Usar enhanced pipeline service com tratamento robusto de erros
      const response = await enhancedPipelineApiService.startPipeline(selectedFile)
      
      if (response.success && response.data) {
        toast.success('Pipeline iniciado com validação robusta!')
        startProgressPolling(response.data.jobId)
      } else {
        throw new Error(response.error || 'Falha ao iniciar pipeline')
      }
    } catch (error) {
      setIsRunning(false)
      
      // Usar error handling service para tratar o erro
      const handlingResult = await errorHandlingService.handleError(error, {
        service: 'CompletePipelineInterface',
        method: 'startPipeline',
        environment: process.env.NODE_ENV as 'development' | 'production' | 'test' || 'development',
        inputData: {
          fileName: selectedFile.name,
          fileSize: selectedFile.size
        }
      }, {
        type: ErrorType.PIPELINE,
        severity: ErrorSeverity.HIGH,
        customMessage: 'Falha ao iniciar o pipeline de processamento'
      })
      
      toast.error(handlingResult.userMessage)
      const errorItem = {
        id: Date.now().toString(),
        message: handlingResult.userMessage,
        timestamp: new Date()
      }
      setErrorHistory(prev => [errorItem, ...prev.slice(0, 4)])
    }
  }

  // Cancelar pipeline com error handling robusto
  const cancelPipeline = async () => {
    if (!currentJob) return

    try {
      const result = await enhancedPipelineApiService.cancelJobRobust(currentJob.id)
      
      if (result.success) {
        stopProgressPolling()
        setIsRunning(false)
        setCurrentJob(null)
        toast.success('Pipeline cancelado com sucesso')
      } else {
        throw new Error(result.error || 'Falha ao cancelar job')
      }
    } catch (error) {
      const handlingResult = await errorHandlingService.handleError(error, {
        service: 'CompletePipelineInterface',
        method: 'cancelPipeline',
        environment: process.env.NODE_ENV as 'development' | 'production' | 'test' || 'development',
        inputData: { jobId: currentJob.id }
      }, {
        type: ErrorType.API,
        severity: ErrorSeverity.MEDIUM,
        customMessage: 'Falha ao cancelar pipeline'
      })
      
      toast.error(handlingResult.userMessage)
    }
  }

  // Cleanup no desmount do componente
  useEffect(() => {
    return () => {
      stopProgressPolling()
    }
  }, [stopProgressPolling])

  // Load performance metrics periodicamente com error handling
  useEffect(() => {
    const loadPerformanceMetrics = async () => {
      try {
        const response = await enhancedPipelineApiService.getPipelineStatsRobust()
        if (response.success && response.data) {
          setPerformanceMetrics({
            averageProcessingTime: response.data.averageProcessingTime || 0,
            successRate: response.data.successRate || 0,
            activeJobs: 0 // Será calculado baseado nos jobs atuais
          })
        }
      } catch (error) {
        await errorHandlingService.handleError(error, {
          service: 'CompletePipelineInterface',
          method: 'loadPerformanceMetrics',
          environment: process.env.NODE_ENV as 'development' | 'production' | 'test' || 'development'
        }, {
          type: ErrorType.API,
          severity: ErrorSeverity.LOW
        })
      }
    }

    loadPerformanceMetrics()
    const metricsInterval = setInterval(loadPerformanceMetrics, 30000) // A cada 30s

    return () => clearInterval(metricsInterval)
  }, [])

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header com Status Geral */}
      <Card className="bg-gray-900 text-white">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Brain className="w-6 h-6 text-blue-500" />
              <span>Pipeline PPTX → Vídeo</span>
              {isRunning && (
                <Badge className="bg-blue-600">
                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                  Processando
                </Badge>
              )}
            </div>
            {performanceMetrics && (
              <div className="flex items-center space-x-4 text-sm text-gray-400">
                <div className="flex items-center space-x-1">
                  <BarChart3 className="w-4 h-4" />
                  <span>{performanceMetrics.successRate.toFixed(1)}% sucesso</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Clock className="w-4 h-4" />
                  <span>{formatDuration(performanceMetrics.averageProcessingTime)}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Zap className="w-4 h-4" />
                  <span>{performanceMetrics.activeJobs} ativo(s)</span>
                </div>
              </div>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Upload Section */}
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={isRunning}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Upload className="w-4 h-4 mr-2" />
                Selecionar PPTX
              </Button>
              
              {selectedFile && (
                <div className="flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-green-500" />
                  <span className="text-sm">{selectedFile.name}</span>
                  <Badge variant="secondary">
                    {(selectedFile.size / 1024 / 1024).toFixed(1)} MB
                  </Badge>
                </div>
              )}
              
              {selectedFile && !isRunning && (
                <Button
                  onClick={startPipeline}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Iniciar Pipeline
                </Button>
              )}
              
              {isRunning && (
                <Button
                  onClick={cancelPipeline}
                  variant="destructive"
                  className="bg-red-600 hover:bg-red-700"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancelar
                </Button>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".pptx,.ppt"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          {/* Progress Section Avançada */}
          {isRunning && currentJob && (
            <div className="mt-6 space-y-4">
              {/* Progress Principal */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Progresso Geral</span>
                  <span className="text-sm text-gray-400">{detailedProgress.overallProgress.toFixed(1)}%</span>
                </div>
                <div className="relative">
                  <Progress 
                    value={detailedProgress.overallProgress} 
                    className="h-3"
                  />
                  <div 
                    className="absolute top-0 left-0 h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${detailedProgress.overallProgress}%`,
                      background: `linear-gradient(90deg, #3b82f6 0%, #10b981 ${detailedProgress.overallProgress}%)`
                    }}
                  />
                </div>
              </div>

              {/* Stage Atual */}
              <div className="bg-gray-800 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse" />
                    <span className="font-medium">Stage Atual: {detailedProgress.currentStage}</span>
                  </div>
                  <span className="text-sm text-gray-400">
                    {detailedProgress.stageProgress.toFixed(1)}%
                  </span>
                </div>
                
                <Progress 
                  value={detailedProgress.stageProgress}
                  className="h-2"
                />

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="space-y-1">
                    <div className="text-gray-400">Tempo Decorrido</div>
                    <div className="font-mono text-blue-400">{detailedProgress.elapsedTime}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-gray-400">Tempo Restante</div>
                    <div className="font-mono text-green-400">
                      {detailedProgress.estimatedTimeRemaining || 'Calculando...'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Status dos Stages */}
              <div className="grid grid-cols-5 gap-2">
                {Object.entries(currentJob.stages).map(([stageName, stage]) => (
                  <div 
                    key={stageName}
                    className={`p-2 rounded text-center text-xs transition-all ${
                      stage.status === 'completed' ? 'bg-green-900 text-green-300' :
                      stage.status === 'processing' ? 'bg-blue-900 text-blue-300 animate-pulse' :
                      stage.status === 'failed' ? 'bg-red-900 text-red-300' :
                      'bg-gray-800 text-gray-400'
                    }`}
                  >
                    <div className="font-medium capitalize">{stageName}</div>
                    <div className="mt-1">
                      {stage.status === 'completed' && <CheckCircle className="w-3 h-3 mx-auto" />}
                      {stage.status === 'processing' && <Loader2 className="w-3 h-3 mx-auto animate-spin" />}
                      {stage.status === 'failed' && <X className="w-3 h-3 mx-auto" />}
                      {stage.status === 'pending' && <Clock className="w-3 h-3 mx-auto" />}
                    </div>
                    <div className="text-xs mt-1">{stage.progress}%</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Resultados */}
          {completedData && (
            <div className="mt-6 bg-green-900/20 border border-green-700 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="font-medium text-green-400">Pipeline Concluído!</span>
                </div>
                <div className="flex space-x-2">
                  <Button
                    onClick={() => window.open(completedData.finalVideoUrl, '_blank')}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Video className="w-4 h-4 mr-2" />
                    Ver Vídeo
                  </Button>
                  <Button
                    onClick={() => onNavigateToEditor?.(completedData)}
                    variant="outline"
                    className="border-green-600 text-green-400 hover:bg-green-900"
                  >
                    <Film className="w-4 h-4 mr-2" />
                    Editar
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Histórico de Erros */}
          {errorHistory.length > 0 && (
            <div className="mt-6">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center space-x-2 text-sm text-red-400 hover:text-red-300"
              >
                {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                <span>Erros Recentes ({errorHistory.length})</span>
              </button>
              
              {isExpanded && (
                <div className="mt-2 space-y-2">
                  {errorHistory.map(error => (
                    <div key={error.id} className="bg-red-900/20 border border-red-700 rounded p-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-red-400">{error.message}</span>
                        <span className="text-xs text-gray-500">
                          {error.timestamp.toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Jobs Recentes */}
          {recentJobs.length > 0 && (
            <div className="mt-6">
              <h4 className="text-sm font-medium mb-3 text-gray-300">Jobs Recentes</h4>
              <div className="space-y-2">
                {recentJobs.slice(0, 3).map(job => (
                  <div key={job.id} className="flex items-center justify-between bg-gray-800 rounded p-3">
                    <div className="flex items-center space-x-3">
                      <div className={`w-2 h-2 rounded-full ${
                        job.status === 'completed' ? 'bg-green-500' :
                        job.status === 'failed' ? 'bg-red-500' :
                        job.status === 'processing' ? 'bg-blue-500 animate-pulse' :
                        'bg-gray-500'
                      }`} />
                      <span className="text-sm">{job.file.originalName}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-xs text-gray-400">
                      <span>{job.status}</span>
                      <span>•</span>
                      <span>{job.progress}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}