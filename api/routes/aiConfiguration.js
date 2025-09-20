const express = require('express');
const multer = require('multer');
const router = express.Router();

// Middleware de autenticação (simulado)
const authenticateUser = (req, res, next) => {
  // Simular autenticação
  req.user = { id: 'user123', name: 'Usuário Teste' };
  next();
};

// Configuração do multer para upload de arquivos
const upload = multer({ storage: multer.memoryStorage() });

// Simulação de banco de dados em memória
let aiConfigurations = [
  {
    id: 'config1',
    name: 'Configuração Principal',
    description: 'Configuração padrão para geração de conteúdo',
    provider: 'openai',
    model: 'gpt-4',
    apiKey: 'sk-***',
    settings: {
      temperature: 0.7,
      maxTokens: 2000,
      topP: 1,
      frequencyPenalty: 0,
      presencePenalty: 0,
      timeout: 30000,
      retries: 3
    },
    isActive: true,
    isDefault: true,
    createdBy: 'user123',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-20')
  },
  {
    id: 'config2',
    name: 'Claude para Roteiros',
    description: 'Configuração otimizada para geração de roteiros',
    provider: 'anthropic',
    model: 'claude-3-sonnet',
    apiKey: 'sk-ant-***',
    settings: {
      temperature: 0.8,
      maxTokens: 4000,
      topP: 0.9,
      timeout: 45000,
      retries: 2
    },
    isActive: true,
    isDefault: false,
    createdBy: 'user123',
    createdAt: new Date('2024-01-18'),
    updatedAt: new Date('2024-01-22')
  }
];

let providers = [
  {
    id: 'openai',
    name: 'OpenAI',
    description: 'GPT-4, GPT-3.5 e outros modelos da OpenAI',
    models: [
      { id: 'gpt-4', name: 'GPT-4', maxTokens: 8192, costPer1k: 0.03 },
      { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', maxTokens: 128000, costPer1k: 0.01 },
      { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', maxTokens: 4096, costPer1k: 0.002 }
    ],
    supportedFeatures: ['text-generation', 'chat', 'function-calling'],
    configFields: [
      { name: 'temperature', type: 'number', min: 0, max: 2, step: 0.1, default: 0.7 },
      { name: 'maxTokens', type: 'number', min: 1, max: 8192, default: 2000 },
      { name: 'topP', type: 'number', min: 0, max: 1, step: 0.1, default: 1 },
      { name: 'frequencyPenalty', type: 'number', min: -2, max: 2, step: 0.1, default: 0 },
      { name: 'presencePenalty', type: 'number', min: -2, max: 2, step: 0.1, default: 0 }
    ]
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    description: 'Claude 3 e outros modelos da Anthropic',
    models: [
      { id: 'claude-3-opus', name: 'Claude 3 Opus', maxTokens: 200000, costPer1k: 0.015 },
      { id: 'claude-3-sonnet', name: 'Claude 3 Sonnet', maxTokens: 200000, costPer1k: 0.003 },
      { id: 'claude-3-haiku', name: 'Claude 3 Haiku', maxTokens: 200000, costPer1k: 0.00025 }
    ],
    supportedFeatures: ['text-generation', 'chat', 'analysis'],
    configFields: [
      { name: 'temperature', type: 'number', min: 0, max: 1, step: 0.1, default: 0.7 },
      { name: 'maxTokens', type: 'number', min: 1, max: 200000, default: 4000 },
      { name: 'topP', type: 'number', min: 0, max: 1, step: 0.1, default: 0.9 }
    ]
  },
  {
    id: 'google',
    name: 'Google',
    description: 'Gemini e outros modelos do Google',
    models: [
      { id: 'gemini-pro', name: 'Gemini Pro', maxTokens: 32768, costPer1k: 0.0005 },
      { id: 'gemini-pro-vision', name: 'Gemini Pro Vision', maxTokens: 16384, costPer1k: 0.0025 }
    ],
    supportedFeatures: ['text-generation', 'vision', 'multimodal'],
    configFields: [
      { name: 'temperature', type: 'number', min: 0, max: 1, step: 0.1, default: 0.9 },
      { name: 'maxTokens', type: 'number', min: 1, max: 32768, default: 2048 },
      { name: 'topP', type: 'number', min: 0, max: 1, step: 0.1, default: 0.8 },
      { name: 'topK', type: 'number', min: 1, max: 40, default: 32 }
    ]
  }
];

let usageStats = {
  totalRequests: 15420,
  totalTokens: 2847392,
  totalCost: 85.42,
  requestsByProvider: {
    openai: 8934,
    anthropic: 4821,
    google: 1665
  },
  tokensByProvider: {
    openai: 1623847,
    anthropic: 892156,
    google: 331389
  },
  costByProvider: {
    openai: 48.71,
    anthropic: 26.76,
    google: 9.95
  },
  dailyUsage: [
    { date: '2024-01-15', requests: 234, tokens: 45678, cost: 1.37 },
    { date: '2024-01-16', requests: 189, tokens: 38921, cost: 1.17 },
    { date: '2024-01-17', requests: 267, tokens: 52134, cost: 1.56 },
    { date: '2024-01-18', requests: 298, tokens: 58392, cost: 1.75 },
    { date: '2024-01-19', requests: 312, tokens: 61847, cost: 1.86 },
    { date: '2024-01-20', requests: 278, tokens: 54923, cost: 1.65 },
    { date: '2024-01-21', requests: 245, tokens: 48756, cost: 1.46 }
  ]
};

// Funções auxiliares
const generateId = () => {
  return 'config_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
};

const validateConfiguration = (config) => {
  const errors = [];
  
  if (!config.name || config.name.trim().length === 0) {
    errors.push('Nome é obrigatório');
  }
  
  if (!config.provider) {
    errors.push('Provider é obrigatório');
  }
  
  if (!config.model) {
    errors.push('Modelo é obrigatório');
  }
  
  if (!config.apiKey || config.apiKey.trim().length === 0) {
    errors.push('API Key é obrigatória');
  }
  
  return errors;
};

const testApiConnection = async (provider, model, apiKey) => {
  // Simular teste de conexão
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Simular diferentes resultados baseados na API key
  if (apiKey.includes('invalid')) {
    return {
      success: false,
      error: 'API Key inválida',
      latency: null
    };
  }
  
  if (apiKey.includes('expired')) {
    return {
      success: false,
      error: 'API Key expirada',
      latency: null
    };
  }
  
  return {
    success: true,
    error: null,
    latency: Math.floor(Math.random() * 500) + 100 // 100-600ms
  };
};

const calculateUsageCost = (provider, tokens) => {
  const providerData = providers.find(p => p.id === provider);
  if (!providerData || !providerData.models[0]) return 0;
  
  const costPer1k = providerData.models[0].costPer1k;
  return (tokens / 1000) * costPer1k;
};

// Rotas

// Listar configurações
router.get('/', authenticateUser, (req, res) => {
  try {
    const { provider, isActive } = req.query;
    
    let filteredConfigs = [...aiConfigurations];
    
    if (provider) {
      filteredConfigs = filteredConfigs.filter(config => config.provider === provider);
    }
    
    if (isActive !== undefined) {
      filteredConfigs = filteredConfigs.filter(config => config.isActive === (isActive === 'true'));
    }
    
    res.json({
      configurations: filteredConfigs,
      total: filteredConfigs.length
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao listar configurações' });
  }
});

// Obter configuração específica
router.get('/:id', authenticateUser, (req, res) => {
  try {
    const config = aiConfigurations.find(c => c.id === req.params.id);
    
    if (!config) {
      return res.status(404).json({ error: 'Configuração não encontrada' });
    }
    
    res.json(config);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao obter configuração' });
  }
});

// Criar nova configuração
router.post('/', authenticateUser, (req, res) => {
  try {
    const configData = req.body;
    const errors = validateConfiguration(configData);
    
    if (errors.length > 0) {
      return res.status(400).json({ error: 'Dados inválidos', details: errors });
    }
    
    const newConfig = {
      id: generateId(),
      name: configData.name,
      description: configData.description || '',
      provider: configData.provider,
      model: configData.model,
      apiKey: configData.apiKey,
      settings: configData.settings || {},
      isActive: configData.isActive !== false,
      isDefault: configData.isDefault === true,
      createdBy: req.user.id,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Se esta configuração for marcada como padrão, desmarcar outras
    if (newConfig.isDefault) {
      aiConfigurations.forEach(config => {
        if (config.provider === newConfig.provider) {
          config.isDefault = false;
        }
      });
    }
    
    aiConfigurations.unshift(newConfig);
    
    res.status(201).json(newConfig);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar configuração' });
  }
});

// Atualizar configuração
router.put('/:id', authenticateUser, (req, res) => {
  try {
    const configIndex = aiConfigurations.findIndex(c => c.id === req.params.id);
    
    if (configIndex === -1) {
      return res.status(404).json({ error: 'Configuração não encontrada' });
    }
    
    const configData = req.body;
    const errors = validateConfiguration(configData);
    
    if (errors.length > 0) {
      return res.status(400).json({ error: 'Dados inválidos', details: errors });
    }
    
    const existingConfig = aiConfigurations[configIndex];
    
    const updatedConfig = {
      ...existingConfig,
      name: configData.name,
      description: configData.description || '',
      provider: configData.provider,
      model: configData.model,
      apiKey: configData.apiKey,
      settings: configData.settings || {},
      isActive: configData.isActive !== false,
      isDefault: configData.isDefault === true,
      updatedAt: new Date()
    };
    
    // Se esta configuração for marcada como padrão, desmarcar outras
    if (updatedConfig.isDefault) {
      aiConfigurations.forEach((config, index) => {
        if (config.provider === updatedConfig.provider && index !== configIndex) {
          config.isDefault = false;
        }
      });
    }
    
    aiConfigurations[configIndex] = updatedConfig;
    
    res.json(updatedConfig);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar configuração' });
  }
});

// Deletar configuração
router.delete('/:id', authenticateUser, (req, res) => {
  try {
    const configIndex = aiConfigurations.findIndex(c => c.id === req.params.id);
    
    if (configIndex === -1) {
      return res.status(404).json({ error: 'Configuração não encontrada' });
    }
    
    const config = aiConfigurations[configIndex];
    
    // Não permitir deletar configuração padrão
    if (config.isDefault) {
      return res.status(400).json({ error: 'Não é possível deletar a configuração padrão' });
    }
    
    aiConfigurations.splice(configIndex, 1);
    
    res.json({ message: 'Configuração deletada com sucesso' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao deletar configuração' });
  }
});

// Testar conexão
router.post('/:id/test', authenticateUser, async (req, res) => {
  try {
    const config = aiConfigurations.find(c => c.id === req.params.id);
    
    if (!config) {
      return res.status(404).json({ error: 'Configuração não encontrada' });
    }
    
    const result = await testApiConnection(config.provider, config.model, config.apiKey);
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao testar conexão' });
  }
});

// Testar configuração personalizada
router.post('/test', authenticateUser, async (req, res) => {
  try {
    const { provider, model, apiKey } = req.body;
    
    if (!provider || !model || !apiKey) {
      return res.status(400).json({ error: 'Provider, modelo e API key são obrigatórios' });
    }
    
    const result = await testApiConnection(provider, model, apiKey);
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao testar conexão' });
  }
});

// Definir como padrão
router.post('/:id/set-default', authenticateUser, (req, res) => {
  try {
    const config = aiConfigurations.find(c => c.id === req.params.id);
    
    if (!config) {
      return res.status(404).json({ error: 'Configuração não encontrada' });
    }
    
    // Desmarcar outras configurações do mesmo provider como padrão
    aiConfigurations.forEach(c => {
      if (c.provider === config.provider) {
        c.isDefault = false;
      }
    });
    
    // Marcar esta como padrão
    config.isDefault = true;
    config.updatedAt = new Date();
    
    res.json(config);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao definir configuração padrão' });
  }
});

// Ativar/desativar configuração
router.post('/:id/toggle', authenticateUser, (req, res) => {
  try {
    const config = aiConfigurations.find(c => c.id === req.params.id);
    
    if (!config) {
      return res.status(404).json({ error: 'Configuração não encontrada' });
    }
    
    config.isActive = !config.isActive;
    config.updatedAt = new Date();
    
    res.json(config);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao alterar status da configuração' });
  }
});

// Obter providers disponíveis
router.get('/meta/providers', authenticateUser, (req, res) => {
  try {
    res.json(providers);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao obter providers' });
  }
});

// Obter modelos de um provider
router.get('/meta/providers/:providerId/models', authenticateUser, (req, res) => {
  try {
    const provider = providers.find(p => p.id === req.params.providerId);
    
    if (!provider) {
      return res.status(404).json({ error: 'Provider não encontrado' });
    }
    
    res.json(provider.models);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao obter modelos' });
  }
});

// Obter estatísticas de uso
router.get('/meta/usage', authenticateUser, (req, res) => {
  try {
    const { period = '7d' } = req.query;
    
    let filteredStats = { ...usageStats };
    
    // Filtrar dados diários baseado no período
    if (period === '7d') {
      filteredStats.dailyUsage = usageStats.dailyUsage.slice(-7);
    } else if (period === '30d') {
      filteredStats.dailyUsage = usageStats.dailyUsage.slice(-30);
    }
    
    res.json(filteredStats);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao obter estatísticas' });
  }
});

// Exportar configurações
router.get('/export', authenticateUser, (req, res) => {
  try {
    const { ids } = req.query;
    
    let configsToExport = aiConfigurations;
    
    if (ids) {
      const idList = ids.split(',');
      configsToExport = aiConfigurations.filter(config => idList.includes(config.id));
    }
    
    // Remover informações sensíveis
    const exportData = configsToExport.map(config => ({
      ...config,
      apiKey: '***' // Mascarar API key
    }));
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename=ai-configurations.json');
    res.json({
      exportedAt: new Date(),
      configurations: exportData
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao exportar configurações' });
  }
});

// Importar configurações
router.post('/import', authenticateUser, upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Arquivo é obrigatório' });
    }
    
    const fileContent = req.file.buffer.toString('utf8');
    const importData = JSON.parse(fileContent);
    
    if (!importData.configurations || !Array.isArray(importData.configurations)) {
      return res.status(400).json({ error: 'Formato de arquivo inválido' });
    }
    
    const importedConfigs = [];
    
    importData.configurations.forEach(configData => {
      const errors = validateConfiguration(configData);
      
      if (errors.length === 0) {
        const newConfig = {
          ...configData,
          id: generateId(),
          createdBy: req.user.id,
          createdAt: new Date(),
          updatedAt: new Date(),
          isDefault: false // Não importar como padrão
        };
        
        aiConfigurations.unshift(newConfig);
        importedConfigs.push(newConfig);
      }
    });
    
    res.json({
      message: `${importedConfigs.length} configurações importadas com sucesso`,
      imported: importedConfigs
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao importar configurações' });
  }
});

module.exports = router;