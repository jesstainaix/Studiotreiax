import React, { useState, useRef, useCallback, useMemo } from 'react';
import {
  FileText, Folder, FolderOpen, Upload, Download,
  Eye, Edit3, Trash2, Share2, Copy, Move,
  Search, Filter, Grid, List, SortAsc, SortDesc,
  MoreVertical, Star, StarOff, Lock, Unlock,
  Calendar, User, FileImage, FileVideo,
  Archive, Code, Database, Music
} from 'lucide-react';
import { SharedFile, CollaborationUser } from '../../hooks/useRealTimeCollaboration';
import { VirtualizedList } from '../ui/VirtualizedList';

interface FileManagerProps {
  files: SharedFile[];
  users: CollaborationUser[];
  currentUser: CollaborationUser | null;
  onFileUpload: (file: File) => void;
  onFileDownload: (fileId: string) => void;
  onFileDelete: (fileId: string) => void;
  onFileShare: (fileId: string, userIds: string[]) => void;
  onFileRename: (fileId: string, newName: string) => void;
  onFolderCreate: (name: string, parentId?: string) => void;
  className?: string;
}

type ViewMode = 'grid' | 'list';
type SortBy = 'name' | 'size' | 'date' | 'type';
type SortOrder = 'asc' | 'desc';

interface FileFolder {
  id: string;
  name: string;
  type: 'folder';
  parentId?: string;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
}

const FileManager = React.memo<FileManagerProps>(({
  files,
  users,
  currentUser,
  onFileUpload,
  onFileDownload,
  onFileDelete,
  onFileShare,
  onFileRename,
  onFolderCreate,
  className = ''
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortBy>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareFileId, setShareFileId] = useState<string | null>(null);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [renameFileId, setRenameFileId] = useState<string | null>(null);
  const [newFileName, setNewFileName] = useState('');
  const [newFolderName, setNewFolderName] = useState('');
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [folders, setFolders] = useState<FileFolder[]>([]);
  const [dragOver, setDragOver] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  // Obter ícone do arquivo baseado no tipo
  const getFileIcon = useCallback((fileName: string, size: 'sm' | 'md' | 'lg' = 'md') => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    const iconSize = size === 'sm' ? 'w-4 h-4' : size === 'md' ? 'w-6 h-6' : 'w-8 h-8';
    
    switch (extension) {
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'svg':
        return <FileImage className={`${iconSize} text-green-600`} />;
      case 'mp4':
      case 'avi':
      case 'mov':
      case 'wmv':
        return <FileVideo className={`${iconSize} text-purple-600`} />;
      case 'mp3':
      case 'wav':
      case 'flac':
        return <Music className={`${iconSize} text-pink-600`} />;
      case 'zip':
      case 'rar':
      case '7z':
        return <Archive className={`${iconSize} text-orange-600`} />;
      case 'js':
      case 'ts':
      case 'jsx':
      case 'tsx':
      case 'html':
      case 'css':
      case 'json':
        return <Code className={`${iconSize} text-blue-600`} />;
      case 'sql':
      case 'db':
        return <Database className={`${iconSize} text-indigo-600`} />;
      default:
        return <FileText className={`${iconSize} text-gray-600`} />;
    }
  }, []);

  // Filtrar e ordenar arquivos
  const filteredAndSortedFiles = useCallback(() => {
    let filtered = files.filter(file => 
      file.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      file.folderId === currentFolder
    );
    
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'size':
          comparison = a.size - b.size;
          break;
        case 'date':
          comparison = a.uploadedAt.getTime() - b.uploadedAt.getTime();
          break;
        case 'type':
          const aExt = a.name.split('.').pop() || '';
          const bExt = b.name.split('.').pop() || '';
          comparison = aExt.localeCompare(bExt);
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });
    
    return filtered;
  }, [files, searchQuery, currentFolder, sortBy, sortOrder]);

  // Filtrar pastas
  const filteredFolders = useCallback(() => {
    return folders.filter(folder => 
      folder.parentId === currentFolder &&
      folder.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [folders, currentFolder, searchQuery]);

  // Manipular upload de arquivo
  const handleFileUpload = useCallback((uploadedFiles: FileList | null) => {
    if (!uploadedFiles) return;
    
    Array.from(uploadedFiles).forEach(file => {
      onFileUpload(file);
    });
    
    setShowUploadModal(false);
  }, [onFileUpload]);

  // Manipular drag and drop
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const droppedFiles = e.dataTransfer.files;
    handleFileUpload(droppedFiles);
  }, [handleFileUpload]);

  // Selecionar arquivo
  const toggleFileSelection = useCallback((fileId: string) => {
    setSelectedFiles(prev => 
      prev.includes(fileId)
        ? prev.filter(id => id !== fileId)
        : [...prev, fileId]
    );
  }, []);

  // Criar nova pasta
  const handleCreateFolder = useCallback(() => {
    if (newFolderName.trim()) {
      onFolderCreate(newFolderName.trim(), currentFolder || undefined);
      setNewFolderName('');
      setShowNewFolderModal(false);
    }
  }, [newFolderName, currentFolder, onFolderCreate]);

  // Renomear arquivo
  const handleRenameFile = useCallback(() => {
    if (renameFileId && newFileName.trim()) {
      onFileRename(renameFileId, newFileName.trim());
      setRenameFileId(null);
      setNewFileName('');
      setShowRenameModal(false);
    }
  }, [renameFileId, newFileName, onFileRename]);

  // Compartilhar arquivo
  const handleShareFile = useCallback((userIds: string[]) => {
    if (shareFileId) {
      onFileShare(shareFileId, userIds);
      setShareFileId(null);
      setShowShareModal(false);
    }
  }, [shareFileId, onFileShare]);

  // Formatar tamanho do arquivo
  const formatFileSize = useCallback((bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }, []);

  return (
    <div className={`flex flex-col h-full bg-white ${className}`}>
      {/* Barra de ferramentas */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center space-x-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <Upload className="w-4 h-4" />
            <span>Upload</span>
          </button>
          
          <button
            onClick={() => setShowNewFolderModal(true)}
            className="flex items-center space-x-2 px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
          >
            <Folder className="w-4 h-4" />
            <span>Nova Pasta</span>
          </button>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* Busca */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar arquivos..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          {/* Ordenação */}
          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [newSortBy, newSortOrder] = e.target.value.split('-') as [SortBy, SortOrder];
              setSortBy(newSortBy);
              setSortOrder(newSortOrder);
            }}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="name-asc">Nome A-Z</option>
            <option value="name-desc">Nome Z-A</option>
            <option value="date-desc">Mais recente</option>
            <option value="date-asc">Mais antigo</option>
            <option value="size-desc">Maior tamanho</option>
            <option value="size-asc">Menor tamanho</option>
            <option value="type-asc">Tipo A-Z</option>
          </select>
          
          {/* Modo de visualização */}
          <div className="flex items-center border border-gray-300 rounded-lg">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
      
      {/* Navegação de pastas */}
      {currentFolder && (
        <div className="flex items-center p-3 border-b border-gray-200 bg-gray-50">
          <button
            onClick={() => setCurrentFolder(null)}
            className="text-blue-600 hover:text-blue-800 text-sm"
          >
            Raiz
          </button>
          <span className="mx-2 text-gray-400">/</span>
          <span className="text-sm text-gray-700">Pasta Atual</span>
        </div>
      )}
      
      {/* Área de conteúdo */}
      <div 
        ref={dropZoneRef}
        className={`flex-1 overflow-auto p-4 ${dragOver ? 'bg-blue-50 border-2 border-dashed border-blue-300' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {dragOver && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Upload className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <p className="text-lg font-medium text-blue-600">Solte os arquivos aqui</p>
            </div>
          </div>
        )}
        
        {!dragOver && (
          <>
            {/* Pastas */}
            {filteredFolders().length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Pastas</h3>
                <div className={viewMode === 'grid' ? 'grid grid-cols-4 gap-4' : 'space-y-2'}>
                  {filteredFolders().map(folder => (
                    <div
                      key={folder.id}
                      className={`${viewMode === 'grid' 
                        ? 'p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer'
                        : 'flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer'
                      }`}
                      onClick={() => setCurrentFolder(folder.id)}
                    >
                      <FolderOpen className="w-8 h-8 text-blue-600 mb-2" />
                      <div className={viewMode === 'grid' ? 'text-center' : 'ml-3 flex-1'}>
                        <p className="font-medium text-gray-900 truncate">{folder.name}</p>
                        <p className="text-sm text-gray-500">
                          {folder.createdAt.toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Arquivos */}
            {filteredAndSortedFiles().length > 0 ? (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">Arquivos</h3>
                <VirtualizedList
                  items={filteredAndSortedFiles()}
                  itemHeight={viewMode === 'grid' ? 120 : 80}
                  containerHeight={400}
                  keyExtractor={(file) => file.id}
                  className={viewMode === 'grid' ? 'grid-virtualized' : 'list-virtualized'}
                  renderItem={(file) => {
                    const uploader = users.find(u => u.id === file.uploadedBy);
                    const isSelected = selectedFiles.includes(file.id);
                    
                    return (
                      <div
                        className={`${viewMode === 'grid'
                          ? 'p-4 border rounded-lg hover:bg-gray-50 cursor-pointer'
                          : 'flex items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer'
                        } ${
                          isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                        }`}
                        onClick={() => toggleFileSelection(file.id)}
                      >
                        <div className={viewMode === 'grid' ? 'text-center' : 'flex items-center flex-1'}>
                          <div className={viewMode === 'grid' ? 'mb-3' : 'mr-3'}>
                            {getFileIcon(file.name, 'lg')}
                          </div>
                          
                          <div className={viewMode === 'grid' ? '' : 'flex-1'}>
                            <p className="font-medium text-gray-900 truncate" title={file.name}>
                              {file.name}
                            </p>
                            <p className="text-sm text-gray-500">
                              {formatFileSize(file.size)}
                            </p>
                            <p className="text-xs text-gray-400">
                              {uploader?.name} • {file.uploadedAt.toLocaleDateString()}
                            </p>
                          </div>
                          
                          {viewMode === 'list' && (
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onFileDownload(file.id);
                                }}
                                className="p-1 text-gray-400 hover:text-gray-600"
                                title="Download"
                              >
                                <Download className="w-4 h-4" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setShareFileId(file.id);
                                  setShowShareModal(true);
                                }}
                                className="p-1 text-gray-400 hover:text-gray-600"
                                title="Compartilhar"
                              >
                                <Share2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setRenameFileId(file.id);
                                  setNewFileName(file.name);
                                  setShowRenameModal(true);
                                }}
                                className="p-1 text-gray-400 hover:text-gray-600"
                                title="Renomear"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              {currentUser?.id === file.uploadedBy && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (window.confirm('Tem certeza que deseja excluir este arquivo?')) {
                                      onFileDelete(file.id);
                                    }
                                  }}
                                  className="p-1 text-red-400 hover:text-red-600"
                                  title="Excluir"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  }}
                />
              </div>
            ) : (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-lg font-medium text-gray-500">Nenhum arquivo encontrado</p>
                  <p className="text-gray-400">Faça upload de arquivos ou ajuste sua busca</p>
                </div>
              </div>
            )}
          </>
        )}
      </div>
      
      {/* Status */}
      <div className="flex items-center justify-between p-3 border-t border-gray-200 bg-gray-50 text-sm text-gray-600">
        <div>
          {filteredAndSortedFiles().length} arquivo(s) • {filteredFolders().length} pasta(s)
        </div>
        {selectedFiles.length > 0 && (
          <div>
            {selectedFiles.length} selecionado(s)
          </div>
        )}
      </div>
      
      {/* Input de upload oculto */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => handleFileUpload(e.target.files)}
      />
      
      {/* Modais */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold mb-4">Upload de Arquivos</h3>
            <div 
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Clique para selecionar arquivos</p>
              <p className="text-sm text-gray-400">ou arraste e solte aqui</p>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowUploadModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
      
      {showNewFolderModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold mb-4">Nova Pasta</h3>
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Nome da pasta"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              onKeyPress={(e) => e.key === 'Enter' && handleCreateFolder()}
            />
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowNewFolderModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateFolder}
                disabled={!newFolderName.trim()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50"
              >
                Criar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

export default FileManager;