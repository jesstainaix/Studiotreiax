import { useCallback, useEffect, useRef, useState } from 'react';
import type { VideoProcessingMessage, VideoProcessingResponse } from '../workers/videoProcessor.worker';

interface VideoWorkerState {
  isProcessing: boolean;
  progress: number;
  error: string | null;
  result: ArrayBuffer | string[] | null;
  metadata: {
    duration?: number;
    size?: number;
    format?: string;
    dimensions?: { width: number; height: number };
  } | null;
}

interface VideoWorkerOptions {
  onProgress?: (progress: number) => void;
  onComplete?: (result: ArrayBuffer | string[], metadata?: any) => void;
  onError?: (error: string) => void;
}

export const useVideoWorker = (options: VideoWorkerOptions = {}) => {
  const workerRef = useRef<Worker | null>(null);
  const [state, setState] = useState<VideoWorkerState>({
    isProcessing: false,
    progress: 0,
    error: null,
    result: null,
    metadata: null
  });
  
  const pendingOperations = useRef<Map<string, (response: VideoProcessingResponse) => void>>(new Map());

  // Inicializar worker
  useEffect(() => {
    if (!workerRef.current) {
      try {
        // Criar worker a partir do arquivo TypeScript
        const workerUrl = new URL('../workers/videoProcessor.worker.ts', import.meta.url);
        workerRef.current = new Worker(workerUrl, { type: 'module' });
        
        // Configurar listener de mensagens
        workerRef.current.onmessage = (event: MessageEvent<VideoProcessingResponse>) => {
          const { type, payload, id } = event.data;
          
          switch (type) {
            case 'PROCESSING_PROGRESS':
              setState(prev => ({ ...prev, progress: payload.progress || 0 }));
              options.onProgress?.(payload.progress || 0);
              break;
              
            case 'PROCESSING_COMPLETE':
              setState(prev => ({
                ...prev,
                isProcessing: false,
                result: payload.result || null,
                metadata: payload.metadata || null,
                progress: 100
              }));
              options.onComplete?.(payload.result as any, payload.metadata);
              
              // Resolver promise pendente
              const resolver = pendingOperations.current.get(id);
              if (resolver) {
                resolver(event.data);
                pendingOperations.current.delete(id);
              }
              break;
              
            case 'PROCESSING_ERROR':
              setState(prev => ({
                ...prev,
                isProcessing: false,
                error: payload.error || 'Erro desconhecido',
                progress: 0
              }));
              options.onError?.(payload.error || 'Erro desconhecido');
              
              // Rejeitar promise pendente
              const errorResolver = pendingOperations.current.get(id);
              if (errorResolver) {
                errorResolver(event.data);
                pendingOperations.current.delete(id);
              }
              break;
          }
        };
        
        workerRef.current.onerror = (error) => {
          console.error('Erro no Web Worker:', error);
          setState(prev => ({
            ...prev,
            isProcessing: false,
            error: 'Erro interno do worker'
          }));
          options.onError?.('Erro interno do worker');
        };
      } catch (error) {
        console.error('Erro ao criar Web Worker:', error);
        setState(prev => ({
          ...prev,
          error: 'Falha ao inicializar worker'
        }));
      }
    }

    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, []);

  // Função para enviar mensagem ao worker
  const sendMessage = useCallback(
    (message: Omit<VideoProcessingMessage, 'id'>): Promise<VideoProcessingResponse> => {
      return new Promise((resolve, reject) => {
        if (!workerRef.current) {
          reject(new Error('Worker não inicializado'));
          return;
        }

        const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const fullMessage: VideoProcessingMessage = { ...message, id };

        // Armazenar resolver para esta operação
        pendingOperations.current.set(id, (response) => {
          if (response.type === 'PROCESSING_ERROR') {
            reject(new Error(response.payload.error || 'Erro desconhecido'));
          } else {
            resolve(response);
          }
        });

        setState(prev => ({
          ...prev,
          isProcessing: true,
          progress: 0,
          error: null,
          result: null,
          metadata: null
        }));

        workerRef.current.postMessage(fullMessage);
      });
    },
    []
  );

  // Função para processar vídeo
  const processVideo = useCallback(
    async (
      videoData: ArrayBuffer,
      options: {
        quality?: number;
        format?: string;
        width?: number;
        height?: number;
      } = {}
    ) => {
      return sendMessage({
        type: 'PROCESS_VIDEO',
        payload: { videoData, options }
      });
    },
    [sendMessage]
  );

  // Função para comprimir vídeo
  const compressVideo = useCallback(
    async (
      videoData: ArrayBuffer,
      options: {
        quality?: number;
        format?: string;
        width?: number;
        height?: number;
      } = {}
    ) => {
      return sendMessage({
        type: 'COMPRESS_VIDEO',
        payload: { videoData, options }
      });
    },
    [sendMessage]
  );

  // Função para extrair frames
  const extractFrames = useCallback(
    async (videoData: ArrayBuffer, frameCount: number = 10) => {
      return sendMessage({
        type: 'EXTRACT_FRAMES',
        payload: { videoData, frameCount }
      });
    },
    [sendMessage]
  );

  // Função para aplicar efeitos
  const applyEffects = useCallback(
    async (
      videoData: ArrayBuffer,
      effects: string[]
    ) => {
      return sendMessage({
        type: 'APPLY_EFFECTS',
        payload: { videoData, options: { effects } }
      });
    },
    [sendMessage]
  );

  // Função para cancelar operação atual
  const cancelOperation = useCallback(() => {
    if (workerRef.current && state.isProcessing) {
      workerRef.current.terminate();
      
      // Recriar worker
      const workerUrl = new URL('../workers/videoProcessor.worker.ts', import.meta.url);
      workerRef.current = new Worker(workerUrl, { type: 'module' });
      
      setState({
        isProcessing: false,
        progress: 0,
        error: null,
        result: null,
        metadata: null
      });
      
      // Limpar operações pendentes
      pendingOperations.current.clear();
    }
  }, [state.isProcessing]);

  // Função para resetar estado
  const resetState = useCallback(() => {
    setState({
      isProcessing: false,
      progress: 0,
      error: null,
      result: null,
      metadata: null
    });
  }, []);

  return {
    // Estado
    isProcessing: state.isProcessing,
    progress: state.progress,
    error: state.error,
    result: state.result,
    metadata: state.metadata,
    
    // Funções
    processVideo,
    compressVideo,
    extractFrames,
    applyEffects,
    cancelOperation,
    resetState,
    
    // Verificar se worker está disponível
    isWorkerAvailable: !!workerRef.current
  };
};

export default useVideoWorker;