import React, { useState, useEffect } from 'react';
import { Folder, FolderPlus, Edit3, Trash2, Move, Search, Filter, Grid, List, MoreVertical, Star, Lock, Users } from 'lucide-react';
import { Project, ProjectFolder, ProjectSortBy, ProjectFilterOptions } from '../../types/project';
import { projectService } from '../../services/projectService';
import { toast } from 'sonner';

interface ProjectOrganizerProps {
  projects: Project[];
  onProjectSelect: (project: Project) => void;
  onProjectUpdate: (project: Project) => void;
  onProjectDelete: (projectId: string) => void;
  onFolderCreate: (folder: ProjectFolder) => void;
  onFolderUpdate: (folder: ProjectFolder) => void;
  onFolderDelete: (folderId: string) => void;
}

export const ProjectOrganizer: React.FC<ProjectOrganizerProps> = ({
  projects,
  onProjectSelect,
  onProjectUpdate,
  onProjectDelete,
  onFolderCreate,
  onFolderUpdate,
  onFolderDelete
}) => {
  const [folders, setFolders] = useState<ProjectFolder[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<ProjectSortBy>('updatedAt');
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<ProjectFilterOptions>({});
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [editingFolder, setEditingFolder] = useState<ProjectFolder | null>(null);
  const [newFolderName, setNewFolderName] = useState('');
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [draggedProject, setDraggedProject] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadFolders();
  }, []);

  const loadFolders = async () => {
    try {
      setLoading(true);
      const foldersData = await projectService.getFolders();
      setFolders(foldersData);
    } catch (error) {
      console.error('Erro ao carregar pastas:', error);
      toast.error('Erro ao carregar pastas');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      toast.error('Nome da pasta é obrigatório');
      return;
    }

    try {
      const folder: Omit<ProjectFolder, 'id' | 'createdAt' | 'updatedAt'> = {
        name: newFolderName.trim(),
        description: '',
        color: '#3B82F6',
        parentId: selectedFolder,
        projectIds: [],
        isPublic: false
      };

      const createdFolder = await projectService.createFolder(folder);
      setFolders([...folders, createdFolder]);
      onFolderCreate(createdFolder);
      setNewFolderName('');
      setShowCreateFolder(false);
      toast.success('Pasta criada com sucesso!');
    } catch (error) {
      console.error('Erro ao criar pasta:', error);
      toast.error('Erro ao criar pasta');
    }
  };

  const handleUpdateFolder = async (folder: ProjectFolder) => {
    try {
      const updatedFolder = await projectService.updateFolder(folder.id, folder);
      setFolders(folders.map(f => f.id === folder.id ? updatedFolder : f));
      onFolderUpdate(updatedFolder);
      setEditingFolder(null);
      toast.success('Pasta atualizada com sucesso!');
    } catch (error) {
      console.error('Erro ao atualizar pasta:', error);
      toast.error('Erro ao atualizar pasta');
    }
  };

  const handleDeleteFolder = async (folderId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta pasta? Os projetos serão movidos para a pasta raiz.')) {
      return;
    }

    try {
      await projectService.deleteFolder(folderId);
      setFolders(folders.filter(f => f.id !== folderId));
      onFolderDelete(folderId);
      if (selectedFolder === folderId) {
        setSelectedFolder(null);
      }
      toast.success('Pasta excluída com sucesso!');
    } catch (error) {
      console.error('Erro ao excluir pasta:', error);
      toast.error('Erro ao excluir pasta');
    }
  };

  const handleMoveProjects = async (targetFolderId: string | null) => {
    try {
      await Promise.all(
        selectedProjects.map(projectId =>
          projectService.moveProjectToFolder(projectId, targetFolderId)
        )
      );
      
      // Atualizar pastas
      const updatedFolders = folders.map(folder => ({
        ...folder,
        projectIds: targetFolderId === folder.id
          ? [...folder.projectIds, ...selectedProjects]
          : folder.projectIds.filter(id => !selectedProjects.includes(id))
      }));
      
      setFolders(updatedFolders);
      setSelectedProjects([]);
      setShowMoveModal(false);
      toast.success('Projetos movidos com sucesso!');
    } catch (error) {
      console.error('Erro ao mover projetos:', error);
      toast.error('Erro ao mover projetos');
    }
  };

  const handleDragStart = (projectId: string) => {
    setDraggedProject(projectId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, folderId: string | null) => {
    e.preventDefault();
    if (draggedProject) {
      handleMoveProjects(folderId);
      setDraggedProject(null);
    }
  };

  const getFilteredProjects = () => {
    let filtered = projects;

    // Filtrar por pasta
    if (selectedFolder) {
      const folder = folders.find(f => f.id === selectedFolder);
      filtered = filtered.filter(p => folder?.projectIds.includes(p.id));
    } else {
      // Mostrar apenas projetos que não estão em nenhuma pasta
      const projectsInFolders = folders.flatMap(f => f.projectIds);
      filtered = filtered.filter(p => !projectsInFolders.includes(p.id));
    }

    // Filtrar por termo de busca
    if (searchTerm) {
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Aplicar filtros
    if (filters.status) {
      filtered = filtered.filter(p => p.status === filters.status);
    }
    if (filters.isPublic !== undefined) {
      filtered = filtered.filter(p => p.isPublic === filters.isPublic);
    }
    if (filters.tags && filters.tags.length > 0) {
      filtered = filtered.filter(p => 
        filters.tags!.some(tag => p.tags.includes(tag))
      );
    }

    // Ordenar
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'createdAt':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'updatedAt':
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        case 'duration':
          return (b.duration || 0) - (a.duration || 0);
        default:
          return 0;
      }
    });

    return filtered;
  };

  const renderFolderTree = () => (
    <div className="w-64 bg-gray-50 border-r border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">Pastas</h3>
        <button
          onClick={() => setShowCreateFolder(true)}
          className="p-1 text-gray-500 hover:text-gray-700 transition-colors"
          title="Nova pasta"
        >
          <FolderPlus className="w-4 h-4" />
        </button>
      </div>

      {/* Pasta Raiz */}
      <div
        onClick={() => setSelectedFolder(null)}
        onDragOver={handleDragOver}
        onDrop={(e) => handleDrop(e, null)}
        className={`flex items-center p-2 rounded-lg cursor-pointer transition-colors mb-2 ${
          selectedFolder === null ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'
        }`}
      >
        <Folder className="w-4 h-4 mr-2" />
        <span className="text-sm">Todos os Projetos</span>
        <span className="ml-auto text-xs text-gray-500">
          {projects.filter(p => !folders.some(f => f.projectIds.includes(p.id))).length}
        </span>
      </div>

      {/* Pastas */}
      <div className="space-y-1">
        {folders.map(folder => (
          <div key={folder.id} className="group">
            <div
              onClick={() => setSelectedFolder(folder.id)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, folder.id)}
              className={`flex items-center p-2 rounded-lg cursor-pointer transition-colors ${
                selectedFolder === folder.id ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'
              }`}
            >
              <div
                className="w-3 h-3 rounded mr-2"
                style={{ backgroundColor: folder.color }}
              />
              <Folder className="w-4 h-4 mr-2" />
              <span className="text-sm flex-1 truncate">{folder.name}</span>
              <span className="text-xs text-gray-500 mr-2">
                {folder.projectIds.length}
              </span>
              
              <div className="opacity-0 group-hover:opacity-100 flex items-center">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingFolder(folder);
                    setNewFolderName(folder.name);
                  }}
                  className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                  title="Editar pasta"
                >
                  <Edit3 className="w-3 h-3" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteFolder(folder.id);
                  }}
                  className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                  title="Excluir pasta"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Criar Pasta */}
      {showCreateFolder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold mb-4">Nova Pasta</h3>
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Nome da pasta"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowCreateFolder(false);
                  setNewFolderName('');
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateFolder}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Criar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Editar Pasta */}
      {editingFolder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold mb-4">Editar Pasta</h3>
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Nome da pasta"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setEditingFolder(null);
                  setNewFolderName('');
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleUpdateFolder({ ...editingFolder, name: newFolderName })}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderProjectCard = (project: Project) => {
    const isSelected = selectedProjects.includes(project.id);
    
    return (
      <div
        key={project.id}
        draggable
        onDragStart={() => handleDragStart(project.id)}
        onClick={() => {
          if (selectedProjects.length > 0) {
            if (isSelected) {
              setSelectedProjects(selectedProjects.filter(id => id !== project.id));
            } else {
              setSelectedProjects([...selectedProjects, project.id]);
            }
          } else {
            onProjectSelect(project);
          }
        }}
        className={`bg-white border rounded-lg overflow-hidden hover:shadow-lg transition-all cursor-pointer group ${
          isSelected ? 'ring-2 ring-blue-500 border-blue-500' : 'border-gray-200'
        } ${viewMode === 'list' ? 'flex items-center p-4' : 'flex flex-col'}`}
      >
        {/* Thumbnail */}
        <div className={`bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center ${
          viewMode === 'list' ? 'w-16 h-16 rounded-lg mr-4 flex-shrink-0' : 'h-32 w-full'
        }`}>
          <div className="text-white font-bold text-lg">
            {project.name.charAt(0).toUpperCase()}
          </div>
        </div>

        {/* Content */}
        <div className={`flex-1 ${viewMode === 'list' ? '' : 'p-4'}`}>
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
              {project.name}
            </h3>
            <div className="flex items-center space-x-1">
              {project.isPublic && <Users className="w-4 h-4 text-green-500" />}
              {project.status === 'private' && <Lock className="w-4 h-4 text-gray-400" />}
              {project.isFavorite && <Star className="w-4 h-4 text-yellow-500" />}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  // Menu de ações
                }}
                className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-gray-600 transition-all"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
            </div>
          </div>

          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
            {project.description}
          </p>

          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>{new Date(project.updatedAt).toLocaleDateString()}</span>
            <span>{Math.floor((project.duration || 0) / 60)}min</span>
          </div>

          {/* Tags */}
          {project.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {project.tags.slice(0, 3).map(tag => (
                <span
                  key={tag}
                  className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded"
                >
                  {tag}
                </span>
              ))}
              {project.tags.length > 3 && (
                <span className="text-xs text-gray-500">+{project.tags.length - 3}</span>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderProjectsGrid = () => {
    const filteredProjects = getFilteredProjects();

    return (
      <div className="flex-1 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <h2 className="text-xl font-semibold text-gray-900">
              {selectedFolder ? folders.find(f => f.id === selectedFolder)?.name : 'Todos os Projetos'}
            </h2>
            <span className="text-sm text-gray-500">
              {filteredProjects.length} projeto{filteredProjects.length !== 1 ? 's' : ''}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            {selectedProjects.length > 0 && (
              <button
                onClick={() => setShowMoveModal(true)}
                className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
              >
                <Move className="w-4 h-4 mr-2" />
                Mover ({selectedProjects.length})
              </button>
            )}
            
            <div className="flex border border-gray-300 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 ${viewMode === 'grid' ? 'bg-blue-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 ${viewMode === 'list' ? 'bg-blue-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex items-center space-x-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar projetos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as ProjectSortBy)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="updatedAt">Modificado recentemente</option>
            <option value="createdAt">Criado recentemente</option>
            <option value="name">Nome A-Z</option>
            <option value="duration">Duração</option>
          </select>
        </div>

        {/* Grid de Projetos */}
        {filteredProjects.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Folder className="w-12 h-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum projeto encontrado</h3>
            <p className="text-gray-600">Tente ajustar os filtros ou criar um novo projeto.</p>
          </div>
        ) : (
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6' : 'space-y-4'}>
            {filteredProjects.map(renderProjectCard)}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex h-full">
      {renderFolderTree()}
      {renderProjectsGrid()}

      {/* Modal Mover Projetos */}
      {showMoveModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold mb-4">Mover Projetos</h3>
            <p className="text-sm text-gray-600 mb-4">
              Selecione a pasta de destino para {selectedProjects.length} projeto{selectedProjects.length !== 1 ? 's' : ''}:
            </p>
            
            <div className="space-y-2 max-h-64 overflow-auto">
              <button
                onClick={() => handleMoveProjects(null)}
                className="w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors flex items-center"
              >
                <Folder className="w-4 h-4 mr-2" />
                Pasta Raiz
              </button>
              
              {folders.map(folder => (
                <button
                  key={folder.id}
                  onClick={() => handleMoveProjects(folder.id)}
                  className="w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors flex items-center"
                >
                  <div
                    className="w-3 h-3 rounded mr-2"
                    style={{ backgroundColor: folder.color }}
                  />
                  <Folder className="w-4 h-4 mr-2" />
                  {folder.name}
                </button>
              ))}
            </div>
            
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowMoveModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};