const express = require('express');
const multer = require('multer');
const router = express.Router();

// Import authentication middleware
const { authenticate } = require('../middleware/auth');

// Configuração do multer para upload de arquivos
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['text/plain', 'application/json', 'text/csv'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de arquivo não suportado'), false);
    }
  }
});

// Simulação de banco de dados em memória
let scripts = [
  {
    id: 'script_001',
    title: 'Introdução ao Marketing Digital',
    description: 'Roteiro educacional sobre conceitos básicos de marketing digital',
    category: 'educational',
    targetAudience: 'Iniciantes em marketing',
    duration: 300, // segundos
    tone: 'professional',
    style: 'educational',
    language: 'pt-BR',
    content: {
      scenes: [
        {
          id: 'scene_001',
          title: 'Abertura',
          duration: 30,
          content: 'Bem-vindos ao curso de Marketing Digital! Hoje vamos explorar os conceitos fundamentais...',
          visualCues: ['Logo da empresa', 'Título do curso'],
          audioNotes: ['Música de fundo suave', 'Narração clara e pausada']
        },
        {
          id: 'scene_002',
          title: 'Definição de Marketing Digital',
          duration: 90,
          content: 'Marketing Digital é o conjunto de estratégias voltadas para a promoção de uma marca...',
          visualCues: ['Gráficos explicativos', 'Ícones de redes sociais'],
          audioNotes: ['Efeitos sonoros sutis', 'Ênfase em palavras-chave']
        }
      ],
      callToAction: 'Inscreva-se no nosso canal para mais conteúdos educacionais!',
      keywords: ['marketing digital', 'estratégias', 'promoção', 'marca'],
      estimatedEngagement: 85
    },
    aiModel: 'gpt-4',
    generationParams: {
      creativity: 0.7,
      formality: 0.8,
      technicality: 0.6
    },
    status: 'completed',
    createdAt: '2024-01-15T10:30:00Z',
    updatedAt: '2024-01-15T10:35:00Z',
    userId: 'user123',
    processingTime: 45.2,
    qualityScore: 92.5
  }
];

let templates = [
  {
    id: 'template_001',
    name: 'Roteiro Educacional Padrão',
    description: 'Template para conteúdos educacionais com estrutura didática',
    category: 'educational',
    structure: {
      introduction: {
        duration: 30,
        elements: ['hook', 'overview', 'objectives']
      },
      development: {
        duration: 240,
        elements: ['main_content', 'examples', 'explanations']
      },
      conclusion: {
        duration: 30,
        elements: ['summary', 'call_to_action']
      }
    },
    prompts: {
      introduction: 'Crie uma introdução envolvente que apresente o tópico {topic} de forma clara e desperte o interesse do público {audience}.',
      development: 'Desenvolva o conteúdo principal sobre {topic}, incluindo explicações detalhadas, exemplos práticos e conceitos importantes.',
      conclusion: 'Finalize com um resumo dos pontos principais e uma chamada para ação relevante.'
    },
    isActive: true,
    createdAt: '2024-01-10T09:00:00Z',
    userId: 'admin'
  },
  {
    id: 'template_002',
    name: 'Roteiro Comercial Persuasivo',
    description: 'Template para conteúdos comerciais focados em conversão',
    category: 'commercial',
    structure: {
      hook: {
        duration: 15,
        elements: ['attention_grabber', 'problem_identification']
      },
      presentation: {
        duration: 180,
        elements: ['solution_presentation', 'benefits', 'social_proof']
      },
      closing: {
        duration: 45,
        elements: ['urgency', 'call_to_action', 'contact_info']
      }
    },
    prompts: {
      hook: 'Crie um gancho inicial que identifique um problema comum do público {audience} relacionado a {topic}.',
      presentation: 'Apresente a solução {solution} destacando os principais benefícios e incluindo prova social.',
      closing: 'Finalize com senso de urgência e uma chamada para ação clara e persuasiva.'
    },
    isActive: true,
    createdAt: '2024-01-12T14:20:00Z',
    userId: 'admin'
  }
];

let generationHistory = [
  {
    id: 'gen_001',
    scriptId: 'script_001',
    prompt: 'Crie um roteiro educacional sobre marketing digital para iniciantes',
    aiModel: 'gpt-4',
    parameters: {
      creativity: 0.7,
      formality: 0.8,
      technicality: 0.6
    },
    processingTime: 45.2,
    tokensUsed: 1250,
    cost: 0.025,
    status: 'completed',
    createdAt: '2024-01-15T10:30:00Z',
    userId: 'user123'
  }
];

let analytics = {
  totalScripts: 1,
  totalGenerations: 1,
  avgProcessingTime: 45.2,
  avgQualityScore: 92.5,
  totalTokensUsed: 1250,
  totalCost: 0.025,
  modelUsage: {
    'gpt-4': { count: 1, avgTime: 45.2, avgScore: 92.5 },
    'claude-3': { count: 0, avgTime: 0, avgScore: 0 },
    'gemini': { count: 0, avgTime: 0, avgScore: 0 }
  },
  categoryStats: {
    educational: { count: 1, avgScore: 92.5 },
    commercial: { count: 0, avgScore: 0 }
  },
  trendsData: [
    { date: '2024-01-15', generations: 1, avgScore: 92.5, avgTime: 45.2 }
  ]
};

// Funções auxiliares
const generateId = () => {
  return 'script_' + Date.now().toString(36) + Math.random().toString(36).substr(2);
};

const generateTemplateId = () => {
  return 'template_' + Date.now().toString(36) + Math.random().toString(36).substr(2);
};

const generateHistoryId = () => {
  return 'gen_' + Date.now().toString(36) + Math.random().toString(36).substr(2);
};

const validateScriptData = (data) => {
  const required = ['title', 'description', 'category', 'targetAudience', 'duration'];
  const missing = required.filter(field => !data[field]);
  
  if (missing.length > 0) {
    throw new Error(`Campos obrigatórios ausentes: ${missing.join(', ')}`);
  }
  
  if (!['educational', 'commercial'].includes(data.category)) {
    throw new Error('Categoria deve ser "educational" ou "commercial"');
  }
  
  if (data.duration < 30 || data.duration > 1800) {
    throw new Error('Duração deve estar entre 30 e 1800 segundos');
  }
};

const simulateAIGeneration = async (prompt, params = {}) => {
  // Simula tempo de processamento
  const processingTime = Math.random() * 30 + 15; // 15-45 segundos
  await new Promise(resolve => setTimeout(resolve, 1000)); // Simula 1 segundo
  
  const scenes = [
    {
      id: 'scene_001',
      title: 'Abertura',
      duration: Math.floor(params.duration * 0.1) || 30,
      content: `Abertura envolvente sobre ${params.topic || 'o tópico principal'}...`,
      visualCues: ['Logo', 'Título', 'Imagem de abertura'],
      audioNotes: ['Música de fundo', 'Narração clara']
    },
    {
      id: 'scene_002',
      title: 'Desenvolvimento',
      duration: Math.floor(params.duration * 0.7) || 180,
      content: `Desenvolvimento detalhado do conteúdo sobre ${params.topic || 'o assunto'}...`,
      visualCues: ['Gráficos', 'Ilustrações', 'Texto explicativo'],
      audioNotes: ['Efeitos sonoros', 'Ênfase em pontos importantes']
    },
    {
      id: 'scene_003',
      title: 'Conclusão',
      duration: Math.floor(params.duration * 0.2) || 60,
      content: 'Conclusão com resumo dos pontos principais e chamada para ação...',
      visualCues: ['Resumo visual', 'Call-to-action', 'Informações de contato'],
      audioNotes: ['Música de encerramento', 'Tom conclusivo']
    }
  ];
  
  return {
    scenes,
    callToAction: params.category === 'commercial' 
      ? 'Entre em contato conosco hoje mesmo!' 
      : 'Inscreva-se para mais conteúdos educacionais!',
    keywords: extractKeywords(prompt),
    estimatedEngagement: Math.floor(Math.random() * 20) + 80, // 80-100
    processingTime,
    tokensUsed: Math.floor(Math.random() * 500) + 800, // 800-1300
    qualityScore: Math.floor(Math.random() * 15) + 85 // 85-100
  };
};

const extractKeywords = (text) => {
  const commonWords = ['o', 'a', 'de', 'para', 'com', 'em', 'um', 'uma', 'do', 'da', 'e', 'que', 'se'];
  const words = text.toLowerCase().split(/\W+/).filter(word => 
    word.length > 3 && !commonWords.includes(word)
  );
  return [...new Set(words)].slice(0, 10);
};

const updateAnalytics = (script, generation) => {
  analytics.totalScripts = scripts.length;
  analytics.totalGenerations = generationHistory.length;
  analytics.avgProcessingTime = generationHistory.reduce((sum, gen) => sum + gen.processingTime, 0) / generationHistory.length;
  analytics.avgQualityScore = scripts.reduce((sum, script) => sum + (script.qualityScore || 0), 0) / scripts.length;
  analytics.totalTokensUsed = generationHistory.reduce((sum, gen) => sum + gen.tokensUsed, 0);
  analytics.totalCost = generationHistory.reduce((sum, gen) => sum + gen.cost, 0);
  
  // Atualizar estatísticas por modelo
  const modelStats = {};
  generationHistory.forEach(gen => {
    if (!modelStats[gen.aiModel]) {
      modelStats[gen.aiModel] = { count: 0, totalTime: 0, totalScore: 0 };
    }
    modelStats[gen.aiModel].count++;
    modelStats[gen.aiModel].totalTime += gen.processingTime;
    
    const relatedScript = scripts.find(s => s.id === gen.scriptId);
    if (relatedScript && relatedScript.qualityScore) {
      modelStats[gen.aiModel].totalScore += relatedScript.qualityScore;
    }
  });
  
  Object.keys(modelStats).forEach(model => {
    const stats = modelStats[model];
    analytics.modelUsage[model] = {
      count: stats.count,
      avgTime: stats.totalTime / stats.count,
      avgScore: stats.totalScore / stats.count
    };
  });
  
  // Atualizar estatísticas por categoria
  const categoryStats = {};
  scripts.forEach(script => {
    if (!categoryStats[script.category]) {
      categoryStats[script.category] = { count: 0, totalScore: 0 };
    }
    categoryStats[script.category].count++;
    if (script.qualityScore) {
      categoryStats[script.category].totalScore += script.qualityScore;
    }
  });
  
  Object.keys(categoryStats).forEach(category => {
    const stats = categoryStats[category];
    analytics.categoryStats[category] = {
      count: stats.count,
      avgScore: stats.totalScore / stats.count
    };
  });
};

// Rotas

// Listar roteiros
router.get('/scripts', authenticate, (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      category,
      status,
      aiModel,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;
    
    let filteredScripts = scripts.filter(script => {
      if (category && script.category !== category) return false;
      if (status && script.status !== status) return false;
      if (aiModel && script.aiModel !== aiModel) return false;
      return true;
    });
    
    // Ordenação
    filteredScripts.sort((a, b) => {
      const aVal = a[sortBy];
      const bVal = b[sortBy];
      const order = sortOrder === 'desc' ? -1 : 1;
      
      if (aVal < bVal) return -1 * order;
      if (aVal > bVal) return 1 * order;
      return 0;
    });
    
    // Paginação
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedScripts = filteredScripts.slice(startIndex, endIndex);
    
    res.json({
      scripts: paginatedScripts,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(filteredScripts.length / limit),
        totalItems: filteredScripts.length,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obter roteiro específico
router.get('/scripts/:id', authenticate, (req, res) => {
  try {
    const script = scripts.find(s => s.id === req.params.id);
    
    if (!script) {
      return res.status(404).json({ error: 'Roteiro não encontrado' });
    }
    
    res.json(script);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Gerar novo roteiro
router.post('/scripts/generate', authenticate, async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      targetAudience,
      duration,
      tone = 'professional',
      style = 'standard',
      language = 'pt-BR',
      aiModel = 'gpt-4',
      templateId,
      customPrompt,
      generationParams = {}
    } = req.body;
    
    validateScriptData(req.body);
    
    const startTime = Date.now();
    
    // Construir prompt baseado no template ou prompt customizado
    let prompt = customPrompt;
    if (!prompt && templateId) {
      const template = templates.find(t => t.id === templateId);
      if (template) {
        prompt = Object.values(template.prompts).join(' ');
        prompt = prompt.replace(/{topic}/g, description)
                      .replace(/{audience}/g, targetAudience);
      }
    }
    
    if (!prompt) {
      prompt = `Crie um roteiro ${category} sobre "${description}" para o público ${targetAudience}, com duração de ${duration} segundos, em tom ${tone}.`;
    }
    
    // Simular geração com IA
    const aiResult = await simulateAIGeneration(prompt, {
      ...generationParams,
      topic: description,
      category,
      duration
    });
    
    const processingTime = (Date.now() - startTime) / 1000;
    
    const newScript = {
      id: generateId(),
      title,
      description,
      category,
      targetAudience,
      duration,
      tone,
      style,
      language,
      content: {
        scenes: aiResult.scenes,
        callToAction: aiResult.callToAction,
        keywords: aiResult.keywords,
        estimatedEngagement: aiResult.estimatedEngagement
      },
      aiModel,
      generationParams,
      status: 'completed',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      userId: req.user.id,
      processingTime: aiResult.processingTime,
      qualityScore: aiResult.qualityScore
    };
    
    scripts.unshift(newScript);
    
    // Registrar no histórico
    const historyEntry = {
      id: generateHistoryId(),
      scriptId: newScript.id,
      prompt,
      aiModel,
      parameters: generationParams,
      processingTime: aiResult.processingTime,
      tokensUsed: aiResult.tokensUsed,
      cost: aiResult.tokensUsed * 0.00002, // Simulação de custo
      status: 'completed',
      createdAt: new Date().toISOString(),
      userId: req.user.id
    };
    
    generationHistory.unshift(historyEntry);
    
    // Atualizar analytics
    updateAnalytics();
    
    res.status(201).json(newScript);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Regenerar roteiro
router.post('/scripts/:id/regenerate', authenticate, async (req, res) => {
  try {
    const script = scripts.find(s => s.id === req.params.id);
    
    if (!script) {
      return res.status(404).json({ error: 'Roteiro não encontrado' });
    }
    
    const {
      aiModel = script.aiModel,
      generationParams = script.generationParams,
      customPrompt
    } = req.body;
    
    const startTime = Date.now();
    
    let prompt = customPrompt || 
      `Recrie o roteiro "${script.title}" sobre "${script.description}" para o público ${script.targetAudience}, com duração de ${script.duration} segundos.`;
    
    // Simular regeneração com IA
    const aiResult = await simulateAIGeneration(prompt, {
      ...generationParams,
      topic: script.description,
      category: script.category,
      duration: script.duration
    });
    
    // Atualizar script
    script.content = {
      scenes: aiResult.scenes,
      callToAction: aiResult.callToAction,
      keywords: aiResult.keywords,
      estimatedEngagement: aiResult.estimatedEngagement
    };
    script.aiModel = aiModel;
    script.generationParams = generationParams;
    script.updatedAt = new Date().toISOString();
    script.processingTime = aiResult.processingTime;
    script.qualityScore = aiResult.qualityScore;
    
    // Registrar no histórico
    const historyEntry = {
      id: generateHistoryId(),
      scriptId: script.id,
      prompt,
      aiModel,
      parameters: generationParams,
      processingTime: aiResult.processingTime,
      tokensUsed: aiResult.tokensUsed,
      cost: aiResult.tokensUsed * 0.00002,
      status: 'completed',
      createdAt: new Date().toISOString(),
      userId: req.user.id
    };
    
    generationHistory.unshift(historyEntry);
    
    // Atualizar analytics
    updateAnalytics();
    
    res.json(script);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Atualizar roteiro
router.put('/scripts/:id', authenticate, (req, res) => {
  try {
    const script = scripts.find(s => s.id === req.params.id);
    
    if (!script) {
      return res.status(404).json({ error: 'Roteiro não encontrado' });
    }
    
    const allowedFields = ['title', 'description', 'targetAudience', 'tone', 'style', 'content'];
    
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        script[field] = req.body[field];
      }
    });
    
    script.updatedAt = new Date().toISOString();
    
    res.json(script);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Deletar roteiro
router.delete('/scripts/:id', authenticate, (req, res) => {
  try {
    const index = scripts.findIndex(s => s.id === req.params.id);
    
    if (index === -1) {
      return res.status(404).json({ error: 'Roteiro não encontrado' });
    }
    
    scripts.splice(index, 1);
    
    // Remover do histórico
    generationHistory = generationHistory.filter(h => h.scriptId !== req.params.id);
    
    // Atualizar analytics
    updateAnalytics();
    
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Duplicar roteiro
router.post('/scripts/:id/duplicate', authenticate, (req, res) => {
  try {
    const originalScript = scripts.find(s => s.id === req.params.id);
    
    if (!originalScript) {
      return res.status(404).json({ error: 'Roteiro não encontrado' });
    }
    
    const { title } = req.body;
    
    const duplicatedScript = {
      ...originalScript,
      id: generateId(),
      title: title || `${originalScript.title} (Cópia)`,
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      userId: req.user.id
    };
    
    scripts.unshift(duplicatedScript);
    
    res.status(201).json(duplicatedScript);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Exportar roteiro
router.get('/scripts/:id/export', authenticate, (req, res) => {
  try {
    const script = scripts.find(s => s.id === req.params.id);
    
    if (!script) {
      return res.status(404).json({ error: 'Roteiro não encontrado' });
    }
    
    const { format = 'json' } = req.query;
    
    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${script.title}.json"`);
      res.json(script);
    } else if (format === 'txt') {
      let content = `${script.title}\n\n`;
      content += `Descrição: ${script.description}\n`;
      content += `Categoria: ${script.category}\n`;
      content += `Público-alvo: ${script.targetAudience}\n`;
      content += `Duração: ${script.duration} segundos\n\n`;
      
      script.content.scenes.forEach((scene, index) => {
        content += `Cena ${index + 1}: ${scene.title}\n`;
        content += `Duração: ${scene.duration}s\n`;
        content += `Conteúdo: ${scene.content}\n`;
        content += `Elementos visuais: ${scene.visualCues.join(', ')}\n`;
        content += `Notas de áudio: ${scene.audioNotes.join(', ')}\n\n`;
      });
      
      content += `Call to Action: ${script.content.callToAction}\n`;
      
      res.setHeader('Content-Type', 'text/plain');
      res.setHeader('Content-Disposition', `attachment; filename="${script.title}.txt"`);
      res.send(content);
    } else {
      res.status(400).json({ error: 'Formato não suportado' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Listar templates
router.get('/templates', authenticate, (req, res) => {
  try {
    const { category, isActive } = req.query;
    
    let filteredTemplates = templates.filter(template => {
      if (category && template.category !== category) return false;
      if (isActive !== undefined && template.isActive !== (isActive === 'true')) return false;
      return true;
    });
    
    res.json(filteredTemplates);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obter template específico
router.get('/templates/:id', authenticate, (req, res) => {
  try {
    const template = templates.find(t => t.id === req.params.id);
    
    if (!template) {
      return res.status(404).json({ error: 'Template não encontrado' });
    }
    
    res.json(template);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Criar template
router.post('/templates', authenticate, (req, res) => {
  try {
    const {
      name,
      description,
      category,
      structure,
      prompts,
      isActive = true
    } = req.body;
    
    if (!name || !description || !category || !structure || !prompts) {
      return res.status(400).json({ error: 'Campos obrigatórios ausentes' });
    }
    
    const newTemplate = {
      id: generateTemplateId(),
      name,
      description,
      category,
      structure,
      prompts,
      isActive,
      createdAt: new Date().toISOString(),
      userId: req.user.id
    };
    
    templates.unshift(newTemplate);
    
    res.status(201).json(newTemplate);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Atualizar template
router.put('/templates/:id', authenticate, (req, res) => {
  try {
    const template = templates.find(t => t.id === req.params.id);
    
    if (!template) {
      return res.status(404).json({ error: 'Template não encontrado' });
    }
    
    const allowedFields = ['name', 'description', 'category', 'structure', 'prompts', 'isActive'];
    
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        template[field] = req.body[field];
      }
    });
    
    res.json(template);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Deletar template
router.delete('/templates/:id', authenticate, (req, res) => {
  try {
    const index = templates.findIndex(t => t.id === req.params.id);
    
    if (index === -1) {
      return res.status(404).json({ error: 'Template não encontrado' });
    }
    
    templates.splice(index, 1);
    
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obter histórico de gerações
router.get('/history', authenticate, (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      aiModel,
      status,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;
    
    let filteredHistory = generationHistory.filter(entry => {
      if (aiModel && entry.aiModel !== aiModel) return false;
      if (status && entry.status !== status) return false;
      return true;
    });
    
    // Ordenação
    filteredHistory.sort((a, b) => {
      const aVal = a[sortBy];
      const bVal = b[sortBy];
      const order = sortOrder === 'desc' ? -1 : 1;
      
      if (aVal < bVal) return -1 * order;
      if (aVal > bVal) return 1 * order;
      return 0;
    });
    
    // Paginação
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedHistory = filteredHistory.slice(startIndex, endIndex);
    
    res.json({
      history: paginatedHistory,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(filteredHistory.length / limit),
        totalItems: filteredHistory.length,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obter analytics
router.get('/analytics', authenticate, (req, res) => {
  try {
    res.json(analytics);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Importar roteiros
router.post('/import', authenticate, upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Arquivo não fornecido' });
    }
    
    const fileContent = req.file.buffer.toString('utf8');
    let importedScripts;
    
    try {
      importedScripts = JSON.parse(fileContent);
    } catch (parseError) {
      return res.status(400).json({ error: 'Arquivo JSON inválido' });
    }
    
    if (!Array.isArray(importedScripts)) {
      importedScripts = [importedScripts];
    }
    
    const results = {
      imported: 0,
      skipped: 0,
      errors: []
    };
    
    importedScripts.forEach((scriptData, index) => {
      try {
        validateScriptData(scriptData);
        
        const newScript = {
          ...scriptData,
          id: generateId(),
          status: 'imported',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          userId: req.user.id
        };
        
        scripts.unshift(newScript);
        results.imported++;
      } catch (error) {
        results.errors.push(`Linha ${index + 1}: ${error.message}`);
        results.skipped++;
      }
    });
    
    // Atualizar analytics
    updateAnalytics();
    
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;