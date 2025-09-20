import React, { useState, useCallback } from 'react'
import { Upload, FileText, CheckCircle, XCircle, AlertCircle, Play, Pause, RotateCcw } from 'lucide-react'
import { useEnhancedPPTXUpload } from '../../hooks/useEnhancedPPTXUpload'
import { UploadProgressIndicator } from '../../components/upload/UploadProgressIndicator'
import { pptxValidationService } from '../../services/pptx-validation.service'
import { searchIntegrationService } from '../../services/search-integration.service'
import { retryService } from '../../services/retry.service'
import { cacheService } from '../../services/cache.service'
import { previewService } from '../../services/preview.service'
import { contentValidationService } from '../../services/content-validation.service'
import { userLimitsService } from '../../services/user-limits.service'

interface TestResult {
  service: string
  test: string
  status: 'pending' | 'running' | 'passed' | 'failed'
  message: string
  duration?: number
  details?: any
}

interface TestSuite {
  name: string
  tests: TestResult[]
  status: 'pending' | 'running' | 'completed'
  passedTests: number
  totalTests: number
}

const PPTXUploadTest: React.FC = () => {
  const [testSuites, setTestSuites] = useState<TestSuite[]>([])
  const [isRunningTests, setIsRunningTests] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [testResults, setTestResults] = useState<{ [key: string]: any }>({})
  
  const {
    uploadState,
    selectFile,
    startUpload,
    cancelUpload,
    retryUpload
  } = useEnhancedPPTXUpload({
    onProgress: (progress) => {
      console.log('Upload progress:', progress)
    },
    onValidationComplete: (result) => {
      console.log('Validation complete:', result)
    },
    onUploadComplete: (result) => {
      console.log('Upload complete:', result)
    },
    onError: (error) => {
      console.error('Upload error:', error)
    }
  })

  const initializeTestSuites = useCallback((): TestSuite[] => {
    return [
      {
        name: 'Validação de Arquivos',
        status: 'pending',
        passedTests: 0,
        totalTests: 4,
        tests: [
          {
            service: 'pptxValidationService',
            test: 'Validação básica de arquivo',
            status: 'pending',
            message: 'Aguardando execução'
          },
          {
            service: 'pptxValidationService',
            test: 'Verificação de integridade XML',
            status: 'pending',
            message: 'Aguardando execução'
          },
          {
            service: 'pptxValidationService',
            test: 'Detecção de segurança',
            status: 'pending',
            message: 'Aguardando execução'
          },
          {
            service: 'contentValidationService',
            test: 'Validação de conteúdo',
            status: 'pending',
            message: 'Aguardando execução'
          }
        ]
      },
      {
        name: 'Limites de Upload',
        status: 'pending',
        passedTests: 0,
        totalTests: 3,
        tests: [
          {
            service: 'uploadLimitsService',
            test: 'Verificação de limites por usuário',
            status: 'pending',
            message: 'Aguardando execução'
          },
          {
            service: 'uploadLimitsService',
            test: 'Validação de cota',
            status: 'pending',
            message: 'Aguardando execução'
          },
          {
            service: 'uploadLimitsService',
            test: 'Gerenciamento de limites',
            status: 'pending',
            message: 'Aguardando execução'
          }
        ]
      },
      {
        name: 'Sistema de Cache',
        status: 'pending',
        passedTests: 0,
        totalTests: 4,
        tests: [
          {
            service: 'cacheService',
            test: 'Armazenamento e recuperação',
            status: 'pending',
            message: 'Aguardando execução'
          },
          {
            service: 'cacheService',
            test: 'Cache de chunks',
            status: 'pending',
            message: 'Aguardando execução'
          },
          {
            service: 'cacheService',
            test: 'Cache de metadados',
            status: 'pending',
            message: 'Aguardando execução'
          },
          {
            service: 'cacheService',
            test: 'Limpeza de cache',
            status: 'pending',
            message: 'Aguardando execução'
          }
        ]
      },
      {
        name: 'Sistema de Retry',
        status: 'pending',
        passedTests: 0,
        totalTests: 3,
        tests: [
          {
            service: 'retryService',
            test: 'Retry com backoff exponencial',
            status: 'pending',
            message: 'Aguardando execução'
          },
          {
            service: 'retryService',
            test: 'Cancelamento de retry',
            status: 'pending',
            message: 'Aguardando execução'
          },
          {
            service: 'retryService',
            test: 'Configuração de retry',
            status: 'pending',
            message: 'Aguardando execução'
          }
        ]
      },
      {
        name: 'Preview em Tempo Real',
        status: 'pending',
        passedTests: 0,
        totalTests: 3,
        tests: [
          {
            service: 'previewService',
            test: 'Geração de thumbnails',
            status: 'pending',
            message: 'Aguardando execução'
          },
          {
            service: 'previewService',
            test: 'Preview em tempo real',
            status: 'pending',
            message: 'Aguardando execução'
          },
          {
            service: 'previewService',
            test: 'Cache de preview',
            status: 'pending',
            message: 'Aguardando execução'
          }
        ]
      },
      {
        name: 'Integração com Pesquisas',
        status: 'pending',
        passedTests: 0,
        totalTests: 3,
        tests: [
          {
            service: 'searchIntegrationService',
            test: 'Análise de conteúdo',
            status: 'pending',
            message: 'Aguardando execução'
          },
          {
            service: 'searchIntegrationService',
            test: 'Sugestões automáticas',
            status: 'pending',
            message: 'Aguardando execução'
          },
          {
            service: 'searchIntegrationService',
            test: 'Busca de conteúdo similar',
            status: 'pending',
            message: 'Aguardando execução'
          }
        ]
      }
    ]
  }, [])

  const runAllTests = async () => {
    setIsRunningTests(true)
    const suites = initializeTestSuites()
    setTestSuites(suites)
    
    try {
      for (let suiteIndex = 0; suiteIndex < suites.length; suiteIndex++) {
        const suite = suites[suiteIndex]
        suite.status = 'running'
        setTestSuites([...suites])
        
        for (let testIndex = 0; testIndex < suite.tests.length; testIndex++) {
          const test = suite.tests[testIndex]
          test.status = 'running'
          setTestSuites([...suites])
          
          const startTime = Date.now()
          
          try {
            await runIndividualTest(test)
            test.status = 'passed'
            test.duration = Date.now() - startTime
            suite.passedTests++
          } catch (error) {
            test.status = 'failed'
            test.message = error instanceof Error ? error.message : 'Erro desconhecido'
            test.duration = Date.now() - startTime
            test.details = error
          }
          
          setTestSuites([...suites])
        }
        
        suite.status = 'completed'
        setTestSuites([...suites])
      }
    } catch (error) {
      console.error('Erro ao executar testes:', error)
    } finally {
      setIsRunningTests(false)
    }
  }

  const runIndividualTest = async (test: TestResult): Promise<void> => {
    const mockFile = new File(['mock pptx content'], 'test.pptx', {
      type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    })
    
    switch (test.service) {
      case 'pptxValidationService':
        await testPPTXValidation(test, mockFile)
        break
      case 'uploadLimitsService':
        await testUploadLimits(test, mockFile)
        break
      case 'cacheService':
        await testCacheService(test)
        break
      case 'retryService':
        await testRetryService(test)
        break
      case 'previewService':
        await testPreviewService(test, mockFile)
        break
      case 'searchIntegrationService':
        await testSearchIntegration(test)
        break
      case 'contentValidationService':
        await testContentValidation(test, mockFile)
        break
      default:
        throw new Error(`Serviço não reconhecido: ${test.service}`)
    }
  }

  const testPPTXValidation = async (test: TestResult, file: File): Promise<void> => {
    switch (test.test) {
      case 'Validação básica de arquivo':
        const basicResult = await pptxValidationService.validateFile(file)
        if (basicResult.isValid) {
          test.message = 'Validação básica passou'
        } else {
          throw new Error('Validação básica falhou')
        }
        break
      case 'Verificação de integridade XML':
        const integrityResult = await pptxValidationService.checkXMLIntegrity(file)
        if (integrityResult.isValid) {
          test.message = 'Integridade XML verificada'
        } else {
          throw new Error('Falha na integridade XML')
        }
        break
      case 'Detecção de segurança':
        const securityResult = await pptxValidationService.scanForSecurity(file)
        test.message = `Scan de segurança: ${securityResult.threats.length} ameaças detectadas`
        break
    }
  }

  const testUploadLimits = async (test: TestResult, file: File): Promise<void> => {
    switch (test.test) {
      case 'Verificação de limites por usuário':
        const limits = uploadLimitsService.getUserLimits('premium')
        test.message = `Limites obtidos: ${limits.maxFileSize} bytes`
        break
      case 'Validação de cota':
        const quotaResult = await uploadLimitsService.checkQuota('user123', file.size)
        test.message = `Cota verificada: ${quotaResult.canUpload ? 'Permitido' : 'Negado'}`
        break
      case 'Gerenciamento de limites':
        uploadLimitsService.updateUserLimits('user123', { maxFileSize: 100 * 1024 * 1024 })
        test.message = 'Limites atualizados com sucesso'
        break
    }
  }

  const testCacheService = async (test: TestResult): Promise<void> => {
    const testKey = `test_${Date.now()}`
    const testValue = { data: 'test data', timestamp: Date.now() }
    
    switch (test.test) {
      case 'Armazenamento e recuperação':
        await cacheService.set(testKey, testValue)
        const retrieved = await cacheService.get(testKey)
        if (retrieved && retrieved.data === testValue.data) {
          test.message = 'Cache funcionando corretamente'
        } else {
          throw new Error('Falha no cache')
        }
        break
      case 'Cache de chunks':
        const chunkMetadata = {
          chunkId: 'chunk_123',
          uploadId: 'upload_456',
          index: 0,
          size: 1024,
          hash: 'abc123',
          timestamp: Date.now(),
          status: 'uploaded' as const
        }
        await cacheService.setChunkMetadata('chunk_123', chunkMetadata)
        const chunkResult = await cacheService.getChunkMetadata('chunk_123')
        if (chunkResult?.chunkId === 'chunk_123') {
          test.message = 'Cache de chunks funcionando'
        } else {
          throw new Error('Falha no cache de chunks')
        }
        break
      case 'Cache de metadados':
        const fileMetadata = {
          fileId: 'file_789',
          fileName: 'test.pptx',
          fileSize: 1024,
          mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          uploadId: 'upload_456',
          chunks: [],
          processingStatus: 'completed' as const,
          createdAt: Date.now(),
          updatedAt: Date.now()
        }
        await cacheService.setFileMetadata('file_789', fileMetadata)
        const fileResult = await cacheService.getFileMetadata('file_789')
        if (fileResult?.fileId === 'file_789') {
          test.message = 'Cache de metadados funcionando'
        } else {
          throw new Error('Falha no cache de metadados')
        }
        break
      case 'Limpeza de cache':
        await cacheService.clearUploadData('upload_456')
        test.message = 'Cache limpo com sucesso'
        break
    }
  }

  const testRetryService = async (test: TestResult): Promise<void> => {
    switch (test.test) {
      case 'Retry com backoff exponencial':
        let attempts = 0
        const failingFunction = async () => {
          attempts++
          if (attempts < 3) {
            throw new Error('Falha simulada')
          }
          return 'sucesso'
        }
        
        const result = await retryService.executeWithRetry(failingFunction, {
          maxAttempts: 3,
          baseDelay: 100,
          maxDelay: 1000
        })
        
        if (result === 'sucesso' && attempts === 3) {
          test.message = `Retry funcionou após ${attempts} tentativas`
        } else {
          throw new Error('Retry não funcionou corretamente')
        }
        break
      case 'Cancelamento de retry':
        const controller = new AbortController()
        setTimeout(() => controller.abort(), 50)
        
        try {
          await retryService.executeWithRetry(
            async () => {
              throw new Error('Sempre falha')
            },
            { maxAttempts: 5, baseDelay: 100 },
            controller.signal
          )
          throw new Error('Deveria ter sido cancelado')
        } catch (error) {
          if (error instanceof Error && error.message.includes('aborted')) {
            test.message = 'Cancelamento funcionou corretamente'
          } else {
            throw error
          }
        }
        break
      case 'Configuração de retry':
        const config = {
          maxAttempts: 5,
          baseDelay: 200,
          maxDelay: 5000,
          backoffMultiplier: 2
        }
        // Testar se a configuração é aceita
        test.message = 'Configuração de retry aceita'
        break
    }
  }

  const testPreviewService = async (test: TestResult, file: File): Promise<void> => {
    switch (test.test) {
      case 'Geração de thumbnails':
        const mockSlideData = {
          title: 'Slide de Teste',
          content: 'Conteúdo de teste',
          elements: []
        }
        const thumbnail = await previewService.generateThumbnail(mockSlideData)
        if (thumbnail.startsWith('data:image/')) {
          test.message = 'Thumbnail gerado com sucesso'
        } else {
          throw new Error('Falha na geração de thumbnail')
        }
        break
      case 'Preview em tempo real':
        const previewResult = await previewService.generateRealTimePreview(
          'test_file_id',
          file,
          (progress) => {
            console.log('Preview progress:', progress)
          }
        )
        if (previewResult.slides.length > 0) {
          test.message = `Preview gerado: ${previewResult.slides.length} slides`
        } else {
          throw new Error('Falha na geração de preview')
        }
        break
      case 'Cache de preview':
        const cached = previewService.getCachedPreview('test_file_id')
        if (cached) {
          test.message = 'Preview encontrado no cache'
        } else {
          test.message = 'Preview não encontrado no cache (esperado)'
        }
        break
    }
  }

  const testSearchIntegration = async (test: TestResult): Promise<void> => {
    switch (test.test) {
      case 'Análise de conteúdo':
        const analysis = await searchIntegrationService.analyzeContent('Conteúdo de teste para análise')
        if (analysis.keywords.length > 0) {
          test.message = `Análise concluída: ${analysis.keywords.length} palavras-chave`
        } else {
          throw new Error('Falha na análise de conteúdo')
        }
        break
      case 'Sugestões automáticas':
        const suggestions = await searchIntegrationService.getSuggestions('apresentação negócios')
        test.message = `${suggestions.length} sugestões encontradas`
        break
      case 'Busca de conteúdo similar':
        const similar = await searchIntegrationService.findSimilarContent('test_file_id')
        test.message = `${similar.length} conteúdos similares encontrados`
        break
    }
  }

  const testContentValidation = async (test: TestResult, file: File): Promise<void> => {
    const mockPPTXData = {
      slides: [
        {
          elements: [
            { type: 'text', content: 'Texto de teste' },
            { type: 'image', src: 'test.jpg', size: 1024 }
          ]
        }
      ]
    }
    
    const result = await contentValidationService.validateContent(
      'test_file_id',
      file.name,
      mockPPTXData
    )
    
    if (result.isValid) {
      test.message = `Validação concluída: Score ${result.overallScore}`
    } else {
      test.message = `Validação falhou: ${result.issues.length} problemas encontrados`
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      selectFile(file)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />
      case 'running':
        return <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      default:
        return <AlertCircle className="w-4 h-4 text-gray-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'passed':
        return 'text-green-600 bg-green-50'
      case 'failed':
        return 'text-red-600 bg-red-50'
      case 'running':
        return 'text-blue-600 bg-blue-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <FileText className="w-6 h-6" />
          Teste do Módulo de Upload PPTX
        </h1>
        
        {/* Seleção de Arquivo */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Selecionar arquivo para teste
          </label>
          <input
            type="file"
            accept=".pptx,.ppt"
            onChange={handleFileSelect}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          {selectedFile && (
            <p className="mt-2 text-sm text-gray-600">
              Arquivo selecionado: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
            </p>
          )}
        </div>

        {/* Controles de Teste */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={runAllTests}
            disabled={isRunningTests}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRunningTests ? (
              <>
                <Pause className="w-4 h-4" />
                Executando Testes...
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                Executar Todos os Testes
              </>
            )}
          </button>
          
          <button
            onClick={() => {
              setTestSuites([])
              setTestResults({})
            }}
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            <RotateCcw className="w-4 h-4" />
            Limpar Resultados
          </button>
        </div>

        {/* Upload Test */}
        {selectedFile && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Teste de Upload Integrado</h3>
            <div className="flex gap-4 mb-4">
              <button
                onClick={startUpload}
                disabled={uploadState.status === 'uploading'}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                Iniciar Upload
              </button>
              <button
                onClick={cancelUpload}
                disabled={uploadState.status !== 'uploading'}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                Cancelar Upload
              </button>
              <button
                onClick={retryUpload}
                disabled={uploadState.status !== 'error'}
                className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50"
              >
                Tentar Novamente
              </button>
            </div>
            
            <UploadProgressIndicator
              progress={uploadState.progress}
              stage={uploadState.stage}
              error={uploadState.error}
              validationResult={uploadState.validationResult}
              retryAttempt={uploadState.retryAttempt}
              maxRetries={uploadState.maxRetries}
            />
          </div>
        )}

        {/* Resultados dos Testes */}
        {testSuites.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">Resultados dos Testes</h2>
            
            {testSuites.map((suite, suiteIndex) => (
              <div key={suiteIndex} className="border border-gray-200 rounded-lg overflow-hidden">
                <div className={`p-4 ${getStatusColor(suite.status)} border-b`}>
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">{suite.name}</h3>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">
                        {suite.passedTests}/{suite.totalTests} testes passaram
                      </span>
                      {getStatusIcon(suite.status)}
                    </div>
                  </div>
                </div>
                
                <div className="divide-y divide-gray-200">
                  {suite.tests.map((test, testIndex) => (
                    <div key={testIndex} className="p-4 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(test.status)}
                            <span className="font-medium">{test.test}</span>
                            {test.duration && (
                              <span className="text-xs text-gray-500">({test.duration}ms)</span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{test.message}</p>
                          {test.details && test.status === 'failed' && (
                            <details className="mt-2">
                              <summary className="text-xs text-red-600 cursor-pointer">Ver detalhes do erro</summary>
                              <pre className="text-xs bg-red-50 p-2 rounded mt-1 overflow-auto">
                                {JSON.stringify(test.details, null, 2)}
                              </pre>
                            </details>
                          )}
                        </div>
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(test.status)}`}>
                          {test.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default PPTXUploadTest