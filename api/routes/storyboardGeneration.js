const express = require('express');
const multer = require('multer');
const { authenticate } = require('../middleware/auth.js');
const router = express.Router();

// Configuração do multer para upload de imagens
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Apenas arquivos de imagem são permitidos'), false);
    }
  }
});

// Simulação de banco de dados em memória
let storyboards = [
  {
    id: '1',
    title: 'Storyboard Educacional - Matemática',
    description: 'Storyboard para vídeo educacional sobre frações',
    scriptId: '1',
    status: 'completed',
    frames: [
      {
        id: 'frame-1',
        sequence: 1,
        title: 'Introdução',
        description: 'Professor apresentando o conceito de frações',
        visualDescription: 'Plano médio do professor em frente ao quadro com exemplos de frações',
        duration: 15,
        shotType: 'medium',
        cameraAngle: 'eye-level',
        lighting: 'natural',
        audioNotes: ['Narração clara e pausada', 'Música de fundo suave'],
        visualElements: ['Quadro branco', 'Marcadores coloridos', 'Exemplos visuais'],
        transitions: 'fade-in',
        imageUrl: null,
        generatedAt: new Date().toISOString()
      },
      {
        id: 'frame-2',
        sequence: 2,
        title: 'Exemplo Prático',
        description: 'Demonstração visual com pizza dividida',
        visualDescription: 'Close-up de uma pizza sendo dividida em fatias iguais',
        duration: 20,
        shotType: 'close-up',
        cameraAngle: 'top-down',
        lighting: 'studio',
        audioNotes: ['Explicação detalhada', 'Som ambiente da cozinha'],
        visualElements: ['Pizza real', 'Faca', 'Pratos'],
        transitions: 'cut',
        imageUrl: null,
        generatedAt: new Date().toISOString()
      }
    ],
    style: 'educational',
    aspectRatio: '16:9',
    totalDuration: 35,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    userId: 1
  }
];

let storyboardTemplates = [
  {
    id: '1',
    name: 'Template Educacional',
    description: 'Template para vídeos educacionais',
    category: 'educational',
    frameTemplates: [
      {
        title: 'Introdução',
        shotType: 'medium',
        cameraAngle: 'eye-level',
        lighting: 'natural',
        duration: 10
      },
      {
        title: 'Desenvolvimento',
        shotType: 'close-up',
        cameraAngle: 'slight-high',
        lighting: 'studio',
        duration: 20
      },
      {
        title: 'Conclusão',
        shotType: 'wide',
        cameraAngle: 'eye-level',
        lighting: 'natural',
        duration: 10
      }
    ],
    isActive: true,
    createdAt: new Date().toISOString()
  }
];

let generationHistory = [];
let analytics = {
  totalGenerated: 1,
  averageFrames: 2,
  popularStyles: {
    educational: 1,
    commercial: 0,
    entertainment: 0
  },
  averageDuration: 35,
  generationTrends: [
    { date: new Date().toISOString().split('T')[0], count: 1 }
  ]
};

// Funções auxiliares
const generateId = () => Math.random().toString(36).substr(2, 9);

const validateStoryboardData = (data) => {
  const errors = [];
  
  if (!data.title || data.title.trim().length === 0) {
    errors.push('Título é obrigatório');
  }
  
  if (!data.scriptId) {
    errors.push('ID do roteiro é obrigatório');
  }
  
  return errors;
};

const simulateAIStoryboardGeneration = async (scriptContent, options = {}) => {
  // Simulação de geração de storyboard com IA
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  const frames = [];
  const scenes = scriptContent.scenes || [];
  
  scenes.forEach((scene, index) => {
    const frame = {
      id: generateId(),
      sequence: index + 1,
      title: scene.title || `Cena ${index + 1}`,
      description: scene.content,
      visualDescription: generateVisualDescription(scene.content, options.style),
      duration: scene.duration || 15,
      shotType: determineShotType(scene.content),
      cameraAngle: determineCameraAngle(scene.content),
      lighting: determineLighting(options.style),
      audioNotes: generateAudioNotes(scene),
      visualElements: extractVisualElements(scene.content),
      transitions: determineTransition(index, scenes.length),
      imageUrl: null,
      generatedAt: new Date().toISOString()
    };
    
    frames.push(frame);
  });
  
  return frames;
};

const generateVisualDescription = (content, style) => {
  const descriptions = {
    educational: [
      'Plano médio com foco no apresentador',
      'Close-up dos materiais didáticos',
      'Plano geral da sala de aula',
      'Detalhe das anotações no quadro'
    ],
    commercial: [
      'Produto em destaque com iluminação dramática',
      'Cliente satisfeito usando o produto',
      'Comparação visual com concorrentes',
      'Call-to-action com elementos gráficos'
    ],
    entertainment: [
      'Ação dinâmica com movimento de câmera',
      'Reação emocional dos personagens',
      'Ambiente imersivo e atmosférico',
      'Transição criativa entre cenas'
    ]
  };
  
  const styleDescriptions = descriptions[style] || descriptions.educational;
  return styleDescriptions[Math.floor(Math.random() * styleDescriptions.length)];
};

const determineShotType = (content) => {
  const shotTypes = ['wide', 'medium', 'close-up', 'extreme-close-up'];
  
  if (content.includes('detalhe') || content.includes('close')) {
    return 'close-up';
  } else if (content.includes('ambiente') || content.includes('cenário')) {
    return 'wide';
  } else {
    return 'medium';
  }
};

const determineCameraAngle = (content) => {
  const angles = ['eye-level', 'high-angle', 'low-angle', 'bird-eye', 'worm-eye'];
  
  if (content.includes('autoridade') || content.includes('poder')) {
    return 'low-angle';
  } else if (content.includes('vulnerabilidade') || content.includes('pequeno')) {
    return 'high-angle';
  } else {
    return 'eye-level';
  }
};

const determineLighting = (style) => {
  const lightingOptions = {
    educational: 'natural',
    commercial: 'studio',
    entertainment: 'dramatic'
  };
  
  return lightingOptions[style] || 'natural';
};

const generateAudioNotes = (scene) => {
  const notes = ['Narração clara'];
  
  if (scene.audioNotes && scene.audioNotes.length > 0) {
    notes.push(...scene.audioNotes);
  } else {
    notes.push('Música de fundo adequada ao tom');
  }
  
  return notes;
};

const extractVisualElements = (content) => {
  const elements = [];
  const keywords = ['quadro', 'mesa', 'livro', 'computador', 'produto', 'pessoa'];
  
  keywords.forEach(keyword => {
    if (content.toLowerCase().includes(keyword)) {
      elements.push(keyword);
    }
  });
  
  return elements.length > 0 ? elements : ['Elementos visuais relevantes'];
};

const determineTransition = (index, total) => {
  if (index === 0) return 'fade-in';
  if (index === total - 1) return 'fade-out';
  
  const transitions = ['cut', 'fade', 'dissolve', 'wipe'];
  return transitions[Math.floor(Math.random() * transitions.length)];
};

const updateAnalytics = (action, data) => {
  const today = new Date().toISOString().split('T')[0];
  
  switch (action) {
    case 'generate':
      analytics.totalGenerated++;
      analytics.averageFrames = Math.round(
        (analytics.averageFrames * (analytics.totalGenerated - 1) + data.frames.length) / analytics.totalGenerated
      );
      analytics.averageDuration = Math.round(
        (analytics.averageDuration * (analytics.totalGenerated - 1) + data.totalDuration) / analytics.totalGenerated
      );
      
      if (analytics.popularStyles[data.style]) {
        analytics.popularStyles[data.style]++;
      } else {
        analytics.popularStyles[data.style] = 1;
      }
      
      const existingTrend = analytics.generationTrends.find(t => t.date === today);
      if (existingTrend) {
        existingTrend.count++;
      } else {
        analytics.generationTrends.push({ date: today, count: 1 });
      }
      break;
  }
};

// Rotas

// Listar storyboards
router.get('/', authenticate, (req, res) => {
  try {
    const { page = 1, limit = 10, status, style, search } = req.query;
    let filteredStoryboards = [...storyboards];
    
    // Filtros
    if (status) {
      filteredStoryboards = filteredStoryboards.filter(s => s.status === status);
    }
    
    if (style) {
      filteredStoryboards = filteredStoryboards.filter(s => s.style === style);
    }
    
    if (search) {
      const searchLower = search.toLowerCase();
      filteredStoryboards = filteredStoryboards.filter(s => 
        s.title.toLowerCase().includes(searchLower) ||
        s.description.toLowerCase().includes(searchLower)
      );
    }
    
    // Paginação
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedStoryboards = filteredStoryboards.slice(startIndex, endIndex);
    
    res.json({
      storyboards: paginatedStoryboards,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(filteredStoryboards.length / limit),
        count: filteredStoryboards.length
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Obter storyboard específico
router.get('/:id', authenticate, (req, res) => {
  try {
    const storyboard = storyboards.find(s => s.id === req.params.id);
    
    if (!storyboard) {
      return res.status(404).json({ error: 'Storyboard não encontrado' });
    }
    
    res.json(storyboard);
  } catch (error) {
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Gerar novo storyboard
router.post('/generate', authenticate, async (req, res) => {
  try {
    const { scriptId, title, description, style = 'educational', aspectRatio = '16:9', options = {} } = req.body;
    
    const validationErrors = validateStoryboardData({ title, scriptId });
    if (validationErrors.length > 0) {
      return res.status(400).json({ errors: validationErrors });
    }
    
    // Simular busca do roteiro
    const scriptContent = {
      scenes: [
        {
          title: 'Introdução',
          content: 'Apresentação do tópico principal',
          duration: 15,
          audioNotes: ['Narração clara']
        },
        {
          title: 'Desenvolvimento',
          content: 'Explicação detalhada com exemplos',
          duration: 25,
          audioNotes: ['Música de fundo']
        }
      ]
    };
    
    const frames = await simulateAIStoryboardGeneration(scriptContent, { style, ...options });
    
    const newStoryboard = {
      id: generateId(),
      title,
      description,
      scriptId,
      status: 'completed',
      frames,
      style,
      aspectRatio,
      totalDuration: frames.reduce((sum, frame) => sum + frame.duration, 0),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      userId: req.user.id
    };
    
    storyboards.unshift(newStoryboard);
    
    // Adicionar ao histórico
    generationHistory.unshift({
      id: generateId(),
      storyboardId: newStoryboard.id,
      action: 'generate',
      parameters: { style, aspectRatio, options },
      result: 'success',
      framesGenerated: frames.length,
      processingTime: 2000,
      createdAt: new Date().toISOString(),
      userId: req.user.id
    });
    
    // Atualizar analytics
    updateAnalytics('generate', newStoryboard);
    
    res.status(201).json(newStoryboard);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao gerar storyboard' });
  }
});

// Regenerar frames específicos
router.post('/:id/regenerate-frames', authenticate, async (req, res) => {
  try {
    const { frameIds, options = {} } = req.body;
    const storyboard = storyboards.find(s => s.id === req.params.id);
    
    if (!storyboard) {
      return res.status(404).json({ error: 'Storyboard não encontrado' });
    }
    
    // Simular regeneração de frames específicos
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    frameIds.forEach(frameId => {
      const frameIndex = storyboard.frames.findIndex(f => f.id === frameId);
      if (frameIndex !== -1) {
        const frame = storyboard.frames[frameIndex];
        frame.visualDescription = generateVisualDescription(frame.description, storyboard.style);
        frame.generatedAt = new Date().toISOString();
      }
    });
    
    storyboard.updatedAt = new Date().toISOString();
    
    // Adicionar ao histórico
    generationHistory.unshift({
      id: generateId(),
      storyboardId: storyboard.id,
      action: 'regenerate_frames',
      parameters: { frameIds, options },
      result: 'success',
      framesGenerated: frameIds.length,
      processingTime: 1500,
      createdAt: new Date().toISOString(),
      userId: req.user.id
    });
    
    res.json(storyboard);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao regenerar frames' });
  }
});

// Atualizar storyboard
router.put('/:id', authenticate, (req, res) => {
  try {
    const storyboardIndex = storyboards.findIndex(s => s.id === req.params.id);
    
    if (storyboardIndex === -1) {
      return res.status(404).json({ error: 'Storyboard não encontrado' });
    }
    
    const { title, description, frames } = req.body;
    const storyboard = storyboards[storyboardIndex];
    
    if (title) storyboard.title = title;
    if (description) storyboard.description = description;
    if (frames) {
      storyboard.frames = frames;
      storyboard.totalDuration = frames.reduce((sum, frame) => sum + frame.duration, 0);
    }
    
    storyboard.updatedAt = new Date().toISOString();
    
    res.json(storyboard);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar storyboard' });
  }
});

// Deletar storyboard
router.delete('/:id', authenticate, (req, res) => {
  try {
    const storyboardIndex = storyboards.findIndex(s => s.id === req.params.id);
    
    if (storyboardIndex === -1) {
      return res.status(404).json({ error: 'Storyboard não encontrado' });
    }
    
    storyboards.splice(storyboardIndex, 1);
    
    res.json({ message: 'Storyboard deletado com sucesso' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao deletar storyboard' });
  }
});

// Duplicar storyboard
router.post('/:id/duplicate', authenticate, (req, res) => {
  try {
    const originalStoryboard = storyboards.find(s => s.id === req.params.id);
    
    if (!originalStoryboard) {
      return res.status(404).json({ error: 'Storyboard não encontrado' });
    }
    
    const duplicatedStoryboard = {
      ...originalStoryboard,
      id: generateId(),
      title: `${originalStoryboard.title} (Cópia)`,
      frames: originalStoryboard.frames.map(frame => ({
        ...frame,
        id: generateId()
      })),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      userId: req.user.id
    };
    
    storyboards.unshift(duplicatedStoryboard);
    
    res.status(201).json(duplicatedStoryboard);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao duplicar storyboard' });
  }
});

// Exportar storyboard
router.get('/:id/export', authenticate, (req, res) => {
  try {
    const { format = 'json' } = req.query;
    const storyboard = storyboards.find(s => s.id === req.params.id);
    
    if (!storyboard) {
      return res.status(404).json({ error: 'Storyboard não encontrado' });
    }
    
    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="storyboard-${storyboard.id}.json"`);
      res.json(storyboard);
    } else if (format === 'pdf') {
      // Simulação de exportação PDF
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="storyboard-${storyboard.id}.pdf"`);
      res.send('PDF content would be here');
    } else {
      res.status(400).json({ error: 'Formato não suportado' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Erro ao exportar storyboard' });
  }
});

// Upload de imagem para frame
router.post('/:id/frames/:frameId/image', authenticate, upload.single('image'), (req, res) => {
  try {
    const storyboard = storyboards.find(s => s.id === req.params.id);
    
    if (!storyboard) {
      return res.status(404).json({ error: 'Storyboard não encontrado' });
    }
    
    const frame = storyboard.frames.find(f => f.id === req.params.frameId);
    
    if (!frame) {
      return res.status(404).json({ error: 'Frame não encontrado' });
    }
    
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhuma imagem enviada' });
    }
    
    // Simular salvamento da imagem
    const imageUrl = `/uploads/storyboards/${storyboard.id}/${frame.id}.${req.file.mimetype.split('/')[1]}`;
    frame.imageUrl = imageUrl;
    
    storyboard.updatedAt = new Date().toISOString();
    
    res.json({ imageUrl, frame });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao fazer upload da imagem' });
  }
});

// Listar templates
router.get('/templates/list', authenticate, (req, res) => {
  try {
    const { category, active } = req.query;
    let filteredTemplates = [...storyboardTemplates];
    
    if (category) {
      filteredTemplates = filteredTemplates.filter(t => t.category === category);
    }
    
    if (active !== undefined) {
      filteredTemplates = filteredTemplates.filter(t => t.isActive === (active === 'true'));
    }
    
    res.json(filteredTemplates);
  } catch (error) {
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Obter template específico
router.get('/templates/:id', authenticate, (req, res) => {
  try {
    const template = storyboardTemplates.find(t => t.id === req.params.id);
    
    if (!template) {
      return res.status(404).json({ error: 'Template não encontrado' });
    }
    
    res.json(template);
  } catch (error) {
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Criar template
router.post('/templates', authenticate, (req, res) => {
  try {
    const { name, description, category, frameTemplates, isActive = true } = req.body;
    
    if (!name || !category || !frameTemplates) {
      return res.status(400).json({ error: 'Dados obrigatórios não fornecidos' });
    }
    
    const newTemplate = {
      id: generateId(),
      name,
      description,
      category,
      frameTemplates,
      isActive,
      createdAt: new Date().toISOString()
    };
    
    storyboardTemplates.unshift(newTemplate);
    
    res.status(201).json(newTemplate);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar template' });
  }
});

// Atualizar template
router.put('/templates/:id', authenticate, (req, res) => {
  try {
    const templateIndex = storyboardTemplates.findIndex(t => t.id === req.params.id);
    
    if (templateIndex === -1) {
      return res.status(404).json({ error: 'Template não encontrado' });
    }
    
    const { name, description, category, frameTemplates, isActive } = req.body;
    const template = storyboardTemplates[templateIndex];
    
    if (name) template.name = name;
    if (description) template.description = description;
    if (category) template.category = category;
    if (frameTemplates) template.frameTemplates = frameTemplates;
    if (isActive !== undefined) template.isActive = isActive;
    
    res.json(template);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar template' });
  }
});

// Deletar template
router.delete('/templates/:id', authenticate, (req, res) => {
  try {
    const templateIndex = storyboardTemplates.findIndex(t => t.id === req.params.id);
    
    if (templateIndex === -1) {
      return res.status(404).json({ error: 'Template não encontrado' });
    }
    
    storyboardTemplates.splice(templateIndex, 1);
    
    res.json({ message: 'Template deletado com sucesso' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao deletar template' });
  }
});

// Obter histórico de gerações
router.get('/history/generations', authenticate, (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedHistory = generationHistory.slice(startIndex, endIndex);
    
    res.json({
      history: paginatedHistory,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(generationHistory.length / limit),
        count: generationHistory.length
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Obter analytics
router.get('/analytics/overview', authenticate, (req, res) => {
  try {
    res.json(analytics);
  } catch (error) {
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;