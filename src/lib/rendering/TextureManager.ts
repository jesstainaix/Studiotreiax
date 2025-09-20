// Sistema Avançado de Gerenciamento de Texturas
// Suporte para alta resolução, streaming, e otimização

import * as THREE from 'three';

export interface TextureConfig {
  url: string;
  type: 'albedo' | 'normal' | 'roughness' | 'metallic' | 'ao' | 'emissive' | 'height' | 'subsurface';
  resolution: 'low' | 'medium' | 'high' | 'ultra';
  compression: 'none' | 'dxt' | 'etc' | 'astc' | 'basis';
  mipmaps: boolean;
  anisotropy: number;
  wrapS: THREE.Wrapping;
  wrapT: THREE.Wrapping;
  colorSpace: 'srgb' | 'linear';
}

export interface TextureSet {
  albedo?: THREE.Texture;
  normal?: THREE.Texture;
  roughness?: THREE.Texture;
  metallic?: THREE.Texture;
  ao?: THREE.Texture;
  emissive?: THREE.Texture;
  height?: THREE.Texture;
  subsurface?: THREE.Texture;
}

export interface StreamingConfig {
  maxConcurrentLoads: number;
  preloadDistance: number;
  unloadDistance: number;
  qualityBasedOnDistance: boolean;
  memoryBudget: number; // MB
}

export class TextureManager {
  private static instance: TextureManager;
  private textureCache = new Map<string, THREE.Texture>();
  private textureSets = new Map<string, TextureSet>();
  private loadingQueue: TextureConfig[] = [];
  private activeLoads = 0;
  private streamingConfig: StreamingConfig;
  private memoryUsage = 0;
  private maxMemoryUsage = 512 * 1024 * 1024; // 512MB default

  private textureLoader = new THREE.TextureLoader();
  private ktx2Loader?: any; // Para compressão avançada
  private dracoLoader?: any; // Para geometria comprimida

  constructor() {
    this.streamingConfig = {
      maxConcurrentLoads: 4,
      preloadDistance: 50,
      unloadDistance: 100,
      qualityBasedOnDistance: true,
      memoryBudget: 256 // MB
    };

    this.maxMemoryUsage = this.streamingConfig.memoryBudget * 1024 * 1024;
    this.initializeLoaders();
  }

  static getInstance(): TextureManager {
    if (!TextureManager.instance) {
      TextureManager.instance = new TextureManager();
    }
    return TextureManager.instance;
  }

  private initializeLoaders(): void {
    // Inicializar loader KTX2 para texturas comprimidas
    try {
      // Em produção, seria necessário carregar KTX2Loader
      // this.ktx2Loader = new KTX2Loader();
      // this.ktx2Loader.setTranscoderPath('/basis/');
    } catch (error) {
      console.warn('KTX2Loader não disponível:', error);
    }
  }

  // Carregar conjunto completo de texturas para um material
  async loadTextureSet(name: string, textures: TextureConfig[]): Promise<TextureSet> {
    const textureSet: TextureSet = {};

    // Carregar todas as texturas do conjunto
    const loadPromises = textures.map(async (config) => {
      try {
        const texture = await this.loadTexture(config);
        textureSet[config.type] = texture;
        return texture;
      } catch (error) {
        console.warn(`Erro ao carregar textura ${config.type}:`, error);
        return null;
      }
    });

    await Promise.all(loadPromises);

    // Cache do conjunto
    this.textureSets.set(name, textureSet);

    return textureSet;
  }

  // Carregar textura individual com configurações avançadas
  async loadTexture(config: TextureConfig): Promise<THREE.Texture> {
    const cacheKey = this.generateCacheKey(config);

    // Verificar cache
    if (this.textureCache.has(cacheKey)) {
      return this.textureCache.get(cacheKey)!;
    }

    // Adicionar à fila de carregamento
    return new Promise((resolve, reject) => {
      this.loadingQueue.push(config);

      // Processar fila
      this.processLoadingQueue().then(() => {
        const texture = this.textureCache.get(cacheKey);
        if (texture) {
          resolve(texture);
        } else {
          reject(new Error(`Falha ao carregar textura: ${config.url}`));
        }
      }).catch(reject);
    });
  }

  private async processLoadingQueue(): Promise<void> {
    if (this.activeLoads >= this.streamingConfig.maxConcurrentLoads) {
      return;
    }

    const config = this.loadingQueue.shift();
    if (!config) return;

    this.activeLoads++;

    try {
      const texture = await this.loadTextureInternal(config);
      const cacheKey = this.generateCacheKey(config);

      // Configurar textura
      this.configureTexture(texture, config);

      // Cache
      this.textureCache.set(cacheKey, texture);

      // Atualizar uso de memória
      this.updateMemoryUsage(texture);

      // Verificar limite de memória
      if (this.memoryUsage > this.maxMemoryUsage) {
        this.evictOldTextures();
      }

    } catch (error) {
      console.error(`Erro ao carregar textura ${config.url}:`, error);
    } finally {
      this.activeLoads--;
    }

    // Continuar processando fila
    if (this.loadingQueue.length > 0) {
      setTimeout(() => this.processLoadingQueue(), 10);
    }
  }

  private async loadTextureInternal(config: TextureConfig): Promise<THREE.Texture> {
    return new Promise((resolve, reject) => {
      // Selecionar loader baseado no tipo de compressão
      let loader: any = this.textureLoader;

      if (config.compression === 'basis' && this.ktx2Loader) {
        loader = this.ktx2Loader;
      }

      // Modificar URL baseado na resolução
      const url = this.getUrlForResolution(config.url, config.resolution);

      loader.load(
        url,
        (texture: THREE.Texture) => {
          resolve(texture);
        },
        (progress: any) => {
          // Progress callback
        },
        (error: any) => {
          reject(error);
        }
      );
    });
  }

  private configureTexture(texture: THREE.Texture, config: TextureConfig): void {
    // Configurações básicas
    texture.wrapS = config.wrapS;
    texture.wrapT = config.wrapT;

    // Configurar color space
    if (config.colorSpace === 'srgb') {
      texture.colorSpace = THREE.SRGBColorSpace;
    } else {
      texture.colorSpace = THREE.LinearSRGBColorSpace;
    }

    // Anisotropy para melhor qualidade
    texture.anisotropy = config.anisotropy;

    // Mipmaps
    if (config.mipmaps) {
      texture.generateMipmaps = true;
      texture.minFilter = THREE.LinearMipmapLinearFilter;
    } else {
      texture.generateMipmaps = false;
      texture.minFilter = THREE.LinearFilter;
    }

    texture.magFilter = THREE.LinearFilter;

    // Configurações específicas por tipo
    switch (config.type) {
      case 'normal':
        texture.colorSpace = THREE.LinearSRGBColorSpace;
        break;
      case 'roughness':
      case 'metallic':
      case 'ao':
        texture.colorSpace = THREE.LinearSRGBColorSpace;
        break;
      case 'emissive':
        texture.colorSpace = THREE.SRGBColorSpace;
        break;
      case 'albedo':
        texture.colorSpace = THREE.SRGBColorSpace;
        break;
    }

    texture.needsUpdate = true;
  }

  private getUrlForResolution(baseUrl: string, resolution: string): string {
    // Sistema de resolução baseada em qualidade
    const qualityMap = {
      low: '_low',
      medium: '_med',
      high: '_high',
      ultra: '_ultra'
    };

    const suffix = qualityMap[resolution as keyof typeof qualityMap] || '';
    return baseUrl.replace(/(\.[^.]+)$/, `${suffix}$1`);
  }

  private generateCacheKey(config: TextureConfig): string {
    return `${config.url}_${config.resolution}_${config.compression}`;
  }

  private updateMemoryUsage(texture: THREE.Texture): void {
    // Estimativa simples de uso de memória
    const size = this.estimateTextureSize(texture);
    this.memoryUsage += size;
  }

  private estimateTextureSize(texture: THREE.Texture): number {
    // Estimativa baseada em resolução e formato
    const image = texture.image;
    if (!image) return 0;

    const width = image.width || 512;
    const height = image.height || 512;
    const channels = 4; // RGBA
    const bytesPerPixel = 4; // 32-bit

    return width * height * channels * bytesPerPixel;
  }

  private evictOldTextures(): void {

    // Estratégia simples: remover texturas antigas
    const entries = Array.from(this.textureCache.entries());
    const toRemove = entries.slice(0, Math.floor(entries.length * 0.2)); // Remover 20%

    toRemove.forEach(([key, texture]) => {
      this.memoryUsage -= this.estimateTextureSize(texture);
      texture.dispose();
      this.textureCache.delete(key);
    });
  }

  // Sistema de streaming baseado em distância
  updateStreaming(camera: THREE.Camera, objects: THREE.Object3D[]): void {
    objects.forEach(obj => {
      const distance = camera.position.distanceTo(obj.position);

      if (distance < this.streamingConfig.preloadDistance) {
        // Carregar texturas de alta qualidade
        this.upgradeTextureQuality(obj, 'high');
      } else if (distance > this.streamingConfig.unloadDistance) {
        // Descarregar ou reduzir qualidade
        this.downgradeTextureQuality(obj, 'low');
      }
    });
  }

  private upgradeTextureQuality(object: THREE.Object3D, quality: string): void {
    // Implementar upgrade de qualidade baseado na distância
    object.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material) {
        // Atualizar qualidade das texturas do material
        this.updateMaterialTextureQuality(child.material, quality);
      }
    });
  }

  private downgradeTextureQuality(object: THREE.Object3D, quality: string): void {
    // Implementar downgrade de qualidade
    object.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material) {
        this.updateMaterialTextureQuality(child.material, quality);
      }
    });
  }

  private updateMaterialTextureQuality(material: THREE.Material, quality: string): void {
    // Atualizar mapas do material para nova qualidade
    const materialAny = material as any;

    ['map', 'normalMap', 'roughnessMap', 'metallicMap', 'aoMap', 'emissiveMap'].forEach(mapName => {
      if (materialAny[mapName]) {
        // Em produção, recarregar textura com nova qualidade
      }
    });
  }

  // Métodos de otimização
  optimizeForPerformance(): void {
    // Reduzir qualidade de todas as texturas
    this.textureCache.forEach((texture, key) => {
      texture.anisotropy = Math.min(texture.anisotropy, 4);
      texture.generateMipmaps = true;
      texture.needsUpdate = true;
    });

    // Liberar memória
    this.evictOldTextures();
  }

  optimizeForQuality(): void {
    // Aumentar qualidade de texturas próximas
    this.textureCache.forEach((texture, key) => {
      texture.anisotropy = Math.min(texture.anisotropy, 16);
      texture.needsUpdate = true;
    });
  }

  // Métodos de consulta
  getMemoryUsage(): number {
    return this.memoryUsage;
  }

  getCacheSize(): number {
    return this.textureCache.size;
  }

  getTextureSet(name: string): TextureSet | null {
    return this.textureSets.get(name) || null;
  }

  // Limpeza
  clearCache(): void {
    this.textureCache.forEach(texture => {
      texture.dispose();
    });
    this.textureCache.clear();
    this.textureSets.clear();
    this.memoryUsage = 0;
  }

  dispose(): void {
    this.clearCache();
    this.loadingQueue = [];
  }
}

// Configurações padrão para diferentes tipos de textura
export const DEFAULT_TEXTURE_CONFIGS = {
  skin: {
    albedo: {
      type: 'albedo' as const,
      resolution: 'high' as const,
      compression: 'none' as const,
      mipmaps: true,
      anisotropy: 8,
      wrapS: THREE.RepeatWrapping,
      wrapT: THREE.RepeatWrapping,
      colorSpace: 'srgb' as const
    },
    normal: {
      type: 'normal' as const,
      resolution: 'high' as const,
      compression: 'none' as const,
      mipmaps: true,
      anisotropy: 8,
      wrapS: THREE.RepeatWrapping,
      wrapT: THREE.RepeatWrapping,
      colorSpace: 'linear' as const
    },
    roughness: {
      type: 'roughness' as const,
      resolution: 'medium' as const,
      compression: 'none' as const,
      mipmaps: true,
      anisotropy: 4,
      wrapS: THREE.RepeatWrapping,
      wrapT: THREE.RepeatWrapping,
      colorSpace: 'linear' as const
    }
  },
  hair: {
    albedo: {
      type: 'albedo' as const,
      resolution: 'high' as const,
      compression: 'none' as const,
      mipmaps: true,
      anisotropy: 16, // Importante para cabelo
      wrapS: THREE.RepeatWrapping,
      wrapT: THREE.RepeatWrapping,
      colorSpace: 'srgb' as const
    },
    normal: {
      type: 'normal' as const,
      resolution: 'high' as const,
      compression: 'none' as const,
      mipmaps: true,
      anisotropy: 16,
      wrapS: THREE.RepeatWrapping,
      wrapT: THREE.RepeatWrapping,
      colorSpace: 'linear' as const
    }
  },
  eyes: {
    albedo: {
      type: 'albedo' as const,
      resolution: 'ultra' as const,
      compression: 'none' as const,
      mipmaps: true,
      anisotropy: 4,
      wrapS: THREE.RepeatWrapping,
      wrapT: THREE.RepeatWrapping,
      colorSpace: 'srgb' as const
    },
    normal: {
      type: 'normal' as const,
      resolution: 'high' as const,
      compression: 'none' as const,
      mipmaps: true,
      anisotropy: 4,
      wrapS: THREE.RepeatWrapping,
      wrapT: THREE.RepeatWrapping,
      colorSpace: 'linear' as const
    }
  }
};
