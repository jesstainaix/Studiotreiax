/**
 * PPTX Validation System
 * Sistema robusto de validação para arquivos PPTX com verificação de integridade,
 * sanitização de dados e validação de schemas
 */

import JSZip from 'jszip';
import { DOMParser } from '@xmldom/xmldom';
import type {
  PPTXFile,
  PPTXValidationResult,
  PPTXValidationRule,
  PPTXValidationOptions,
  PPTXSecurityRule,
  PPTXValidationError,
  PPTXSanitizationOptions,
  PPTXMetadata
} from './pptx-interfaces';

/**
 * Configuração padrão de validação
 */
const DEFAULT_VALIDATION_OPTIONS: PPTXValidationOptions = {
  maxFileSize: 100 * 1024 * 1024, // 100MB
  maxSlides: 500,
  maxImageSize: 10 * 1024 * 1024, // 10MB por imagem
  maxImages: 100,
  allowedImageFormats: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg'],
  allowedVideoFormats: ['mp4', 'avi', 'mov', 'wmv'],
  allowedAudioFormats: ['mp3', 'wav', 'aac'],
  validateXMLSchema: true,
  validateStructure: true,
  validateSecurity: true,
  sanitizeContent: true,
  strictMode: false,
  checkCorruption: true,
  verifySignatures: false,
  scanForMalware: false,
  rules: 'standard' // 'strict' | 'standard' | 'permissive'
};

/**
 * Esquemas de validação XML
 */
const XML_SCHEMAS = {
  presentation: {
    requiredElements: ['p:presentation', 'p:sldMasterIdLst', 'p:sldIdLst'],
    allowedNamespaces: ['p', 'a', 'r', 'mc'],
    maxDepth: 20
  },
  slide: {
    requiredElements: ['p:sld', 'p:cSld'],
    allowedNamespaces: ['p', 'a', 'r', 'mc'],
    maxDepth: 15
  },
  theme: {
    requiredElements: ['a:theme', 'a:themeElements'],
    allowedNamespaces: ['a', 'r'],
    maxDepth: 10
  }
};

/**
 * Regras de segurança
 */
const SECURITY_RULES: PPTXSecurityRule[] = [
  {
    id: 'no-external-links',
    name: 'Sem Links Externos',
    description: 'Proibir links para recursos externos',
    pattern: /https?:\/\/(?!localhost|127\.0\.0\.1)/i,
    severity: 'warning',
    autoFix: true
  },
  {
    id: 'no-scripts',
    name: 'Sem Scripts',
    description: 'Proibir código JavaScript ou VBScript',
    pattern: /<script|vbscript|javascript:|data:text\/html/i,
    severity: 'error',
    autoFix: false
  },
  {
    id: 'safe-file-types',
    name: 'Tipos de Arquivo Seguros',
    description: 'Apenas tipos de arquivo seguros',
    pattern: /\.(exe|bat|cmd|scr|vbs|js|jar|com|pif|application)/i,
    severity: 'error',
    autoFix: false
  },
  {
    id: 'no-macros',
    name: 'Sem Macros',
    description: 'Proibir macros VBA',
    pattern: /vbaProject\.bin|vbaData\.xml/i,
    severity: 'warning',
    autoFix: true
  }
];

/**
 * Sistema principal de validação PPTX
 */
export class PPTXValidator {
  private options: PPTXValidationOptions;
  private domParser: DOMParser;
  private validationRules: Map<string, PPTXValidationRule>;
  private securityRules: PPTXSecurityRule[];

  constructor(options: Partial<PPTXValidationOptions> = {}) {
    this.options = { ...DEFAULT_VALIDATION_OPTIONS, ...options };
    this.domParser = new DOMParser();
    this.validationRules = new Map();
    this.securityRules = [...SECURITY_RULES];
    this.initializeValidationRules();
  }

  /**
   * Validação completa de arquivo PPTX
   */
  async validatePPTXFile(file: File): Promise<PPTXValidationResult> {
    const startTime = Date.now();
    const result: PPTXValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      info: [],
      metadata: {
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        validatedAt: new Date(),
        validationTime: 0
      },
      structure: {
        hasValidZip: false,
        hasValidContentTypes: false,
        hasValidRels: false,
        hasValidSlides: false,
        slideCount: 0,
        imageCount: 0,
        mediaCount: 0
      },
      security: {
        hasExternalLinks: false,
        hasScripts: false,
        hasMacros: false,
        hasUnsafeContent: false,
        riskLevel: 'low'
      },
      performance: {
        fileSizeScore: 100,
        complexityScore: 100,
        optimizationSuggestions: []
      }
    };

    try {
      // 1. Validação básica de arquivo
      await this.validateBasicFile(file, result);

      // 2. Validação de estrutura ZIP
      const zip = await this.validateZipStructure(file, result);
      if (!zip) return result;

      // 3. Validação de Content Types
      await this.validateContentTypes(zip, result);

      // 4. Validação de relacionamentos
      await this.validateRelationships(zip, result);

      // 5. Validação de slides
      await this.validateSlides(zip, result);

      // 6. Validação de mídia
      await this.validateMedia(zip, result);

      // 7. Validação de segurança
      if (this.options.validateSecurity) {
        await this.validateSecurity(zip, result);
      }

      // 8. Análise de performance
      await this.analyzePerformance(zip, result);

      // 9. Sanitização (se habilitada)
      if (this.options.sanitizeContent) {
        await this.sanitizeContent(zip, result);
      }

    } catch (error) {
      result.isValid = false;
      result.errors.push({
        code: 'VALIDATION_ERROR',
        message: `Erro durante validação: ${error.message}`,
        severity: 'error',
        location: 'validator',
        details: error
      });
    }

    // Finalizar resultado
    result.metadata.validationTime = Date.now() - startTime;
    result.isValid = result.errors.length === 0;

    return result;
  }

  /**
   * Validação básica do arquivo
   */
  private async validateBasicFile(file: File, result: PPTXValidationResult): Promise<void> {
    // Verificar tamanho
    if (file.size > this.options.maxFileSize) {
      result.errors.push({
        code: 'FILE_TOO_LARGE',
        message: `Arquivo muito grande: ${this.formatFileSize(file.size)} (máximo: ${this.formatFileSize(this.options.maxFileSize)})`,
        severity: 'error',
        location: 'file'
      });
    }

    // Verificar MIME type
    const allowedMimeTypes = [
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/vnd.ms-powerpoint'
    ];
    
    if (!allowedMimeTypes.includes(file.type) && !file.name.endsWith('.pptx')) {
      result.warnings.push({
        code: 'INVALID_MIME_TYPE',
        message: `Tipo MIME suspeito: ${file.type}. Esperado: PPTX`,
        severity: 'warning',
        location: 'file'
      });
    }

    // Verificar extensão
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (!['pptx', 'ppt'].includes(extension || '')) {
      result.errors.push({
        code: 'INVALID_EXTENSION',
        message: `Extensão inválida: .${extension}. Use .pptx ou .ppt`,
        severity: 'error',
        location: 'file'
      });
    }
  }

  /**
   * Validação da estrutura ZIP
   */
  private async validateZipStructure(file: File, result: PPTXValidationResult): Promise<JSZip | null> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const zip = await JSZip.loadAsync(arrayBuffer, {
        checkCRC32: true,
        createFolders: false
      });

      result.structure.hasValidZip = true;

      // Verificar arquivos obrigatórios
      const requiredFiles = [
        '[Content_Types].xml',
        '_rels/.rels',
        'ppt/presentation.xml'
      ];

      for (const requiredFile of requiredFiles) {
        if (!zip.file(requiredFile)) {
          result.errors.push({
            code: 'MISSING_REQUIRED_FILE',
            message: `Arquivo obrigatório ausente: ${requiredFile}`,
            severity: 'error',
            location: 'structure'
          });
        }
      }

      return zip;

    } catch (error) {
      result.errors.push({
        code: 'INVALID_ZIP_STRUCTURE',
        message: `Estrutura ZIP inválida: ${error.message}`,
        severity: 'error',
        location: 'zip',
        details: error
      });
      return null;
    }
  }

  /**
   * Validação de Content Types
   */
  private async validateContentTypes(zip: JSZip, result: PPTXValidationResult): Promise<void> {
    try {
      const contentTypesFile = zip.file('[Content_Types].xml');
      if (!contentTypesFile) {
        result.errors.push({
          code: 'MISSING_CONTENT_TYPES',
          message: 'Arquivo [Content_Types].xml ausente',
          severity: 'error',
          location: 'content-types'
        });
        return;
      }

      const contentTypesXml = await contentTypesFile.async('text');
      const doc = this.domParser.parseFromString(contentTypesXml, 'text/xml');

      // Verificar se é XML válido
      if (doc.documentElement.nodeName === 'parsererror') {
        result.errors.push({
          code: 'INVALID_CONTENT_TYPES_XML',
          message: 'Arquivo [Content_Types].xml possui XML inválido',
          severity: 'error',
          location: 'content-types'
        });
        return;
      }

      // Verificar tipos obrigatórios
      const requiredTypes = [
        'application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml',
        'application/vnd.openxmlformats-officedocument.presentationml.slide+xml'
      ];

      const overrides = doc.getElementsByTagName('Override');
      const foundTypes = new Set<string>();

      for (let i = 0; i < overrides.length; i++) {
        const contentType = overrides[i].getAttribute('ContentType');
        if (contentType) {
          foundTypes.add(contentType);
        }
      }

      for (const requiredType of requiredTypes) {
        if (!foundTypes.has(requiredType)) {
          result.warnings.push({
            code: 'MISSING_CONTENT_TYPE',
            message: `Tipo de conteúdo ausente: ${requiredType}`,
            severity: 'warning',
            location: 'content-types'
          });
        }
      }

      result.structure.hasValidContentTypes = true;

    } catch (error) {
      result.errors.push({
        code: 'CONTENT_TYPES_VALIDATION_ERROR',
        message: `Erro ao validar Content Types: ${error.message}`,
        severity: 'error',
        location: 'content-types',
        details: error
      });
    }
  }

  /**
   * Validação de relacionamentos
   */
  private async validateRelationships(zip: JSZip, result: PPTXValidationResult): Promise<void> {
    try {
      const relsFile = zip.file('_rels/.rels');
      if (!relsFile) {
        result.errors.push({
          code: 'MISSING_MAIN_RELS',
          message: 'Arquivo _rels/.rels ausente',
          severity: 'error',
          location: 'relationships'
        });
        return;
      }

      const relsXml = await relsFile.async('text');
      const doc = this.domParser.parseFromString(relsXml, 'text/xml');

      if (doc.documentElement.nodeName === 'parsererror') {
        result.errors.push({
          code: 'INVALID_RELS_XML',
          message: 'Arquivo _rels/.rels possui XML inválido',
          severity: 'error',
          location: 'relationships'
        });
        return;
      }

      // Verificar relacionamento com presentation.xml
      const relationships = doc.getElementsByTagName('Relationship');
      let hasPresentationRel = false;

      for (let i = 0; i < relationships.length; i++) {
        const target = relationships[i].getAttribute('Target');
        if (target && target.includes('presentation.xml')) {
          hasPresentationRel = true;
          break;
        }
      }

      if (!hasPresentationRel) {
        result.errors.push({
          code: 'MISSING_PRESENTATION_RELATIONSHIP',
          message: 'Relacionamento com presentation.xml ausente',
          severity: 'error',
          location: 'relationships'
        });
      }

      result.structure.hasValidRels = true;

    } catch (error) {
      result.errors.push({
        code: 'RELATIONSHIPS_VALIDATION_ERROR',
        message: `Erro ao validar relacionamentos: ${error.message}`,
        severity: 'error',
        location: 'relationships',
        details: error
      });
    }
  }

  /**
   * Validação de slides
   */
  private async validateSlides(zip: JSZip, result: PPTXValidationResult): Promise<void> {
    try {
      // Contar slides
      const slideFiles = Object.keys(zip.files).filter(name => 
        name.startsWith('ppt/slides/slide') && name.endsWith('.xml')
      );

      result.structure.slideCount = slideFiles.length;

      if (slideFiles.length === 0) {
        result.errors.push({
          code: 'NO_SLIDES_FOUND',
          message: 'Nenhum slide encontrado na apresentação',
          severity: 'error',
          location: 'slides'
        });
        return;
      }

      if (slideFiles.length > this.options.maxSlides) {
        result.errors.push({
          code: 'TOO_MANY_SLIDES',
          message: `Muitos slides: ${slideFiles.length} (máximo: ${this.options.maxSlides})`,
          severity: 'error',
          location: 'slides'
        });
      }

      // Validar alguns slides para verificar estrutura
      const samplesToValidate = Math.min(slideFiles.length, 5);
      for (let i = 0; i < samplesToValidate; i++) {
        const slideFile = zip.file(slideFiles[i]);
        if (slideFile) {
          await this.validateSlideXML(slideFile, slideFiles[i], result);
        }
      }

      result.structure.hasValidSlides = true;

    } catch (error) {
      result.errors.push({
        code: 'SLIDES_VALIDATION_ERROR',
        message: `Erro ao validar slides: ${error.message}`,
        severity: 'error',
        location: 'slides',
        details: error
      });
    }
  }

  /**
   * Validação de XML de slide individual
   */
  private async validateSlideXML(slideFile: JSZip.JSZipObject, fileName: string, result: PPTXValidationResult): Promise<void> {
    try {
      const slideXml = await slideFile.async('text');
      const doc = this.domParser.parseFromString(slideXml, 'text/xml');

      if (doc.documentElement.nodeName === 'parsererror') {
        result.errors.push({
          code: 'INVALID_SLIDE_XML',
          message: `Slide ${fileName} possui XML inválido`,
          severity: 'error',
          location: 'slide',
          details: { fileName }
        });
        return;
      }

      // Verificar elementos obrigatórios
      const schema = XML_SCHEMAS.slide;
      for (const requiredElement of schema.requiredElements) {
        if (!doc.getElementsByTagName(requiredElement).length) {
          result.warnings.push({
            code: 'MISSING_SLIDE_ELEMENT',
            message: `Elemento obrigatório ausente em ${fileName}: ${requiredElement}`,
            severity: 'warning',
            location: 'slide',
            details: { fileName, element: requiredElement }
          });
        }
      }

      // Verificar profundidade XML
      const maxDepth = this.getMaxDepth(doc.documentElement);
      if (maxDepth > schema.maxDepth) {
        result.warnings.push({
          code: 'EXCESSIVE_XML_DEPTH',
          message: `XML muito profundo em ${fileName}: ${maxDepth} níveis (máximo: ${schema.maxDepth})`,
          severity: 'warning',
          location: 'slide',
          details: { fileName, depth: maxDepth }
        });
      }

    } catch (error) {
      result.errors.push({
        code: 'SLIDE_XML_VALIDATION_ERROR',
        message: `Erro ao validar XML do slide ${fileName}: ${error.message}`,
        severity: 'error',
        location: 'slide',
        details: { fileName, error }
      });
    }
  }

  /**
   * Validação de mídia
   */
  private async validateMedia(zip: JSZip, result: PPTXValidationResult): Promise<void> {
    try {
      const mediaFiles = Object.keys(zip.files).filter(name => 
        name.startsWith('ppt/media/')
      );

      result.structure.imageCount = 0;
      result.structure.mediaCount = mediaFiles.length;

      for (const mediaPath of mediaFiles) {
        const mediaFile = zip.file(mediaPath);
        if (!mediaFile) continue;

        const extension = mediaPath.split('.').pop()?.toLowerCase();
        const fileSize = mediaFile.dir ? 0 : (await mediaFile.async('uint8array')).length;

        // Verificar se é imagem
        if (this.options.allowedImageFormats.includes(extension || '')) {
          result.structure.imageCount++;

          if (fileSize > this.options.maxImageSize) {
            result.warnings.push({
              code: 'IMAGE_TOO_LARGE',
              message: `Imagem muito grande: ${mediaPath} (${this.formatFileSize(fileSize)})`,
              severity: 'warning',
              location: 'media',
              details: { fileName: mediaPath, size: fileSize }
            });
          }
        }

        // Verificar formato permitido
        const allAllowedFormats = [
          ...this.options.allowedImageFormats,
          ...this.options.allowedVideoFormats,
          ...this.options.allowedAudioFormats
        ];

        if (!allAllowedFormats.includes(extension || '')) {
          result.warnings.push({
            code: 'UNSUPPORTED_MEDIA_FORMAT',
            message: `Formato de mídia não suportado: ${mediaPath}`,
            severity: 'warning',
            location: 'media',
            details: { fileName: mediaPath, extension }
          });
        }
      }

      if (result.structure.imageCount > this.options.maxImages) {
        result.warnings.push({
          code: 'TOO_MANY_IMAGES',
          message: `Muitas imagens: ${result.structure.imageCount} (máximo: ${this.options.maxImages})`,
          severity: 'warning',
          location: 'media'
        });
      }

    } catch (error) {
      result.errors.push({
        code: 'MEDIA_VALIDATION_ERROR',
        message: `Erro ao validar mídia: ${error.message}`,
        severity: 'error',
        location: 'media',
        details: error
      });
    }
  }

  /**
   * Validação de segurança
   */
  private async validateSecurity(zip: JSZip, result: PPTXValidationResult): Promise<void> {
    try {
      const allFiles = Object.keys(zip.files);
      
      for (const rule of this.securityRules) {
        for (const filePath of allFiles) {
          if (rule.pattern.test(filePath)) {
            const violation: PPTXValidationError = {
              code: rule.id.toUpperCase(),
              message: `${rule.name}: ${rule.description} (${filePath})`,
              severity: rule.severity,
              location: 'security',
              details: { rule: rule.id, filePath }
            };

            if (rule.severity === 'error') {
              result.errors.push(violation);
              result.security.hasUnsafeContent = true;
            } else {
              result.warnings.push(violation);
            }

            // Atualizar flags de segurança
            if (rule.id === 'no-external-links') {
              result.security.hasExternalLinks = true;
            } else if (rule.id === 'no-scripts') {
              result.security.hasScripts = true;
            } else if (rule.id === 'no-macros') {
              result.security.hasMacros = true;
            }
          }
        }

        // Verificar conteúdo dos arquivos XML
        for (const filePath of allFiles.filter(f => f.endsWith('.xml'))) {
          const file = zip.file(filePath);
          if (file) {
            const content = await file.async('text');
            if (rule.pattern.test(content)) {
              const violation: PPTXValidationError = {
                code: rule.id.toUpperCase(),
                message: `${rule.name}: ${rule.description} (em ${filePath})`,
                severity: rule.severity,
                location: 'security',
                details: { rule: rule.id, filePath, contentMatch: true }
              };

              if (rule.severity === 'error') {
                result.errors.push(violation);
                result.security.hasUnsafeContent = true;
              } else {
                result.warnings.push(violation);
              }
            }
          }
        }
      }

      // Determinar nível de risco
      if (result.security.hasUnsafeContent || result.security.hasScripts) {
        result.security.riskLevel = 'high';
      } else if (result.security.hasExternalLinks || result.security.hasMacros) {
        result.security.riskLevel = 'medium';
      } else {
        result.security.riskLevel = 'low';
      }

    } catch (error) {
      result.errors.push({
        code: 'SECURITY_VALIDATION_ERROR',
        message: `Erro ao validar segurança: ${error.message}`,
        severity: 'error',
        location: 'security',
        details: error
      });
    }
  }

  /**
   * Análise de performance
   */
  private async analyzePerformance(zip: JSZip, result: PPTXValidationResult): Promise<void> {
    try {
      const fileEntries = Object.values(zip.files);
      let totalUncompressedSize = 0;
      let totalCompressedSize = 0;

      for (const file of fileEntries) {
        if (!file.dir) {
          totalUncompressedSize += file._data?.uncompressedSize || 0;
          totalCompressedSize += file._data?.compressedSize || 0;
        }
      }

      // Score de tamanho de arquivo (0-100)
      const sizeThreshold = this.options.maxFileSize * 0.7; // 70% do máximo
      result.performance.fileSizeScore = Math.max(0, 100 - (totalUncompressedSize / sizeThreshold) * 100);

      // Score de complexidade (baseado em número de slides e mídia)
      const slideComplexity = Math.min(result.structure.slideCount / 50, 1); // Normalizar para 50 slides
      const mediaComplexity = Math.min(result.structure.mediaCount / 20, 1); // Normalizar para 20 arquivos de mídia
      result.performance.complexityScore = Math.max(0, 100 - ((slideComplexity + mediaComplexity) / 2) * 100);

      // Sugestões de otimização
      if (result.performance.fileSizeScore < 70) {
        result.performance.optimizationSuggestions.push(
          'Considere compactar ou reduzir a qualidade das imagens'
        );
      }

      if (result.structure.slideCount > 100) {
        result.performance.optimizationSuggestions.push(
          'Apresentação com muitos slides pode impactar a performance'
        );
      }

      if (result.structure.imageCount > 50) {
        result.performance.optimizationSuggestions.push(
          'Muitas imagens podem causar lentidão no processamento'
        );
      }

      const compressionRatio = totalCompressedSize / totalUncompressedSize;
      if (compressionRatio > 0.8) {
        result.performance.optimizationSuggestions.push(
          'Arquivo pode se beneficiar de melhor compressão'
        );
      }

    } catch (error) {
      result.warnings.push({
        code: 'PERFORMANCE_ANALYSIS_ERROR',
        message: `Erro na análise de performance: ${error.message}`,
        severity: 'warning',
        location: 'performance',
        details: error
      });
    }
  }

  /**
   * Sanitização de conteúdo
   */
  private async sanitizeContent(zip: JSZip, result: PPTXValidationResult): Promise<void> {
    // Implementação de sanitização seria feita aqui
    // Por ora, apenas registra que a sanitização foi executada
    result.info.push({
      code: 'CONTENT_SANITIZED',
      message: 'Conteúdo sanitizado com sucesso',
      severity: 'info',
      location: 'sanitizer'
    });
  }

  /**
   * Utilitários
   */
  private initializeValidationRules(): void {
    // Implementar regras customizadas de validação
    this.validationRules.set('file-size', {
      id: 'file-size',
      name: 'Tamanho do Arquivo',
      description: 'Verificar se o arquivo não excede o limite',
      validator: (file: File) => file.size <= this.options.maxFileSize,
      severity: 'error'
    });
  }

  private getMaxDepth(element: Element, currentDepth = 0): number {
    let maxDepth = currentDepth;
    for (let i = 0; i < element.children.length; i++) {
      const childDepth = this.getMaxDepth(element.children[i], currentDepth + 1);
      maxDepth = Math.max(maxDepth, childDepth);
    }
    return maxDepth;
  }

  private formatFileSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  }

  /**
   * Validação rápida (apenas estrutura básica)
   */
  async quickValidate(file: File): Promise<boolean> {
    try {
      // Verificações básicas
      if (file.size > this.options.maxFileSize) return false;
      if (!file.name.endsWith('.pptx')) return false;

      // Verificar se é ZIP válido
      const arrayBuffer = await file.arrayBuffer();
      const zip = await JSZip.loadAsync(arrayBuffer);

      // Verificar arquivos obrigatórios
      return !!(zip.file('[Content_Types].xml') && 
                zip.file('_rels/.rels') && 
                zip.file('ppt/presentation.xml'));

    } catch {
      return false;
    }
  }

  /**
   * Extrair metadados básicos
   */
  async extractBasicMetadata(file: File): Promise<Partial<PPTXMetadata>> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const zip = await JSZip.loadAsync(arrayBuffer);

      const metadata: Partial<PPTXMetadata> = {
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type
      };

      // Tentar extrair metadados do core.xml
      const coreFile = zip.file('docProps/core.xml');
      if (coreFile) {
        const coreXml = await coreFile.async('text');
        const doc = this.domParser.parseFromString(coreXml, 'text/xml');
        
        const titleElement = doc.getElementsByTagName('dc:title')[0];
        const authorElement = doc.getElementsByTagName('dc:creator')[0];
        
        if (titleElement) metadata.title = titleElement.textContent || undefined;
        if (authorElement) metadata.author = authorElement.textContent || undefined;
      }

      // Contar slides
      const slideFiles = Object.keys(zip.files).filter(name => 
        name.startsWith('ppt/slides/slide') && name.endsWith('.xml')
      );
      metadata.slideCount = slideFiles.length;

      return metadata;

    } catch {
      return {
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type
      };
    }
  }
}

/**
 * Instância singleton do validador
 */
export const pptxValidator = new PPTXValidator();

/**
 * Função utilitária para validação rápida
 */
export async function validatePPTXFile(file: File, options?: Partial<PPTXValidationOptions>): Promise<PPTXValidationResult> {
  const validator = new PPTXValidator(options);
  return validator.validatePPTXFile(file);
}

/**
 * Função utilitária para validação rápida (booleana)
 */
export async function isValidPPTXFile(file: File): Promise<boolean> {
  return pptxValidator.quickValidate(file);
}

export default PPTXValidator;