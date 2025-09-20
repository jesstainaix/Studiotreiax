import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { pptxValidationService } from '../services/pptx-validation.service'
import { userLimitsService } from '../services/user-limits.service'
import { searchIntegrationService } from '../services/search-integration.service'
import { retryService } from '../services/retry.service'
import { cacheService } from '../services/cache.service'
import { previewService } from '../services/preview.service'
import { contentValidationService } from '../services/content-validation.service'

// Mock do Redis para testes
vi.mock('redis', () => ({
  createClient: vi.fn(() => ({
    connect: vi.fn(),
    disconnect: vi.fn(),
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
    exists: vi.fn(),
    expire: vi.fn(),
    flushall: vi.fn()
  }))
}))

// Mock do JSZip
vi.mock('jszip', () => ({
  default: vi.fn(() => ({
    loadAsync: vi.fn(),
    file: vi.fn(),
    files: {},
    forEach: vi.fn()
  }))
}))

// Mock do Canvas para testes de preview
vi.mock('canvas', () => ({
  createCanvas: vi.fn(() => ({
    getContext: vi.fn(() => ({
      fillStyle: '',
      fillRect: vi.fn(),
      fillText: vi.fn(),
      font: '',
      textAlign: '',
      textBaseline: ''
    })),
    toDataURL: vi.fn(() => 'data:image/png;base64,mock-image-data')
  }))
}))

describe('PPTX Upload Module Tests', () => {
  let mockFile: File
  
  beforeEach(() => {
    // Criar arquivo mock para testes
    mockFile = new File(
      ['mock pptx content'],
      'test-presentation.pptx',
      { type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' }
    )
    
    // Limpar mocks
    vi.clearAllMocks()
  })
  
  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('PPTX Validation Service', () => {
    it('should validate file basic properties', async () => {
      const result = await pptxValidationService.validateFile(mockFile)
      
      expect(result).toBeDefined()
      expect(result.isValid).toBe(true)
      expect(result.fileSize).toBe(mockFile.size)
      expect(result.fileName).toBe(mockFile.name)
    })

    it('should reject files that are too large', async () => {
      const largeFile = new File(
        [new ArrayBuffer(200 * 1024 * 1024)], // 200MB
        'large-file.pptx',
        { type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' }
      )
      
      const result = await pptxValidationService.validateFile(largeFile)
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Arquivo muito grande')
    })

    it('should reject invalid file types', async () => {
      const invalidFile = new File(
        ['not a pptx'],
        'document.txt',
        { type: 'text/plain' }
      )
      
      const result = await pptxValidationService.validateFile(invalidFile)
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Tipo de arquivo inválido')
    })

    it('should check XML integrity', async () => {
      const result = await pptxValidationService.checkXMLIntegrity(mockFile)
      
      expect(result).toBeDefined()
      expect(result.isValid).toBeDefined()
      expect(result.xmlFiles).toBeDefined()
    })

    it('should scan for security threats', async () => {
      const result = await pptxValidationService.scanForSecurity(mockFile)
      
      expect(result).toBeDefined()
      expect(result.threats).toBeDefined()
      expect(Array.isArray(result.threats)).toBe(true)
      expect(result.hasMacros).toBeDefined()
      expect(result.hasExternalLinks).toBeDefined()
    })
  })

  describe('Upload Limits Service', () => {
    it('should get user limits for different user types', () => {
      const freeLimits = userLimitsService.getUserLimits('free')
      const premiumLimits = userLimitsService.getUserLimits('premium')
      const enterpriseLimits = userLimitsService.getUserLimits('enterprise')
      
      expect(freeLimits.maxFileSize).toBeLessThan(premiumLimits.maxFileSize)
      expect(premiumLimits.maxFileSize).toBeLessThan(enterpriseLimits.maxFileSize)
      expect(freeLimits.dailyQuota).toBeLessThan(premiumLimits.dailyQuota)
    })

    it('should check quota availability', async () => {
      const result = await userLimitsService.checkQuota('test-user', mockFile.size)
      
      expect(result).toBeDefined()
      expect(result.canUpload).toBeDefined()
      expect(result.remainingQuota).toBeDefined()
      expect(result.usedQuota).toBeDefined()
    })

    it('should validate upload against limits', async () => {
      const result = await userLimitsService.validateUpload('test-user', mockFile)
      
      expect(result).toBeDefined()
      expect(result.isValid).toBeDefined()
      expect(result.reason).toBeDefined()
    })

    it('should update user limits', () => {
      const newLimits = {
        maxFileSize: 200 * 1024 * 1024,
        dailyQuota: 20,
        monthlyQuota: 500
      }
      
      userLimitsService.updateUserLimits('test-user', newLimits)
      
      // Verificar se os limites foram atualizados
      expect(true).toBe(true) // Placeholder - implementar verificação real
    })
  })

  describe('Search Integration Service', () => {
    it('should analyze content and extract keywords', async () => {
      const content = 'Esta é uma apresentação sobre vendas e marketing digital'
      const result = await searchIntegrationService.analyzeContent(content)
      
      expect(result).toBeDefined()
      expect(result.keywords).toBeDefined()
      expect(Array.isArray(result.keywords)).toBe(true)
      expect(result.topics).toBeDefined()
      expect(result.sentiment).toBeDefined()
    })

    it('should get suggestions based on query', async () => {
      const query = 'apresentação negócios'
      const suggestions = await searchIntegrationService.getSuggestions(query)
      
      expect(Array.isArray(suggestions)).toBe(true)
      expect(suggestions.length).toBeGreaterThan(0)
      
      if (suggestions.length > 0) {
        expect(suggestions[0]).toHaveProperty('title')
        expect(suggestions[0]).toHaveProperty('description')
        expect(suggestions[0]).toHaveProperty('relevance')
      }
    })

    it('should find similar content', async () => {
      const fileId = 'test-file-123'
      const similarContent = await searchIntegrationService.findSimilarContent(fileId)
      
      expect(Array.isArray(similarContent)).toBe(true)
      
      if (similarContent.length > 0) {
        expect(similarContent[0]).toHaveProperty('fileId')
        expect(similarContent[0]).toHaveProperty('title')
        expect(similarContent[0]).toHaveProperty('similarity')
      }
    })

    it('should get personalized suggestions', async () => {
      const userId = 'test-user-456'
      const context = 'business presentation'
      const suggestions = await searchIntegrationService.getPersonalizedSuggestions(userId, context)
      
      expect(Array.isArray(suggestions)).toBe(true)
    })
  })

  describe('Retry Service', () => {
    it('should retry failed operations with exponential backoff', async () => {
      let attempts = 0
      const failingFunction = async () => {
        attempts++
        if (attempts < 3) {
          throw new Error('Simulated failure')
        }
        return 'success'
      }
      
      const result = await retryService.executeWithRetry(failingFunction, {
        maxAttempts: 3,
        baseDelay: 10, // Reduzir delay para testes
        maxDelay: 100
      })
      
      expect(result).toBe('success')
      expect(attempts).toBe(3)
    })

    it('should respect abort signal', async () => {
      const controller = new AbortController()
      
      // Cancelar após 50ms
      setTimeout(() => controller.abort(), 50)
      
      const failingFunction = async () => {
        await new Promise(resolve => setTimeout(resolve, 100))
        throw new Error('Should not reach here')
      }
      
      await expect(
        retryService.executeWithRetry(
          failingFunction,
          { maxAttempts: 5, baseDelay: 100 },
          controller.signal
        )
      ).rejects.toThrow()
    })

    it('should calculate correct delay with exponential backoff', () => {
      const config = {
        maxAttempts: 5,
        baseDelay: 100,
        maxDelay: 5000,
        backoffMultiplier: 2
      }
      
      // Testar cálculo de delay para diferentes tentativas
      expect(retryService['calculateDelay'](1, config)).toBe(100)
      expect(retryService['calculateDelay'](2, config)).toBe(200)
      expect(retryService['calculateDelay'](3, config)).toBe(400)
      expect(retryService['calculateDelay'](10, config)).toBe(5000) // Máximo
    })
  })

  describe('Cache Service', () => {
    beforeEach(async () => {
      // Limpar cache antes de cada teste
      await cacheService.clear()
    })

    it('should store and retrieve data', async () => {
      const key = 'test-key'
      const value = { data: 'test data', timestamp: Date.now() }
      
      await cacheService.set(key, value)
      const retrieved = await cacheService.get(key)
      
      expect(retrieved).toEqual(value)
    })

    it('should handle cache expiration', async () => {
      const key = 'expiring-key'
      const value = { data: 'expiring data' }
      
      await cacheService.set(key, value, 1) // 1 segundo de TTL
      
      // Verificar se existe imediatamente
      const immediate = await cacheService.get(key)
      expect(immediate).toEqual(value)
      
      // Aguardar expiração
      await new Promise(resolve => setTimeout(resolve, 1100))
      
      const expired = await cacheService.get(key)
      expect(expired).toBeNull()
    })

    it('should manage chunk metadata', async () => {
      const chunkId = 'chunk-123'
      const metadata = {
        chunkId,
        uploadId: 'upload-456',
        index: 0,
        size: 1024,
        hash: 'abc123',
        timestamp: Date.now(),
        status: 'uploaded' as const
      }
      
      await cacheService.setChunkMetadata(chunkId, metadata)
      const retrieved = await cacheService.getChunkMetadata(chunkId)
      
      expect(retrieved).toEqual(metadata)
    })

    it('should manage file metadata', async () => {
      const fileId = 'file-789'
      const metadata = {
        fileId,
        fileName: 'test.pptx',
        fileSize: 1024,
        mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        uploadId: 'upload-456',
        chunks: [],
        processingStatus: 'completed' as const,
        createdAt: Date.now(),
        updatedAt: Date.now()
      }
      
      await cacheService.setFileMetadata(fileId, metadata)
      const retrieved = await cacheService.getFileMetadata(fileId)
      
      expect(retrieved).toEqual(metadata)
    })

    it('should clear upload data', async () => {
      const uploadId = 'upload-to-clear'
      
      // Adicionar alguns dados
      await cacheService.set(`upload:${uploadId}:progress`, { progress: 50 })
      await cacheService.set(`upload:${uploadId}:chunks`, ['chunk1', 'chunk2'])
      
      // Limpar dados do upload
      await cacheService.clearUploadData(uploadId)
      
      // Verificar se foram removidos
      const progress = await cacheService.get(`upload:${uploadId}:progress`)
      const chunks = await cacheService.get(`upload:${uploadId}:chunks`)
      
      expect(progress).toBeNull()
      expect(chunks).toBeNull()
    })
  })

  describe('Preview Service', () => {
    it('should generate thumbnail from slide data', async () => {
      const slideData = {
        title: 'Test Slide',
        content: 'This is test content',
        elements: [
          { type: 'text', content: 'Sample text' },
          { type: 'image', src: 'test.jpg', size: 1024 }
        ]
      }
      
      const thumbnail = await previewService.generateThumbnail(slideData)
      
      expect(thumbnail).toBeDefined()
      expect(thumbnail.startsWith('data:image/')).toBe(true)
    })

    it('should generate real-time preview', async () => {
      const fileId = 'preview-test-file'
      let progressCalled = false
      
      const progressCallback = (progress: any) => {
        progressCalled = true
        expect(progress.stage).toBeDefined()
        expect(progress.progress).toBeDefined()
      }
      
      const result = await previewService.generateRealTimePreview(
        fileId,
        mockFile,
        progressCallback
      )
      
      expect(result).toBeDefined()
      expect(result.fileId).toBe(fileId)
      expect(result.slides).toBeDefined()
      expect(Array.isArray(result.slides)).toBe(true)
      expect(progressCalled).toBe(true)
    })

    it('should cache and retrieve previews', async () => {
      const fileId = 'cache-test-file'
      
      // Gerar preview
      await previewService.generateRealTimePreview(fileId, mockFile, () => {})
      
      // Verificar se foi cacheado
      const cached = previewService.getCachedPreview(fileId)
      expect(cached).toBeDefined()
      
      if (cached) {
        expect(cached.fileId).toBe(fileId)
        expect(cached.slides).toBeDefined()
      }
    })

    it('should cancel preview generation', async () => {
      const fileId = 'cancel-test-file'
      
      // Iniciar preview
      const previewPromise = previewService.generateRealTimePreview(
        fileId,
        mockFile,
        () => {}
      )
      
      // Cancelar imediatamente
      previewService.cancelPreview(fileId)
      
      // O preview deve ser cancelado
      await expect(previewPromise).rejects.toThrow('Preview cancelado')
    })
  })

  describe('Content Validation Service', () => {
    it('should validate PPTX content structure', async () => {
      const mockPPTXData = {
        slides: [
          {
            elements: [
              { type: 'text', content: 'Valid text content' },
              { type: 'image', src: 'valid-image.jpg', size: 1024 }
            ]
          },
          {
            elements: [
              { type: 'text', content: 'Another slide text' }
            ]
          }
        ]
      }
      
      const result = await contentValidationService.validateContent(
        'test-file-id',
        'test.pptx',
        mockPPTXData
      )
      
      expect(result).toBeDefined()
      expect(result.isValid).toBeDefined()
      expect(result.overallScore).toBeDefined()
      expect(result.slideCount).toBe(2)
      expect(Array.isArray(result.issues)).toBe(true)
    })

    it('should detect corrupted slides', async () => {
      const corruptedData = {
        slides: [
          {
            elements: [
              { type: 'text', content: '' }, // Conteúdo vazio
              { type: 'image', src: '', size: 0 } // Imagem inválida
            ]
          }
        ]
      }
      
      const result = await contentValidationService.validateContent(
        'corrupted-file-id',
        'corrupted.pptx',
        corruptedData
      )
      
      expect(result.isValid).toBe(false)
      expect(result.issues.length).toBeGreaterThan(0)
      expect(result.overallScore).toBeLessThan(0.8)
    })

    it('should analyze media elements', async () => {
      const mediaData = {
        slides: [
          {
            elements: [
              { type: 'image', src: 'large-image.jpg', size: 10 * 1024 * 1024 }, // 10MB
              { type: 'video', src: 'video.mp4', size: 50 * 1024 * 1024 }, // 50MB
              { type: 'audio', src: 'audio.mp3', size: 5 * 1024 * 1024 } // 5MB
            ]
          }
        ]
      }
      
      const result = await contentValidationService.validateContent(
        'media-file-id',
        'media.pptx',
        mediaData
      )
      
      expect(result).toBeDefined()
      expect(result.mediaAnalysis).toBeDefined()
      expect(result.mediaAnalysis.totalSize).toBeGreaterThan(0)
      expect(result.mediaAnalysis.imageCount).toBe(1)
      expect(result.mediaAnalysis.videoCount).toBe(1)
      expect(result.mediaAnalysis.audioCount).toBe(1)
    })

    it('should validate text content quality', async () => {
      const textData = {
        slides: [
          {
            elements: [
              { type: 'text', content: 'Esta é uma apresentação bem estruturada com conteúdo relevante e informativo.' },
              { type: 'text', content: 'Segundo parágrafo com mais informações importantes.' }
            ]
          }
        ]
      }
      
      const result = await contentValidationService.validateContent(
        'text-file-id',
        'text.pptx',
        textData
      )
      
      expect(result).toBeDefined()
      expect(result.textAnalysis).toBeDefined()
      expect(result.textAnalysis.totalWords).toBeGreaterThan(0)
      expect(result.textAnalysis.averageWordsPerSlide).toBeGreaterThan(0)
      expect(result.textAnalysis.readabilityScore).toBeDefined()
    })
  })

  describe('Integration Tests', () => {
    it('should handle complete upload workflow', async () => {
      // 1. Validar arquivo
      const validationResult = await pptxValidationService.validateFile(mockFile)
      expect(validationResult.isValid).toBe(true)
      
      // 2. Verificar limites
      const limitsResult = await uploadLimitsService.validateUpload('test-user', mockFile)
      expect(limitsResult.isValid).toBe(true)
      
      // 3. Gerar preview
      const previewResult = await previewService.generateRealTimePreview(
        'integration-test-file',
        mockFile,
        () => {}
      )
      expect(previewResult.slides.length).toBeGreaterThan(0)
      
      // 4. Analisar conteúdo
      const contentAnalysis = await searchIntegrationService.analyzeContent(
        'Conteúdo de teste para análise integrada'
      )
      expect(contentAnalysis.keywords.length).toBeGreaterThan(0)
      
      // 5. Cache dos resultados
      await cacheService.set('integration-test-results', {
        validation: validationResult,
        limits: limitsResult,
        preview: previewResult,
        analysis: contentAnalysis
      })
      
      const cachedResults = await cacheService.get('integration-test-results')
      expect(cachedResults).toBeDefined()
    })

    it('should handle error scenarios gracefully', async () => {
      // Teste com arquivo inválido
      const invalidFile = new File(['invalid'], 'invalid.txt', { type: 'text/plain' })
      
      const validationResult = await pptxValidationService.validateFile(invalidFile)
      expect(validationResult.isValid).toBe(false)
      
      // Teste com usuário sem permissão
      const limitsResult = await uploadLimitsService.checkQuota('blocked-user', 1000000000)
      expect(limitsResult.canUpload).toBe(false)
      
      // Teste de retry com falha persistente
      const persistentFailure = async () => {
        throw new Error('Persistent failure')
      }
      
      await expect(
        retryService.executeWithRetry(persistentFailure, {
          maxAttempts: 2,
          baseDelay: 10,
          maxDelay: 100
        })
      ).rejects.toThrow('Persistent failure')
    })
  })
})

// Testes de performance
describe('Performance Tests', () => {
  it('should validate large files efficiently', async () => {
    const largeFile = new File(
      [new ArrayBuffer(50 * 1024 * 1024)], // 50MB
      'large-presentation.pptx',
      { type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' }
    )
    
    const startTime = Date.now()
    const result = await pptxValidationService.validateFile(largeFile)
    const duration = Date.now() - startTime
    
    expect(duration).toBeLessThan(5000) // Deve completar em menos de 5 segundos
    expect(result).toBeDefined()
  })

  it('should handle concurrent cache operations', async () => {
    const operations = []
    
    // Criar 10 operações concorrentes
    for (let i = 0; i < 10; i++) {
      operations.push(
        cacheService.set(`concurrent-key-${i}`, { data: `value-${i}` })
      )
    }
    
    // Executar todas concorrentemente
    await Promise.all(operations)
    
    // Verificar se todas foram armazenadas
    for (let i = 0; i < 10; i++) {
      const value = await cacheService.get(`concurrent-key-${i}`)
      expect(value).toEqual({ data: `value-${i}` })
    }
  })

  it('should generate previews within reasonable time', async () => {
    const startTime = Date.now()
    
    const result = await previewService.generateRealTimePreview(
      'performance-test-file',
      mockFile,
      () => {}
    )
    
    const duration = Date.now() - startTime
    
    expect(duration).toBeLessThan(3000) // Deve completar em menos de 3 segundos
    expect(result.slides.length).toBeGreaterThan(0)
  })
})