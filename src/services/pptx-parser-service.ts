import JSZip from 'jszip'
import { DOMParser } from '@xmldom/xmldom'
import { SlideContent } from './gpt4-vision-service'

interface PPTXStructure {
  slides: SlideData[]
  theme: ThemeData
  metadata: PPTXMetadata
}

interface SlideData {
  slideNumber: number
  xml: string
  relationships: RelationshipData[]
  layout: string
}

interface ThemeData {
  colorScheme: string[]
  fontScheme: string[]
  backgroundStyle: string
}

interface PPTXMetadata {
  title: string
  author: string
  created: string
  modified: string
  slideCount: number
}

interface RelationshipData {
  id: string
  type: string
  target: string
}

class PPTXParserService {
  private zip: JSZip | null = null
  private parser: DOMParser

  constructor() {
    this.parser = new DOMParser()
  }

  async parsePPTXFile(file: File): Promise<SlideContent[]> {
    
    try {
      // Load the PPTX file as a ZIP
      this.zip = await JSZip.loadAsync(file)
      
      // Log da estrutura do arquivo
      const allFiles = Object.keys(this.zip.files);
      allFiles.forEach(fileName => {
      });
      
      // Extract PPTX structure
      const structure = await this.extractPPTXStructure()
      
      // Convert to SlideContent format
      const slideContents = await this.convertToSlideContent(structure)
      
      // Estatísticas finais
      const totalTitles = slideContents.filter(s => s.text).length;
      const totalImages = slideContents.reduce((sum, s) => sum + (s.imageBase64 ? 1 : 0), 0);
      
      return slideContents
    } catch (error) {
      console.error('❌ [PARSER] Erro ao analisar slides:', error)
      console.error('🔍 [PARSER] Stack trace:', error instanceof Error ? error.stack : 'Stack não disponível');
      throw new Error('Falha ao analisar arquivo PPTX. Verifique se o arquivo não está corrompido.')
    }
  }

  private async extractPPTXStructure(): Promise<PPTXStructure> {
    if (!this.zip) throw new Error('ZIP not loaded')

    // Extract metadata
    const metadata = await this.extractMetadata()
    
    // Extract theme information
    const theme = await this.extractTheme()
    
    // Extract slides
    const slides = await this.extractSlides()
    
    return { slides, theme, metadata }
  }

  private async extractMetadata(): Promise<PPTXMetadata> {
    if (!this.zip) throw new Error('ZIP not loaded')

    try {
      const corePropsFile = this.zip.file('docProps/core.xml')
      if (!corePropsFile) {
        return {
          title: 'Untitled Presentation',
          author: 'Unknown',
          created: new Date().toISOString(),
          modified: new Date().toISOString(),
          slideCount: 0
        }
      }

      const corePropsXml = await corePropsFile.async('text')
      const doc = this.parser.parseFromString(corePropsXml, 'text/xml')
      
      return {
        title: this.getTextContent(doc, 'dc:title') || 'Untitled Presentation',
        author: this.getTextContent(doc, 'dc:creator') || 'Unknown',
        created: this.getTextContent(doc, 'dcterms:created') || new Date().toISOString(),
        modified: this.getTextContent(doc, 'dcterms:modified') || new Date().toISOString(),
        slideCount: 0 // Will be updated later
      }
    } catch (error) {
      console.error('Metadata extraction error:', error)
      return {
        title: 'Untitled Presentation',
        author: 'Unknown',
        created: new Date().toISOString(),
        modified: new Date().toISOString(),
        slideCount: 0
      }
    }
  }

  private async extractTheme(): Promise<ThemeData> {
    if (!this.zip) throw new Error('ZIP not loaded')

    try {
      const themeFile = this.zip.file('ppt/theme/theme1.xml')
      if (!themeFile) {
        return {
          colorScheme: ['#FFFFFF', '#000000'],
          fontScheme: ['Arial', 'Calibri'],
          backgroundStyle: 'white'
        }
      }

      const themeXml = await themeFile.async('text')
      const doc = this.parser.parseFromString(themeXml, 'text/xml')
      
      // Extract color scheme
      const colorScheme = this.extractColorScheme(doc)
      
      // Extract font scheme
      const fontScheme = this.extractFontScheme(doc)
      
      return {
        colorScheme,
        fontScheme,
        backgroundStyle: 'white'
      }
    } catch (error) {
      console.error('Theme extraction error:', error)
      return {
        colorScheme: ['#FFFFFF', '#000000'],
        fontScheme: ['Arial', 'Calibri'],
        backgroundStyle: 'white'
      }
    }
  }

  private async extractSlides(): Promise<SlideData[]> {
    if (!this.zip) throw new Error('ZIP not loaded')

    const slides: SlideData[] = []
    const slideFiles = Object.keys(this.zip.files).filter(name => 
      name.startsWith('ppt/slides/slide') && name.endsWith('.xml')
    )

    for (const slideFile of slideFiles) {
      try {
        const slideNumber = this.extractSlideNumber(slideFile)
        const slideXml = await this.zip.file(slideFile)?.async('text') || ''
        const relationships = await this.extractSlideRelationships(slideNumber)
        
        slides.push({
          slideNumber,
          xml: slideXml,
          relationships,
          layout: 'standard'
        })
      } catch (error) {
        console.error(`Error extracting slide ${slideFile}:`, error)
      }
    }

    return slides.sort((a, b) => a.slideNumber - b.slideNumber)
  }

  private async extractSlideRelationships(slideNumber: number): Promise<RelationshipData[]> {
    if (!this.zip) return []

    try {
      const relsFile = this.zip.file(`ppt/slides/_rels/slide${slideNumber}.xml.rels`)
      if (!relsFile) return []

      const relsXml = await relsFile.async('text')
      const doc = this.parser.parseFromString(relsXml, 'text/xml')
      
      const relationships: RelationshipData[] = []
      const relElements = doc.getElementsByTagName('Relationship')
      
      for (let i = 0; i < relElements.length; i++) {
        const rel = relElements[i]
        relationships.push({
          id: rel.getAttribute('Id') || '',
          type: rel.getAttribute('Type') || '',
          target: rel.getAttribute('Target') || ''
        })
      }
      
      return relationships
    } catch (error) {
      console.error(`Error extracting relationships for slide ${slideNumber}:`, error)
      return []
    }
  }

  private async convertToSlideContent(structure: PPTXStructure): Promise<SlideContent[]> {
    const slideContents: SlideContent[] = []

    for (const slide of structure.slides) {
      try {
        const doc = this.parser.parseFromString(slide.xml, 'text/xml')
        
        // Extract text content
        const text = this.extractTextFromSlide(doc)
        
        // Extract structured elements
        const elements = this.extractSlideElements(doc)
        
        // Extract images (if any)
        const imageBase64 = await this.extractSlideImage(slide)
        
        slideContents.push({
          slideNumber: slide.slideNumber,
          text,
          imageBase64: imageBase64 || '',
          elements
        })
      } catch (error) {
        console.error(`Error converting slide ${slide.slideNumber}:`, error)
        // Add empty slide content to maintain slide numbering
        slideContents.push({
          slideNumber: slide.slideNumber,
          text: '',
          imageBase64: '',
          elements: {
            titles: [],
            bulletPoints: [],
            images: [],
            tables: []
          }
        })
      }
    }

    return slideContents
  }

  private extractTextFromSlide(doc: Document): string {
    const textElements: string[] = []
    
    // Extract text from all text elements
    const tElements = doc.getElementsByTagName('a:t')
    for (let i = 0; i < tElements.length; i++) {
      const text = tElements[i].textContent?.trim()
      if (text) {
        textElements.push(text)
      }
    }
    
    return textElements.join(' ')
  }

  private extractSlideElements(doc: Document): {
    titles: string[]
    bulletPoints: string[]
    images: Array<{ src: string; alt: string; position?: { x: number; y: number; width: number; height: number } }>
    tables: Array<{ rows: string[][]; headers: string[] }>
    textContent: string[]
    shapes: Array<{ type: string; content: string }>
  } {
    const elements = {
      titles: [] as string[],
      bulletPoints: [] as string[],
      images: [] as Array<{ src: string; alt: string; position?: { x: number; y: number; width: number; height: number } }>,
      tables: [] as Array<{ rows: string[][]; headers: string[] }>,
      textContent: [] as string[],
      shapes: [] as Array<{ type: string; content: string }>
    }
    for (let i = 0; i < titleElements.length; i++) {
      const ph = titleElements[i]
      const type = ph.getAttribute('type')
      if (type === 'title' || type === 'ctrTitle') {
        // Find associated text
        const parent = ph.parentNode?.parentNode?.parentNode
        if (parent) {
          const text = this.extractTextFromElement(parent as Element)
          if (text && !elements.titles.includes(text)) {
            elements.titles.push(text)
          }
        }
      }
    }

    // Also check for title shapes
    const spElements = doc.getElementsByTagName('p:sp')
    for (let i = 0; i < spElements.length; i++) {
      const sp = spElements[i]
      const nvSpPr = sp.getElementsByTagName('p:nvSpPr')[0]
      if (nvSpPr) {
        const ph = nvSpPr.getElementsByTagName('p:ph')[0]
        if (ph && (ph.getAttribute('type') === 'title' || ph.getAttribute('type') === 'ctrTitle')) {
          const text = this.extractTextFromElement(sp)
          if (text && !elements.titles.includes(text)) {
            elements.titles.push(text)
          }
        }
      }
    }

    // Enhanced bullet points extraction
    const bulletElements = doc.getElementsByTagName('a:buChar')
    for (let i = 0; i < bulletElements.length; i++) {
      const bullet = bulletElements[i]
      const parent = bullet.parentNode?.parentNode
      if (parent) {
        const text = this.extractTextFromElement(parent as Element)
        if (text && !elements.bulletPoints.includes(text) && !elements.titles.includes(text)) {
          elements.bulletPoints.push(text)
        }
      }
    }

    // Also check for auto-numbered bullets
    const autoNumElements = doc.getElementsByTagName('a:buAutoNum')
    for (let i = 0; i < autoNumElements.length; i++) {
      const bullet = autoNumElements[i]
      const parent = bullet.parentNode?.parentNode
      if (parent) {
        const text = this.extractTextFromElement(parent as Element)
        if (text && !elements.bulletPoints.includes(text) && !elements.titles.includes(text)) {
          elements.bulletPoints.push(text)
        }
      }
    }

    // Enhanced image extraction with position data
    const imageElements = doc.getElementsByTagName('a:blip')
    for (let i = 0; i < imageElements.length; i++) {
      const blip = imageElements[i]
      const embed = blip.getAttribute('r:embed') || blip.getAttribute('embed')
      if (embed) {
        // Try to extract position from parent elements
        let position
        const pic = blip.closest ? blip.closest('p:pic') : this.findAncestor(blip, 'p:pic')
        if (pic) {
          const spPr = pic.getElementsByTagName('p:spPr')[0]
          if (spPr) {
            const xfrm = spPr.getElementsByTagName('a:xfrm')[0]
            if (xfrm) {
              const off = xfrm.getElementsByTagName('a:off')[0]
              const ext = xfrm.getElementsByTagName('a:ext')[0]
              if (off && ext) {
                position = {
                  x: parseInt(off.getAttribute('x') || '0'),
                  y: parseInt(off.getAttribute('y') || '0'),
                  width: parseInt(ext.getAttribute('cx') || '0'),
                  height: parseInt(ext.getAttribute('cy') || '0')
                }
              }
            }
          }
        }
        
        elements.images.push({
          src: `ppt/media/image${i + 1}.png`,
          alt: `Imagem ${i + 1} do slide`,
          position
        })
      }
    }

    // Extract all text content not captured as titles or bullets
    const allTextElements = doc.getElementsByTagName('a:t')
    for (let i = 0; i < allTextElements.length; i++) {
      const textEl = allTextElements[i]
      const text = textEl.textContent?.trim()
      if (text && !elements.titles.includes(text) && !elements.bulletPoints.includes(text) && !elements.textContent.includes(text)) {
        elements.textContent.push(text)
      }
    }

    // Extract shapes and their content
    for (let i = 0; i < spElements.length; i++) {
      const shape = spElements[i]
      const nvSpPr = shape.getElementsByTagName('p:nvSpPr')[0]
      const shapeType = nvSpPr?.getAttribute('prst') || 'unknown'
      const content = this.extractTextFromElement(shape)
      if (content && !elements.titles.includes(content) && !elements.bulletPoints.includes(content)) {
        elements.shapes.push({ type: shapeType, content })
      }
    }

    // Enhanced table extraction
    const tableElements = doc.getElementsByTagName('a:tbl')
    for (let i = 0; i < tableElements.length; i++) {
      const table = tableElements[i]
      const rows: string[][] = []
      const trElements = table.getElementsByTagName('a:tr')
      
      for (let j = 0; j < trElements.length; j++) {
        const row: string[] = []
        const tcElements = trElements[j].getElementsByTagName('a:tc')
        
        for (let k = 0; k < tcElements.length; k++) {
          const cellText = this.extractTextFromElement(tcElements[k])
          row.push(cellText || '')
        }
        
        rows.push(row)
      }
      
      elements.tables.push({
        rows: rows.slice(1), // Skip header row
        headers: rows[0] || []
      })
    }
    
    for (let i = 0; i < tElements.length; i++) {
      const text = tElements[i].textContent?.trim()
      if (text) textNodes.push(text)
    }
    
    return textNodes.join(' ')
  }

  private async extractSlideImage(slide: SlideData): Promise<string | undefined> {
    if (!this.zip) return undefined

    try {
      // Look for the first image relationship
      const imageRel = slide.relationships.find(rel => 
        rel.type.includes('image') || rel.target.includes('.png') || rel.target.includes('.jpg') || rel.target.includes('.jpeg')
      )

      if (!imageRel) return undefined

      // Construct the full path to the image
      const imagePath = `ppt/media/${imageRel.target.split('/').pop()}`
      const imageFile = this.zip.file(imagePath)
      
      if (!imageFile) return undefined

      // Get image as base64
      const imageData = await imageFile.async('base64')
      return imageData
    } catch (error) {
      console.error(`Error extracting image from slide ${slide.slideNumber}:`, error)
      return undefined
    }
  }

  private extractSlideNumber(filename: string): number {
    const match = filename.match(/slide(\d+)\.xml/)
    return match ? parseInt(match[1], 10) : 0
  }

  private getTextContent(doc: Document, tagName: string): string | null {
    const elements = doc.getElementsByTagName(tagName)
    return elements.length > 0 ? elements[0].textContent : null
  }

  private extractColorScheme(doc: Document): string[] {
    const colors: string[] = []
    
    try {
      const colorElements = doc.getElementsByTagName('a:srgbClr')
      for (let i = 0; i < Math.min(colorElements.length, 6); i++) {
        const val = colorElements[i].getAttribute('val')
        if (val) colors.push(`#${val}`)
      }
    } catch (error) {
      console.error('Color scheme extraction error:', error)
    }
    
    return colors.length > 0 ? colors : ['#FFFFFF', '#000000']
  }

  private extractFontScheme(doc: Document): string[] {
    const fonts: string[] = []
    
    try {
      const fontElements = doc.getElementsByTagName('a:latin')
      for (let i = 0; i < Math.min(fontElements.length, 4); i++) {
        const typeface = fontElements[i].getAttribute('typeface')
        if (typeface) fonts.push(typeface)
      }
    } catch (error) {
      console.error('Font scheme extraction error:', error)
    }
    
    return fonts.length > 0 ? fonts : ['Arial', 'Calibri']
  }

  // Utility method to validate PPTX file
  static async validatePPTXFile(file: File): Promise<boolean> {
    try {
      const zip = await JSZip.loadAsync(file)
      
      // Check for required PPTX structure
      const requiredFiles = [
        '[Content_Types].xml',
        'ppt/presentation.xml'
      ]
      
      for (const requiredFile of requiredFiles) {
        if (!zip.file(requiredFile)) {
          return false
        }
      }
      
      return true
    } catch (error) {
      return false
    }
  }

  // Get slide count without full parsing
  static async getSlideCount(file: File): Promise<number> {
    try {
      const zip = await JSZip.loadAsync(file)
      const slideFiles = Object.keys(zip.files).filter(name => 
        name.startsWith('ppt/slides/slide') && name.endsWith('.xml')
      )
      return slideFiles.length
    } catch (error) {
      return 0
    }
  }
}

export { PPTXParserService, type PPTXStructure, type SlideData, type PPTXMetadata }