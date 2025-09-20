import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import { exec } from 'child_process';
import JSZip from 'jszip';
import { parseString } from 'xml2js';
import libre from 'libreoffice-convert';

const execAsync = promisify(exec);
const parseXMLAsync = promisify(parseString);

/**
 * PPTX Import Service - Phase 1 Implementation (JavaScript version)
 * Converts PPTX files to PNG slides + JSON metadata with job-scoped outputs
 */
export class PPTXImportService {
  static instance = null;
  
  static getInstance() {
    if (!PPTXImportService.instance) {
      PPTXImportService.instance = new PPTXImportService();
    }
    return PPTXImportService.instance;
  }

  /**
   * Main conversion method: PPTX → PNG slides + JSON metadata
   * @param {string} inputFile Path to .pptx file
   * @param {string} jobId Unique job identifier for output isolation
   * @param {string} outputDir Base directory for output (default: project/data)
   * @returns {Promise<Object>} ConversionResult with paths and metadata
   */
  async convertPPTX(inputFile, jobId, outputDir = null) {
    // Use absolute path for consistent output directory (deterministic, CWD-independent)
    const baseOutputDir = outputDir || path.resolve(path.dirname(new URL(import.meta.url).pathname), '../../data');
    try {
      console.log(`🔄 Iniciando conversão PPTX real para job ${jobId}: ${path.basename(inputFile)}`);

      // Validate input file
      if (!fs.existsSync(inputFile)) {
        throw new Error(`Arquivo PPTX não encontrado: ${inputFile}`);
      }

      const fileStats = fs.statSync(inputFile);
      if (fileStats.size > 200 * 1024 * 1024) { // 200MB limit
        throw new Error('Arquivo muito grande (máximo 200MB)');
      }

      // Create job-scoped output directories
      const jobOutputDir = path.join(baseOutputDir, jobId);
      const slidesDir = path.join(jobOutputDir, 'slides');
      const jsonPath = path.join(jobOutputDir, 'slides.json');

      // Ensure output directories exist
      if (!fs.existsSync(slidesDir)) {
        fs.mkdirSync(slidesDir, { recursive: true });
      }

      // Step 1: Validate PPTX file (detect corruption)
      console.log('🔍 Validando arquivo PPTX...');
      const validation = await this.validatePPTX(inputFile);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      // Step 2: Extract text metadata from PPTX
      console.log('📖 Extraindo texto e metadados...');
      const textData = await this.extractTextFromPPTX(inputFile);

      // Step 3: Convert PPTX → PDF → PNG slides
      console.log('🖼️ Convertendo para imagens PNG...');
      const slideImages = await this.convertToSlideImages(inputFile, slidesDir);

      // Step 4: Generate slides.json with extracted data
      console.log('📝 Gerando metadados JSON...');
      const slidesData = {
        deck_id: this.generateDeckId(),
        source_file: path.basename(inputFile),
        job_id: jobId,
        created_at: new Date().toISOString(),
        slides: this.combineSlideData(slideImages, textData)
      };

      // Write slides.json
      fs.writeFileSync(jsonPath, JSON.stringify(slidesData, null, 2), 'utf8');

      console.log(`✅ Conversão concluída: ${slidesData.slides.length} slides gerados para job ${jobId}`);

      return {
        success: true,
        slidesPath: slidesDir,
        jsonPath: jsonPath,
        slideCount: slidesData.slides.length,
        jobId: jobId
      };

    } catch (error) {
      console.error(`❌ Erro na conversão PPTX para job ${jobId}:`, error);
      return {
        success: false,
        slidesPath: '',
        jsonPath: '',
        slideCount: 0,
        jobId: jobId,
        error: error.message
      };
    }
  }

  /**
   * Convert PPTX to slide images using LibreOffice + ImageMagick
   */
  async convertToSlideImages(inputFile, outputDir) {
    const tempDir = path.join(outputDir, 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    try {
      // Step 1: Convert PPTX to PDF using LibreOffice
      console.log('📄 Convertendo PPTX → PDF...');
      const pdfBuffer = await this.convertToPDF(inputFile);
      const tempPdfPath = path.join(tempDir, 'temp_presentation.pdf');
      fs.writeFileSync(tempPdfPath, pdfBuffer);

      // Step 2: Convert PDF to PNG slides using ImageMagick
      console.log('🖼️ Convertendo PDF → PNG...');
      const slideImages = await this.convertPDFToImages(tempPdfPath, outputDir);

      // Clean up temp files
      if (fs.existsSync(tempPdfPath)) {
        fs.unlinkSync(tempPdfPath);
      }

      return slideImages;

    } catch (error) {
      throw new Error(`Falha na conversão de imagens: ${error.message}`);
    } finally {
      // Clean up temp directory
      if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    }
  }

  /**
   * Convert PPTX to PDF using LibreOffice (bypass libreoffice-convert for Nix compatibility)
   */
  async convertToPDF(inputFile) {
    try {
      // Find LibreOffice binary in Nix environment
      const sofficeCmd = await this.findLibreOfficeBinary();
      
      // Create temp directory for PDF output
      const tempDir = path.join(path.dirname(inputFile), 'temp_pdf');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      
      // Create isolated LibreOffice profile for this conversion  
      const profileDir = path.join(tempDir, 'lo_profile');
      fs.mkdirSync(profileDir, { recursive: true });
      
      // Convert PPTX to PDF using direct soffice command with timeout and isolation
      const cmd = `"${sofficeCmd}" --headless --norestore --convert-to pdf --outdir "${tempDir}" -env:UserInstallation=file://${profileDir} "${inputFile}"`;
      console.log(`Executing LibreOffice: ${cmd}`);
      
      // Execute with 90 second timeout to prevent hangs
      await execAsync(cmd, { timeout: 90000 });
      
      // Find generated PDF file
      const files = fs.readdirSync(tempDir);
      const pdfFile = files.find(file => file.endsWith('.pdf'));
      
      if (!pdfFile) {
        throw new Error('PDF não foi gerado pelo LibreOffice');
      }
      
      const pdfPath = path.join(tempDir, pdfFile);
      const pdfBuffer = fs.readFileSync(pdfPath);
      
      // Clean up temp directory
      fs.rmSync(tempDir, { recursive: true, force: true });
      
      return pdfBuffer;
      
    } catch (error) {
      throw new Error(`LibreOffice conversion failed: ${error.message}`);
    }
  }

  /**
   * Find LibreOffice binary in the system (cached for performance)
   */
  async findLibreOfficeBinary() {
    // Check for explicit environment override first
    if (process.env.SOFFICE_PATH) {
      try {
        await execAsync(`"${process.env.SOFFICE_PATH}" --version`, { timeout: 5000 });
        return process.env.SOFFICE_PATH;
      } catch (error) {
        console.warn(`SOFFICE_PATH override failed: ${error.message}`);
      }
    }
    
    // Cache the resolved path in memory
    if (!this._cachedSofficePath) {
      // Try which command first (most reliable)
      try {
        const { stdout } = await execAsync('which soffice', { timeout: 5000 });
        if (stdout.trim()) {
          this._cachedSofficePath = stdout.trim();
          return this._cachedSofficePath;
        }
      } catch (error) {
        // Continue to manual search
      }
      
      // Known paths in order of preference
      const possiblePaths = [
        '/nix/store/s77ki6j3if918jk373md4aajqii531rd-libreoffice-24.8.7.2-wrapped/bin/soffice', // Known Nix path
        '/usr/bin/soffice', 
        '/usr/bin/libreoffice',
        'soffice',
        'libreoffice'
      ];
      
      // Try each path with quick version check
      for (const binary of possiblePaths) {
        try {
          await execAsync(`"${binary}" --version`, { timeout: 5000 });
          this._cachedSofficePath = binary;
          return this._cachedSofficePath;
        } catch (error) {
          // Try next path
        }
      }
      
      throw new Error('LibreOffice não encontrado. Configure SOFFICE_PATH ou instale LibreOffice.');
    }
    
    return this._cachedSofficePath;
  }

  /**
   * Convert PDF to individual PNG slides using ImageMagick
   */
  async convertPDFToImages(pdfPath, outputDir) {
    try {
      // Detect ImageMagick command (try convert, fallback to magick convert)
      const convertCmd = await this.detectImageMagickCommand();
      
      // Use ImageMagick to convert PDF to PNG with exact 1920x1080 resolution (start numbering at 1)
      const outputPattern = path.join(outputDir, 'slide_%d.png');
      const cmd = `${convertCmd} -density 300 -background white -alpha remove -scene 1 "${pdfPath}" -resize 1920x1080^ -gravity center -extent 1920x1080 "${outputPattern}"`;
      
      console.log(`Executing ImageMagick: ${cmd}`);
      // Execute with 90 second timeout to prevent hangs on large PDFs
      await execAsync(cmd, { timeout: 90000 });

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
        throw new Error('Nenhuma imagem de slide foi gerada pelo ImageMagick');
      }

      console.log(`✅ Geradas ${slideFiles.length} imagens PNG`);
      return slideFiles.map(file => `slides/${file}`);

    } catch (error) {
      throw new Error(`ImageMagick conversion failed: ${error.message}`);
    }
  }

  /**
   * Extract text content from PPTX file using JSZip + XML parsing
   */
  async extractTextFromPPTX(inputFile) {
    try {
      const data = fs.readFileSync(inputFile);
      const zip = await JSZip.loadAsync(data);
      
      const slidesData = [];
      
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

      console.log(`📖 Extraído texto de ${slidesData.length} slides`);
      return slidesData;

    } catch (error) {
      console.warn('Aviso: Falha na extração de texto, usando dados padrão:', error.message);
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
  async parseSlideXML(xmlContent) {
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
      console.warn('Erro ao processar XML do slide:', error.message);
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
  async parseNotesXML(xmlContent) {
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
      console.warn('Erro ao processar XML das notas:', error.message);
      return '';
    }
  }

  /**
   * Extract text from paragraph elements
   */
  extractTextFromParagraphs(paragraphs) {
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
  combineSlideData(slideImages, textData) {
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
  calculateSuggestedDuration(text) {
    const words = text.split(/\s+/).length;
    const baseTimePerWord = 0.4; // seconds per word for Portuguese
    const baseDuration = words * baseTimePerWord;
    
    // Minimum 3 seconds, maximum 30 seconds per slide
    return Math.max(3, Math.min(30, Math.round(baseDuration)));
  }

  /**
   * Detect ImageMagick command
   */
  async detectImageMagickCommand() {
    try {
      // Try 'convert' first (legacy ImageMagick)
      await execAsync('convert -version');
      return 'convert';
    } catch (error) {
      try {
        // Try 'magick convert' (modern ImageMagick 7+)
        await execAsync('magick convert -version');
        return 'magick convert';
      } catch (error2) {
        throw new Error('ImageMagick não encontrado. Instale ImageMagick para continuar.');
      }
    }
  }

  /**
   * Generate unique deck ID
   */
  generateDeckId() {
    return `deck_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Validate PPTX file (check if it's corrupted)
   */
  async validatePPTX(filePath) {
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
        error: `Arquivo PPTX inválido: ${error.message}`
      };
    }
  }
}

export default PPTXImportService;