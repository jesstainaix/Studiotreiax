import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// Configurar multer para upload de arquivos
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB
  },
  fileFilter: (req, file, cb) => {
    // Permitir apenas certos tipos de arquivo
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'video/mp4',
      'video/avi',
      'video/mov',
      'audio/mp3',
      'audio/wav',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
      'application/vnd.ms-powerpoint' // .ppt
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de arquivo não permitido'));
    }
  }
});

// Simulação de armazenamento de arquivos
interface UploadedFile {
  id: string;
  originalName: string;
  filename: string;
  mimetype: string;
  size: number;
  userId: string;
  uploadedAt: Date;
  url: string;
}

const uploadedFiles: UploadedFile[] = [];

/**
 * POST /api/upload/file
 * Upload single file
 */
router.post('/file', authenticateToken, upload.single('file'), (req: Request, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({
        success: false,
        error: 'Nenhum arquivo foi enviado'
      });
      return;
    }

    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Usuário não autenticado'
      });
      return;
    }

    const fileId = uuidv4();
    const fileExtension = path.extname(req.file.originalname);
    const filename = `${fileId}${fileExtension}`;

    // Em uma implementação real, você salvaria o arquivo no sistema de arquivos ou cloud storage
    const uploadedFile: UploadedFile = {
      id: fileId,
      originalName: req.file.originalname,
      filename,
      mimetype: req.file.mimetype,
      size: req.file.size,
      userId: req.user.id,
      uploadedAt: new Date(),
      url: `/uploads/${filename}` // URL simulada
    };

    uploadedFiles.push(uploadedFile);

    res.status(200).json({
      success: true,
      message: 'Arquivo enviado com sucesso',
      data: {
        file: {
          id: uploadedFile.id,
          originalName: uploadedFile.originalName,
          filename: uploadedFile.filename,
          mimetype: uploadedFile.mimetype,
          size: uploadedFile.size,
          url: uploadedFile.url,
          uploadedAt: uploadedFile.uploadedAt
        }
      }
    });
  } catch (error) {
    console.error('Erro no upload:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * POST /api/upload/multiple
 * Upload multiple files
 */
router.post('/multiple', authenticateToken, upload.array('files', 10), (req: Request, res: Response) => {
  try {
    const files = req.files as Express.Multer.File[];
    
    if (!files || files.length === 0) {
      res.status(400).json({
        success: false,
        error: 'Nenhum arquivo foi enviado'
      });
      return;
    }

    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Usuário não autenticado'
      });
      return;
    }

    const uploadedFilesList: UploadedFile[] = [];

    files.forEach(file => {
      const fileId = uuidv4();
      const fileExtension = path.extname(file.originalname);
      const filename = `${fileId}${fileExtension}`;

      const uploadedFile: UploadedFile = {
        id: fileId,
        originalName: file.originalname,
        filename,
        mimetype: file.mimetype,
        size: file.size,
        userId: req.user!.id,
        uploadedAt: new Date(),
        url: `/uploads/${filename}`
      };

      uploadedFiles.push(uploadedFile);
      uploadedFilesList.push(uploadedFile);
    });

    res.status(200).json({
      success: true,
      message: `${uploadedFilesList.length} arquivos enviados com sucesso`,
      data: {
        files: uploadedFilesList.map(file => ({
          id: file.id,
          originalName: file.originalName,
          filename: file.filename,
          mimetype: file.mimetype,
          size: file.size,
          url: file.url,
          uploadedAt: file.uploadedAt
        }))
      }
    });
  } catch (error) {
    console.error('Erro no upload múltiplo:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * GET /api/upload/files
 * Get user's uploaded files
 */
router.get('/files', authenticateToken, (req: Request, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Usuário não autenticado'
      });
      return;
    }

    const userFiles = uploadedFiles.filter(file => file.userId === req.user!.id);

    res.status(200).json({
      success: true,
      data: {
        files: userFiles.map(file => ({
          id: file.id,
          originalName: file.originalName,
          filename: file.filename,
          mimetype: file.mimetype,
          size: file.size,
          url: file.url,
          uploadedAt: file.uploadedAt
        }))
      }
    });
  } catch (error) {
    console.error('Erro ao buscar arquivos:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * DELETE /api/upload/file/:id
 * Delete uploaded file
 */
router.delete('/file/:id', authenticateToken, (req: Request, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Usuário não autenticado'
      });
      return;
    }

    const fileId = req.params.id;
    const fileIndex = uploadedFiles.findIndex(file => 
      file.id === fileId && file.userId === req.user!.id
    );

    if (fileIndex === -1) {
      res.status(404).json({
        success: false,
        error: 'Arquivo não encontrado'
      });
      return;
    }

    // Em uma implementação real, você também removeria o arquivo do sistema de arquivos
    uploadedFiles.splice(fileIndex, 1);

    res.status(200).json({
      success: true,
      message: 'Arquivo removido com sucesso'
    });
  } catch (error) {
    console.error('Erro ao remover arquivo:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * POST /api/upload/pptx
 * Upload and process PowerPoint file
 */
router.post('/pptx', authenticateToken, upload.single('file'), (req: Request, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({
        success: false,
        error: 'Nenhum arquivo PPTX foi enviado'
      });
      return;
    }

    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Usuário não autenticado'
      });
      return;
    }

    // Verificar se é um arquivo PowerPoint
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/vnd.ms-powerpoint'
    ];

    if (!allowedTypes.includes(req.file.mimetype)) {
      res.status(400).json({
        success: false,
        error: 'Arquivo deve ser um PowerPoint (.pptx ou .ppt)'
      });
      return;
    }

    const fileId = uuidv4();
    const fileExtension = path.extname(req.file.originalname);
    const filename = `${fileId}${fileExtension}`;

    const uploadedFile: UploadedFile = {
      id: fileId,
      originalName: req.file.originalname,
      filename,
      mimetype: req.file.mimetype,
      size: req.file.size,
      userId: req.user.id,
      uploadedAt: new Date(),
      url: `/uploads/${filename}`
    };

    uploadedFiles.push(uploadedFile);

    // TODO: Implementar processamento do PPTX para extrair slides
    // Por enquanto, retornamos informações básicas
    res.status(200).json({
      success: true,
      message: 'Arquivo PPTX processado com sucesso',
      data: {
        file: {
          id: uploadedFile.id,
          originalName: uploadedFile.originalName,
          filename: uploadedFile.filename,
          mimetype: uploadedFile.mimetype,
          size: uploadedFile.size,
          url: uploadedFile.url,
          uploadedAt: uploadedFile.uploadedAt
        },
        slides: [
          // Mock data - em uma implementação real, extrairia os slides do PPTX
          { id: 1, title: 'Slide 1', content: 'Conteúdo do slide 1' },
          { id: 2, title: 'Slide 2', content: 'Conteúdo do slide 2' }
        ]
      }
    });
  } catch (error) {
    console.error('Erro no processamento do PPTX:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

export default router;