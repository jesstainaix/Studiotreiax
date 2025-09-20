import { describe, it, expect, beforeEach, vi } from 'vitest'
import { cacheService } from '../../services/cache.service'
import { retryService } from '../../services/retry.service'
import { previewService } from '../../services/preview.service'
import { contentValidationService } from '../../services/content-validation.service'

describe('PPTX Upload Services', () => {
  let cacheServiceInstance: typeof cacheService
  let retryServiceInstance: typeof retryService
  let previewServiceInstance: typeof previewService
  let contentValidationServiceInstance: typeof contentValidationService

  beforeEach(() => {
    vi.clearAllMocks()
    cacheServiceInstance = cacheService
    retryServiceInstance = retryService
    previewServiceInstance = previewService
    contentValidationServiceInstance = contentValidationService
  })

  describe('CacheService', () => {
    it('should store and retrieve data', async () => {
      const testData = { test: 'value' }
      
      await cacheServiceInstance.set('test-key', testData, 3600)
      const result = await cacheServiceInstance.get('test-key')
      
      expect(result).toEqual(testData)
    })

    it('should handle chunk operations', async () => {
      const testData = new Uint8Array([1, 2, 3, 4, 5])
      const chunkId = 'test-chunk'
      
      await cacheServiceInstance.storeChunk(chunkId, testData)
      const result = await cacheServiceInstance.getChunk(chunkId)
      
      expect(result).toEqual(testData)
    })
  })

  describe('RetryService', () => {
    it('should execute operation successfully', async () => {
      const mockOperation = vi.fn().mockResolvedValue('success')
      
      const result = await retryServiceInstance.executeWithRetry(mockOperation, {
        maxRetries: 3,
        baseDelay: 10
      })
      
      expect(result.success).toBe(true)
      expect(result.result).toBe('success')
    })

    it('should retry failed operations', async () => {
      let attempts = 0
      const mockOperation = vi.fn().mockImplementation(() => {
        attempts++
        if (attempts < 3) {
          const error = new Error('NetworkError: Connection failed')
          error.name = 'NetworkError'
          throw error
        }
        return Promise.resolve('success')
      })
      
      const result = await retryServiceInstance.executeWithRetry(mockOperation, {
        maxRetries: 3,
        baseDelay: 10,
        retryCondition: () => true // Forçar retry para todos os erros no teste
      })
      
      expect(result.success).toBe(true)
      expect(result.result).toBe('success')
      expect(attempts).toBe(3)
    })
  })

  describe('PreviewService', () => {
    it('should generate preview', async () => {
      const mockFile = new File(['test'], 'test.pptx', { type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' })
      
      const preview = await previewServiceInstance.generateRealTimePreview('test-preview-id', mockFile)
      
      expect(preview).toBeDefined()
    })
  })

  describe('ContentValidationService', () => {
    it('should validate content', async () => {
      const mockFile = new File(['test'], 'test.pptx', { type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' })
      
      const validation = await contentValidationServiceInstance.validateContent(mockFile)
      
      expect(validation).toBeDefined()
    })
  })

  describe('Integration Tests', () => {
    it('should handle complete upload workflow', async () => {
      const mockFile = new File(['test'], 'test.pptx', { type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' })
      
      // Test cache
      await cacheServiceInstance.set('file-metadata', { name: mockFile.name, size: mockFile.size }, 3600)
      const metadata = await cacheServiceInstance.get('file-metadata')
      
      // Test validation
      const validation = await contentValidationServiceInstance.validateContent(mockFile)
      
      // Test preview
      const preview = await previewServiceInstance.generateRealTimePreview('test-file-id', mockFile)
      
      expect(metadata).toBeDefined()
      expect(validation).toBeDefined()
      expect(preview).toBeDefined()
    })
  })
})