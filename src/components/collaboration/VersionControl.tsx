import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GitBranch, History, GitMerge, RotateCcw, Eye, Plus, Trash2, Tag, Calendar, User, Clock, ChevronDown, ChevronRight, GitCompare, Download, Upload } from 'lucide-react';
import { useCollaboration } from '../../hooks/useCollaboration';
import { realtimeService } from '../../services/realtimeService';

interface Version {
  id: string;
  name: string;
  description: string;
  authorId: string;
  authorName: string;
  timestamp: Date;
  branchId: string;
  parentVersionId?: string;
  changes: VersionChange[];
  snapshot: ProjectSnapshot;
  tags: string[];
  milestone?: string;
  size: number;
  checksum: string;
}

interface VersionChange {
  id: string;
  type: 'add' | 'modify' | 'delete' | 'move';
  elementId: string;
  elementType: 'clip' | 'transition' | 'effect' | 'audio' | 'text';
  path: string;
  oldValue?: any;
  newValue?: any;
  timestamp: Date;
}

interface Branch {
  id: string;
  name: string;
  description: string;
  createdBy: string;
  createdAt: Date;
  parentBranchId?: string;
  currentVersionId: string;
  isActive: boolean;
  isProtected: boolean;
  mergeRequests: MergeRequest[];
}

interface MergeRequest {
  id: string;
  title: string;
  description: string;
  sourceBranchId: string;
  targetBranchId: string;
  authorId: string;
  authorName: string;
  status: 'pending' | 'approved' | 'rejected' | 'merged';
  createdAt: Date;
  reviewers: string[];
  conflicts: MergeConflict[];
  changes: VersionChange[];
}

interface MergeConflict {
  id: string;
  elementId: string;
  path: string;
  sourceValue: any;
  targetValue: any;
  resolution?: 'source' | 'target' | 'manual';
  resolvedValue?: any;
}

interface ProjectSnapshot {
  timeline: any;
  clips: any[];
  effects: any[];
  transitions: any[];
  audio: any[];
  settings: any;
  metadata: {
    version: string;
    timestamp: Date;
    size: number;
  };
}

interface VersionControlProps {
  projectData: any;
  onVersionChanged?: (version: Version) => void;
  onBranchChanged?: (branch: Branch) => void;
  onMergeCompleted?: (mergeRequest: MergeRequest) => void;
}

export const VersionControl: React.FC<VersionControlProps> = ({
  projectData,
  onVersionChanged,
  onBranchChanged,
  onMergeCompleted
}) => {
  const { isConnected, currentUser, collaborators } = useCollaboration();
  const [versions, setVersions] = useState<Version[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [currentBranch, setCurrentBranch] = useState<Branch | null>(null);
  const [currentVersion, setCurrentVersion] = useState<Version | null>(null);
  const [mergeRequests, setMergeRequests] = useState<MergeRequest[]>([]);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [showBranchManager, setShowBranchManager] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [compareVersions, setCompareVersions] = useState<{ from: Version | null; to: Version | null }>({ from: null, to: null });
  const [selectedVersion, setSelectedVersion] = useState<Version | null>(null);
  const [newBranchName, setNewBranchName] = useState('');
  const [newVersionName, setNewVersionName] = useState('');
  const [newVersionDescription, setNewVersionDescription] = useState('');
  const [showCreateBranch, setShowCreateBranch] = useState(false);
  const [showCreateVersion, setShowCreateVersion] = useState(false);
  const [expandedBranches, setExpandedBranches] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<'all' | 'mine' | 'recent' | 'tagged'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [lastAutoSave, setLastAutoSave] = useState<Date | null>(null);
  
  const autoSaveIntervalRef = useRef<NodeJS.Timeout>();
  const snapshotRef = useRef<ProjectSnapshot | null>(null);

  // Inicializar controle de versões
  useEffect(() => {
    if (!isConnected || !currentUser) return;

    // Configurar listeners para sincronização
    realtimeService.on('version:created', handleVersionCreated);
    realtimeService.on('version:updated', handleVersionUpdated);
    realtimeService.on('branch:created', handleBranchCreated);
    realtimeService.on('branch:updated', handleBranchUpdated);
    realtimeService.on('merge:requested', handleMergeRequested);
    realtimeService.on('merge:completed', handleMergeCompleted);

    // Carregar dados existentes
    loadVersionHistory();
    loadBranches();
    loadMergeRequests();

    // Configurar auto-save
    if (autoSaveEnabled) {
      startAutoSave();
    }

    return () => {
      realtimeService.off('version:created', handleVersionCreated);
      realtimeService.off('version:updated', handleVersionUpdated);
      realtimeService.off('branch:created', handleBranchCreated);
      realtimeService.off('branch:updated', handleBranchUpdated);
      realtimeService.off('merge:requested', handleMergeRequested);
      realtimeService.off('merge:completed', handleMergeCompleted);
      
      if (autoSaveIntervalRef.current) {
        clearInterval(autoSaveIntervalRef.current);
      }
    };
  }, [isConnected, currentUser, autoSaveEnabled]);

  // Monitorar mudanças no projeto para auto-save
  useEffect(() => {
    if (projectData && autoSaveEnabled) {
      const currentSnapshot = createSnapshot(projectData);
      
      if (snapshotRef.current && hasSignificantChanges(snapshotRef.current, currentSnapshot)) {
        // Agendar auto-save
        if (autoSaveIntervalRef.current) {
          clearTimeout(autoSaveIntervalRef.current);
        }
        
        autoSaveIntervalRef.current = setTimeout(() => {
          createAutoSaveVersion(currentSnapshot);
        }, 30000); // Auto-save após 30 segundos de inatividade
      }
      
      snapshotRef.current = currentSnapshot;
    }
  }, [projectData, autoSaveEnabled]);

  // Carregar histórico de versões
  const loadVersionHistory = async () => {
    try {
      // Simular carregamento (implementar com API real)
      const mockVersions: Version[] = [
        {
          id: 'v1',
          name: 'Versão Inicial',
          description: 'Primeira versão do projeto',
          authorId: 'user-1',
          authorName: 'João Silva',
          timestamp: new Date(Date.now() - 86400000 * 7),
          branchId: 'main',
          changes: [],
          snapshot: createSnapshot({}),
          tags: ['inicial'],
          size: 1024,
          checksum: 'abc123'
        },
        {
          id: 'v2',
          name: 'Adicionados efeitos',
          description: 'Implementação de efeitos visuais',
          authorId: 'user-2',
          authorName: 'Maria Santos',
          timestamp: new Date(Date.now() - 86400000 * 3),
          branchId: 'main',
          parentVersionId: 'v1',
          changes: [
            {
              id: 'c1',
              type: 'add',
              elementId: 'effect-1',
              elementType: 'effect',
              path: '/effects/blur',
              newValue: { type: 'blur', intensity: 0.5 },
              timestamp: new Date(Date.now() - 86400000 * 3)
            }
          ],
          snapshot: createSnapshot({}),
          tags: ['efeitos'],
          size: 2048,
          checksum: 'def456'
        }
      ];
      
      setVersions(mockVersions);
      setCurrentVersion(mockVersions[mockVersions.length - 1]);
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
    }
  };

  // Carregar branches
  const loadBranches = async () => {
    try {
      const mockBranches: Branch[] = [
        {
          id: 'main',
          name: 'main',
          description: 'Branch principal',
          createdBy: 'system',
          createdAt: new Date(Date.now() - 86400000 * 30),
          currentVersionId: 'v2',
          isActive: true,
          isProtected: true,
          mergeRequests: []
        },
        {
          id: 'feature-audio',
          name: 'feature/audio-improvements',
          description: 'Melhorias no sistema de áudio',
          createdBy: 'user-1',
          createdAt: new Date(Date.now() - 86400000 * 5),
          parentBranchId: 'main',
          currentVersionId: 'v3',
          isActive: false,
          isProtected: false,
          mergeRequests: []
        }
      ];
      
      setBranches(mockBranches);
      setCurrentBranch(mockBranches.find(b => b.isActive) || mockBranches[0]);
    } catch (error) {
      console.error('Erro ao carregar branches:', error);
    }
  };

  // Carregar merge requests
  const loadMergeRequests = async () => {
    try {
      const mockMergeRequests: MergeRequest[] = [
        {
          id: 'mr1',
          title: 'Implementar melhorias de áudio',
          description: 'Adiciona novos filtros e equalização',
          sourceBranchId: 'feature-audio',
          targetBranchId: 'main',
          authorId: 'user-1',
          authorName: 'João Silva',
          status: 'pending',
          createdAt: new Date(Date.now() - 86400000),
          reviewers: ['user-2'],
          conflicts: [],
          changes: []
        }
      ];
      
      setMergeRequests(mockMergeRequests);
    } catch (error) {
      console.error('Erro ao carregar merge requests:', error);
    }
  };

  // Criar snapshot do projeto
  const createSnapshot = (data: any): ProjectSnapshot => {
    const snapshot = {
      timeline: data.timeline || {},
      clips: data.clips || [],
      effects: data.effects || [],
      transitions: data.transitions || [],
      audio: data.audio || [],
      settings: data.settings || {},
      metadata: {
        version: '1.0.0',
        timestamp: new Date(),
        size: JSON.stringify(data).length
      }
    };
    
    return snapshot;
  };

  // Verificar se há mudanças significativas
  const hasSignificantChanges = (oldSnapshot: ProjectSnapshot, newSnapshot: ProjectSnapshot): boolean => {
    const oldHash = JSON.stringify(oldSnapshot);
    const newHash = JSON.stringify(newSnapshot);
    return oldHash !== newHash;
  };

  // Iniciar auto-save
  const startAutoSave = () => {
    if (autoSaveIntervalRef.current) {
      clearInterval(autoSaveIntervalRef.current);
    }
    
    autoSaveIntervalRef.current = setInterval(() => {
      if (snapshotRef.current) {
        createAutoSaveVersion(snapshotRef.current);
      }
    }, 300000); // Auto-save a cada 5 minutos
  };

  // Criar versão de auto-save
  const createAutoSaveVersion = async (snapshot: ProjectSnapshot) => {
    if (!currentUser || !currentBranch) return;
    
    const version: Version = {
      id: `autosave-${Date.now()}`,
      name: `Auto-save ${new Date().toLocaleTimeString()}`,
      description: 'Salvamento automático',
      authorId: currentUser.id,
      authorName: currentUser.username,
      timestamp: new Date(),
      branchId: currentBranch.id,
      parentVersionId: currentVersion?.id,
      changes: [], // Calcular mudanças
      snapshot,
      tags: ['auto-save'],
      size: snapshot.metadata.size,
      checksum: generateChecksum(snapshot)
    };
    
    // Enviar para servidor
    realtimeService.send('version:create', version);
    
    setLastAutoSave(new Date());
  };

  // Gerar checksum
  const generateChecksum = (data: any): string => {
    return btoa(JSON.stringify(data)).substring(0, 8);
  };

  // Handlers de eventos
  const handleVersionCreated = (version: Version) => {
    setVersions(prev => [...prev, version]);
  };

  const handleVersionUpdated = (version: Version) => {
    setVersions(prev => prev.map(v => v.id === version.id ? version : v));
  };

  const handleBranchCreated = (branch: Branch) => {
    setBranches(prev => [...prev, branch]);
  };

  const handleBranchUpdated = (branch: Branch) => {
    setBranches(prev => prev.map(b => b.id === branch.id ? branch : b));
  };

  const handleMergeRequested = (mergeRequest: MergeRequest) => {
    setMergeRequests(prev => [...prev, mergeRequest]);
  };

  const handleMergeCompleted = (mergeRequest: MergeRequest) => {
    setMergeRequests(prev => prev.map(mr => 
      mr.id === mergeRequest.id ? mergeRequest : mr
    ));
    onMergeCompleted?.(mergeRequest);
  };

  // Criar nova versão
  const createVersion = async () => {
    if (!currentUser || !currentBranch || !newVersionName.trim()) return;
    
    const snapshot = createSnapshot(projectData);
    const changes = calculateChanges(currentVersion?.snapshot, snapshot);
    
    const version: Version = {
      id: `v-${Date.now()}`,
      name: newVersionName.trim(),
      description: newVersionDescription.trim(),
      authorId: currentUser.id,
      authorName: currentUser.username,
      timestamp: new Date(),
      branchId: currentBranch.id,
      parentVersionId: currentVersion?.id,
      changes,
      snapshot,
      tags: [],
      size: snapshot.metadata.size,
      checksum: generateChecksum(snapshot)
    };
    
    realtimeService.send('version:create', version);
    
    setVersions(prev => [...prev, version]);
    setCurrentVersion(version);
    setNewVersionName('');
    setNewVersionDescription('');
    setShowCreateVersion(false);
    
    onVersionChanged?.(version);
  };

  // Calcular mudanças entre versões
  const calculateChanges = (oldSnapshot?: ProjectSnapshot, newSnapshot?: ProjectSnapshot): VersionChange[] => {
    if (!oldSnapshot || !newSnapshot) return [];
    
    const changes: VersionChange[] = [];
    
    // Comparar clips
    const oldClips = oldSnapshot.clips || [];
    const newClips = newSnapshot.clips || [];
    
    // Detectar clips adicionados
    newClips.forEach(clip => {
      if (!oldClips.find(c => c.id === clip.id)) {
        changes.push({
          id: `change-${Date.now()}-${Math.random()}`,
          type: 'add',
          elementId: clip.id,
          elementType: 'clip',
          path: `/clips/${clip.id}`,
          newValue: clip,
          timestamp: new Date()
        });
      }
    });
    
    // Detectar clips removidos
    oldClips.forEach(clip => {
      if (!newClips.find(c => c.id === clip.id)) {
        changes.push({
          id: `change-${Date.now()}-${Math.random()}`,
          type: 'delete',
          elementId: clip.id,
          elementType: 'clip',
          path: `/clips/${clip.id}`,
          oldValue: clip,
          timestamp: new Date()
        });
      }
    });
    
    // Detectar clips modificados
    newClips.forEach(newClip => {
      const oldClip = oldClips.find(c => c.id === newClip.id);
      if (oldClip && JSON.stringify(oldClip) !== JSON.stringify(newClip)) {
        changes.push({
          id: `change-${Date.now()}-${Math.random()}`,
          type: 'modify',
          elementId: newClip.id,
          elementType: 'clip',
          path: `/clips/${newClip.id}`,
          oldValue: oldClip,
          newValue: newClip,
          timestamp: new Date()
        });
      }
    });
    
    return changes;
  };

  // Criar nova branch
  const createBranch = async () => {
    if (!currentUser || !newBranchName.trim()) return;
    
    const branch: Branch = {
      id: `branch-${Date.now()}`,
      name: newBranchName.trim(),
      description: `Branch criada por ${currentUser.username}`,
      createdBy: currentUser.id,
      createdAt: new Date(),
      parentBranchId: currentBranch?.id,
      currentVersionId: currentVersion?.id || '',
      isActive: false,
      isProtected: false,
      mergeRequests: []
    };
    
    realtimeService.send('branch:create', branch);
    
    setBranches(prev => [...prev, branch]);
    setNewBranchName('');
    setShowCreateBranch(false);
  };

  // Trocar de branch
  const switchBranch = async (branch: Branch) => {
    if (!currentUser) return;
    
    // Atualizar branch ativa
    setBranches(prev => prev.map(b => ({
      ...b,
      isActive: b.id === branch.id
    })));
    
    setCurrentBranch(branch);
    
    // Carregar versão atual da branch
    const branchVersion = versions.find(v => v.id === branch.currentVersionId);
    if (branchVersion) {
      setCurrentVersion(branchVersion);
      onVersionChanged?.(branchVersion);
    }
    
    onBranchChanged?.(branch);
  };

  // Fazer rollback para versão anterior
  const rollbackToVersion = async (version: Version) => {
    if (!currentUser || !currentBranch) return;
    
    // Criar nova versão baseada na versão selecionada
    const rollbackVersion: Version = {
      id: `rollback-${Date.now()}`,
      name: `Rollback para ${version.name}`,
      description: `Rollback para versão ${version.name} (${version.id})`,
      authorId: currentUser.id,
      authorName: currentUser.username,
      timestamp: new Date(),
      branchId: currentBranch.id,
      parentVersionId: currentVersion?.id,
      changes: [],
      snapshot: version.snapshot,
      tags: ['rollback'],
      size: version.size,
      checksum: version.checksum
    };
    
    realtimeService.send('version:create', rollbackVersion);
    
    setVersions(prev => [...prev, rollbackVersion]);
    setCurrentVersion(rollbackVersion);
    
    onVersionChanged?.(rollbackVersion);
  };

  // Comparar versões
  const handleCompareVersions = (from: Version, to: Version) => {
    setCompareVersions({ from, to });
    setShowComparison(true);
  };

  // Filtrar versões
  const getFilteredVersions = () => {
    let filtered = versions;
    
    // Filtrar por branch atual
    if (currentBranch) {
      filtered = filtered.filter(v => v.branchId === currentBranch.id);
    }
    
    // Aplicar filtros
    switch (filter) {
      case 'mine':
        filtered = filtered.filter(v => v.authorId === currentUser?.id);
        break;
      case 'recent':
        filtered = filtered.filter(v => 
          (Date.now() - v.timestamp.getTime()) < 86400000 * 7
        );
        break;
      case 'tagged':
        filtered = filtered.filter(v => v.tags.length > 0);
        break;
    }
    
    // Aplicar busca
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(v => 
        v.name.toLowerCase().includes(query) ||
        v.description.toLowerCase().includes(query) ||
        v.authorName.toLowerCase().includes(query)
      );
    }
    
    return filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  };

  // Renderizar árvore de branches
  const renderBranchTree = () => {
    const rootBranches = branches.filter(b => !b.parentBranchId);
    
    const renderBranch = (branch: Branch, level: number = 0) => {
      const isExpanded = expandedBranches.has(branch.id);
      const childBranches = branches.filter(b => b.parentBranchId === branch.id);
      const hasChildren = childBranches.length > 0;
      
      return (
        <div key={branch.id}>
          <div 
            className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors ${
              branch.isActive ? 'bg-blue-100 border border-blue-300' : 'hover:bg-gray-50'
            }`}
            style={{ marginLeft: level * 20 }}
            onClick={() => switchBranch(branch)}
          >
            {hasChildren && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setExpandedBranches(prev => {
                    const newSet = new Set(prev);
                    if (isExpanded) {
                      newSet.delete(branch.id);
                    } else {
                      newSet.add(branch.id);
                    }
                    return newSet;
                  });
                }}
                className="p-1 hover:bg-gray-200 rounded"
              >
                {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </button>
            )}
            
            <GitBranch size={16} className={branch.isActive ? 'text-blue-600' : 'text-gray-500'} />
            
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className={`font-medium ${branch.isActive ? 'text-blue-800' : 'text-gray-800'}`}>
                  {branch.name}
                </span>
                
                {branch.isProtected && (
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">
                    Protegida
                  </span>
                )}
                
                {branch.isActive && (
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                    Ativa
                  </span>
                )}
              </div>
              
              <div className="text-xs text-gray-500">
                {branch.description}
              </div>
            </div>
            
            <div className="text-xs text-gray-400">
              {branch.createdAt.toLocaleDateString()}
            </div>
          </div>
          
          {isExpanded && childBranches.map(child => renderBranch(child, level + 1))}
        </div>
      );
    };
    
    return rootBranches.map(branch => renderBranch(branch));
  };

  // Renderizar histórico de versões
  const renderVersionHistory = () => {
    const filteredVersions = getFilteredVersions();
    
    return (
      <div className="space-y-3">
        {filteredVersions.map((version, index) => {
          const isSelected = selectedVersion?.id === version.id;
          const isCurrent = currentVersion?.id === version.id;
          
          return (
            <div 
              key={version.id}
              className={`border rounded-lg p-4 cursor-pointer transition-all ${
                isSelected ? 'border-blue-500 bg-blue-50' : 
                isCurrent ? 'border-green-500 bg-green-50' : 
                'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setSelectedVersion(isSelected ? null : version)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-medium text-gray-900">{version.name}</h4>
                    
                    {isCurrent && (
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                        Atual
                      </span>
                    )}
                    
                    {version.tags.map(tag => (
                      <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                        <Tag size={10} className="inline mr-1" />
                        {tag}
                      </span>
                    ))}
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-2">{version.description}</p>
                  
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <User size={12} />
                      <span>{version.authorName}</span>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <Clock size={12} />
                      <span>{version.timestamp.toLocaleString()}</span>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <span>{version.changes.length} mudança(s)</span>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <span>{(version.size / 1024).toFixed(1)} KB</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {!isCurrent && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        rollbackToVersion(version);
                      }}
                      className="p-2 text-gray-500 hover:text-blue-500 transition-colors"
                      title="Fazer rollback"
                    >
                      <RotateCcw size={16} />
                    </button>
                  )}
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (compareVersions.from) {
                        handleCompareVersions(compareVersions.from, version);
                      } else {
                        setCompareVersions({ from: version, to: null });
                      }
                    }}
                    className="p-2 text-gray-500 hover:text-purple-500 transition-colors"
                    title="Comparar versão"
                  >
                    <GitCompare size={16} />
                  </button>
                </div>
              </div>
              
              {/* Detalhes expandidos */}
              {isSelected && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h5 className="font-medium text-sm mb-2">Mudanças ({version.changes.length})</h5>
                      <div className="space-y-1 max-h-32 overflow-y-auto">
                        {version.changes.map(change => (
                          <div key={change.id} className="text-xs p-2 bg-gray-50 rounded">
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-1 rounded text-xs ${
                                change.type === 'add' ? 'bg-green-100 text-green-800' :
                                change.type === 'modify' ? 'bg-blue-100 text-blue-800' :
                                change.type === 'delete' ? 'bg-red-100 text-red-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {change.type}
                              </span>
                              <span className="font-medium">{change.elementType}</span>
                            </div>
                            <div className="text-gray-600 mt-1">{change.path}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h5 className="font-medium text-sm mb-2">Informações</h5>
                      <div className="space-y-2 text-xs">
                        <div>
                          <span className="text-gray-500">ID:</span>
                          <span className="ml-2 font-mono">{version.id}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Checksum:</span>
                          <span className="ml-2 font-mono">{version.checksum}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Branch:</span>
                          <span className="ml-2">{branches.find(b => b.id === version.branchId)?.name}</span>
                        </div>
                        {version.parentVersionId && (
                          <div>
                            <span className="text-gray-500">Versão pai:</span>
                            <span className="ml-2">{version.parentVersionId}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  if (!isConnected) {
    return null;
  }

  return (
    <>
      {/* Barra de status */}
      <div className="fixed top-16 right-4 bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-40">
        <div className="flex items-center gap-3 text-sm">
          <div className="flex items-center gap-2">
            <GitBranch size={16} className="text-blue-500" />
            <span className="font-medium">{currentBranch?.name || 'Nenhuma branch'}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <History size={16} className="text-green-500" />
            <span>{currentVersion?.name || 'Nenhuma versão'}</span>
          </div>
          
          {autoSaveEnabled && lastAutoSave && (
            <div className="text-xs text-gray-500">
              Auto-save: {lastAutoSave.toLocaleTimeString()}
            </div>
          )}
        </div>
      </div>

      {/* Botões de ação */}
      <div className="fixed bottom-6 left-6 flex flex-col gap-2 z-40">
        <button
          onClick={() => setShowVersionHistory(true)}
          className="w-12 h-12 bg-blue-500 text-white rounded-full shadow-lg hover:bg-blue-600 transition-colors flex items-center justify-center"
          title="Histórico de versões"
        >
          <History size={20} />
        </button>
        
        <button
          onClick={() => setShowBranchManager(true)}
          className="w-12 h-12 bg-purple-500 text-white rounded-full shadow-lg hover:bg-purple-600 transition-colors flex items-center justify-center"
          title="Gerenciar branches"
        >
          <GitBranch size={20} />
        </button>
        
        <button
          onClick={() => setShowCreateVersion(true)}
          className="w-12 h-12 bg-green-500 text-white rounded-full shadow-lg hover:bg-green-600 transition-colors flex items-center justify-center"
          title="Criar versão"
        >
          <Plus size={20} />
        </button>
      </div>

      {/* Modal de histórico de versões */}
      {showVersionHistory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-[80vh] flex flex-col">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold">Histórico de Versões</h3>
                <button
                  onClick={() => setShowVersionHistory(false)}
                  className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              
              {/* Filtros e busca */}
              <div className="flex items-center gap-4">
                <div className="flex gap-1">
                  {[
                    { key: 'all', label: 'Todas' },
                    { key: 'mine', label: 'Minhas' },
                    { key: 'recent', label: 'Recentes' },
                    { key: 'tagged', label: 'Com tags' }
                  ].map(filterOption => (
                    <button
                      key={filterOption.key}
                      onClick={() => setFilter(filterOption.key as any)}
                      className={`px-3 py-1 text-sm rounded transition-colors ${
                        filter === filterOption.key
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {filterOption.label}
                    </button>
                  ))}
                </div>
                
                <input
                  type="text"
                  placeholder="Buscar versões..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              {renderVersionHistory()}
            </div>
          </div>
        </div>
      )}

      {/* Modal de gerenciamento de branches */}
      {showBranchManager && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl h-[70vh] flex flex-col">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold">Gerenciar Branches</h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowCreateBranch(true)}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors flex items-center gap-2"
                  >
                    <Plus size={16} />
                    Nova Branch
                  </button>
                  <button
                    onClick={() => setShowBranchManager(false)}
                    className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              {renderBranchTree()}
            </div>
          </div>
        </div>
      )}

      {/* Modal de criar versão */}
      {showCreateVersion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Criar Nova Versão</h3>
                <button
                  onClick={() => setShowCreateVersion(false)}
                  className="p-1 text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome da versão
                  </label>
                  <input
                    type="text"
                    value={newVersionName}
                    onChange={(e) => setNewVersionName(e.target.value)}
                    placeholder="Ex: v1.2.0, Correções de bugs"
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descrição
                  </label>
                  <textarea
                    value={newVersionDescription}
                    onChange={(e) => setNewVersionDescription(e.target.value)}
                    placeholder="Descreva as mudanças desta versão..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                </div>
                
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowCreateVersion(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={createVersion}
                    disabled={!newVersionName.trim()}
                    className="flex-1 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Criar Versão
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de criar branch */}
      {showCreateBranch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Criar Nova Branch</h3>
                <button
                  onClick={() => setShowCreateBranch(false)}
                  className="p-1 text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome da branch
                  </label>
                  <input
                    type="text"
                    value={newBranchName}
                    onChange={(e) => setNewBranchName(e.target.value)}
                    placeholder="Ex: feature/nova-funcionalidade"
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div className="text-sm text-gray-600">
                  <p>A branch será criada a partir de: <strong>{currentBranch?.name}</strong></p>
                  <p>Versão atual: <strong>{currentVersion?.name}</strong></p>
                </div>
                
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowCreateBranch(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={createBranch}
                    disabled={!newBranchName.trim()}
                    className="flex-1 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Criar Branch
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de comparação de versões */}
      {showComparison && compareVersions.from && compareVersions.to && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl h-[80vh] flex flex-col">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold">Comparação de Versões</h3>
                <button
                  onClick={() => setShowComparison(false)}
                  className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="flex items-center gap-4 mt-4">
                <div className="flex-1">
                  <div className="text-sm text-gray-500">De:</div>
                  <div className="font-medium">{compareVersions.from.name}</div>
                  <div className="text-xs text-gray-400">{compareVersions.from.timestamp.toLocaleString()}</div>
                </div>
                
                <GitCompare size={20} className="text-gray-400" />
                
                <div className="flex-1">
                  <div className="text-sm text-gray-500">Para:</div>
                  <div className="font-medium">{compareVersions.to.name}</div>
                  <div className="text-xs text-gray-400">{compareVersions.to.timestamp.toLocaleString()}</div>
                </div>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              <div className="text-center text-gray-500">
                <Compare size={48} className="mx-auto mb-4 opacity-50" />
                <p>Comparação visual de versões será implementada aqui</p>
                <p className="text-sm mt-2">Mostrará diferenças na timeline, clips, efeitos e configurações</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default VersionControl;