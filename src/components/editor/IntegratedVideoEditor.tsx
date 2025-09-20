import React, { useState, useEffect, useCallback } from 'react'
import { Button } from '../ui/button'
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs'
import { Badge } from '../ui/badge'
import { Separator } from '../ui/separator'
import { toast } from 'sonner'
import {
  Download, Save, ChevronDown,
  ChevronUp, Folder, FileText, Calendar, Users, Cloud, Share2, 
  GitBranch, Plus, MessageSquare
} from 'lucide-react'

// Import dos novos componentes
import AdvancedVideoEditor from './AdvancedVideoEditor'
import ProjectManager from '../projects/ProjectManager'
import { ProjectDashboard } from '../projects/ProjectDashboard'
import { ProjectShare } from '../projects/ProjectShare'
import { CollaborationPanel } from '../collaboration/CollaborationPanel'
import { VersioningPanel } from '../versioning/VersioningPanel'
import { BackupManager } from '../backup/BackupManager'
import { TimelineComments } from '../timeline/TimelineComments'
import { TimelineAnnotations } from '../timeline/TimelineAnnotations'

interface IntegratedVideoEditorProps {
  onSave?: (data: any) => void
  onExport?: (settings: any) => void
  className?: string
}

interface EditorLayout {
  leftPanel: 'projects' | 'assets' | 'effects' | 'collaboration' | 'versioning' | 'backup'
  rightPanel: 'properties' | 'comments' | 'annotations' | 'share' | 'dashboard'
  showLeftPanel: boolean
  showRightPanel: boolean
  leftPanelWidth: number
  rightPanelWidth: number
}

const IntegratedVideoEditor: React.FC<IntegratedVideoEditorProps> = ({
  onSave,
  onExport,
  className = ''
}) => {
  // Estados de layout
  const [layout, setLayout] = useState<EditorLayout>({
    leftPanel: 'projects',
    rightPanel: 'properties',
    showLeftPanel: true,
    showRightPanel: true,
    leftPanelWidth: 320,
    rightPanelWidth: 320
  })

  // Estados do editor
  const [currentProject, setCurrentProject] = useState<any>(null)
  const [isCollaborationActive, setIsCollaborationActive] = useState(false)
  const [collaborators] = useState<any[]>([])
  const [versioningEnabled, setVersioningEnabled] = useState(true)
  const [backupStatus] = useState<'idle' | 'syncing' | 'error'>('idle')
  const [unsavedChanges, setUnsavedChanges] = useState(false)

  // Handlers de layout
  const toggleLeftPanel = useCallback(() => {
    setLayout(prev => ({ ...prev, showLeftPanel: !prev.showLeftPanel }))
  }, [])

  const toggleRightPanel = useCallback(() => {
    setLayout(prev => ({ ...prev, showRightPanel: !prev.showRightPanel }))
  }, [])

  const setLeftPanel = useCallback((panel: EditorLayout['leftPanel']) => {
    setLayout(prev => ({ ...prev, leftPanel: panel, showLeftPanel: true }))
  }, [])

  const setRightPanel = useCallback((panel: EditorLayout['rightPanel']) => {
    setLayout(prev => ({ ...prev, rightPanel: panel, showRightPanel: true }))
  }, [])

  // Handlers de projeto
  const handleProjectSave = useCallback(async () => {
    if (!currentProject) return
    
    try {
      // Salvar projeto
      await onSave?.(currentProject)
      setUnsavedChanges(false)
      toast.success('Projeto salvo com sucesso')
    } catch (error) {
      toast.error('Erro ao salvar projeto')
    }
  }, [currentProject, onSave])

  // Handlers de colaboração
  const handleCollaborationToggle = useCallback(() => {
    setIsCollaborationActive(!isCollaborationActive)
    if (!isCollaborationActive) {
      toast.success('Colaboração ativada')
    } else {
      toast.info('Colaboração desativada')
    }
  }, [isCollaborationActive])

  // Auto-save
  useEffect(() => {
    if (!unsavedChanges || !currentProject) return

    const autoSaveTimer = setTimeout(() => {
      handleProjectSave()
    }, 30000) // Auto-save a cada 30 segundos

    return () => clearTimeout(autoSaveTimer)
  }, [unsavedChanges, currentProject, handleProjectSave])

  return (
    <div className={`h-screen flex flex-col bg-gray-900 text-white ${className}`}>
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-2">
        <div className="flex items-center justify-between">
          {/* Logo e Projeto Atual */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">S</span>
              </div>
              <span className="font-bold text-lg">Studio IA</span>
            </div>
            
            {currentProject && (
              <>
                <Separator orientation="vertical" className="h-6" />
                <div className="flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-gray-400" />
                  <span className="font-medium">{currentProject.name}</span>
                  {unsavedChanges && (
                    <Badge variant="outline" className="text-xs">
                      Não salvo
                    </Badge>
                  )}
                  {versioningEnabled && (
                    <Badge variant="secondary" className="text-xs">
                      v{currentProject.version || '1.0.0'}
                    </Badge>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Controles Principais */}
          <div className="flex items-center space-x-2">
            {/* Status de Colaboração */}
            {isCollaborationActive && (
              <div className="flex items-center space-x-2 px-3 py-1 bg-green-600 bg-opacity-20 rounded-lg">
                <Users className="w-4 h-4 text-green-400" />
                <span className="text-sm text-green-400">
                  {collaborators.length} colaborador{collaborators.length !== 1 ? 'es' : ''}
                </span>
              </div>
            )}

            {/* Status de Backup */}
            {backupStatus === 'syncing' && (
              <div className="flex items-center space-x-2 px-3 py-1 bg-blue-600 bg-opacity-20 rounded-lg">
                <Cloud className="w-4 h-4 text-blue-400 animate-pulse" />
                <span className="text-sm text-blue-400">Sincronizando...</span>
              </div>
            )}

            {/* Botões de Ação */}
            <Button variant="outline" size="sm" onClick={handleProjectSave} disabled={!currentProject}>
              <Save className="w-4 h-4 mr-2" />
              Salvar
            </Button>
            
            <Button variant="outline" size="sm" onClick={() => setRightPanel('share')} disabled={!currentProject}>
              <Share2 className="w-4 h-4 mr-2" />
              Compartilhar
            </Button>
            
            <Button variant="outline" size="sm" onClick={() => onExport?.({})} disabled={!currentProject}>
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel */}
        {layout.showLeftPanel && (
          <div 
            className="bg-gray-800 border-r border-gray-700 flex flex-col"
            style={{ width: layout.leftPanelWidth }}
          >
            {/* Panel Tabs */}
            <div className="border-b border-gray-700">
              <Tabs value={layout.leftPanel} onValueChange={(value) => setLeftPanel(value as any)}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="projects" className="text-xs">
                    <Folder className="w-4 h-4 mr-1" />
                    Projetos
                  </TabsTrigger>
                  <TabsTrigger value="collaboration" className="text-xs">
                    <Users className="w-4 h-4 mr-1" />
                    Colaboração
                  </TabsTrigger>
                  <TabsTrigger value="versioning" className="text-xs">
                    <GitBranch className="w-4 h-4 mr-1" />
                    Versões
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {/* Panel Content */}
            <div className="flex-1 overflow-hidden">
              {layout.leftPanel === 'projects' && (
                <ProjectManager />
              )}
              
              {layout.leftPanel === 'collaboration' && (
                <CollaborationPanel 
                  projectId={currentProject?.id}
                  isVisible={layout.leftPanel === 'collaboration'}
                  onToggle={handleCollaborationToggle}
                />
              )}
              
              {layout.leftPanel === 'versioning' && (
                <VersioningPanel 
                  projectId={currentProject?.id}
                  isVisible={layout.leftPanel === 'versioning'}
                  onToggle={() => setVersioningEnabled(!versioningEnabled)}
                />
              )}
              
              {layout.leftPanel === 'backup' && (
                <BackupManager 
                  projectId={currentProject?.id}
                />
              )}
            </div>
          </div>
        )}

        {/* Center - Editor */}
        <div className="flex-1 flex flex-col">
          {currentProject ? (
            <AdvancedVideoEditor
              projectId={currentProject.id}
              initialData={currentProject}
              onSave={(data) => {
                setCurrentProject(data)
                setUnsavedChanges(true)
              }}
              onExport={onExport || (() => {})}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center bg-gray-900">
              <div className="text-center">
                <Folder className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-400 mb-2">
                  Nenhum projeto selecionado
                </h3>
                <p className="text-gray-500 mb-6">
                  Selecione um projeto existente ou crie um novo para começar
                </p>
                <Button onClick={() => setLeftPanel('projects')}>
                  <Plus className="w-4 h-4 mr-2" />
                  Abrir Projetos
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Right Panel */}
        {layout.showRightPanel && currentProject && (
          <div 
            className="bg-gray-800 border-l border-gray-700 flex flex-col"
            style={{ width: layout.rightPanelWidth }}
          >
            {/* Panel Tabs */}
            <div className="border-b border-gray-700">
              <Tabs value={layout.rightPanel} onValueChange={(value) => setRightPanel(value as any)}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="dashboard" className="text-xs">
                    <Calendar className="w-4 h-4 mr-1" />
                    Dashboard
                  </TabsTrigger>
                  <TabsTrigger value="comments" className="text-xs">
                    <MessageSquare className="w-4 h-4 mr-1" />
                    Comentários
                  </TabsTrigger>
                  <TabsTrigger value="share" className="text-xs">
                    <Share2 className="w-4 h-4 mr-1" />
                    Compartilhar
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {/* Panel Content */}
            <div className="flex-1 overflow-hidden">
              {layout.rightPanel === 'dashboard' && (
                <ProjectDashboard />
              )}
              
              {layout.rightPanel === 'comments' && (
                <div className="h-full flex flex-col">
                  <div className="flex-1 overflow-hidden">
                    <TimelineComments 
                      projectId={currentProject.id}
                      timelinePosition={0}
                      duration={100}
                      isVisible={layout.rightPanel === 'comments'}
                      onToggleVisibility={() => setLayout(prev => ({ ...prev, rightPanel: 'properties' }))}
                    />
                  </div>
                  <Separator />
                  <div className="flex-1 overflow-hidden">
                    <TimelineAnnotations 
                      projectId={currentProject.id}
                      timelinePosition={0}
                      duration={100}
                      zoom={1}
                      isVisible={layout.rightPanel === 'comments'}
                      onToggleVisibility={() => setLayout(prev => ({ ...prev, rightPanel: 'properties' }))}
                      onSeekTo={(time) => {
                        // Implementar navegação para tempo específico
                        console.log('Seek to:', time)
                      }}
                    />
                  </div>
                </div>
              )}
              
              {layout.rightPanel === 'share' && (
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-white mb-4">Compartilhar Projeto</h3>
                  <p className="text-gray-400">Funcionalidade de compartilhamento em desenvolvimento...</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default IntegratedVideoEditor