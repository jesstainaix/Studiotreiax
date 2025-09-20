import JSZip from 'jszip'
import { XMLParser } from 'fast-xml-parser'

export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
  warnings: ValidationWarning[]
  securityIssues: SecurityIssue[]
  fileInfo: FileInfo
}

export interface ValidationError {
  type: 'format' | 'structure' | 'corruption' | 'security'
  message: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  details?: any
}

export interface ValidationWarning {
  type: 'compatibility' | 'performance' | 'quality'
  message: string
  suggestion?: string
}

export interface SecurityIssue {
  type: 'macro' | 'external_link' | 'embedded_object' | 'suspicious_content'
  message: string
  risk: 'low' | 'medium' | 'high'
  location?: string
}

export interface FileInfo {
  size: number
  slideCount: number
  hasImages: boolean
  hasVideos: boolean
  hasAudio: boolean
  hasMacros: boolean
  hasExternalLinks: boolean
  compression: number
  createdDate?: Date
  modifiedDate?: Date
  application?: string
}

class PPTXValidationService {
  private xmlParser: XMLParser
  private maxFileSize: number = 100 * 1024 * 1024 // 100MB
  private allowedMimeTypes = [
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.ms-powerpoint'
  ]

  constructor() {
    this.xmlParser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      parseAttributeValue: true
    })
  }

  async validateFile(file: File): Promise<ValidationResult> {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      securityIssues: [],
      fileInfo: {
        size: file.size,
        slideCount: 0,
        hasImages: false,
        hasVideos: false,
        hasAudio: false,
        hasMacros: false,
        hasExternalLinks: false,
        compression: 0
      }
    }

    try {
      // Validação básica de arquivo
      this.validateBasicFile(file, result)
      
      if (result.errors.length > 0) {
        result.isValid = false
        return result
      }

      // Validação de estrutura PPTX
      await this.validatePPTXStructure(file, result)
      
      // Análise de segurança
      await this.performSecurityAnalysis(file, result)
      
      // Verificação de integridade
      await this.checkIntegrity(file, result)
      
      // Determinar se o arquivo é válido
      result.isValid = result.errors.filter(e => e.severity === 'critical' || e.severity === 'high').length === 0
      
    } catch (error) {
      result.errors.push({
        type: 'corruption',
        message: 'Erro inesperado durante a validação',
        severity: 'critical',
        details: error
      })
      result.isValid = false
    }

    return result
  }

  private validateBasicFile(file: File, result: ValidationResult): void {
    // Verificar tamanho
    if (file.size > this.maxFileSize) {
      result.errors.push({
        type: 'format',
        message: `Arquivo muito grande: ${(file.size / (1024 * 1024)).toFixed(2)}MB. Máximo permitido: ${this.maxFileSize / (1024 * 1024)}MB`,
        severity: 'high'
      })
    }

    // Verificar tamanho mínimo
    if (file.size < 1024) {
      result.errors.push({
        type: 'format',
        message: 'Arquivo muito pequeno para ser um PPTX válido',
        severity: 'high'
      })
    }

    // Verificar tipo MIME
    if (!this.allowedMimeTypes.includes(file.type) && !file.name.match(/\.(pptx|ppt)$/i)) {
      result.errors.push({
        type: 'format',
        message: 'Formato de arquivo não suportado. Use apenas .pptx ou .ppt',
        severity: 'critical'
      })
    }

    // Verificar nome do arquivo
    if (file.name.length > 255) {
      result.warnings.push({
        type: 'compatibility',
        message: 'Nome do arquivo muito longo',
        suggestion: 'Considere usar um nome mais curto'
      })
    }

    // Verificar caracteres especiais no nome
    if (/[<>:"|?*]/.test(file.name)) {
      result.warnings.push({
        type: 'compatibility',
        message: 'Nome do arquivo contém caracteres especiais',
        suggestion: 'Remova caracteres como < > : " | ? *'
      })
    }
  }

  private async validatePPTXStructure(file: File, result: ValidationResult): Promise<void> {
    try {
      const zip = await JSZip.loadAsync(file)
      
      // Verificar estrutura básica do PPTX
      const requiredFiles = [
        '[Content_Types].xml',
        '_rels/.rels',
        'ppt/presentation.xml'
      ]

      for (const requiredFile of requiredFiles) {
        if (!zip.file(requiredFile)) {
          result.errors.push({
            type: 'structure',
            message: `Arquivo obrigatório ausente: ${requiredFile}`,
            severity: 'critical'
          })
        }
      }

      // Analisar presentation.xml
      const presentationXml = zip.file('ppt/presentation.xml')
      if (presentationXml) {
        const xmlContent = await presentationXml.async('text')
        await this.validatePresentationXML(xmlContent, result)
      }

      // Contar slides
      const slideFiles = Object.keys(zip.files).filter(name => 
        name.startsWith('ppt/slides/slide') && name.endsWith('.xml')
      )
      result.fileInfo.slideCount = slideFiles.length

      if (slideFiles.length === 0) {
        result.errors.push({
          type: 'structure',
          message: 'Nenhum slide encontrado na apresentação',
          severity: 'high'
        })
      }

      if (slideFiles.length > 1000) {
        result.warnings.push({
          type: 'performance',
          message: 'Apresentação com muitos slides pode afetar o desempenho',
          suggestion: 'Considere dividir em apresentações menores'
        })
      }

      // Verificar mídia
      this.analyzeMediaContent(zip, result)
      
      // Calcular taxa de compressão
      const uncompressedSize = Object.values(zip.files)
        .reduce((total, file) => total + (file._data?.uncompressedSize || 0), 0)
      result.fileInfo.compression = file.size / uncompressedSize

    } catch (error) {
      result.errors.push({
        type: 'corruption',
        message: 'Não foi possível extrair o arquivo PPTX',
        severity: 'critical',
        details: error
      })
    }
  }

  private async validatePresentationXML(xmlContent: string, result: ValidationResult): Promise<void> {
    try {
      const parsed = this.xmlParser.parse(xmlContent)
      
      // Verificar estrutura básica
      if (!parsed['p:presentation']) {
        result.errors.push({
          type: 'structure',
          message: 'Estrutura XML inválida: elemento presentation ausente',
          severity: 'critical'
        })
        return
      }

      const presentation = parsed['p:presentation']
      
      // Verificar slides
      if (!presentation['p:sldIdLst'] || !presentation['p:sldIdLst']['p:sldId']) {
        result.warnings.push({
          type: 'quality',
          message: 'Nenhuma referência de slide encontrada no XML principal'
        })
      }

      // Verificar masters
      if (!presentation['p:sldMasterIdLst']) {
        result.warnings.push({
          type: 'quality',
          message: 'Nenhum slide master encontrado',
          suggestion: 'Apresentação pode ter problemas de formatação'
        })
      }

    } catch (error) {
      result.errors.push({
        type: 'corruption',
        message: 'XML de apresentação corrompido ou inválido',
        severity: 'high',
        details: error
      })
    }
  }

  private analyzeMediaContent(zip: JSZip, result: ValidationResult): void {
    const mediaFiles = Object.keys(zip.files).filter(name => 
      name.startsWith('ppt/media/')
    )

    for (const mediaFile of mediaFiles) {
      const extension = mediaFile.split('.').pop()?.toLowerCase()
      
      switch (extension) {
        case 'jpg':
        case 'jpeg':
        case 'png':
        case 'gif':
        case 'bmp':
        case 'svg':
          result.fileInfo.hasImages = true
          break
        case 'mp4':
        case 'avi':
        case 'mov':
        case 'wmv':
          result.fileInfo.hasVideos = true
          break
        case 'mp3':
        case 'wav':
        case 'wma':
          result.fileInfo.hasAudio = true
          break
      }
    }

    // Verificar tamanho de mídia
    if (mediaFiles.length > 50) {
      result.warnings.push({
        type: 'performance',
        message: 'Muitos arquivos de mídia podem afetar o desempenho',
        suggestion: 'Considere otimizar ou reduzir o número de mídias'
      })
    }
  }

  private async performSecurityAnalysis(file: File, result: ValidationResult): Promise<void> {
    try {
      const zip = await JSZip.loadAsync(file)
      
      // Verificar macros
      const vbaFiles = Object.keys(zip.files).filter(name => 
        name.includes('vbaProject') || name.includes('macros')
      )
      
      if (vbaFiles.length > 0) {
        result.fileInfo.hasMacros = true
        result.securityIssues.push({
          type: 'macro',
          message: 'Arquivo contém macros VBA',
          risk: 'high',
          location: vbaFiles.join(', ')
        })
      }

      // Verificar links externos
      await this.checkExternalLinks(zip, result)
      
      // Verificar objetos incorporados
      await this.checkEmbeddedObjects(zip, result)
      
    } catch (error) {
      result.warnings.push({
        type: 'quality',
        message: 'Não foi possível completar a análise de segurança'
      })
    }
  }

  private async checkExternalLinks(zip: JSZip, result: ValidationResult): Promise<void> {
    const relsFiles = Object.keys(zip.files).filter(name => 
      name.endsWith('.rels')
    )

    for (const relsFile of relsFiles) {
      try {
        const file = zip.file(relsFile)
        if (file) {
          const content = await file.async('text')
          const parsed = this.xmlParser.parse(content)
          
          if (parsed.Relationships?.Relationship) {
            const relationships = Array.isArray(parsed.Relationships.Relationship) 
              ? parsed.Relationships.Relationship 
              : [parsed.Relationships.Relationship]
            
            for (const rel of relationships) {
              if (rel['@_TargetMode'] === 'External' && rel['@_Target']) {
                result.fileInfo.hasExternalLinks = true
                result.securityIssues.push({
                  type: 'external_link',
                  message: `Link externo encontrado: ${rel['@_Target']}`,
                  risk: 'medium',
                  location: relsFile
                })
              }
            }
          }
        }
      } catch (error) {
        // Ignorar erros de parsing de rels individuais
      }
    }
  }

  private async checkEmbeddedObjects(zip: JSZip, result: ValidationResult): Promise<void> {
    const embeddings = Object.keys(zip.files).filter(name => 
      name.includes('embeddings/') || name.includes('oleObject')
    )

    if (embeddings.length > 0) {
      result.securityIssues.push({
        type: 'embedded_object',
        message: `${embeddings.length} objeto(s) incorporado(s) encontrado(s)`,
        risk: 'medium',
        location: embeddings.join(', ')
      })
    }
  }

  private async checkIntegrity(file: File, result: ValidationResult): Promise<void> {
    try {
      // Verificar se o arquivo pode ser lido completamente
      const buffer = await file.arrayBuffer()
      
      // Verificar assinatura ZIP
      const signature = new Uint8Array(buffer.slice(0, 4))
      const zipSignature = [0x50, 0x4B, 0x03, 0x04] // PK..
      const zipSignatureEmpty = [0x50, 0x4B, 0x05, 0x06] // PK.. (empty archive)
      
      const isValidZip = zipSignature.every((byte, index) => signature[index] === byte) ||
                        zipSignatureEmpty.every((byte, index) => signature[index] === byte)
      
      if (!isValidZip) {
        result.errors.push({
          type: 'corruption',
          message: 'Arquivo não possui assinatura ZIP válida',
          severity: 'critical'
        })
      }

      // Verificar final do arquivo
      const endSignature = new Uint8Array(buffer.slice(-4))
      // Não é obrigatório, mas pode indicar problemas
      
    } catch (error) {
      result.errors.push({
        type: 'corruption',
        message: 'Não foi possível ler o arquivo completamente',
        severity: 'critical',
        details: error
      })
    }
  }

  setMaxFileSize(size: number): void {
    this.maxFileSize = size
  }

  getMaxFileSize(): number {
    return this.maxFileSize
  }
}

export const pptxValidationService = new PPTXValidationService()
export default PPTXValidationService