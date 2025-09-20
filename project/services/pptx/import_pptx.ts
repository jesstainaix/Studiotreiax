import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import { exec } from 'child_process';
import JSZip from 'jszip';
import { parseString } from 'xml2js';
import * as libre from 'libreoffice-convert';

const execAsync = promisify(exec);
const parseXMLAsync = promisify(parseString);

// Types for the slides.json schema
export interface SlideData {
  id: number;
  image: string;
  title: string;
  text: string;
  notes: string;
  suggestedDurationSec: number;
}

export interface SlidesOutput {
  deck_id: string;
  source_file: string;
  slides: SlideData[];
}

export interface ConversionResult {
  success: boolean;
  slidesPath: string;
  jsonPath: string;
  slideCount: number;
  error?: string;
}

/**
 * PPTX Import Service - Phase 1 Implementation
 * Converts PPTX files to PNG slides + JSON metadata
 */
export class PPTXImportService {
  private static instance: PPTXImportService;
  
  static getInstance(): PPTXImportService {
    if (!PPTXImportService.instance) {
      PPTXImportService.instance = new PPTXImportService();
    }
    return PPTXImportService.instance;
  }

  /**
   * Main conversion method: PPTX → PNG slides + JSON metadata
   * @param inputFile Path to .pptx file
   * @param outputDir Directory for output (default: project/data)
   * @returns ConversionResult with paths and metadata
   */
  async convertPPTX(inputFile: string, outputDir: string = 'project/data'): Promise<ConversionResult> {
    try {
      // Validate input file
      if (!fs.existsSync(inputFile)) {
        throw new Error(`Arquivo PPTX não encontrado: ${inputFile}`);
      }

      const fileStats = fs.statSync(inputFile);
      if (fileStats.size > 200 * 1024 * 1024) { // 200MB limit
        throw new Error('Arquivo muito grande (máximo 200MB)');
      }

      // Create unique deck ID
      const deckId = this.generateDeckId();
      const slidesDir = path.join(outputDir, 'slides');
      const jsonPath = path.join(outputDir, 'slides.json');

      // Ensure output directories exist
      if (!fs.existsSync(slidesDir)) {
        fs.mkdirSync(slidesDir, { recursive: true });
      }

      console.log(`🔄 Iniciando conversão PPTX: ${path.basename(inputFile)}`);

      // Step 1: Extract text metadata from PPTX
      console.log('📖 Extraindo texto e metadados...');
      const textData = await this.extractTextFromPPTX(inputFile);

      // Step 2: Convert PPTX → PDF → PNG slides
      console.log('🖼️ Convertendo para imagens PNG...');
      const slideImages = await this.convertToSlideImages(inputFile, slidesDir);

      // Step 3: Generate slides.json with extracted data
      console.log('📝 Gerando metadados JSON...');
      const slidesData: SlidesOutput = {
        deck_id: deckId,
        source_file: path.basename(inputFile),
        slides: this.combineSlideData(slideImages, textData)
      };

      // Write slides.json
      fs.writeFileSync(jsonPath, JSON.stringify(slidesData, null, 2), 'utf8');

      console.log(`✅ Conversão concluída: ${slidesData.slides.length} slides gerados`);

      return {
        success: true,
        slidesPath: slidesDir,
        jsonPath: jsonPath,
        slideCount: slidesData.slides.length
      };

    } catch (error) {
      console.error('❌ Erro na conversão PPTX:', error);
      return {
        success: false,
        slidesPath: '',
        jsonPath: '',
        slideCount: 0,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  /**
   * Convert PPTX to slide images using LibreOffice + ImageMagick
   */
  private async convertToSlideImages(inputFile: string, outputDir: string): Promise<string[]> {
    const tempDir = path.join(outputDir, 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    try {
      // Step 1: Convert PPTX to PDF using LibreOffice
      const pdfBuffer = await this.convertToPDF(inputFile);
      const tempPdfPath = path.join(tempDir, 'temp_presentation.pdf');
      fs.writeFileSync(tempPdfPath, pdfBuffer);

      // Step 2: Convert PDF to PNG slides using ImageMagick
      const slideImages = await this.convertPDFToImages(tempPdfPath, outputDir);

      // Clean up temp files
      if (fs.existsSync(tempPdfPath)) {
        fs.unlinkSync(tempPdfPath);
      }

      return slideImages;

    } catch (error) {
      throw new Error(`Falha na conversão de imagens: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      // Clean up temp directory
      if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    }
  }

  /**
   * Convert PPTX to PDF using LibreOffice
   */
  private async convertToPDF(inputFile: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const fileBuffer = fs.readFileSync(inputFile);
      
      libre.convert(fileBuffer, '.pdf', undefined, (err, pdfBuffer) => {
        if (err) {
          reject(new Error(`LibreOffice conversion failed: ${err.message}`));
        } else {
          resolve(pdfBuffer);
        }
      });
    });
  }

  /**
   * Convert PDF to individual PNG slides using ImageMagick
   */
  private async convertPDFToImages(pdfPath: string, outputDir: string): Promise<string[]> {
    try {
      // Use ImageMagick to convert PDF to PNG with specific resolution
      const outputPattern = path.join(outputDir, 'slide_%d.png');
      const cmd = `convert -density 300 -background white -alpha remove "${pdfPath}" -resize 1920x1080 "${outputPattern}"`;
      
      console.log(`Executing: ${cmd}`);
      await execAsync(cmd);

      // Find generated PNG files
      const files = fs.readdirSync(outputDir);
      const slideFiles = files
        .filter(file => file.startsWith('slide_') && file.endsWith('.png'))
        .sort((a, b) => {
          const aNum = parseInt(a.match(/slide_(\d+)\.png/)?.[1] || '0');
          const bNum = parseInt(b.match(/slide_(\d+)\.png/)?.[1] || '0');
          return aNum - bNum;
        });

      if (slideFiles.length === 0) {
        throw new Error('Nenhuma imagem de slide foi gerada');
      }

      return slideFiles.map(file => `slides/${file}`);

    } catch (error) {
      throw new Error(`ImageMagick conversion failed: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  /**
   * Extract text content from PPTX file using JSZip + XML parsing
   */
  private async extractTextFromPPTX(inputFile: string): Promise<Array<{title: string, text: string, notes: string}>> {
    try {
      const data = fs.readFileSync(inputFile);
      const zip = await JSZip.loadAsync(data);
      
      const slidesData: Array<{title: string, text: string, notes: string}> = [];
      
      // Get slides from ppt/slides/ directory
      const slideFiles = Object.keys(zip.files)
        .filter(filename => filename.startsWith('ppt/slides/slide') && filename.endsWith('.xml'))
        .sort();

      for (const slideFile of slideFiles) {
        const slideXml = await zip.files[slideFile].async('text');
        const slideData = await this.parseSlideXML(slideXml);
        slidesData.push(slideData);
      }

      // Also try to get notes if they exist
      const notesFiles = Object.keys(zip.files)
        .filter(filename => filename.startsWith('ppt/notesSlides/notesSlide') && filename.endsWith('.xml'))
        .sort();

      for (let i = 0; i < notesFiles.length && i < slidesData.length; i++) {
        const notesXml = await zip.files[notesFiles[i]].async('text');
        const notesText = await this.parseNotesXML(notesXml);
        if (slidesData[i]) {
          slidesData[i].notes = notesText;
        }
      }

      return slidesData;

    } catch (error) {
      console.warn('Aviso: Falha na extração de texto, usando dados padrão:', error);
      // Return default data if text extraction fails
      return [{
        title: 'Slide sem título',
        text: 'Conteúdo não disponível',
        notes: ''
      }];
    }
  }

  /**
   * Parse slide XML to extract title and text content
   */
  private async parseSlideXML(xmlContent: string): Promise<{title: string, text: string, notes: string}> {
    try {
      const result = await parseXMLAsync(xmlContent);
      
      let title = '';
      let text = '';
      
      // Navigate through the XML structure to find text content
      const shapes = result?.['p:sld']?.['p:cSld']?.[0]?.['p:spTree']?.[0]?.['p:sp'] || [];
      
      for (const shape of shapes) {
        const textBody = shape?.['p:txBody']?.[0];
        if (textBody) {
          const paragraphs = textBody['a:p'] || [];
          const shapeText = this.extractTextFromParagraphs(paragraphs);
          
          // First text shape is typically the title
          if (!title && shapeText.trim()) {
            title = shapeText.trim();
          } else if (shapeText.trim()) {
            text += (text ? '\n' : '') + shapeText.trim();
          }
        }
      }

      return {
        title: title || 'Slide sem título',
        text: text || 'Conteúdo não disponível',
        notes: '' // Will be filled by parseNotesXML if available
      };

    } catch (error) {
      console.warn('Erro ao processar XML do slide:', error);
      return {
        title: 'Slide sem título',
        text: 'Erro na extração de texto',
        notes: ''
      };
    }
  }

  /**
   * Parse notes XML to extract speaker notes
   */
  private async parseNotesXML(xmlContent: string): Promise<string> {
    try {
      const result = await parseXMLAsync(xmlContent);
      const shapes = result?.['p:notes']?.['p:cSld']?.[0]?.['p:spTree']?.[0]?.['p:sp'] || [];
      
      for (const shape of shapes) {
        const textBody = shape?.['p:txBody']?.[0];
        if (textBody) {
          const paragraphs = textBody['a:p'] || [];
          const notesText = this.extractTextFromParagraphs(paragraphs);
          if (notesText.trim()) {
            return notesText.trim();
          }
        }
      }
      
      return '';
    } catch (error) {
      console.warn('Erro ao processar XML das notas:', error);
      return '';
    }
  }

  /**
   * Extract text from paragraph elements
   */
  private extractTextFromParagraphs(paragraphs: any[]): string {
    let text = '';
    
    for (const paragraph of paragraphs) {
      const runs = paragraph['a:r'] || [];
      for (const run of runs) {
        const textContent = run['a:t']?.[0];
        if (typeof textContent === 'string') {
          text += textContent;
        }
      }
      text += '\n';
    }
    
    return text;
  }

  /**
   * Combine slide images with extracted text data
   */
  private combineSlideData(slideImages: string[], textData: Array<{title: string, text: string, notes: string}>): SlideData[] {
    return slideImages.map((imagePath, index) => {
      const slideText = textData[index] || {
        title: `Slide ${index + 1}`,
        text: 'Conteúdo não disponível',
        notes: ''
      };

      return {
        id: index + 1,
        image: imagePath,
        title: slideText.title,
        text: slideText.text,
        notes: slideText.notes,
        suggestedDurationSec: this.calculateSuggestedDuration(slideText.text)
      };
    });
  }

  /**
   * Calculate suggested duration based on text length
   */
  private calculateSuggestedDuration(text: string): number {
    const words = text.split(/\s+/).length;
    const baseTimePerWord = 0.4; // seconds per word for Portuguese
    const baseDuration = words * baseTimePerWord;
    
    // Minimum 3 seconds, maximum 30 seconds per slide
    return Math.max(3, Math.min(30, Math.round(baseDuration)));
  }

  /**
   * Generate unique deck ID
   */
  private generateDeckId(): string {
    return `deck_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Validate PPTX file (check if it's corrupted)
   */
  async validatePPTX(filePath: string): Promise<{ valid: boolean; error?: string }> {
    try {
      const data = fs.readFileSync(filePath);
      const zip = await JSZip.loadAsync(data);
      
      // Check for essential PPTX files
      const requiredFiles = ['[Content_Types].xml', 'ppt/presentation.xml'];
      const missingFiles = requiredFiles.filter(file => !zip.files[file]);
      
      if (missingFiles.length > 0) {
        return {
          valid: false,
          error: `Arquivo PPTX corrompido: arquivos ausentes ${missingFiles.join(', ')}`
        };
      }

      return { valid: true };
      
    } catch (error) {
      return {
        valid: false,
        error: `Arquivo PPTX inválido: ${error instanceof Error ? error.message : 'formato não reconhecido'}`
      };
    }
  }
}

export default PPTXImportService;