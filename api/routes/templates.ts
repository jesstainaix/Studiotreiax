import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { authenticateToken, optionalAuth } from '../middleware/auth.js';

const router = Router();

// Interface para templates
interface Template {
  id: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  thumbnailUrl: string;
  previewUrl?: string;
  duration: number; // em segundos
  isPremium: boolean;
  isPopular: boolean;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  usageCount: number;
  rating: number;
  ratingCount: number;
  settings: {
    resolution: string;
    fps: number;
    aspectRatio: string;
  };
  elements: {
    scenes: number;
    textLayers: number;
    imageSlots: number;
    audioTracks: number;
  };
}

// Simulação de banco de dados em memória
const templates: Template[] = [
  {
    id: '1',
    title: 'Apresentação Corporativa',
    description: 'Template profissional para apresentações empresariais',
    category: 'Negócios',
    tags: ['corporativo', 'apresentação', 'profissional'],
    thumbnailUrl: '/thumbnails/template1.jpg',
    previewUrl: '/previews/template1.mp4',
    duration: 60,
    isPremium: false,
    isPopular: true,
    difficulty: 'beginner',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    createdBy: 'admin',
    usageCount: 1250,
    rating: 4.8,
    ratingCount: 156,
    settings: {
      resolution: '1920x1080',
      fps: 30,
      aspectRatio: '16:9'
    },
    elements: {
      scenes: 8,
      textLayers: 12,
      imageSlots: 6,
      audioTracks: 1
    }
  },
  {
    id: '2',
    title: 'Promo Social Media',
    description: 'Template dinâmico para promoções em redes sociais',
    category: 'Marketing',
    tags: ['social media', 'promo', 'marketing'],
    thumbnailUrl: '/thumbnails/template2.jpg',
    previewUrl: '/previews/template2.mp4',
    duration: 30,
    isPremium: true,
    isPopular: true,
    difficulty: 'intermediate',
    createdAt: new Date('2024-01-05'),
    updatedAt: new Date('2024-01-05'),
    createdBy: 'admin',
    usageCount: 890,
    rating: 4.6,
    ratingCount: 89,
    settings: {
      resolution: '1080x1080',
      fps: 30,
      aspectRatio: '1:1'
    },
    elements: {
      scenes: 5,
      textLayers: 8,
      imageSlots: 4,
      audioTracks: 1
    }
  },
  {
    id: '3',
    title: 'Tutorial Educativo',
    description: 'Template ideal para conteúdo educacional e tutoriais',
    category: 'Educação',
    tags: ['educação', 'tutorial', 'ensino'],
    thumbnailUrl: '/thumbnails/template3.jpg',
    duration: 120,
    isPremium: false,
    isPopular: false,
    difficulty: 'beginner',
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-10'),
    createdBy: 'admin',
    usageCount: 456,
    rating: 4.4,
    ratingCount: 34,
    settings: {
      resolution: '1920x1080',
      fps: 24,
      aspectRatio: '16:9'
    },
    elements: {
      scenes: 10,
      textLayers: 15,
      imageSlots: 8,
      audioTracks: 2
    }
  }
];

/**
 * GET /api/templates
 * Get all templates (with pagination and filters)
 */
router.get('/', optionalAuth, (req: Request, res: Response) => {
  try {
    const {
      page = '1',
      limit = '12',
      category,
      search,
      isPremium,
      isPopular,
      difficulty,
      sortBy = 'usageCount',
      sortOrder = 'desc'
    } = req.query;

    let filteredTemplates = [...templates];

    // Filtrar por categoria
    if (category && typeof category === 'string') {
      filteredTemplates = filteredTemplates.filter(t => 
        t.category.toLowerCase().includes(category.toLowerCase())
      );
    }

    // Buscar por título, descrição ou tags
    if (search && typeof search === 'string') {
      const searchLower = search.toLowerCase();
      filteredTemplates = filteredTemplates.filter(t => 
        t.title.toLowerCase().includes(searchLower) ||
        t.description.toLowerCase().includes(searchLower) ||
        t.tags.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }

    // Filtrar por premium
    if (isPremium !== undefined) {
      const premiumFilter = isPremium === 'true';
      filteredTemplates = filteredTemplates.filter(t => t.isPremium === premiumFilter);
    }

    // Filtrar por popular
    if (isPopular !== undefined) {
      const popularFilter = isPopular === 'true';
      filteredTemplates = filteredTemplates.filter(t => t.isPopular === popularFilter);
    }

    // Filtrar por dificuldade
    if (difficulty && typeof difficulty === 'string') {
      filteredTemplates = filteredTemplates.filter(t => t.difficulty === difficulty);
    }

    // Ordenar
    filteredTemplates.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortBy) {
        case 'title':
          aValue = a.title;
          bValue = b.title;
          break;
        case 'rating':
          aValue = a.rating;
          bValue = b.rating;
          break;
        case 'usageCount':
          aValue = a.usageCount;
          bValue = b.usageCount;
          break;
        case 'createdAt':
          aValue = a.createdAt;
          bValue = b.createdAt;
          break;
        default:
          aValue = a.usageCount;
          bValue = b.usageCount;
      }
      
      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    // Paginação
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;
    const paginatedTemplates = filteredTemplates.slice(startIndex, endIndex);

    res.status(200).json({
      success: true,
      data: {
        templates: paginatedTemplates,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: filteredTemplates.length,
          pages: Math.ceil(filteredTemplates.length / limitNum)
        }
      }
    });
  } catch (error) {
    console.error('Erro ao buscar templates:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * GET /api/templates/:id
 * Get template by ID
 */
router.get('/:id', optionalAuth, (req: Request, res: Response) => {
  try {
    const templateId = req.params.id;
    const template = templates.find(t => t.id === templateId);

    if (!template) {
      res.status(404).json({
        success: false,
        error: 'Template não encontrado'
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: { template }
    });
  } catch (error) {
    console.error('Erro ao buscar template:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * GET /api/templates/category/:category
 * Get templates by category
 */
router.get('/category/:category', optionalAuth, (req: Request, res: Response) => {
  try {
    const category = req.params.category;
    const categoryTemplates = templates.filter(t => 
      t.category.toLowerCase() === category.toLowerCase()
    );

    res.status(200).json({
      success: true,
      data: { templates: categoryTemplates }
    });
  } catch (error) {
    console.error('Erro ao buscar templates por categoria:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * GET /api/templates/popular
 * Get popular templates
 */
router.get('/popular', optionalAuth, (req: Request, res: Response) => {
  try {
    const { limit = '6' } = req.query;
    const limitNum = parseInt(limit as string);
    
    const popularTemplates = templates
      .filter(t => t.isPopular)
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, limitNum);

    res.status(200).json({
      success: true,
      data: { templates: popularTemplates }
    });
  } catch (error) {
    console.error('Erro ao buscar templates populares:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * POST /api/templates/:id/use
 * Increment template usage count
 */
router.post('/:id/use', optionalAuth, (req: Request, res: Response) => {
  try {
    const templateId = req.params.id;
    const template = templates.find(t => t.id === templateId);

    if (!template) {
      res.status(404).json({
        success: false,
        error: 'Template não encontrado'
      });
      return;
    }

    template.usageCount += 1;
    template.updatedAt = new Date();

    res.status(200).json({
      success: true,
      message: 'Uso do template registrado',
      data: { usageCount: template.usageCount }
    });
  } catch (error) {
    console.error('Erro ao registrar uso do template:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * POST /api/templates/:id/rate
 * Rate a template
 */
router.post('/:id/rate', authenticateToken, (req: Request, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Usuário não autenticado'
      });
      return;
    }

    const templateId = req.params.id;
    const { rating } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      res.status(400).json({
        success: false,
        error: 'Avaliação deve ser entre 1 e 5'
      });
      return;
    }

    const template = templates.find(t => t.id === templateId);

    if (!template) {
      res.status(404).json({
        success: false,
        error: 'Template não encontrado'
      });
      return;
    }

    // Calcular nova média (simplificado - em produção seria mais complexo)
    const totalRating = template.rating * template.ratingCount;
    template.ratingCount += 1;
    template.rating = (totalRating + rating) / template.ratingCount;
    template.updatedAt = new Date();

    res.status(200).json({
      success: true,
      message: 'Avaliação registrada com sucesso',
      data: {
        rating: template.rating,
        ratingCount: template.ratingCount
      }
    });
  } catch (error) {
    console.error('Erro ao avaliar template:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * GET /api/templates/categories
 * Get all template categories
 */
router.get('/categories', optionalAuth, (req: Request, res: Response) => {
  try {
    const categories = [...new Set(templates.map(t => t.category))];
    const categoriesWithCount = categories.map(category => ({
      name: category,
      count: templates.filter(t => t.category === category).length
    }));

    res.status(200).json({
      success: true,
      data: { categories: categoriesWithCount }
    });
  } catch (error) {
    console.error('Erro ao buscar categorias:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * POST /api/templates
 * Create new template (admin only)
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

    // Verificar se é admin (simplificado)
    if (req.user.email !== 'admin@example.com') {
      res.status(403).json({
        success: false,
        error: 'Acesso negado - apenas administradores'
      });
      return;
    }

    const {
      title,
      description,
      category,
      tags = [],
      thumbnailUrl,
      previewUrl,
      duration,
      isPremium = false,
      difficulty = 'beginner',
      settings,
      elements
    } = req.body;

    if (!title || !description || !category || !thumbnailUrl || !duration) {
      res.status(400).json({
        success: false,
        error: 'Campos obrigatórios: title, description, category, thumbnailUrl, duration'
      });
      return;
    }

    const newTemplate: Template = {
      id: uuidv4(),
      title,
      description,
      category,
      tags: Array.isArray(tags) ? tags : [],
      thumbnailUrl,
      previewUrl,
      duration,
      isPremium,
      isPopular: false,
      difficulty,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: req.user.id,
      usageCount: 0,
      rating: 0,
      ratingCount: 0,
      settings: settings || {
        resolution: '1920x1080',
        fps: 30,
        aspectRatio: '16:9'
      },
      elements: elements || {
        scenes: 1,
        textLayers: 1,
        imageSlots: 1,
        audioTracks: 1
      }
    };

    templates.push(newTemplate);

    res.status(201).json({
      success: true,
      message: 'Template criado com sucesso',
      data: { template: newTemplate }
    });
  } catch (error) {
    console.error('Erro ao criar template:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

export default router;