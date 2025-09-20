import { Router, Request, Response } from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// Configurar multer para upload de PPTX
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
      'application/vnd.ms-powerpoint' // .ppt
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Arquivo deve ser um PowerPoint (.pptx ou .ppt)'));
    }
  }
});

// Interfaces para o pipeline
interface PipelineJob {
  id: string;
  userId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  currentStage: string;
  file: {
    id: string;
    originalName: string;
    size: number;
    mimetype: string;
  };
  stages: {
    upload: PipelineStage;
    extraction: PipelineStage;
    aiAnalysis: PipelineStage;
    ttsGeneration: PipelineStage;
    videoGeneration: PipelineStage;
  };
  result?: {
    videoUrl: string;
    thumbnailUrl: string;
    duration: number;
    fileSize: number;
  };
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface PipelineStage {
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  startTime?: Date;
  endTime?: Date;
  duration?: number;
  data?: any;
  error?: string;
}

// Armazenamento em memória (em produção, usar banco de dados)
const pipelineJobs: Map<string, PipelineJob> = new Map();

// Rota para iniciar o pipeline PPTX→Vídeo
router.post('/start', authenticateToken, upload.single('file'), async (req: Request, res: Response) => {
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

    const jobId = uuidv4();
    const fileId = uuidv4();

    // Criar job do pipeline
    const pipelineJob: PipelineJob = {
      id: jobId,
      userId: req.user.id,
      status: 'pending',
      progress: 0,
      currentStage: 'upload',
      file: {
        id: fileId,
        originalName: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype
      },
      stages: {
        upload: { status: 'completed', progress: 100 },
        extraction: { status: 'pending', progress: 0 },
        aiAnalysis: { status: 'pending', progress: 0 },
        ttsGeneration: { status: 'pending', progress: 0 },
        videoGeneration: { status: 'pending', progress: 0 }
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    pipelineJobs.set(jobId, pipelineJob);

    // Iniciar processamento assíncrono
    processPipelineJob(jobId, req.file.buffer).catch(error => {
      console.error(`Erro no pipeline ${jobId}:`, error);
      const job = pipelineJobs.get(jobId);
      if (job) {
        job.status = 'failed';
        job.error = error.message;
        job.updatedAt = new Date();
        pipelineJobs.set(jobId, job);
      }
    });

    res.status(200).json({
      success: true,
      message: 'Pipeline iniciado com sucesso',
      data: {
        jobId,
        status: pipelineJob.status,
        progress: pipelineJob.progress,
        currentStage: pipelineJob.currentStage
      }
    });

  } catch (error) {
    console.error('Erro ao iniciar pipeline:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// Rota para verificar status do pipeline
router.get('/status/:jobId', authenticateToken, (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;
    const job = pipelineJobs.get(jobId);

    if (!job) {
      res.status(404).json({
        success: false,
        error: 'Job não encontrado'
      });
      return;
    }

    if (!req.user || job.userId !== req.user.id) {
      res.status(403).json({
        success: false,
        error: 'Acesso negado'
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        id: job.id,
        status: job.status,
        progress: job.progress,
        currentStage: job.currentStage,
        stages: job.stages,
        result: job.result,
        error: job.error,
        createdAt: job.createdAt,
        updatedAt: job.updatedAt
      }
    });

  } catch (error) {
    console.error('Erro ao verificar status:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// Rota para listar jobs do usuário
router.get('/jobs', authenticateToken, (req: Request, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Usuário não autenticado'
      });
      return;
    }

    const userJobs = Array.from(pipelineJobs.values())
      .filter(job => job.userId === req.user!.id)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    res.status(200).json({
      success: true,
      data: userJobs.map(job => ({
        id: job.id,
        status: job.status,
        progress: job.progress,
        currentStage: job.currentStage,
        file: job.file,
        result: job.result,
        error: job.error,
        createdAt: job.createdAt,
        updatedAt: job.updatedAt
      }))
    });

  } catch (error) {
    console.error('Erro ao listar jobs:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// Função para processar o pipeline (simulação)
async function processPipelineJob(jobId: string, fileBuffer: Buffer): Promise<void> {
  const job = pipelineJobs.get(jobId);
  if (!job) return;

  try {
    // Atualizar status para processando
    job.status = 'processing';
    job.updatedAt = new Date();
    pipelineJobs.set(jobId, job);

    // Stage 1: Extração de conteúdo
    await updateStage(jobId, 'extraction', 'processing');
    await simulateProcessing(2000); // Simular processamento
    await updateStage(jobId, 'extraction', 'completed', {
      slides: [
        { id: 1, title: 'Slide 1', content: 'Conteúdo extraído do slide 1' },
        { id: 2, title: 'Slide 2', content: 'Conteúdo extraído do slide 2' }
      ],
      totalSlides: 2,
      estimatedDuration: 30000
    });

    // Stage 2: Análise de IA
    await updateStage(jobId, 'aiAnalysis', 'processing');
    await simulateProcessing(3000);
    await updateStage(jobId, 'aiAnalysis', 'completed', {
      nrCompliance: {
        detectedNRs: ['NR-12', 'NR-6'],
        complianceScore: 94,
        recommendations: ['Adicionar mais exemplos práticos', 'Incluir checklist de segurança']
      },
      templateRecommendation: {
        id: 'template-safety-1',
        name: 'Template Segurança Industrial',
        confidence: 0.92
      }
    });

    // Stage 3: Geração de TTS
    await updateStage(jobId, 'ttsGeneration', 'processing');
    await simulateProcessing(4000);
    await updateStage(jobId, 'ttsGeneration', 'completed', {
      audioFiles: [
        { slideId: 1, audioUrl: '/audio/slide1.mp3', duration: 15000 },
        { slideId: 2, audioUrl: '/audio/slide2.mp3', duration: 15000 }
      ],
      totalDuration: 30000
    });

    // Stage 4: Geração de vídeo
    await updateStage(jobId, 'videoGeneration', 'processing');
    await simulateProcessing(5000);
    await updateStage(jobId, 'videoGeneration', 'completed');

    // Finalizar job
    const finalJob = pipelineJobs.get(jobId);
    if (finalJob) {
      finalJob.status = 'completed';
      finalJob.progress = 100;
      finalJob.currentStage = 'completed';
      finalJob.result = {
        videoUrl: `/videos/${jobId}.mp4`,
        thumbnailUrl: `/thumbnails/${jobId}.jpg`,
        duration: 30000,
        fileSize: 15 * 1024 * 1024 // 15MB
      };
      finalJob.updatedAt = new Date();
      pipelineJobs.set(jobId, finalJob);
    }

  } catch (error) {
    console.error(`Erro no processamento do job ${jobId}:`, error);
    const failedJob = pipelineJobs.get(jobId);
    if (failedJob) {
      failedJob.status = 'failed';
      failedJob.error = error instanceof Error ? error.message : 'Erro desconhecido';
      failedJob.updatedAt = new Date();
      pipelineJobs.set(jobId, failedJob);
    }
  }
}

// Função auxiliar para atualizar estágio
async function updateStage(
  jobId: string, 
  stageName: keyof PipelineJob['stages'], 
  status: PipelineStage['status'],
  data?: any
): Promise<void> {
  const job = pipelineJobs.get(jobId);
  if (!job) return;

  const stage = job.stages[stageName];
  stage.status = status;
  stage.data = data;
  stage.updatedAt = new Date();

  if (status === 'processing') {
    stage.startTime = new Date();
    job.currentStage = stageName;
  } else if (status === 'completed') {
    stage.endTime = new Date();
    stage.progress = 100;
    if (stage.startTime) {
      stage.duration = stage.endTime.getTime() - stage.startTime.getTime();
    }
  }

  // Calcular progresso geral
  const stages = Object.values(job.stages);
  const completedStages = stages.filter(s => s.status === 'completed').length;
  job.progress = Math.round((completedStages / stages.length) * 100);

  job.updatedAt = new Date();
  pipelineJobs.set(jobId, job);
}

// Função para simular processamento
function simulateProcessing(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export default router;