import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { Project, ProjectSettings } from '../../src/types/project';
import { authenticateToken, optionalAuth } from '../middleware/auth.js';
import { body, param, query, validationResult } from 'express-validator';

const router = Router();

// Middleware para tratar erros de validação
const handleValidationErrors = (req: Request, res: Response, next: any) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Dados inválidos',
      errors: errors.array()
    });
  }
  next();
};

// Simulação de banco de dados em memória (melhorada)
const projects: Project[] = [
  {
    id: '1',
    title: 'Treinamento NR-10 - Segurança Elétrica',
    description: 'Projeto de demonstração sobre normas de segurança elétrica',
    status: 'completed',
    category: 'Segurança',
    nrCategory: 'NR-10',
    difficulty: 'Intermediário',
    tags: ['NR-10', 'segurança', 'elétrica'],
    userId: 'demo-user',
    createdAt: '2024-01-15T00:00:00Z',
    updatedAt: '2024-01-20T00:00:00Z',
    thumbnailUrl: '/thumbnails/project1.jpg',
    duration: 30,
    slidesCount: 15,
    settings: {
      resolution: '1080p',
      fps: 30,
      frameRate: 30,
      videoBitrate: 5000,
      audioSampleRate: 44100,
      audioBitrate: 128,
      audio_quality: 'high',
      watermark: false,
      auto_captions: true,
      background_music: true,
      voice_over: 'ai',
      language: 'pt-BR',
      autoSave: true,
      autoSaveInterval: 5,
      enableCollaboration: true,
      enableVersioning: true
    },
    content: {},
    metadata: {
      tags: ['NR-10', 'segurança', 'elétrica'],
      difficulty: 'Intermediário',
      target_audience: ['Eletricistas', 'Engenheiros'],
      learning_objectives: ['Conhecer normas de segurança', 'Aplicar procedimentos'],
      estimated_completion_time: 30
    }
  },
  {
    id: '2',
    title: 'Projeto Demo 2',
    description: 'Outro projeto de demonstração',
    status: 'in_progress',
    category: 'Educação',
    nrCategory: 'Geral',
    difficulty: 'Básico',
    tags: ['demo', 'educação'],
    userId: 'demo-user',
    createdAt: new Date('2024-01-10').toISOString(),
    updatedAt: new Date('2024-01-18').toISOString(),
    thumbnailUrl: '/thumbnails/project2.jpg',
    duration: 90,
    slidesCount: 10,
    settings: {
      resolution: '720p',
      fps: 24,
      frameRate: 24,
      videoBitrate: 3000,
      audioSampleRate: 44100,
      audioBitrate: 128,
      audio_quality: 'standard',
      watermark: false,
      auto_captions: false,
      background_music: false,
      voice_over: 'none',
      language: 'pt-BR',
      autoSave: true,
      autoSaveInterval: 5,
      enableCollaboration: true,
      enableVersioning: true
    },
    content: {},
    metadata: {
      tags: ['demo', 'educação'],
      difficulty: 'Básico',
      target_audience: ['Estudantes'],
      learning_objectives: ['Demonstrar funcionalidades'],
      estimated_completion_time: 90
    }
  }
];

/**
 * GET /api/projects
 * Get all projects (with pagination and filters)
 */
router.get('/', optionalAuth, (req: Request, res: Response) => {
  try {
    const {
      page = '1',
      limit = '10',
      status,
      category,
      search,
      sortBy = 'updatedAt',
      sortOrder = 'desc',
      userId
    } = req.query;

    let filteredProjects = [...projects];

    // Filtrar por usuário se especificado
    if (userId) {
      filteredProjects = filteredProjects.filter(p => p.userId === userId);
    } else if (req.user) {
      // Se autenticado, mostrar apenas projetos do usuário
      filteredProjects = filteredProjects.filter(p => p.userId === req.user!.id);
    } else {
      // Se não autenticado, não mostrar projetos
      filteredProjects = [];
    }

    // Filtrar por status
    if (status && typeof status === 'string') {
      filteredProjects = filteredProjects.filter(p => p.status === status);
    }

    // Filtrar por categoria
    if (category && typeof category === 'string') {
      filteredProjects = filteredProjects.filter(p => 
        p.category.toLowerCase().includes(category.toLowerCase())
      );
    }

    // Buscar por título ou descrição
    if (search && typeof search === 'string') {
      const searchLower = search.toLowerCase();
      filteredProjects = filteredProjects.filter(p => 
        p.title.toLowerCase().includes(searchLower) ||
        (p.description && p.description.toLowerCase().includes(searchLower))
      );
    }

    // Ordenar
    filteredProjects.sort((a, b) => {
      const aValue = a[sortBy as keyof Project];
      const bValue = b[sortBy as keyof Project];
      
      if (aValue === undefined && bValue === undefined) return 0;
      if (aValue === undefined) return sortOrder === 'asc' ? 1 : -1;
      if (bValue === undefined) return sortOrder === 'asc' ? -1 : 1;
      
      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    // Paginação
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;
    const paginatedProjects = filteredProjects.slice(startIndex, endIndex);

    res.status(200).json({
      success: true,
      data: {
        projects: paginatedProjects,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: filteredProjects.length,
          pages: Math.ceil(filteredProjects.length / limitNum)
        }
      }
    });
  } catch (error) {
    console.error('Erro ao buscar projetos:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * GET /api/projects/:id
 * Get project by ID
 */
router.get('/:id', optionalAuth, (req: Request, res: Response) => {
  try {
    const projectId = req.params.id;
    const project = projects.find(p => p.id === projectId);

    if (!project) {
      res.status(404).json({
        success: false,
        error: 'Projeto não encontrado'
      });
      return;
    }

    // Verificar permissões
    if (!req.user || req.user.id !== project.userId) {
      res.status(403).json({
        success: false,
        error: 'Acesso negado'
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: { project }
    });
  } catch (error) {
    console.error('Erro ao buscar projeto:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * POST /api/projects
 * Create new project
 */
router.post('/', 
  authenticateToken,
  [
    body('title')
      .notEmpty()
      .withMessage('Título é obrigatório')
      .isLength({ min: 1, max: 100 })
      .withMessage('Título deve ter entre 1 e 100 caracteres'),
    body('description')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Descrição deve ter no máximo 500 caracteres'),
    body('category')
      .notEmpty()
      .withMessage('Categoria é obrigatória'),
    body('nrCategory')
      .notEmpty()
      .withMessage('Categoria NR é obrigatória'),
    body('difficulty')
      .isIn(['Básico', 'Intermediário', 'Avançado'])
      .withMessage('Dificuldade deve ser Básico, Intermediário ou Avançado'),
    body('tags')
      .isArray()
      .withMessage('Tags devem ser um array')
      .optional(),
    body('settings')
      .isObject()
      .withMessage('Settings deve ser um objeto')
      .optional()
  ],
  handleValidationErrors,
  (req: Request, res: Response) => {
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
      category,
      nrCategory,
      difficulty = 'Básico',
      tags = [],
      settings = {},
      content = {},
      metadata = {}
    } = req.body;

    const newProject: Project = {
      id: uuidv4(),
      title,
      description,
      status: 'draft',
      category,
      nrCategory,
      difficulty,
      tags: Array.isArray(tags) ? tags : [],
      userId: req.user.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      duration: 0,
      slidesCount: 0,
      settings: {
        resolution: '1080p',
        fps: 30,
        frameRate: 30,
        videoBitrate: 5000,
        audioSampleRate: 44100,
        audioBitrate: 128,
        audio_quality: 'standard',
        watermark: false,
        auto_captions: false,
        background_music: false,
        voice_over: 'none',
        language: 'pt-BR',
        autoSave: true,
        autoSaveInterval: 5,
        enableCollaboration: true,
        enableVersioning: true,
        ...settings
      },
      content,
      metadata: {
        tags: Array.isArray(tags) ? tags : [],
        difficulty,
        target_audience: [],
        learning_objectives: [],
        estimated_completion_time: 0,
        ...metadata
      }
    };

    projects.push(newProject);

    res.status(201).json({
      success: true,
      message: 'Projeto criado com sucesso',
      data: { project: newProject }
    });
  } catch (error) {
    console.error('Erro ao criar projeto:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * PUT /api/projects/:id
 * Update project
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

    const projectId = req.params.id;
    const projectIndex = projects.findIndex(p => p.id === projectId);

    if (projectIndex === -1) {
      res.status(404).json({
        success: false,
        error: 'Projeto não encontrado'
      });
      return;
    }

    const project = projects[projectIndex];

    // Verificar se o usuário é o dono do projeto
    if (project.userId !== req.user.id) {
      res.status(403).json({
        success: false,
        error: 'Acesso negado'
      });
      return;
    }

    const {
      title,
      description,
      status,
      category,
      nrCategory,
      difficulty,
      tags,
      settings,
      thumbnailUrl,
      duration,
      slidesCount,
      content,
      metadata
    } = req.body;

    // Atualizar campos
    if (title) project.title = title;
    if (description !== undefined) project.description = description;
    if (status) project.status = status;
    if (category) project.category = category;
    if (nrCategory) project.nrCategory = nrCategory;
    if (difficulty) project.difficulty = difficulty;
    if (tags) project.tags = Array.isArray(tags) ? tags : [];
    if (settings) project.settings = { ...project.settings, ...settings };
    if (thumbnailUrl !== undefined) project.thumbnailUrl = thumbnailUrl;
    if (duration !== undefined) project.duration = duration;
    if (slidesCount !== undefined) project.slidesCount = slidesCount;
    if (content) project.content = { ...project.content, ...content };
    if (metadata) project.metadata = { ...project.metadata, ...metadata };
    
    project.updatedAt = new Date().toISOString();

    res.status(200).json({
      success: true,
      message: 'Projeto atualizado com sucesso',
      data: { project }
    });
  } catch (error) {
    console.error('Erro ao atualizar projeto:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * DELETE /api/projects/:id
 * Delete project
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

    const projectId = req.params.id;
    const projectIndex = projects.findIndex(p => p.id === projectId);

    if (projectIndex === -1) {
      res.status(404).json({
        success: false,
        error: 'Projeto não encontrado'
      });
      return;
    }

    const project = projects[projectIndex];

    // Verificar se o usuário é o dono do projeto
    if (project.userId !== req.user.id) {
      res.status(403).json({
        success: false,
        error: 'Acesso negado'
      });
      return;
    }

    projects.splice(projectIndex, 1);

    res.status(200).json({
      success: true,
      message: 'Projeto removido com sucesso'
    });
  } catch (error) {
    console.error('Erro ao remover projeto:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * POST /api/projects/:id/duplicate
 * Duplicate project
 */
router.post('/:id/duplicate', authenticateToken, (req: Request, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Usuário não autenticado'
      });
      return;
    }

    const projectId = req.params.id;
    const originalProject = projects.find(p => p.id === projectId);

    if (!originalProject) {
      res.status(404).json({
        success: false,
        error: 'Projeto não encontrado'
      });
      return;
    }

    // Verificar permissões (pode duplicar projetos do próprio usuário)
    if (originalProject.userId !== req.user.id) {
      res.status(403).json({
        success: false,
        error: 'Acesso negado'
      });
      return;
    }

    const duplicatedProject: Project = {
      ...originalProject,
      id: uuidv4(),
      title: `${originalProject.title} (Cópia)`,
      userId: req.user.id,
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    projects.push(duplicatedProject);

    res.status(201).json({
      success: true,
      message: 'Projeto duplicado com sucesso',
      data: { project: duplicatedProject }
    });
  } catch (error) {
    console.error('Erro ao duplicar projeto:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * GET /api/projects/user/:userId
 * Get projects by user ID
 */
router.get('/user/:userId', optionalAuth, (req: Request, res: Response) => {
  try {
    const userId = req.params.userId;
    const userProjects = projects.filter(p => p.userId === userId);

    // Se não for o próprio usuário, retornar acesso negado
    if (!req.user || req.user.id !== userId) {
      res.status(403).json({
        success: false,
        error: 'Acesso negado'
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: { projects: userProjects }
    });
  } catch (error) {
    console.error('Erro ao buscar projetos do usuário:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

export default router;