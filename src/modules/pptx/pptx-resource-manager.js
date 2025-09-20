/**
 * Sistema de gerenciamento de recursos para PPTX
 */
class PPTXResourceManager {
    constructor(config = {}) {
        // Configurações padrão
        this.maxCacheSize = config.maxCacheSize || 100 * 1024 * 1024; // 100MB
        this.optimizeImages = config.optimizeImages !== false;
        this.cacheEnabled = config.cacheEnabled !== false;
        this.compressionLevel = config.compressionLevel || 0.8;
        
        // Estado interno
        this.resources = new Map();
        this.cache = new Map();
        this.cacheSize = 0;
        this.resourceIdCounter = 1;
        
        // Callbacks
        this.onResourceLoad = config.onResourceLoad || (() => {});
        this.onResourceError = config.onResourceError || (() => {});
        
        // Inicializa processadores
        this.processors = {
            image: this.createImageProcessor(),
            font: this.createFontProcessor(),
            media: this.createMediaProcessor()
        };
    }

    /**
     * Cria processador de imagens
     */
    createImageProcessor() {
        return {
            validate: (data) => {
                const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/svg+xml'];
                return validTypes.includes(data.type);
            },
            
            optimize: async (data) => {
                if (!this.optimizeImages) return data;

                try {
                    const sharp = require('sharp');
                    const image = sharp(data.buffer);
                    
                    // Otimiza baseado no tipo
                    switch (data.type) {
                        case 'image/jpeg':
                            return await image
                                .jpeg({ quality: this.compressionLevel * 100 })
                                .toBuffer();
                        
                        case 'image/png':
                            return await image
                                .png({ compressionLevel: 9, adaptiveFiltering: true })
                                .toBuffer();
                        
                        case 'image/gif':
                            return await image
                                .gif()
                                .toBuffer();
                        
                        default:
                            return data.buffer;
                    }
                } catch (error) {
                    this.onResourceError(error);
                    return data.buffer;
                }
            },
            
            metadata: async (data) => {
                try {
                    const sharp = require('sharp');
                    const metadata = await sharp(data.buffer).metadata();
                    return {
                        width: metadata.width,
                        height: metadata.height,
                        format: metadata.format,
                        space: metadata.space,
                        channels: metadata.channels,
                        depth: metadata.depth,
                        density: metadata.density
                    };
                } catch (error) {
                    this.onResourceError(error);
                    return null;
                }
            }
        };
    }

    /**
     * Cria processador de fontes
     */
    createFontProcessor() {
        return {
            validate: (data) => {
                const validTypes = ['font/ttf', 'font/otf', 'font/woff', 'font/woff2'];
                return validTypes.includes(data.type);
            },
            
            optimize: async (data) => {
                // Fontes já são otimizadas, apenas retorna o buffer
                return data.buffer;
            },
            
            metadata: async (data) => {
                try {
                    const fontkit = require('fontkit');
                    const font = fontkit.create(data.buffer);
                    return {
                        familyName: font.familyName,
                        subfamilyName: font.subfamilyName,
                        fullName: font.fullName,
                        postscriptName: font.postscriptName,
                        unitsPerEm: font.unitsPerEm,
                        ascent: font.ascent,
                        descent: font.descent,
                        lineGap: font.lineGap
                    };
                } catch (error) {
                    this.onResourceError(error);
                    return null;
                }
            }
        };
    }

    /**
     * Cria processador de mídia
     */
    createMediaProcessor() {
        return {
            validate: (data) => {
                const validTypes = [
                    'video/mp4', 'video/webm', 'video/ogg',
                    'audio/mpeg', 'audio/ogg', 'audio/wav'
                ];
                return validTypes.includes(data.type);
            },
            
            optimize: async (data) => {
                try {
                    const ffmpeg = require('fluent-ffmpeg');
                    
                    return new Promise((resolve, reject) => {
                        const command = ffmpeg(data.buffer);
                        
                        if (data.type.startsWith('video/')) {
                            command
                                .videoCodec('libx264')
                                .videoBitrate('1000k')
                                .size('1280x720');
                        }
                        
                        if (data.type.startsWith('audio/')) {
                            command
                                .audioCodec('aac')
                                .audioBitrate('128k');
                        }
                        
                        command
                            .toFormat(data.type.split('/')[1])
                            .on('end', () => resolve(command.output))
                            .on('error', (err) => reject(err))
                            .save(null);
                    });
                } catch (error) {
                    this.onResourceError(error);
                    return data.buffer;
                }
            },
            
            metadata: async (data) => {
                try {
                    const ffmpeg = require('fluent-ffmpeg');
                    
                    return new Promise((resolve, reject) => {
                        ffmpeg.ffprobe(data.buffer, (err, metadata) => {
                            if (err) reject(err);
                            else resolve({
                                duration: metadata.format.duration,
                                bitrate: metadata.format.bit_rate,
                                size: metadata.format.size,
                                codec: metadata.streams[0].codec_name
                            });
                        });
                    });
                } catch (error) {
                    this.onResourceError(error);
                    return null;
                }
            }
        };
    }

    /**
     * Adiciona recurso ao gerenciador
     */
    async addResource(data, options = {}) {
        const processor = this.processors[options.type || this.detectResourceType(data)];
        if (!processor) {
            throw new Error('Tipo de recurso não suportado');
        }

        // Valida recurso
        if (!processor.validate(data)) {
            throw new Error('Recurso inválido');
        }

        // Otimiza recurso
        const optimizedBuffer = await processor.optimize(data);
        
        // Obtém metadados
        const metadata = await processor.metadata(data);
        
        // Cria registro do recurso
        const resource = {
            id: this.generateResourceId(),
            type: data.type,
            size: optimizedBuffer.length,
            metadata: metadata,
            buffer: optimizedBuffer,
            ...options
        };

        // Armazena recurso
        this.resources.set(resource.id, resource);
        
        // Adiciona ao cache se necessário
        if (this.cacheEnabled) {
            this.cacheResource(resource);
        }

        // Notifica carregamento
        this.onResourceLoad(resource);

        return resource.id;
    }

    /**
     * Remove recurso do gerenciador
     */
    removeResource(id) {
        // Remove do cache
        if (this.cache.has(id)) {
            const resource = this.cache.get(id);
            this.cacheSize -= resource.size;
            this.cache.delete(id);
        }
        
        // Remove do gerenciador
        return this.resources.delete(id);
    }

    /**
     * Obtém recurso por ID
     */
    getResource(id) {
        // Tenta obter do cache primeiro
        if (this.cache.has(id)) {
            return this.cache.get(id);
        }
        
        // Se não estiver no cache, obtém do armazenamento
        const resource = this.resources.get(id);
        if (resource && this.cacheEnabled) {
            this.cacheResource(resource);
        }
        
        return resource;
    }

    /**
     * Adiciona recurso ao cache
     */
    cacheResource(resource) {
        // Remove recursos antigos se necessário
        while (this.cacheSize + resource.size > this.maxCacheSize) {
            const oldestId = this.cache.keys().next().value;
            const oldestResource = this.cache.get(oldestId);
            this.cacheSize -= oldestResource.size;
            this.cache.delete(oldestId);
        }
        
        // Adiciona ao cache
        this.cache.set(resource.id, resource);
        this.cacheSize += resource.size;
    }

    /**
     * Limpa o cache
     */
    clearCache() {
        this.cache.clear();
        this.cacheSize = 0;
    }

    /**
     * Gera ID único para recurso
     */
    generateResourceId() {
        return \`resource_\${this.resourceIdCounter++}\`;
    }

    /**
     * Detecta tipo de recurso baseado nos dados
     */
    detectResourceType(data) {
        if (data.type) {
            if (data.type.startsWith('image/')) return 'image';
            if (data.type.startsWith('font/')) return 'font';
            if (data.type.startsWith('video/') || data.type.startsWith('audio/')) return 'media';
        }
        
        // Tenta detectar por extensão do nome do arquivo
        if (data.name) {
            const ext = data.name.split('.').pop().toLowerCase();
            if (['jpg', 'jpeg', 'png', 'gif', 'svg'].includes(ext)) return 'image';
            if (['ttf', 'otf', 'woff', 'woff2'].includes(ext)) return 'font';
            if (['mp4', 'webm', 'ogg', 'mp3', 'wav'].includes(ext)) return 'media';
        }
        
        throw new Error('Tipo de recurso não detectado');
    }

    /**
     * Obtém estatísticas de uso
     */
    getStats() {
        return {
            totalResources: this.resources.size,
            cachedResources: this.cache.size,
            cacheSize: this.cacheSize,
            maxCacheSize: this.maxCacheSize,
            cacheUsage: this.cacheSize / this.maxCacheSize,
            resourceTypes: Array.from(this.resources.values()).reduce((types, resource) => {
                types[resource.type] = (types[resource.type] || 0) + 1;
                return types;
            }, {})
        };
    }

    /**
     * Atualiza configurações
     */
    updateConfig(config) {
        if (config.maxCacheSize) {
            this.maxCacheSize = config.maxCacheSize;
            // Ajusta cache se necessário
            while (this.cacheSize > this.maxCacheSize) {
                const oldestId = this.cache.keys().next().value;
                const oldestResource = this.cache.get(oldestId);
                this.cacheSize -= oldestResource.size;
                this.cache.delete(oldestId);
            }
        }
        
        if (config.optimizeImages !== undefined) {
            this.optimizeImages = config.optimizeImages;
        }
        
        if (config.cacheEnabled !== undefined) {
            this.cacheEnabled = config.cacheEnabled;
            if (!this.cacheEnabled) {
                this.clearCache();
            }
        }
        
        if (config.compressionLevel !== undefined) {
            this.compressionLevel = config.compressionLevel;
        }
    }
}

module.exports = PPTXResourceManager;