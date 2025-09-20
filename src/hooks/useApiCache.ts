// Hook personalizado para cache de API
import { useState, useEffect, useCallback, useRef } from 'react';
import { cachedFetch, apiCache } from '../services/apiCacheService';

interface UseApiCacheOptions {
  ttl?: number; // Time to live em ms
  enabled?: boolean; // Se o cache está habilitado
  refetchOnMount?: boolean; // Refazer requisição ao montar
  staleTime?: number; // Tempo para considerar dados obsoletos
}

interface ApiCacheState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  isStale: boolean;
  lastFetch: number | null;
}

export function useApiCache<T = any>(
  url: string,
  options: RequestInit = {},
  cacheOptions: UseApiCacheOptions = {}
) {
  const {
    ttl = 5 * 60 * 1000, // 5 minutos
    enabled = true,
    refetchOnMount = false,
    staleTime = 30 * 1000 // 30 segundos
  } = cacheOptions;

  const [state, setState] = useState<ApiCacheState<T>>({
    data: null,
    loading: false,
    error: null,
    isStale: false,
    lastFetch: null
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(true);

  // Verificar se dados estão obsoletos
  const isDataStale = useCallback(() => {
    if (!state.lastFetch) return true;
    return Date.now() - state.lastFetch > staleTime;
  }, [state.lastFetch, staleTime]);

  // Função para buscar dados
  const fetchData = useCallback(async (force = false) => {
    if (!enabled || (!force && state.loading)) return;

    // Cancelar requisição anterior se existir
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    const requestOptions = {
      ...options,
      signal: abortControllerRef.current.signal
    };

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      // Verificar cache primeiro se não for forçado
      if (!force) {
        const cached = apiCache.get(url, options);
        if (cached && mountedRef.current) {
          setState({
            data: cached.data,
            loading: false,
            error: null,
            isStale: isDataStale(),
            lastFetch: cached.timestamp
          });
          return cached.data;
        }
      }

      // Fazer requisição
      const response = await cachedFetch(url, requestOptions, ttl);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (mountedRef.current) {
        setState({
          data,
          loading: false,
          error: null,
          isStale: false,
          lastFetch: Date.now()
        });
      }

      return data;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return; // Requisição cancelada
      }

      if (mountedRef.current) {
        setState(prev => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error : new Error('Unknown error')
        }));
      }
      throw error;
    }
  }, [url, options, enabled, ttl, state.loading, isDataStale]);

  // Função para refetch forçado
  const refetch = useCallback(() => {
    return fetchData(true);
  }, [fetchData]);

  // Função para invalidar cache
  const invalidate = useCallback(() => {
    apiCache.delete(url, options);
    setState(prev => ({ ...prev, isStale: true }));
  }, [url, options]);

  // Função para atualizar dados localmente
  const mutate = useCallback((newData: T | ((prev: T | null) => T)) => {
    setState(prev => {
      const data = typeof newData === 'function' 
        ? (newData as (prev: T | null) => T)(prev.data)
        : newData;
      
      // Atualizar cache também
      apiCache.set(url, data, options, ttl);
      
      return {
        ...prev,
        data,
        isStale: false,
        lastFetch: Date.now()
      };
    });
  }, [url, options, ttl]);

  // Efeito para buscar dados na montagem
  useEffect(() => {
    mountedRef.current = true;
    
    if (enabled && (refetchOnMount || !state.data)) {
      fetchData();
    }

    return () => {
      mountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [enabled, refetchOnMount]); // Dependências intencionalmente limitadas

  // Efeito para verificar dados obsoletos
  useEffect(() => {
    if (state.data && isDataStale()) {
      setState(prev => ({ ...prev, isStale: true }));
    }
  }, [state.data, isDataStale]);

  return {
    ...state,
    refetch,
    invalidate,
    mutate,
    isStale: state.isStale || isDataStale()
  };
}

// Hook para múltiplas requisições
export function useMultipleApiCache<T = any>(
  requests: Array<{ url: string; options?: RequestInit; key: string }>,
  cacheOptions: UseApiCacheOptions = {}
) {
  const [states, setStates] = useState<Record<string, ApiCacheState<T>>>({});
  const [globalLoading, setGlobalLoading] = useState(false);

  const fetchAll = useCallback(async () => {
    setGlobalLoading(true);
    
    try {
      const promises = requests.map(async ({ url, options = {}, key }) => {
        try {
          const response = await cachedFetch(url, options, cacheOptions.ttl);
          const data = await response.json();
          
          setStates(prev => ({
            ...prev,
            [key]: {
              data,
              loading: false,
              error: null,
              isStale: false,
              lastFetch: Date.now()
            }
          }));
          
          return { key, data, error: null };
        } catch (error) {
          const err = error instanceof Error ? error : new Error('Unknown error');
          
          setStates(prev => ({
            ...prev,
            [key]: {
              data: null,
              loading: false,
              error: err,
              isStale: false,
              lastFetch: null
            }
          }));
          
          return { key, data: null, error: err };
        }
      });

      await Promise.allSettled(promises);
    } finally {
      setGlobalLoading(false);
    }
  }, [requests, cacheOptions.ttl]);

  useEffect(() => {
    if (cacheOptions.enabled !== false) {
      fetchAll();
    }
  }, [fetchAll, cacheOptions.enabled]);

  return {
    states,
    globalLoading,
    refetchAll: fetchAll
  };
}

// Hook para estatísticas do cache
export function useCacheStats() {
  const [stats, setStats] = useState(apiCache.getStats());

  useEffect(() => {
    const updateStats = () => setStats(apiCache.getStats());
    
    // Atualizar estatísticas quando cache muda
    apiCache.on('cache:set', updateStats);
    apiCache.on('cache:delete', updateStats);
    apiCache.on('cache:clear', updateStats);
    apiCache.on('cache:cleanup', updateStats);

    // Atualizar a cada 5 segundos
    const interval = setInterval(updateStats, 5000);

    return () => {
      apiCache.off('cache:set', updateStats);
      apiCache.off('cache:delete', updateStats);
      apiCache.off('cache:clear', updateStats);
      apiCache.off('cache:cleanup', updateStats);
      clearInterval(interval);
    };
  }, []);

  return stats;
}