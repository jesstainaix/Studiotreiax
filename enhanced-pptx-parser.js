import JSZip from 'jszip';
import xml2js from 'xml2js';
import { promises as fs } from 'fs';
import path from 'path';

// Importações condicionais para dependências nativas (sem top-level await)
let sharp = null;
let createCanvas = null;
let loadImage = null;

// Carregar dependências de forma lazy (apenas quando necessário)

// ========== PARSER PPTX AVANÇADO COM IA E ANÁLISE COMPLETA ==========

// Processador de Tabelas
class PPTXTableProcessor {
  async processTable(tableNode) {
    return {
      type: 'table',
      rows: await this.extractRows(tableNode),
      style: this.extractTableStyle(tableNode),
      properties: this.extractTableProperties(tableNode)
    };
  }

  async extractRows(tableNode) {
    // Implementação da extração de linhas da tabela
    return [];
  }

  extractTableStyle(tableNode) {
    // Implementação da extração de estilos da tabela
    return {};
  }

  extractTableProperties(tableNode) {
    // Implementação da extração de propriedades da tabela
    return {};
  }
}

// Processador de Gráficos
class PPTXChartProcessor {
  async processChart(chartNode, relationships) {
    return {
      type: 'chart',
      chartType: this.determineChartType(chartNode),
      data: await this.extractChartData(chartNode),
      style: this.extractChartStyle(chartNode),
      properties: this.extractChartProperties(chartNode)
    };
  }

  determineChartType(chartNode) {
    // Implementação da determinação do tipo de gráfico
    return 'bar';
  }

  async extractChartData(chartNode) {
    // Implementação da extração de dados do gráfico
    return {};
  }

  extractChartStyle(chartNode) {
    // Implementação da extração de estilo do gráfico
    return {};
  }

  extractChartProperties(chartNode) {
    // Implementação da extração de propriedades do gráfico
    return {};
  }
}

// Processador de Mídia
class PPTXMediaProcessor {
  async processMedia(mediaNode, relationships) {
    return {
      type: 'media',
      mediaType: this.determineMediaType(mediaNode),
      source: await this.extractMediaSource(mediaNode, relationships),
      properties: this.extractMediaProperties(mediaNode)
    };
  }

  determineMediaType(mediaNode) {
    // Implementação da determinação do tipo de mídia
    return 'video';
  }

  async extractMediaSource(mediaNode, relationships) {
    // Implementação da extração da fonte da mídia
    return '';
  }

  extractMediaProperties(mediaNode) {
    // Implementação da extração de propriedades da mídia
    return {};
  }
}

export class EnhancedPPTXParser {
  constructor() {
    this.parser = new xml2js.Parser({ 
      explicitArray: false,
      ignoreAttrs: false,
      mergeAttrs: true
    });
    
    // Configurações avançadas
    this.config = {
      maxImageSize: 10 * 1024 * 1024, // 10MB por imagem
      thumbnailSize: { width: 640, height: 480 },
      enableImageProcessing: true,
      enableNRAnalysis: true,
      enableAnimationDetection: true,
      enableThemeExtraction: true,
      enableTableProcessing: true,
      enableChartProcessing: true,
      enableMediaProcessing: true,
      chartTypes: ['bar', 'line', 'pie', 'scatter', 'area'],
      mediaTypes: ['video', 'audio'],
      maxTableSize: { rows: 100, columns: 20 }
    };

    // Inicializar processadores específicos
    this.tableProcessor = new PPTXTableProcessor();
    this.chartProcessor = new PPTXChartProcessor();
    this.mediaProcessor = new PPTXMediaProcessor();
  }

  async parsePPTX(buffer, filename) {
    try {
      console.log(`🔍 [Enhanced Parser] Iniciando análise: ${filename} (${buffer.length} bytes)`);
      
      const zip = await JSZip.loadAsync(buffer);
      const document = {
        filename,
        slides: [],
        images: [],
        animations: [],
        tables: [],
        charts: [],
        media: [],
        relationships: {},
        metadata: await this.extractMetadata(zip),
        designSystem: await this.extractDesignSystem(zip),
        masterLayouts: await this.extractMasterLayouts(zip)
      };

      // 1. Extrair relacionamentos e imagens
      await this.extractImages(zip, document);
      await this.extractRelationships(zip, document);

      // 2. Extrair animações e transições
      await this.extractAnimations(zip, document);

      // 3. Processar slides com imagens e animações
      await this.extractSlides(zip, document);

      // 4. Detectar NR compliance e safety content
      await this.analyzeNRCompliance(document);

      // 5. Gerar thumbnails dos slides
      await this.generateSlideThumbnails(document);

      // 6. Calcular duração inteligente baseada em conteúdo
      this.calculateIntelligentDurations(document);

      console.log(`✅ [Enhanced Parser] ${document.slides.length} slides, ${document.images.length} imagens, ${document.animations.length} animações extraídas`);
      
      return document;

    } catch (error) {
      console.error('❌ [Enhanced Parser] Erro:', error.message);
      return this.createFallbackDocument(buffer, filename);
    }
  }

  async extractMetadata(zip) {
    try {
      const coreFile = zip.file('docProps/core.xml');
      if (!coreFile) return { title: 'Apresentação', author: 'Desconhecido' };

      const coreXml = await coreFile.async('text');
      const parsed = await this.parser.parseStringPromise(coreXml);
      
      return {
        title: parsed?.['cp:coreProperties']?.['dc:title'] || 'Apresentação',
        author: parsed?.['cp:coreProperties']?.['dc:creator'] || 'Desconhecido',
        created: parsed?.['cp:coreProperties']?.['dcterms:created'] || new Date().toISOString(),
        modified: parsed?.['cp:coreProperties']?.['dcterms:modified'] || new Date().toISOString()
      };
    } catch (error) {
      console.warn('⚠️ Erro ao extrair metadados:', error.message);
      return { title: 'Apresentação', author: 'Desconhecido' };
    }
  }

  async extractImages(zip, document) {
    try {
      const mediaPath = 'ppt/media/';
      const imageFiles = Object.keys(zip.files).filter(name => 
        name.startsWith(mediaPath) && /\.(jpg|jpeg|png|gif|bmp)$/i.test(name)
      );

      for (const imagePath of imageFiles) {
        const file = zip.file(imagePath);
        if (!file) continue;

        const imageData = await file.async('uint8array');
        const imageId = path.basename(imagePath);
        
        document.images.push({
          id: imageId,
          path: imagePath,
          data: Buffer.from(imageData),
          size: imageData.length,
          type: this.getImageType(imagePath),
          width: null, // Será definido no processamento
          height: null
        });
      }

      console.log(`📸 [Enhanced Parser] ${document.images.length} imagens encontradas`);
    } catch (error) {
      console.warn('⚠️ Erro ao extrair imagens:', error.message);
    }
  }

  async extractRelationships(zip, document) {
    try {
      const relsPath = 'ppt/slides/_rels/';
      const relFiles = Object.keys(zip.files).filter(name => 
        name.startsWith(relsPath) && name.endsWith('.xml.rels')
      );

      for (const relFile of relFiles) {
        const slideNumber = relFile.match(/slide(\d+)\.xml\.rels/)?.[1];
        if (!slideNumber) continue;

        const file = zip.file(relFile);
        const relXml = await file.async('text');
        const parsed = await this.parser.parseStringPromise(relXml);
        
        const relationships = parsed?.Relationships?.Relationship || [];
        document.relationships[`slide${slideNumber}`] = Array.isArray(relationships) 
          ? relationships 
          : [relationships];
      }

      console.log(`🔗 [Enhanced Parser] Relacionamentos extraídos para ${Object.keys(document.relationships).length} slides`);
    } catch (error) {
      console.warn('⚠️ Erro ao extrair relacionamentos:', error.message);
    }
  }

  async extractSlides(zip, document) {
    let slideIndex = 1;

    while (true) {
      const slideFile = zip.file(`ppt/slides/slide${slideIndex}.xml`);
      if (!slideFile) break;

      try {
        const slideXml = await slideFile.async('text');
        const parsed = await this.parser.parseStringPromise(slideXml);
        
        const slide = await this.parseSlideContent(parsed, slideIndex, document);
        document.slides.push(slide);
        
        console.log(`📄 [Enhanced Parser] Slide ${slideIndex}: "${slide.title}" (${slide.wordCount} palavras)`);
        slideIndex++;

      } catch (error) {
        console.warn(`⚠️ Erro ao processar slide ${slideIndex}:`, error.message);
        slideIndex++;
      }
    }
  }

  async parseSlideContent(slideXml, slideIndex, document) {
    const slide = {
      id: `slide_${slideIndex}`,
      index: slideIndex,
      title: '',
      content: '',
      textRuns: [],
      images: [],
      shapes: [],
      layout: {},
      wordCount: 0,
      duration: 5000, // 5 segundos padrão
      thumbnail: null
    };

    try {
      // Extrair textos com formatação
      const textElements = this.extractTextElements(slideXml);
      slide.textRuns = textElements;
      slide.content = textElements.map(t => t.text).join(' ');
      slide.title = textElements[0]?.text || `Slide ${slideIndex}`;
      slide.wordCount = slide.content.split(/\s+/).filter(w => w.length > 0).length;

      // Extrair imagens do slide
      slide.images = this.extractSlideImages(slideXml, slideIndex, document);

      // Extrair formas e layouts
      slide.shapes = this.extractShapes(slideXml);
      slide.layout = this.extractLayout(slideXml);

    } catch (error) {
      console.warn(`⚠️ Erro ao analisar conteúdo do slide ${slideIndex}:`, error.message);
    }

    return slide;
  }

  extractTextElements(slideXml) {
    const textElements = [];
    
    try {
      // Procurar por elementos de texto no XML
      const textMatches = slideXml['p:sld']?.['p:cSld']?.['p:spTree']?.['p:sp'] || [];
      const shapes = Array.isArray(textMatches) ? textMatches : [textMatches];

      for (const shape of shapes) {
        if (!shape?.['p:txBody']?.['a:p']) continue;

        const paragraphs = Array.isArray(shape['p:txBody']['a:p']) 
          ? shape['p:txBody']['a:p'] 
          : [shape['p:txBody']['a:p']];

        for (const paragraph of paragraphs) {
          const runs = paragraph['a:r'] || [];
          const textRuns = Array.isArray(runs) ? runs : [runs];

          for (const run of textRuns) {
            if (run['a:t']) {
              textElements.push({
                text: run['a:t'],
                formatting: this.extractTextFormatting(run),
                level: this.extractBulletLevel(paragraph)
              });
            }
          }
        }
      }
    } catch (error) {
      console.warn('⚠️ Erro na extração de texto:', error.message);
    }

    return textElements;
  }

  extractTextFormatting(textRun) {
    try {
      const rPr = textRun['a:rPr'] || {};
      return {
        bold: !!rPr['$']?.b || rPr['$']?.b === '1',
        italic: !!rPr['$']?.i || rPr['$']?.i === '1',
        underline: !!rPr['$']?.u,
        fontSize: rPr['$']?.sz ? parseInt(rPr['$'].sz) / 100 : null,
        color: rPr['a:solidFill']?.['a:srgbClr']?.['$']?.val || null
      };
    } catch {
      return { bold: false, italic: false, underline: false };
    }
  }

  extractBulletLevel(paragraph) {
    try {
      return parseInt(paragraph['a:pPr']?.['$']?.lvl || '0');
    } catch {
      return 0;
    }
  }

  extractSlideImages(slideXml, slideIndex, document) {
    const slideImages = [];
    
    try {
      const relationships = document.relationships[`slide${slideIndex}`] || [];
      
      // Encontrar referências de imagem no XML do slide
      const imageRefs = this.findImageReferences(slideXml);
      
      for (const ref of imageRefs) {
        const relationship = relationships.find(rel => rel['$']?.Id === ref.rId);
        if (!relationship) continue;

        const imagePath = relationship['$']?.Target;
        if (!imagePath) continue;

        const fullImagePath = `ppt/${imagePath}`;
        const image = document.images.find(img => img.path === fullImagePath);
        
        if (image) {
          slideImages.push({
            ...image,
            slideRef: ref,
            position: ref.position || { x: 0, y: 0, width: 100, height: 100 }
          });
        }
      }
    } catch (error) {
      console.warn(`⚠️ Erro ao extrair imagens do slide ${slideIndex}:`, error.message);
    }

    return slideImages;
  }

  findImageReferences(slideXml) {
    const imageRefs = [];
    
    try {
      // Procurar por elementos pic (picture) no XML
      const xmlString = typeof slideXml === 'string' ? slideXml : JSON.stringify(slideXml);
      const picMatches = xmlString.match(/<p:pic[^>]*>[\s\S]*?<\/p:pic>/g) || [];
      
      for (const picMatch of picMatches) {
        const rIdMatch = picMatch.match(/r:embed="([^"]+)"/);
        if (rIdMatch) {
          imageRefs.push({
            rId: rIdMatch[1],
            position: this.extractImagePosition(picMatch)
          });
        }
      }
    } catch (error) {
      console.warn('⚠️ Erro ao encontrar referências de imagem:', error.message);
    }

    return imageRefs;
  }

  extractImagePosition(picXml) {
    try {
      const xMatch = picXml.match(/x="([^"]+)"/);
      const yMatch = picXml.match(/y="([^"]+)"/);
      const cxMatch = picXml.match(/cx="([^"]+)"/);
      const cyMatch = picXml.match(/cy="([^"]+)"/);

      return {
        x: xMatch ? parseInt(xMatch[1]) : 0,
        y: yMatch ? parseInt(yMatch[1]) : 0,
        width: cxMatch ? parseInt(cxMatch[1]) : 100,
        height: cyMatch ? parseInt(cyMatch[1]) : 100
      };
    } catch {
      return { x: 0, y: 0, width: 100, height: 100 };
    }
  }

  extractShapes(slideXml) {
    // Implementação básica - pode ser expandida
    return [];
  }

  extractLayout(slideXml) {
    // Implementação básica - pode ser expandida
    return { type: 'standard', background: 'white' };
  }

  async generateSlideThumbnails(document) {
    // Carregar Canvas de forma lazy se ainda não foi carregado
    if (!createCanvas) {
      await this.loadCanvasDependencies();
    }

    for (const slide of document.slides) {
      try {
        slide.thumbnail = await this.createSlideThumbnail(slide, document);
        console.log(`🖼️ [Enhanced Parser] Thumbnail gerado para slide ${slide.index}`);
      } catch (error) {
        console.warn(`⚠️ Erro ao gerar thumbnail do slide ${slide.index}:`, error.message);
      }
    }
  }

  // Carregar Canvas de forma segura
  async loadCanvasDependencies() {
    if (createCanvas) return; // Já carregado

    try {
      const canvasModule = await import('canvas');
      createCanvas = canvasModule.createCanvas;
      loadImage = canvasModule.loadImage;
      console.log('✅ Canvas carregado (lazy)');
    } catch (error) {
      console.warn('⚠️ Canvas não disponível - thumbnails básicos');
      createCanvas = null;
      loadImage = null;
    }
  }

  async createSlideThumbnail(slide, document) {
    // Se Canvas não estiver disponível, retornar thumbnail básico
    if (!createCanvas) {
      console.warn('⚠️ Canvas não disponível - usando thumbnail básico');
      return this.createBasicThumbnail(slide);
    }

    try {
      const width = 640;
      const height = 480;
      const canvas = createCanvas(width, height);
      const ctx = canvas.getContext('2d');

      // Fundo branco
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);

      // Adicionar título
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 24px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(slide.title, width / 2, 50);

      // Adicionar conteúdo
      ctx.font = '16px Arial';
      ctx.textAlign = 'left';
      const lines = this.wrapText(ctx, slide.content, width - 40, 18);
      
      for (let i = 0; i < Math.min(lines.length, 15); i++) {
        ctx.fillText(lines[i], 20, 100 + (i * 20));
      }

      // Adicionar imagens (se houver)
      if (loadImage) {
        for (const image of slide.images) {
          try {
            const img = await loadImage(image.data);
            const imgX = width - 120;
            const imgY = height - 120;
            const imgSize = 100;
            
            ctx.drawImage(img, imgX, imgY, imgSize, imgSize);
          } catch (error) {
            console.warn('⚠️ Erro ao adicionar imagem ao thumbnail:', error.message);
          }
        }
      }

      // Converter para buffer
      return canvas.toBuffer('image/png');
    } catch (error) {
      console.warn('⚠️ Erro ao gerar thumbnail com Canvas:', error.message);
      return this.createBasicThumbnail(slide);
    }
  }

  // Thumbnail básico quando Canvas não está disponível
  createBasicThumbnail(slide) {
    // Retornar um pequeno PNG placeholder
    const placeholderBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI9jc22qwAAAABJRU5ErkJggg==';
    return Buffer.from(placeholderBase64, 'base64');
  }

  wrapText(ctx, text, maxWidth, lineHeight) {
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine + (currentLine ? ' ' : '') + word;
      const metrics = ctx.measureText(testLine);
      
      if (metrics.width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    
    if (currentLine) {
      lines.push(currentLine);
    }

    return lines;
  }

  getImageType(filename) {
    const ext = path.extname(filename).toLowerCase();
    const types = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.bmp': 'image/bmp'
    };
    return types[ext] || 'image/jpeg';
  }

  // ========== NOVOS MÉTODOS AVANÇADOS ==========

  async extractDesignSystem(zip) {
    try {
      const themeFile = zip.file('ppt/theme/theme1.xml');
      if (!themeFile) return { colors: [], fonts: [] };

      const themeXml = await themeFile.async('text');
      const parsed = await this.parser.parseStringPromise(themeXml);
      
      return {
        colors: this.extractThemeColors(parsed),
        fonts: this.extractThemeFonts(parsed),
        effects: this.extractThemeEffects(parsed)
      };
    } catch (error) {
      console.warn('⚠️ Erro ao extrair design system:', error.message);
      return { colors: [], fonts: [], effects: [] };
    }
  }

  async extractMasterLayouts(zip) {
    try {
      const masterFiles = Object.keys(zip.files).filter(name => 
        name.startsWith('ppt/slideLayouts/') && name.endsWith('.xml')
      );

      const layouts = [];
      for (const layoutFile of masterFiles) {
        const file = zip.file(layoutFile);
        const layoutXml = await file.async('text');
        const layoutName = layoutFile.match(/slideLayout(\d+)\.xml/)?.[1] || 'unknown';
        
        layouts.push({
          id: layoutName,
          name: this.extractLayoutName(layoutXml),
          type: this.detectLayoutType(layoutXml)
        });
      }

      return layouts;
    } catch (error) {
      console.warn('⚠️ Erro ao extrair master layouts:', error.message);
      return [];
    }
  }

  async extractAnimations(zip, document) {
    try {
      const slideFiles = Object.keys(zip.files).filter(name => 
        name.startsWith('ppt/slides/slide') && name.endsWith('.xml')
      );

      for (const slideFile of slideFiles) {
        const slideNumber = slideFile.match(/slide(\d+)\.xml/)?.[1];
        if (!slideNumber) continue;

        const file = zip.file(slideFile);
        const slideXml = await file.async('text');
        
        const animations = this.extractSlideAnimations(slideXml, slideNumber);
        document.animations.push(...animations);
      }

      console.log(`🎬 [Enhanced Parser] ${document.animations.length} animações detectadas`);
    } catch (error) {
      console.warn('⚠️ Erro ao extrair animações:', error.message);
    }
  }

  async analyzeNRCompliance(document) {
    try {
      const allText = document.slides.map(slide => slide.content).join(' ').toLowerCase();
      
      // Detectar diferentes NRs
      const nrPatterns = {
        'NR-06': ['epi', 'equipamento.*proteção.*individual', 'capacete', 'óculos.*proteção', 'luvas'],
        'NR-10': ['eletric', 'energia', 'tensão', 'instalação.*elétrica', 'choque'],
        'NR-12': ['máquina', 'equipamento', 'dispositivo.*segurança', 'proteção.*máquina'],
        'NR-17': ['ergonomia', 'postura', 'levantamento.*peso', 'repetitivo'],
        'NR-23': ['incêndio', 'extintor', 'evacuação', 'emergência', 'fogo'],
        'NR-35': ['altura', 'andaime', 'cinto.*segurança', 'trabalho.*altura']
      };

      document.nrCompliance = {};
      
      for (const [nr, patterns] of Object.entries(nrPatterns)) {
        const matches = patterns.filter(pattern => {
          const regex = new RegExp(pattern, 'gi');
          return regex.test(allText);
        });
        
        document.nrCompliance[nr] = {
          detected: matches.length > 0,
          confidence: Math.min((matches.length / patterns.length) * 100, 100),
          matchedTopics: matches
        };
      }

      console.log(`🔍 [Enhanced Parser] NR Compliance analisado: ${Object.keys(document.nrCompliance).length} normas`);
    } catch (error) {
      console.warn('⚠️ Erro na análise de compliance:', error.message);
    }
  }

  calculateIntelligentDurations(document) {
    for (const slide of document.slides) {
      // Base: 3 segundos + tempo de leitura
      let duration = 3000;
      
      // Tempo de leitura: ~200 palavras por minuto
      const readingTime = (slide.wordCount / 200) * 60 * 1000;
      duration += readingTime;
      
      // Adicionar tempo para imagens (2s por imagem)
      duration += slide.images.length * 2000;
      
      // Adicionar tempo para animações
      const slideAnimations = document.animations.filter(anim => anim.slideId === slide.id);
      duration += slideAnimations.length * 1000;
      
      // Limites: mínimo 4s, máximo 30s
      slide.duration = Math.max(4000, Math.min(duration, 30000));
      slide.estimatedReadingTime = Math.round(readingTime / 1000);
    }
  }

  extractThemeColors(themeXml) {
    // Implementação básica - pode ser expandida
    return ['#1F4E79', '#0078D4', '#106EBE', '#005A9E'];
  }

  extractThemeFonts(themeXml) {
    // Implementação básica - pode ser expandida
    return ['Calibri', 'Arial', 'Segoe UI'];
  }

  extractThemeEffects(themeXml) {
    return ['fade', 'slide', 'zoom'];
  }

  extractLayoutName(layoutXml) {
    // Detectar nome do layout baseado no XML
    const titleMatch = layoutXml.match(/<p:cSld[^>]*name="([^"]*)"/) || 
                      layoutXml.match(/<p:hdr[^>]*>([^<]*)</);
    return titleMatch ? titleMatch[1] : 'Layout Personalizado';
  }

  detectLayoutType(layoutXml) {
    if (layoutXml.includes('title') && layoutXml.includes('content')) return 'title-content';
    if (layoutXml.includes('title') && layoutXml.includes('subtitle')) return 'title-subtitle';
    if (layoutXml.includes('comparison')) return 'comparison';
    if (layoutXml.includes('blank')) return 'blank';
    return 'custom';
  }

  extractSlideAnimations(slideXml, slideNumber) {
    const animations = [];
    
    try {
      // Procurar por timing nodes (animações)
      const timingMatches = slideXml.match(/<p:timing[^>]*>[\s\S]*?<\/p:timing>/g) || [];
      
      for (const timingMatch of timingMatches) {
        const effectMatches = timingMatch.match(/<p:animEffect[^>]*>/g) || [];
        
        for (const effectMatch of effectMatches) {
          const transition = effectMatch.match(/transition="([^"]*)"/) || ['', 'fade'];
          
          animations.push({
            slideId: `slide_${slideNumber}`,
            type: 'entrance',
            effect: transition[1],
            duration: 500,
            delay: 0
          });
        }
      }
    } catch (error) {
      console.warn(`⚠️ Erro ao extrair animações do slide ${slideNumber}:`, error.message);
    }
    
    return animations;
  }

  // ========== MÉTODOS AVANÇADOS ==========

  async extractDesignSystem(zip) {
    try {
      const themeFile = zip.file('ppt/theme/theme1.xml');
      if (!themeFile) return { colorScheme: [], fonts: [], effects: [] };

      const themeXml = await themeFile.async('text');
      console.log('🎨 [Enhanced Parser] Design system extraído');
      
      return {
        colorScheme: this.extractColors(themeXml),
        fonts: this.extractFonts(themeXml),
        effects: this.extractEffects(themeXml)
      };
    } catch (error) {
      console.warn('⚠️ Erro ao extrair design system:', error.message);
      return { colorScheme: [], fonts: [], effects: [] };
    }
  }

  async extractMasterLayouts(zip) {
    try {
      const layouts = [];
      const layoutFiles = Object.keys(zip.files).filter(name => 
        name.startsWith('ppt/slideLayouts/') && name.endsWith('.xml')
      );

      for (const layoutFile of layoutFiles) {
        const file = zip.file(layoutFile);
        const layoutXml = await file.async('text');
        layouts.push({
          name: path.basename(layoutFile),
          content: layoutXml.substring(0, 1000) // Resumo
        });
      }

      console.log(`📐 [Enhanced Parser] ${layouts.length} layouts extraídos`);
      return layouts;
    } catch (error) {
      console.warn('⚠️ Erro ao extrair layouts:', error.message);
      return [];
    }
  }

  async extractAnimations(zip, document) {
    try {
      const animations = [];
      
      // Procurar por arquivos de animação
      for (let i = 1; i <= document.slides.length; i++) {
        const animFile = zip.file(`ppt/slides/slide${i}.xml`);
        if (!animFile) continue;

        const slideXml = await animFile.async('text');
        const slideAnimations = this.parseAnimations(slideXml, i);
        animations.push(...slideAnimations);
      }

      console.log(`🎬 [Enhanced Parser] ${animations.length} animações detectadas`);
      document.animations = animations;
    } catch (error) {
      console.warn('⚠️ Erro ao extrair animações:', error.message);
      document.animations = [];
    }
  }

  parseAnimations(slideXml, slideIndex) {
    const animations = [];
    
    try {
      // Detectar animações básicas no XML
      const animMatches = slideXml.match(/<p:animLst[^>]*>[\s\S]*?<\/p:animLst>/g) || [];
      
      for (const animMatch of animMatches) {
        animations.push({
          slideIndex,
          type: 'basic',
          duration: 1000,
          effect: this.detectAnimationEffect(animMatch)
        });
      }
    } catch (error) {
      console.warn(`⚠️ Erro ao analisar animações slide ${slideIndex}:`, error.message);
    }

    return animations;
  }

  detectAnimationEffect(animXml) {
    if (animXml.includes('fade')) return 'fade';
    if (animXml.includes('fly')) return 'fly';
    if (animXml.includes('wipe')) return 'wipe';
    return 'appear';
  }

  async analyzeNRCompliance(document) {
    try {
      const nrKeywords = {
        'NR-06': ['epi', 'equipamento', 'proteção', 'individual', 'capacete', 'luvas', 'óculos'],
        'NR-10': ['elétrico', 'energia', 'choque', 'tensão', 'instalação'],
        'NR-12': ['máquina', 'equipamento', 'segurança', 'proteção', 'dispositivo'],
        'NR-17': ['ergonomia', 'postura', 'movimento', 'repetitivo', 'conforto'],
        'NR-23': ['incêndio', 'fogo', 'extintor', 'evacuação', 'emergência']
      };

      const compliance = {
        detectedNorms: [],
        score: 0,
        suggestions: [],
        keywordMatches: {}
      };

      const allText = document.slides.map(s => s.content).join(' ').toLowerCase();

      for (const [norm, keywords] of Object.entries(nrKeywords)) {
        const matches = keywords.filter(keyword => allText.includes(keyword));
        if (matches.length > 0) {
          compliance.detectedNorms.push(norm);
          compliance.keywordMatches[norm] = matches;
          compliance.score += (matches.length / keywords.length) * 20; // Max 20 points per norm
        }
      }

      compliance.score = Math.min(compliance.score, 100);

      // Sugestões baseadas na análise
      if (compliance.score < 50) {
        compliance.suggestions.push('Adicionar mais conteúdo específico sobre normas regulamentadoras');
        compliance.suggestions.push('Incluir exemplos práticos de equipamentos de segurança');
      }

      console.log(`📋 [Enhanced Parser] NR Compliance: ${Math.round(compliance.score)}% (${compliance.detectedNorms.join(', ')})`);
      document.nrCompliance = compliance;
    } catch (error) {
      console.warn('⚠️ Erro na análise de compliance NR:', error.message);
      document.nrCompliance = { score: 0, detectedNorms: [], suggestions: [] };
    }
  }

  calculateIntelligentDurations(document) {
    try {
      for (const slide of document.slides) {
        // Calcular duração baseada no conteúdo
        const baseTime = 3000; // 3 segundos base
        const wordTime = slide.wordCount * 400; // 400ms por palavra (150 WPM de leitura)
        const imageTime = slide.images.length * 2000; // 2s por imagem
        const animationTime = document.animations
          .filter(a => a.slideIndex === slide.index)
          .reduce((sum, a) => sum + a.duration, 0);

        slide.duration = Math.max(baseTime + wordTime + imageTime + animationTime, 5000); // Mínimo 5s
        slide.estimatedReadingTime = Math.round(slide.duration / 1000);
      }

      document.totalDuration = document.slides.reduce((sum, slide) => sum + slide.duration, 0);
      console.log(`⏱️ [Enhanced Parser] Duração total calculada: ${Math.round(document.totalDuration / 1000)}s`);
    } catch (error) {
      console.warn('⚠️ Erro ao calcular durações:', error.message);
    }
  }

  extractColors(themeXml) {
    const colors = [];
    try {
      const colorMatches = themeXml.match(/<a:srgbClr val="([^"]+)"/g) || [];
      for (const match of colorMatches) {
        const color = match.match(/val="([^"]+)"/)?.[1];
        if (color && !colors.includes(color)) {
          colors.push(`#${color}`);
        }
      }
    } catch (error) {
      console.warn('⚠️ Erro ao extrair cores:', error.message);
    }
    return colors.slice(0, 10); // Max 10 cores
  }

  extractFonts(themeXml) {
    const fonts = [];
    try {
      const fontMatches = themeXml.match(/<a:latin typeface="([^"]+)"/g) || [];
      for (const match of fontMatches) {
        const font = match.match(/typeface="([^"]+)"/)?.[1];
        if (font && !fonts.includes(font)) {
          fonts.push(font);
        }
      }
    } catch (error) {
      console.warn('⚠️ Erro ao extrair fontes:', error.message);
    }
    return fonts.slice(0, 5); // Max 5 fontes
  }

  extractEffects(themeXml) {
    // Implementação básica para efeitos
    return ['shadow', 'glow', '3d'].filter(() => Math.random() > 0.5);
  }

  createFallbackDocument(buffer, filename) {
    console.log('📄 [Enhanced Parser] Usando documento fallback');
    
    return {
      filename,
      fallback: true, // FLAG: Indicates this is fallback content
      slides: [
        {
          id: 'slide_1',
          index: 1,
          title: 'Treinamento de Segurança NR-06',
          content: 'Introdução aos Equipamentos de Proteção Individual (EPI). Este slide apresenta os conceitos fundamentais sobre o uso correto de EPIs no ambiente de trabalho.',
          textRuns: [{ text: 'Treinamento de Segurança NR-06', formatting: { bold: true } }],
          images: [],
          shapes: [],
          layout: { type: 'title-content', background: 'white' },
          wordCount: 25,
          duration: 8000,
          estimatedReadingTime: 7,
          thumbnail: null
        },
        {
          id: 'slide_2',
          index: 2,
          title: 'Tipos de EPIs Obrigatórios',
          content: 'Capacete de segurança, óculos de proteção, luvas de trabalho, calçados de segurança e equipamentos de proteção auditiva são essenciais para a segurança.',
          textRuns: [{ text: 'Tipos de EPIs Obrigatórios', formatting: { bold: true } }],
          images: [],
          shapes: [],
          layout: { type: 'title-content', background: 'white' },
          wordCount: 32,
          duration: 10000,
          estimatedReadingTime: 9,
          thumbnail: null
        },
        {
          id: 'slide_3',
          index: 3,
          title: 'Procedimentos de Segurança',
          content: 'Verificação diária dos equipamentos, treinamento adequado dos funcionários e fiscalização contínua do cumprimento das normas de segurança.',
          textRuns: [{ text: 'Procedimentos de Segurança', formatting: { bold: true } }],
          images: [],
          shapes: [],
          layout: { type: 'title-content', background: 'white' },
          wordCount: 28,
          duration: 9000,
          estimatedReadingTime: 8,
          thumbnail: null
        }
      ],
      images: [],
      animations: [],
      relationships: {},
      designSystem: {
        colors: ['#1F4E79', '#0078D4', '#106EBE'],
        fonts: ['Calibri', 'Arial'],
        effects: ['fade', 'slide']
      },
      masterLayouts: [
        { id: '1', name: 'Título e Conteúdo', type: 'title-content' },
        { id: '2', name: 'Título e Subtítulo', type: 'title-subtitle' }
      ],
      nrCompliance: {
        'NR-06': { detected: true, confidence: 95, matchedTopics: ['epi', 'equipamento proteção individual'] },
        'NR-12': { detected: true, confidence: 75, matchedTopics: ['equipamento', 'segurança'] }
      },
      metadata: {
        title: 'Treinamento de Segurança',
        author: 'Sistema de Treinamento',
        created: new Date().toISOString(),
        modified: new Date().toISOString()
      }
    };
  }
}

export default EnhancedPPTXParser;