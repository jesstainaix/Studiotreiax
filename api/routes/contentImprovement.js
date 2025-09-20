const express = require('express');
const multer = require('multer');
const { authenticate } = require('../middleware/auth.js');
const router = express.Router();

// Configuração do multer para upload de arquivos
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['video/mp4', 'video/avi', 'video/mov', 'audio/mp3', 'audio/wav', 'text/plain', 'application/json'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de arquivo não suportado'), false);
    }
  }
});

// Simulação de banco de dados em memória
let improvements = [
  {
    id: '1',
    contentId: 'content_1',
    contentType: 'video',
    title: 'Melhorias para Vídeo Tutorial',
    originalContent: {
      title: 'Como fazer café',
      description: 'Tutorial básico de café',
      duration: 300,
      tags: ['café', 'tutorial']
    },
    suggestions: [
      {
        id: 'sug_1',
        type: 'title',
        category: 'engagement',
        priority: 'high',
        current: 'Como fazer café',
        suggested: 'Como Fazer o Café Perfeito em Casa: Guia Completo para Iniciantes',
        reason: 'Título mais descritivo e atrativo para SEO',
        impact: 'Pode aumentar CTR em até 35%',
        confidence: 0.92,
        aiModel: 'gpt-4',
        status: 'pending'
      },
      {
        id: 'sug_2',
        type: 'description',
        category: 'seo',
        priority: 'medium',
        current: 'Tutorial básico de café',
        suggested: 'Aprenda a preparar o café perfeito em casa com técnicas profissionais. Este tutorial completo ensina desde a escolha dos grãos até o método de preparo ideal.',
        reason: 'Descrição mais detalhada com palavras-chave relevantes',
        impact: 'Melhora ranking de busca',
        confidence: 0.88,
        aiModel: 'gpt-4',
        status: 'pending'
      }
    ],
    metrics: {
      totalSuggestions: 2,
      appliedSuggestions: 0,
      estimatedImprovement: 0.35,
      categories: {
        engagement: 1,
        seo: 1,
        accessibility: 0,
        quality: 0
      }
    },
    createdAt: new Date('2024-01-15T10:00:00Z'),
    updatedAt: new Date('2024-01-15T10:00:00Z'),
    userId: 1
  }
];

let analysisHistory = [
  {
    id: 'analysis_1',
    contentId: 'content_1',
    contentType: 'video',
    analysisType: 'comprehensive',
    status: 'completed',
    results: {
      overallScore: 0.72,
      categories: {
        engagement: { score: 0.65, suggestions: 3 },
        seo: { score: 0.58, suggestions: 2 },
        accessibility: { score: 0.85, suggestions: 1 },
        quality: { score: 0.78, suggestions: 2 }
      },
      totalSuggestions: 8,
      processingTime: 45.2
    },
    createdAt: new Date('2024-01-15T10:00:00Z'),
    userId: 1
  }
];

let analytics = {
  totalAnalyses: 156,
  totalSuggestions: 1247,
  appliedSuggestions: 892,
  averageImprovement: 0.28,
  topCategories: [
    { category: 'engagement', count: 456, avgImprovement: 0.32 },
    { category: 'seo', count: 389, avgImprovement: 0.25 },
    { category: 'quality', count: 234, avgImprovement: 0.18 },
    { category: 'accessibility', count: 168, avgImprovement: 0.15 }
  ],
  modelPerformance: {
    'gpt-4': { accuracy: 0.94, avgConfidence: 0.89 },
    'claude-3': { accuracy: 0.91, avgConfidence: 0.87 },
    'gemini-pro': { accuracy: 0.88, avgConfidence: 0.85 }
  }
};

// Funções auxiliares
const generateId = () => {
  return Math.random().toString(36).substr(2, 9);
};

const validateContentData = (data) => {
  const errors = [];
  
  if (!data.contentType) errors.push('Tipo de conteúdo é obrigatório');
  if (!data.title) errors.push('Título é obrigatório');
  
  return errors;
};

const analyzeContent = async (contentData, analysisOptions = {}) => {
  // Simulação de análise de IA
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  const suggestions = [];
  const { contentType, title, description, tags = [], duration } = contentData;
  
  // Análise de título
  if (title && title.length < 30) {
    suggestions.push({
      id: generateId(),
      type: 'title',
      category: 'engagement',
      priority: 'high',
      current: title,
      suggested: `${title}: Guia Completo e Detalhado`,
      reason: 'Título muito curto, pode ser mais descritivo',
      impact: 'Pode aumentar CTR em até 25%',
      confidence: 0.85,
      aiModel: 'gpt-4',
      status: 'pending'
    });
  }
  
  // Análise de descrição
  if (!description || description.length < 50) {
    suggestions.push({
      id: generateId(),
      type: 'description',
      category: 'seo',
      priority: 'medium',
      current: description || '',
      suggested: `Descrição detalhada sobre ${title.toLowerCase()}. Aprenda técnicas profissionais e dicas práticas neste conteúdo completo.`,
      reason: 'Descrição muito curta ou ausente',
      impact: 'Melhora ranking de busca',
      confidence: 0.80,
      aiModel: 'gpt-4',
      status: 'pending'
    });
  }
  
  // Análise de tags
  if (tags.length < 3) {
    suggestions.push({
      id: generateId(),
      type: 'tags',
      category: 'seo',
      priority: 'medium',
      current: tags.join(', '),
      suggested: [...tags, 'tutorial', 'guia', 'passo a passo'].join(', '),
      reason: 'Poucas tags para otimização de busca',
      impact: 'Melhora descoberta do conteúdo',
      confidence: 0.75,
      aiModel: 'gpt-4',
      status: 'pending'
    });
  }
  
  // Análise de duração (para vídeos)
  if (contentType === 'video' && duration && duration < 60) {
    suggestions.push({
      id: generateId(),
      type: 'duration',
      category: 'engagement',
      priority: 'low',
      current: `${duration} segundos`,
      suggested: 'Considere expandir para 2-3 minutos',
      reason: 'Vídeos muito curtos têm menor engajamento',
      impact: 'Pode aumentar tempo de visualização',
      confidence: 0.70,
      aiModel: 'gpt-4',
      status: 'pending'
    });
  }
  
  return suggestions;
};

const calculateMetrics = (suggestions) => {
  const categories = {
    engagement: 0,
    seo: 0,
    accessibility: 0,
    quality: 0
  };
  
  suggestions.forEach(suggestion => {
    if (categories.hasOwnProperty(suggestion.category)) {
      categories[suggestion.category]++;
    }
  });
  
  const estimatedImprovement = suggestions.reduce((acc, suggestion) => {
    return acc + (suggestion.confidence * 0.1);
  }, 0) / suggestions.length;
  
  return {
    totalSuggestions: suggestions.length,
    appliedSuggestions: 0,
    estimatedImprovement,
    categories
  };
};

// Rotas

// Listar melhorias
router.get('/improvements', authenticate, (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      contentType, 
      category, 
      priority, 
      status,
      search 
    } = req.query;
    
    let filteredImprovements = improvements.filter(improvement => 
      improvement.userId === req.user.id
    );
    
    // Filtros
    if (contentType) {
      filteredImprovements = filteredImprovements.filter(improvement => 
        improvement.contentType === contentType
      );
    }
    
    if (search) {
      filteredImprovements = filteredImprovements.filter(improvement => 
        improvement.title.toLowerCase().includes(search.toLowerCase()) ||
        improvement.originalContent.title.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    if (category) {
      filteredImprovements = filteredImprovements.filter(improvement => 
        improvement.suggestions.some(suggestion => suggestion.category === category)
      );
    }
    
    if (priority) {
      filteredImprovements = filteredImprovements.filter(improvement => 
        improvement.suggestions.some(suggestion => suggestion.priority === priority)
      );
    }
    
    if (status) {
      filteredImprovements = filteredImprovements.filter(improvement => 
        improvement.suggestions.some(suggestion => suggestion.status === status)
      );
    }
    
    // Paginação
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedImprovements = filteredImprovements.slice(startIndex, endIndex);
    
    res.json({
      improvements: paginatedImprovements,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(filteredImprovements.length / limit),
        totalItems: filteredImprovements.length,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar melhorias' });
  }
});

// Obter melhoria específica
router.get('/improvements/:id', authenticate, (req, res) => {
  try {
    const improvement = improvements.find(i => 
      i.id === req.params.id && i.userId === req.user.id
    );
    
    if (!improvement) {
      return res.status(404).json({ error: 'Melhoria não encontrada' });
    }
    
    res.json(improvement);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar melhoria' });
  }
});

// Analisar conteúdo
router.post('/analyze', authenticate, upload.single('file'), async (req, res) => {
  try {
    const contentData = JSON.parse(req.body.contentData || '{}');
    const analysisOptions = JSON.parse(req.body.analysisOptions || '{}');
    
    const errors = validateContentData(contentData);
    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }
    
    // Se há arquivo, processar
    if (req.file) {
      contentData.fileData = {
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size
      };
    }
    
    const suggestions = await analyzeContent(contentData, analysisOptions);
    const metrics = calculateMetrics(suggestions);
    
    const improvement = {
      id: generateId(),
      contentId: contentData.contentId || generateId(),
      contentType: contentData.contentType,
      title: `Melhorias para ${contentData.title}`,
      originalContent: contentData,
      suggestions,
      metrics,
      createdAt: new Date(),
      updatedAt: new Date(),
      userId: req.user.id
    };
    
    improvements.push(improvement);
    
    // Adicionar ao histórico de análises
    const analysis = {
      id: generateId(),
      contentId: improvement.contentId,
      contentType: contentData.contentType,
      analysisType: analysisOptions.type || 'comprehensive',
      status: 'completed',
      results: {
        overallScore: Math.random() * 0.3 + 0.6, // 0.6-0.9
        categories: {
          engagement: { score: Math.random() * 0.4 + 0.5, suggestions: suggestions.filter(s => s.category === 'engagement').length },
          seo: { score: Math.random() * 0.4 + 0.5, suggestions: suggestions.filter(s => s.category === 'seo').length },
          accessibility: { score: Math.random() * 0.4 + 0.6, suggestions: suggestions.filter(s => s.category === 'accessibility').length },
          quality: { score: Math.random() * 0.4 + 0.6, suggestions: suggestions.filter(s => s.category === 'quality').length }
        },
        totalSuggestions: suggestions.length,
        processingTime: Math.random() * 30 + 15
      },
      createdAt: new Date(),
      userId: req.user.id
    };
    
    analysisHistory.push(analysis);
    
    res.status(201).json({
      improvement,
      analysis
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao analisar conteúdo' });
  }
});

// Aplicar sugestão
router.post('/improvements/:id/suggestions/:suggestionId/apply', authenticate, (req, res) => {
  try {
    const improvement = improvements.find(i => 
      i.id === req.params.id && i.userId === req.user.id
    );
    
    if (!improvement) {
      return res.status(404).json({ error: 'Melhoria não encontrada' });
    }
    
    const suggestion = improvement.suggestions.find(s => s.id === req.params.suggestionId);
    
    if (!suggestion) {
      return res.status(404).json({ error: 'Sugestão não encontrada' });
    }
    
    suggestion.status = 'applied';
    suggestion.appliedAt = new Date();
    
    improvement.metrics.appliedSuggestions++;
    improvement.updatedAt = new Date();
    
    res.json({
      message: 'Sugestão aplicada com sucesso',
      suggestion
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao aplicar sugestão' });
  }
});

// Rejeitar sugestão
router.post('/improvements/:id/suggestions/:suggestionId/reject', authenticate, (req, res) => {
  try {
    const { reason } = req.body;
    
    const improvement = improvements.find(i => 
      i.id === req.params.id && i.userId === req.user.id
    );
    
    if (!improvement) {
      return res.status(404).json({ error: 'Melhoria não encontrada' });
    }
    
    const suggestion = improvement.suggestions.find(s => s.id === req.params.suggestionId);
    
    if (!suggestion) {
      return res.status(404).json({ error: 'Sugestão não encontrada' });
    }
    
    suggestion.status = 'rejected';
    suggestion.rejectedAt = new Date();
    suggestion.rejectionReason = reason;
    
    improvement.updatedAt = new Date();
    
    res.json({
      message: 'Sugestão rejeitada com sucesso',
      suggestion
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao rejeitar sugestão' });
  }
});

// Obter histórico de análises
router.get('/analysis-history', authenticate, (req, res) => {
  try {
    const { page = 1, limit = 10, contentType, status } = req.query;
    
    let filteredHistory = analysisHistory.filter(analysis => 
      analysis.userId === req.user.id
    );
    
    if (contentType) {
      filteredHistory = filteredHistory.filter(analysis => 
        analysis.contentType === contentType
      );
    }
    
    if (status) {
      filteredHistory = filteredHistory.filter(analysis => 
        analysis.status === status
      );
    }
    
    // Ordenar por data (mais recente primeiro)
    filteredHistory.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    // Paginação
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedHistory = filteredHistory.slice(startIndex, endIndex);
    
    res.json({
      analyses: paginatedHistory,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(filteredHistory.length / limit),
        totalItems: filteredHistory.length,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar histórico de análises' });
  }
});

// Obter analytics
router.get('/analytics', authenticate, (req, res) => {
  try {
    res.json(analytics);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar analytics' });
  }
});

// Deletar melhoria
router.delete('/improvements/:id', authenticate, (req, res) => {
  try {
    const improvementIndex = improvements.findIndex(i => 
      i.id === req.params.id && i.userId === req.user.id
    );
    
    if (improvementIndex === -1) {
      return res.status(404).json({ error: 'Melhoria não encontrada' });
    }
    
    improvements.splice(improvementIndex, 1);
    
    res.json({ message: 'Melhoria deletada com sucesso' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao deletar melhoria' });
  }
});

// Exportar melhorias
router.get('/improvements/:id/export', authenticate, (req, res) => {
  try {
    const improvement = improvements.find(i => 
      i.id === req.params.id && i.userId === req.user.id
    );
    
    if (!improvement) {
      return res.status(404).json({ error: 'Melhoria não encontrada' });
    }
    
    const exportData = {
      ...improvement,
      exportedAt: new Date(),
      exportedBy: req.user.name
    };
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="improvement_${improvement.id}.json"`);
    res.json(exportData);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao exportar melhoria' });
  }
});

module.exports = router;