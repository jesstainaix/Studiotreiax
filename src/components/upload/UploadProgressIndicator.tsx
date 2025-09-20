import React from 'react'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle, AlertCircle, XCircle, Upload, Loader2, FileCheck, Cog, BarChart3 } from 'lucide-react'
import { UploadProgress, ValidationResult } from '@/hooks/useEnhancedPPTXUpload'
import { cn } from '@/lib/utils'

interface UploadProgressIndicatorProps {
  progress: UploadProgress | null
  validationResult: ValidationResult | null
  isUploading: boolean
  isValidating: boolean
  error: string | null
  retryCount: number
  className?: string
}

const stageIcons = {
  validation: FileCheck,
  upload: Upload,
  processing: Cog,
  analysis: BarChart3,
  completed: CheckCircle
}

const stageLabels = {
  validation: 'Validação',
  upload: 'Upload',
  processing: 'Processamento',
  analysis: 'Análise',
  completed: 'Concluído'
}

const stageColors = {
  validation: 'bg-blue-500',
  upload: 'bg-orange-500',
  processing: 'bg-purple-500',
  analysis: 'bg-green-500',
  completed: 'bg-emerald-500'
}

export const UploadProgressIndicator: React.FC<UploadProgressIndicatorProps> = ({
  progress,
  validationResult,
  isUploading,
  isValidating,
  error,
  retryCount,
  className
}) => {
  const isActive = isUploading || isValidating
  const currentStage = progress?.stage || 'validation'
  const currentProgress = progress?.progress || 0
  const currentMessage = progress?.message || ''

  // Determinar o status geral
  const getOverallStatus = () => {
    if (error) return 'error'
    if (currentStage === 'completed') return 'completed'
    if (isActive) return 'active'
    return 'idle'
  }

  const status = getOverallStatus()

  // Renderizar indicador de estágio
  const renderStageIndicator = (stage: keyof typeof stageIcons, index: number) => {
    const Icon = stageIcons[stage]
    const isCurrentStage = currentStage === stage
    const isCompletedStage = Object.keys(stageIcons).indexOf(currentStage) > index
    const isActiveStage = isCurrentStage && isActive

    return (
      <div
        key={stage}
        className={cn(
          'flex items-center space-x-2 p-3 rounded-lg transition-all duration-300',
          isCurrentStage && 'ring-2 ring-offset-2',
          isCompletedStage && 'bg-green-50 border border-green-200',
          isActiveStage && 'bg-blue-50 border border-blue-200',
          !isCurrentStage && !isCompletedStage && 'bg-gray-50 border border-gray-200'
        )}
      >
        <div className={cn(
          'flex items-center justify-center w-8 h-8 rounded-full transition-all duration-300',
          isCompletedStage && 'bg-green-500 text-white',
          isActiveStage && 'bg-blue-500 text-white',
          !isCurrentStage && !isCompletedStage && 'bg-gray-300 text-gray-600'
        )}>
          {isActiveStage ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Icon className="w-4 h-4" />
          )}
        </div>
        
        <div className="flex-1">
          <div className={cn(
            'font-medium text-sm',
            isCompletedStage && 'text-green-700',
            isActiveStage && 'text-blue-700',
            !isCurrentStage && !isCompletedStage && 'text-gray-600'
          )}>
            {stageLabels[stage]}
          </div>
          
          {isCurrentStage && currentMessage && (
            <div className="text-xs text-gray-500 mt-1">
              {currentMessage}
            </div>
          )}
        </div>
        
        {isCurrentStage && isActive && (
          <Badge variant="secondary" className="text-xs">
            {currentProgress}%
          </Badge>
        )}
        
        {isCompletedStage && (
          <CheckCircle className="w-4 h-4 text-green-500" />
        )}
      </div>
    )
  }

  // Renderizar barra de progresso principal
  const renderMainProgress = () => {
    if (!isActive && status !== 'completed') return null

    return (
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-700">
            {stageLabels[currentStage]}
          </span>
          <span className="text-sm text-gray-500">
            {currentProgress}%
          </span>
        </div>
        
        <Progress 
          value={currentProgress} 
          className={cn(
            'h-2 transition-all duration-300',
            status === 'completed' && 'bg-green-100'
          )}
        />
        
        {currentMessage && (
          <p className="text-xs text-gray-600">
            {currentMessage}
          </p>
        )}
      </div>
    )
  }

  // Renderizar informações de retry
  const renderRetryInfo = () => {
    if (retryCount === 0) return null

    return (
      <Alert className="border-orange-200 bg-orange-50">
        <AlertCircle className="h-4 w-4 text-orange-600" />
        <AlertDescription className="text-orange-700">
          Tentativa {retryCount + 1} em andamento...
        </AlertDescription>
      </Alert>
    )
  }

  // Renderizar resultados de validação
  const renderValidationResults = () => {
    if (!validationResult) return null

    const { errors, warnings, securityIssues } = validationResult
    const hasIssues = errors.length > 0 || warnings.length > 0 || securityIssues.length > 0

    if (!hasIssues) {
      return (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-700">
            Arquivo validado com sucesso! Nenhum problema encontrado.
          </AlertDescription>
        </Alert>
      )
    }

    return (
      <div className="space-y-2">
        {errors.length > 0 && (
          <Alert className="border-red-200 bg-red-50">
            <XCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-700">
              <div className="font-medium mb-1">Erros encontrados:</div>
              <ul className="list-disc list-inside space-y-1 text-sm">
                {errors.slice(0, 3).map((error, index) => (
                  <li key={index}>{error.message}</li>
                ))}
                {errors.length > 3 && (
                  <li className="text-red-600">... e mais {errors.length - 3} erros</li>
                )}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {warnings.length > 0 && (
          <Alert className="border-yellow-200 bg-yellow-50">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-700">
              <div className="font-medium mb-1">Avisos:</div>
              <ul className="list-disc list-inside space-y-1 text-sm">
                {warnings.slice(0, 2).map((warning, index) => (
                  <li key={index}>{warning.message}</li>
                ))}
                {warnings.length > 2 && (
                  <li className="text-yellow-600">... e mais {warnings.length - 2} avisos</li>
                )}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {securityIssues.length > 0 && (
          <Alert className="border-orange-200 bg-orange-50">
            <AlertCircle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-700">
              <div className="font-medium mb-1">Problemas de segurança:</div>
              <ul className="list-disc list-inside space-y-1 text-sm">
                {securityIssues.slice(0, 2).map((issue, index) => (
                  <li key={index}>
                    <span className={cn(
                      'font-medium',
                      issue.risk === 'high' && 'text-red-600',
                      issue.risk === 'medium' && 'text-orange-600',
                      issue.risk === 'low' && 'text-yellow-600'
                    )}>
                      [{issue.risk.toUpperCase()}]
                    </span>
                    {' '}{issue.message}
                  </li>
                ))}
                {securityIssues.length > 2 && (
                  <li className="text-orange-600">... e mais {securityIssues.length - 2} problemas</li>
                )}
              </ul>
            </AlertDescription>
          </Alert>
        )}
      </div>
    )
  }

  // Renderizar erro geral
  const renderError = () => {
    if (!error) return null

    return (
      <Alert className="border-red-200 bg-red-50">
        <XCircle className="h-4 w-4 text-red-600" />
        <AlertDescription className="text-red-700">
          <div className="font-medium mb-1">Erro no upload:</div>
          <p className="text-sm">{error}</p>
          {retryCount > 0 && (
            <p className="text-xs mt-2 text-red-600">
              Tentativas realizadas: {retryCount}
            </p>
          )}
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Barra de progresso principal */}
      {renderMainProgress()}
      
      {/* Indicadores de estágio */}
      <div className="space-y-2">
        {Object.keys(stageIcons).map((stage, index) => 
          renderStageIndicator(stage as keyof typeof stageIcons, index)
        )}
      </div>
      
      {/* Informações de retry */}
      {renderRetryInfo()}
      
      {/* Resultados de validação */}
      {renderValidationResults()}
      
      {/* Erro geral */}
      {renderError()}
      
      {/* Status de conclusão */}
      {status === 'completed' && !error && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-700">
            <div className="font-medium">Upload concluído com sucesso!</div>
            <p className="text-sm mt-1">O arquivo foi processado e está pronto para uso.</p>
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}

export default UploadProgressIndicator