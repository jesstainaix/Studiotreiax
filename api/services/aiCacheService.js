import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class AICacheService {
  constructor() {
    this.memoryCache = new Map();
    this.cacheDir = path.join(__dirname, '../data/ai-cache');
    this.maxMemorySize = 100; // Máximo de 100 itens na memória
    this.defaultTTL = 24 * 60 * 60 * 1000; // 24 horas em ms
    this.compressionEnabled = true;
    
    this.initializeCache();
  }

  async initializeCache() {
    try {
      await fs.mkdir(this.cacheDir, { recursive: true });
      console.log('Cache de IA inicializado');
    } catch (error) {
      console.error('Erro ao inicializar cache:', error);
    }
  }

  // Gerar chave única para cache baseada nos parâmetros
  generateCacheKey(type, params, model = 'default') {
    const normalizedParams = this.normalizeParams(params);
    const keyString = `${type}:${model}:${JSON.stringify(normalizedParams)}`;
    return crypto.createHash('sha256').update(keyString).digest('hex');
  }

  // Normalizar parâmetros para garantir consistência
  normalizeParams(params) {
    if (typeof params === 'string') {
      return { content: params.trim().toLowerCase() };
    }
    
    const normalized = {};
    const keys = Object.keys(params).sort();
    
    for (const key of keys) {
      if (params[key] !== undefined && params[key] !== null) {
        if (typeof params[key] === 'string') {
          normalized[key] = params[key].trim();
        } else {
          normalized[key] = params[key];
        }
      }
    }
    
    return normalized;
  }

  // Verificar se item existe no cache
  async has(cacheKey) {
    // Verificar cache em memória primeiro
    if (this.memoryCache.has(cacheKey)) {
      const item = this.memoryCache.get(cacheKey);
      if (this.isExpired(item)) {
        this.memoryCache.delete(cacheKey);
        return false;
      }
      return true;
    }

    // Verificar cache em disco
    try {
      const filePath = this.getCacheFilePath(cacheKey);
      const stats = await fs.stat(filePath);
      return stats.isFile();
    } catch (error) {
      return false;
    }
  }

  // Obter item do cache
  async get(cacheKey) {
    try {
      // Tentar cache em memória primeiro
      if (this.memoryCache.has(cacheKey)) {
        const item = this.memoryCache.get(cacheKey);
        if (this.isExpired(item)) {
          this.memoryCache.delete(cacheKey);
        } else {
          // Atualizar último acesso
          item.lastAccessed = Date.now();
          return item.data;
        }
      }

      // Tentar cache em disco
      const filePath = this.getCacheFilePath(cacheKey);
      const fileContent = await fs.readFile(filePath, 'utf8');
      const item = JSON.parse(fileContent);
      
      if (this.isExpired(item)) {
        await this.delete(cacheKey);
        return null;
      }

      // Adicionar ao cache em memória se houver espaço
      if (this.memoryCache.size < this.maxMemorySize) {
        item.lastAccessed = Date.now();
        this.memoryCache.set(cacheKey, item);
      }

      return item.data;
    } catch (error) {
      console.error('Erro ao obter do cache:', error);
      return null;
    }
  }

  // Armazenar item no cache
  async set(cacheKey, data, ttl = this.defaultTTL) {
    try {
      const item = {
        data,
        createdAt: Date.now(),
        expiresAt: Date.now() + ttl,
        lastAccessed: Date.now(),
        size: JSON.stringify(data).length
      };

      // Armazenar em memória
      if (this.memoryCache.size >= this.maxMemorySize) {
        this.evictLeastRecentlyUsed();
      }
      this.memoryCache.set(cacheKey, item);

      // Armazenar em disco de forma assíncrona
      this.persistToDisk(cacheKey, item).catch(error => {
        console.error('Erro ao persistir cache:', error);
      });

      return true;
    } catch (error) {
      console.error('Erro ao armazenar no cache:', error);
      return false;
    }
  }

  // Deletar item do cache
  async delete(cacheKey) {
    try {
      // Remover da memória
      this.memoryCache.delete(cacheKey);

      // Remover do disco
      const filePath = this.getCacheFilePath(cacheKey);
      await fs.unlink(filePath);
      
      return true;
    } catch (error) {
      // Ignorar erro se arquivo não existir
      if (error.code !== 'ENOENT') {
        console.error('Erro ao deletar do cache:', error);
      }
      return false;
    }
  }

  // Limpar cache expirado
  async cleanup() {
    try {
      let cleanedCount = 0;

      // Limpar cache em memória
      for (const [key, item] of this.memoryCache.entries()) {
        if (this.isExpired(item)) {
          this.memoryCache.delete(key);
          cleanedCount++;
        }
      }

      // Limpar cache em disco
      const files = await fs.readdir(this.cacheDir);
      for (const file of files) {
        if (file.endsWith('.cache')) {
          const filePath = path.join(this.cacheDir, file);
          try {
            const content = await fs.readFile(filePath, 'utf8');
            const item = JSON.parse(content);
            if (this.isExpired(item)) {
              await fs.unlink(filePath);
              cleanedCount++;
            }
          } catch (error) {
            // Deletar arquivo corrompido
            await fs.unlink(filePath);
            cleanedCount++;
          }
        }
      }

      console.log(`Cache limpo: ${cleanedCount} itens removidos`);
      return cleanedCount;
    } catch (error) {
      console.error('Erro na limpeza do cache:', error);
      return 0;
    }
  }

  // Obter estatísticas do cache
  async getStats() {
    try {
      const memoryStats = {
        size: this.memoryCache.size,
        maxSize: this.maxMemorySize,
        items: []
      };

      for (const [key, item] of this.memoryCache.entries()) {
        memoryStats.items.push({
          key: key.substring(0, 8) + '...',
          size: item.size,
          age: Date.now() - item.createdAt,
          lastAccessed: Date.now() - item.lastAccessed
        });
      }

      // Estatísticas do disco
      const files = await fs.readdir(this.cacheDir);
      const diskStats = {
        fileCount: files.filter(f => f.endsWith('.cache')).length,
        totalSize: 0
      };

      for (const file of files) {
        if (file.endsWith('.cache')) {
          const filePath = path.join(this.cacheDir, file);
          const stats = await fs.stat(filePath);
          diskStats.totalSize += stats.size;
        }
      }

      return {
        memory: memoryStats,
        disk: diskStats,
        defaultTTL: this.defaultTTL
      };
    } catch (error) {
      console.error('Erro ao obter estatísticas:', error);
      return null;
    }
  }

  // Invalidar cache por padrão
  async invalidatePattern(pattern) {
    try {
      let invalidatedCount = 0;
      const regex = new RegExp(pattern);

      // Invalidar cache em memória
      for (const key of this.memoryCache.keys()) {
        if (regex.test(key)) {
          this.memoryCache.delete(key);
          invalidatedCount++;
        }
      }

      // Invalidar cache em disco
      const files = await fs.readdir(this.cacheDir);
      for (const file of files) {
        if (file.endsWith('.cache')) {
          const key = file.replace('.cache', '');
          if (regex.test(key)) {
            const filePath = path.join(this.cacheDir, file);
            await fs.unlink(filePath);
            invalidatedCount++;
          }
        }
      }

      console.log(`Cache invalidado: ${invalidatedCount} itens removidos`);
      return invalidatedCount;
    } catch (error) {
      console.error('Erro ao invalidar cache:', error);
      return 0;
    }
  }

  // Métodos auxiliares
  isExpired(item) {
    return Date.now() > item.expiresAt;
  }

  getCacheFilePath(cacheKey) {
    return path.join(this.cacheDir, `${cacheKey}.cache`);
  }

  async persistToDisk(cacheKey, item) {
    const filePath = this.getCacheFilePath(cacheKey);
    await fs.writeFile(filePath, JSON.stringify(item), 'utf8');
  }

  evictLeastRecentlyUsed() {
    let oldestKey = null;
    let oldestTime = Date.now();

    for (const [key, item] of this.memoryCache.entries()) {
      if (item.lastAccessed < oldestTime) {
        oldestTime = item.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.memoryCache.delete(oldestKey);
    }
  }

  // Métodos de conveniência para diferentes tipos de conteúdo
  async cacheScript(params, result, model = 'gpt-4') {
    const key = this.generateCacheKey('script', params, model);
    return await this.set(key, result, this.defaultTTL);
  }

  async getCachedScript(params, model = 'gpt-4') {
    const key = this.generateCacheKey('script', params, model);
    return await this.get(key);
  }

  async cacheStoryboard(params, result, model = 'gpt-4') {
    const key = this.generateCacheKey('storyboard', params, model);
    return await this.set(key, result, this.defaultTTL);
  }

  async getCachedStoryboard(params, model = 'gpt-4') {
    const key = this.generateCacheKey('storyboard', params, model);
    return await this.get(key);
  }

  async cacheCaptions(params, result, model = 'gpt-4') {
    const key = this.generateCacheKey('captions', params, model);
    return await this.set(key, result, this.defaultTTL);
  }

  async getCachedCaptions(params, model = 'gpt-4') {
    const key = this.generateCacheKey('captions', params, model);
    return await this.get(key);
  }

  async cacheOptimization(params, result, model = 'gpt-4') {
    const key = this.generateCacheKey('optimization', params, model);
    return await this.set(key, result, this.defaultTTL);
  }

  async getCachedOptimization(params, model = 'gpt-4') {
    const key = this.generateCacheKey('optimization', params, model);
    return await this.get(key);
  }

  async cacheAnalysis(params, result, model = 'gpt-4') {
    const key = this.generateCacheKey('analysis', params, model);
    return await this.set(key, result, this.defaultTTL);
  }

  async getCachedAnalysis(params, model = 'gpt-4') {
    const key = this.generateCacheKey('analysis', params, model);
    return await this.get(key);
  }
}

// Instância singleton
let cacheInstance = null;

function getCacheInstance() {
  if (!cacheInstance) {
    cacheInstance = new AICacheService();
    
    // Configurar limpeza automática a cada 6 horas
    setInterval(() => {
      cacheInstance.cleanup().catch(error => {
        console.error('Erro na limpeza automática do cache:', error);
      });
    }, 6 * 60 * 60 * 1000);
  }
  return cacheInstance;
}

export {
  AICacheService,
  getCacheInstance
};