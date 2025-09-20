/**
 * Sistema API REST Completo
 * Servidor Express com autenticação JWT, validação, rate limiting e documentação
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { body, param, query, validationResult } from 'express-validator';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import winston from 'winston';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';

// Tipos TypeScript
interface User {
  id: string;
  email: string;
  name: string;
  password?: string;
  role: 'admin' | 'editor' | 'viewer';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
}

interface Project {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  collaborators: string[];
  data: any;
  isPublic: boolean;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  data: any;
  thumbnail: string;
  isPublic: boolean;
  createdBy: string;
  usageCount: number;
  rating: number;
  createdAt: Date;
  updatedAt: Date;
}

interface APIKey {
  id: string;
  userId: string;
  name: string;
  key: string;
  permissions: string[];
  lastUsedAt?: Date;
  expiresAt?: Date;
  isActive: boolean;
  createdAt: Date;
}

interface WebhookEvent {
  id: string;
  event: string;
  data: any;
  targetUrl: string;
  status: 'pending' | 'sent' | 'failed';
  attempts: number;
  createdAt: Date;
  sentAt?: Date;
}

// Logger configurado
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'video-editor-api' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

class VideoEditorAPI {
  private app: express.Application;
  private port: number;
  
  // Armazenamento em memória (substituir por banco de dados em produção)
  private users: Map<string, User> = new Map();
  private projects: Map<string, Project> = new Map();
  private templates: Map<string, Template> = new Map();
  private apiKeys: Map<string, APIKey> = new Map();
  private webhooks: Map<string, WebhookEvent> = new Map();
  private refreshTokens: Set<string> = new Set();

  constructor(port = 3001) {
    this.app = express();
    this.port = port;
    this.setupMiddleware();
    this.setupRoutes();
    this.setupSwagger();
    this.initializeData();
  }

  private setupMiddleware() {
    // Segurança
    this.app.use(helmet());
    this.app.use(cors({
      origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
      credentials: true
    }));

    // Rate limiting
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutos
      max: 100, // limite de 100 requests por IP
      message: {
        error: 'Muitas requisições deste IP, tente novamente em 15 minutos'
      }
    });
    this.app.use('/api/', limiter);

    // Middleware básico
    this.app.use(compression());
    this.app.use(morgan('combined', { stream: { write: (msg) => logger.info(msg.trim()) } }));
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));

    // Health check
    this.app.get('/health', (req, res) => {
      res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      });
    });
  }

  private setupSwagger() {
    const options = {
      definition: {
        openapi: '3.0.0',
        info: {
          title: 'Video Editor API',
          version: '1.0.0',
          description: 'API completa para sistema de edição de vídeo colaborativo',
          contact: {
            name: 'Suporte API',
            email: 'api@videoeditor.com'
          }
        },
        servers: [
          {
            url: `http://localhost:${this.port}`,
            description: 'Servidor de desenvolvimento'
          }
        ],
        components: {
          securitySchemes: {
            bearerAuth: {
              type: 'http',
              scheme: 'bearer',
              bearerFormat: 'JWT'
            },
            apiKeyAuth: {
              type: 'apiKey',
              in: 'header',
              name: 'X-API-Key'
            }
          }
        },
        security: [
          { bearerAuth: [] },
          { apiKeyAuth: [] }
        ]
      },
      apis: ['./src/api/*.ts'] // Caminho para arquivos com documentação
    };

    const specs = swaggerJsdoc(options);
    this.app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));
  }

  private setupRoutes() {
    // Rotas de autenticação
    this.setupAuthRoutes();
    
    // Rotas de usuários
    this.setupUserRoutes();
    
    // Rotas de projetos
    this.setupProjectRoutes();
    
    // Rotas de templates
    this.setupTemplateRoutes();
    
    // Rotas de API Keys
    this.setupAPIKeyRoutes();
    
    // Rotas de webhooks
    this.setupWebhookRoutes();

    // Error handler
    this.app.use(this.errorHandler.bind(this));
  }

  private setupAuthRoutes() {
    /**
     * @swagger
     * /api/auth/register:
     *   post:
     *     summary: Registrar novo usuário
     *     tags: [Autenticação]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - email
     *               - password
     *               - name
     *             properties:
     *               email:
     *                 type: string
     *                 format: email
     *               password:
     *                 type: string
     *                 minLength: 6
     *               name:
     *                 type: string
     *     responses:
     *       201:
     *         description: Usuário criado com sucesso
     */
    this.app.post('/api/auth/register', [
      body('email').isEmail().normalizeEmail(),
      body('password').isLength({ min: 6 }),
      body('name').notEmpty().trim()
    ], async (req, res) => {
      try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(400).json({ errors: errors.array() });
        }

        const { email, password, name } = req.body;

        // Verificar se usuário já existe
        const existingUser = Array.from(this.users.values()).find(u => u.email === email);
        if (existingUser) {
          return res.status(400).json({ error: 'Usuário já existe' });
        }

        // Hash da senha
        const hashedPassword = await bcrypt.hash(password, 12);

        // Criar usuário
        const user: User = {
          id: uuidv4(),
          email,
          name,
          password: hashedPassword,
          role: 'editor',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        };

        this.users.set(user.id, user);

        // Gerar tokens
        const accessToken = this.generateAccessToken(user);
        const refreshToken = this.generateRefreshToken(user);

        logger.info(`Usuário registrado: ${user.email}`);

        res.status(201).json({
          message: 'Usuário criado com sucesso',
          user: this.sanitizeUser(user),
          accessToken,
          refreshToken
        });
      } catch (error) {
        logger.error('Erro no registro:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
      }
    });

    /**
     * @swagger
     * /api/auth/login:
     *   post:
     *     summary: Fazer login
     *     tags: [Autenticação]
     */
    this.app.post('/api/auth/login', [
      body('email').isEmail().normalizeEmail(),
      body('password').notEmpty()
    ], async (req, res) => {
      try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(400).json({ errors: errors.array() });
        }

        const { email, password } = req.body;

        // Encontrar usuário
        const user = Array.from(this.users.values()).find(u => u.email === email);
        if (!user) {
          return res.status(401).json({ error: 'Credenciais inválidas' });
        }

        // Verificar senha
        const isValidPassword = await bcrypt.compare(password, user.password!);
        if (!isValidPassword) {
          return res.status(401).json({ error: 'Credenciais inválidas' });
        }

        // Verificar se usuário está ativo
        if (!user.isActive) {
          return res.status(401).json({ error: 'Conta desativada' });
        }

        // Atualizar último login
        user.lastLoginAt = new Date();
        user.updatedAt = new Date();

        // Gerar tokens
        const accessToken = this.generateAccessToken(user);
        const refreshToken = this.generateRefreshToken(user);

        logger.info(`Login realizado: ${user.email}`);

        res.json({
          message: 'Login realizado com sucesso',
          user: this.sanitizeUser(user),
          accessToken,
          refreshToken
        });
      } catch (error) {
        logger.error('Erro no login:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
      }
    });

    /**
     * @swagger
     * /api/auth/refresh:
     *   post:
     *     summary: Renovar token de acesso
     *     tags: [Autenticação]
     */
    this.app.post('/api/auth/refresh', async (req, res) => {
      try {
        const { refreshToken } = req.body;

        if (!refreshToken || !this.refreshTokens.has(refreshToken)) {
          return res.status(401).json({ error: 'Refresh token inválido' });
        }

        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || 'refresh-secret') as any;
        const user = this.users.get(decoded.userId);

        if (!user) {
          return res.status(401).json({ error: 'Usuário não encontrado' });
        }

        const newAccessToken = this.generateAccessToken(user);

        res.json({ accessToken: newAccessToken });
      } catch (error) {
        logger.error('Erro ao renovar token:', error);
        res.status(401).json({ error: 'Token inválido' });
      }
    });

    /**
     * @swagger
     * /api/auth/logout:
     *   post:
     *     summary: Fazer logout
     *     tags: [Autenticação]
     */
    this.app.post('/api/auth/logout', this.authenticateToken.bind(this), (req, res) => {
      const { refreshToken } = req.body;
      if (refreshToken) {
        this.refreshTokens.delete(refreshToken);
      }
      
      logger.info(`Logout realizado: ${(req as any).user.email}`);
      res.json({ message: 'Logout realizado com sucesso' });
    });
  }

  private setupUserRoutes() {
    /**
     * @swagger
     * /api/users/profile:
     *   get:
     *     summary: Obter perfil do usuário
     *     tags: [Usuários]
     *     security:
     *       - bearerAuth: []
     */
    this.app.get('/api/users/profile', this.authenticateToken.bind(this), (req, res) => {
      const user = (req as any).user;
      res.json(this.sanitizeUser(user));
    });

    /**
     * @swagger
     * /api/users/profile:
     *   put:
     *     summary: Atualizar perfil do usuário
     *     tags: [Usuários]
     */
    this.app.put('/api/users/profile', [
      this.authenticateToken.bind(this),
      body('name').optional().notEmpty().trim(),
      body('email').optional().isEmail().normalizeEmail()
    ], async (req, res) => {
      try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(400).json({ errors: errors.array() });
        }

        const user = (req as any).user as User;
        const { name, email } = req.body;

        if (name) user.name = name;
        if (email && email !== user.email) {
          // Verificar se email já existe
          const existingUser = Array.from(this.users.values()).find(u => u.email === email && u.id !== user.id);
          if (existingUser) {
            return res.status(400).json({ error: 'Email já está em uso' });
          }
          user.email = email;
        }

        user.updatedAt = new Date();

        res.json({
          message: 'Perfil atualizado com sucesso',
          user: this.sanitizeUser(user)
        });
      } catch (error) {
        logger.error('Erro ao atualizar perfil:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
      }
    });

    /**
     * @swagger
     * /api/users:
     *   get:
     *     summary: Listar usuários (apenas admin)
     *     tags: [Usuários]
     */
    this.app.get('/api/users', [
      this.authenticateToken.bind(this),
      this.requireRole('admin').bind(this),
      query('page').optional().isInt({ min: 1 }),
      query('limit').optional().isInt({ min: 1, max: 100 })
    ], (req, res) => {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const offset = (page - 1) * limit;

      const allUsers = Array.from(this.users.values());
      const paginatedUsers = allUsers.slice(offset, offset + limit);

      res.json({
        users: paginatedUsers.map(user => this.sanitizeUser(user)),
        pagination: {
          page,
          limit,
          total: allUsers.length,
          totalPages: Math.ceil(allUsers.length / limit)
        }
      });
    });
  }

  private setupProjectRoutes() {
    /**
     * @swagger
     * /api/projects:
     *   get:
     *     summary: Listar projetos do usuário
     *     tags: [Projetos]
     */
    this.app.get('/api/projects', [
      this.authenticateToken.bind(this),
      query('page').optional().isInt({ min: 1 }),
      query('limit').optional().isInt({ min: 1, max: 50 }),
      query('search').optional().isString()
    ], (req, res) => {
      const user = (req as any).user as User;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = req.query.search as string;
      const offset = (page - 1) * limit;

      let userProjects = Array.from(this.projects.values()).filter(project => 
        project.ownerId === user.id || project.collaborators.includes(user.id)
      );

      if (search) {
        userProjects = userProjects.filter(project =>
          project.name.toLowerCase().includes(search.toLowerCase()) ||
          project.description.toLowerCase().includes(search.toLowerCase())
        );
      }

      const paginatedProjects = userProjects.slice(offset, offset + limit);

      res.json({
        projects: paginatedProjects,
        pagination: {
          page,
          limit,
          total: userProjects.length,
          totalPages: Math.ceil(userProjects.length / limit)
        }
      });
    });

    /**
     * @swagger
     * /api/projects:
     *   post:
     *     summary: Criar novo projeto
     *     tags: [Projetos]
     */
    this.app.post('/api/projects', [
      this.authenticateToken.bind(this),
      body('name').notEmpty().trim(),
      body('description').optional().trim(),
      body('isPublic').optional().isBoolean(),
      body('tags').optional().isArray()
    ], (req, res) => {
      try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(400).json({ errors: errors.array() });
        }

        const user = (req as any).user as User;
        const { name, description = '', isPublic = false, tags = [] } = req.body;

        const project: Project = {
          id: uuidv4(),
          name,
          description,
          ownerId: user.id,
          collaborators: [],
          data: {},
          isPublic,
          tags,
          createdAt: new Date(),
          updatedAt: new Date()
        };

        this.projects.set(project.id, project);

        logger.info(`Projeto criado: ${project.name} por ${user.email}`);

        // Disparar webhook
        this.triggerWebhook('project.created', {
          project: project,
          user: this.sanitizeUser(user)
        });

        res.status(201).json({
          message: 'Projeto criado com sucesso',
          project
        });
      } catch (error) {
        logger.error('Erro ao criar projeto:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
      }
    });

    /**
     * @swagger
     * /api/projects/{id}:
     *   get:
     *     summary: Obter projeto por ID
     *     tags: [Projetos]
     */
    this.app.get('/api/projects/:id', [
      this.authenticateToken.bind(this),
      param('id').isUUID()
    ], (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const user = (req as any).user as User;
      const projectId = req.params.id;
      const project = this.projects.get(projectId);

      if (!project) {
        return res.status(404).json({ error: 'Projeto não encontrado' });
      }

      // Verificar permissões
      if (project.ownerId !== user.id && 
          !project.collaborators.includes(user.id) && 
          !project.isPublic) {
        return res.status(403).json({ error: 'Acesso negado' });
      }

      res.json(project);
    });

    /**
     * @swagger
     * /api/projects/{id}:
     *   put:
     *     summary: Atualizar projeto
     *     tags: [Projetos]
     */
    this.app.put('/api/projects/:id', [
      this.authenticateToken.bind(this),
      param('id').isUUID(),
      body('name').optional().notEmpty().trim(),
      body('description').optional().trim(),
      body('data').optional(),
      body('isPublic').optional().isBoolean(),
      body('tags').optional().isArray()
    ], (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const user = (req as any).user as User;
      const projectId = req.params.id;
      const project = this.projects.get(projectId);

      if (!project) {
        return res.status(404).json({ error: 'Projeto não encontrado' });
      }

      // Verificar permissões de edição
      if (project.ownerId !== user.id && !project.collaborators.includes(user.id)) {
        return res.status(403).json({ error: 'Acesso negado' });
      }

      const { name, description, data, isPublic, tags } = req.body;

      if (name) project.name = name;
      if (description !== undefined) project.description = description;
      if (data) project.data = { ...project.data, ...data };
      if (isPublic !== undefined) project.isPublic = isPublic;
      if (tags) project.tags = tags;
      project.updatedAt = new Date();

      logger.info(`Projeto atualizado: ${project.name} por ${user.email}`);

      // Disparar webhook
      this.triggerWebhook('project.updated', {
        project: project,
        user: this.sanitizeUser(user)
      });

      res.json({
        message: 'Projeto atualizado com sucesso',
        project
      });
    });

    /**
     * @swagger
     * /api/projects/{id}:
     *   delete:
     *     summary: Deletar projeto
     *     tags: [Projetos]
     */
    this.app.delete('/api/projects/:id', [
      this.authenticateToken.bind(this),
      param('id').isUUID()
    ], (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const user = (req as any).user as User;
      const projectId = req.params.id;
      const project = this.projects.get(projectId);

      if (!project) {
        return res.status(404).json({ error: 'Projeto não encontrado' });
      }

      // Apenas o proprietário pode deletar
      if (project.ownerId !== user.id) {
        return res.status(403).json({ error: 'Apenas o proprietário pode deletar o projeto' });
      }

      this.projects.delete(projectId);

      logger.info(`Projeto deletado: ${project.name} por ${user.email}`);

      // Disparar webhook
      this.triggerWebhook('project.deleted', {
        projectId: projectId,
        user: this.sanitizeUser(user)
      });

      res.json({ message: 'Projeto deletado com sucesso' });
    });
  }

  private setupTemplateRoutes() {
    /**
     * @swagger
     * /api/templates:
     *   get:
     *     summary: Listar templates
     *     tags: [Templates]
     */
    this.app.get('/api/templates', [
      query('category').optional().isString(),
      query('page').optional().isInt({ min: 1 }),
      query('limit').optional().isInt({ min: 1, max: 50 })
    ], (req, res) => {
      const category = req.query.category as string;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 12;
      const offset = (page - 1) * limit;

      let templates = Array.from(this.templates.values()).filter(t => t.isPublic);

      if (category) {
        templates = templates.filter(t => t.category === category);
      }

      const paginatedTemplates = templates.slice(offset, offset + limit);

      res.json({
        templates: paginatedTemplates,
        pagination: {
          page,
          limit,
          total: templates.length,
          totalPages: Math.ceil(templates.length / limit)
        }
      });
    });

    // Mais rotas de templates...
  }

  private setupAPIKeyRoutes() {
    /**
     * @swagger
     * /api/api-keys:
     *   get:
     *     summary: Listar API keys do usuário
     *     tags: [API Keys]
     */
    this.app.get('/api/api-keys', this.authenticateToken.bind(this), (req, res) => {
      const user = (req as any).user as User;
      const userApiKeys = Array.from(this.apiKeys.values())
        .filter(key => key.userId === user.id)
        .map(key => ({
          ...key,
          key: key.key.substring(0, 8) + '...' // Ocultar a chave
        }));

      res.json({ apiKeys: userApiKeys });
    });

    /**
     * @swagger
     * /api/api-keys:
     *   post:
     *     summary: Criar nova API key
     *     tags: [API Keys]
     */
    this.app.post('/api/api-keys', [
      this.authenticateToken.bind(this),
      body('name').notEmpty().trim(),
      body('permissions').isArray(),
      body('expiresIn').optional().isInt()
    ], (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const user = (req as any).user as User;
      const { name, permissions, expiresIn } = req.body;

      const apiKey: APIKey = {
        id: uuidv4(),
        userId: user.id,
        name,
        key: this.generateAPIKey(),
        permissions,
        isActive: true,
        createdAt: new Date(),
        expiresAt: expiresIn ? new Date(Date.now() + expiresIn * 24 * 60 * 60 * 1000) : undefined
      };

      this.apiKeys.set(apiKey.id, apiKey);

      logger.info(`API Key criada: ${name} para ${user.email}`);

      res.status(201).json({
        message: 'API Key criada com sucesso',
        apiKey: {
          ...apiKey,
          key: apiKey.key // Mostrar a chave completa apenas na criação
        }
      });
    });
  }

  private setupWebhookRoutes() {
    /**
     * @swagger
     * /api/webhooks:
     *   get:
     *     summary: Listar eventos de webhook
     *     tags: [Webhooks]
     */
    this.app.get('/api/webhooks', [
      this.authenticateToken.bind(this),
      query('status').optional().isIn(['pending', 'sent', 'failed']),
      query('page').optional().isInt({ min: 1 }),
      query('limit').optional().isInt({ min: 1, max: 100 })
    ], (req, res) => {
      const status = req.query.status as string;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = (page - 1) * limit;

      let webhooks = Array.from(this.webhooks.values());

      if (status) {
        webhooks = webhooks.filter(w => w.status === status);
      }

      const paginatedWebhooks = webhooks.slice(offset, offset + limit);

      res.json({
        webhooks: paginatedWebhooks,
        pagination: {
          page,
          limit,
          total: webhooks.length,
          totalPages: Math.ceil(webhooks.length / limit)
        }
      });
    });
  }

  // Middleware de autenticação
  private authenticateToken(req: express.Request, res: express.Response, next: express.NextFunction) {
    const authHeader = req.headers['authorization'];
    const apiKey = req.headers['x-api-key'] as string;

    if (apiKey) {
      return this.authenticateAPIKey(req, res, next);
    }

    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Token de acesso requerido' });
    }

    jwt.verify(token, process.env.JWT_SECRET || 'secret', (err: any, user: any) => {
      if (err) {
        return res.status(403).json({ error: 'Token inválido' });
      }

      const fullUser = this.users.get(user.userId);
      if (!fullUser) {
        return res.status(401).json({ error: 'Usuário não encontrado' });
      }

      (req as any).user = fullUser;
      next();
    });
  }

  private authenticateAPIKey(req: express.Request, res: express.Response, next: express.NextFunction) {
    const apiKey = req.headers['x-api-key'] as string;

    const key = Array.from(this.apiKeys.values()).find(k => k.key === apiKey);

    if (!key || !key.isActive) {
      return res.status(401).json({ error: 'API Key inválida' });
    }

    if (key.expiresAt && key.expiresAt < new Date()) {
      return res.status(401).json({ error: 'API Key expirada' });
    }

    // Atualizar último uso
    key.lastUsedAt = new Date();

    // Buscar usuário
    const user = this.users.get(key.userId);
    if (!user) {
      return res.status(401).json({ error: 'Usuário não encontrado' });
    }

    (req as any).user = user;
    (req as any).apiKey = key;
    next();
  }

  private requireRole(role: string) {
    return (req: express.Request, res: express.Response, next: express.NextFunction) => {
      const user = (req as any).user as User;
      
      if (user.role !== role) {
        return res.status(403).json({ error: 'Permissão insuficiente' });
      }
      
      next();
    };
  }

  // Utilitários
  private generateAccessToken(user: User): string {
    return jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '15m' }
    );
  }

  private generateRefreshToken(user: User): string {
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_REFRESH_SECRET || 'refresh-secret',
      { expiresIn: '7d' }
    );
    
    this.refreshTokens.add(token);
    return token;
  }

  private generateAPIKey(): string {
    return 'sk_' + crypto.randomBytes(32).toString('hex');
  }

  private sanitizeUser(user: User): Omit<User, 'password'> {
    const { password, ...sanitizedUser } = user;
    return sanitizedUser;
  }

  private async triggerWebhook(event: string, data: any) {
    // Simular envio de webhook
    const webhookEvent: WebhookEvent = {
      id: uuidv4(),
      event,
      data,
      targetUrl: process.env.WEBHOOK_URL || 'https://example.com/webhook',
      status: 'pending',
      attempts: 0,
      createdAt: new Date()
    };

    this.webhooks.set(webhookEvent.id, webhookEvent);

    // Simular envio (em produção usaria uma fila)
    setTimeout(() => {
      webhookEvent.status = 'sent';
      webhookEvent.sentAt = new Date();
      webhookEvent.attempts = 1;
      logger.info(`Webhook enviado: ${event}`);
    }, 1000);
  }

  private errorHandler(error: any, req: express.Request, res: express.Response, next: express.NextFunction) {
    logger.error('Erro na API:', error);

    if (error.type === 'entity.parse.failed') {
      return res.status(400).json({ error: 'JSON inválido' });
    }

    if (error.type === 'entity.too.large') {
      return res.status(413).json({ error: 'Payload muito grande' });
    }

    res.status(500).json({ error: 'Erro interno do servidor' });
  }

  private initializeData() {
    // Criar usuário admin padrão
    const adminUser: User = {
      id: uuidv4(),
      email: 'admin@videoeditor.com',
      name: 'Administrador',
      password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewS0C7z7SgUvO9.6', // "password"
      role: 'admin',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.users.set(adminUser.id, adminUser);

    // Criar alguns templates de exemplo
    const sampleTemplates: Template[] = [
      {
        id: uuidv4(),
        name: 'Apresentação Corporativa',
        description: 'Template profissional para apresentações empresariais',
        category: 'corporativo',
        data: { slides: [], theme: 'professional' },
        thumbnail: 'https://example.com/thumbs/corporate.jpg',
        isPublic: true,
        createdBy: adminUser.id,
        usageCount: 0,
        rating: 4.5,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        name: 'Aula Interativa',
        description: 'Template educacional com elementos interativos',
        category: 'educacional',
        data: { slides: [], theme: 'educational' },
        thumbnail: 'https://example.com/thumbs/education.jpg',
        isPublic: true,
        createdBy: adminUser.id,
        usageCount: 0,
        rating: 4.2,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    sampleTemplates.forEach(template => {
      this.templates.set(template.id, template);
    });

    logger.info('Dados iniciais criados');
  }

  public start() {
    this.app.listen(this.port, () => {
      logger.info(`🚀 API Server rodando na porta ${this.port}`);
      logger.info(`📚 Documentação disponível em http://localhost:${this.port}/api-docs`);
      logger.info(`❤️ Health check em http://localhost:${this.port}/health`);
    });
  }
}

export default VideoEditorAPI;