import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { authenticateToken, optionalAuth } from '../middleware/auth.js';

const router = Router();

// Interface para vídeos
interface Video {
  id: string;
  title: string;
  description?: string;
  projectId: string;
  userId: string;
  status: 'processing' | 'completed' | 'failed' | 'draft';
  url?: string;
  thumbnailUrl?: string;
  duration: number; // em segundos
  fileSize: number; // em bytes
  format: string;
  resolution: string;
  fps: number;
  quality: 'low' | 'medium' | 'high' | 'ultra';
  createdAt: Date;
  updatedAt: Date;
  processedAt?: Date;
  downloadCount: number;
  isPublic: boolean;
  metadata: {
    codec: string;
    bitrate: number;
    aspectRatio: string;
    colorSpace?: string;
  };
}

// Interface para processamento de vídeo
interface VideoProcessingJob {
  id: string;
  videoId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number; // 0-100
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
}

// Simulação de banco de dados em memória
const videos: Video[] = [
  {
    id: '1',
    title: 'Vídeo Demo 1',
    description: 'Vídeo de demonstração',
    projectId: '1',
    userId: 'demo-user',
    status: 'completed',
    url: '/videos/demo1.mp4',
    thumbnailUrl: '/thumbnails/demo1.jpg',
    duration: 120,
    fileSize: 15728640, // 15MB
    format: 'mp4',
    resolution: '1920x1080',
    fps: 30,
    quality: 'high',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-20'),
    processedAt: new Date('2024-01-20'),
    downloadCount: 45,
    isPublic: true,
    metadata: {
      codec: 'h264',
      bitrate: 2000000,
      aspectRatio: '16:9',
      colorSpace: 'rec709'
    }
  },
  {
    id: '2',
    title: 'Vídeo Demo 2',
    description: 'Outro vídeo de demonstração',
    projectId: '2',
    userId: 'demo-user',
    status: 'processing',
    duration: 90,
    fileSize: 0,
    format: 'mp4',
    resolution: '1280x720',
    fps: 24,
    quality: 'medium',
    createdAt: new Date('2024-01-18'),
    updatedAt: new Date('2024-01-18'),
    downloadCount: 0,
    isPublic: false,
    metadata: {
      codec: 'h264',
      bitrate: 1500000,
      aspectRatio: '16:9'
    }
  }
];

const processingJobs: VideoProcessingJob[] = [
  {
    id: '1',
    videoId: '2',
    status: 'processing',
    progress: 65,
    startedAt: new Date('2024-01-18T10:00:00Z')
  }
];

/**
 * GET /api/videos
 * Get all videos (with pagination and filters)
 */
router.get('/', optionalAuth, (req: Request, res: Response) => {
  try {
    const {
      page = '1',
      limit = '10',
      status,
      projectId,
      userId,
      isPublic,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    let filteredVideos = [...videos];

    // Filtrar por usuário se especificado
    if (userId) {
      filteredVideos = filteredVideos.filter(v => v.userId === userId);
    } else if (req.user) {
      // Se autenticado, mostrar vídeos do usuário + vídeos públicos
      filteredVideos = filteredVideos.filter(v => 
        v.userId === req.user!.id || v.isPublic
      );
    } else {
      // Se não autenticado, mostrar apenas vídeos públicos
      filteredVideos = filteredVideos.filter(v => v.isPublic);
    }

    // Filtrar por status
    if (status && typeof status === 'string') {
      filteredVideos = filteredVideos.filter(v => v.status === status);
    }

    // Filtrar por projeto
    if (projectId && typeof projectId === 'string') {
      filteredVideos = filteredVideos.filter(v => v.projectId === projectId);
    }

    // Filtrar por público/privado
    if (isPublic !== undefined) {
      const publicFilter = isPublic === 'true';
      filteredVideos = filteredVideos.filter(v => v.isPublic === publicFilter);
    }

    // Ordenar
    filteredVideos.sort((a, b) => {
      const aValue = a[sortBy as keyof Video];
      const bValue = b[sortBy as keyof Video];
      
      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    // Paginação
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;
    const paginatedVideos = filteredVideos.slice(startIndex, endIndex);

    res.status(200).json({
      success: true,
      data: {
        videos: paginatedVideos,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: filteredVideos.length,
          pages: Math.ceil(filteredVideos.length / limitNum)
        }
      }
    });
  } catch (error) {
    console.error('Erro ao buscar vídeos:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * GET /api/videos/:id
 * Get video by ID
 */
router.get('/:id', optionalAuth, (req: Request, res: Response) => {
  try {
    const videoId = req.params.id;
    const video = videos.find(v => v.id === videoId);

    if (!video) {
      res.status(404).json({
        success: false,
        error: 'Vídeo não encontrado'
      });
      return;
    }

    // Verificar permissões
    if (!video.isPublic && (!req.user || req.user.id !== video.userId)) {
      res.status(403).json({
        success: false,
        error: 'Acesso negado'
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: { video }
    });
  } catch (error) {
    console.error('Erro ao buscar vídeo:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * POST /api/videos
 * Create new video
 */
router.post('/', authenticateToken, (req: Request, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Usuário não autenticado'
      });
      return;
    }

    const {
      title,
      description,
      projectId,
      resolution = '1920x1080',
      fps = 30,
      quality = 'high',
      format = 'mp4',
      isPublic = false
    } = req.body;

    if (!title || !projectId) {
      res.status(400).json({
        success: false,
        error: 'Título e ID do projeto são obrigatórios'
      });
      return;
    }

    const newVideo: Video = {
      id: uuidv4(),
      title,
      description,
      projectId,
      userId: req.user.id,
      status: 'draft',
      duration: 0,
      fileSize: 0,
      format,
      resolution,
      fps,
      quality,
      createdAt: new Date(),
      updatedAt: new Date(),
      downloadCount: 0,
      isPublic,
      metadata: {
        codec: 'h264',
        bitrate: quality === 'high' ? 2000000 : quality === 'medium' ? 1500000 : 1000000,
        aspectRatio: resolution.includes('1920') ? '16:9' : '4:3'
      }
    };

    videos.push(newVideo);

    res.status(201).json({
      success: true,
      message: 'Vídeo criado com sucesso',
      data: { video: newVideo }
    });
  } catch (error) {
    console.error('Erro ao criar vídeo:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * PUT /api/videos/:id
 * Update video
 */
router.put('/:id', authenticateToken, (req: Request, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Usuário não autenticado'
      });
      return;
    }

    const videoId = req.params.id;
    const videoIndex = videos.findIndex(v => v.id === videoId);

    if (videoIndex === -1) {
      res.status(404).json({
        success: false,
        error: 'Vídeo não encontrado'
      });
      return;
    }

    const video = videos[videoIndex];

    // Verificar se o usuário é o dono do vídeo
    if (video.userId !== req.user.id) {
      res.status(403).json({
        success: false,
        error: 'Acesso negado'
      });
      return;
    }

    const {
      title,
      description,
      isPublic,
      thumbnailUrl,
      url,
      duration,
      fileSize,
      status
    } = req.body;

    // Atualizar campos
    if (title) video.title = title;
    if (description !== undefined) video.description = description;
    if (isPublic !== undefined) video.isPublic = isPublic;
    if (thumbnailUrl !== undefined) video.thumbnailUrl = thumbnailUrl;
    if (url !== undefined) video.url = url;
    if (duration !== undefined) video.duration = duration;
    if (fileSize !== undefined) video.fileSize = fileSize;
    if (status) video.status = status;
    
    video.updatedAt = new Date();

    if (status === 'completed' && !video.processedAt) {
      video.processedAt = new Date();
    }

    res.status(200).json({
      success: true,
      message: 'Vídeo atualizado com sucesso',
      data: { video }
    });
  } catch (error) {
    console.error('Erro ao atualizar vídeo:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * DELETE /api/videos/:id
 * Delete video
 */
router.delete('/:id', authenticateToken, (req: Request, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Usuário não autenticado'
      });
      return;
    }

    const videoId = req.params.id;
    const videoIndex = videos.findIndex(v => v.id === videoId);

    if (videoIndex === -1) {
      res.status(404).json({
        success: false,
        error: 'Vídeo não encontrado'
      });
      return;
    }

    const video = videos[videoIndex];

    // Verificar se o usuário é o dono do vídeo
    if (video.userId !== req.user.id) {
      res.status(403).json({
        success: false,
        error: 'Acesso negado'
      });
      return;
    }

    videos.splice(videoIndex, 1);

    res.status(200).json({
      success: true,
      message: 'Vídeo removido com sucesso'
    });
  } catch (error) {
    console.error('Erro ao remover vídeo:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * POST /api/videos/:id/process
 * Start video processing
 */
router.post('/:id/process', authenticateToken, (req: Request, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Usuário não autenticado'
      });
      return;
    }

    const videoId = req.params.id;
    const video = videos.find(v => v.id === videoId);

    if (!video) {
      res.status(404).json({
        success: false,
        error: 'Vídeo não encontrado'
      });
      return;
    }

    // Verificar se o usuário é o dono do vídeo
    if (video.userId !== req.user.id) {
      res.status(403).json({
        success: false,
        error: 'Acesso negado'
      });
      return;
    }

    if (video.status === 'processing') {
      res.status(400).json({
        success: false,
        error: 'Vídeo já está sendo processado'
      });
      return;
    }

    // Criar job de processamento
    const processingJob: VideoProcessingJob = {
      id: uuidv4(),
      videoId: video.id,
      status: 'queued',
      progress: 0,
      startedAt: new Date()
    };

    processingJobs.push(processingJob);
    video.status = 'processing';
    video.updatedAt = new Date();

    // Simular processamento assíncrono
    setTimeout(() => {
      processingJob.status = 'processing';
      processingJob.progress = 25;
    }, 1000);

    setTimeout(() => {
      processingJob.status = 'completed';
      processingJob.progress = 100;
      processingJob.completedAt = new Date();
      video.status = 'completed';
      video.processedAt = new Date();
      video.url = `/videos/processed_${video.id}.mp4`;
      video.thumbnailUrl = `/thumbnails/processed_${video.id}.jpg`;
    }, 5000);

    res.status(200).json({
      success: true,
      message: 'Processamento iniciado',
      data: { 
        jobId: processingJob.id,
        status: processingJob.status
      }
    });
  } catch (error) {
    console.error('Erro ao iniciar processamento:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * GET /api/videos/:id/processing-status
 * Get video processing status
 */
router.get('/:id/processing-status', authenticateToken, (req: Request, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Usuário não autenticado'
      });
      return;
    }

    const videoId = req.params.id;
    const video = videos.find(v => v.id === videoId);

    if (!video) {
      res.status(404).json({
        success: false,
        error: 'Vídeo não encontrado'
      });
      return;
    }

    // Verificar se o usuário é o dono do vídeo
    if (video.userId !== req.user.id) {
      res.status(403).json({
        success: false,
        error: 'Acesso negado'
      });
      return;
    }

    const processingJob = processingJobs.find(j => j.videoId === videoId);

    res.status(200).json({
      success: true,
      data: {
        videoStatus: video.status,
        processingJob: processingJob || null
      }
    });
  } catch (error) {
    console.error('Erro ao buscar status de processamento:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * POST /api/videos/:id/download
 * Increment download count and get download URL
 */
router.post('/:id/download', optionalAuth, (req: Request, res: Response) => {
  try {
    const videoId = req.params.id;
    const video = videos.find(v => v.id === videoId);

    if (!video) {
      res.status(404).json({
        success: false,
        error: 'Vídeo não encontrado'
      });
      return;
    }

    // Verificar permissões
    if (!video.isPublic && (!req.user || req.user.id !== video.userId)) {
      res.status(403).json({
        success: false,
        error: 'Acesso negado'
      });
      return;
    }

    if (video.status !== 'completed' || !video.url) {
      res.status(400).json({
        success: false,
        error: 'Vídeo não está disponível para download'
      });
      return;
    }

    video.downloadCount += 1;
    video.updatedAt = new Date();

    res.status(200).json({
      success: true,
      message: 'Download autorizado',
      data: {
        downloadUrl: video.url,
        filename: `${video.title}.${video.format}`,
        fileSize: video.fileSize
      }
    });
  } catch (error) {
    console.error('Erro ao processar download:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * GET /api/videos/project/:projectId
 * Get videos by project ID
 */
router.get('/project/:projectId', optionalAuth, (req: Request, res: Response) => {
  try {
    const projectId = req.params.projectId;
    let projectVideos = videos.filter(v => v.projectId === projectId);

    // Filtrar por permissões
    if (req.user) {
      projectVideos = projectVideos.filter(v => 
        v.userId === req.user!.id || v.isPublic
      );
    } else {
      projectVideos = projectVideos.filter(v => v.isPublic);
    }

    res.status(200).json({
      success: true,
      data: { videos: projectVideos }
    });
  } catch (error) {
    console.error('Erro ao buscar vídeos do projeto:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

export default router;