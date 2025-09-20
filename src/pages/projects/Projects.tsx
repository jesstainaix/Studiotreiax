import React, { useState, useEffect } from 'react';
import { Search, MoreVertical, Play, Download, Trash2, Edit, Eye, Calendar, Clock, FileText, Grid, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import type { Project } from '@/types/project';
import { CreateProject } from '@/components/projects/CreateProject';

const Projects: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('updatedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateProject, setShowCreateProject] = useState(false);

  // Mock data
  useEffect(() => {
    const mockProjects: Project[] = [
      {
        id: '1',
        title: 'Treinamento NR-10 - Segurança Elétrica',
        description: 'Vídeo educativo sobre normas de segurança em instalações elétricas',
        status: 'completed',
        createdAt: '2024-01-15T00:00:00Z',
        updatedAt: '2024-01-20T00:00:00Z',
        duration: 30, // 30 minutos
        slidesCount: 20,
        thumbnailUrl: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=electrical%20safety%20training%20video%20thumbnail%20professional%20industrial&image_size=landscape_16_9',
        userId: 'user-1',
        templateId: 'template-nr10',
        category: 'Segurança',
        nrCategory: 'NR-10',
        difficulty: 'Intermediário',
        tags: ['NR-10', 'Segurança', 'Elétrica'],
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
          tags: ['NR-10', 'Segurança', 'Elétrica'],
          difficulty: 'Intermediário',
          target_audience: ['Eletricistas', 'Engenheiros'],
          learning_objectives: ['Conhecer normas de segurança', 'Aplicar procedimentos'],
          estimated_completion_time: 30
        }
      },
      {
        id: '2',
        title: 'NR-35 - Trabalho em Altura',
        description: 'Procedimentos de segurança para trabalhos em altura',
        status: 'in_progress',
        createdAt: '2024-01-18T00:00:00Z',
        updatedAt: '2024-01-18T00:00:00Z',
        duration: 25,
        slidesCount: 15,
        userId: 'user-1',
        templateId: 'template-nr35',
        category: 'Segurança',
        nrCategory: 'NR-35',
        difficulty: 'Avançado',
        tags: ['NR-35', 'Altura', 'Segurança'],
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
          tags: ['NR-35', 'Altura', 'Segurança'],
          difficulty: 'Avançado',
          target_audience: ['Trabalhadores em altura'],
          learning_objectives: ['Procedimentos de segurança'],
          estimated_completion_time: 25
        }
      },
      {
        id: '3',
        title: 'Apresentação Corporativa Q1 2024',
        description: 'Resultados e metas do primeiro trimestre',
        status: 'draft',
        createdAt: '2024-01-10T00:00:00Z',
        updatedAt: '2024-01-12T00:00:00Z',
        duration: 15,
        slidesCount: 10,
        userId: 'user-1',
        category: 'Corporativo',
        nrCategory: 'Geral',
        difficulty: 'Básico',
        tags: ['Corporativo', 'Resultados'],
        settings: {
          resolution: '1080p',
          fps: 30,
          frameRate: 30,
          videoBitrate: 5000,
          audioSampleRate: 44100,
          audioBitrate: 128,
          audio_quality: 'standard',
          watermark: true,
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
          tags: ['Corporativo', 'Resultados'],
          difficulty: 'Básico',
          target_audience: ['Gestores', 'Executivos'],
          learning_objectives: ['Conhecer resultados', 'Entender metas'],
          estimated_completion_time: 15
        }
      }
    ];

    setTimeout(() => {
      setProjects(mockProjects);
      setFilteredProjects(mockProjects);
      setLoading(false);
    }, 1000);
  }, []);

  // Filter and sort projects
  useEffect(() => {
    let filtered = [...projects];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(project =>
        project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (project.description && project.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        project.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(project => project.status === statusFilter);
    }

    // Sort
    filtered.sort((a, b) => {
      const aValue = a[sortBy as keyof Project];
      const bValue = b[sortBy as keyof Project];
      
      // Handle undefined values
      if (aValue === undefined && bValue === undefined) return 0;
      if (aValue === undefined) return sortOrder === 'asc' ? 1 : -1;
      if (bValue === undefined) return sortOrder === 'asc' ? -1 : 1;
      
      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredProjects(filtered);
  }, [projects, searchTerm, statusFilter, sortBy, sortOrder]);

  const getStatusBadge = (status: Project['status']) => {
    const variants = {
      draft: 'secondary',
      in_progress: 'warning',
      completed: 'success',
      published: 'default'
    };

    const labels = {
      draft: 'Rascunho',
      in_progress: 'Em Progresso',
      completed: 'Concluído',
      published: 'Publicado'
    };

    return (
      <Badge variant={variants[status] as any}>
        {labels[status]}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatDuration = (seconds: number) => {
    if (seconds === 0) return '--';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleSelectProject = (projectId: string) => {
    setSelectedProjects(prev => 
      prev.includes(projectId)
        ? prev.filter(id => id !== projectId)
        : [...prev, projectId]
    );
  };

  const handleSelectAll = () => {
    setSelectedProjects(
      selectedProjects.length === filteredProjects.length
        ? []
        : filteredProjects.map(p => p.id)
    );
  };

  const handleBulkAction = (action: string) => {
    // TODO: Implement bulk actions
  };

  const handleCreateProject = () => {
    setShowCreateProject(true);
  };

  const handleProjectCreated = () => {
    // Aqui você pode adicionar lógica para atualizar a lista de projetos
    // ou navegar para o editor do novo projeto
    setShowCreateProject(false);
    // Recarregar a lista de projetos seria uma boa prática
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Meus Projetos</h1>
          <p className="text-gray-600">Gerencie todos os seus projetos de vídeo</p>
        </div>
        <Button 
          onClick={handleCreateProject}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <FileText className="w-4 h-4" />
          Novo Projeto
        </Button>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Buscar projetos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Todos os Status</option>
            <option value="draft">Rascunho</option>
            <option value="in_progress">Em Progresso</option>
            <option value="completed">Concluído</option>
            <option value="published">Publicado</option>
          </select>

          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [field, order] = e.target.value.split('-');
              if (field && order) {
                setSortBy(field);
                setSortOrder(order as 'asc' | 'desc');
              }
            }}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="updatedAt-desc">Mais Recente</option>
            <option value="updatedAt-asc">Mais Antigo</option>
            <option value="title-asc">Nome A-Z</option>
            <option value="title-desc">Nome Z-A</option>
            <option value="duration-desc">Maior Duração</option>
            <option value="duration-asc">Menor Duração</option>
          </select>

          <div className="flex border border-gray-300 rounded-md">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="rounded-r-none"
            >
              <Grid className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="rounded-l-none"
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedProjects.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-blue-700">
              {selectedProjects.length} projeto(s) selecionado(s)
            </span>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => handleBulkAction('export')}>
                <Download className="w-4 h-4 mr-1" />
                Exportar
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleBulkAction('delete')}>
                <Trash2 className="w-4 h-4 mr-1" />
                Excluir
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Projects Grid/List */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <div key={project.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={selectedProjects.includes(project.id)}
                  onChange={() => handleSelectProject(project.id)}
                  className="absolute top-3 left-3 z-10"
                />
                {project.thumbnailUrl ? (
                  <img
                    src={project.thumbnailUrl}
                    alt={project.title}
                    className="w-full h-48 object-cover"
                  />
                ) : (
                  <div className="w-full h-48 bg-gray-100 flex items-center justify-center">
                    <FileText className="w-12 h-12 text-gray-400" />
                  </div>
                )}
                <div className="absolute top-3 right-3">
                  {getStatusBadge(project.status)}
                </div>
              </div>
              
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{project.title}</h3>
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">{project.description}</p>
                
                <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDuration(project.duration)}
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formatDate(project.updatedAt)}
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-1 mb-3">
                  {project.tags.slice(0, 2).map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                  {project.tags.length > 2 && (
                    <Badge variant="outline" className="text-xs">
                      +{project.tags.length - 2}
                    </Badge>
                  )}
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost">
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="ghost">
                      <Edit className="w-4 h-4" />
                    </Button>
                    {project.status === 'completed' && (
                      <Button size="sm" variant="ghost">
                        <Play className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  <Button size="sm" variant="ghost">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center gap-4">
              <input
                type="checkbox"
                checked={selectedProjects.length === filteredProjects.length && filteredProjects.length > 0}
                onChange={handleSelectAll}
              />
              <span className="text-sm font-medium text-gray-700">Selecionar Todos</span>
            </div>
          </div>
          
          <div className="divide-y divide-gray-200">
            {filteredProjects.map((project) => (
              <div key={project.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-center gap-4">
                  <input
                    type="checkbox"
                    checked={selectedProjects.includes(project.id)}
                    onChange={() => handleSelectProject(project.id)}
                  />
                  
                  <div className="w-16 h-12 bg-gray-100 rounded flex-shrink-0 flex items-center justify-center">
                    {project.thumbnailUrl ? (
                      <img
                        src={project.thumbnailUrl}
                        alt={project.title}
                        className="w-full h-full object-cover rounded"
                      />
                    ) : (
                      <FileText className="w-6 h-6 text-gray-400" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 truncate">{project.title}</h3>
                    <p className="text-sm text-gray-600 truncate">{project.description}</p>
                    <div className="flex items-center gap-4 mt-1">
                      <span className="text-xs text-gray-500">{formatDuration(project.duration)}</span>
                      <span className="text-xs text-gray-500">{project.slidesCount} slides</span>
                      <span className="text-xs text-gray-500">{formatDate(project.updatedAt)}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {getStatusBadge(project.status)}
                    <Button size="sm" variant="ghost">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {filteredProjects.length === 0 && (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum projeto encontrado</h3>
          <p className="text-gray-600 mb-4">Tente ajustar os filtros ou criar um novo projeto.</p>
          <Button 
            onClick={handleCreateProject}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <FileText className="w-4 h-4" />
            Criar Primeiro Projeto
          </Button>
        </div>
      )}

      {/* Modal de Criação de Projeto */}
      {showCreateProject && (
        <CreateProject
          onClose={() => setShowCreateProject(false)}
          onProjectCreated={handleProjectCreated}
        />
      )}
    </div>
  );
};

export default Projects;