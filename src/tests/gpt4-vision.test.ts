import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GPT4VisionService } from '../services/gpt4-vision-service'

// Mock do OpenAI
vi.mock('openai', () => ({
  OpenAI: vi.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: vi.fn().mockResolvedValue({
          choices: [{
            message: {
              content: JSON.stringify({
                detectedNRs: [{
                  nr: 'NR-06',
                  title: 'Equipamento de Proteção Individual',
                  confidence: 85,
                  relevantSlides: [1, 2],
                  keyTopics: ['EPI', 'segurança'],
                  suggestedTemplates: ['epi-template'],
                  riskLevel: 'medium',
                  reasoning: 'Detectado uso de EPIs'
                }],
                recommendations: ['Usar EPIs adequados']
              })
            }
          }],
          usage: { total_tokens: 150 }
        })
      }
    }
  }))
}))

describe('GPT-4 Vision Service', () => {
  let service: any
  
  beforeEach(() => {
    vi.clearAllMocks()
    // Usar any para evitar problemas de tipo durante o teste
    service = new (GPT4VisionService as any)('test-api-key')
  })

  it('should initialize service correctly', () => {
    expect(service).toBeDefined()
    expect(service.openai).toBeDefined()
  })

  it('should analyze PPTX with vision', async () => {
    const mockSlideContents = [
      {
        slideNumber: 1,
        text: 'Segurança do Trabalho - EPI',
        imageBase64: 'data:image/jpeg;base64,test',
        elements: {
          titles: ['Segurança do Trabalho'],
          bulletPoints: ['Usar capacete', 'Usar luvas'],
          images: ['epi.jpg'],
          tables: []
        }
      }
    ]

    const result = await service.analyzePPTXWithVision(
      mockSlideContents,
      'test-presentation.pptx'
    )

    expect(result).toBeDefined()
    expect(result.fileName).toBe('test-presentation.pptx')
    expect(result.totalSlides).toBe(1)
    expect(result.detectedNRs).toBeDefined()
    expect(Array.isArray(result.detectedNRs)).toBe(true)
    expect(result.overallCompliance).toBeDefined()
    expect(result.processingTime).toBeDefined()
    expect(result.recommendations).toBeDefined()
  })

  it('should handle empty slide contents', async () => {
    const result = await service.analyzePPTXWithVision(
      [],
      'empty-presentation.pptx'
    )

    expect(result).toBeDefined()
    expect(result.fileName).toBe('empty-presentation.pptx')
    expect(result.totalSlides).toBe(0)
  })

  it('should calculate overall compliance correctly', () => {
    const mockDetectedNRs = [
      { confidence: 80, riskLevel: 'medium' },
      { confidence: 90, riskLevel: 'high' },
      { confidence: 70, riskLevel: 'low' }
    ]

    const compliance = service.calculateOverallCompliance(mockDetectedNRs)
    
    expect(compliance).toBeDefined()
    expect(typeof compliance).toBe('number')
    expect(compliance).toBeGreaterThanOrEqual(0)
    expect(compliance).toBeLessThanOrEqual(100)
  })

  it('should handle API errors gracefully', async () => {
    // Mock error response
    service.openai.chat.completions.create.mockRejectedValueOnce(
      new Error('API Error')
    )

    const mockSlideContents = [{
      slideNumber: 1,
      text: 'Test content',
      elements: { titles: [], bulletPoints: [], images: [], tables: [] }
    }]

    await expect(
      service.analyzePPTXWithVision(mockSlideContents, 'test.pptx')
    ).rejects.toThrow('API Error')
  })

  it('should process progress callback', async () => {
    const progressCallback = vi.fn()
    
    const mockSlideContents = [{
      slideNumber: 1,
      text: 'Test content',
      elements: { titles: [], bulletPoints: [], images: [], tables: [] }
    }]

    await service.analyzePPTXWithVision(
      mockSlideContents,
      'test.pptx',
      progressCallback
    )

    expect(progressCallback).toHaveBeenCalled()
    expect(progressCallback).toHaveBeenCalledWith(
      expect.any(Number),
      expect.any(String)
    )
  })
})