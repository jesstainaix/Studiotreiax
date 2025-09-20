import { supabase } from '@/lib/supabase';
import type {
  Project,
  ProjectCreateData,
  ProjectUpdateData,
  ProjectFilters,
  ProjectStats,
  ProjectLayer,
  ProjectVersion,
  ProjectExportJob
} from '../types/project';

export interface Template {
  id: string;
  name: string;
  description?: string;
  category: string;
  nrCategory?: string;
  difficulty: 'Básico' | 'Intermediário' | 'Avançado';
  thumbnailUrl?: string;
  previewUrl?: string;
  tags: string[];
  settings: Record<string, any>;
  content: Record<string, any>;
  metadata: Record<string, any>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Interface para cache
interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class ProjectService {
  private cache = new Map<string, CacheItem<any>>();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutos

  // Métodos de cache
  private setCache<T>(key: string, data: T, ttl = this.DEFAULT_TTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  private getCache<T>(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;

    const now = Date.now();
    if (now - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data as T;
  }

  private clearCache(pattern?: string): void {
    if (!pattern) {
      this.cache.clear();
      return;
    }

    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  // Tratamento de erro melhorado
  private handleError(error: any, context: string): never {
    console.error(`[ProjectService] Erro em ${context}:`, error);
    
    if (error?.code === 'PGRST116') {
      throw new Error('Recurso não encontrado');
    }
    
    if (error?.code === '23505') {
      throw new Error('Já existe um projeto com este nome');
    }
    
    if (error?.message?.includes('auth')) {
      throw new Error('Sessão expirada. Faça login novamente.');
    }
    
    if (error?.message?.includes('network')) {
      throw new Error('Erro de conexão. Verifique sua internet.');
    }
    
    throw new Error(error?.message || `Erro desconhecido em ${context}`);
  }
  // Operações básicas de projeto
  async createProject(data: ProjectCreateData): Promise<Project> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data: project, error } = await supabase
        .from('projects')
        .insert({
          title: data.title,
          description: data.description,
          template_id: data.templateId,
          category: data.category,
          nr_category: data.nrCategory,
          difficulty: data.difficulty,
          tags: data.tags,
          settings: data.settings,
          content: data.content,
          metadata: data.metadata,
          user_id: user.id
        })
        .select()
        .single();

      if (error) throw error;
      
      const mappedProject = this.mapProjectFromDB(project);
      
      // Limpar cache relacionado
      this.clearCache('projects');
      this.clearCache('stats');
      
      return mappedProject;
    } catch (error) {
      this.handleError(error, 'createProject');
    }
  }

  async getProject(id: string): Promise<Project | null> {
    try {
      // Verificar cache
      const cacheKey = `project_${id}`
      const cached = this.getCache<Project>(cacheKey)
      if (cached) return cached
      
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        if (error.code === 'PGRST116') return null
        this.handleError(error, 'getProject')
      }

      const project = this.mapProjectFromDB(data)
      
      // Salvar no cache
      this.setCache(cacheKey, project)
      
      return project
    } catch (error) {
      this.handleError(error, 'getProject')
    }
  }

  async updateProject(id: string, data: ProjectUpdateData): Promise<Project> {
    const { data: project, error } = await supabase
      .from('projects')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return this.mapProjectFromDB(project)
  }

  // Método auxiliar para mapear dados do banco
  private mapProjectFromDB(dbProject: any): Project {
    return {
      id: dbProject.id,
      userId: dbProject.user_id,
      title: dbProject.title,
      description: dbProject.description,
      thumbnailUrl: dbProject.thumbnail_url,
      status: dbProject.status,
      category: dbProject.category,
      nrCategory: dbProject.nr_category,
      difficulty: dbProject.difficulty,
      duration: dbProject.duration || 0,
      slidesCount: dbProject.slides_count || 0,
      tags: dbProject.tags || [],
      settings: dbProject.settings || {},
      content: dbProject.content || {},
      metadata: dbProject.metadata || {},
      createdAt: dbProject.created_at,
      updatedAt: dbProject.updated_at
    };
  }

  async deleteProject(id: string): Promise<void> {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id)

    if (error) throw error
  }

  async duplicateProject(id: string, newTitle?: string): Promise<Project> {
    const original = await this.getProject(id)
    if (!original) throw new Error('Projeto não encontrado')
    
    return this.createProject({
      title: newTitle || `${original.title} (Cópia)`,
      description: original.description || '',
      category: original.category,
      nrCategory: original.nrCategory,
      difficulty: original.difficulty,
      tags: original.tags,
      settings: original.settings,
      content: original.content,
      metadata: original.metadata
    })
  }

  // Listagem e filtros
  async getProjects(
    filters: ProjectFilters = {},
    sort: { field: string; direction: 'asc' | 'desc' } = { field: 'updated_at', direction: 'desc' },
    page = 1,
    limit = 20
  ): Promise<{ projects: Project[]; total: number; hasMore: boolean }> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Usuário não autenticado')

    let query = supabase
      .from('projects')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)

    // Aplicar filtros
    if (filters.status?.length) {
      query = query.in('status', filters.status)
    }

    if (filters.nrCategory?.length) {
      query = query.in('nr_category', filters.nrCategory)
    }

    if (filters.search) {
      query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
    }

    if (filters.createdAfter) {
      query = query.gte('created_at', filters.createdAfter)
    }

    if (filters.createdBefore) {
      query = query.lte('created_at', filters.createdBefore)
    }

    // Aplicar ordenação
    query = query.order(sort.field, { ascending: sort.direction === 'asc' })

    // Aplicar paginação
    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)

    const { data, error, count } = await query

    if (error) throw error

    return {
      projects: data?.map(p => this.mapProjectFromDB(p)) || [],
      total: count || 0,
      hasMore: (count || 0) > page * limit
    }
  }

  async getRecentProjects(limit = 5): Promise<Project[]> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Usuário não autenticado')

    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data?.map(p => this.mapProjectFromDB(p)) || []
  }

  async getProjectStats(): Promise<ProjectStats> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Usuário não autenticado')

    const { data: projects, error } = await supabase
      .from('projects')
      .select('status, nr_category, duration, template_id, template_name')
      .eq('user_id', user.id)

    if (error) throw error

    const stats: ProjectStats = {
      totalProjects: projects?.length || 0,
      totalDuration: 0,
      averageCompletionTime: 0,
      byStatus: {
        draft: 0,
        in_progress: 0,
        completed: 0,
        published: 0
      },
      byCategory: {},
      mostUsedTemplates: []
    }

    if (projects) {
      // Estatísticas por status
      projects.forEach(project => {
        const currentStatusCount = stats.byStatus[project.status] || 0
        stats.byStatus[project.status] = currentStatusCount + 1
        stats.totalDuration += project.duration || 0
        
        // Estatísticas por categoria
        if (project.nr_category) {
          const currentCount = stats.byCategory[project.nr_category] || 0
          stats.byCategory[project.nr_category] = currentCount + 1
        }
      })

      // Templates mais usados
      const templateCount: Record<string, { name: string; count: number }> = {}
      projects.forEach(project => {
        if (project.template_id) {
          if (!templateCount[project.template_id]) {
            templateCount[project.template_id] = {
              name: project.template_name || 'Template',
              count: 0
            }
          }
          const template = templateCount[project.template_id]
          if (template) {
            template.count++
          }
        }
      })

      stats.mostUsedTemplates = Object.entries(templateCount)
        .map(([templateId, data]) => ({
          templateId,
          templateName: data.name,
          usageCount: data.count
        }))
        .sort((a, b) => b.usageCount - a.usageCount)
        .slice(0, 5)

      stats.averageCompletionTime = stats.totalDuration / (stats.totalProjects || 1)
    }

    return stats
  }

  // Listar templates
  async listTemplates(category?: string): Promise<Template[]> {
    let query = supabase
      .from('templates')
      .select('*')
      .eq('is_active', true);

    if (category) {
      query = query.eq('category', category);
    }

    query = query.order('name');

    const { data: templates, error } = await query;
    if (error) throw error;

    return templates?.map(template => ({
      id: template.id,
      name: template.name,
      description: template.description,
      category: template.category,
      nrCategory: template.nr_category,
      difficulty: template.difficulty,
      thumbnailUrl: template.thumbnail_url,
      previewUrl: template.preview_url,
      tags: template.tags || [],
      settings: template.settings || {},
      content: template.content || {},
      metadata: template.metadata || {},
      isActive: template.is_active,
      createdAt: template.created_at,
      updatedAt: template.updated_at
    })) || [];
  }

  // Gerenciamento de camadas
  async getProjectLayers(projectId: string): Promise<ProjectLayer[]> {
    const { data, error } = await supabase
      .from('project_layers')
      .select('*')
      .eq('project_id', projectId)
      .order('position->z', { ascending: true })

    if (error) throw error
    return data || []
  }

  async createLayer(layer: Omit<ProjectLayer, 'id' | 'created_at' | 'updated_at'>): Promise<ProjectLayer> {
    const { data, error } = await supabase
      .from('project_layers')
      .insert(layer)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async updateLayer(id: string, updates: Partial<ProjectLayer>): Promise<ProjectLayer> {
    const { data, error } = await supabase
      .from('project_layers')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async deleteLayer(id: string): Promise<void> {
    const { error } = await supabase
      .from('project_layers')
      .delete()
      .eq('id', id)

    if (error) throw error
  }

  // Versionamento
  async createVersion(projectId: string, title: string, changesSummary: string): Promise<ProjectVersion> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Usuário não autenticado')

    // Buscar projeto atual
    const project = await this.getProject(projectId)
    if (!project) throw new Error('Projeto não encontrado')

    // Buscar última versão
    const { data: lastVersion } = await supabase
      .from('project_versions')
      .select('version_number')
      .eq('project_id', projectId)
      .order('version_number', { ascending: false })
      .limit(1)
      .single()

    const versionNumber = (lastVersion?.version_number || 0) + 1

    const versionData = {
      project_id: projectId,
      version_number: versionNumber,
      title,
      changes_summary: changesSummary,
      created_by: user.id,
      is_current: true,
      backup_data: project
    }

    // Marcar versões anteriores como não atuais
    await supabase
      .from('project_versions')
      .update({ is_current: false })
      .eq('project_id', projectId)

    const { data, error } = await supabase
      .from('project_versions')
      .insert(versionData)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async getProjectVersions(projectId: string): Promise<ProjectVersion[]> {
    const { data, error } = await supabase
      .from('project_versions')
      .select('*')
      .eq('project_id', projectId)
      .order('version_number', { ascending: false })

    if (error) throw error
    return data || []
  }

  // Exportação
  async createExportJob(projectId: string, options: Record<string, any>): Promise<ProjectExportJob> {
    const jobData = {
      project_id: projectId,
      status: 'pending' as const,
      progress: 0,
      options
    }

    const { data, error } = await supabase
      .from('export_jobs')
      .insert(jobData)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async getExportJob(id: string): Promise<ProjectExportJob | null> {
    const { data, error } = await supabase
      .from('export_jobs')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }

    return data
  }

  async getProjectExports(projectId: string): Promise<ProjectExportJob[]> {
    const { data, error } = await supabase
      .from('export_jobs')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  }
}

export const projectService = new ProjectService()
export default projectService