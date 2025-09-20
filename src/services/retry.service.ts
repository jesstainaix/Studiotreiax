export interface RetryConfig {
  maxRetries: number
  baseDelay: number // em millisegundos
  maxDelay: number // em millisegundos
  backoffMultiplier: number
  jitter: boolean // adiciona aleatoriedade ao delay
  retryCondition?: (error: Error) => boolean
}

export interface RetryAttempt {
  attempt: number
  delay: number
  error: Error
  timestamp: number
}

export interface RetryResult<T> {
  success: boolean
  result?: T
  error?: Error
  attempts: RetryAttempt[]
  totalTime: number
}

const DEFAULT_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000, // 1 segundo
  maxDelay: 30000, // 30 segundos
  backoffMultiplier: 2,
  jitter: true,
  retryCondition: (error: Error) => {
    // Retry em erros de rede, timeout, ou erros temporários do servidor
    const retryableErrors = [
      'NetworkError',
      'TimeoutError',
      'AbortError',
      'fetch'
    ]
    
    const errorMessage = error.message.toLowerCase()
    const errorName = error.name.toLowerCase()
    
    return retryableErrors.some(retryableError => 
      errorMessage.includes(retryableError.toLowerCase()) ||
      errorName.includes(retryableError.toLowerCase())
    ) || 
    // Retry em códigos de status HTTP específicos
    (error as any).status >= 500 || // Erros do servidor
    (error as any).status === 408 || // Request Timeout
    (error as any).status === 429    // Too Many Requests
  }
}

class RetryService {
  private static instance: RetryService
  private activeRetries = new Map<string, AbortController>()

  static getInstance(): RetryService {
    if (!RetryService.instance) {
      RetryService.instance = new RetryService()
    }
    return RetryService.instance
  }

  /**
   * Executa uma função com retry automático
   */
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    config: Partial<RetryConfig> = {},
    operationId?: string
  ): Promise<RetryResult<T>> {
    const finalConfig = { ...DEFAULT_CONFIG, ...config }
    const attempts: RetryAttempt[] = []
    const startTime = Date.now()
    
    // Criar AbortController se um ID foi fornecido
    let abortController: AbortController | undefined
    if (operationId) {
      abortController = new AbortController()
      this.activeRetries.set(operationId, abortController)
    }

    try {
      for (let attempt = 0; attempt <= finalConfig.maxRetries; attempt++) {
        // Verificar se a operação foi cancelada
        if (abortController?.signal.aborted) {
          throw new Error('Operação cancelada')
        }

        try {
          const result = await operation()
          
          // Sucesso - limpar retry ativo e retornar resultado
          if (operationId) {
            this.activeRetries.delete(operationId)
          }
          
          return {
            success: true,
            result,
            attempts,
            totalTime: Date.now() - startTime
          }
        } catch (error) {
          const currentError = error instanceof Error ? error : new Error(String(error))
          
          // Registrar tentativa
          attempts.push({
            attempt: attempt + 1,
            delay: 0,
            error: currentError,
            timestamp: Date.now()
          })

          // Se é a última tentativa ou erro não é recuperável, falhar
          if (attempt === finalConfig.maxRetries || 
              !finalConfig.retryCondition?.(currentError)) {
            
            if (operationId) {
              this.activeRetries.delete(operationId)
            }
            
            return {
              success: false,
              error: currentError,
              attempts,
              totalTime: Date.now() - startTime
            }
          }

          // Calcular delay para próxima tentativa
          const delay = this.calculateDelay(attempt, finalConfig)
          attempts[attempts.length - 1].delay = delay

          // Aguardar antes da próxima tentativa
          await this.delay(delay, abortController?.signal)
        }
      }
    } catch (error) {
      // Erro durante o processo de retry (ex: cancelamento)
      if (operationId) {
        this.activeRetries.delete(operationId)
      }
      
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
        attempts,
        totalTime: Date.now() - startTime
      }
    }

    // Nunca deveria chegar aqui, mas por segurança
    return {
      success: false,
      error: new Error('Número máximo de tentativas excedido'),
      attempts,
      totalTime: Date.now() - startTime
    }
  }

  /**
   * Executa upload de arquivo com retry
   */
  async uploadWithRetry(
    file: File,
    uploadUrl: string,
    options: {
      onProgress?: (progress: number) => void
      onRetry?: (attempt: number, error: Error, delay: number) => void
      headers?: Record<string, string>
      retryConfig?: Partial<RetryConfig>
    } = {}
  ): Promise<RetryResult<Response>> {
    const { onProgress, onRetry, headers = {}, retryConfig = {} } = options
    const operationId = `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    const uploadOperation = async (): Promise<Response> => {
      const formData = new FormData()
      formData.append('file', file)

      const xhr = new XMLHttpRequest()
      
      return new Promise((resolve, reject) => {
        // Configurar progresso
        if (onProgress) {
          xhr.upload.addEventListener('progress', (event) => {
            if (event.lengthComputable) {
              const progress = Math.round((event.loaded / event.total) * 100)
              onProgress(progress)
            }
          })
        }

        // Configurar resposta
        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(new Response(xhr.response, {
              status: xhr.status,
              statusText: xhr.statusText
            }))
          } else {
            const error = new Error(`Upload failed: ${xhr.statusText}`)
            ;(error as any).status = xhr.status
            reject(error)
          }
        })

        // Configurar erros
        xhr.addEventListener('error', () => {
          reject(new Error('Network error during upload'))
        })

        xhr.addEventListener('timeout', () => {
          reject(new Error('Upload timeout'))
        })

        xhr.addEventListener('abort', () => {
          reject(new Error('Upload aborted'))
        })

        // Configurar timeout
        xhr.timeout = 60000 // 1 minuto

        // Configurar headers
        Object.entries(headers).forEach(([key, value]) => {
          xhr.setRequestHeader(key, value)
        })

        // Iniciar upload
        xhr.open('POST', uploadUrl)
        xhr.send(formData)

        // Permitir cancelamento via AbortController
        const abortController = this.activeRetries.get(operationId)
        if (abortController) {
          abortController.signal.addEventListener('abort', () => {
            xhr.abort()
          })
        }
      })
    }

    // Configurar callback de retry
    const originalRetryCondition = retryConfig.retryCondition
    const enhancedRetryConfig = {
      ...retryConfig,
      retryCondition: (error: Error) => {
        // Usar condição personalizada se fornecida, senão usar padrão
        const shouldRetry = originalRetryCondition ? 
          originalRetryCondition(error) : 
          DEFAULT_CONFIG.retryCondition!(error)
        
        // Notificar sobre retry
        if (shouldRetry && onRetry) {
          const attempt = this.getAttemptNumber(operationId)
          const delay = this.calculateDelay(attempt, { ...DEFAULT_CONFIG, ...retryConfig })
          onRetry(attempt + 1, error, delay)
        }
        
        return shouldRetry
      }
    }

    return this.executeWithRetry(uploadOperation, enhancedRetryConfig, operationId)
  }

  /**
   * Executa requisição HTTP com retry
   */
  async fetchWithRetry(
    url: string,
    options: RequestInit = {},
    retryConfig: Partial<RetryConfig> = {}
  ): Promise<RetryResult<Response>> {
    const operationId = `fetch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    const fetchOperation = async (): Promise<Response> => {
      const abortController = this.activeRetries.get(operationId)
      const signal = abortController?.signal

      const response = await fetch(url, {
        ...options,
        signal
      })

      // Verificar se a resposta indica erro que deve ser retentado
      if (!response.ok) {
        const error = new Error(`HTTP ${response.status}: ${response.statusText}`)
        ;(error as any).status = response.status
        throw error
      }

      return response
    }

    return this.executeWithRetry(fetchOperation, retryConfig, operationId)
  }

  /**
   * Cancela uma operação de retry em andamento
   */
  cancelRetry(operationId: string): boolean {
    const abortController = this.activeRetries.get(operationId)
    if (abortController) {
      abortController.abort()
      this.activeRetries.delete(operationId)
      return true
    }
    return false
  }

  /**
   * Cancela todas as operações de retry ativas
   */
  cancelAllRetries(): void {
    this.activeRetries.forEach((abortController) => {
      abortController.abort()
    })
    this.activeRetries.clear()
  }

  /**
   * Obtém informações sobre retries ativos
   */
  getActiveRetries(): string[] {
    return Array.from(this.activeRetries.keys())
  }

  /**
   * Verifica se uma operação está sendo retentada
   */
  isRetrying(operationId: string): boolean {
    return this.activeRetries.has(operationId)
  }

  // Métodos privados
  private calculateDelay(attempt: number, config: RetryConfig): number {
    // Calcular delay base com backoff exponencial
    let delay = config.baseDelay * Math.pow(config.backoffMultiplier, attempt)
    
    // Aplicar limite máximo
    delay = Math.min(delay, config.maxDelay)
    
    // Adicionar jitter se habilitado
    if (config.jitter) {
      // Adicionar aleatoriedade de ±25%
      const jitterRange = delay * 0.25
      const jitter = (Math.random() - 0.5) * 2 * jitterRange
      delay += jitter
    }
    
    return Math.max(0, Math.round(delay))
  }

  private async delay(ms: number, signal?: AbortSignal): Promise<void> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(resolve, ms)
      
      if (signal) {
        signal.addEventListener('abort', () => {
          clearTimeout(timeout)
          reject(new Error('Delay aborted'))
        })
      }
    })
  }

  private getAttemptNumber(operationId: string): number {
    // Simular número de tentativa baseado no ID
    // Em implementação real, isso seria rastreado adequadamente
    return 0
  }
}

// Funções utilitárias para uso direto
export const retryService = RetryService.getInstance()

/**
 * Função helper para retry simples
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  config?: Partial<RetryConfig>
): Promise<T> {
  const result = await retryService.executeWithRetry(operation, config)
  
  if (result.success) {
    return result.result!
  } else {
    throw result.error
  }
}

/**
 * Função helper para upload com retry
 */
export async function uploadWithRetry(
  file: File,
  url: string,
  options?: {
    onProgress?: (progress: number) => void
    onRetry?: (attempt: number, error: Error, delay: number) => void
    headers?: Record<string, string>
    retryConfig?: Partial<RetryConfig>
  }
): Promise<Response> {
  const result = await retryService.uploadWithRetry(file, url, options)
  
  if (result.success) {
    return result.result!
  } else {
    throw result.error
  }
}

export default retryService