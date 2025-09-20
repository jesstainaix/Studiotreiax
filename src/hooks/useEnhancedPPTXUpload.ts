import { useState, useCallback, useRef } from 'react'
import { pptxValidationService, ValidationResult } from '../services/pptx-validation.service'
import { toast } from 'sonner'

export interface UploadProgress {
  stage: 'validation' | 'upload' | 'processing' | 'analysis' | 'completed'
  progress: number
  message: string
  details?: any
}

export interface UploadState {
  file: File | null
  isUploading: boolean
  isValidating: boolean
  progress: UploadProgress | null
  validationResult: ValidationResult | null
  error: string | null
  retryCount: number
  uploadId: string | null
}

export interface UploadConfig {
  maxFileSize?: number
  allowedTypes?: string[]
  enableValidation?: boolean
  enableRetry?: boolean
  maxRetries?: number
  chunkSize?: number
  enableRealTimeProgress?: boolean
}

const DEFAULT_CONFIG: UploadConfig = {
  maxFileSize: 100 * 1024 * 1024, // 100MB
  allowedTypes: ['.pptx', '.ppt'],
  enableValidation: true,
  enableRetry: true,
  maxRetries: 3,
  chunkSize: 1024 * 1024, // 1MB chunks
  enableRealTimeProgress: true
}

export const useEnhancedPPTXUpload = (config: UploadConfig = {}) => {
  const finalConfig = { ...DEFAULT_CONFIG, ...config }
  const abortControllerRef = useRef<AbortController | null>(null)
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  const [state, setState] = useState<UploadState>({
    file: null,
    isUploading: false,
    isValidating: false,
    progress: null,
    validationResult: null,
    error: null,
    retryCount: 0,
    uploadId: null
  })

  const updateProgress = useCallback((progress: Partial<UploadProgress>) => {
    setState(prev => ({
      ...prev,
      progress: prev.progress ? { ...prev.progress, ...progress } : {
        stage: 'validation',
        progress: 0,
        message: 'Iniciando...',
        ...progress
      }
    }))
  }, [])

  const validateFile = useCallback(async (file: File): Promise<ValidationResult> => {
    setState(prev => ({ ...prev, isValidating: true, error: null }))
    
    updateProgress({
      stage: 'validation',
      progress: 0,
      message: 'Iniciando validação...'
    })

    try {
      // Configurar tamanho máximo se especificado
      if (finalConfig.maxFileSize) {
        pptxValidationService.setMaxFileSize(finalConfig.maxFileSize)
      }

      updateProgress({
        progress: 25,
        message: 'Verificando formato do arquivo...'
      })

      const result = await pptxValidationService.validateFile(file)
      
      updateProgress({
        progress: 100,
        message: 'Validação concluída'
      })

      setState(prev => ({
        ...prev,
        validationResult: result,
        isValidating: false
      }))

      return result
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro na validação'
      setState(prev => ({
        ...prev,
        error: errorMessage,
        isValidating: false
      }))
      throw error
    }
  }, [finalConfig.maxFileSize, updateProgress])

  const uploadWithChunks = useCallback(async (
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<string> => {
    const uploadId = `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const chunkSize = finalConfig.chunkSize!
    const totalChunks = Math.ceil(file.size / chunkSize)
    
    setState(prev => ({ ...prev, uploadId }))
    
    for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
      // Verificar se o upload foi cancelado
      if (abortControllerRef.current?.signal.aborted) {
        throw new Error('Upload cancelado')
      }

      const start = chunkIndex * chunkSize
      const end = Math.min(start + chunkSize, file.size)
      const chunk = file.slice(start, end)
      
      const formData = new FormData()
      formData.append('chunk', chunk)
      formData.append('chunkIndex', chunkIndex.toString())
      formData.append('totalChunks', totalChunks.toString())
      formData.append('uploadId', uploadId)
      formData.append('fileName', file.name)
      
      if (chunkIndex === 0) {
        formData.append('fileSize', file.size.toString())
        formData.append('fileType', file.type)
      }

      const response = await fetch('/api/upload/chunk', {
        method: 'POST',
        body: formData,
        signal: abortControllerRef.current?.signal || null
      })

      if (!response.ok) {
        throw new Error(`Erro no upload do chunk ${chunkIndex + 1}: ${response.statusText}`)
      }

      const progress = Math.round(((chunkIndex + 1) / totalChunks) * 100)
      onProgress?.(progress)
      
      updateProgress({
        stage: 'upload',
        progress,
        message: `Enviando chunk ${chunkIndex + 1} de ${totalChunks}...`
      })
    }

    return uploadId
  }, [finalConfig.chunkSize, updateProgress])

  const uploadWithRetry = useCallback(async (
    file: File,
    attempt: number = 1
  ): Promise<string> => {
    try {
      setState(prev => ({ ...prev, retryCount: attempt - 1 }))
      
      const uploadId = await uploadWithChunks(file, (progress) => {
        updateProgress({
          stage: 'upload',
          progress,
          message: `Enviando arquivo... ${progress}%`
        })
      })

      return uploadId
    } catch (error) {
      if (attempt < finalConfig.maxRetries! && finalConfig.enableRetry) {
        const delay = Math.pow(2, attempt) * 1000 // Backoff exponencial
        
        updateProgress({
          stage: 'upload',
          progress: 0,
          message: `Tentativa ${attempt} falhou. Tentando novamente em ${delay/1000}s...`
        })

        await new Promise(resolve => {
          retryTimeoutRef.current = setTimeout(resolve, delay)
        })

        return uploadWithRetry(file, attempt + 1)
      }
      
      throw error
    }
  }, [finalConfig.maxRetries, finalConfig.enableRetry, uploadWithChunks, updateProgress])

  const processFile = useCallback(async (uploadId: string): Promise<any> => {
    updateProgress({
      stage: 'processing',
      progress: 0,
      message: 'Iniciando processamento...'
    })

    const response = await fetch('/api/upload/process', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ uploadId }),
      signal: abortControllerRef.current?.signal || null
    })

    if (!response.ok) {
      throw new Error(`Erro no processamento: ${response.statusText}`)
    }

    const result = await response.json()
    
    updateProgress({
      stage: 'completed',
      progress: 100,
      message: 'Processamento concluído!'
    })

    return result
  }, [updateProgress])

  const handleFileSelect = useCallback(async (file: File) => {
    // Reset state
    setState({
      file: null,
      isUploading: false,
      isValidating: false,
      progress: null,
      validationResult: null,
      error: null,
      retryCount: 0,
      uploadId: null
    })

    try {
      // Validação básica de tipo
      if (finalConfig.allowedTypes) {
        const isValidType = finalConfig.allowedTypes.some(type => 
          file.name.toLowerCase().endsWith(type.toLowerCase())
        )
        
        if (!isValidType) {
          throw new Error(`Tipo de arquivo não permitido. Use: ${finalConfig.allowedTypes.join(', ')}`)
        }
      }

      setState(prev => ({ ...prev, file }))

      // Validação detalhada se habilitada
      if (finalConfig.enableValidation) {
        const validationResult = await validateFile(file)
        
        // Verificar se há erros críticos
        const criticalErrors = validationResult.errors.filter(
          error => error.severity === 'critical' || error.severity === 'high'
        )
        
        if (criticalErrors.length > 0) {
          const errorMessages = criticalErrors.map(error => error.message).join('; ')
          throw new Error(`Arquivo inválido: ${errorMessages}`)
        }

        // Mostrar avisos se houver
        if (validationResult.warnings.length > 0) {
          validationResult.warnings.forEach(warning => {
            toast.warning(warning.message, {
              description: warning.suggestion
            })
          })
        }

        // Mostrar problemas de segurança
        if (validationResult.securityIssues.length > 0) {
          validationResult.securityIssues.forEach(issue => {
            if (issue.risk === 'high') {
              toast.error(`Problema de segurança: ${issue.message}`)
            } else {
              toast.warning(`Aviso de segurança: ${issue.message}`)
            }
          })
        }
      }

      toast.success('Arquivo validado com sucesso!')
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao processar arquivo'
      setState(prev => ({ ...prev, error: errorMessage }))
      toast.error(errorMessage)
    }
  }, [finalConfig.allowedTypes, finalConfig.enableValidation, validateFile])

  const startUpload = useCallback(async () => {
    if (!state.file) {
      toast.error('Nenhum arquivo selecionado')
      return
    }

    // Criar novo AbortController
    abortControllerRef.current = new AbortController()
    
    setState(prev => ({ ...prev, isUploading: true, error: null, retryCount: 0 }))

    try {
      // Upload com retry
      const uploadId = await uploadWithRetry(state.file)
      
      // Processamento
      const result = await processFile(uploadId)
      
      toast.success('Upload e processamento concluídos!')
      return result
      
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        toast.info('Upload cancelado')
      } else {
        const errorMessage = error instanceof Error ? error.message : 'Erro no upload'
        setState(prev => ({ ...prev, error: errorMessage }))
        toast.error(errorMessage)
      }
    } finally {
      setState(prev => ({ ...prev, isUploading: false }))
      abortControllerRef.current = null
    }
  }, [state.file, uploadWithRetry, processFile])

  const cancelUpload = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current)
      retryTimeoutRef.current = null
    }
    
    setState(prev => ({ ...prev, isUploading: false }))
    toast.info('Upload cancelado')
  }, [])

  const resetUpload = useCallback(() => {
    cancelUpload()
    setState({
      file: null,
      isUploading: false,
      isValidating: false,
      progress: null,
      validationResult: null,
      error: null,
      retryCount: 0,
      uploadId: null
    })
  }, [cancelUpload])

  return {
    // State
    ...state,
    
    // Actions
    handleFileSelect,
    startUpload,
    cancelUpload,
    resetUpload,
    validateFile,
    
    // Utils
    isProcessing: state.isUploading || state.isValidating,
    canUpload: state.file && !state.isUploading && !state.isValidating,
    hasValidationErrors: state.validationResult?.errors.some(
      error => error.severity === 'critical' || error.severity === 'high'
    ) || false
  }
}

export default useEnhancedPPTXUpload