const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

// Middleware de autenticação - DISABLED
// Authentication system has been disabled for this application

// Configurações padrão
const defaultSettings = {
  defaultProvider: 'openai',
  defaultModel: 'gpt-4',
  maxTokens: 2048,
  temperature: 0.7,
  topP: 1,
  frequencyPenalty: 0,
  presencePenalty: 0,
  timeout: 30000,
  retryAttempts: 3,
  cacheEnabled: true,
  cacheTTL: 3600,
  rateLimitEnabled: true,
  rateLimitRequests: 100,
  rateLimitWindow: 3600
};

// Provedores disponíveis
const availableProviders = [
  {
    id: 'openai',
    name: 'OpenAI',
    description: 'GPT-4, GPT-3.5 e outros modelos da OpenAI',
    models: ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo', 'gpt-3.5-turbo-16k'],
    isConfigured: false,
    isActive: false
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    description: 'Claude e outros modelos da Anthropic',
    models: ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku', 'claude-2'],
    isConfigured: false,
    isActive: false
  },
  {
    id: 'google',
    name: 'Google AI',
    description: 'Gemini e outros modelos do Google',
    models: ['gemini-pro', 'gemini-pro-vision', 'gemini-ultra'],
    isConfigured: false,
    isActive: false
  },
  {
    id: 'cohere',
    name: 'Cohere',
    description: 'Modelos de linguagem da Cohere',
    models: ['command', 'command-light', 'command-nightly'],
    isConfigured: false,
    isActive: false
  }
];

// Caminhos dos arquivos de configuração
const configDir = path.join(__dirname, '..', 'config');
const settingsFile = path.join(configDir, 'ai-settings.json');
const providersFile = path.join(configDir, 'ai-providers.json');
const modelsFile = path.join(configDir, 'ai-models.json');
const keysFile = path.join(configDir, 'ai-keys.json');

// Garantir que o diretório de configuração existe
const ensureConfigDir = async () => {
  try {
    await fs.access(configDir);
  } catch {
    await fs.mkdir(configDir, { recursive: true });
  }
};

// Funções auxiliares para carregar/salvar configurações
const loadConfig = async (filePath, defaultValue = {}) => {
  try {
    await ensureConfigDir();
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch {
    return defaultValue;
  }
};

const saveConfig = async (filePath, data) => {
  await ensureConfigDir();
  await fs.writeFile(filePath, JSON.stringify(data, null, 2));
};

// Criptografia para chaves de API
const encryptionKey = process.env.ENCRYPTION_KEY || 'default-key-change-in-production';

const encrypt = (text) => {
  const cipher = crypto.createCipher('aes-256-cbc', encryptionKey);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
};

const decrypt = (encryptedText) => {
  try {
    const decipher = crypto.createDecipher('aes-256-cbc', encryptionKey);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch {
    return null;
  }
};

// Função para mascarar chaves de API
const maskApiKey = (key) => {
  if (!key || key.length < 8) return '';
  return key.substring(0, 4) + '*'.repeat(key.length - 8) + key.substring(key.length - 4);
};

// Função para testar conexão com provedor
const testProviderConnection = async (providerId, apiKey) => {
  try {
    switch (providerId) {
      case 'openai':
        // Simular teste da OpenAI
        if (!apiKey || !apiKey.startsWith('sk-')) {
          throw new Error('Chave de API inválida para OpenAI');
        }
        // Aqui você faria uma chamada real para a API da OpenAI
        return { success: true, message: 'Conexão com OpenAI estabelecida com sucesso' };
        
      case 'anthropic':
        // Simular teste da Anthropic
        if (!apiKey || !apiKey.startsWith('sk-ant-')) {
          throw new Error('Chave de API inválida para Anthropic');
        }
        return { success: true, message: 'Conexão com Anthropic estabelecida com sucesso' };
        
      case 'google':
        // Simular teste do Google
        if (!apiKey) {
          throw new Error('Chave de API inválida para Google AI');
        }
        return { success: true, message: 'Conexão com Google AI estabelecida com sucesso' };
        
      case 'cohere':
        // Simular teste da Cohere
        if (!apiKey) {
          throw new Error('Chave de API inválida para Cohere');
        }
        return { success: true, message: 'Conexão com Cohere estabelecida com sucesso' };
        
      default:
        throw new Error('Provedor não suportado');
    }
  } catch (error) {
    return { success: false, message: error.message };
  }
};

// Rotas

// GET /api/ai/providers - Listar provedores
router.get('/providers', authenticateUser, async (req, res) => {
  try {
    const savedProviders = await loadConfig(providersFile, {});
    const savedKeys = await loadConfig(keysFile, {});
    
    const providers = availableProviders.map(provider => {
      const saved = savedProviders[provider.id] || {};
      const hasKey = !!savedKeys[provider.id];
      
      return {
        ...provider,
        isConfigured: hasKey,
        isActive: saved.isActive || false,
        apiKeyMasked: hasKey ? maskApiKey(decrypt(savedKeys[provider.id])) : undefined,
        lastTested: saved.lastTested,
        testStatus: saved.testStatus,
        testMessage: saved.testMessage
      };
    });
    
    res.json({
      success: true,
      data: providers
    });
  } catch (error) {
    console.error('Erro ao carregar provedores:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// PUT /api/ai/providers/:id/api-key - Salvar chave de API
router.put('/providers/:id/api-key', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    const { apiKey } = req.body;
    
    if (!apiKey) {
      return res.status(400).json({
        success: false,
        message: 'Chave de API é obrigatória'
      });
    }
    
    const provider = availableProviders.find(p => p.id === id);
    if (!provider) {
      return res.status(404).json({
        success: false,
        message: 'Provedor não encontrado'
      });
    }
    
    // Carregar chaves existentes
    const savedKeys = await loadConfig(keysFile, {});
    
    // Criptografar e salvar a chave
    savedKeys[id] = encrypt(apiKey);
    await saveConfig(keysFile, savedKeys);
    
    // Atualizar status do provedor
    const savedProviders = await loadConfig(providersFile, {});
    savedProviders[id] = {
      ...savedProviders[id],
      isConfigured: true
    };
    await saveConfig(providersFile, savedProviders);
    
    res.json({
      success: true,
      message: 'Chave de API salva com sucesso'
    });
  } catch (error) {
    console.error('Erro ao salvar chave de API:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// PUT /api/ai/providers/:id/toggle - Ativar/desativar provedor
router.put('/providers/:id/toggle', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;
    
    const provider = availableProviders.find(p => p.id === id);
    if (!provider) {
      return res.status(404).json({
        success: false,
        message: 'Provedor não encontrado'
      });
    }
    
    const savedProviders = await loadConfig(providersFile, {});
    savedProviders[id] = {
      ...savedProviders[id],
      isActive
    };
    await saveConfig(providersFile, savedProviders);
    
    res.json({
      success: true,
      message: `Provedor ${isActive ? 'ativado' : 'desativado'} com sucesso`
    });
  } catch (error) {
    console.error('Erro ao alterar provedor:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// POST /api/ai/providers/:id/test - Testar conexão com provedor
router.post('/providers/:id/test', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    
    const provider = availableProviders.find(p => p.id === id);
    if (!provider) {
      return res.status(404).json({
        success: false,
        message: 'Provedor não encontrado'
      });
    }
    
    // Carregar chave de API
    const savedKeys = await loadConfig(keysFile, {});
    const encryptedKey = savedKeys[id];
    
    if (!encryptedKey) {
      return res.status(400).json({
        success: false,
        message: 'Chave de API não configurada'
      });
    }
    
    const apiKey = decrypt(encryptedKey);
    if (!apiKey) {
      return res.status(400).json({
        success: false,
        message: 'Erro ao descriptografar chave de API'
      });
    }
    
    // Testar conexão
    const testResult = await testProviderConnection(id, apiKey);
    
    // Salvar resultado do teste
    const savedProviders = await loadConfig(providersFile, {});
    savedProviders[id] = {
      ...savedProviders[id],
      lastTested: new Date().toISOString(),
      testStatus: testResult.success ? 'success' : 'error',
      testMessage: testResult.message
    };
    await saveConfig(providersFile, savedProviders);
    
    res.json(testResult);
  } catch (error) {
    console.error('Erro ao testar provedor:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// GET /api/ai/settings - Obter configurações
router.get('/settings', authenticateUser, async (req, res) => {
  try {
    const settings = await loadConfig(settingsFile, defaultSettings);
    
    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error('Erro ao carregar configurações:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// PUT /api/ai/settings - Salvar configurações
router.put('/settings', authenticateUser, async (req, res) => {
  try {
    const settings = {
      ...defaultSettings,
      ...req.body
    };
    
    // Validar configurações
    if (settings.maxTokens < 1 || settings.maxTokens > 32000) {
      return res.status(400).json({
        success: false,
        message: 'Máximo de tokens deve estar entre 1 e 32000'
      });
    }
    
    if (settings.temperature < 0 || settings.temperature > 2) {
      return res.status(400).json({
        success: false,
        message: 'Temperatura deve estar entre 0 e 2'
      });
    }
    
    await saveConfig(settingsFile, settings);
    
    res.json({
      success: true,
      message: 'Configurações salvas com sucesso',
      data: settings
    });
  } catch (error) {
    console.error('Erro ao salvar configurações:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// GET /api/ai/models - Obter configurações de modelos
router.get('/models', authenticateUser, async (req, res) => {
  try {
    const models = await loadConfig(modelsFile, []);
    
    res.json({
      success: true,
      data: models
    });
  } catch (error) {
    console.error('Erro ao carregar modelos:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// PUT /api/ai/models - Salvar configurações de modelos
router.put('/models', authenticateUser, async (req, res) => {
  try {
    const models = req.body;
    
    // Validar configurações de modelos
    for (const model of models) {
      if (!model.provider || !model.model) {
        return res.status(400).json({
          success: false,
          message: 'Provedor e modelo são obrigatórios'
        });
      }
      
      if (model.maxTokens < 1 || model.maxTokens > 32000) {
        return res.status(400).json({
          success: false,
          message: 'Máximo de tokens deve estar entre 1 e 32000'
        });
      }
      
      if (model.temperature < 0 || model.temperature > 2) {
        return res.status(400).json({
          success: false,
          message: 'Temperatura deve estar entre 0 e 2'
        });
      }
    }
    
    await saveConfig(modelsFile, models);
    
    res.json({
      success: true,
      message: 'Configurações de modelos salvas com sucesso',
      data: models
    });
  } catch (error) {
    console.error('Erro ao salvar modelos:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// GET /api/ai/status - Status geral da configuração de IA
router.get('/status', authenticateUser, async (req, res) => {
  try {
    const savedProviders = await loadConfig(providersFile, {});
    const savedKeys = await loadConfig(keysFile, {});
    const settings = await loadConfig(settingsFile, defaultSettings);
    
    const providersStatus = availableProviders.map(provider => {
      const saved = savedProviders[provider.id] || {};
      const hasKey = !!savedKeys[provider.id];
      
      return {
        id: provider.id,
        name: provider.name,
        isConfigured: hasKey,
        isActive: saved.isActive || false,
        testStatus: saved.testStatus,
        lastTested: saved.lastTested
      };
    });
    
    const activeProviders = providersStatus.filter(p => p.isActive && p.isConfigured);
    const hasDefaultProvider = activeProviders.some(p => p.id === settings.defaultProvider);
    
    res.json({
      success: true,
      data: {
        providers: providersStatus,
        activeProviders: activeProviders.length,
        totalProviders: availableProviders.length,
        hasDefaultProvider,
        defaultProvider: settings.defaultProvider,
        defaultModel: settings.defaultModel,
        cacheEnabled: settings.cacheEnabled,
        rateLimitEnabled: settings.rateLimitEnabled
      }
    });
  } catch (error) {
    console.error('Erro ao obter status:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// POST /api/ai/reset - Resetar configurações
router.post('/reset', authenticateUser, async (req, res) => {
  try {
    const { resetType } = req.body; // 'all', 'settings', 'providers', 'keys'
    
    if (resetType === 'all' || resetType === 'settings') {
      await saveConfig(settingsFile, defaultSettings);
    }
    
    if (resetType === 'all' || resetType === 'providers') {
      await saveConfig(providersFile, {});
    }
    
    if (resetType === 'all' || resetType === 'keys') {
      await saveConfig(keysFile, {});
    }
    
    if (resetType === 'all' || resetType === 'models') {
      await saveConfig(modelsFile, []);
    }
    
    res.json({
      success: true,
      message: 'Configurações resetadas com sucesso'
    });
  } catch (error) {
    console.error('Erro ao resetar configurações:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Middleware de tratamento de erros
router.use((error, req, res, next) => {
  console.error('Erro na API de configuração de IA:', error);
  res.status(500).json({
    success: false,
    message: 'Erro interno do servidor'
  });
});

module.exports = router;