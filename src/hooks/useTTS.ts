import { useState, useRef, useEffect, useCallback } from 'react'
import ttsService, { TTSRequest, TTSResponse, TTSVoice as ServiceTTSVoice } from '@/services/ttsService'

// Hook options
interface UseTTSOptions {
  autoInitialize?: boolean
  defaultProvider?: string
  cacheEnabled?: boolean
}

// Public state surface for consumers (TTSPanel, TTSTestComponent)
export interface UseTTSState {
  isInitialized: boolean
  isGenerating: boolean
  isPlaying: boolean
  isPaused: boolean
  progress: number
  error: string | null
  lastResponse: TTSResponse | null
  currentAudio: HTMLAudioElement | null
}

// Hook implementation
const useTTSHook = (options?: UseTTSOptions) => {
  const [isInitialized, setIsInitialized] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [lastResponse, setLastResponse] = useState<TTSResponse | null>(null)

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const durationRef = useRef<number>(0)
  const progressTimerRef = useRef<number | null>(null)
  // Track last object URL to safely revoke when replaced/unmounted
  const lastObjectUrlRef = useRef<string | null>(null)

  // Attach listeners to current audio element
  const attachAudioEvents = useCallback((audio: HTMLAudioElement) => {
    audio.onloadedmetadata = () => {
      durationRef.current = audio.duration || 0
    }

    audio.ontimeupdate = () => {
      if (!isNaN(durationRef.current) && durationRef.current > 0) {
        const pct = (audio.currentTime / durationRef.current) * 100
        setProgress(Math.max(0, Math.min(100, pct)))
      }
    }

    audio.onplay = () => {
      setIsPlaying(true)
      setIsPaused(false)
    }

    audio.onpause = () => {
      setIsPaused(true)
      setIsPlaying(false)
    }

    audio.onended = () => {
      setIsPlaying(false)
      setIsPaused(false)
      setProgress(100)
    }

    audio.onerror = () => {
      setError('Falha ao reproduzir o áudio')
      setIsPlaying(false)
      setIsPaused(false)
    }
  }, [])

  const initializeTTS = useCallback(() => {
    try {
      if (!audioRef.current) {
        audioRef.current = new Audio()
        attachAudioEvents(audioRef.current)
      }
      setIsInitialized(true)
    } catch (e: any) {
      setError(e?.message || 'Falha ao inicializar TTS')
      setIsInitialized(false)
    }
  }, [attachAudioEvents])

  // Auto initialize if requested
  useEffect(() => {
    if (options?.autoInitialize) {
      initializeTTS()
    }
    return () => {
      // cleanup
      if (progressTimerRef.current) {
        window.clearInterval(progressTimerRef.current)
        progressTimerRef.current = null
      }
      if (audioRef.current) {
        try { audioRef.current.pause() } catch {}
        audioRef.current.src = ''
      }
      // Revoke last object URL if any
      const last = lastObjectUrlRef.current
      if (last && last.startsWith('blob:')) {
        try { URL.revokeObjectURL(last) } catch {}
      }
      lastObjectUrlRef.current = null
    }
  }, [options?.autoInitialize, initializeTTS])

  // Helper to safely set audio src and manage object URL lifecycle
  const setAudioSrc = useCallback((src: string) => {
    if (!audioRef.current) {
      audioRef.current = new Audio()
      attachAudioEvents(audioRef.current)
    }
    // Revoke previous blob URL if different
    const prev = audioRef.current.src
    if (prev && prev !== src && prev.startsWith('blob:')) {
      try { URL.revokeObjectURL(prev) } catch {}
    }
    audioRef.current.src = src
    // Track if new src is an object URL
    if (src.startsWith('blob:')) {
      lastObjectUrlRef.current = src
    } else {
      lastObjectUrlRef.current = null
    }
  }, [attachAudioEvents])

  // Public API: Synthesize speech via service
  const synthesizeSpeech = useCallback(async (request: TTSRequest): Promise<TTSResponse> => {
    setError(null)
    setIsGenerating(true)
    setProgress(0)
    try {
      const response = await ttsService.synthesizeSpeech({
        text: request.text,
        voice: request.voice,
        provider: request.provider,
        language: request.language || 'pt-BR',
        speed: request.speed,
        pitch: request.pitch,
        volume: request.volume,
        format: request.format,
        ssml: request.ssml,
        emotions: request.emotions
      })

      setLastResponse(response)

      // If audioUrl returned, preload into the audio element for immediate playback
      if (response.success && response.audioUrl) {
        setAudioSrc(response.audioUrl)
        // Prime the duration
        try { await audioRef.current?.load?.() } catch {}
        // If metadata is ready, set initial duration progress baseline
        if (audioRef.current && !isNaN(audioRef.current.duration)) {
          durationRef.current = audioRef.current.duration
        }
      }

      return response
    } catch (e: any) {
      const msg = e?.message || 'Erro ao sintetizar áudio'
      setError(msg)
      return { success: false, error: msg }
    } finally {
      setIsGenerating(false)
    }
  }, [setAudioSrc])

  // Playback controls
  const playAudio = useCallback(async (audioUrl?: string) => {
    try {
      if (audioUrl) {
        setAudioSrc(audioUrl)
      } else if (!audioRef.current?.src && lastResponse?.audioUrl) {
        setAudioSrc(lastResponse.audioUrl)
      }
      if (!audioRef.current?.src) {
        setError('Nenhum áudio disponível para reproduzir')
        return
      }
      await audioRef.current!.play()
    } catch (e: any) {
      console.error('Erro ao reproduzir áudio:', e)
      setError(e?.message || 'Não foi possível iniciar a reprodução')
      // Tentar novamente após um pequeno delay
      setTimeout(async () => {
        try {
          if (audioRef.current?.src) {
            await audioRef.current.play()
          }
        } catch (retryError) {
          console.error('Falha na segunda tentativa de reprodução:', retryError)
        }
      }, 100)
    }
  }, [setAudioSrc, lastResponse])

  const pauseAudio = useCallback(() => {
    try {
      if (audioRef.current && !audioRef.current.paused) {
        audioRef.current.pause()
      }
    } catch (e: any) {
      setError(e?.message || 'Falha ao pausar')
    }
  }, [])

  const resumeAudio = useCallback(async () => {
    try {
      if (audioRef.current && audioRef.current.paused) {
        await audioRef.current.play()
      }
    } catch (e: any) {
      console.error('Erro ao retomar áudio:', e)
      setError(e?.message || 'Falha ao retomar')
    }
  }, [])

  const stopAudio = useCallback(() => {
    try {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.currentTime = 0
        setIsPlaying(false)
        setIsPaused(false)
        setProgress(0)
      }
    } catch (e: any) {
      setError(e?.message || 'Falha ao parar')
    }
  }, [])

  // Provider/Voices accessors (proxy to service)
  const getAvailableProviders = useCallback((): string[] => {
    try { return ttsService.getAvailableProviders() } catch { return [] }
  }, [])

  const isProviderAvailable = useCallback((providerId: string): boolean => {
    try { return ttsService.isProviderAvailable(providerId) } catch { return false }
  }, [])

  const getVoicesForProvider = useCallback((provider: string): ServiceTTSVoice[] => {
    try { return ttsService.getVoicesForProvider(provider) } catch { return [] }
  }, [])

  const getAllVoices = useCallback((): ServiceTTSVoice[] => {
    try { return ttsService.getAllVoices() } catch { return [] }
  }, [])

  // Error helpers
  const clearError = useCallback(() => setError(null), [])

  const reset = useCallback(() => {
    try {
      stopAudio()
      setIsGenerating(false)
      setProgress(0)
      setError(null)
      setLastResponse(null)
      // Revoke current object URL if any
      const last = lastObjectUrlRef.current
      if (last && last.startsWith('blob:')) {
        try { URL.revokeObjectURL(last) } catch {}
      }
      lastObjectUrlRef.current = null
      if (audioRef.current) {
        audioRef.current.src = ''
      }
    } catch {}
  }, [stopAudio])

  return {
    // state
    isInitialized,
    isGenerating,
    isPlaying,
    isPaused,
    progress,
    error,
    lastResponse,
    currentAudio: audioRef.current,
    // lifecycle
    initializeTTS,
    // core
    synthesizeSpeech,
    playAudio,
    pauseAudio,
    resumeAudio,
    stopAudio,
    // providers/voices
    getAvailableProviders,
    isProviderAvailable,
    getVoicesForProvider,
    getAllVoices,
    // utils
    clearError,
    reset
  }
}

export default useTTSHook
export { useTTSHook as useTTS }