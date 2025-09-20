/**
 * Testes Completos para Sistema API REST
 * Testa autenticação, CRUD, validação e segurança
 */

import { describe, it, expect, beforeEach, afterEach, vi, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import VideoEditorAPI from '../../api/VideoEditorAPI';
import VideoEditorAPIClient from '../../api/VideoEditorAPIClient';

// Configurar mocks globais
global.fetch = vi.fn();

describe('VideoEditorAPI - Server', () => {
  let api: VideoEditorAPI;
  let app: any;

  beforeAll(() => {
    api = new VideoEditorAPI(3002); // Porta diferente para testes
    app = (api as any).app;
  });

  afterAll(() => {
    // Cleanup se necessário
  });

  describe('Health Check', () => {
    it('deve retornar status healthy', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toMatchObject({
        status: 'healthy',
        timestamp: expect.any(String),
        version: '1.0.0'
      });
    });
  });

  describe('Autenticação', () => {
    const testUser = {
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User'
    };

    it('deve registrar novo usuário', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send(testUser)
        .expect(201);

      expect(response.body).toMatchObject({
        message: 'Usuário criado com sucesso',
        user: {
          email: testUser.email,
          name: testUser.name,
          role: 'editor'
        },
        accessToken: expect.any(String),
        refreshToken: expect.any(String)
      });

      // Senha não deve estar no retorno
      expect(response.body.user.password).toBeUndefined();
    });

    it('deve rejeitar registro com email duplicado', async () => {
      // Primeiro registro
      await request(app)
        .post('/api/auth/register')
        .send(testUser);

      // Segundo registro (deve falhar)
      const response = await request(app)
        .post('/api/auth/register')
        .send(testUser)
        .expect(400);

      expect(response.body.error).toBe('Usuário já existe');
    });

    it('deve validar dados de registro', async () => {
      const invalidUser = {
        email: 'invalid-email',
        password: '123', // muito curta
        name: '' // vazio
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidUser)
        .expect(400);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors.length).toBeGreaterThan(0);
    });

    it('deve fazer login com credenciais válidas', async () => {
      // Registrar usuário primeiro
      await request(app)
        .post('/api/auth/register')
        .send(testUser);

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password
        })
        .expect(200);

      expect(response.body).toMatchObject({
        message: 'Login realizado com sucesso',
        user: {
          email: testUser.email,
          name: testUser.name
        },
        accessToken: expect.any(String),
        refreshToken: expect.any(String)
      });
    });

    it('deve rejeitar login com credenciais inválidas', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'wrongpassword'
        })
        .expect(401);

      expect(response.body.error).toBe('Credenciais inválidas');
    });

    it('deve renovar token de acesso', async () => {
      // Registrar e fazer login
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(testUser);

      const refreshToken = registerResponse.body.refreshToken;

      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      expect(response.body.accessToken).toBeDefined();
    });

    it('deve fazer logout', async () => {
      // Registrar usuário
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(testUser);

      const accessToken = registerResponse.body.accessToken;
      const refreshToken = registerResponse.body.refreshToken;

      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ refreshToken })
        .expect(200);

      expect(response.body.message).toBe('Logout realizado com sucesso');
    });
  });

  describe('Proteção de Rotas', () => {
    it('deve proteger rotas que requerem autenticação', async () => {
      const response = await request(app)
        .get('/api/users/profile')
        .expect(401);

      expect(response.body.error).toBe('Token de acesso requerido');
    });

    it('deve rejeitar tokens inválidos', async () => {
      const response = await request(app)
        .get('/api/users/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(403);

      expect(response.body.error).toBe('Token inválido');
    });
  });

  describe('Gerenciamento de Usuários', () => {
    let accessToken: string;

    beforeEach(async () => {
      const testUser = {
        email: 'user@example.com',
        password: 'password123',
        name: 'Test User'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(testUser);

      accessToken = response.body.accessToken;
    });

    it('deve obter perfil do usuário', async () => {
      const response = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        email: 'user@example.com',
        name: 'Test User',
        role: 'editor'
      });
    });

    it('deve atualizar perfil do usuário', async () => {
      const updateData = {
        name: 'Updated Name',
        email: 'updated@example.com'
      };

      const response = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.user).toMatchObject(updateData);
    });

    it('deve validar dados de atualização', async () => {
      const invalidUpdate = {
        email: 'invalid-email'
      };

      const response = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(invalidUpdate)
        .expect(400);

      expect(response.body.errors).toBeDefined();
    });
  });

  describe('Gerenciamento de Projetos', () => {
    let accessToken: string;

    beforeEach(async () => {
      const testUser = {
        email: 'project-user@example.com',
        password: 'password123',
        name: 'Project User'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(testUser);

      accessToken = response.body.accessToken;
    });

    it('deve criar novo projeto', async () => {
      const projectData = {
        name: 'Test Project',
        description: 'A test project',
        isPublic: false,
        tags: ['test', 'demo']
      };

      const response = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(projectData)
        .expect(201);

      expect(response.body.project).toMatchObject({
        name: projectData.name,
        description: projectData.description,
        isPublic: projectData.isPublic,
        tags: projectData.tags,
        id: expect.any(String),
        createdAt: expect.any(String),
        updatedAt: expect.any(String)
      });
    });

    it('deve listar projetos do usuário', async () => {
      // Criar projeto primeiro
      const projectData = {
        name: 'Test Project',
        description: 'A test project'
      };

      await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(projectData);

      const response = await request(app)
        .get('/api/projects')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.projects).toBeInstanceOf(Array);
      expect(response.body.projects.length).toBeGreaterThan(0);
      expect(response.body.pagination).toMatchObject({
        page: 1,
        limit: 10,
        total: expect.any(Number),
        totalPages: expect.any(Number)
      });
    });

    it('deve obter projeto por ID', async () => {
      // Criar projeto primeiro
      const createResponse = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Test Project',
          description: 'A test project'
        });

      const projectId = createResponse.body.project.id;

      const response = await request(app)
        .get(`/api/projects/${projectId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.id).toBe(projectId);
    });

    it('deve atualizar projeto', async () => {
      // Criar projeto primeiro
      const createResponse = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Test Project',
          description: 'Original description'
        });

      const projectId = createResponse.body.project.id;

      const updateData = {
        name: 'Updated Project',
        description: 'Updated description'
      };

      const response = await request(app)
        .put(`/api/projects/${projectId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.project).toMatchObject(updateData);
    });

    it('deve deletar projeto', async () => {
      // Criar projeto primeiro
      const createResponse = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Test Project to Delete',
          description: 'Will be deleted'
        });

      const projectId = createResponse.body.project.id;

      const response = await request(app)
        .delete(`/api/projects/${projectId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.message).toBe('Projeto deletado com sucesso');

      // Verificar que foi deletado
      await request(app)
        .get(`/api/projects/${projectId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });

    it('deve validar dados do projeto', async () => {
      const invalidProject = {
        name: '', // nome vazio
        description: 123 // tipo inválido
      };

      const response = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(invalidProject)
        .expect(400);

      expect(response.body.errors).toBeDefined();
    });

    it('deve implementar paginação', async () => {
      // Criar múltiplos projetos
      for (let i = 0; i < 15; i++) {
        await request(app)
          .post('/api/projects')
          .set('Authorization', `Bearer ${accessToken}`)
          .send({
            name: `Project ${i}`,
            description: `Description ${i}`
          });
      }

      // Testar primeira página
      const page1Response = await request(app)
        .get('/api/projects?page=1&limit=10')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(page1Response.body.projects.length).toBe(10);
      expect(page1Response.body.pagination.page).toBe(1);

      // Testar segunda página
      const page2Response = await request(app)
        .get('/api/projects?page=2&limit=10')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(page2Response.body.projects.length).toBe(5);
      expect(page2Response.body.pagination.page).toBe(2);
    });

    it('deve implementar busca', async () => {
      // Criar projetos com nomes específicos
      await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'React App',
          description: 'A React application'
        });

      await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Vue Project',
          description: 'A Vue.js project'
        });

      const response = await request(app)
        .get('/api/projects?search=React')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.projects.length).toBe(1);
      expect(response.body.projects[0].name).toBe('React App');
    });
  });

  describe('API Keys', () => {
    let accessToken: string;

    beforeEach(async () => {
      const testUser = {
        email: 'apikey-user@example.com',
        password: 'password123',
        name: 'API Key User'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(testUser);

      accessToken = response.body.accessToken;
    });

    it('deve criar nova API key', async () => {
      const keyData = {
        name: 'Test API Key',
        permissions: ['read:projects', 'write:projects']
      };

      const response = await request(app)
        .post('/api/api-keys')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(keyData)
        .expect(201);

      expect(response.body.apiKey).toMatchObject({
        name: keyData.name,
        permissions: keyData.permissions,
        key: expect.any(String),
        isActive: true
      });

      expect(response.body.apiKey.key).toMatch(/^sk_[a-f0-9]{64}$/);
    });

    it('deve listar API keys do usuário', async () => {
      // Criar API key primeiro
      await request(app)
        .post('/api/api-keys')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Test Key',
          permissions: ['read:projects']
        });

      const response = await request(app)
        .get('/api/api-keys')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.apiKeys).toBeInstanceOf(Array);
      expect(response.body.apiKeys.length).toBeGreaterThan(0);
      
      // Chave deve estar ofuscada
      expect(response.body.apiKeys[0].key).toMatch(/^sk_[a-f0-9]{8}\.\.\.$/);
    });

    it('deve autenticar usando API key', async () => {
      // Criar API key
      const keyResponse = await request(app)
        .post('/api/api-keys')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Test Key',
          permissions: ['read:projects']
        });

      const apiKey = keyResponse.body.apiKey.key;

      // Usar API key para acessar rota protegida
      const response = await request(app)
        .get('/api/users/profile')
        .set('X-API-Key', apiKey)
        .expect(200);

      expect(response.body.email).toBe('apikey-user@example.com');
    });
  });

  describe('Rate Limiting', () => {
    it('deve aplicar rate limiting', async () => {
      const requests = [];
      
      // Fazer muitas requisições rapidamente
      for (let i = 0; i < 110; i++) {
        requests.push(
          request(app)
            .get('/api/templates')
        );
      }

      const responses = await Promise.all(requests);
      
      // Algumas requisições devem ser bloqueadas
      const blockedResponses = responses.filter(r => r.status === 429);
      expect(blockedResponses.length).toBeGreaterThan(0);
    });
  });

  describe('Validação e Segurança', () => {
    it('deve validar IDs UUID', async () => {
      const response = await request(app)
        .get('/api/projects/invalid-uuid')
        .set('Authorization', 'Bearer fake-token')
        .expect(400);

      expect(response.body.errors).toBeDefined();
    });

    it('deve sanitizar entradas', async () => {
      const testUser = {
        email: 'sanitize@example.com',
        password: 'password123',
        name: 'Test User'
      };

      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(testUser);

      const accessToken = registerResponse.body.accessToken;

      const maliciousData = {
        name: '<script>alert("xss")</script>',
        description: 'SELECT * FROM users'
      };

      const response = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(maliciousData)
        .expect(201);

      // Nome deve estar sanitizado
      expect(response.body.project.name).not.toContain('<script>');
    });

    it('deve aplicar headers de segurança', async () => {
      const response = await request(app)
        .get('/health');

      expect(response.headers).toHaveProperty('x-content-type-options');
      expect(response.headers).toHaveProperty('x-frame-options');
    });
  });

  describe('Documentação Swagger', () => {
    it('deve servir documentação Swagger', async () => {
      const response = await request(app)
        .get('/api-docs/')
        .expect(200);

      expect(response.text).toContain('swagger');
    });
  });
});

// Testes do Cliente SDK
describe('VideoEditorAPIClient', () => {
  let client: VideoEditorAPIClient;
  let mockFetch: any;

  beforeEach(() => {
    client = new VideoEditorAPIClient('http://localhost:3000');
    mockFetch = vi.fn();
    global.fetch = mockFetch;
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Autenticação', () => {
    it('deve registrar usuário', async () => {
      const mockResponse = {
        success: true,
        data: {
          user: {
            id: '1',
            email: 'test@example.com',
            name: 'Test User',
            role: 'editor'
          },
          accessToken: 'access-token',
          refreshToken: 'refresh-token',
          message: 'Usuário criado com sucesso'
        }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: { get: () => 'application/json' },
        json: () => Promise.resolve(mockResponse.data)
      });

      const result = await client.register({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User'
      });

      expect(result.success).toBe(true);
      expect(result.data).toMatchObject(mockResponse.data);
      expect(client.isAuthenticated()).toBe(true);
    });

    it('deve fazer login', async () => {
      const mockResponse = {
        user: {
          id: '1',
          email: 'test@example.com',
          name: 'Test User',
          role: 'editor'
        },
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        message: 'Login realizado com sucesso'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: { get: () => 'application/json' },
        json: () => Promise.resolve(mockResponse)
      });

      const result = await client.login({
        email: 'test@example.com',
        password: 'password123'
      });

      expect(result.success).toBe(true);
      expect(result.data).toMatchObject(mockResponse);
    });

    it('deve tratar erro de autenticação', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        headers: { get: () => 'application/json' },
        json: () => Promise.resolve({ error: 'Credenciais inválidas' })
      });

      const result = await client.login({
        email: 'test@example.com',
        password: 'wrongpassword'
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Credenciais inválidas');
    });

    it('deve renovar token automaticamente', async () => {
      client.setTokens('expired-token', 'refresh-token');

      // Mock da primeira requisição (401)
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
          headers: { get: () => 'application/json' },
          json: () => Promise.resolve({ error: 'Token inválido' })
        })
        // Mock da renovação do token
        .mockResolvedValueOnce({
          ok: true,
          headers: { get: () => 'application/json' },
          json: () => Promise.resolve({ accessToken: 'new-token' })
        })
        // Mock da requisição com novo token
        .mockResolvedValueOnce({
          ok: true,
          headers: { get: () => 'application/json' },
          json: () => Promise.resolve({ id: '1', name: 'User' })
        });

      const result = await client.getProfile();

      expect(result.success).toBe(true);
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });
  });

  describe('Operações CRUD', () => {
    beforeEach(() => {
      client.setTokens('valid-token');
    });

    it('deve criar projeto', async () => {
      const projectData = {
        name: 'Test Project',
        description: 'A test project'
      };

      const mockResponse = {
        project: {
          id: '1',
          ...projectData,
          ownerId: 'user-1',
          collaborators: [],
          data: {},
          isPublic: false,
          tags: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: { get: () => 'application/json' },
        json: () => Promise.resolve(mockResponse)
      });

      const result = await client.createProject(projectData);

      expect(result.success).toBe(true);
      expect(result.data?.project).toMatchObject(projectData);
    });

    it('deve listar projetos com filtros', async () => {
      const mockResponse = {
        projects: [
          { id: '1', name: 'Project 1' },
          { id: '2', name: 'Project 2' }
        ],
        pagination: {
          page: 1,
          limit: 10,
          total: 2,
          totalPages: 1
        }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: { get: () => 'application/json' },
        json: () => Promise.resolve(mockResponse)
      });

      const result = await client.getProjects({
        page: 1,
        limit: 10,
        search: 'test'
      });

      expect(result.success).toBe(true);
      expect(result.data?.projects).toHaveLength(2);
      expect(result.data?.pagination).toMatchObject(mockResponse.pagination);

      // Verificar URL com query params
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('page=1&limit=10&search=test'),
        expect.any(Object)
      );
    });

    it('deve usar cache quando disponível', async () => {
      const mockResponse = {
        projects: [{ id: '1', name: 'Cached Project' }],
        pagination: { page: 1, limit: 10, total: 1, totalPages: 1 }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: { get: () => 'application/json' },
        json: () => Promise.resolve(mockResponse)
      });

      // Primeira chamada
      const result1 = await client.getCachedProjects();
      expect(result1.success).toBe(true);
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Segunda chamada (deve usar cache)
      const result2 = await client.getCachedProjects();
      expect(result2.success).toBe(true);
      expect(result2.data).toEqual(result1.data);
      expect(mockFetch).toHaveBeenCalledTimes(1); // Não deve fazer nova requisição
    });
  });

  describe('Tratamento de Erros', () => {
    beforeEach(() => {
      client.setTokens('valid-token');
    });

    it('deve tratar erro de rede', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await client.getProfile();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error');
    });

    it('deve tratar resposta não-JSON', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        headers: { get: () => 'text/html' },
        text: () => Promise.resolve('Internal Server Error')
      });

      const result = await client.getProfile();

      expect(result.success).toBe(false);
      expect(result.error).toContain('HTTP 500');
    });
  });

  describe('Upload de Arquivos', () => {
    beforeEach(() => {
      client.setTokens('valid-token');
    });

    it('deve fazer upload de arquivo', async () => {
      const mockFile = new File(['content'], 'test.txt', { type: 'text/plain' });
      
      const mockResponse = {
        url: 'https://example.com/uploads/test.txt',
        filename: 'test.txt',
        size: 7,
        type: 'text/plain'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await client.uploadFile(mockFile);

      expect(result.success).toBe(true);
      expect(result.data).toMatchObject(mockResponse);
      
      // Verificar se FormData foi enviado
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toContain('/upload');
      expect(options.body).toBeInstanceOf(FormData);
    });
  });

  describe('Batch Operations', () => {
    beforeEach(() => {
      client.setTokens('valid-token');
    });

    it('deve atualizar múltiplos projetos', async () => {
      const updates = [
        { id: '1', data: { name: 'Updated Project 1' } },
        { id: '2', data: { name: 'Updated Project 2' } }
      ];

      const mockResponse = {
        results: [
          { id: '1', success: true },
          { id: '2', success: true }
        ]
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: { get: () => 'application/json' },
        json: () => Promise.resolve(mockResponse)
      });

      const result = await client.batchUpdateProjects(updates);

      expect(result.success).toBe(true);
      expect(result.data?.results).toHaveLength(2);
      expect(result.data?.results.every(r => r.success)).toBe(true);
    });
  });

  describe('Utilitários', () => {
    it('deve verificar se está autenticado', () => {
      expect(client.isAuthenticated()).toBe(false);

      client.setTokens('token');
      expect(client.isAuthenticated()).toBe(true);

      client.setAPIKey('api-key');
      expect(client.isAuthenticated()).toBe(true);

      client.clearAuth();
      expect(client.isAuthenticated()).toBe(false);
    });

    it('deve limpar cache', () => {
      // Simular cache
      (client as any).cache.set('test', { data: 'test', expiry: Date.now() + 1000 });
      
      expect((client as any).cache.size).toBe(1);
      
      client.clearCache();
      
      expect((client as any).cache.size).toBe(0);
    });
  });
});

// Testes de Integração
describe('Integração API Completa', () => {
  let api: VideoEditorAPI;
  let client: VideoEditorAPIClient;
  let app: any;

  beforeAll(() => {
    api = new VideoEditorAPI(3003);
    app = (api as any).app;
    client = new VideoEditorAPIClient('http://localhost:3003');
  });

  it('deve realizar fluxo completo de usuário', async () => {
    // 1. Registrar usuário
    const userData = {
      email: 'integration@example.com',
      password: 'password123',
      name: 'Integration User'
    };

    const registerResult = await client.register(userData);
    expect(registerResult.success).toBe(true);

    // 2. Criar projeto
    const projectData = {
      name: 'Integration Project',
      description: 'Full integration test project'
    };

    const createProjectResult = await client.createProject(projectData);
    expect(createProjectResult.success).toBe(true);

    const projectId = createProjectResult.data!.project.id;

    // 3. Atualizar projeto
    const updateResult = await client.updateProject(projectId, {
      name: 'Updated Integration Project'
    });
    expect(updateResult.success).toBe(true);

    // 4. Listar projetos
    const listResult = await client.getProjects();
    expect(listResult.success).toBe(true);
    expect(listResult.data!.projects.length).toBeGreaterThan(0);

    // 5. Criar API key
    const apiKeyResult = await client.createAPIKey({
      name: 'Integration API Key',
      permissions: ['read:projects']
    });
    expect(apiKeyResult.success).toBe(true);

    // 6. Usar API key
    const apiKey = apiKeyResult.data!.apiKey.key;
    client.clearAuth();
    client.setAPIKey(apiKey);

    const profileResult = await client.getProfile();
    expect(profileResult.success).toBe(true);

    // 7. Deletar projeto
    client.setTokens(registerResult.data!.accessToken);
    const deleteResult = await client.deleteProject(projectId);
    expect(deleteResult.success).toBe(true);
  });
});