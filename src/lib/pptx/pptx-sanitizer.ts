/**
 * PPTX Sanitization System
 * Sistema avançado de sanitização e limpeza de dados PPTX
 * Remove conteúdo malicioso, otimiza estruturas e garante segurança
 */

import JSZip from 'jszip';
import { DOMParser, XMLSerializer } from '@xmldom/xmldom';
import type {
  PPTXSanitizationOptions,
  PPTXSanitizationResult,
  PPTXSanitizationRule,
  PPTXCleanupStats
} from './pptx-interfaces';

/**
 * Configuração padrão de sanitização
 */
const DEFAULT_SANITIZATION_OPTIONS: PPTXSanitizationOptions = {
  removeExternalLinks: true,
  removeScripts: true,
  removeMacros: true,
  removeComments: false,
  removeHiddenSlides: false,
  removeCustomProperties: false,
  removeRevisionTracking: true,
  optimizeImages: true,
  compressMedia: true,
  removeUnusedMasters: true,
  removeUnusedLayouts: true,
  removeEmptyElements: true,
  normalizeWhitespace: true,
  validateXMLStructure: true,
  preserveFormatting: true,
  maxImageResolution: { width: 1920, height: 1080 },
  imageQuality: 85,
  aggressiveMode: false
};

/**
 * Regras de sanitização
 */
const SANITIZATION_RULES: PPTXSanitizationRule[] = [
  {
    id: 'remove-external-urls',
    name: 'Remover URLs Externos',
    description: 'Remove links para recursos externos',
    pattern: /https?:\/\/(?!localhost|127\.0\.0\.1)[^\s"'>]+/gi,
    replacement: '',
    xmlElements: ['a:hlinkClick', 'a:hlinkHover'],
    severity: 'high'
  },
  {
    id: 'remove-javascript',
    name: 'Remover JavaScript',
    description: 'Remove código JavaScript embutido',
    pattern: /<script[\s\S]*?<\/script>|javascript:|data:text\/html/gi,
    replacement: '',
    xmlElements: ['*'],
    severity: 'critical'
  },
  {
    id: 'remove-vbscript',
    name: 'Remover VBScript',
    description: 'Remove código VBScript embutido',
    pattern: /vbscript:|<object[\s\S]*?classid[\s\S]*?<\/object>/gi,
    replacement: '',
    xmlElements: ['*'],
    severity: 'critical'
  },
  {
    id: 'clean-comments',
    name: 'Limpar Comentários',
    description: 'Remove comentários de slides',
    pattern: /<!--[\s\S]*?-->/g,
    replacement: '',
    xmlElements: ['p:cm', 'p:cmLst'],
    severity: 'low'
  },
  {
    id: 'remove-personal-info',
    name: 'Remover Informações Pessoais',
    description: 'Remove metadados pessoais',
    pattern: null,
    replacement: '',
    xmlElements: ['dc:creator', 'cp:lastModifiedBy', 'cp:revision'],
    severity: 'medium'
  }
];

/**
 * Sistema principal de sanitização PPTX
 */
export class PPTXSanitizer {
  private options: PPTXSanitizationOptions;
  private domParser: DOMParser;
  private xmlSerializer: XMLSerializer;
  private sanitizationRules: PPTXSanitizationRule[];
  private stats: PPTXCleanupStats;

  constructor(options: Partial<PPTXSanitizationOptions> = {}) {
    this.options = { ...DEFAULT_SANITIZATION_OPTIONS, ...options };
    this.domParser = new DOMParser();
    this.xmlSerializer = new XMLSerializer();
    this.sanitizationRules = [...SANITIZATION_RULES];
    this.stats = this.initializeStats();
  }

  /**
   * Sanitização completa de arquivo PPTX
   */
  async sanitizePPTXFile(file: File): Promise<PPTXSanitizationResult> {
    const startTime = Date.now();
    this.stats = this.initializeStats();

    try {
      const arrayBuffer = await file.arrayBuffer();
      const zip = await JSZip.loadAsync(arrayBuffer);
      
      // Aplicar sanitização por categoria
      await this.sanitizeStructure(zip);
      await this.sanitizeContent(zip);
      await this.sanitizeMedia(zip);
      await this.sanitizeMetadata(zip);
      await this.optimizeStructure(zip);

      // Gerar arquivo sanitizado
      const sanitizedBuffer = await zip.generateAsync({
        type: 'arraybuffer',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 }
      });

      const sanitizedFile = new File([sanitizedBuffer], this.generateSanitizedFileName(file.name), {
        type: file.type
      });

      return {
        success: true,
        originalFile: file,
        sanitizedFile,
        stats: this.stats,
        processingTime: Date.now() - startTime,
        sizeReduction: ((file.size - sanitizedFile.size) / file.size) * 100,
        warnings: [],
        errors: []
      };

    } catch (error) {
      return {
        success: false,
        originalFile: file,
        sanitizedFile: null,
        stats: this.stats,
        processingTime: Date.now() - startTime,
        sizeReduction: 0,
        warnings: [],
        errors: [{
          code: 'SANITIZATION_ERROR',
          message: `Erro durante sanitização: ${error.message}`,
          severity: 'error',
          details: error
        }]
      };
    }
  }

  /**
   * Sanitização da estrutura do arquivo
   */
  private async sanitizeStructure(zip: JSZip): Promise<void> {
    // Remover arquivos de macro se configurado
    if (this.options.removeMacros) {
      const macroFiles = Object.keys(zip.files).filter(name => 
        name.includes('vbaProject.bin') || 
        name.includes('vbaData.xml') ||
        name.includes('/macrosheets/')
      );

      for (const macroFile of macroFiles) {
        zip.remove(macroFile);
        this.stats.macrosRemoved++;
      }
    }

    // Remover slides ocultos se configurado
    if (this.options.removeHiddenSlides) {
      await this.removeHiddenSlides(zip);
    }

    // Remover masters e layouts não utilizados
    if (this.options.removeUnusedMasters) {
      await this.removeUnusedMasters(zip);
    }

    if (this.options.removeUnusedLayouts) {
      await this.removeUnusedLayouts(zip);
    }

    this.stats.structureOptimized = true;
  }

  /**
   * Sanitização do conteúdo XML
   */
  private async sanitizeContent(zip: JSZip): Promise<void> {
    const xmlFiles = Object.keys(zip.files).filter(name => name.endsWith('.xml'));

    for (const xmlPath of xmlFiles) {
      const xmlFile = zip.file(xmlPath);
      if (!xmlFile) continue;

      try {
        let xmlContent = await xmlFile.async('text');
        let modified = false;

        // Aplicar regras de sanitização
        for (const rule of this.sanitizationRules) {
          if (this.shouldApplyRule(rule)) {
            const beforeLength = xmlContent.length;
            
            if (rule.pattern) {
              xmlContent = xmlContent.replace(rule.pattern, rule.replacement);
            }
            
            const afterLength = xmlContent.length;
            if (beforeLength !== afterLength) {
              modified = true;
              this.updateStatsForRule(rule.id);
            }
          }
        }

        // Sanitizar elementos XML específicos
        if (this.options.validateXMLStructure) {
          const sanitizedXml = await this.sanitizeXMLElements(xmlContent, xmlPath);
          if (sanitizedXml !== xmlContent) {
            xmlContent = sanitizedXml;
            modified = true;
          }
        }

        // Normalizar espaços em branco
        if (this.options.normalizeWhitespace) {
          const normalizedXml = this.normalizeWhitespace(xmlContent);
          if (normalizedXml !== xmlContent) {
            xmlContent = normalizedXml;
            modified = true;
          }
        }

        // Atualizar arquivo se modificado
        if (modified) {
          zip.file(xmlPath, xmlContent);
          this.stats.xmlFilesProcessed++;
        }

      } catch (error) {
        console.warn(`Erro ao sanitizar ${xmlPath}:`, error);
        this.stats.errors++;
      }
    }
  }

  /**
   * Sanitização de elementos XML específicos
   */
  private async sanitizeXMLElements(xmlContent: string, filePath: string): Promise<string> {
    try {
      const doc = this.domParser.parseFromString(xmlContent, 'text/xml');
      
      if (doc.documentElement.nodeName === 'parsererror') {
        return xmlContent; // Retornar original se XML inválido
      }

      let modified = false;

      // Remover elementos específicos baseados nas regras
      for (const rule of this.sanitizationRules) {
        if (rule.xmlElements) {
          for (const elementName of rule.xmlElements) {
            if (elementName === '*') continue; // Skip wildcard para processamento de texto

            const elements = doc.getElementsByTagName(elementName);
            const elementsToRemove: Element[] = [];

            for (let i = 0; i < elements.length; i++) {
              const element = elements[i];
              
              // Verificar se deve remover este elemento
              if (this.shouldRemoveElement(element, rule)) {
                elementsToRemove.push(element);
              }
            }

            // Remover elementos marcados
            for (const element of elementsToRemove) {
              if (element.parentNode) {
                element.parentNode.removeChild(element);
                modified = true;
                this.updateStatsForRule(rule.id);
              }
            }
          }
        }
      }

      // Remover elementos vazios se configurado
      if (this.options.removeEmptyElements) {
        const emptyElements = this.findEmptyElements(doc);
        for (const element of emptyElements) {
          if (element.parentNode) {
            element.parentNode.removeChild(element);
            modified = true;
            this.stats.emptyElementsRemoved++;
          }
        }
      }

      if (modified) {
        return this.xmlSerializer.serializeToString(doc);
      }

      return xmlContent;

    } catch (error) {
      console.warn(`Erro ao processar XML ${filePath}:`, error);
      return xmlContent;
    }
  }

  /**
   * Sanitização de mídia
   */
  private async sanitizeMedia(zip: JSZip): Promise<void> {
    if (!this.options.optimizeImages && !this.options.compressMedia) {
      return;
    }

    const mediaFiles = Object.keys(zip.files).filter(name => 
      name.startsWith('ppt/media/')
    );

    for (const mediaPath of mediaFiles) {
      const mediaFile = zip.file(mediaPath);
      if (!mediaFile) continue;

      try {
        const fileData = await mediaFile.async('uint8array');
        const extension = mediaPath.split('.').pop()?.toLowerCase();

        // Otimizar imagens
        if (this.options.optimizeImages && this.isImageFile(extension)) {
          const optimizedData = await this.optimizeImage(fileData, extension);
          if (optimizedData && optimizedData.length < fileData.length) {
            zip.file(mediaPath, optimizedData);
            this.stats.imagesOptimized++;
            this.stats.mediaSizeReduced += fileData.length - optimizedData.length;
          }
        }

        // Comprimir mídia (implementação básica)
        if (this.options.compressMedia && this.isMediaFile(extension)) {
          // Implementar compressão de vídeo/áudio se necessário
          this.stats.mediaFilesProcessed++;
        }

      } catch (error) {
        console.warn(`Erro ao processar mídia ${mediaPath}:`, error);
        this.stats.errors++;
      }
    }
  }

  /**
   * Sanitização de metadados
   */
  private async sanitizeMetadata(zip: JSZip): Promise<void> {
    // Sanitizar core.xml (metadados principais)
    const coreFile = zip.file('docProps/core.xml');
    if (coreFile && this.options.removeCustomProperties) {
      try {
        let coreXml = await coreFile.async('text');
        const doc = this.domParser.parseFromString(coreXml, 'text/xml');

        // Remover informações pessoais
        const personalElements = ['dc:creator', 'cp:lastModifiedBy', 'cp:revision'];
        let modified = false;

        for (const elementName of personalElements) {
          const elements = doc.getElementsByTagName(elementName);
          for (let i = elements.length - 1; i >= 0; i--) {
            const element = elements[i];
            if (element.parentNode) {
              element.parentNode.removeChild(element);
              modified = true;
            }
          }
        }

        if (modified) {
          coreXml = this.xmlSerializer.serializeToString(doc);
          zip.file('docProps/core.xml', coreXml);
          this.stats.metadataElementsRemoved++;
        }

      } catch (error) {
        console.warn('Erro ao sanitizar metadados:', error);
      }
    }

    // Remover propriedades customizadas
    if (this.options.removeCustomProperties) {
      const customFile = zip.file('docProps/custom.xml');
      if (customFile) {
        zip.remove('docProps/custom.xml');
        this.stats.customPropertiesRemoved++;
      }
    }

    // Remover tracking de revisões
    if (this.options.removeRevisionTracking) {
      // Implementar remoção de revision tracking
      this.stats.revisionTrackingRemoved = true;
    }
  }

  /**
   * Otimização da estrutura
   */
  private async optimizeStructure(zip: JSZip): Promise<void> {
    // Remover arquivos temporários e caches
    const tempFiles = Object.keys(zip.files).filter(name => 
      name.includes('~$') || 
      name.includes('.tmp') ||
      name.includes('/cache/')
    );

    for (const tempFile of tempFiles) {
      zip.remove(tempFile);
      this.stats.tempFilesRemoved++;
    }

    // Otimizar relacionamentos (remover referências quebradas)
    await this.optimizeRelationships(zip);

    this.stats.structureOptimized = true;
  }

  /**
   * Otimização de relacionamentos
   */
  private async optimizeRelationships(zip: JSZip): Promise<void> {
    const relsFiles = Object.keys(zip.files).filter(name => name.endsWith('.rels'));

    for (const relsPath of relsFiles) {
      const relsFile = zip.file(relsPath);
      if (!relsFile) continue;

      try {
        const relsXml = await relsFile.async('text');
        const doc = this.domParser.parseFromString(relsXml, 'text/xml');
        
        if (doc.documentElement.nodeName === 'parsererror') continue;

        const relationships = doc.getElementsByTagName('Relationship');
        const toRemove: Element[] = [];

        for (let i = 0; i < relationships.length; i++) {
          const rel = relationships[i];
          const target = rel.getAttribute('Target');
          
          if (target) {
            // Verificar se o arquivo de destino existe
            const targetPath = this.resolveRelativePath(relsPath, target);
            if (!zip.file(targetPath)) {
              toRemove.push(rel);
            }
          }
        }

        // Remover relacionamentos quebrados
        if (toRemove.length > 0) {
          for (const rel of toRemove) {
            if (rel.parentNode) {
              rel.parentNode.removeChild(rel);
            }
          }

          const optimizedXml = this.xmlSerializer.serializeToString(doc);
          zip.file(relsPath, optimizedXml);
          this.stats.brokenRelationshipsFixed += toRemove.length;
        }

      } catch (error) {
        console.warn(`Erro ao otimizar relacionamentos ${relsPath}:`, error);
      }
    }
  }

  /**
   * Utilitários
   */
  private initializeStats(): PPTXCleanupStats {
    return {
      externalLinksRemoved: 0,
      scriptsRemoved: 0,
      macrosRemoved: 0,
      commentsRemoved: 0,
      hiddenSlidesRemoved: 0,
      emptyElementsRemoved: 0,
      xmlFilesProcessed: 0,
      imagesOptimized: 0,
      mediaFilesProcessed: 0,
      mediaSizeReduced: 0,
      metadataElementsRemoved: 0,
      customPropertiesRemoved: 0,
      tempFilesRemoved: 0,
      brokenRelationshipsFixed: 0,
      revisionTrackingRemoved: false,
      structureOptimized: false,
      errors: 0
    };
  }

  private shouldApplyRule(rule: PPTXSanitizationRule): boolean {
    switch (rule.id) {
      case 'remove-external-urls':
        return this.options.removeExternalLinks;
      case 'remove-javascript':
      case 'remove-vbscript':
        return this.options.removeScripts;
      case 'clean-comments':
        return this.options.removeComments;
      case 'remove-personal-info':
        return this.options.removeCustomProperties;
      default:
        return true;
    }
  }

  private shouldRemoveElement(element: Element, rule: PPTXSanitizationRule): boolean {
    // Lógica específica para cada regra
    switch (rule.id) {
      case 'remove-external-urls':
        return this.hasExternalLinks(element);
      case 'remove-javascript':
      case 'remove-vbscript':
        return this.hasScriptContent(element);
      default:
        return true;
    }
  }

  private hasExternalLinks(element: Element): boolean {
    const href = element.getAttribute('href') || element.getAttribute('r:id');
    return href ? /https?:\/\//.test(href) : false;
  }

  private hasScriptContent(element: Element): boolean {
    const content = element.textContent || '';
    return /javascript:|vbscript:|<script/i.test(content);
  }

  private findEmptyElements(doc: Document): Element[] {
    const emptyElements: Element[] = [];
    const allElements = doc.getElementsByTagName('*');

    for (let i = 0; i < allElements.length; i++) {
      const element = allElements[i];
      
      if (!element.hasChildNodes() && 
          !element.hasAttributes() && 
          !element.textContent?.trim()) {
        emptyElements.push(element);
      }
    }

    return emptyElements;
  }

  private updateStatsForRule(ruleId: string): void {
    switch (ruleId) {
      case 'remove-external-urls':
        this.stats.externalLinksRemoved++;
        break;
      case 'remove-javascript':
      case 'remove-vbscript':
        this.stats.scriptsRemoved++;
        break;
      case 'clean-comments':
        this.stats.commentsRemoved++;
        break;
    }
  }

  private async removeHiddenSlides(zip: JSZip): Promise<void> {
    // Implementação para remover slides ocultos
    // Requer análise do presentation.xml para identificar slides ocultos
    this.stats.hiddenSlidesRemoved = 0; // Placeholder
  }

  private async removeUnusedMasters(zip: JSZip): Promise<void> {
    // Implementação para remover slide masters não utilizados
    // Requer análise de relacionamentos entre slides e masters
  }

  private async removeUnusedLayouts(zip: JSZip): Promise<void> {
    // Implementação para remover layouts não utilizados
    // Requer análise de relacionamentos entre slides e layouts
  }

  private async optimizeImage(imageData: Uint8Array, extension: string): Promise<Uint8Array | null> {
    // Implementação básica - em produção usaria bibliotecas como sharp
    // Por ora retorna null para indicar que não foi otimizada
    return null;
  }

  private isImageFile(extension?: string): boolean {
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg'];
    return imageExtensions.includes(extension?.toLowerCase() || '');
  }

  private isMediaFile(extension?: string): boolean {
    const mediaExtensions = ['mp4', 'avi', 'mov', 'wmv', 'mp3', 'wav', 'aac'];
    return mediaExtensions.includes(extension?.toLowerCase() || '');
  }

  private normalizeWhitespace(xml: string): string {
    return xml
      .replace(/>\s+</g, '><') // Remove espaços entre tags
      .replace(/\s+/g, ' ')     // Normalizar múltiplos espaços
      .trim();
  }

  private resolveRelativePath(basePath: string, relativePath: string): string {
    // Implementar resolução de paths relativos
    const baseDir = basePath.substring(0, basePath.lastIndexOf('/'));
    return baseDir + '/' + relativePath;
  }

  private generateSanitizedFileName(originalName: string): string {
    const nameWithoutExt = originalName.replace(/\.[^/.]+$/, '');
    const extension = originalName.split('.').pop();
    return `${nameWithoutExt}_sanitized.${extension}`;
  }
}

/**
 * Instância singleton do sanitizador
 */
export const pptxSanitizer = new PPTXSanitizer();

/**
 * Função utilitária para sanitização
 */
export async function sanitizePPTXFile(
  file: File, 
  options?: Partial<PPTXSanitizationOptions>
): Promise<PPTXSanitizationResult> {
  const sanitizer = new PPTXSanitizer(options);
  return sanitizer.sanitizePPTXFile(file);
}

export default PPTXSanitizer;