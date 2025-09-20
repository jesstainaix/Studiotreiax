import { useState, useCallback, useRef, useEffect } from 'react';
import { fallbackTTSService, FallbackTTSResponse } from '../services/fallback-tts-service';
import { EnhancedTTSOptions } from '../services/enhanced-tts-service';

export interface UseFallbackTTSState {
  isLoading: boolean;
  isPlaying: boolean;
  error: string | null;
  lastResponse: FallbackTTSResponse | null;
  currentAudio: HTMLAudioElement | null;
}

export interface UseFallbackTTSActions {
  synthesize: (text: string, options?: EnhancedTTSOptions) => Promise<FallbackTTSResponse | null>;
  play: (audioUrl: string) => Promise<void>;
  pause: () => void;
  stop: () => void;
  clearError: () => void;
  getStats: () => ReturnType<typeof fallbackTTSService.getStats>;
  healthCheck: () => Promise<{ [provider: string]: boolean }>;
}

export interface UseFallbackTTSReturn extends UseFallbackTTSState, UseFallbackTTSActions {}

/**
 * Hook para usar o serviço TTS com fallback automático
 */
export function useFallbackTTS(): UseFallbackTTSReturn {
  const [state, setState] = useState<UseFallbackTTSState>({
    isLoading: false,
    isPlaying: false,
    error: null,
    lastResponse: null,
    currentAudio: null
  });
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  /**
   * Sintetizar texto com fallback automático
   */
  const synthesize = useCallback(async (
    text: string, 
    options: EnhancedTTSOptions = {}
  ): Promise<FallbackTTSResponse | null> => {
    if (!text.trim()) {
      setState(prev => ({ ...prev, error: 'Texto não pode estar vazio' }));
      return null;
    }

    setState(prev => ({ 
      ...prev, 
      isLoading: true, 
      error: null 
    }));

    try {
      
      const response = await fallbackTTSService.synthesize(text, options);
      
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        lastResponse: response,
        error: response.success ? null : response.error || 'Erro desconhecido'
      }));

      if (response.success) {
      } else {
        console.error('❌ Falha na síntese TTS:', response.error);
      }

      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      console.error('🚨 Erro crítico na síntese TTS:', error);
      
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: errorMessage 
      }));
      
      return null;
    }
  }, []);

  /**
   * Reproduzir áudio
   */
  const play = useCallback(async (audioUrl: string): Promise<void> => {
    try {
      // Parar áudio atual se estiver tocando
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }

      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      
      setState(prev => ({ 
        ...prev, 
        currentAudio: audio, 
        isPlaying: true, 
        error: null 
      }));

      // Event listeners
      audio.addEventListener('ended', () => {
        setState(prev => ({ ...prev, isPlaying: false }));
        audioRef.current = null;
      });

      audio.addEventListener('error', (e) => {
        console.error('Erro ao reproduzir áudio:', e);
        setState(prev => ({ 
          ...prev, 
          isPlaying: false, 
          error: 'Erro ao reproduzir áudio' 
        }));
        audioRef.current = null;
      });

      await audio.play();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao reproduzir áudio';
      console.error('Erro ao reproduzir áudio:', error);
      
      setState(prev => ({ 
        ...prev, 
        isPlaying: false, 
        error: errorMessage 
      }));
    }
  }, []);

  /**
   * Pausar áudio
   */
  const pause = useCallback(() => {
    if (audioRef.current && !audioRef.current.paused) {
      audioRef.current.pause();
      setState(prev => ({ ...prev, isPlaying: false }));
    }
  }, []);

  /**
   * Parar áudio
   */
  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
      setState(prev => ({ 
        ...prev, 
        isPlaying: false, 
        currentAudio: null 
      }));
    }
  }, []);

  /**
   * Limpar erro
   */
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  /**
   * Obter estatísticas do serviço
   */
  const getStats = useCallback(() => {
    return fallbackTTSService.getStats();
  }, []);

  /**
   * Verificar saúde dos provedores
   */
  const healthCheck = useCallback(async () => {
    const results = await fallbackTTSService.healthCheck();
    return results;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  return {
    // State
    isLoading: state.isLoading,
    isPlaying: state.isPlaying,
    error: state.error,
    lastResponse: state.lastResponse,
    currentAudio: state.currentAudio,
    
    // Actions
    synthesize,
    play,
    pause,
    stop,
    clearError,
    getStats,
    healthCheck
  };
}

/**
 * Hook simplificado para síntese e reprodução automática
 */
export function useSimpleTTS() {
  const tts = useFallbackTTS();
  
  const speak = useCallback(async (
    text: string, 
    options: EnhancedTTSOptions = {}
  ): Promise<boolean> => {
    try {
      const response = await tts.synthesize(text, options);
      
      if (response?.success && response.audioUrl) {
        await tts.play(response.audioUrl);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Erro no useSimpleTTS:', error);
      return false;
    }
  }, [tts]);
  
  return {
    speak,
    isLoading: tts.isLoading,
    isPlaying: tts.isPlaying,
    error: tts.error,
    stop: tts.stop,
    clearError: tts.clearError
  };
}