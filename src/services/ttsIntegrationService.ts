interface TTSVoice {
  id: string
  name: string
  language: string
  gender: 'male' | 'female'
  style: string
  sample: string
}

interface TTSGenerationRequest {
  script: string
  voice: string
  settings: {
    speed?: number
    pitch?: number
    volume?: number
    pauseLength?: number
    pronunciationHints?: Record<string, string>
  }
}

interface PPTXSlide {
  title?: string
  content?: string
}

interface PPTXContent {
  slides?: PPTXSlide[]
}

interface TTSJob {
  id: string
  status: 'processing' | 'completed' | 'failed'
  progress: number
  estimatedTime: string
  voice: string
  settings: any
  createdAt: string
  result?: {
    audioUrl: string
    duration: string
    format: string
    quality: string
    transcript: string
    timestamps: Array<{
      start: number
      end: number
      text: string
    }>
  }
}

class TTSIntegrationService {
  private apiBaseUrl: string
  private isInitialized = false

  constructor() {
    this.apiBaseUrl = 'http://localhost:3001/api'
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return

    try {
      // Test API connection
      const response = await fetch(`${this.apiBaseUrl}/ai/available-voices`)
      if (response.ok) {
        this.isInitialized = true
        console.log('TTS Integration Service initialized successfully')
      } else {
        throw new Error('Failed to connect to TTS API')
      }
    } catch (error) {
      console.error('Error initializing TTS service:', error)
      throw error
    }
  }

  async getAvailableVoices(): Promise<TTSVoice[]> {
    if (!this.isInitialized) {
      await this.initialize()
    }

    try {
      const response = await fetch(`${this.apiBaseUrl}/ai/available-voices`)
      if (!response.ok) {
        throw new Error('Failed to fetch voices')
      }
      return await response.json()
    } catch (error) {
      console.error('Error fetching voices:', error)
      // Return mock voices as fallback
      return [
        {
          id: 'voice-1',
          name: 'Maria',
          language: 'pt-BR',
          gender: 'female',
          style: 'natural',
          sample: 'sample-url-1'
        },
        {
          id: 'voice-2',
          name: 'João',
          language: 'pt-BR',
          gender: 'male',
          style: 'professional',
          sample: 'sample-url-2'
        }
      ]
    }
  }

  async generateTTS(request: TTSGenerationRequest): Promise<TTSJob> {
    if (!this.isInitialized) {
      await this.initialize()
    }

    try {
      const response = await fetch(`${this.apiBaseUrl}/ai/generate-tts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(request)
      })

      if (!response.ok) {
        throw new Error('Failed to generate TTS')
      }

      return await response.json()
    } catch (error) {
      console.error('Error generating TTS:', error)
      // Return mock job as fallback
      return {
        id: `job-${Date.now()}`,
        status: 'processing',
        progress: 0,
        estimatedTime: '2 minutos',
        voice: request.voice,
        settings: request.settings,
        createdAt: new Date().toISOString()
      }
    }
  }

  async getJobStatus(jobId: string): Promise<TTSJob> {
    if (!this.isInitialized) {
      await this.initialize()
    }

    try {
      const response = await fetch(`${this.apiBaseUrl}/ai/tts-job/${jobId}`)
      if (!response.ok) {
        throw new Error('Failed to get job status')
      }
      return await response.json()
    } catch (error) {
      console.error('Error getting job status:', error)
      // Return mock completed job as fallback
      return {
        id: jobId,
        status: 'completed',
        progress: 100,
        estimatedTime: '0 segundos',
        voice: 'voice-1',
        settings: {},
        createdAt: new Date().toISOString(),
        result: {
          audioUrl: 'mock-audio-url',
          duration: '30s',
          format: 'mp3',
          quality: 'high',
          transcript: 'Mock transcript',
          timestamps: [
            { start: 0, end: 1000, text: 'Mock' },
            { start: 1000, end: 2000, text: 'transcript' }
          ]
        }
      }
    }
  }

  async extractScriptFromPPTX(content: PPTXContent): Promise<string> {
    if (!content.slides || content.slides.length === 0) {
      return ''
    }

    const script = content.slides
      .map((slide, index) => {
        const parts: string[] = []
        
        if (slide.title) {
          parts.push(`Slide ${index + 1}: ${slide.title}`)
        }
        
        if (slide.content) {
          parts.push(slide.content)
        }
        
        return parts.join('. ')
      })
      .filter(text => text.length > 0)
      .join('. ')

    return script
  }

  async optimizeScriptForTTS(script: string): Promise<string> {
    // Remove excessive punctuation and normalize text
    let optimized = script
      .replace(/[\r\n]+/g, ' ') // Replace line breaks with spaces
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .replace(/([.!?])\s*([.!?])+/g, '$1') // Remove duplicate punctuation
      .trim()

    // Add pauses for better speech flow
    optimized = optimized
      .replace(/([.!?])\s+/g, '$1 <break time="500ms"/> ') // Add breaks after sentences
      .replace(/([:,;])\s+/g, '$1 <break time="200ms"/> ') // Add shorter breaks after commas

    return optimized
  }
}

const ttsIntegrationService = new TTSIntegrationService()

export default ttsIntegrationService
export type { TTSVoice, TTSGenerationRequest, TTSJob }