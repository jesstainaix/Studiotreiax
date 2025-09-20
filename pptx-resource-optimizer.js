import sharp from 'sharp';
import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';

export class PPTXResourceOptimizer {
  constructor(options = {}) {
    this.options = {
      maxImageWidth: options.maxImageWidth || 1920,
      maxImageHeight: options.maxImageHeight || 1080,
      imageQuality: options.imageQuality || 85,
      maxFileSize: options.maxFileSize || 5 * 1024 * 1024, // 5MB
      enableDeduplication: options.enableDeduplication !== false,
      cacheDir: options.cacheDir || './.cache/pptx-resources',
      ...options
    };

    this.resourceCache = new Map();
  }

  async initializeCache() {
    try {
      await fs.mkdir(this.options.cacheDir, { recursive: true });
    } catch (error) {
      console.warn('Aviso: Não foi possível inicializar cache:', error.message);
    }
  }

  async optimizeImage(buffer, format = 'jpeg', options = {}) {
    const imageHash = this.calculateHash(buffer);
    
    // Verificar cache
    if (this.options.enableDeduplication) {
      const cached = await this.getCachedResource(imageHash);
      if (cached) {
        return cached;
      }
    }

    try {
      // Carregar imagem com sharp
      let image = sharp(buffer);
      const metadata = await image.metadata();

      // Determinar dimensões otimizadas
      const dimensions = this.calculateOptimizedDimensions(
        metadata.width,
        metadata.height
      );

      // Aplicar otimizações
      image = image
        .resize(dimensions.width, dimensions.height, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .rotate() // Auto-rotação baseada em EXIF
        .normalize() // Normalizar cores
        .toFormat(format, {
          quality: this.options.imageQuality,
          progressive: true
        });

      // Verificar se há opções adicionais específicas do formato
      if (format === 'jpeg') {
        image = image.jpeg({ mozjpeg: true });
      } else if (format === 'png') {
        image = image.png({ palette: true });
      } else if (format === 'webp') {
        image = image.webp({ nearLossless: true });
      }

      const optimizedBuffer = await image.toBuffer();

      // Verificar se a otimização valeu a pena
      if (optimizedBuffer.length >= buffer.length) {
        // Se a imagem otimizada é maior, manter original
        return this.cacheResource(imageHash, buffer);
      }

      // Armazenar em cache e retornar
      return this.cacheResource(imageHash, optimizedBuffer);

    } catch (error) {
      console.warn(`Aviso: Erro ao otimizar imagem: ${error.message}`);
      // Em caso de erro, retornar imagem original
      return buffer;
    }
  }

  async optimizePPTXResources(pptxBuffer) {
    const zip = await JSZip.loadAsync(pptxBuffer);
    const optimizedResources = new Map();
    const deduplicationMap = new Map();

    // Processar todas as imagens no PPTX
    for (const [filename, file] of Object.entries(zip.files)) {
      if (this.isImageFile(filename)) {
        const buffer = await file.async('nodebuffer');
        const format = this.getImageFormat(filename);
        
        // Otimizar imagem
        const optimizedBuffer = await this.optimizeImage(buffer, format);
        
        // Verificar deduplicação
        if (this.options.enableDeduplication) {
          const hash = this.calculateHash(optimizedBuffer);
          if (deduplicationMap.has(hash)) {
            // Usar referência existente
            optimizedResources.set(filename, deduplicationMap.get(hash));
            continue;
          }
          deduplicationMap.set(hash, filename);
        }
        
        optimizedResources.set(filename, optimizedBuffer);
      }
    }

    // Reconstruir PPTX com recursos otimizados
    return this.rebuildPPTX(zip, optimizedResources);
  }

  async optimizeFont(fontBuffer) {
    // Implementar otimização de fontes (subsetting, etc.)
    return fontBuffer;
  }

  async optimizeAudio(audioBuffer) {
    // Implementar otimização de áudio (compressão, etc.)
    return audioBuffer;
  }

  async optimizeVideo(videoBuffer) {
    // Implementar otimização de vídeo (compressão, etc.)
    return videoBuffer;
  }

  // Métodos auxiliares
  calculateHash(buffer) {
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }

  async getCachedResource(hash) {
    // Verificar cache em memória
    if (this.resourceCache.has(hash)) {
      return this.resourceCache.get(hash);
    }

    // Verificar cache em disco
    try {
      const cachePath = path.join(this.options.cacheDir, `${hash}`);
      const cached = await fs.readFile(cachePath);
      this.resourceCache.set(hash, cached);
      return cached;
    } catch (error) {
      return null;
    }
  }

  async cacheResource(hash, buffer) {
    // Armazenar em cache de memória
    this.resourceCache.set(hash, buffer);

    // Armazenar em cache de disco
    try {
      const cachePath = path.join(this.options.cacheDir, `${hash}`);
      await fs.writeFile(cachePath, buffer);
    } catch (error) {
      console.warn('Aviso: Não foi possível cachear recurso:', error.message);
    }

    return buffer;
  }

  calculateOptimizedDimensions(width, height) {
    if (!width || !height) {
      return { width: this.options.maxImageWidth, height: this.options.maxImageHeight };
    }

    const aspectRatio = width / height;
    let newWidth = width;
    let newHeight = height;

    // Redimensionar se exceder dimensões máximas
    if (width > this.options.maxImageWidth) {
      newWidth = this.options.maxImageWidth;
      newHeight = Math.round(newWidth / aspectRatio);
    }

    if (newHeight > this.options.maxImageHeight) {
      newHeight = this.options.maxImageHeight;
      newWidth = Math.round(newHeight * aspectRatio);
    }

    return { width: newWidth, height: newHeight };
  }

  isImageFile(filename) {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    return imageExtensions.some(ext => filename.toLowerCase().endsWith(ext));
  }

  getImageFormat(filename) {
    const ext = path.extname(filename).toLowerCase();
    switch (ext) {
      case '.jpg':
      case '.jpeg':
        return 'jpeg';
      case '.png':
        return 'png';
      case '.webp':
        return 'webp';
      case '.gif':
        return 'png'; // Converter GIF para PNG
      default:
        return 'jpeg';
    }
  }

  async rebuildPPTX(zip, optimizedResources) {
    // Substituir recursos otimizados no ZIP
    for (const [filename, buffer] of optimizedResources.entries()) {
      zip.file(filename, buffer);
    }

    // Gerar novo arquivo PPTX
    return await zip.generateAsync({
      type: 'nodebuffer',
      compression: 'DEFLATE',
      compressionOptions: {
        level: 9
      }
    });
  }

  // Métodos de limpeza e manutenção
  async clearCache() {
    this.resourceCache.clear();
    
    try {
      const files = await fs.readdir(this.options.cacheDir);
      await Promise.all(
        files.map(file => 
          fs.unlink(path.join(this.options.cacheDir, file))
        )
      );
    } catch (error) {
      console.warn('Aviso: Erro ao limpar cache:', error.message);
    }
  }

  async pruneCache(maxAge = 7 * 24 * 60 * 60 * 1000) { // 7 dias
    try {
      const now = Date.now();
      const files = await fs.readdir(this.options.cacheDir);
      
      await Promise.all(
        files.map(async file => {
          const filePath = path.join(this.options.cacheDir, file);
          const stats = await fs.stat(filePath);
          
          if (now - stats.mtime.getTime() > maxAge) {
            await fs.unlink(filePath);
          }
        })
      );
    } catch (error) {
      console.warn('Aviso: Erro ao limpar cache antigo:', error.message);
    }
  }
}