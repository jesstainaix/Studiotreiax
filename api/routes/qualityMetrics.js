const express = require('express');
const multer = require('multer');
const router = express.Router();

// Middleware de autenticação (simulado)
const authenticateUser = (req, res, next) => {
  // Simulação de autenticação
  req.user = { id: 'user123', name: 'Usuário Teste' };
  next();
};

// Configuração do multer para upload de arquivos
const upload = multer({ storage: multer.memoryStorage() });

// Simulação de banco de dados em memória
let qualityMetrics = [
  {
    id: 'qm1',
    contentId: 'content1',
    contentType: 'script',
    category: 'educational',
    metrics: {
      readabilityScore: 85.5,
      grammarScore: 92.0,
      coherenceScore: 88.3,
      creativityScore: 76.8,
      engagementScore: 82.1,
      technicalAccuracy: 94.2,
      brandAlignment: 89.7,
      targetAudienceMatch: 91.3,
      seoScore: 78.9,
      originalityScore: 87.4
    },
    overallScore: 86.6,
    feedback: {
      strengths: [
        'Excelente gramática e estrutura',
        'Conteúdo bem alinhado com a marca',
        'Boa adequação ao público-alvo'
      ],
      improvements: [
        'Pode melhorar a criatividade',
        'Otimizar para SEO',
        'Adicionar mais elementos de engajamento'
      ],
      suggestions: [
        'Considere adicionar mais exemplos práticos',
        'Use mais elementos visuais para aumentar o engajamento',
        'Inclua palavras-chave relevantes para SEO'
      ]
    },
    aiModel: 'gpt-4',
    analysisDate: '2024-01-15T10:30:00Z',
    userId: 'user123',
    processingTime: 2.3,
    confidence: 0.92
  },
  {
    id: 'qm2',
    contentId: 'content2',
    contentType: 'storyboard',
    category: 'commercial',
    metrics: {
      readabilityScore: 78.2,
      grammarScore: 89.5,
      coherenceScore: 91.7,
      creativityScore: 94.1,
      engagementScore: 88.9,
      technicalAccuracy: 87.3,
      brandAlignment: 95.8,
      targetAudienceMatch: 86.4,
      seoScore: 72.6,
      originalityScore: 92.3
    },
    overallScore: 87.7,
    feedback: {
      strengths: [
        'Altamente criativo e original',
        'Excelente alinhamento com a marca',
        'Boa coerência narrativa'
      ],
      improvements: [
        'Melhorar legibilidade',
        'Otimizar para SEO',
        'Ajustar precisão técnica'
      ],
      suggestions: [
        'Simplifique a linguagem para melhor compreensão',
        'Adicione descrições mais técnicas quando necessário',
        'Inclua elementos de SEO no roteiro'
      ]
    },
    aiModel: 'claude-3',
    analysisDate: '2024-01-15T11:45:00Z',
    userId: 'user123',
    processingTime: 3.1,
    confidence: 0.89
  }
];

let benchmarks = {
  script: {
    educational: {
      readabilityScore: { min: 80, target: 90, max: 95 },
      grammarScore: { min: 85, target: 95, max: 98 },
      coherenceScore: { min: 75, target: 85, max: 92 },
      creativityScore: { min: 60, target: 75, max: 85 },
      engagementScore: { min: 70, target: 85, max: 95 },
      technicalAccuracy: { min: 85, target: 95, max: 98 },
      brandAlignment: { min: 80, target: 90, max: 95 },
      targetAudienceMatch: { min: 80, target: 90, max: 95 },
      seoScore: { min: 70, target: 85, max: 95 },
      originalityScore: { min: 70, target: 85, max: 95 }
    },
    commercial: {
      readabilityScore: { min: 75, target: 85, max: 92 },
      grammarScore: { min: 85, target: 95, max: 98 },
      coherenceScore: { min: 80, target: 90, max: 95 },
      creativityScore: { min: 80, target: 90, max: 98 },
      engagementScore: { min: 85, target: 95, max: 98 },
      technicalAccuracy: { min: 75, target: 85, max: 92 },
      brandAlignment: { min: 90, target: 95, max: 98 },
      targetAudienceMatch: { min: 85, target: 92, max: 98 },
      seoScore: { min: 75, target: 90, max: 95 },
      originalityScore: { min: 80, target: 90, max: 95 }
    }
  },
  storyboard: {
    educational: {
      readabilityScore: { min: 75, target: 85, max: 92 },
      grammarScore: { min: 80, target: 90, max: 95 },
      coherenceScore: { min: 85, target: 95, max: 98 },
      creativityScore: { min: 70, target: 85, max: 95 },
      engagementScore: { min: 80, target: 90, max: 95 },
      technicalAccuracy: { min: 80, target: 90, max: 95 },
      brandAlignment: { min: 75, target: 85, max: 92 },
      targetAudienceMatch: { min: 80, target: 90, max: 95 },
      seoScore: { min: 60, target: 75, max: 85 },
      originalityScore: { min: 75, target: 90, max: 98 }
    },
    commercial: {
      readabilityScore: { min: 70, target: 80, max: 90 },
      grammarScore: { min: 80, target: 90, max: 95 },
      coherenceScore: { min: 85, target: 95, max: 98 },
      creativityScore: { min: 85, target: 95, max: 98 },
      engagementScore: { min: 90, target: 95, max: 98 },
      technicalAccuracy: { min: 75, target: 85, max: 92 },
      brandAlignment: { min: 90, target: 95, max: 98 },
      targetAudienceMatch: { min: 85, target: 92, max: 98 },
      seoScore: { min: 65, target: 80, max: 90 },
      originalityScore: { min: 85, target: 95, max: 98 }
    }
  }
};

let analytics = {
  totalAnalyses: 156,
  avgOverallScore: 84.2,
  avgProcessingTime: 2.8,
  modelPerformance: {
    'gpt-4': { analyses: 89, avgScore: 85.1, avgTime: 2.5 },
    'claude-3': { analyses: 67, avgScore: 83.1, avgTime: 3.2 }
  },
  categoryStats: {
    educational: { analyses: 78, avgScore: 83.9 },
    commercial: { analyses: 78, avgScore: 84.5 }
  },
  contentTypeStats: {
    script: { analyses: 89, avgScore: 84.8 },
    storyboard: { analyses: 67, avgScore: 83.4 }
  },
  trendsData: [
    { date: '2024-01-08', analyses: 12, avgScore: 82.1 },
    { date: '2024-01-09', analyses: 15, avgScore: 83.4 },
    { date: '2024-01-10', analyses: 18, avgScore: 84.2 },
    { date: '2024-01-11', analyses: 14, avgScore: 85.1 },
    { date: '2024-01-12', analyses: 16, avgScore: 84.8 },
    { date: '2024-01-13', analyses: 19, avgScore: 85.9 },
    { date: '2024-01-14', analyses: 21, avgScore: 86.2 }
  ]
};

// Funções auxiliares
const generateId = () => {
  return 'qm' + Date.now() + Math.random().toString(36).substr(2, 9);
};

const calculateOverallScore = (metrics) => {
  const weights = {
    readabilityScore: 0.15,
    grammarScore: 0.15,
    coherenceScore: 0.15,
    creativityScore: 0.10,
    engagementScore: 0.15,
    technicalAccuracy: 0.10,
    brandAlignment: 0.10,
    targetAudienceMatch: 0.05,
    seoScore: 0.03,
    originalityScore: 0.02
  };
  
  let totalScore = 0;
  let totalWeight = 0;
  
  Object.entries(metrics).forEach(([metric, score]) => {
    if (weights[metric] && typeof score === 'number') {
      totalScore += score * weights[metric];
      totalWeight += weights[metric];
    }
  });
  
  return totalWeight > 0 ? totalScore / totalWeight : 0;
};

const analyzeContent = async (content, contentType, category) => {
  // Simulação de análise de IA
  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
  
  const baseScores = {
    readabilityScore: 70 + Math.random() * 25,
    grammarScore: 80 + Math.random() * 18,
    coherenceScore: 75 + Math.random() * 20,
    creativityScore: 60 + Math.random() * 35,
    engagementScore: 70 + Math.random() * 25,
    technicalAccuracy: 75 + Math.random() * 20,
    brandAlignment: 70 + Math.random() * 25,
    targetAudienceMatch: 75 + Math.random() * 20,
    seoScore: 60 + Math.random() * 30,
    originalityScore: 70 + Math.random() * 25
  };
  
  // Ajustar scores baseado no tipo de conteúdo e categoria
  if (contentType === 'commercial') {
    baseScores.creativityScore += 10;
    baseScores.engagementScore += 8;
    baseScores.brandAlignment += 12;
  }
  
  if (category === 'educational') {
    baseScores.readabilityScore += 8;
    baseScores.technicalAccuracy += 10;
    baseScores.coherenceScore += 5;
  }
  
  // Normalizar scores para não exceder 100
  Object.keys(baseScores).forEach(key => {
    baseScores[key] = Math.min(100, Math.max(0, baseScores[key]));
  });
  
  return baseScores;
};

const generateFeedback = (metrics, contentType, category) => {
  const benchmark = benchmarks[contentType]?.[category] || {};
  const strengths = [];
  const improvements = [];
  const suggestions = [];
  
  Object.entries(metrics).forEach(([metric, score]) => {
    const bench = benchmark[metric];
    if (!bench) return;
    
    if (score >= bench.target) {
      strengths.push(getStrengthMessage(metric, score));
    } else if (score < bench.min) {
      improvements.push(getImprovementMessage(metric, score));
      suggestions.push(getSuggestionMessage(metric, contentType));
    }
  });
  
  return { strengths, improvements, suggestions };
};

const getStrengthMessage = (metric, score) => {
  const messages = {
    readabilityScore: 'Excelente legibilidade e clareza',
    grammarScore: 'Gramática e ortografia impecáveis',
    coherenceScore: 'Narrativa coerente e bem estruturada',
    creativityScore: 'Conteúdo altamente criativo e original',
    engagementScore: 'Muito envolvente para o público',
    technicalAccuracy: 'Precisão técnica exemplar',
    brandAlignment: 'Perfeito alinhamento com a marca',
    targetAudienceMatch: 'Ideal para o público-alvo',
    seoScore: 'Bem otimizado para SEO',
    originalityScore: 'Conteúdo único e inovador'
  };
  
  return messages[metric] || `Excelente ${metric}`;
};

const getImprovementMessage = (metric, score) => {
  const messages = {
    readabilityScore: 'Melhorar legibilidade e simplicidade',
    grammarScore: 'Revisar gramática e ortografia',
    coherenceScore: 'Aprimorar estrutura e coerência',
    creativityScore: 'Adicionar mais elementos criativos',
    engagementScore: 'Aumentar fatores de engajamento',
    technicalAccuracy: 'Verificar precisão técnica',
    brandAlignment: 'Alinhar melhor com a identidade da marca',
    targetAudienceMatch: 'Ajustar para o público-alvo',
    seoScore: 'Otimizar para mecanismos de busca',
    originalityScore: 'Aumentar originalidade do conteúdo'
  };
  
  return messages[metric] || `Melhorar ${metric}`;
};

const getSuggestionMessage = (metric, contentType) => {
  const suggestions = {
    readabilityScore: {
      script: 'Use frases mais curtas e vocabulário simples',
      storyboard: 'Simplifique as descrições visuais'
    },
    grammarScore: {
      script: 'Use ferramentas de correção gramatical',
      storyboard: 'Revise a gramática nas descrições'
    },
    creativityScore: {
      script: 'Adicione metáforas e elementos narrativos únicos',
      storyboard: 'Explore ângulos e composições inovadoras'
    },
    engagementScore: {
      script: 'Inclua perguntas retóricas e call-to-actions',
      storyboard: 'Adicione elementos visuais impactantes'
    },
    seoScore: {
      script: 'Inclua palavras-chave relevantes naturalmente',
      storyboard: 'Adicione descrições otimizadas para SEO'
    }
  };
  
  return suggestions[metric]?.[contentType] || `Considere melhorar ${metric}`;
};

const updateAnalytics = () => {
  analytics.totalAnalyses = qualityMetrics.length;
  analytics.avgOverallScore = qualityMetrics.reduce((sum, qm) => sum + qm.overallScore, 0) / qualityMetrics.length;
  analytics.avgProcessingTime = qualityMetrics.reduce((sum, qm) => sum + qm.processingTime, 0) / qualityMetrics.length;
  
  // Atualizar estatísticas por modelo
  const modelStats = {};
  qualityMetrics.forEach(qm => {
    if (!modelStats[qm.aiModel]) {
      modelStats[qm.aiModel] = { analyses: 0, totalScore: 0, totalTime: 0 };
    }
    modelStats[qm.aiModel].analyses++;
    modelStats[qm.aiModel].totalScore += qm.overallScore;
    modelStats[qm.aiModel].totalTime += qm.processingTime;
  });
  
  Object.entries(modelStats).forEach(([model, stats]) => {
    analytics.modelPerformance[model] = {
      analyses: stats.analyses,
      avgScore: stats.totalScore / stats.analyses,
      avgTime: stats.totalTime / stats.analyses
    };
  });
};

// Rotas

// Listar métricas de qualidade
router.get('/metrics', authenticateUser, (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      contentType,
      category,
      aiModel,
      minScore,
      maxScore,
      sortBy = 'analysisDate',
      sortOrder = 'desc'
    } = req.query;
    
    let filteredMetrics = [...qualityMetrics];
    
    // Aplicar filtros
    if (contentType) {
      filteredMetrics = filteredMetrics.filter(qm => qm.contentType === contentType);
    }
    
    if (category) {
      filteredMetrics = filteredMetrics.filter(qm => qm.category === category);
    }
    
    if (aiModel) {
      filteredMetrics = filteredMetrics.filter(qm => qm.aiModel === aiModel);
    }
    
    if (minScore) {
      filteredMetrics = filteredMetrics.filter(qm => qm.overallScore >= parseFloat(minScore));
    }
    
    if (maxScore) {
      filteredMetrics = filteredMetrics.filter(qm => qm.overallScore <= parseFloat(maxScore));
    }
    
    // Ordenar
    filteredMetrics.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];
      
      if (sortBy === 'analysisDate') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }
      
      if (sortOrder === 'desc') {
        return bValue > aValue ? 1 : -1;
      } else {
        return aValue > bValue ? 1 : -1;
      }
    });
    
    // Paginação
    const startIndex = (parseInt(page) - 1) * parseInt(limit);
    const endIndex = startIndex + parseInt(limit);
    const paginatedMetrics = filteredMetrics.slice(startIndex, endIndex);
    
    res.json({
      metrics: paginatedMetrics,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(filteredMetrics.length / parseInt(limit)),
        totalItems: filteredMetrics.length,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar métricas de qualidade' });
  }
});

// Obter métrica específica
router.get('/metrics/:id', authenticateUser, (req, res) => {
  try {
    const metric = qualityMetrics.find(qm => qm.id === req.params.id);
    
    if (!metric) {
      return res.status(404).json({ error: 'Métrica não encontrada' });
    }
    
    res.json(metric);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar métrica' });
  }
});

// Analisar conteúdo
router.post('/analyze', authenticateUser, async (req, res) => {
  try {
    const {
      content,
      contentId,
      contentType,
      category,
      aiModel = 'gpt-4'
    } = req.body;
    
    if (!content || !contentType || !category) {
      return res.status(400).json({ error: 'Conteúdo, tipo e categoria são obrigatórios' });
    }
    
    const startTime = Date.now();
    
    // Analisar conteúdo
    const metrics = await analyzeContent(content, contentType, category);
    const overallScore = calculateOverallScore(metrics);
    const feedback = generateFeedback(metrics, contentType, category);
    
    const processingTime = (Date.now() - startTime) / 1000;
    
    const qualityMetric = {
      id: generateId(),
      contentId: contentId || generateId(),
      contentType,
      category,
      metrics,
      overallScore: Math.round(overallScore * 10) / 10,
      feedback,
      aiModel,
      analysisDate: new Date().toISOString(),
      userId: req.user.id,
      processingTime: Math.round(processingTime * 10) / 10,
      confidence: 0.85 + Math.random() * 0.15
    };
    
    qualityMetrics.unshift(qualityMetric);
    updateAnalytics();
    
    res.json(qualityMetric);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao analisar conteúdo' });
  }
});

// Reanalisar conteúdo
router.post('/metrics/:id/reanalyze', authenticateUser, async (req, res) => {
  try {
    const metricIndex = qualityMetrics.findIndex(qm => qm.id === req.params.id);
    
    if (metricIndex === -1) {
      return res.status(404).json({ error: 'Métrica não encontrada' });
    }
    
    const existingMetric = qualityMetrics[metricIndex];
    const { aiModel = existingMetric.aiModel } = req.body;
    
    const startTime = Date.now();
    
    // Reanalisar com o modelo especificado
    const metrics = await analyzeContent('', existingMetric.contentType, existingMetric.category);
    const overallScore = calculateOverallScore(metrics);
    const feedback = generateFeedback(metrics, existingMetric.contentType, existingMetric.category);
    
    const processingTime = (Date.now() - startTime) / 1000;
    
    const updatedMetric = {
      ...existingMetric,
      metrics,
      overallScore: Math.round(overallScore * 10) / 10,
      feedback,
      aiModel,
      analysisDate: new Date().toISOString(),
      processingTime: Math.round(processingTime * 10) / 10,
      confidence: 0.85 + Math.random() * 0.15
    };
    
    qualityMetrics[metricIndex] = updatedMetric;
    updateAnalytics();
    
    res.json(updatedMetric);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao reanalisar conteúdo' });
  }
});

// Deletar métrica
router.delete('/metrics/:id', authenticateUser, (req, res) => {
  try {
    const metricIndex = qualityMetrics.findIndex(qm => qm.id === req.params.id);
    
    if (metricIndex === -1) {
      return res.status(404).json({ error: 'Métrica não encontrada' });
    }
    
    qualityMetrics.splice(metricIndex, 1);
    updateAnalytics();
    
    res.json({ message: 'Métrica deletada com sucesso' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao deletar métrica' });
  }
});

// Obter benchmarks
router.get('/benchmarks', authenticateUser, (req, res) => {
  try {
    const { contentType, category } = req.query;
    
    if (contentType && category) {
      const benchmark = benchmarks[contentType]?.[category];
      if (!benchmark) {
        return res.status(404).json({ error: 'Benchmark não encontrado' });
      }
      res.json(benchmark);
    } else {
      res.json(benchmarks);
    }
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar benchmarks' });
  }
});

// Atualizar benchmarks
router.put('/benchmarks', authenticateUser, (req, res) => {
  try {
    const { contentType, category, metrics: newMetrics } = req.body;
    
    if (!contentType || !category || !newMetrics) {
      return res.status(400).json({ error: 'Tipo de conteúdo, categoria e métricas são obrigatórios' });
    }
    
    if (!benchmarks[contentType]) {
      benchmarks[contentType] = {};
    }
    
    benchmarks[contentType][category] = newMetrics;
    
    res.json({ message: 'Benchmarks atualizados com sucesso' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar benchmarks' });
  }
});

// Obter analytics
router.get('/analytics', authenticateUser, (req, res) => {
  try {
    const { period = '7d' } = req.query;
    
    // Filtrar dados baseado no período
    const days = period === '30d' ? 30 : 7;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    const filteredMetrics = qualityMetrics.filter(qm => 
      new Date(qm.analysisDate) >= cutoffDate
    );
    
    const periodAnalytics = {
      ...analytics,
      totalAnalyses: filteredMetrics.length,
      avgOverallScore: filteredMetrics.length > 0 
        ? filteredMetrics.reduce((sum, qm) => sum + qm.overallScore, 0) / filteredMetrics.length 
        : 0,
      avgProcessingTime: filteredMetrics.length > 0
        ? filteredMetrics.reduce((sum, qm) => sum + qm.processingTime, 0) / filteredMetrics.length
        : 0
    };
    
    res.json(periodAnalytics);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar analytics' });
  }
});

// Comparar métricas
router.post('/compare', authenticateUser, (req, res) => {
  try {
    const { metricIds } = req.body;
    
    if (!metricIds || !Array.isArray(metricIds) || metricIds.length < 2) {
      return res.status(400).json({ error: 'Pelo menos 2 IDs de métricas são necessários' });
    }
    
    const metricsToCompare = qualityMetrics.filter(qm => metricIds.includes(qm.id));
    
    if (metricsToCompare.length !== metricIds.length) {
      return res.status(404).json({ error: 'Uma ou mais métricas não foram encontradas' });
    }
    
    const comparison = {
      metrics: metricsToCompare,
      summary: {
        bestOverallScore: Math.max(...metricsToCompare.map(qm => qm.overallScore)),
        worstOverallScore: Math.min(...metricsToCompare.map(qm => qm.overallScore)),
        avgOverallScore: metricsToCompare.reduce((sum, qm) => sum + qm.overallScore, 0) / metricsToCompare.length,
        bestPerformingModel: null,
        commonStrengths: [],
        commonWeaknesses: []
      }
    };
    
    // Encontrar modelo com melhor performance
    const modelScores = {};
    metricsToCompare.forEach(qm => {
      if (!modelScores[qm.aiModel]) {
        modelScores[qm.aiModel] = [];
      }
      modelScores[qm.aiModel].push(qm.overallScore);
    });
    
    let bestModel = null;
    let bestAvgScore = 0;
    Object.entries(modelScores).forEach(([model, scores]) => {
      const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
      if (avgScore > bestAvgScore) {
        bestAvgScore = avgScore;
        bestModel = model;
      }
    });
    
    comparison.summary.bestPerformingModel = bestModel;
    
    res.json(comparison);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao comparar métricas' });
  }
});

// Exportar métricas
router.get('/export', authenticateUser, (req, res) => {
  try {
    const { format = 'json', contentType, category, startDate, endDate } = req.query;
    
    let filteredMetrics = [...qualityMetrics];
    
    // Aplicar filtros
    if (contentType) {
      filteredMetrics = filteredMetrics.filter(qm => qm.contentType === contentType);
    }
    
    if (category) {
      filteredMetrics = filteredMetrics.filter(qm => qm.category === category);
    }
    
    if (startDate) {
      filteredMetrics = filteredMetrics.filter(qm => 
        new Date(qm.analysisDate) >= new Date(startDate)
      );
    }
    
    if (endDate) {
      filteredMetrics = filteredMetrics.filter(qm => 
        new Date(qm.analysisDate) <= new Date(endDate)
      );
    }
    
    if (format === 'csv') {
      // Converter para CSV
      const csvHeaders = [
        'ID', 'Content Type', 'Category', 'Overall Score', 'AI Model', 
        'Analysis Date', 'Processing Time', 'Confidence'
      ];
      
      const csvRows = filteredMetrics.map(qm => [
        qm.id,
        qm.contentType,
        qm.category,
        qm.overallScore,
        qm.aiModel,
        qm.analysisDate,
        qm.processingTime,
        qm.confidence
      ]);
      
      const csvContent = [csvHeaders, ...csvRows]
        .map(row => row.map(field => `"${field}"`).join(','))
        .join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=quality-metrics.csv');
      res.send(csvContent);
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename=quality-metrics.json');
      res.json({
        exportDate: new Date().toISOString(),
        totalMetrics: filteredMetrics.length,
        metrics: filteredMetrics
      });
    }
  } catch (error) {
    res.status(500).json({ error: 'Erro ao exportar métricas' });
  }
});

module.exports = router;