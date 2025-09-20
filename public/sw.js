// Service Worker para otimização de cache e performance
const CACHE_NAME = 'performance-app-v1';
const STATIC_CACHE = 'static-v1';
const DYNAMIC_CACHE = 'dynamic-v1';
const API_CACHE = 'api-v1';
const IMAGE_CACHE = 'images-v1';

// Recursos para cache estático
const STATIC_ASSETS = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json'
];

// Estratégias de cache
const CACHE_STRATEGIES = {
  'cache-first': 'cache-first',
  'network-first': 'network-first',
  'stale-while-revalidate': 'stale-while-revalidate',
  'network-only': 'network-only',
  'cache-only': 'cache-only'
};

// Configurações de cache por tipo de recurso
const CACHE_CONFIG = {
  static: {
    strategy: CACHE_STRATEGIES['cache-first'],
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 dias
    maxEntries: 100
  },
  api: {
    strategy: CACHE_STRATEGIES['network-first'],
    maxAge: 5 * 60 * 1000, // 5 minutos
    maxEntries: 50
  },
  images: {
    strategy: CACHE_STRATEGIES['cache-first'],
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 dias
    maxEntries: 200
  },
  dynamic: {
    strategy: CACHE_STRATEGIES['stale-while-revalidate'],
    maxAge: 24 * 60 * 60 * 1000, // 24 horas
    maxEntries: 100
  }
};

// Métricas de performance
let performanceMetrics = {
  cacheHits: 0,
  cacheMisses: 0,
  networkRequests: 0,
  totalRequests: 0,
  averageResponseTime: 0,
  lastUpdated: Date.now()
};

// Instalação do Service Worker
self.addEventListener('install', (event) => {
  console.log('Service Worker: Instalando...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('Service Worker: Cache estático criado');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('Service Worker: Recursos estáticos em cache');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('Service Worker: Erro na instalação:', error);
      })
  );
});

// Ativação do Service Worker
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Ativando...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            // Remove caches antigos
            if (cacheName !== CACHE_NAME && 
                cacheName !== STATIC_CACHE && 
                cacheName !== DYNAMIC_CACHE && 
                cacheName !== API_CACHE && 
                cacheName !== IMAGE_CACHE) {
              console.log('Service Worker: Removendo cache antigo:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker: Ativado');
        return self.clients.claim();
      })
  );
});

// Interceptação de requisições
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Ignora requisições não HTTP
  if (!request.url.startsWith('http')) {
    return;
  }
  
  // Incrementa contador de requisições
  performanceMetrics.totalRequests++;
  
  // Determina estratégia de cache baseada no tipo de recurso
  const cacheStrategy = getCacheStrategy(request);
  const cacheName = getCacheName(request);
  
  event.respondWith(
    handleRequest(request, cacheStrategy, cacheName)
  );
});

// Determina a estratégia de cache baseada na requisição
function getCacheStrategy(request) {
  const url = new URL(request.url);
  
  // API requests
  if (url.pathname.startsWith('/api/')) {
    return CACHE_CONFIG.api.strategy;
  }
  
  // Imagens
  if (request.destination === 'image' || 
      /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(url.pathname)) {
    return CACHE_CONFIG.images.strategy;
  }
  
  // Recursos estáticos
  if (request.destination === 'script' || 
      request.destination === 'style' || 
      /\.(js|css|woff|woff2|ttf|eot)$/i.test(url.pathname)) {
    return CACHE_CONFIG.static.strategy;
  }
  
  // Páginas e outros recursos
  return CACHE_CONFIG.dynamic.strategy;
}

// Determina o nome do cache baseado na requisição
function getCacheName(request) {
  const url = new URL(request.url);
  
  if (url.pathname.startsWith('/api/')) {
    return API_CACHE;
  }
  
  if (request.destination === 'image' || 
      /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(url.pathname)) {
    return IMAGE_CACHE;
  }
  
  if (request.destination === 'script' || 
      request.destination === 'style' || 
      /\.(js|css|woff|woff2|ttf|eot)$/i.test(url.pathname)) {
    return STATIC_CACHE;
  }
  
  return DYNAMIC_CACHE;
}

// Manipula requisições baseado na estratégia
async function handleRequest(request, strategy, cacheName) {
  const startTime = Date.now();
  
  try {
    switch (strategy) {
      case CACHE_STRATEGIES['cache-first']:
        return await cacheFirst(request, cacheName);
      
      case CACHE_STRATEGIES['network-first']:
        return await networkFirst(request, cacheName);
      
      case CACHE_STRATEGIES['stale-while-revalidate']:
        return await staleWhileRevalidate(request, cacheName);
      
      case CACHE_STRATEGIES['network-only']:
        return await networkOnly(request);
      
      case CACHE_STRATEGIES['cache-only']:
        return await cacheOnly(request, cacheName);
      
      default:
        return await networkFirst(request, cacheName);
    }
  } catch (error) {
    console.error('Service Worker: Erro ao processar requisição:', error);
    return new Response('Erro interno do Service Worker', { status: 500 });
  } finally {
    // Atualiza métricas de performance
    const responseTime = Date.now() - startTime;
    updatePerformanceMetrics(responseTime);
  }
}

// Estratégia Cache First
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    performanceMetrics.cacheHits++;
    return cachedResponse;
  }
  
  performanceMetrics.cacheMisses++;
  performanceMetrics.networkRequests++;
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
      await cleanupCache(cacheName);
    }
    
    return networkResponse;
  } catch (error) {
    console.error('Service Worker: Erro na rede:', error);
    return new Response('Recurso não disponível', { status: 503 });
  }
}

// Estratégia Network First
async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  
  try {
    performanceMetrics.networkRequests++;
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
      await cleanupCache(cacheName);
    }
    
    return networkResponse;
  } catch (error) {
    console.error('Service Worker: Erro na rede, tentando cache:', error);
    
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      performanceMetrics.cacheHits++;
      return cachedResponse;
    }
    
    performanceMetrics.cacheMisses++;
    return new Response('Recurso não disponível', { status: 503 });
  }
}

// Estratégia Stale While Revalidate
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  // Busca na rede em background
  const networkResponsePromise = fetch(request)
    .then(async (networkResponse) => {
      if (networkResponse.ok) {
        cache.put(request, networkResponse.clone());
        await cleanupCache(cacheName);
      }
      return networkResponse;
    })
    .catch((error) => {
      console.error('Service Worker: Erro na revalidação:', error);
    });
  
  performanceMetrics.networkRequests++;
  
  if (cachedResponse) {
    performanceMetrics.cacheHits++;
    // Retorna cache imediatamente, atualiza em background
    networkResponsePromise;
    return cachedResponse;
  }
  
  performanceMetrics.cacheMisses++;
  
  try {
    return await networkResponsePromise;
  } catch (error) {
    return new Response('Recurso não disponível', { status: 503 });
  }
}

// Estratégia Network Only
async function networkOnly(request) {
  performanceMetrics.networkRequests++;
  
  try {
    return await fetch(request);
  } catch (error) {
    console.error('Service Worker: Erro na rede (network-only):', error);
    return new Response('Recurso não disponível', { status: 503 });
  }
}

// Estratégia Cache Only
async function cacheOnly(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    performanceMetrics.cacheHits++;
    return cachedResponse;
  }
  
  performanceMetrics.cacheMisses++;
  return new Response('Recurso não encontrado no cache', { status: 404 });
}

// Limpeza de cache baseada em limites
async function cleanupCache(cacheName) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  
  const config = getCacheConfigByName(cacheName);
  
  if (keys.length > config.maxEntries) {
    // Remove entradas mais antigas
    const entriesToDelete = keys.length - config.maxEntries;
    
    for (let i = 0; i < entriesToDelete; i++) {
      await cache.delete(keys[i]);
    }
  }
  
  // Remove entradas expiradas
  const now = Date.now();
  
  for (const request of keys) {
    const response = await cache.match(request);
    const dateHeader = response?.headers.get('date');
    
    if (dateHeader) {
      const responseDate = new Date(dateHeader).getTime();
      
      if (now - responseDate > config.maxAge) {
        await cache.delete(request);
      }
    }
  }
}

// Obtém configuração de cache por nome
function getCacheConfigByName(cacheName) {
  switch (cacheName) {
    case STATIC_CACHE:
      return CACHE_CONFIG.static;
    case API_CACHE:
      return CACHE_CONFIG.api;
    case IMAGE_CACHE:
      return CACHE_CONFIG.images;
    case DYNAMIC_CACHE:
      return CACHE_CONFIG.dynamic;
    default:
      return CACHE_CONFIG.dynamic;
  }
}

// Atualiza métricas de performance
function updatePerformanceMetrics(responseTime) {
  const totalTime = performanceMetrics.averageResponseTime * (performanceMetrics.totalRequests - 1);
  performanceMetrics.averageResponseTime = (totalTime + responseTime) / performanceMetrics.totalRequests;
  performanceMetrics.lastUpdated = Date.now();
}

// Manipula mensagens do cliente
self.addEventListener('message', (event) => {
  const { type, payload } = event.data;
  
  switch (type) {
    case 'GET_PERFORMANCE_METRICS':
      event.ports[0].postMessage({
        type: 'PERFORMANCE_METRICS',
        payload: {
          ...performanceMetrics,
          cacheHitRate: performanceMetrics.totalRequests > 0 
            ? performanceMetrics.cacheHits / performanceMetrics.totalRequests 
            : 0
        }
      });
      break;
      
    case 'CLEAR_CACHE':
      clearAllCaches()
        .then(() => {
          event.ports[0].postMessage({
            type: 'CACHE_CLEARED',
            payload: { success: true }
          });
        })
        .catch((error) => {
          event.ports[0].postMessage({
            type: 'CACHE_CLEARED',
            payload: { success: false, error: error.message }
          });
        });
      break;
      
    case 'PREFETCH_RESOURCES':
      prefetchResources(payload.urls)
        .then(() => {
          event.ports[0].postMessage({
            type: 'PREFETCH_COMPLETE',
            payload: { success: true }
          });
        })
        .catch((error) => {
          event.ports[0].postMessage({
            type: 'PREFETCH_COMPLETE',
            payload: { success: false, error: error.message }
          });
        });
      break;
      
    default:
      console.log('Service Worker: Mensagem não reconhecida:', type);
  }
});

// Limpa todos os caches
async function clearAllCaches() {
  const cacheNames = await caches.keys();
  
  await Promise.all(
    cacheNames.map(cacheName => caches.delete(cacheName))
  );
  
  // Reset métricas
  performanceMetrics = {
    cacheHits: 0,
    cacheMisses: 0,
    networkRequests: 0,
    totalRequests: 0,
    averageResponseTime: 0,
    lastUpdated: Date.now()
  };
  
  console.log('Service Worker: Todos os caches foram limpos');
}

// Prefetch de recursos
async function prefetchResources(urls) {
  const cache = await caches.open(DYNAMIC_CACHE);
  
  const prefetchPromises = urls.map(async (url) => {
    try {
      const response = await fetch(url);
      
      if (response.ok) {
        await cache.put(url, response);
        console.log('Service Worker: Recurso prefetched:', url);
      }
    } catch (error) {
      console.error('Service Worker: Erro no prefetch:', url, error);
    }
  });
  
  await Promise.all(prefetchPromises);
  await cleanupCache(DYNAMIC_CACHE);
}

// Background sync para métricas
self.addEventListener('sync', (event) => {
  if (event.tag === 'performance-metrics-sync') {
    event.waitUntil(
      syncPerformanceMetrics()
    );
  }
});

// Sincroniza métricas de performance
async function syncPerformanceMetrics() {
  try {
    // Envia métricas para o servidor (se configurado)
    const response = await fetch('/api/performance/metrics', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(performanceMetrics)
    });
    
    if (response.ok) {
      console.log('Service Worker: Métricas sincronizadas com sucesso');
    }
  } catch (error) {
    console.error('Service Worker: Erro ao sincronizar métricas:', error);
  }
}

console.log('Service Worker: Carregado e pronto para otimizar performance!');