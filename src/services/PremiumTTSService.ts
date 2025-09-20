import { toast } from 'sonner'

export interface BrazilianVoice {
  id: string
  name: string
  gender: 'male' | 'female' | 'neutral'
  age: 'young' | 'adult' | 'senior'
  accent: 'paulista' | 'carioca' | 'mineiro' | 'gaucho' | 'nordestino' | 'neutral'
  emotion: 'neutral' | 'happy' | 'sad' | 'angry' | 'excited' | 'calm'
  provider: string
  quality: 'standard' | 'premium' | 'ultra'
  description: string
  sampleUrl?: string
}

export interface PremiumTTSConfig {
  providers: {
    elevenlabs?: {
      apiKey: string
      model: string
      stability: number
      similarityBoost: number
      style: number
      useSpeakerBoost: boolean
    }
    azure?: {
      apiKey: string
      region: string
      endpoint?: string
    }
    google?: {
      apiKey: string
      projectId: string
    }
    aws?: {
      accessKeyId: string
      secretAccessKey: string
      region: string
    }
    openai?: {
      apiKey: string
      model: string
    }
  }
  realTimeEnabled: boolean
  streamingEnabled: boolean
  cacheEnabled: boolean
  maxCacheSize: number
  fallbackChain: string[]
  qualityPreference: 'speed' | 'quality' | 'balanced'
  brazilianVoicesOnly: boolean
}

export interface PremiumTTSOptions {
  voice?: string
  language?: string
  speed?: number
  pitch?: number
  volume?: number
  emotion?: string
  style?: string
  accent?: string
  emphasis?: string[]
  pauses?: { [key: number]: number }
  pronunciation?: { [key: string]: string }
  ssmlEnabled?: boolean
  realTime?: boolean
  streaming?: boolean
  quality?: 'standard' | 'premium' | 'ultra'
  outputFormat?: 'mp3' | 'wav' | 'ogg' | 'aac'
  sampleRate?: number
  bitRate?: number
  effects?: {
    reverb?: number
    echo?: number
    chorus?: number
    compressor?: boolean
    normalizer?: boolean
  }
}

export interface PremiumTTSResponse {
  success: boolean
  audioUrl?: string
  audioBuffer?: ArrayBuffer
  duration?: number
  provider?: string
  voice?: BrazilianVoice
  quality?: string
  cached?: boolean
  streamId?: string
  error?: string
  metadata?: {
    textLength: number
    processingTime: number
    audioSize: number
    compressionRatio: number
  }
}

export interface StreamingTTSResponse {
  streamId: string
  chunks: ArrayBuffer[]
  isComplete: boolean
  totalDuration: number
  currentPosition: number
}

export class PremiumTTSService {
  private config: PremiumTTSConfig
  private cache: Map<string, PremiumTTSResponse> = new Map()
  private streamingConnections: Map<string, WebSocket> = new Map()
  private brazilianVoices: BrazilianVoice[] = []
  private isInitialized = false

  constructor(config: PremiumTTSConfig) {
    this.config = config
    this.initializeBrazilianVoices()
  }

  private initializeBrazilianVoices(): void {
    this.brazilianVoices = [
      // ElevenLabs Brazilian Voices
      {
        id: 'br-elevenlabs-maria',
        name: 'Maria Fernanda',
        gender: 'female',
        age: 'adult',
        accent: 'paulista',
        emotion: 'neutral',
        provider: 'elevenlabs',
        quality: 'ultra',
        description: 'Voz feminina profissional com sotaque paulista'
      },
      {
        id: 'br-elevenlabs-joao',
        name: 'João Carlos',
        gender: 'male',
        age: 'adult',
        accent: 'carioca',
        emotion: 'neutral',
        provider: 'elevenlabs',
        quality: 'ultra',
        description: 'Voz masculina carismática com sotaque carioca'
      },
      {
        id: 'br-elevenlabs-ana',
        name: 'Ana Beatriz',
        gender: 'female',
        age: 'young',
        accent: 'mineiro',
        emotion: 'happy',
        provider: 'elevenlabs',
        quality: 'ultra',
        description: 'Voz jovem e alegre com sotaque mineiro'
      },
      // Azure Brazilian Voices
      {
        id: 'pt-BR-FranciscaNeural',
        name: 'Francisca',
        gender: 'female',
        age: 'adult',
        accent: 'neutral',
        emotion: 'neutral',
        provider: 'azure',
        quality: 'premium',
        description: 'Voz neural feminina padrão brasileira'
      },
      {
        id: 'pt-BR-AntonioNeural',
        name: 'Antonio',
        gender: 'male',
        age: 'adult',
        accent: 'neutral',
        emotion: 'neutral',
        provider: 'azure',
        quality: 'premium',
        description: 'Voz neural masculina padrão brasileira'
      },
      {
        id: 'pt-BR-BrendaNeural',
        name: 'Brenda',
        gender: 'female',
        age: 'young',
        accent: 'paulista',
        emotion: 'excited',
        provider: 'azure',
        quality: 'premium',
        description: 'Voz jovem e animada'
      },
      {
        id: 'pt-BR-DonatoNeural',
        name: 'Donato',
        gender: 'male',
        age: 'senior',
        accent: 'gaucho',
        emotion: 'calm',
        provider: 'azure',
        quality: 'premium',
        description: 'Voz madura e calma com sotaque gaúcho'
      },
      // Google Brazilian Voices
      {
        id: 'pt-BR-Wavenet-A',
        name: 'Camila',
        gender: 'female',
        age: 'adult',
        accent: 'neutral',
        emotion: 'neutral',
        provider: 'google',
        quality: 'premium',
        description: 'Voz Wavenet feminina de alta qualidade'
      },
      {
        id: 'pt-BR-Wavenet-B',
        name: 'Ricardo',
        gender: 'male',
        age: 'adult',
        accent: 'neutral',
        emotion: 'neutral',
        provider: 'google',
        quality: 'premium',
        description: 'Voz Wavenet masculina de alta qualidade'
      },
      {
        id: 'pt-BR-Neural2-A',
        name: 'Isabela',
        gender: 'female',
        age: 'young',
        accent: 'nordestino',
        emotion: 'happy',
        provider: 'google',
        quality: 'ultra',
        description: 'Voz neural jovem com sotaque nordestino'
      }
    ]
  }

  async initialize(): Promise<boolean> {
    try {
      // Verificar configurações dos providers
      const healthChecks = await Promise.allSettled([
        this.checkElevenLabsHealth(),
        this.checkAzureHealth(),
        this.checkGoogleHealth(),
        this.checkAWSHealth(),
        this.checkOpenAIHealth()
      ])

      const availableProviders = healthChecks.filter(result => result.status === 'fulfilled').length
      
      if (availableProviders === 0) {
        throw new Error('Nenhum provider TTS configurado corretamente')
      }

      this.isInitialized = true
      toast.success(`Sistema TTS Premium inicializado com ${availableProviders} providers`)
      return true
    } catch (error) {
      console.error('Falha na inicialização do TTS Premium:', error)
      toast.error('Falha na inicialização do sistema TTS')
      return false
    }
  }

  async synthesize(
    text: string,
    options: PremiumTTSOptions = {}
  ): Promise<PremiumTTSResponse> {
    if (!this.isInitialized) {
      throw new Error('Serviço TTS não inicializado')
    }

    const startTime = Date.now()
    const cacheKey = this.generateCacheKey(text, options)

    // Verificar cache
    if (this.config.cacheEnabled && this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey)!
      return { ...cached, cached: true }
    }

    try {
      // Selecionar voz brasileira se especificado
      const voice = this.selectBrazilianVoice(options)
      
      // Processar texto com SSML se habilitado
      const processedText = options.ssmlEnabled ? this.generateSSML(text, options) : text
      
      // Tentar síntese com fallback chain
      let result: PremiumTTSResponse
      
      if (options.realTime && this.config.realTimeEnabled) {
        result = await this.synthesizeRealTime(processedText, voice, options)
      } else if (options.streaming && this.config.streamingEnabled) {
        result = await this.synthesizeStreaming(processedText, voice, options)
      } else {
        result = await this.synthesizeStandard(processedText, voice, options)
      }

      // Aplicar efeitos de áudio se especificado
      if (options.effects) {
        result = await this.applyAudioEffects(result, options.effects)
      }

      // Calcular metadata
      const processingTime = Date.now() - startTime
      result.metadata = {
        textLength: text.length,
        processingTime,
        audioSize: result.audioBuffer?.byteLength || 0,
        compressionRatio: text.length / (result.audioBuffer?.byteLength || 1)
      }

      // Armazenar no cache
      if (this.config.cacheEnabled && result.success) {
        this.addToCache(cacheKey, result)
      }

      return result
    } catch (error) {
      console.error('Erro na síntese TTS:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }
    }
  }

  private selectBrazilianVoice(options: PremiumTTSOptions): BrazilianVoice {
    let availableVoices = this.brazilianVoices

    // Filtrar por provider se especificado
    if (options.voice) {
      const specificVoice = availableVoices.find(v => v.id === options.voice)
      if (specificVoice) return specificVoice
    }

    // Filtrar por critérios
    if (options.accent) {
      availableVoices = availableVoices.filter(v => v.accent === options.accent)
    }

    if (options.emotion) {
      availableVoices = availableVoices.filter(v => v.emotion === options.emotion)
    }

    if (options.quality) {
      availableVoices = availableVoices.filter(v => v.quality === options.quality)
    }

    // Selecionar melhor voz disponível
    const qualityOrder = ['ultra', 'premium', 'standard']
    for (const quality of qualityOrder) {
      const voicesByQuality = availableVoices.filter(v => v.quality === quality)
      if (voicesByQuality.length > 0) {
        return voicesByQuality[0]
      }
    }

    // Fallback para primeira voz disponível
    return this.brazilianVoices[0]
  }

  private generateSSML(text: string, options: PremiumTTSOptions): string {
    let ssml = `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="pt-BR">`
    
    // Adicionar configurações de prosódia
    ssml += `<prosody`
    if (options.speed) ssml += ` rate="${options.speed * 100}%"`
    if (options.pitch) ssml += ` pitch="${options.pitch > 0 ? '+' : ''}${options.pitch * 50}%"`
    if (options.volume) ssml += ` volume="${options.volume * 100}%"`
    ssml += `>`

    // Adicionar ênfases
    let processedText = text
    if (options.emphasis) {
      options.emphasis.forEach(word => {
        processedText = processedText.replace(
          new RegExp(`\\b${word}\\b`, 'gi'),
          `<emphasis level="strong">${word}</emphasis>`
        )
      })
    }

    // Adicionar pausas
    if (options.pauses) {
      Object.entries(options.pauses).forEach(([position, duration]) => {
        const pos = parseInt(position)
        processedText = processedText.slice(0, pos) + 
          `<break time="${duration}ms"/>` + 
          processedText.slice(pos)
      })
    }

    // Adicionar pronunciações customizadas
    if (options.pronunciation) {
      Object.entries(options.pronunciation).forEach(([word, pronunciation]) => {
        processedText = processedText.replace(
          new RegExp(`\\b${word}\\b`, 'gi'),
          `<phoneme alphabet="ipa" ph="${pronunciation}">${word}</phoneme>`
        )
      })
    }

    ssml += processedText
    ssml += `</prosody></speak>`
    
    return ssml
  }

  private async synthesizeStandard(
    text: string,
    voice: BrazilianVoice,
    options: PremiumTTSOptions
  ): Promise<PremiumTTSResponse> {
    const providers = this.config.fallbackChain.filter(p => 
      this.config.providers[p as keyof typeof this.config.providers]
    )

    for (const provider of providers) {
      try {
        switch (provider) {
          case 'elevenlabs':
            return await this.synthesizeWithElevenLabs(text, voice, options)
          case 'azure':
            return await this.synthesizeWithAzure(text, voice, options)
          case 'google':
            return await this.synthesizeWithGoogle(text, voice, options)
          case 'aws':
            return await this.synthesizeWithAWS(text, voice, options)
          case 'openai':
            return await this.synthesizeWithOpenAI(text, voice, options)
        }
      } catch (error) {
        console.warn(`Provider ${provider} falhou:`, error)
        continue
      }
    }

    throw new Error('Todos os providers TTS falharam')
  }

  private async synthesizeRealTime(
    text: string,
    voice: BrazilianVoice,
    options: PremiumTTSOptions
  ): Promise<PremiumTTSResponse> {
    // Implementação de síntese em tempo real
    // Para demonstração, usar provider mais rápido
    return await this.synthesizeWithAzure(text, voice, { ...options, quality: 'standard' })
  }

  private async synthesizeStreaming(
    text: string,
    voice: BrazilianVoice,
    options: PremiumTTSOptions
  ): Promise<PremiumTTSResponse> {
    // Implementação de streaming
    const streamId = `stream_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    // Para demonstração, dividir texto em chunks e processar
    const chunks = this.splitTextIntoChunks(text, 100)
    const audioChunks: ArrayBuffer[] = []
    
    for (const chunk of chunks) {
      const result = await this.synthesizeWithAzure(chunk, voice, options)
      if (result.success && result.audioBuffer) {
        audioChunks.push(result.audioBuffer)
      }
    }

    // Combinar chunks de áudio
    const combinedBuffer = this.combineAudioBuffers(audioChunks)
    const audioBlob = new Blob([combinedBuffer], { type: 'audio/mpeg' })
    const audioUrl = URL.createObjectURL(audioBlob)

    return {
      success: true,
      audioUrl,
      audioBuffer: combinedBuffer,
      provider: voice.provider,
      voice,
      streamId
    }
  }

  private async synthesizeWithElevenLabs(
    text: string,
    voice: BrazilianVoice,
    options: PremiumTTSOptions
  ): Promise<PremiumTTSResponse> {
    const config = this.config.providers.elevenlabs
    if (!config?.apiKey) {
      throw new Error('ElevenLabs não configurado')
    }

    const url = `https://api.elevenlabs.io/v1/text-to-speech/${voice.id}`
    
    const requestBody = {
      text,
      model_id: config.model || 'eleven_multilingual_v2',
      voice_settings: {
        stability: config.stability,
        similarity_boost: config.similarityBoost,
        style: config.style,
        use_speaker_boost: config.useSpeakerBoost
      }
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': config.apiKey
      },
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      throw new Error(`ElevenLabs API error: ${response.status}`)
    }

    const audioBuffer = await response.arrayBuffer()
    const audioBlob = new Blob([audioBuffer], { type: 'audio/mpeg' })
    const audioUrl = URL.createObjectURL(audioBlob)

    return {
      success: true,
      audioUrl,
      audioBuffer,
      provider: 'elevenlabs',
      voice,
      quality: 'ultra'
    }
  }

  private async synthesizeWithAzure(
    text: string,
    voice: BrazilianVoice,
    options: PremiumTTSOptions
  ): Promise<PremiumTTSResponse> {
    const config = this.config.providers.azure
    if (!config?.apiKey) {
      throw new Error('Azure não configurado')
    }

    const url = `https://${config.region}.tts.speech.microsoft.com/cognitiveservices/v1`
    
    const ssml = `
      <speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="pt-BR">
        <voice name="${voice.id}">
          <prosody rate="${(options.speed || 1) * 100}%" pitch="${options.pitch || 0}%">
            ${text}
          </prosody>
        </voice>
      </speak>
    `

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': config.apiKey,
        'Content-Type': 'application/ssml+xml',
        'X-Microsoft-OutputFormat': 'audio-16khz-128kbitrate-mono-mp3'
      },
      body: ssml
    })

    if (!response.ok) {
      throw new Error(`Azure API error: ${response.status}`)
    }

    const audioBuffer = await response.arrayBuffer()
    const audioBlob = new Blob([audioBuffer], { type: 'audio/mpeg' })
    const audioUrl = URL.createObjectURL(audioBlob)

    return {
      success: true,
      audioUrl,
      audioBuffer,
      provider: 'azure',
      voice,
      quality: 'premium'
    }
  }

  private async synthesizeWithGoogle(
    text: string,
    voice: BrazilianVoice,
    options: PremiumTTSOptions
  ): Promise<PremiumTTSResponse> {
    const config = this.config.providers.google
    if (!config?.apiKey) {
      throw new Error('Google não configurado')
    }

    const url = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${config.apiKey}`
    
    const requestBody = {
      input: { text },
      voice: {
        languageCode: 'pt-BR',
        name: voice.id
      },
      audioConfig: {
        audioEncoding: 'MP3',
        speakingRate: options.speed || 1.0,
        pitch: options.pitch || 0.0,
        volumeGainDb: (options.volume || 1) * 10
      }
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      throw new Error(`Google API error: ${response.status}`)
    }

    const data = await response.json()
    const audioBytes = atob(data.audioContent)
    const audioArray = new Uint8Array(audioBytes.length)
    
    for (let i = 0; i < audioBytes.length; i++) {
      audioArray[i] = audioBytes.charCodeAt(i)
    }
    
    const audioBuffer = audioArray.buffer as ArrayBuffer
    const audioBlob = new Blob([audioBuffer], { type: 'audio/mpeg' })
    const audioUrl = URL.createObjectURL(audioBlob)

    return {
      success: true,
      audioUrl,
      audioBuffer,
      provider: 'google',
      voice,
      quality: 'premium'
    }
  }

  private async synthesizeWithAWS(
    text: string,
    voice: BrazilianVoice,
    options: PremiumTTSOptions
  ): Promise<PremiumTTSResponse> {
    // Implementação AWS Polly
    throw new Error('AWS Polly não implementado ainda')
  }

  private async synthesizeWithOpenAI(
    text: string,
    voice: BrazilianVoice,
    options: PremiumTTSOptions
  ): Promise<PremiumTTSResponse> {
    // Implementação OpenAI TTS
    throw new Error('OpenAI TTS não implementado ainda')
  }

  private async applyAudioEffects(
    result: PremiumTTSResponse,
    effects: NonNullable<PremiumTTSOptions['effects']>
  ): Promise<PremiumTTSResponse> {
    // Implementação de efeitos de áudio seria feita aqui
    // Por enquanto, retornar resultado sem modificação
    return result
  }

  private splitTextIntoChunks(text: string, maxLength: number): string[] {
    const chunks: string[] = []
    const sentences = text.split(/[.!?]+/)
    let currentChunk = ''

    for (const sentence of sentences) {
      if (currentChunk.length + sentence.length > maxLength) {
        if (currentChunk) {
          chunks.push(currentChunk.trim())
          currentChunk = ''
        }
      }
      currentChunk += sentence + '. '
    }

    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim())
    }

    return chunks
  }

  private combineAudioBuffers(buffers: ArrayBuffer[]): ArrayBuffer {
    const totalLength = buffers.reduce((sum, buffer) => sum + buffer.byteLength, 0)
    const combined = new Uint8Array(totalLength)
    let offset = 0

    for (const buffer of buffers) {
      combined.set(new Uint8Array(buffer), offset)
      offset += buffer.byteLength
    }

    return combined.buffer
  }

  private generateCacheKey(text: string, options: PremiumTTSOptions): string {
    return `${text}_${JSON.stringify(options)}`
  }

  private addToCache(key: string, result: PremiumTTSResponse): void {
    if (this.cache.size >= this.config.maxCacheSize) {
      const firstKey = this.cache.keys().next().value
      this.cache.delete(firstKey)
    }
    this.cache.set(key, result)
  }

  // Health check methods
  private async checkElevenLabsHealth(): Promise<boolean> {
    const config = this.config.providers.elevenlabs
    if (!config?.apiKey) return false
    
    try {
      const response = await fetch('https://api.elevenlabs.io/v1/voices', {
        headers: { 'xi-api-key': config.apiKey }
      })
      return response.ok
    } catch {
      return false
    }
  }

  private async checkAzureHealth(): Promise<boolean> {
    const config = this.config.providers.azure
    return !!(config?.apiKey && config?.region)
  }

  private async checkGoogleHealth(): Promise<boolean> {
    const config = this.config.providers.google
    return !!(config?.apiKey)
  }

  private async checkAWSHealth(): Promise<boolean> {
    const config = this.config.providers.aws
    return !!(config?.accessKeyId && config?.secretAccessKey)
  }

  private async checkOpenAIHealth(): Promise<boolean> {
    const config = this.config.providers.openai
    return !!(config?.apiKey)
  }

  // Public methods
  getBrazilianVoices(): BrazilianVoice[] {
    return this.brazilianVoices
  }

  getVoicesByAccent(accent: string): BrazilianVoice[] {
    return this.brazilianVoices.filter(voice => voice.accent === accent)
  }

  getVoicesByProvider(provider: string): BrazilianVoice[] {
    return this.brazilianVoices.filter(voice => voice.provider === provider)
  }

  async previewVoice(voiceId: string, sampleText?: string): Promise<PremiumTTSResponse> {
    const text = sampleText || 'Olá! Esta é uma demonstração da minha voz.'
    const voice = this.brazilianVoices.find(v => v.id === voiceId)
    
    if (!voice) {
      throw new Error('Voz não encontrada')
    }

    return await this.synthesize(text, {
      voice: voiceId,
      quality: 'standard',
      speed: 1.0
    })
  }

  clearCache(): void {
    this.cache.clear()
  }

  getCacheStats(): { size: number; maxSize: number } {
    return {
      size: this.cache.size,
      maxSize: this.config.maxCacheSize
    }
  }

  async dispose(): Promise<void> {
    this.clearCache()
    this.streamingConnections.forEach(ws => ws.close())
    this.streamingConnections.clear()
  }
}

export default PremiumTTSService