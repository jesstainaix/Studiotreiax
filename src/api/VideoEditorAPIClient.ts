/**
 * SDK Cliente para Video Editor API
 * Interface TypeScript completa para consumir a API REST
 */

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'editor' | 'viewer';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  collaborators: string[];
  data: any;
  isPublic: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Template {
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
  createdAt: string;
  updatedAt: string;
}

export interface APIKey {
  id: string;
  userId: string;
  name: string;
  key: string;
  permissions: string[];
  lastUsedAt?: string;
  expiresAt?: string;
  isActive: boolean;
  createdAt: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  message: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface ProjectFilters extends PaginationParams {
  search?: string;
}

export interface TemplateFilters extends PaginationParams {
  category?: string;
}

export interface CreateProjectData {
  name: string;
  description?: string;
  isPublic?: boolean;
  tags?: string[];
}

export interface UpdateProjectData {
  name?: string;
  description?: string;
  data?: any;
  isPublic?: boolean;
  tags?: string[];
}

export interface CreateAPIKeyData {
  name: string;
  permissions: string[];
  expiresIn?: number;
}

class VideoEditorAPIClient {
  private baseURL: string;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private apiKey: string | null = null;

  constructor(baseURL = 'http://localhost:3001') {
    this.baseURL = baseURL;
  }

  // Configuração de autenticação
  setTokens(accessToken: string, refreshToken?: string) {
    this.accessToken = accessToken;
    if (refreshToken) {
      this.refreshToken = refreshToken;
    }
  }

  setAPIKey(apiKey: string) {
    this.apiKey = apiKey;
  }

  clearAuth() {
    this.accessToken = null;
    this.refreshToken = null;
    this.apiKey = null;
  }

  // Método base para requisições
  private async request<T = any>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<APIResponse<T>> {
    const url = `${this.baseURL}/api${endpoint}`;
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    // Adicionar autenticação
    if (this.apiKey) {
      headers['X-API-Key'] = this.apiKey;
    } else if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers
      });

      let data;
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      if (!response.ok) {
        // Tentar renovar token se for erro 401 e temos refresh token
        if (response.status === 401 && this.refreshToken && endpoint !== '/auth/refresh') {
          const renewed = await this.refreshAccessToken();
          if (renewed) {
            // Tentar novamente com novo token
            return this.request<T>(endpoint, options);
          }
        }

        return {
          success: false,
          error: data.error || data.message || `HTTP ${response.status}`,
          data: data
        };
      }

      return {
        success: true,
        data: data,
        message: data.message
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  // Autenticação
  async register(userData: RegisterData): Promise<APIResponse<AuthResponse>> {
    const response = await this.request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    });

    if (response.success && response.data) {
      this.setTokens(response.data.accessToken, response.data.refreshToken);
    }

    return response;
  }

  async login(credentials: LoginCredentials): Promise<APIResponse<AuthResponse>> {
    const response = await this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    });

    if (response.success && response.data) {
      this.setTokens(response.data.accessToken, response.data.refreshToken);
    }

    return response;
  }

  async logout(): Promise<APIResponse> {
    const response = await this.request('/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ refreshToken: this.refreshToken })
    });

    if (response.success) {
      this.clearAuth();
    }

    return response;
  }

  async refreshAccessToken(): Promise<boolean> {
    if (!this.refreshToken) {
      return false;
    }

    const response = await this.request<{ accessToken: string }>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken: this.refreshToken })
    });

    if (response.success && response.data) {
      this.accessToken = response.data.accessToken;
      return true;
    }

    return false;
  }

  // Usuários
  async getProfile(): Promise<APIResponse<User>> {
    return this.request<User>('/users/profile');
  }

  async updateProfile(userData: Partial<Pick<User, 'name' | 'email'>>): Promise<APIResponse<{ user: User }>> {
    return this.request<{ user: User }>('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(userData)
    });
  }

  async getUsers(params: PaginationParams = {}): Promise<APIResponse<{
    users: User[];
    pagination: any;
  }>> {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.set('page', params.page.toString());
    if (params.limit) queryParams.set('limit', params.limit.toString());

    return this.request<{
      users: User[];
      pagination: any;
    }>(`/users?${queryParams}`);
  }

  // Projetos
  async getProjects(filters: ProjectFilters = {}): Promise<APIResponse<{
    projects: Project[];
    pagination: any;
  }>> {
    const queryParams = new URLSearchParams();
    if (filters.page) queryParams.set('page', filters.page.toString());
    if (filters.limit) queryParams.set('limit', filters.limit.toString());
    if (filters.search) queryParams.set('search', filters.search);

    return this.request<{
      projects: Project[];
      pagination: any;
    }>(`/projects?${queryParams}`);
  }

  async getProject(id: string): Promise<APIResponse<Project>> {
    return this.request<Project>(`/projects/${id}`);
  }

  async createProject(projectData: CreateProjectData): Promise<APIResponse<{ project: Project }>> {
    return this.request<{ project: Project }>('/projects', {
      method: 'POST',
      body: JSON.stringify(projectData)
    });
  }

  async updateProject(id: string, projectData: UpdateProjectData): Promise<APIResponse<{ project: Project }>> {
    return this.request<{ project: Project }>(`/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(projectData)
    });
  }

  async deleteProject(id: string): Promise<APIResponse> {
    return this.request(`/projects/${id}`, {
      method: 'DELETE'
    });
  }

  async addProjectCollaborator(projectId: string, userId: string): Promise<APIResponse> {
    return this.request(`/projects/${projectId}/collaborators`, {
      method: 'POST',
      body: JSON.stringify({ userId })
    });
  }

  async removeProjectCollaborator(projectId: string, userId: string): Promise<APIResponse> {
    return this.request(`/projects/${projectId}/collaborators/${userId}`, {
      method: 'DELETE'
    });
  }

  // Templates
  async getTemplates(filters: TemplateFilters = {}): Promise<APIResponse<{
    templates: Template[];
    pagination: any;
  }>> {
    const queryParams = new URLSearchParams();
    if (filters.page) queryParams.set('page', filters.page.toString());
    if (filters.limit) queryParams.set('limit', filters.limit.toString());
    if (filters.category) queryParams.set('category', filters.category);

    return this.request<{
      templates: Template[];
      pagination: any;
    }>(`/templates?${queryParams}`);
  }

  async getTemplate(id: string): Promise<APIResponse<Template>> {
    return this.request<Template>(`/templates/${id}`);
  }

  async createTemplate(templateData: Omit<Template, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'usageCount' | 'rating'>): Promise<APIResponse<{ template: Template }>> {
    return this.request<{ template: Template }>('/templates', {
      method: 'POST',
      body: JSON.stringify(templateData)
    });
  }

  async updateTemplate(id: string, templateData: Partial<Template>): Promise<APIResponse<{ template: Template }>> {
    return this.request<{ template: Template }>(`/templates/${id}`, {
      method: 'PUT',
      body: JSON.stringify(templateData)
    });
  }

  async deleteTemplate(id: string): Promise<APIResponse> {
    return this.request(`/templates/${id}`, {
      method: 'DELETE'
    });
  }

  async useTemplate(id: string): Promise<APIResponse<{ project: Project }>> {
    return this.request<{ project: Project }>(`/templates/${id}/use`, {
      method: 'POST'
    });
  }

  // API Keys
  async getAPIKeys(): Promise<APIResponse<{ apiKeys: APIKey[] }>> {
    return this.request<{ apiKeys: APIKey[] }>('/api-keys');
  }

  async createAPIKey(keyData: CreateAPIKeyData): Promise<APIResponse<{ apiKey: APIKey }>> {
    return this.request<{ apiKey: APIKey }>('/api-keys', {
      method: 'POST',
      body: JSON.stringify(keyData)
    });
  }

  async deleteAPIKey(id: string): Promise<APIResponse> {
    return this.request(`/api-keys/${id}`, {
      method: 'DELETE'
    });
  }

  async updateAPIKey(id: string, data: { name?: string; isActive?: boolean }): Promise<APIResponse<{ apiKey: APIKey }>> {
    return this.request<{ apiKey: APIKey }>(`/api-keys/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  // Analytics e Métricas
  async getAnalytics(period = '7d'): Promise<APIResponse<{
    users: { total: number; active: number; new: number };
    projects: { total: number; created: number; updated: number };
    templates: { total: number; used: number; popular: Template[] };
    activity: { logins: number; operations: number; collaborations: number };
  }>> {
    return this.request<any>(`/analytics?period=${period}`);
  }

  async getUserActivity(userId?: string): Promise<APIResponse<{
    projects: number;
    collaborations: number;
    lastLogin: string;
    createdAt: string;
  }>> {
    const endpoint = userId ? `/analytics/users/${userId}` : '/analytics/user';
    return this.request<any>(endpoint);
  }

  // Webhooks
  async getWebhooks(status?: string): Promise<APIResponse<{
    webhooks: any[];
    pagination: any;
  }>> {
    const queryParams = new URLSearchParams();
    if (status) queryParams.set('status', status);

    return this.request<any>(`/webhooks?${queryParams}`);
  }

  async retryWebhook(id: string): Promise<APIResponse> {
    return this.request(`/webhooks/${id}/retry`, {
      method: 'POST'
    });
  }

  // Health Check
  async getHealth(): Promise<APIResponse<{
    status: string;
    timestamp: string;
    version: string;
  }>> {
    return this.request<any>('/health', {
      headers: {}
    });
  }

  // Upload de arquivos
  async uploadFile(file: File, folder = 'uploads'): Promise<APIResponse<{
    url: string;
    filename: string;
    size: number;
    type: string;
  }>> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);

    const headers: HeadersInit = {};
    
    // Adicionar autenticação sem Content-Type (deixar o browser definir)
    if (this.apiKey) {
      headers['X-API-Key'] = this.apiKey;
    } else if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    try {
      const response = await fetch(`${this.baseURL}/api/upload`, {
        method: 'POST',
        headers,
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || `HTTP ${response.status}`,
          data: data
        };
      }

      return {
        success: true,
        data: data
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro no upload'
      };
    }
  }

  // Utilitários
  isAuthenticated(): boolean {
    return !!(this.accessToken || this.apiKey);
  }

  getCurrentUser(): User | null {
    // Em uma implementação real, você decodificaria o JWT
    // Por simplicidade, retornamos null aqui
    return null;
  }

  // Rate limiting helper
  private rateLimitCache = new Map<string, { count: number; resetTime: number }>();

  private checkRateLimit(endpoint: string, limit = 60): boolean {
    const now = Date.now();
    const windowMs = 60 * 1000; // 1 minuto
    
    const cache = this.rateLimitCache.get(endpoint);
    
    if (!cache || now > cache.resetTime) {
      this.rateLimitCache.set(endpoint, {
        count: 1,
        resetTime: now + windowMs
      });
      return true;
    }
    
    if (cache.count >= limit) {
      return false;
    }
    
    cache.count++;
    return true;
  }

  // Batch operations
  async batchUpdateProjects(updates: { id: string; data: UpdateProjectData }[]): Promise<APIResponse<{
    results: { id: string; success: boolean; error?: string }[];
  }>> {
    return this.request<any>('/projects/batch', {
      method: 'PUT',
      body: JSON.stringify({ updates })
    });
  }

  async batchDeleteProjects(ids: string[]): Promise<APIResponse<{
    results: { id: string; success: boolean; error?: string }[];
  }>> {
    return this.request<any>('/projects/batch', {
      method: 'DELETE',
      body: JSON.stringify({ ids })
    });
  }

  // Cache management
  private cache = new Map<string, { data: any; expiry: number }>();

  private getCached<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (!cached || Date.now() > cached.expiry) {
      this.cache.delete(key);
      return null;
    }
    return cached.data;
  }

  private setCache<T>(key: string, data: T, ttlMs = 5 * 60 * 1000): void {
    this.cache.set(key, {
      data,
      expiry: Date.now() + ttlMs
    });
  }

  async getCachedProjects(filters: ProjectFilters = {}): Promise<APIResponse<{
    projects: Project[];
    pagination: any;
  }>> {
    const cacheKey = `projects:${JSON.stringify(filters)}`;
    const cached = this.getCached<{ projects: Project[]; pagination: any }>(cacheKey);
    
    if (cached) {
      return {
        success: true,
        data: cached
      };
    }

    const response = await this.getProjects(filters);
    
    if (response.success && response.data) {
      this.setCache(cacheKey, response.data);
    }

    return response;
  }

  clearCache(): void {
    this.cache.clear();
  }
}

export default VideoEditorAPIClient;

// Instância global do cliente (opcional)
export const apiClient = new VideoEditorAPIClient();

// Hook React para usar com o cliente (exemplo)
export const useAPI = () => {
  return apiClient;
};

// Helpers para React Query/SWR
export const apiQueries = {
  projects: (filters?: ProjectFilters) => ({
    queryKey: ['projects', filters],
    queryFn: () => apiClient.getProjects(filters)
  }),
  
  project: (id: string) => ({
    queryKey: ['project', id],
    queryFn: () => apiClient.getProject(id)
  }),
  
  templates: (filters?: TemplateFilters) => ({
    queryKey: ['templates', filters],
    queryFn: () => apiClient.getTemplates(filters)
  }),
  
  profile: () => ({
    queryKey: ['profile'],
    queryFn: () => apiClient.getProfile()
  })
};