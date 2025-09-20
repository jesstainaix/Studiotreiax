import { describe, it, expect, beforeEach, vi } from 'vitest'
import { cacheService } from '../../services/cache.service'
import { retryService } from '../../services/retry.service'

describe('Simple Service Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('CacheService', () => {
    it('should set and get data', async () => {
      const testData = { test: 'value' }
      
      await cacheService.set('test-key', testData, 3600)
      const result = await cacheService.get('test-key')
      
      console.log('Set data:', testData)
      console.log('Retrieved data:', result)
      
      expect(result).toEqual(testData)
    })

    it('should return null for non-existent key', async () => {
      const result = await cacheService.get('non-existent')
      
      console.log('Non-existent result:', result)
      
      expect(result).toBeNull()
    })
  })

  describe('RetryService', () => {
    it('should execute operation successfully', async () => {
      const mockOperation = vi.fn().mockResolvedValue('success')
      
      const result = await retryService.executeWithRetry(mockOperation, {
        maxRetries: 3,
        baseDelay: 100
      })
      
      console.log('Retry result:', result)
      
      expect(result.success).toBe(true)
      expect(result.result).toBe('success')
    })
  })
})