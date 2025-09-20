import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { PPTXImportService } from '../../project/services/pptx/import_pptx.js';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import the PPTX service (we'll need to handle ES module import)
// For now, we'll use dynamic import since it's TypeScript
const router = express.Router();

// Configure multer for PPTX file uploads (max 200MB)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'Uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Security: Sanitize filename to prevent path traversal
    const safeBasename = path.basename(file.originalname).replace(/[^a-zA-Z0-9.-]/g, '_');
    const uniqueName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}_${safeBasename}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 200 * 1024 * 1024 // 200MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept only PPTX files (not PPT)
    const allowedMimes = [
      'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    ];
    
    if (allowedMimes.includes(file.mimetype) || 
        file.originalname.toLowerCase().endsWith('.pptx')) {
      cb(null, true);
    } else {
      cb(new Error('Apenas arquivos PPTX são permitidos (.pptx)'), false);
    }
  }
});

/**
 * Phase 1 Implementation: PPTX → PNG slides + JSON metadata
 */

// POST /api/pptx/upload - Upload and convert PPTX file
router.post('/upload', upload.single('pptx'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Nenhum arquivo PPTX foi enviado'
      });
    }

    console.log(`📥 Arquivo PPTX recebido: ${req.file.originalname} (${(req.file.size / 1024 / 1024).toFixed(2)}MB)`);

    // Validate file size
    if (req.file.size > 200 * 1024 * 1024) {
      // Clean up uploaded file
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(422).json({
        success: false,
        error: 'Arquivo muito grande (máximo 200MB)'
      });
    }

    // Synchronous PPTX validation to return HTTP 422 immediately for corrupted files
    const pptxService = PPTXImportService.getInstance();
    const validation = await pptxService.validatePPTX(req.file.path);
    
    if (!validation.valid) {
      // Clean up uploaded file
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(422).json({
        success: false,
        error: validation.error
      });
    }

    // Generate job ID for tracking
    const jobId = `pptx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Respond immediately with job ID
    res.json({
      success: true,
      message: 'Upload realizado com sucesso, iniciando conversão...',
      data: {
        jobId: jobId,
        filename: req.file.originalname,
        size: req.file.size,
        status: 'processing'
      }
    });

    // Process conversion asynchronously using real service
    processConversionAsync(req.file.path, req.file.originalname, jobId);

  } catch (error) {
    console.error('❌ Erro no upload PPTX:', error);
    
    // Clean up uploaded file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    // Determine if this is a validation error (422) or server error (500)
    const statusCode = error.message.includes('corrompido') || 
                       error.message.includes('inválido') ||
                       error.message.includes('muito grande') ? 422 : 500;

    res.status(statusCode).json({
      success: false,
      error: error.message || 'Erro interno do servidor'
    });
  }
});

// GET /api/pptx/status/:jobId - Check conversion status
router.get('/status/:jobId', (req, res) => {
  const { jobId } = req.params;
  
  try {
    // Validate jobId format to prevent directory traversal
    if (!/^pptx_\d+_[a-z0-9]+$/.test(jobId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid job ID format'
      });
    }
    
    // Use same deterministic path as updateJobStatus
    const baseDataDir = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../../project/data');
    const statusFile = path.join(baseDataDir, `${jobId}_status.json`);
    
    // Verify the resolved path is within the expected directory
    if (!statusFile.startsWith(baseDataDir)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid file path'
      });
    }
    
    if (!fs.existsSync(statusFile)) {
      return res.status(404).json({
        success: false,
        error: 'Job não encontrado'
      });
    }

    const status = JSON.parse(fs.readFileSync(statusFile, 'utf8'));
    res.json({
      success: true,
      data: status
    });

  } catch (error) {
    console.error('❌ Erro ao buscar status:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar status da conversão'
    });
  }
});

// GET /api/pptx/download/:jobId/slides - Download job-specific slides.json  
router.get('/download/:jobId/slides', (req, res) => {
  const { jobId } = req.params;
  
  try {
    // Validate jobId format to prevent directory traversal
    if (!/^pptx_\d+_[a-z0-9]+$/.test(jobId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid job ID format'
      });
    }
    
    // Use same deterministic base path
    const baseDataDir = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../../project/data');
    const slidesJsonPath = path.join(baseDataDir, jobId, 'slides.json');
    
    // Verify the resolved path is within the expected directory
    if (!slidesJsonPath.startsWith(baseDataDir)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid file path'
      });
    }
    
    if (!fs.existsSync(slidesJsonPath)) {
      return res.status(404).json({
        success: false,
        error: 'Arquivo slides.json não encontrado para este job'
      });
    }

    res.download(slidesJsonPath, `${jobId}_slides.json`, (err) => {
      if (err) {
        console.error('❌ Erro no download:', err);
        res.status(500).json({
          success: false,
          error: 'Erro no download do arquivo'
        });
      }
    });

  } catch (error) {
    console.error('❌ Erro no download:', error);
    res.status(500).json({
      success: false,
      error: 'Erro no download do arquivo'
    });
  }
});

// GET /api/pptx/download/:jobId/slide/:slideId - Download job-specific slide image
router.get('/download/:jobId/slide/:slideId', (req, res) => {
  const { jobId, slideId } = req.params;
  
  try {
    // Validate jobId format to prevent directory traversal
    if (!/^pptx_\d+_[a-z0-9]+$/.test(jobId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid job ID format'
      });
    }
    
    // Validate slideId format (numeric only)
    if (!/^\d+$/.test(slideId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid slide ID format'
      });
    }
    
    // Use same deterministic base path
    const baseDataDir = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../../project/data');
    const slidePath = path.join(baseDataDir, jobId, 'slides', `slide_${slideId}.png`);
    
    // Verify the resolved path is within the expected directory
    if (!slidePath.startsWith(baseDataDir)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid file path'
      });
    }
    
    if (!fs.existsSync(slidePath)) {
      return res.status(404).json({
        success: false,
        error: `Slide ${slideId} não encontrado para job ${jobId}`
      });
    }

    res.sendFile(slidePath, (err) => {
      if (err) {
        console.error('❌ Erro no envio da imagem:', err);
        res.status(500).json({
          success: false,
          error: 'Erro no envio da imagem'
        });
      }
    });

  } catch (error) {
    console.error('❌ Erro no envio da imagem:', error);
    res.status(500).json({
      success: false,
      error: 'Erro no envio da imagem'
    });
  }
});

/**
 * Async function to process PPTX conversion using real service
 * This runs in the background after responding to the client
 */
async function processConversionAsync(filePath, originalName, jobId) {
  try {
    // Update status to processing
    updateJobStatus(jobId, {
      status: 'processing',
      progress: 10,
      message: 'Validando arquivo PPTX...',
      startTime: new Date().toISOString()
    });

    // Use the real PPTX import service
    const pptxService = PPTXImportService.getInstance();
    const result = await pptxService.convertPPTX(filePath, jobId);

    if (result.success) {
      updateJobStatus(jobId, {
        status: 'completed',
        progress: 100,
        message: 'Conversão concluída com sucesso',
        slideCount: result.slideCount,
        slidesPath: result.slidesPath,
        jsonPath: result.jsonPath,
        completedAt: new Date().toISOString()
      });
    } else {
      // Classify error types correctly: 422 for client issues, 503 for service dependencies
      const is422Error = result.error && (
        result.error.includes('corrompido') ||
        result.error.includes('inválido') ||
        result.error.includes('muito grande') ||
        result.error.includes('arquivos ausentes')
      );
      
      const is503Error = result.error && (
        result.error.includes('LibreOffice') ||
        result.error.includes('ImageMagick') ||
        result.error.includes('não encontrado')
      );
      
      const errorCode = is422Error ? 422 : (is503Error ? 503 : 500);

      updateJobStatus(jobId, {
        status: 'failed',
        progress: 0,
        message: result.error || 'Erro na conversão',
        error: result.error,
        errorCode: errorCode,
        failedAt: new Date().toISOString()
      });
    }

  } catch (error) {
    console.error('❌ Erro na conversão assíncrona:', error);
    
    // Classify error types correctly: 422 for client issues, 503 for service dependencies
    const is422Error = error.message && (
      error.message.includes('corrompido') ||
      error.message.includes('inválido') ||
      error.message.includes('muito grande')
    );
    
    const is503Error = error.message && (
      error.message.includes('LibreOffice') ||
      error.message.includes('ImageMagick') ||
      error.message.includes('não encontrado')
    );
    
    const errorCode = is422Error ? 422 : (is503Error ? 503 : 500);

    updateJobStatus(jobId, {
      status: 'failed',
      progress: 0,
      message: error.message || 'Erro interno na conversão',
      error: error.message,
      errorCode: errorCode,
      failedAt: new Date().toISOString()
    });
  } finally {
    // Clean up uploaded file
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
}

/**
 * Update job status in filesystem
 */
function updateJobStatus(jobId, status) {
  try {
    // Use deterministic path (CWD-independent)
    const statusDir = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../../project/data');
    if (!fs.existsSync(statusDir)) {
      fs.mkdirSync(statusDir, { recursive: true });
    }

    const statusFile = path.join(statusDir, `${jobId}_status.json`);
    const statusData = {
      jobId,
      ...status,
      updatedAt: new Date().toISOString()
    };

    fs.writeFileSync(statusFile, JSON.stringify(statusData, null, 2), 'utf8');
    console.log(`📊 Status atualizado para job ${jobId}: ${status.status} (${status.progress}%)`);

  } catch (error) {
    console.error('❌ Erro ao atualizar status:', error);
  }
}


export default router;