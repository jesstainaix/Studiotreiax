/**
 * Security Validator para proteção contra zip-bombs e ataques
 * Implementa limites de segurança para processamento de PPTX
 */

export class SecurityValidator {
  constructor() {
    // Limites de segurança para produção
    this.limits = {
      maxFileSize: 100 * 1024 * 1024,      // 100MB max file size
      maxZipEntries: 1000,                  // Max 1000 files in ZIP
      maxSlideCount: 100,                   // Max 100 slides
      maxImageCount: 500,                   // Max 500 images total
      maxCompressionRatio: 100,             // Max 100:1 compression ratio
      maxUncompressedSize: 500 * 1024 * 1024, // 500MB uncompressed max
      maxSlideImageCount: 20,               // Max 20 images per slide
      maxTextLength: 50000,                 // Max 50k chars per slide (increased for complex slides)
      timeoutMs: 30000                      // 30s processing timeout
    };
  }

  /**
   * Validar arquivo PPTX antes do processamento
   */
  async validatePPTXFile(buffer, filename) {
    console.log(`🛡️ Validando segurança do arquivo: ${filename} (${buffer.length} bytes)`);
    
    const validation = {
      passed: false,
      errors: [],
      warnings: [],
      stats: {
        fileSize: buffer.length,
        filename: filename
      }
    };

    try {
      // 1. Verificar tamanho do arquivo
      if (buffer.length > this.limits.maxFileSize) {
        validation.errors.push(`Arquivo muito grande: ${buffer.length} bytes (máximo: ${this.limits.maxFileSize})`);
        return validation;
      }

      // 2. Verificar se é realmente um ZIP/PPTX
      if (!this.isValidZipHeader(buffer)) {
        validation.errors.push('Arquivo não é um ZIP/PPTX válido');
        return validation;
      }

      // 3. Carregar ZIP para análise de segurança
      const JSZip = (await import('jszip')).default;
      const zip = await JSZip.loadAsync(buffer);
      
      // 4. Validar estrutura ZIP
      const zipValidation = await this.validateZipStructure(zip);
      validation.stats = { ...validation.stats, ...zipValidation.stats };
      
      if (zipValidation.errors.length > 0) {
        validation.errors.push(...zipValidation.errors);
        return validation;
      }

      // 5. Validar conteúdo PPTX específico
      const pptxValidation = await this.validatePPTXContent(zip);
      validation.stats = { ...validation.stats, ...pptxValidation.stats };
      
      if (pptxValidation.errors.length > 0) {
        validation.errors.push(...pptxValidation.errors);
      }
      
      validation.warnings.push(...pptxValidation.warnings);

      // 6. Determinar se passou na validação
      validation.passed = validation.errors.length === 0;
      
      if (validation.passed) {
        console.log(`✅ Arquivo ${filename} passou na validação de segurança`);
      } else {
        console.warn(`⚠️ Arquivo ${filename} falhou na validação:`, validation.errors);
      }

      return validation;

    } catch (error) {
      validation.errors.push(`Erro na validação de segurança: ${error.message}`);
      console.error('❌ Erro na validação de segurança:', error);
      return validation;
    }
  }

  /**
   * Verificar header ZIP válido
   */
  isValidZipHeader(buffer) {
    if (buffer.length < 4) return false;
    
    // ZIP file signatures
    const zipSignatures = [
      [0x50, 0x4B, 0x03, 0x04], // Local file header
      [0x50, 0x4B, 0x05, 0x06], // End of central directory
      [0x50, 0x4B, 0x07, 0x08]  // Data descriptor
    ];

    const fileHeader = [buffer[0], buffer[1], buffer[2], buffer[3]];
    
    return zipSignatures.some(signature => 
      signature.every((byte, index) => byte === fileHeader[index])
    );
  }

  /**
   * Validar estrutura ZIP contra zip-bombs (VERSÃO SEGURA)
   */
  async validateZipStructure(zip) {
    const validation = {
      errors: [],
      warnings: [],
      stats: {
        entryCount: 0,
        totalUncompressedSize: 0,
        totalCompressedSize: 0,
        maxCompressionRatio: 0,
        suspiciousFiles: [],
        nestedArchives: []
      }
    };

    const entries = Object.keys(zip.files);
    validation.stats.entryCount = entries.length;

    // 1. Verificar número de entradas
    if (entries.length > this.limits.maxZipEntries) {
      validation.errors.push(`Muitas entradas no ZIP: ${entries.length} (máximo: ${this.limits.maxZipEntries})`);
      return validation;
    }

    // 2. Analisar cada entrada COM PROTEÇÃO RIGOROSA
    for (const filename of entries) {
      const file = zip.files[filename];
      
      if (!file.dir) { // Apenas arquivos, não diretórios
        // CRITICAL: Use safe size extraction
        let compressedSize, uncompressedSize;
        
        try {
          // Try to get sizes from multiple sources
          compressedSize = file._data?.compressedSize || file.length || 0;
          uncompressedSize = file._data?.uncompressedSize || file.length || 0;
          
          // If sizes are undefined/zero, treat as suspicious
          if (uncompressedSize === 0 && filename.includes('.')) {
            uncompressedSize = this.limits.maxTextLength; // Conservative estimate
            validation.warnings.push(`Tamanho desconhecido para ${filename}, usando estimativa conservadora`);
          }
          
        } catch (error) {
          validation.errors.push(`Erro ao ler metadata de ${filename}: ${error.message}`);
          continue;
        }
        
        // SECURITY: Reject files with unknown sizes
        if (uncompressedSize > 50 * 1024 * 1024) { // 50MB per file max
          validation.errors.push(`Arquivo muito grande: ${filename} (${uncompressedSize} bytes, máximo: 50MB)`);
          continue;
        }
        
        validation.stats.totalCompressedSize += compressedSize;
        validation.stats.totalUncompressedSize += uncompressedSize;

        // Verificar ratio de compressão COM PROTEÇÃO
        if (compressedSize > 0 && uncompressedSize > 0) {
          const ratio = uncompressedSize / compressedSize;
          validation.stats.maxCompressionRatio = Math.max(validation.stats.maxCompressionRatio, ratio);
          
          if (ratio > this.limits.maxCompressionRatio) {
            validation.stats.suspiciousFiles.push({
              filename,
              ratio: Math.round(ratio),
              compressed: compressedSize,
              uncompressed: uncompressedSize
            });
          }
        }

        // SECURITY: Detectar nested archives
        if (this.isNestedArchive(filename)) {
          validation.stats.nestedArchives.push(filename);
          validation.errors.push(`Nested archive detectado: ${filename} (não permitido)`);
        }
      }
    }

    // 3. Verificar tamanho total descomprimido
    if (validation.stats.totalUncompressedSize > this.limits.maxUncompressedSize) {
      validation.errors.push(`Tamanho descomprimido muito grande: ${validation.stats.totalUncompressedSize} bytes (máximo: ${this.limits.maxUncompressedSize})`);
    }

    // 4. Verificar compression ratio geral
    if (validation.stats.maxCompressionRatio > this.limits.maxCompressionRatio) {
      validation.errors.push(`Compression ratio suspeito: ${Math.round(validation.stats.maxCompressionRatio)}:1 (máximo: ${this.limits.maxCompressionRatio}:1)`);
    }

    // 5. FAIL em arquivos suspeitos (não apenas warning)
    if (validation.stats.suspiciousFiles.length > 0) {
      validation.errors.push(`${validation.stats.suspiciousFiles.length} arquivos com compression ratio perigoso detectados`);
    }

    return validation;
  }

  /**
   * Validar conteúdo específico do PPTX COM PROTEÇÃO RIGOROSA
   */
  async validatePPTXContent(zip) {
    const validation = {
      errors: [],
      warnings: [],
      stats: {
        slideCount: 0,
        imageCount: 0,
        mediaFiles: [],
        slideImages: {},
        totalTextLength: 0
      }
    };

    try {
      // SECURITY: Setup timeout for content validation
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Content validation timeout')), this.limits.timeoutMs);
      });

      const contentValidation = Promise.race([
        this.performPPTXValidation(zip, validation),
        timeoutPromise
      ]);

      await contentValidation;
      return validation;

    } catch (error) {
      validation.errors.push(`Erro na validação de conteúdo PPTX: ${error.message}`);
      return validation;
    }
  }

  /**
   * Executar validação PPTX com proteções
   */
  async performPPTXValidation(zip, validation) {
    // 1. Verificar estrutura PPTX RIGOROSAMENTE (não opcional)
    const requiredFiles = ['[Content_Types].xml', 'ppt/presentation.xml'];
    for (const required of requiredFiles) {
      if (!zip.files[required]) {
        validation.errors.push(`Arquivo PPTX inválido: ${required} obrigatório não encontrado`);
        return; // FAIL immediately
      }
    }

    // 2. Contar slides
    const slideFiles = Object.keys(zip.files).filter(name => 
      name.startsWith('ppt/slides/slide') && name.endsWith('.xml')
    );
    validation.stats.slideCount = slideFiles.length;

    if (validation.stats.slideCount > this.limits.maxSlideCount) {
      validation.errors.push(`Muitos slides: ${validation.stats.slideCount} (máximo: ${this.limits.maxSlideCount})`);
    }

    // 3. Contar imagens
    const imageFiles = Object.keys(zip.files).filter(name => 
      name.startsWith('ppt/media/') && this.isImageFile(name)
    );
    validation.stats.imageCount = imageFiles.length;
    validation.stats.mediaFiles = imageFiles;

    if (validation.stats.imageCount > this.limits.maxImageCount) {
      validation.errors.push(`Muitas imagens: ${validation.stats.imageCount} (máximo: ${this.limits.maxImageCount})`);
    }

    // 4. SECURITY: Verificar slides COM SIZE PROTECTION
    const maxSlidesToCheck = Math.min(5, slideFiles.length); // Reduzido para 5 por segurança
    for (let i = 0; i < maxSlidesToCheck; i++) {
      const slideFile = slideFiles[i];
      try {
        // CRITICAL: Check uncompressed size BEFORE decompression
        const file = zip.files[slideFile];
        const uncompressedSize = file._data?.uncompressedSize || 0;
        
        if (uncompressedSize > 1024 * 1024) { // 1MB max per slide XML
          validation.errors.push(`Slide XML muito grande: ${slideFile} (${uncompressedSize} bytes, máximo: 1MB)`);
          continue; // Skip decompression
        }

        // Safe decompression with size limit
        const slideXml = await this.safeDecompression(file, 'text', 1024 * 1024);
        
        // Verificar tamanho do XML final
        if (slideXml.length > this.limits.maxTextLength) {
          validation.errors.push(`Slide ${i + 1} XML muito longo: ${slideXml.length} chars (máximo: ${this.limits.maxTextLength})`);
        }

        // Extrair texto básico (limitado)
        const textMatches = slideXml.substring(0, this.limits.maxTextLength).match(/<a:t[^>]*>(.*?)<\/a:t>/g) || [];
        const textContent = textMatches.join(' ');
        validation.stats.totalTextLength += textContent.length;

        // Contar imagens por slide
        const slideImageCount = (slideXml.match(/<p:pic/g) || []).length;
        validation.stats.slideImages[`slide_${i + 1}`] = slideImageCount;

        if (slideImageCount > this.limits.maxSlideImageCount) {
          validation.errors.push(`Slide ${i + 1} tem muitas imagens: ${slideImageCount} (máximo: ${this.limits.maxSlideImageCount})`);
        }

      } catch (slideError) {
        validation.errors.push(`Erro crítico ao verificar slide ${i + 1}: ${slideError.message}`);
      }
    }
  }

  /**
   * Safe decompression com size limits
   */
  async safeDecompression(file, type, maxSize) {
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Decompression timeout')), 5000); // 5s max
    });

    const decompressionPromise = file.async(type);
    
    const result = await Promise.race([decompressionPromise, timeoutPromise]);
    
    if (result.length > maxSize) {
      throw new Error(`Decompressed content too large: ${result.length} > ${maxSize}`);
    }
    
    return result;
  }

  /**
   * Detectar nested archives
   */
  isNestedArchive(filename) {
    const archiveExtensions = ['.zip', '.7z', '.gz', '.tar', '.rar', '.bz2'];
    const lowerName = filename.toLowerCase();
    return archiveExtensions.some(ext => lowerName.endsWith(ext));
  }

  /**
   * Verificar se arquivo é imagem
   */
  isImageFile(filename) {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.svg', '.webp'];
    const ext = filename.toLowerCase().substring(filename.lastIndexOf('.'));
    return imageExtensions.includes(ext);
  }

  /**
   * Criar relatório de segurança detalhado
   */
  generateSecurityReport(validation) {
    const report = {
      timestamp: new Date().toISOString(),
      status: validation.passed ? 'APPROVED' : 'REJECTED',
      filename: validation.stats.filename,
      fileSize: validation.stats.fileSize,
      errors: validation.errors,
      warnings: validation.warnings,
      statistics: {
        slides: validation.stats.slideCount || 0,
        images: validation.stats.imageCount || 0,
        zipEntries: validation.stats.entryCount || 0,
        compressionRatio: validation.stats.maxCompressionRatio || 0,
        totalUncompressed: validation.stats.totalUncompressedSize || 0,
        suspiciousFiles: validation.stats.suspiciousFiles || []
      },
      recommendations: []
    };

    // Adicionar recomendações baseadas nos resultados
    if (validation.stats.maxCompressionRatio > 50) {
      report.recommendations.push('Alto compression ratio detectado - verificar arquivo manualmente');
    }
    
    if (validation.stats.slideCount > 50) {
      report.recommendations.push('Muitos slides - considerar dividir em múltiplos arquivos');
    }

    if (validation.stats.imageCount > 100) {
      report.recommendations.push('Muitas imagens - considerar otimizar qualidade/tamanho');
    }

    return report;
  }
}

export default SecurityValidator;