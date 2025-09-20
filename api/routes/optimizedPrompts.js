const express = require('express');
const multer = require('multer');
const router = express.Router();

// Middleware de autenticação (simulado)
const authenticateUser = (req, res, next) => {
  // Simulação de autenticação
  req.user = { id: 'user123', name: 'Usuario Teste' };
  next();
};

// Configuração do multer para upload de arquivos
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

// Simulação de banco de dados em memória
let promptDatabase = {
  prompts: [
    {
      id: 'prompt_1',
      name: 'Prompt para Vídeo Corporativo',
      description: 'Prompt otimizado para criação de conteúdo corporativo profissional',
      category: 'corporate',
      contentType: 'video',
      template: 'Crie um roteiro para vídeo corporativo sobre {topic}. O vídeo deve ter {duration} minutos, tom {tone}, e focar em {key_points}. Público-alvo: {target_audience}.',
      variables: [
        { name: 'topic', type: 'text', required: true, description: 'Tópico principal do vídeo' },
        { name: 'duration', type: 'number', required: true, description: 'Duração em minutos' },
        { name: 'tone', type: 'select', options: ['profissional', 'casual', 'inspirador'], required: true },
        { name: 'key_points', type: 'textarea', required: true, description: 'Pontos-chave a abordar' },
        { name: 'target_audience', type: 'text', required: true, description: 'Público-alvo' }
      ],
      optimization: {
        model: 'gpt-4',
        temperature: 0.7,
        maxTokens: 2000,
        systemPrompt: 'Você é um especialista em criação de conteúdo corporativo.'
      },
      performance: {
        usage: 156,
        rating: 4.7,
        successRate: 0.92,
        avgResponseTime: 3.2
      },
      tags: ['corporativo', 'profissional', 'negócios'],
      isPublic: true,
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-01-20T15:30:00Z',
      userId: 'user123'
    },
    {
      id: 'prompt_2',
      name: 'Prompt para Conteúdo Educacional',
      description: 'Prompt especializado em criar conteúdo educativo e didático',
      category: 'educational',
      contentType: 'text',
      template: 'Desenvolva um conteúdo educacional sobre {subject} para {education_level}. Inclua {learning_objectives} e use metodologia {methodology}. Duração estimada: {duration}.',
      variables: [
        { name: 'subject', type: 'text', required: true, description: 'Matéria ou assunto' },
        { name: 'education_level', type: 'select', options: ['fundamental', 'médio', 'superior', 'profissional'], required: true },
        { name: 'learning_objectives', type: 'textarea', required: true, description: 'Objetivos de aprendizagem' },
        { name: 'methodology', type: 'select', options: ['expositiva', 'interativa', 'prática', 'mista'], required: true },
        { name: 'duration', type: 'text', required: false, description: 'Duração da aula/conteúdo' }
      ],
      optimization: {
        model: 'gpt-4',
        temperature: 0.6,
        maxTokens: 1500,
        systemPrompt: 'Você é um especialista em pedagogia e criação de conteúdo educacional.'
      },
      performance: {
        usage: 89,
        rating: 4.5,
        successRate: 0.88,
        avgResponseTime: 2.8
      },
      tags: ['educação', 'didático', 'aprendizagem'],
      isPublic: true,
      createdAt: '2024-01-10T08:00:00Z',
      updatedAt: '2024-01-18T12:00:00Z',
      userId: 'user456'
    }
  ],
  categories: [
    { id: 'corporate', name: 'Corporativo', description: 'Conteúdo para empresas e negócios' },
    { id: 'educational', name: 'Educacional', description: 'Conteúdo educativo e didático' },
    { id: 'marketing', name: 'Marketing', description: 'Conteúdo promocional e publicitário' },
    { id: 'entertainment', name: 'Entretenimento', description: 'Conteúdo de entretenimento' },
    { id: 'news', name: 'Jornalístico', description: 'Conteúdo jornalístico e informativo' }
  ],
  contentTypes: [
    { id: 'video', name: 'Vídeo', description: 'Conteúdo em formato de vídeo' },
    { id: 'text', name: 'Texto', description: 'Conteúdo textual' },
    { id: 'audio', name: 'Áudio', description: 'Conteúdo em formato de áudio' },
    { id: 'image', name: 'Imagem', description: 'Conteúdo visual/imagem' },
    { id: 'interactive', name: 'Interativo', description: 'Conteúdo interativo' }
  ],
  analytics: {
    totalPrompts: 2,
    totalUsage: 245,
    averageRating: 4.6,
    topCategories: [
      { category: 'corporate', usage: 156, percentage: 63.7 },
      { category: 'educational', usage: 89, percentage: 36.3 }
    ],
    performanceMetrics: {
      avgSuccessRate: 0.90,
      avgResponseTime: 3.0,
      totalOptimizations: 15
    }
  }
};

// Funções auxiliares
const generateId = () => {
  return 'prompt_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
};

const validatePromptData = (data) => {
  const errors = [];
  
  if (!data.name || data.name.trim().length === 0) {
    errors.push('Nome é obrigatório');
  }
  
  if (!data.template || data.template.trim().length === 0) {
    errors.push('Template é obrigatório');
  }
  
  if (!data.category) {
    errors.push('Categoria é obrigatória');
  }
  
  if (!data.contentType) {
    errors.push('Tipo de conteúdo é obrigatório');
  }
  
  if (!data.variables || !Array.isArray(data.variables)) {
    errors.push('Variáveis devem ser um array');
  }
  
  return errors;
};

const processPrompt = (template, variables) => {
  let processedPrompt = template;
  
  // Substituir variáveis no template
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`{${key}}`, 'g');
    processedPrompt = processedPrompt.replace(regex, value);
  });
  
  return processedPrompt;
};

const optimizePrompt = (prompt, optimizationType) => {
  // Simulação de otimização de prompt
  const optimizations = {
    clarity: 'Prompt otimizado para maior clareza e precisão',
    creativity: 'Prompt otimizado para estimular criatividade',
    efficiency: 'Prompt otimizado para respostas mais eficientes',
    specificity: 'Prompt otimizado para maior especificidade'
  };
  
  return {
    originalPrompt: prompt,
    optimizedPrompt: prompt + ' ' + optimizations[optimizationType],
    optimizationType,
    improvements: [
      'Maior clareza nas instruções',
      'Melhor estruturação do conteúdo',
      'Redução de ambiguidades'
    ]
  };
};

const calculatePerformanceScore = (prompt) => {
  // Simulação de cálculo de score de performance
  const baseScore = 0.7;
  const usageBonus = Math.min(prompt.performance.usage / 100, 0.2);
  const ratingBonus = (prompt.performance.rating - 3) / 10;
  
  return Math.min(baseScore + usageBonus + ratingBonus, 1.0);
};

// Rotas

// Listar prompts otimizados
router.get('/prompts', authenticateUser, (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      category = '',
      contentType = '',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;
    
    let filteredPrompts = [...promptDatabase.prompts];
    
    // Filtrar por busca
    if (search) {
      filteredPrompts = filteredPrompts.filter(prompt =>
        prompt.name.toLowerCase().includes(search.toLowerCase()) ||
        prompt.description.toLowerCase().includes(search.toLowerCase()) ||
        prompt.tags.some(tag => tag.toLowerCase().includes(search.toLowerCase()))
      );
    }
    
    // Filtrar por categoria
    if (category) {
      filteredPrompts = filteredPrompts.filter(prompt => prompt.category === category);
    }
    
    // Filtrar por tipo de conteúdo
    if (contentType) {
      filteredPrompts = filteredPrompts.filter(prompt => prompt.contentType === contentType);
    }
    
    // Ordenar
    filteredPrompts.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];
      
      if (sortBy === 'performance.rating') {
        aValue = a.performance.rating;
        bValue = b.performance.rating;
      } else if (sortBy === 'performance.usage') {
        aValue = a.performance.usage;
        bValue = b.performance.usage;
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
    const paginatedPrompts = filteredPrompts.slice(startIndex, endIndex);
    
    res.json({
      prompts: paginatedPrompts,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(filteredPrompts.length / limit),
        totalItems: filteredPrompts.length,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar prompts' });
  }
});

// Obter prompt específico
router.get('/prompts/:id', authenticateUser, (req, res) => {
  try {
    const prompt = promptDatabase.prompts.find(p => p.id === req.params.id);
    
    if (!prompt) {
      return res.status(404).json({ error: 'Prompt não encontrado' });
    }
    
    res.json(prompt);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar prompt' });
  }
});

// Criar novo prompt
router.post('/prompts', authenticateUser, (req, res) => {
  try {
    const errors = validatePromptData(req.body);
    if (errors.length > 0) {
      return res.status(400).json({ error: 'Dados inválidos', details: errors });
    }
    
    const newPrompt = {
      id: generateId(),
      name: req.body.name,
      description: req.body.description || '',
      category: req.body.category,
      contentType: req.body.contentType,
      template: req.body.template,
      variables: req.body.variables || [],
      optimization: req.body.optimization || {
        model: 'gpt-4',
        temperature: 0.7,
        maxTokens: 1500,
        systemPrompt: ''
      },
      performance: {
        usage: 0,
        rating: 0,
        successRate: 0,
        avgResponseTime: 0
      },
      tags: req.body.tags || [],
      isPublic: req.body.isPublic || false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      userId: req.user.id
    };
    
    promptDatabase.prompts.push(newPrompt);
    promptDatabase.analytics.totalPrompts++;
    
    res.status(201).json(newPrompt);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar prompt' });
  }
});

// Atualizar prompt
router.put('/prompts/:id', authenticateUser, (req, res) => {
  try {
    const promptIndex = promptDatabase.prompts.findIndex(p => p.id === req.params.id);
    
    if (promptIndex === -1) {
      return res.status(404).json({ error: 'Prompt não encontrado' });
    }
    
    const prompt = promptDatabase.prompts[promptIndex];
    
    // Verificar permissão
    if (prompt.userId !== req.user.id) {
      return res.status(403).json({ error: 'Sem permissão para editar este prompt' });
    }
    
    const errors = validatePromptData(req.body);
    if (errors.length > 0) {
      return res.status(400).json({ error: 'Dados inválidos', details: errors });
    }
    
    const updatedPrompt = {
      ...prompt,
      name: req.body.name,
      description: req.body.description || '',
      category: req.body.category,
      contentType: req.body.contentType,
      template: req.body.template,
      variables: req.body.variables || [],
      optimization: req.body.optimization || prompt.optimization,
      tags: req.body.tags || [],
      isPublic: req.body.isPublic !== undefined ? req.body.isPublic : prompt.isPublic,
      updatedAt: new Date().toISOString()
    };
    
    promptDatabase.prompts[promptIndex] = updatedPrompt;
    
    res.json(updatedPrompt);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar prompt' });
  }
});

// Deletar prompt
router.delete('/prompts/:id', authenticateUser, (req, res) => {
  try {
    const promptIndex = promptDatabase.prompts.findIndex(p => p.id === req.params.id);
    
    if (promptIndex === -1) {
      return res.status(404).json({ error: 'Prompt não encontrado' });
    }
    
    const prompt = promptDatabase.prompts[promptIndex];
    
    // Verificar permissão
    if (prompt.userId !== req.user.id) {
      return res.status(403).json({ error: 'Sem permissão para deletar este prompt' });
    }
    
    promptDatabase.prompts.splice(promptIndex, 1);
    promptDatabase.analytics.totalPrompts--;
    
    res.json({ message: 'Prompt deletado com sucesso' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao deletar prompt' });
  }
});

// Processar prompt com variáveis
router.post('/prompts/:id/process', authenticateUser, (req, res) => {
  try {
    const prompt = promptDatabase.prompts.find(p => p.id === req.params.id);
    
    if (!prompt) {
      return res.status(404).json({ error: 'Prompt não encontrado' });
    }
    
    const { variables = {} } = req.body;
    
    // Validar variáveis obrigatórias
    const requiredVariables = prompt.variables.filter(v => v.required);
    const missingVariables = requiredVariables.filter(v => !variables[v.name]);
    
    if (missingVariables.length > 0) {
      return res.status(400).json({
        error: 'Variáveis obrigatórias não fornecidas',
        missing: missingVariables.map(v => v.name)
      });
    }
    
    const processedPrompt = processPrompt(prompt.template, variables);
    
    // Atualizar estatísticas
    prompt.performance.usage++;
    promptDatabase.analytics.totalUsage++;
    
    res.json({
      originalTemplate: prompt.template,
      processedPrompt,
      variables,
      optimization: prompt.optimization,
      processedAt: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao processar prompt' });
  }
});

// Otimizar prompt
router.post('/prompts/:id/optimize', authenticateUser, (req, res) => {
  try {
    const prompt = promptDatabase.prompts.find(p => p.id === req.params.id);
    
    if (!prompt) {
      return res.status(404).json({ error: 'Prompt não encontrado' });
    }
    
    const { optimizationType = 'clarity', variables = {} } = req.body;
    
    const processedPrompt = processPrompt(prompt.template, variables);
    const optimization = optimizePrompt(processedPrompt, optimizationType);
    
    // Atualizar estatísticas
    promptDatabase.analytics.performanceMetrics.totalOptimizations++;
    
    res.json({
      ...optimization,
      promptId: prompt.id,
      optimizedAt: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao otimizar prompt' });
  }
});

// Duplicar prompt
router.post('/prompts/:id/duplicate', authenticateUser, (req, res) => {
  try {
    const originalPrompt = promptDatabase.prompts.find(p => p.id === req.params.id);
    
    if (!originalPrompt) {
      return res.status(404).json({ error: 'Prompt não encontrado' });
    }
    
    const duplicatedPrompt = {
      ...originalPrompt,
      id: generateId(),
      name: `${originalPrompt.name} (Cópia)`,
      performance: {
        usage: 0,
        rating: 0,
        successRate: 0,
        avgResponseTime: 0
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      userId: req.user.id
    };
    
    promptDatabase.prompts.push(duplicatedPrompt);
    promptDatabase.analytics.totalPrompts++;
    
    res.status(201).json(duplicatedPrompt);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao duplicar prompt' });
  }
});

// Avaliar prompt
router.post('/prompts/:id/rate', authenticateUser, (req, res) => {
  try {
    const promptIndex = promptDatabase.prompts.findIndex(p => p.id === req.params.id);
    
    if (promptIndex === -1) {
      return res.status(404).json({ error: 'Prompt não encontrado' });
    }
    
    const { rating, feedback } = req.body;
    
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Avaliação deve ser entre 1 e 5' });
    }
    
    const prompt = promptDatabase.prompts[promptIndex];
    
    // Atualizar rating (média simples)
    const currentRating = prompt.performance.rating || 0;
    const currentUsage = prompt.performance.usage || 1;
    const newRating = ((currentRating * (currentUsage - 1)) + rating) / currentUsage;
    
    prompt.performance.rating = Math.round(newRating * 10) / 10;
    
    res.json({
      message: 'Avaliação registrada com sucesso',
      newRating: prompt.performance.rating
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao avaliar prompt' });
  }
});

// Exportar prompt
router.get('/prompts/:id/export', authenticateUser, (req, res) => {
  try {
    const prompt = promptDatabase.prompts.find(p => p.id === req.params.id);
    
    if (!prompt) {
      return res.status(404).json({ error: 'Prompt não encontrado' });
    }
    
    const { format = 'json' } = req.query;
    
    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="prompt_${prompt.id}.json"`);
      res.send(JSON.stringify(prompt, null, 2));
    } else if (format === 'txt') {
      const textContent = `Nome: ${prompt.name}\nDescrição: ${prompt.description}\nTemplate: ${prompt.template}\nVariáveis: ${JSON.stringify(prompt.variables, null, 2)}`;
      res.setHeader('Content-Type', 'text/plain');
      res.setHeader('Content-Disposition', `attachment; filename="prompt_${prompt.id}.txt"`);
      res.send(textContent);
    } else {
      res.status(400).json({ error: 'Formato não suportado' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Erro ao exportar prompt' });
  }
});

// Importar prompt
router.post('/prompts/import', authenticateUser, upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Arquivo não fornecido' });
    }
    
    const fileContent = req.file.buffer.toString('utf8');
    let promptData;
    
    try {
      promptData = JSON.parse(fileContent);
    } catch (parseError) {
      return res.status(400).json({ error: 'Arquivo JSON inválido' });
    }
    
    const errors = validatePromptData(promptData);
    if (errors.length > 0) {
      return res.status(400).json({ error: 'Dados do prompt inválidos', details: errors });
    }
    
    const importedPrompt = {
      ...promptData,
      id: generateId(),
      performance: {
        usage: 0,
        rating: 0,
        successRate: 0,
        avgResponseTime: 0
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      userId: req.user.id
    };
    
    promptDatabase.prompts.push(importedPrompt);
    promptDatabase.analytics.totalPrompts++;
    
    res.status(201).json(importedPrompt);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao importar prompt' });
  }
});

// Obter categorias
router.get('/categories', authenticateUser, (req, res) => {
  try {
    res.json(promptDatabase.categories);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar categorias' });
  }
});

// Obter tipos de conteúdo
router.get('/content-types', authenticateUser, (req, res) => {
  try {
    res.json(promptDatabase.contentTypes);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar tipos de conteúdo' });
  }
});

// Obter analytics
router.get('/analytics', authenticateUser, (req, res) => {
  try {
    // Recalcular métricas
    const totalUsage = promptDatabase.prompts.reduce((sum, prompt) => sum + prompt.performance.usage, 0);
    const totalRating = promptDatabase.prompts.reduce((sum, prompt) => sum + (prompt.performance.rating || 0), 0);
    const averageRating = promptDatabase.prompts.length > 0 ? totalRating / promptDatabase.prompts.length : 0;
    
    // Categorias mais usadas
    const categoryUsage = {};
    promptDatabase.prompts.forEach(prompt => {
      if (!categoryUsage[prompt.category]) {
        categoryUsage[prompt.category] = 0;
      }
      categoryUsage[prompt.category] += prompt.performance.usage;
    });
    
    const topCategories = Object.entries(categoryUsage)
      .map(([category, usage]) => ({
        category,
        usage,
        percentage: totalUsage > 0 ? (usage / totalUsage) * 100 : 0
      }))
      .sort((a, b) => b.usage - a.usage);
    
    const analytics = {
      ...promptDatabase.analytics,
      totalUsage,
      averageRating: Math.round(averageRating * 10) / 10,
      topCategories
    };
    
    res.json(analytics);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar analytics' });
  }
});

// Testar prompt
router.post('/prompts/:id/test', authenticateUser, (req, res) => {
  try {
    const prompt = promptDatabase.prompts.find(p => p.id === req.params.id);
    
    if (!prompt) {
      return res.status(404).json({ error: 'Prompt não encontrado' });
    }
    
    const { variables = {}, testData = {} } = req.body;
    
    const processedPrompt = processPrompt(prompt.template, variables);
    const performanceScore = calculatePerformanceScore(prompt);
    
    // Simulação de teste
    const testResult = {
      promptId: prompt.id,
      processedPrompt,
      variables,
      performanceScore,
      estimatedTokens: Math.ceil(processedPrompt.length / 4),
      estimatedCost: (Math.ceil(processedPrompt.length / 4) * 0.00002).toFixed(6),
      recommendations: [
        'Considere adicionar mais contexto específico',
        'Defina claramente o formato de saída desejado',
        'Inclua exemplos quando apropriado'
      ],
      testedAt: new Date().toISOString()
    };
    
    res.json(testResult);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao testar prompt' });
  }
});

module.exports = router;