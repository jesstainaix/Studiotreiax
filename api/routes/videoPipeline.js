const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const AIContentService = require('../services/aiContentService');
const PromptTemplateService = require('../services/promptTemplateService');
const fs = require('fs').promises;
const path = require('path');

// Instanciar serviços
const aiService = new AIContentService();
const promptService = new PromptTemplateService();

// Cache para projetos em memória (em produção, usar banco de dados)
let projects = [];
let projectIdCounter = 1;

// Middleware de autenticação para todas as rotas
router.use(authenticate);

// GET /api/video-pipeline/projects - Listar projetos
router.get('/projects', async (req, res) => {
  try {
    const userProjects = projects.filter(p => p.userId === req.user.id);
    
    res.json({
      success: true,
      projects: userProjects,
      total: userProjects.length
    });
  } catch (error) {
    console.error('Erro ao listar projetos:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// POST /api/video-pipeline/projects - Criar novo projeto
router.post('/projects', async (req, res) => {
  try {
    const { title, description, nrType, aiSettings, stages } = req.body;
    
    if (!title || !nrType) {
      return res.status(400).json({
        success: false,
        message: 'Título e tipo de NR são obrigatórios'
      });
    }

    const defaultStages = [
      {
        id: 'script',
        name: 'Geração de Roteiro',
        status: 'pending',
        progress: 0,
        aiEnhanced: true,
        estimatedTime: 300 // 5 minutos
      },
      {
        id: 'storyboard',
        name: 'Criação de Storyboard',
        status: 'pending',
        progress: 0,
        aiEnhanced: true,
        estimatedTime: 600 // 10 minutos
      },
      {
        id: 'assets',
        name: 'Preparação de Assets',
        status: 'pending',
        progress: 0,
        aiEnhanced: false,
        estimatedTime: 900 // 15 minutos
      },
      {
        id: 'recording',
        name: 'Gravação/Edição',
        status: 'pending',
        progress: 0,
        aiEnhanced: false,
        estimatedTime: 1800 // 30 minutos
      },
      {
        id: 'captions',
        name: 'Geração de Legendas',
        status: 'pending',
        progress: 0,
        aiEnhanced: true,
        estimatedTime: 180 // 3 minutos
      },
      {
        id: 'quality',
        name: 'Análise de Qualidade',
        status: 'pending',
        progress: 0,
        aiEnhanced: true,
        estimatedTime: 240 // 4 minutos
      },
      {
        id: 'optimization',
        name: 'Otimização Final',
        status: 'pending',
        progress: 0,
        aiEnhanced: true,
        estimatedTime: 300 // 5 minutos
      }
    ];

    const newProject = {
      id: `project_${projectIdCounter++}`,
      userId: req.user.id,
      title,
      description: description || '',
      nrType,
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      stages: stages || defaultStages,
      aiSettings: {
        autoGenerate: true,
        qualityCheck: true,
        optimization: true,
        smartCaptions: true,
        ...aiSettings
      },
      metadata: {
        duration: 0,
        resolution: '1920x1080',
        format: 'mp4',
        size: 0
      },
      outputs: {},
      analytics: {
        totalProcessingTime: 0,
        aiGenerationTime: 0,
        qualityScore: 0
      }
    };

    projects.push(newProject);

    res.status(201).json({
      success: true,
      message: 'Projeto criado com sucesso',
      project: newProject
    });
  } catch (error) {
    console.error('Erro ao criar projeto:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// GET /api/video-pipeline/projects/:id/status - Obter status do projeto
router.get('/projects/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const project = projects.find(p => p.id === id && p.userId === req.user.id);
    
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Projeto não encontrado'
      });
    }

    res.json({
      success: true,
      project
    });
  } catch (error) {
    console.error('Erro ao obter status:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// POST /api/video-pipeline/projects/:id/pipeline/start - Iniciar pipeline
router.post('/projects/:id/pipeline/start', async (req, res) => {
  try {
    const { id } = req.params;
    const { aiSettings } = req.body;
    
    const project = projects.find(p => p.id === id && p.userId === req.user.id);
    
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Projeto não encontrado'
      });
    }

    if (project.status === 'processing') {
      return res.status(400).json({
        success: false,
        message: 'Pipeline já está em execução'
      });
    }

    // Atualizar status do projeto
    project.status = 'processing';
    project.updatedAt = new Date().toISOString();
    if (aiSettings) {
      project.aiSettings = { ...project.aiSettings, ...aiSettings };
    }

    // Iniciar processamento assíncrono
    processPipeline(project);

    res.json({
      success: true,
      message: 'Pipeline iniciado com sucesso',
      project
    });
  } catch (error) {
    console.error('Erro ao iniciar pipeline:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// POST /api/video-pipeline/projects/:id/pipeline/pause - Pausar pipeline
router.post('/projects/:id/pipeline/pause', async (req, res) => {
  try {
    const { id } = req.params;
    const project = projects.find(p => p.id === id && p.userId === req.user.id);
    
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Projeto não encontrado'
      });
    }

    project.status = 'draft';
    project.updatedAt = new Date().toISOString();

    res.json({
      success: true,
      message: 'Pipeline pausado',
      project
    });
  } catch (error) {
    console.error('Erro ao pausar pipeline:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// POST /api/video-pipeline/projects/:id/stages/:stageId/retry - Repetir etapa
router.post('/projects/:id/stages/:stageId/retry', async (req, res) => {
  try {
    const { id, stageId } = req.params;
    const project = projects.find(p => p.id === id && p.userId === req.user.id);
    
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Projeto não encontrado'
      });
    }

    const stage = project.stages.find(s => s.id === stageId);
    if (!stage) {
      return res.status(404).json({
        success: false,
        message: 'Etapa não encontrada'
      });
    }

    // Resetar etapa
    stage.status = 'pending';
    stage.progress = 0;
    stage.error = undefined;
    stage.actualTime = undefined;
    
    project.updatedAt = new Date().toISOString();

    // Reprocessar etapa específica
    processStage(project, stage);

    res.json({
      success: true,
      message: 'Etapa reiniciada',
      project
    });
  } catch (error) {
    console.error('Erro ao repetir etapa:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// DELETE /api/video-pipeline/projects/:id - Deletar projeto
router.delete('/projects/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const projectIndex = projects.findIndex(p => p.id === id && p.userId === req.user.id);
    
    if (projectIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Projeto não encontrado'
      });
    }

    projects.splice(projectIndex, 1);

    res.json({
      success: true,
      message: 'Projeto deletado com sucesso'
    });
  } catch (error) {
    console.error('Erro ao deletar projeto:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// Função para processar pipeline completo
async function processPipeline(project) {
  try {
    const startTime = Date.now();
    
    for (const stage of project.stages) {
      if (stage.status === 'completed') continue;
      
      await processStage(project, stage);
      
      // Simular delay entre etapas
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Finalizar projeto
    project.status = 'completed';
    project.analytics.totalProcessingTime = Date.now() - startTime;
    project.updatedAt = new Date().toISOString();
    
  } catch (error) {
    console.error('Erro no pipeline:', error);
    project.status = 'error';
    project.updatedAt = new Date().toISOString();
  }
}

// Função para processar etapa individual
async function processStage(project, stage) {
  try {
    const stageStartTime = Date.now();
    stage.status = 'processing';
    stage.progress = 0;
    
    // Simular progresso
    const progressInterval = setInterval(() => {
      if (stage.progress < 90) {
        stage.progress += Math.random() * 20;
        if (stage.progress > 90) stage.progress = 90;
      }
    }, 500);
    
    let result;
    
    switch (stage.id) {
      case 'script':
        result = await generateScript(project);
        break;
      case 'storyboard':
        result = await generateStoryboard(project);
        break;
      case 'assets':
        result = await prepareAssets(project);
        break;
      case 'recording':
        result = await processRecording(project);
        break;
      case 'captions':
        result = await generateCaptions(project);
        break;
      case 'quality':
        result = await analyzeQuality(project);
        break;
      case 'optimization':
        result = await optimizeContent(project);
        break;
      default:
        throw new Error(`Etapa desconhecida: ${stage.id}`);
    }
    
    clearInterval(progressInterval);
    
    stage.status = 'completed';
    stage.progress = 100;
    stage.actualTime = Date.now() - stageStartTime;
    stage.output = result;
    
    // Armazenar resultado no projeto
    project.outputs[stage.id] = result;
    
  } catch (error) {
    console.error(`Erro na etapa ${stage.id}:`, error);
    stage.status = 'error';
    stage.error = error.message;
  }
}

// Funções de processamento específicas
async function generateScript(project) {
  if (!project.aiSettings.autoGenerate) {
    return { message: 'Geração automática desabilitada' };
  }
  
  try {
    const template = await promptService.getTemplate('script', project.nrType);
    const prompt = promptService.buildPrompt(template.id, {
      nrType: project.nrType,
      title: project.title,
      description: project.description
    });
    
    const script = await aiService.generateScript(prompt, {
      nrType: project.nrType,
      duration: 300 // 5 minutos
    });
    
    return {
      script: script.content,
      scenes: script.scenes || [],
      duration: script.estimatedDuration || 300,
      keyPoints: script.keyPoints || []
    };
  } catch (error) {
    console.error('Erro ao gerar roteiro:', error);
    return {
      script: `Roteiro para ${project.title}\n\nIntrodução sobre ${project.nrType}...`,
      scenes: [],
      duration: 300,
      keyPoints: []
    };
  }
}

async function generateStoryboard(project) {
  if (!project.aiSettings.autoGenerate) {
    return { message: 'Geração automática desabilitada' };
  }
  
  try {
    const script = project.outputs.script?.script || 'Roteiro não disponível';
    
    const storyboard = await aiService.generateStoryboard(script, {
      nrType: project.nrType,
      visualStyle: 'professional',
      targetAudience: 'workers'
    });
    
    return {
      frames: storyboard.frames || [],
      totalFrames: storyboard.frames?.length || 0,
      visualStyle: 'professional'
    };
  } catch (error) {
    console.error('Erro ao gerar storyboard:', error);
    return {
      frames: [
        {
          id: 1,
          description: 'Cena de abertura',
          duration: 5,
          visualElements: ['logo', 'título']
        }
      ],
      totalFrames: 1,
      visualStyle: 'professional'
    };
  }
}

async function prepareAssets(project) {
  // Simular preparação de assets
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  return {
    images: ['background.jpg', 'logo.png'],
    videos: ['intro.mp4'],
    audio: ['narration.mp3'],
    graphics: ['chart1.svg', 'diagram1.svg']
  };
}

async function processRecording(project) {
  // Simular gravação/edição
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  return {
    videoFile: 'output.mp4',
    duration: project.outputs.script?.duration || 300,
    resolution: project.metadata.resolution,
    format: project.metadata.format
  };
}

async function generateCaptions(project) {
  if (!project.aiSettings.smartCaptions) {
    return { message: 'Legendas inteligentes desabilitadas' };
  }
  
  try {
    const script = project.outputs.script?.script || 'Conteúdo não disponível';
    
    const captions = await aiService.generateCaptions(script, {
      language: 'pt-BR',
      format: 'srt',
      maxLineLength: 40
    });
    
    return {
      captions: captions.segments || [],
      format: 'srt',
      language: 'pt-BR',
      totalSegments: captions.segments?.length || 0
    };
  } catch (error) {
    console.error('Erro ao gerar legendas:', error);
    return {
      captions: [],
      format: 'srt',
      language: 'pt-BR',
      totalSegments: 0
    };
  }
}

async function analyzeQuality(project) {
  if (!project.aiSettings.qualityCheck) {
    return { message: 'Verificação de qualidade desabilitada' };
  }
  
  try {
    const content = {
      script: project.outputs.script?.script || '',
      storyboard: project.outputs.storyboard?.frames || [],
      captions: project.outputs.captions?.captions || []
    };
    
    const analysis = await aiService.analyzeContent(content, {
      nrType: project.nrType,
      criteria: ['clarity', 'completeness', 'engagement', 'compliance']
    });
    
    project.analytics.qualityScore = analysis.overallScore || 85;
    
    return {
      overallScore: analysis.overallScore || 85,
      criteria: analysis.criteria || {},
      suggestions: analysis.suggestions || [],
      compliance: analysis.compliance || true
    };
  } catch (error) {
    console.error('Erro na análise de qualidade:', error);
    return {
      overallScore: 75,
      criteria: {
        clarity: 80,
        completeness: 75,
        engagement: 70,
        compliance: 85
      },
      suggestions: ['Melhorar clareza na explicação dos procedimentos'],
      compliance: true
    };
  }
}

async function optimizeContent(project) {
  if (!project.aiSettings.optimization) {
    return { message: 'Otimização desabilitada' };
  }
  
  try {
    const qualityAnalysis = project.outputs.quality;
    
    if (qualityAnalysis?.overallScore < 80) {
      const optimizations = await aiService.optimizeContent({
        script: project.outputs.script?.script || '',
        suggestions: qualityAnalysis?.suggestions || []
      }, {
        nrType: project.nrType,
        targetScore: 90
      });
      
      return {
        optimizedScript: optimizations.optimizedContent || project.outputs.script?.script,
        improvements: optimizations.improvements || [],
        newScore: optimizations.estimatedScore || 85
      };
    }
    
    return {
      message: 'Conteúdo já otimizado',
      currentScore: qualityAnalysis?.overallScore || 85
    };
  } catch (error) {
    console.error('Erro na otimização:', error);
    return {
      message: 'Erro na otimização',
      error: error.message
    };
  }
}

// Middleware de tratamento de erros
router.use((error, req, res, next) => {
  console.error('Erro na API de pipeline:', error);
  res.status(500).json({
    success: false,
    message: 'Erro interno do servidor',
    error: process.env.NODE_ENV === 'development' ? error.message : 'Erro interno'
  });
});

module.exports = router;