const express = require('express');
const multer = require('multer');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Configuração do multer para upload de arquivos
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/json', 'text/plain'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de arquivo não suportado'), false);
    }
  }
});

// Simulação de banco de dados em memória
let templates = [
  {
    id: '1',
    name: 'Roteiro de Vídeo Educativo',
    description: 'Template para criação de roteiros de vídeos educativos',
    category: 'video',
    type: 'script',
    content: 'Crie um roteiro para um vídeo educativo sobre {{topic}}. O vídeo deve ter {{duration}} minutos e ser direcionado para {{audience}}. Inclua: 1) Introdução cativante, 2) Desenvolvimento do conteúdo, 3) Exemplos práticos, 4) Conclusão com call-to-action.',
    variables: [
      { name: 'topic', type: 'text', required: true, description: 'Tópico principal do vídeo' },
      { name: 'duration', type: 'number', required: true, description: 'Duração em minutos' },
      { name: 'audience', type: 'select', required: true, options: ['Iniciantes', 'Intermediário', 'Avançado'], description: 'Público-alvo' }
    ],
    tags: ['educativo', 'roteiro', 'vídeo'],
    isPublic: true,
    createdBy: 'user1',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
    usageCount: 45,
    rating: 4.8,
    version: '1.0'
  },
  {
    id: '2',
    name: 'Storyboard Comercial',
    description: 'Template para criação de storyboards de comerciais',
    category: 'video',
    type: 'storyboard',
    content: 'Crie um storyboard detalhado para um comercial de {{product}} com duração de {{duration}} segundos. O comercial deve destacar {{benefits}} e ter tom {{tone}}. Para cada cena, descreva: 1) Descrição visual, 2) Ação/movimento, 3) Texto/narração, 4) Duração da cena.',
    variables: [
      { name: 'product', type: 'text', required: true, description: 'Nome do produto/serviço' },
      { name: 'duration', type: 'number', required: true, description: 'Duração em segundos' },
      { name: 'benefits', type: 'textarea', required: true, description: 'Principais benefícios a destacar' },
      { name: 'tone', type: 'select', required: true, options: ['Profissional', 'Descontraído', 'Emocional', 'Humorístico'], description: 'Tom do comercial' }
    ],
    tags: ['comercial', 'storyboard', 'marketing'],
    isPublic: true,
    createdBy: 'user2',
    createdAt: new Date('2024-01-16'),
    updatedAt: new Date('2024-01-16'),
    usageCount: 32,
    rating: 4.6,
    version: '1.0'
  },
  {
    id: '3',
    name: 'Legenda Acessível',
    description: 'Template para criação de legendas acessíveis',
    category: 'accessibility',
    type: 'caption',
    content: 'Crie legendas acessíveis para um vídeo sobre {{topic}}. As legendas devem: 1) Incluir descrições de sons importantes [som], 2) Identificar falantes quando necessário, 3) Usar linguagem clara e {{reading_level}}, 4) Seguir padrões de {{standard}}.',
    variables: [
      { name: 'topic', type: 'text', required: true, description: 'Tópico do vídeo' },
      { name: 'reading_level', type: 'select', required: true, options: ['Básico', 'Intermediário', 'Avançado'], description: 'Nível de leitura' },
      { name: 'standard', type: 'select', required: true, options: ['WCAG 2.1', 'Section 508', 'EN 301 549'], description: 'Padrão de acessibilidade' }
    ],
    tags: ['acessibilidade', 'legenda', 'inclusão'],
    isPublic: true,
    createdBy: 'user1',
    createdAt: new Date('2024-01-17'),
    updatedAt: new Date('2024-01-17'),
    usageCount: 28,
    rating: 4.9,
    version: '1.0'
  }
];

let categories = [
  { id: 'video', name: 'Vídeo', description: 'Templates para produção de vídeo' },
  { id: 'audio', name: 'Áudio', description: 'Templates para produção de áudio' },
  { id: 'text', name: 'Texto', description: 'Templates para criação de texto' },
  { id: 'accessibility', name: 'Acessibilidade', description: 'Templates para conteúdo acessível' },
  { id: 'marketing', name: 'Marketing', description: 'Templates para marketing e publicidade' },
  { id: 'education', name: 'Educação', description: 'Templates para conteúdo educativo' }
];

let templateTypes = [
  { id: 'script', name: 'Roteiro', description: 'Templates para roteiros' },
  { id: 'storyboard', name: 'Storyboard', description: 'Templates para storyboards' },
  { id: 'caption', name: 'Legenda', description: 'Templates para legendas' },
  { id: 'description', name: 'Descrição', description: 'Templates para descrições' },
  { id: 'summary', name: 'Resumo', description: 'Templates para resumos' },
  { id: 'analysis', name: 'Análise', description: 'Templates para análises' }
];

let analytics = {
  totalTemplates: templates.length,
  totalUsage: templates.reduce((sum, t) => sum + t.usageCount, 0),
  averageRating: templates.reduce((sum, t) => sum + t.rating, 0) / templates.length,
  topCategories: [
    { category: 'video', count: 2, percentage: 66.7 },
    { category: 'accessibility', count: 1, percentage: 33.3 }
  ],
  recentActivity: [
    { action: 'template_created', templateId: '3', timestamp: new Date('2024-01-17T10:30:00Z') },
    { action: 'template_used', templateId: '1', timestamp: new Date('2024-01-17T09:15:00Z') },
    { action: 'template_updated', templateId: '2', timestamp: new Date('2024-01-16T16:45:00Z') }
  ]
};

// Funções auxiliares
function generateId() {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

function validateTemplate(template) {
  const required = ['name', 'content', 'category', 'type'];
  for (const field of required) {
    if (!template[field]) {
      return { valid: false, error: `Campo obrigatório: ${field}` };
    }
  }
  
  if (template.variables && !Array.isArray(template.variables)) {
    return { valid: false, error: 'Variáveis devem ser um array' };
  }
  
  return { valid: true };
}

function processTemplate(template, variables = {}) {
  let processedContent = template.content;
  
  // Substituir variáveis no template
  template.variables?.forEach(variable => {
    const value = variables[variable.name] || `{{${variable.name}}}`;
    const regex = new RegExp(`{{${variable.name}}}`, 'g');
    processedContent = processedContent.replace(regex, value);
  });
  
  return {
    originalTemplate: template,
    processedContent,
    variables: variables,
    processedAt: new Date()
  };
}

function calculateTemplateScore(template) {
  const factors = {
    usage: Math.min(template.usageCount / 100, 1) * 0.3,
    rating: (template.rating / 5) * 0.4,
    completeness: (template.variables?.length || 0) / 10 * 0.2,
    recency: Math.max(0, 1 - (Date.now() - new Date(template.updatedAt)) / (30 * 24 * 60 * 60 * 1000)) * 0.1
  };
  
  return Object.values(factors).reduce((sum, factor) => sum + factor, 0);
}

// Middleware de autenticação
router.use(authenticate);

// Rotas para templates

// GET /api/ai/templates - Listar templates
router.get('/', (req, res) => {
  try {
    const { 
      category, 
      type, 
      search, 
      tags, 
      isPublic, 
      createdBy,
      sortBy = 'updatedAt',
      sortOrder = 'desc',
      page = 1,
      limit = 20
    } = req.query;
    
    let filteredTemplates = [...templates];
    
    // Aplicar filtros
    if (category) {
      filteredTemplates = filteredTemplates.filter(t => t.category === category);
    }
    
    if (type) {
      filteredTemplates = filteredTemplates.filter(t => t.type === type);
    }
    
    if (search) {
      const searchLower = search.toLowerCase();
      filteredTemplates = filteredTemplates.filter(t => 
        t.name.toLowerCase().includes(searchLower) ||
        t.description.toLowerCase().includes(searchLower) ||
        t.content.toLowerCase().includes(searchLower)
      );
    }
    
    if (tags) {
      const tagList = tags.split(',');
      filteredTemplates = filteredTemplates.filter(t => 
        tagList.some(tag => t.tags.includes(tag))
      );
    }
    
    if (isPublic !== undefined) {
      filteredTemplates = filteredTemplates.filter(t => t.isPublic === (isPublic === 'true'));
    }
    
    if (createdBy) {
      filteredTemplates = filteredTemplates.filter(t => t.createdBy === createdBy);
    }
    
    // Ordenação
    filteredTemplates.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];
      
      if (sortBy === 'score') {
        aValue = calculateTemplateScore(a);
        bValue = calculateTemplateScore(b);
      }
      
      if (sortOrder === 'desc') {
        return bValue > aValue ? 1 : -1;
      } else {
        return aValue > bValue ? 1 : -1;
      }
    });
    
    // Paginação
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedTemplates = filteredTemplates.slice(startIndex, endIndex);
    
    res.json({
      templates: paginatedTemplates,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: filteredTemplates.length,
        pages: Math.ceil(filteredTemplates.length / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar templates' });
  }
});

// GET /api/ai/templates/:id - Obter template específico
router.get('/:id', (req, res) => {
  try {
    const template = templates.find(t => t.id === req.params.id);
    
    if (!template) {
      return res.status(404).json({ error: 'Template não encontrado' });
    }
    
    res.json(template);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar template' });
  }
});

// POST /api/ai/templates - Criar novo template
router.post('/', (req, res) => {
  try {
    const validation = validateTemplate(req.body);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }
    
    const newTemplate = {
      id: generateId(),
      ...req.body,
      createdBy: req.user.id,
      createdAt: new Date(),
      updatedAt: new Date(),
      usageCount: 0,
      rating: 0,
      version: '1.0'
    };
    
    templates.push(newTemplate);
    
    // Atualizar analytics
    analytics.totalTemplates = templates.length;
    analytics.recentActivity.unshift({
      action: 'template_created',
      templateId: newTemplate.id,
      timestamp: new Date()
    });
    
    res.status(201).json(newTemplate);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar template' });
  }
});

// PUT /api/ai/templates/:id - Atualizar template
router.put('/:id', (req, res) => {
  try {
    const templateIndex = templates.findIndex(t => t.id === req.params.id);
    
    if (templateIndex === -1) {
      return res.status(404).json({ error: 'Template não encontrado' });
    }
    
    const template = templates[templateIndex];
    
    // Verificar permissão
    if (template.createdBy !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Sem permissão para editar este template' });
    }
    
    const validation = validateTemplate(req.body);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }
    
    const updatedTemplate = {
      ...template,
      ...req.body,
      updatedAt: new Date(),
      version: incrementVersion(template.version)
    };
    
    templates[templateIndex] = updatedTemplate;
    
    // Atualizar analytics
    analytics.recentActivity.unshift({
      action: 'template_updated',
      templateId: updatedTemplate.id,
      timestamp: new Date()
    });
    
    res.json(updatedTemplate);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar template' });
  }
});

// DELETE /api/ai/templates/:id - Deletar template
router.delete('/:id', (req, res) => {
  try {
    const templateIndex = templates.findIndex(t => t.id === req.params.id);
    
    if (templateIndex === -1) {
      return res.status(404).json({ error: 'Template não encontrado' });
    }
    
    const template = templates[templateIndex];
    
    // Verificar permissão
    if (template.createdBy !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Sem permissão para deletar este template' });
    }
    
    templates.splice(templateIndex, 1);
    
    // Atualizar analytics
    analytics.totalTemplates = templates.length;
    analytics.recentActivity.unshift({
      action: 'template_deleted',
      templateId: req.params.id,
      timestamp: new Date()
    });
    
    res.json({ message: 'Template deletado com sucesso' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao deletar template' });
  }
});

// POST /api/ai/templates/:id/process - Processar template com variáveis
router.post('/:id/process', (req, res) => {
  try {
    const template = templates.find(t => t.id === req.params.id);
    
    if (!template) {
      return res.status(404).json({ error: 'Template não encontrado' });
    }
    
    const { variables = {} } = req.body;
    
    // Validar variáveis obrigatórias
    const missingRequired = template.variables
      ?.filter(v => v.required && !variables[v.name])
      ?.map(v => v.name);
    
    if (missingRequired?.length > 0) {
      return res.status(400).json({ 
        error: 'Variáveis obrigatórias não fornecidas',
        missing: missingRequired
      });
    }
    
    const result = processTemplate(template, variables);
    
    // Incrementar contador de uso
    const templateIndex = templates.findIndex(t => t.id === req.params.id);
    if (templateIndex !== -1) {
      templates[templateIndex].usageCount++;
      
      // Atualizar analytics
      analytics.totalUsage++;
      analytics.recentActivity.unshift({
        action: 'template_used',
        templateId: template.id,
        timestamp: new Date()
      });
    }
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao processar template' });
  }
});

// POST /api/ai/templates/:id/duplicate - Duplicar template
router.post('/:id/duplicate', (req, res) => {
  try {
    const template = templates.find(t => t.id === req.params.id);
    
    if (!template) {
      return res.status(404).json({ error: 'Template não encontrado' });
    }
    
    const { name } = req.body;
    
    const duplicatedTemplate = {
      ...template,
      id: generateId(),
      name: name || `${template.name} (Cópia)`,
      createdBy: req.user.id,
      createdAt: new Date(),
      updatedAt: new Date(),
      usageCount: 0,
      rating: 0,
      version: '1.0',
      isPublic: false
    };
    
    templates.push(duplicatedTemplate);
    
    // Atualizar analytics
    analytics.totalTemplates = templates.length;
    analytics.recentActivity.unshift({
      action: 'template_duplicated',
      templateId: duplicatedTemplate.id,
      timestamp: new Date()
    });
    
    res.status(201).json(duplicatedTemplate);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao duplicar template' });
  }
});

// POST /api/ai/templates/:id/rate - Avaliar template
router.post('/:id/rate', (req, res) => {
  try {
    const template = templates.find(t => t.id === req.params.id);
    
    if (!template) {
      return res.status(404).json({ error: 'Template não encontrado' });
    }
    
    const { rating } = req.body;
    
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Avaliação deve ser entre 1 e 5' });
    }
    
    // Simular cálculo de nova média (em um sistema real, seria mais complexo)
    const templateIndex = templates.findIndex(t => t.id === req.params.id);
    if (templateIndex !== -1) {
      const currentRating = templates[templateIndex].rating;
      const newRating = (currentRating + rating) / 2; // Simplificado
      templates[templateIndex].rating = Math.round(newRating * 10) / 10;
      
      // Atualizar analytics
      analytics.averageRating = templates.reduce((sum, t) => sum + t.rating, 0) / templates.length;
    }
    
    res.json({ message: 'Avaliação registrada com sucesso', rating: templates[templateIndex].rating });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao avaliar template' });
  }
});

// GET /api/ai/templates/export/:id - Exportar template
router.get('/export/:id', (req, res) => {
  try {
    const template = templates.find(t => t.id === req.params.id);
    
    if (!template) {
      return res.status(404).json({ error: 'Template não encontrado' });
    }
    
    const exportData = {
      ...template,
      exportedAt: new Date(),
      exportedBy: req.user.id
    };
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="template-${template.name.replace(/[^a-zA-Z0-9]/g, '-')}.json"`);
    res.json(exportData);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao exportar template' });
  }
});

// POST /api/ai/templates/import - Importar template
router.post('/import', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Arquivo não fornecido' });
    }
    
    const templateData = JSON.parse(req.file.buffer.toString());
    
    // Validar dados do template
    const validation = validateTemplate(templateData);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }
    
    const importedTemplate = {
      ...templateData,
      id: generateId(),
      createdBy: req.user.id,
      createdAt: new Date(),
      updatedAt: new Date(),
      usageCount: 0,
      rating: 0,
      version: '1.0',
      isPublic: false
    };
    
    templates.push(importedTemplate);
    
    // Atualizar analytics
    analytics.totalTemplates = templates.length;
    analytics.recentActivity.unshift({
      action: 'template_imported',
      templateId: importedTemplate.id,
      timestamp: new Date()
    });
    
    res.status(201).json(importedTemplate);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao importar template' });
  }
});

// Rotas para categorias e tipos

// GET /api/ai/templates/meta/categories - Obter categorias
router.get('/meta/categories', (req, res) => {
  try {
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar categorias' });
  }
});

// GET /api/ai/templates/meta/types - Obter tipos de template
router.get('/meta/types', (req, res) => {
  try {
    res.json(templateTypes);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar tipos' });
  }
});

// GET /api/ai/templates/meta/analytics - Obter analytics
router.get('/meta/analytics', (req, res) => {
  try {
    res.json(analytics);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar analytics' });
  }
});

// Função auxiliar para incrementar versão
function incrementVersion(version) {
  const parts = version.split('.');
  const patch = parseInt(parts[2] || 0) + 1;
  return `${parts[0]}.${parts[1]}.${patch}`;
}

module.exports = router;