const express = require('express');
const crypto = require('crypto');
const router = express.Router();

// Middleware de autenticação (simulado)
const authenticateUser = (req, res, next) => {
  // Simular autenticação
  req.user = { id: 'user123', name: 'Usuário Teste' };
  next();
};

// Simulação de banco de dados em memória para cache
let cacheEntries = [
  {
    id: 'cache1',
    key: 'script_generation_action_thriller_30min',
    prompt: 'Gere um roteiro de ação e suspense de 30 minutos sobre um detetive investigando um caso de sequestro',
    promptHash: 'a1b2c3d4e5f6',
    response: {
      content: 'FADE IN:\n\nEXT. CIDADE - NOITE\n\nAs luzes da cidade piscam enquanto o DETETIVE SILVA (40s) caminha pelas ruas desertas...',
      metadata: {
        model: 'gpt-4',
        tokens: 2847,
        cost: 0.085,
        generatedAt: new Date('2024-01-20T10:30:00Z')
      }
    },
    category: 'script-generation',
    tags: ['ação', 'suspense', 'detetive', '30min'],
    hitCount: 15,
    lastAccessed: new Date('2024-01-22T14:20:00Z'),
    expiresAt: new Date('2024-02-20T10:30:00Z'),
    createdAt: new Date('2024-01-20T10:30:00Z'),
    createdBy: 'user123'
  },
  {
    id: 'cache2',
    key: 'storyboard_romantic_comedy_beach',
    prompt: 'Crie um storyboard para uma comédia romântica que se passa na praia',
    promptHash: 'b2c3d4e5f6a1',
    response: {
      content: [
        {
          scene: 1,
          description: 'Plano geral da praia ao amanhecer',
          shot: 'Wide shot',
          duration: '3s',
          notes: 'Câmera fixa, luz dourada do nascer do sol'
        },
        {
          scene: 2,
          description: 'Close-up da protagonista correndo na areia',
          shot: 'Close-up',
          duration: '2s',
          notes: 'Câmera acompanha o movimento, foco no rosto'
        }
      ],
      metadata: {
        model: 'claude-3-sonnet',
        tokens: 1523,
        cost: 0.046,
        generatedAt: new Date('2024-01-21T09:15:00Z')
      }
    },
    category: 'storyboard-generation',
    tags: ['romance', 'comédia', 'praia', 'storyboard'],
    hitCount: 8,
    lastAccessed: new Date('2024-01-22T11:45:00Z'),
    expiresAt: new Date('2024-02-21T09:15:00Z'),
    createdAt: new Date('2024-01-21T09:15:00Z'),
    createdBy: 'user123'
  },
  {
    id: 'cache3',
    key: 'content_improvement_youtube_engagement',
    prompt: 'Analise este título de vídeo do YouTube e sugira melhorias para aumentar o engajamento: "Como fazer um bolo"',
    promptHash: 'c3d4e5f6a1b2',
    response: {
      content: {
        originalTitle: 'Como fazer um bolo',
        improvedTitles: [
          '5 SEGREDOS para o Bolo PERFEITO que NINGUÉM te Conta!',
          'BOLO CASEIRO em 30 MINUTOS - Receita INFALÍVEL da Vovó',
          'O ERRO que TODO MUNDO Comete ao Fazer Bolo (e como EVITAR)'
        ],
        improvements: [
          'Adicionar números específicos (5 segredos, 30 minutos)',
          'Usar palavras de impacto em MAIÚSCULAS',
          'Criar curiosidade e urgência',
          'Mencionar benefícios únicos'
        ],
        estimatedCTR: '+45%'
      },
      metadata: {
        model: 'gpt-4-turbo',
        tokens: 892,
        cost: 0.009,
        generatedAt: new Date('2024-01-22T08:30:00Z')
      }
    },
    category: 'content-improvement',
    tags: ['youtube', 'título', 'engajamento', 'melhoria'],
    hitCount: 3,
    lastAccessed: new Date('2024-01-22T16:10:00Z'),
    expiresAt: new Date('2024-02-22T08:30:00Z'),
    createdAt: new Date('2024-01-22T08:30:00Z'),
    createdBy: 'user123'
  }
];

let cacheStats = {
  totalEntries: 3,
  totalHits: 26,
  totalMisses: 47,
  hitRate: 0.356, // 26/(26+47)
  totalSizeBytes: 15847,
  categoriesStats: {
    'script-generation': { entries: 1, hits: 15, avgResponseTime: 2.3 },
    'storyboard-generation': { entries: 1, hits: 8, avgResponseTime: 1.8 },
    'content-improvement': { entries: 1, hits: 3, avgResponseTime: 1.2 }
  },
  dailyStats: [
    { date: '2024-01-20', hits: 5, misses: 12, created: 1 },
    { date: '2024-01-21', hits: 8, misses: 15, created: 1 },
    { date: '2024-01-22', hits: 13, misses: 20, created: 1 }
  ]
};

// Configurações de cache
const cacheConfig = {
  defaultTTL: 30 * 24 * 60 * 60 * 1000, // 30 dias em ms
  maxEntries: 10000,
  maxSizeBytes: 100 * 1024 * 1024, // 100MB
  categories: {
    'script-generation': { ttl: 7 * 24 * 60 * 60 * 1000 }, // 7 dias
    'storyboard-generation': { ttl: 14 * 24 * 60 * 60 * 1000 }, // 14 dias
    'content-improvement': { ttl: 3 * 24 * 60 * 60 * 1000 }, // 3 dias
    'captions-transcriptions': { ttl: 30 * 24 * 60 * 60 * 1000 }, // 30 dias
    'prompt-templates': { ttl: 60 * 24 * 60 * 60 * 1000 } // 60 dias
  }
};

// Funções auxiliares
const generateId = () => {
  return 'cache_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
};

const generateCacheKey = (category, prompt, params = {}) => {
  const normalizedPrompt = prompt.toLowerCase().trim();
  const paramsString = Object.keys(params)
    .sort()
    .map(key => `${key}:${params[key]}`)
    .join('|');
  
  return `${category}_${normalizedPrompt.replace(/[^a-z0-9]/g, '_')}_${paramsString}`
    .substring(0, 100);
};

const generatePromptHash = (prompt, params = {}) => {
  const content = prompt + JSON.stringify(params);
  return crypto.createHash('md5').update(content).digest('hex').substring(0, 12);
};

const calculateCacheSize = (entry) => {
  return JSON.stringify(entry).length;
};

const isExpired = (entry) => {
  return new Date() > new Date(entry.expiresAt);
};

const cleanExpiredEntries = () => {
  const beforeCount = cacheEntries.length;
  cacheEntries = cacheEntries.filter(entry => !isExpired(entry));
  const cleanedCount = beforeCount - cacheEntries.length;
  
  if (cleanedCount > 0) {
    updateCacheStats();
  }
  
  return cleanedCount;
};

const updateCacheStats = () => {
  cacheStats.totalEntries = cacheEntries.length;
  cacheStats.totalSizeBytes = cacheEntries.reduce((total, entry) => {
    return total + calculateCacheSize(entry);
  }, 0);
  
  // Atualizar estatísticas por categoria
  const categories = {};
  cacheEntries.forEach(entry => {
    if (!categories[entry.category]) {
      categories[entry.category] = { entries: 0, hits: 0 };
    }
    categories[entry.category].entries++;
    categories[entry.category].hits += entry.hitCount;
  });
  
  cacheStats.categoriesStats = categories;
};

// Rotas

// Buscar no cache
router.get('/search', authenticateUser, (req, res) => {
  try {
    const { category, prompt, params } = req.query;
    
    if (!category || !prompt) {
      return res.status(400).json({ error: 'Categoria e prompt são obrigatórios' });
    }
    
    // Limpar entradas expiradas
    cleanExpiredEntries();
    
    const parsedParams = params ? JSON.parse(params) : {};
    const promptHash = generatePromptHash(prompt, parsedParams);
    
    // Buscar entrada no cache
    const cacheEntry = cacheEntries.find(entry => 
      entry.category === category && 
      entry.promptHash === promptHash &&
      !isExpired(entry)
    );
    
    if (cacheEntry) {
      // Cache hit - atualizar estatísticas
      cacheEntry.hitCount++;
      cacheEntry.lastAccessed = new Date();
      cacheStats.totalHits++;
      
      res.json({
        hit: true,
        data: cacheEntry.response,
        metadata: {
          cacheId: cacheEntry.id,
          hitCount: cacheEntry.hitCount,
          createdAt: cacheEntry.createdAt,
          lastAccessed: cacheEntry.lastAccessed
        }
      });
    } else {
      // Cache miss
      cacheStats.totalMisses++;
      
      res.json({
        hit: false,
        data: null,
        metadata: {
          promptHash,
          suggestedKey: generateCacheKey(category, prompt, parsedParams)
        }
      });
    }
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar no cache' });
  }
});

// Armazenar no cache
router.post('/store', authenticateUser, (req, res) => {
  try {
    const { category, prompt, params = {}, response, metadata = {} } = req.body;
    
    if (!category || !prompt || !response) {
      return res.status(400).json({ error: 'Categoria, prompt e resposta são obrigatórios' });
    }
    
    // Limpar entradas expiradas
    cleanExpiredEntries();
    
    const promptHash = generatePromptHash(prompt, params);
    const cacheKey = generateCacheKey(category, prompt, params);
    
    // Verificar se já existe
    const existingEntry = cacheEntries.find(entry => 
      entry.category === category && entry.promptHash === promptHash
    );
    
    if (existingEntry) {
      return res.status(409).json({ error: 'Entrada já existe no cache' });
    }
    
    // Calcular TTL baseado na categoria
    const categoryConfig = cacheConfig.categories[category];
    const ttl = categoryConfig ? categoryConfig.ttl : cacheConfig.defaultTTL;
    const expiresAt = new Date(Date.now() + ttl);
    
    // Criar nova entrada
    const newEntry = {
      id: generateId(),
      key: cacheKey,
      prompt,
      promptHash,
      response,
      category,
      tags: metadata.tags || [],
      hitCount: 0,
      lastAccessed: new Date(),
      expiresAt,
      createdAt: new Date(),
      createdBy: req.user.id
    };
    
    // Verificar limites de cache
    const entrySize = calculateCacheSize(newEntry);
    const currentSize = cacheStats.totalSizeBytes;
    
    if (cacheEntries.length >= cacheConfig.maxEntries) {
      return res.status(413).json({ error: 'Limite máximo de entradas atingido' });
    }
    
    if (currentSize + entrySize > cacheConfig.maxSizeBytes) {
      return res.status(413).json({ error: 'Limite máximo de tamanho atingido' });
    }
    
    // Adicionar ao cache
    cacheEntries.unshift(newEntry);
    updateCacheStats();
    
    res.status(201).json({
      message: 'Entrada armazenada no cache',
      cacheId: newEntry.id,
      expiresAt: newEntry.expiresAt
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao armazenar no cache' });
  }
});

// Listar entradas do cache
router.get('/entries', authenticateUser, (req, res) => {
  try {
    const { 
      category, 
      page = 1, 
      limit = 20, 
      sortBy = 'lastAccessed', 
      sortOrder = 'desc',
      search
    } = req.query;
    
    // Limpar entradas expiradas
    cleanExpiredEntries();
    
    let filteredEntries = [...cacheEntries];
    
    // Filtrar por categoria
    if (category) {
      filteredEntries = filteredEntries.filter(entry => entry.category === category);
    }
    
    // Filtrar por busca
    if (search) {
      const searchLower = search.toLowerCase();
      filteredEntries = filteredEntries.filter(entry => 
        entry.prompt.toLowerCase().includes(searchLower) ||
        entry.tags.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }
    
    // Ordenar
    filteredEntries.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];
      
      if (sortBy === 'lastAccessed' || sortBy === 'createdAt') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }
      
      if (sortOrder === 'desc') {
        return bValue > aValue ? 1 : -1;
      } else {
        return aValue > bValue ? 1 : -1;
      }
    });
    
    // Paginar
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedEntries = filteredEntries.slice(startIndex, endIndex);
    
    // Remover dados sensíveis da resposta
    const sanitizedEntries = paginatedEntries.map(entry => ({
      id: entry.id,
      key: entry.key,
      prompt: entry.prompt.substring(0, 100) + (entry.prompt.length > 100 ? '...' : ''),
      category: entry.category,
      tags: entry.tags,
      hitCount: entry.hitCount,
      lastAccessed: entry.lastAccessed,
      expiresAt: entry.expiresAt,
      createdAt: entry.createdAt,
      size: calculateCacheSize(entry)
    }));
    
    res.json({
      entries: sanitizedEntries,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: filteredEntries.length,
        pages: Math.ceil(filteredEntries.length / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao listar entradas do cache' });
  }
});

// Obter entrada específica do cache
router.get('/entries/:id', authenticateUser, (req, res) => {
  try {
    const entry = cacheEntries.find(e => e.id === req.params.id);
    
    if (!entry) {
      return res.status(404).json({ error: 'Entrada não encontrada' });
    }
    
    if (isExpired(entry)) {
      return res.status(410).json({ error: 'Entrada expirada' });
    }
    
    res.json(entry);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao obter entrada do cache' });
  }
});

// Deletar entrada do cache
router.delete('/entries/:id', authenticateUser, (req, res) => {
  try {
    const entryIndex = cacheEntries.findIndex(e => e.id === req.params.id);
    
    if (entryIndex === -1) {
      return res.status(404).json({ error: 'Entrada não encontrada' });
    }
    
    cacheEntries.splice(entryIndex, 1);
    updateCacheStats();
    
    res.json({ message: 'Entrada deletada do cache' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao deletar entrada do cache' });
  }
});

// Invalidar cache por categoria
router.delete('/categories/:category', authenticateUser, (req, res) => {
  try {
    const category = req.params.category;
    const beforeCount = cacheEntries.length;
    
    cacheEntries = cacheEntries.filter(entry => entry.category !== category);
    
    const deletedCount = beforeCount - cacheEntries.length;
    updateCacheStats();
    
    res.json({ 
      message: `${deletedCount} entradas da categoria '${category}' foram removidas`,
      deletedCount
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao invalidar cache da categoria' });
  }
});

// Limpar cache expirado
router.post('/cleanup', authenticateUser, (req, res) => {
  try {
    const cleanedCount = cleanExpiredEntries();
    
    res.json({ 
      message: `${cleanedCount} entradas expiradas foram removidas`,
      cleanedCount,
      remainingEntries: cacheEntries.length
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao limpar cache' });
  }
});

// Limpar todo o cache
router.delete('/clear', authenticateUser, (req, res) => {
  try {
    const { category } = req.query;
    const beforeCount = cacheEntries.length;
    
    if (category) {
      cacheEntries = cacheEntries.filter(entry => entry.category !== category);
    } else {
      cacheEntries = [];
    }
    
    const deletedCount = beforeCount - cacheEntries.length;
    updateCacheStats();
    
    res.json({ 
      message: category 
        ? `Cache da categoria '${category}' foi limpo`
        : 'Todo o cache foi limpo',
      deletedCount
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao limpar cache' });
  }
});

// Obter estatísticas do cache
router.get('/stats', authenticateUser, (req, res) => {
  try {
    // Limpar entradas expiradas antes de calcular estatísticas
    cleanExpiredEntries();
    updateCacheStats();
    
    const { period = '7d' } = req.query;
    
    let filteredDailyStats = cacheStats.dailyStats;
    
    if (period === '7d') {
      filteredDailyStats = cacheStats.dailyStats.slice(-7);
    } else if (period === '30d') {
      filteredDailyStats = cacheStats.dailyStats.slice(-30);
    }
    
    // Calcular métricas adicionais
    const avgHitRate = cacheStats.totalHits / (cacheStats.totalHits + cacheStats.totalMisses);
    const avgEntrySize = cacheStats.totalEntries > 0 ? cacheStats.totalSizeBytes / cacheStats.totalEntries : 0;
    
    // Calcular economia de custos (estimativa)
    const avgCostPerRequest = 0.02; // $0.02 por requisição (estimativa)
    const estimatedSavings = cacheStats.totalHits * avgCostPerRequest;
    
    res.json({
      ...cacheStats,
      hitRate: avgHitRate,
      avgEntrySize,
      estimatedSavings,
      dailyStats: filteredDailyStats,
      config: {
        maxEntries: cacheConfig.maxEntries,
        maxSizeBytes: cacheConfig.maxSizeBytes,
        defaultTTL: cacheConfig.defaultTTL
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao obter estatísticas do cache' });
  }
});

// Obter configurações do cache
router.get('/config', authenticateUser, (req, res) => {
  try {
    res.json(cacheConfig);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao obter configurações do cache' });
  }
});

// Atualizar configurações do cache
router.put('/config', authenticateUser, (req, res) => {
  try {
    const { defaultTTL, maxEntries, maxSizeBytes, categories } = req.body;
    
    if (defaultTTL) cacheConfig.defaultTTL = defaultTTL;
    if (maxEntries) cacheConfig.maxEntries = maxEntries;
    if (maxSizeBytes) cacheConfig.maxSizeBytes = maxSizeBytes;
    if (categories) {
      Object.assign(cacheConfig.categories, categories);
    }
    
    res.json({
      message: 'Configurações do cache atualizadas',
      config: cacheConfig
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar configurações do cache' });
  }
});

// Pré-aquecer cache (para entradas populares)
router.post('/warmup', authenticateUser, (req, res) => {
  try {
    const { category, prompts } = req.body;
    
    if (!category || !Array.isArray(prompts)) {
      return res.status(400).json({ error: 'Categoria e lista de prompts são obrigatórios' });
    }
    
    // Simular pré-aquecimento
    const warmedUp = [];
    
    prompts.forEach(promptData => {
      const { prompt, params = {}, response } = promptData;
      
      if (prompt && response) {
        const promptHash = generatePromptHash(prompt, params);
        const existingEntry = cacheEntries.find(entry => 
          entry.category === category && entry.promptHash === promptHash
        );
        
        if (!existingEntry) {
          const cacheKey = generateCacheKey(category, prompt, params);
          const categoryConfig = cacheConfig.categories[category];
          const ttl = categoryConfig ? categoryConfig.ttl : cacheConfig.defaultTTL;
          
          const newEntry = {
            id: generateId(),
            key: cacheKey,
            prompt,
            promptHash,
            response,
            category,
            tags: promptData.tags || [],
            hitCount: 0,
            lastAccessed: new Date(),
            expiresAt: new Date(Date.now() + ttl),
            createdAt: new Date(),
            createdBy: req.user.id
          };
          
          cacheEntries.unshift(newEntry);
          warmedUp.push(newEntry.id);
        }
      }
    });
    
    updateCacheStats();
    
    res.json({
      message: `${warmedUp.length} entradas foram pré-aquecidas no cache`,
      warmedUpIds: warmedUp
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao pré-aquecer cache' });
  }
});

module.exports = router;