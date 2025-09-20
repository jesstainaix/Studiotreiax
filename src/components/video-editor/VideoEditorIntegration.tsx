import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Badge } from '../ui/badge';
import {
  Play,
  Pause,
  Download,
  Settings,
  Layers,
  Monitor,
  Sparkles,
  Film,
  Volume2,
  Eye,
  Maximize2,
  Grid3X3,
  MoreHorizontal,
  Save,
  FolderOpen,
  Undo,
  Redo,
  Copy,
  Cut,
  Paste,
  Trash2,
  Plus,
  Minus,
  Zap,
  Target,
  Palette,
  Music,
  Image,
  Type,
  Video,
  Square,
  SkipBack,
  SkipForward,
  Minimize2,
  Clock,
  History,
  RotateCcw,
  RotateCw,
  FileText,
  Smartphone,
  Tablet,
  Users
} from 'lucide-react';

// Import dos sistemas avançados
import AdvancedVideoPreview from './Preview/AdvancedVideoPreview';
import ProfessionalTimeline from './Timeline/ProfessionalTimeline';
import AdvancedEffectsSystem from './Effects/AdvancedEffectsSystem';
import ProfessionalRenderSystem from './Render/ProfessionalRenderSystem';
import { AutoEditingSystem } from './AI/AutoEditingSystem';
import CollaborationSystem from './Collaboration/CollaborationSystem';
import StatusDashboard from './StatusDashboard/StatusDashboard';

// Import do TimelineEngine e History
import { TimelineEngine } from '../../modules/video-editor/core/TimelineEngine';
import { useHistory } from '../../hooks/useHistory';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';

// Import services
import { errorHandlingService } from '../../services/errorHandlingService';
import { statusDashboardService } from '../../services/statusDashboardService';

// Types
interface VideoEditorIntegrationState {
  currentTime: number;
  isPlaying: boolean;
  zoom: number;
  selectedItems: string[];
  activePanel: 'preview' | 'timeline' | 'effects' | 'render' | 'ai' | 'collaboration' | 'status';
  layout: 'default' | 'preview-focus' | 'timeline-focus' | 'effects-focus';
  projectSettings: {
    width: number;
    height: number;
    framerate: number;
    sampleRate: number;
    duration: number;
  };
}

interface VideoEditorIntegrationProps {
  onSave?: () => void;
  onExport?: () => void;
  onImport?: () => void;
  projectId?: string;
  currentUser?: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    permission: 'owner' | 'editor' | 'viewer';
  };
}

const VideoEditorIntegration: React.FC<VideoEditorIntegrationProps> = ({
  onSave,
  onExport,
  onImport,
  projectId = 'default-project',
  currentUser = {
    id: 'user-1',
    name: 'Usuário Atual',
    email: 'user@example.com',
    avatar: '',
    permission: 'owner'
  }
}) => {
  // Engine instance
  const engineRef = useRef<TimelineEngine>(new TimelineEngine());
  const engine = engineRef.current;

  // Estados principais
  const [editorState, setEditorState] = useState<VideoEditorIntegrationState>({
    currentTime: 0,
    isPlaying: false,
    zoom: 1,
    selectedItems: [],
    activePanel: 'preview',
    layout: 'default',
    projectSettings: {
      width: 1920,
      height: 1080,
      framerate: 30,
      sampleRate: 48000,
      duration: 0
    }
  });

  // History management
  const {
    state: projectState,
    executeAction,
    undo: undoHistory,
    redo: redoHistory,
    clearHistory,
    canUndo,
    canRedo,
    handleKeyDown: handleHistoryKeyDown
  } = useHistory(editorState, {
    maxHistorySize: 50,
    debounceMs: 300
  });

  const [previewMarkers, setPreviewMarkers] = useState<any[]>([]);
  const [effectStacks, setEffectStacks] = useState<any[]>([]);
  const [renderJobs, setRenderJobs] = useState<any[]>([]);
  const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(null);
  const [audioData, setAudioData] = useState<AudioBuffer | null>(null);

  // Layout configurations
  const layouts = {
    default: {
      preview: { width: '50%', height: '60%' },
      timeline: { width: '100%', height: '40%' },
      effects: { width: '25%', height: '100%' },
      render: { width: '25%', height: '100%' }
    },
    'preview-focus': {
      preview: { width: '75%', height: '70%' },
      timeline: { width: '100%', height: '30%' },
      effects: { width: '25%', height: '100%' },
      render: { width: '25%', height: '100%' }
    },
    'timeline-focus': {
      preview: { width: '40%', height: '50%' },
      timeline: { width: '100%', height: '50%' },
      effects: { width: '30%', height: '100%' },
      render: { width: '30%', height: '100%' }
    },
    'effects-focus': {
      preview: { width: '40%', height: '60%' },
      timeline: { width: '60%', height: '40%' },
      effects: { width: '40%', height: '100%' },
      render: { width: '20%', height: '100%' }
    }
  };

  // Enhanced keyboard shortcuts with useKeyboardShortcuts hook
  const shortcuts = [
    // File operations
    {
      key: 's',
      ctrlKey: true,
      action: () => handleSave(),
      description: 'Save Project'
    },
    {
      key: 'o',
      ctrlKey: true,
      action: () => handleImport(),
      description: 'Import Media'
    },
    {
      key: 'e',
      ctrlKey: true,
      action: () => handleExport(),
      description: 'Export Project'
    },
    // History operations
    {
      key: 'z',
      ctrlKey: true,
      action: () => handleUndo(),
      description: 'Undo'
    },
    {
      key: 'z',
      ctrlKey: true,
      shiftKey: true,
      action: () => handleRedo(),
      description: 'Redo'
    },
    {
      key: 'y',
      ctrlKey: true,
      action: () => handleRedo(),
      description: 'Redo (Alternative)'
    },
    // Playback controls
    {
      key: ' ',
      action: () => handleTogglePlayback(),
      description: 'Play/Pause'
    },
    {
      key: 'k',
      action: () => handleTogglePlayback(),
      description: 'Play/Pause (Alternative)'
    },
    // Panel navigation
    {
      key: '1',
      altKey: true,
      action: () => setEditorState(prev => ({ ...prev, activePanel: 'preview' })),
      description: 'Focus Preview Panel'
    },
    {
      key: '2',
      altKey: true,
      action: () => setEditorState(prev => ({ ...prev, activePanel: 'timeline' })),
      description: 'Focus Timeline Panel'
    },
    {
      key: '3',
      altKey: true,
      action: () => setEditorState(prev => ({ ...prev, activePanel: 'effects' })),
      description: 'Focus Effects Panel'
    },
    {
      key: '4',
      altKey: true,
      action: () => setEditorState(prev => ({ ...prev, activePanel: 'render' })),
      description: 'Focus Render Panel'
    },
    {
      key: '5',
      altKey: true,
      action: () => setEditorState(prev => ({ ...prev, activePanel: 'status' })),
      description: 'Focus Status Dashboard'
    }
  ];

  // Initialize keyboard shortcuts
  useKeyboardShortcuts({
    shortcuts,
    enabled: true,
    ignoreInputs: true
  });

  // Legacy keyboard shortcuts (keeping for compatibility)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Let the useKeyboardShortcuts hook handle most shortcuts
      // Keep only special cases here if needed
      handleHistoryKeyDown(e);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleHistoryKeyDown]);

  // Enhanced handlers with error handling
  const handleSave = useCallback(async () => {
    try {
      await errorHandlingService.withErrorHandling(
        async () => {
          // Save project logic
          console.log('Saving project...');
          onSave?.();

          // Update status dashboard
          statusDashboardService.addActionHistory({
            action: 'Projeto salvo',
            user: currentUser.name,
            target: projectId,
            status: 'success'
          });
        },
        {
          service: 'VideoEditorIntegration',
          method: 'handleSave',
          stage: 'save',
          userId: currentUser.id,
          sessionId: projectId
        },
        {
          type: ErrorType.FILE_SYSTEM,
          severity: ErrorSeverity.MEDIUM
        }
      );
    } catch (error) {
      console.error('Save failed:', error);
    }
  }, [onSave, currentUser, projectId]);

  const handleImport = useCallback(async () => {
    try {
      await errorHandlingService.withErrorHandling(
        async () => {
          console.log('Importing media...');
          onImport?.();

          statusDashboardService.addActionHistory({
            action: 'Mídia importada',
            user: currentUser.name,
            target: 'Media Library',
            status: 'success'
          });
        },
        {
          service: 'VideoEditorIntegration',
          method: 'handleImport',
          stage: 'import',
          userId: currentUser.id,
          sessionId: projectId
        },
        {
          type: ErrorType.FILE_SYSTEM,
          severity: ErrorSeverity.MEDIUM
        }
      );
    } catch (error) {
      console.error('Import failed:', error);
    }
  }, [onImport, currentUser, projectId]);

  const handleExport = useCallback(async () => {
    try {
      await errorHandlingService.withErrorHandling(
        async () => {
          console.log('Exporting project...');
          onExport?.();

          statusDashboardService.addActionHistory({
            action: 'Projeto exportado',
            user: currentUser.name,
            target: projectId,
            status: 'success'
          });
        },
        {
          service: 'VideoEditorIntegration',
          method: 'handleExport',
          stage: 'export',
          userId: currentUser.id,
          sessionId: projectId
        },
        {
          type: ErrorType.PIPELINE,
          severity: ErrorSeverity.HIGH
        }
      );
    } catch (error) {
      console.error('Export failed:', error);
    }
  }, [onExport, currentUser, projectId]);

  // Playback controls
  const handleTogglePlayback = useCallback(() => {
    setEditorState(prev => ({ ...prev, isPlaying: !prev.isPlaying }));
  }, []);

  const updateCurrentTime = useCallback((time: number) => {
    setEditorState(prev => ({ ...prev, currentTime: time }));
  }, []);

  // History management with error handling
  const handleUndo = useCallback(() => {
    try {
      const success = undoHistory();
      if (success) {
        console.log('Undo action executed');
        setEditorState(projectState);

        statusDashboardService.addActionHistory({
          action: 'Ação desfeita',
          user: currentUser.name,
          target: 'Timeline',
          status: 'success'
        });
      }
    } catch (error) {
      console.error('Undo failed:', error);
      errorHandlingService.handleError(error, {
        service: 'VideoEditorIntegration',
        method: 'handleUndo',
        userId: currentUser.id,
        sessionId: projectId
      });
    }
  }, [undoHistory, projectState, currentUser, projectId]);

  const handleRedo = useCallback(() => {
    try {
      const success = redoHistory();
      if (success) {
        console.log('Redo action executed');
        setEditorState(projectState);

        statusDashboardService.addActionHistory({
          action: 'Ação refeita',
          user: currentUser.name,
          target: 'Timeline',
          status: 'success'
        });
      }
    } catch (error) {
      console.error('Redo failed:', error);
      errorHandlingService.handleError(error, {
        service: 'VideoEditorIntegration',
        method: 'handleRedo',
        userId: currentUser.id,
        sessionId: projectId
      });
    }
  }, [redoHistory, projectState, currentUser, projectId]);

  // Marker management with history
  const handleMarkerAdd = useCallback((marker: any) => {
    const newMarker = { ...marker, id: `marker_${Date.now()}` };
    executeAction({
      type: 'ADD_MARKER',
      execute: () => {
        setPreviewMarkers(prev => [...prev, newMarker]);
      },
      undo: () => {
        setPreviewMarkers(prev => prev.filter(m => m.id !== newMarker.id));
      },
      redo: () => {
        setPreviewMarkers(prev => [...prev, newMarker]);
      }
    });

    statusDashboardService.addActionHistory({
      action: 'Marcador adicionado',
      user: currentUser.name,
      target: 'Timeline',
      status: 'success'
    });
  }, [executeAction, currentUser]);

  const handleMarkerRemove = useCallback((markerId: string) => {
    let removedMarker: any = null;
    executeAction({
      type: 'REMOVE_MARKER',
      execute: () => {
        setPreviewMarkers(prev => {
          removedMarker = prev.find(m => m.id === markerId);
          return prev.filter(m => m.id !== markerId);
        });
      },
      undo: () => {
        if (removedMarker) {
          setPreviewMarkers(prev => [...prev, removedMarker]);
        }
      },
      redo: () => {
        setPreviewMarkers(prev => prev.filter(m => m.id !== markerId));
      }
    });

    statusDashboardService.addActionHistory({
      action: 'Marcador removido',
      user: currentUser.name,
      target: 'Timeline',
      status: 'success'
    });
  }, [executeAction, currentUser]);

  // Effect management with history
  const handleEffectApply = useCallback((effect: any, itemId: string) => {
    const effectId = `effect_${Date.now()}`;
    const newEffect = { ...effect, id: effectId, itemId };

    executeAction({
      type: 'APPLY_EFFECT',
      execute: () => {
        setEffectStacks(prev => [...prev, newEffect]);
        console.log('Applied effect:', newEffect, 'to item:', itemId);
      },
      undo: () => {
        setEffectStacks(prev => prev.filter(e => e.id !== effectId));
        console.log('Undid effect application:', effectId);
      },
      redo: () => {
        setEffectStacks(prev => [...prev, newEffect]);
        console.log('Redid effect application:', effectId);
      }
    });

    statusDashboardService.addActionHistory({
      action: 'Efeito aplicado',
      user: currentUser.name,
      target: itemId,
      status: 'success'
    });
  }, [executeAction, currentUser]);

  const handleEffectRemove = useCallback((effectId: string, itemId: string) => {
    let removedEffect: any = null;
    executeAction({
      type: 'REMOVE_EFFECT',
      execute: () => {
        setEffectStacks(prev => {
          removedEffect = prev.find(e => e.id === effectId);
          return prev.filter(e => e.id !== effectId);
        });
        console.log('Removed effect:', effectId, 'from item:', itemId);
      },
      undo: () => {
        if (removedEffect) {
          setEffectStacks(prev => [...prev, removedEffect]);
          console.log('Undid effect removal:', effectId);
        }
      },
      redo: () => {
        setEffectStacks(prev => prev.filter(e => e.id !== effectId));
        console.log('Redid effect removal:', effectId);
      }
    });

    statusDashboardService.addActionHistory({
      action: 'Efeito removido',
      user: currentUser.name,
      target: itemId,
      status: 'success'
    });
  }, [executeAction, currentUser]);

  // AI Auto-Editing handlers
  const handleAIEditApply = useCallback((editData: any) => {
    const editId = `ai_edit_${Date.now()}`;

    executeAction({
      type: 'APPLY_AI_EDIT',
      execute: () => {
        switch (editData.type) {
          case 'cut':
            console.log('Applied AI smart cut:', editData.data);
            break;
          case 'transition':
            console.log('Applied AI transition:', editData.data);
            break;
          case 'colorGrading':
            console.log('Applied AI color grading:', editData.data);
            break;
          case 'audioLeveling':
            console.log('Applied AI audio leveling:', editData.data);
            break;
          case 'suggestion':
            console.log('Applied AI suggestion:', editData.data);
            break;
          default:
            console.log('Applied AI edit:', editData);
        }
      },
      undo: () => {
        console.log('Undid AI edit:', editId);
      },
      redo: () => {
        console.log('Redid AI edit:', editId);
      }
    });

    statusDashboardService.addActionHistory({
      action: 'Edição IA aplicada',
      user: currentUser.name,
      target: editData.type,
      status: 'success'
    });
  }, [executeAction, currentUser]);

  const handleParameterChange = useCallback((effectId: string, parameterId: string, value: any) => {
    let oldValue: any = null;
    executeAction({
      type: 'CHANGE_PARAMETER',
      execute: () => {
        setEffectStacks(prev => prev.map(effect => {
          if (effect.id === effectId) {
            oldValue = effect.parameters?.[parameterId];
            return {
              ...effect,
              parameters: {
                ...effect.parameters,
                [parameterId]: value
              }
            };
          }
          return effect;
        }));
        console.log('Changed parameter:', effectId, parameterId, value);
      },
      undo: () => {
        setEffectStacks(prev => prev.map(effect => {
          if (effect.id === effectId) {
            return {
              ...effect,
              parameters: {
                ...effect.parameters,
                [parameterId]: oldValue
              }
            };
          }
          return effect;
        }));
        console.log('Undid parameter change:', effectId, parameterId);
      },
      redo: () => {
        setEffectStacks(prev => prev.map(effect => {
          if (effect.id === effectId) {
            return {
              ...effect,
              parameters: {
                ...effect.parameters,
                [parameterId]: value
              }
            };
          }
          return effect;
        }));
        console.log('Redid parameter change:', effectId, parameterId);
      }
    });
  }, [executeAction]);

  // Render management
  const handleRenderStart = useCallback((job: any) => {
    console.log('Starting render job:', job);
    setRenderJobs(prev => [...prev, job]);

    statusDashboardService.addActionHistory({
      action: 'Render iniciado',
      user: currentUser.name,
      target: job.name,
      status: 'success'
    });
  }, [currentUser]);

  const handleRenderComplete = useCallback((job: any) => {
    console.log('Render completed:', job);

    statusDashboardService.addActionHistory({
      action: 'Render concluído',
      user: currentUser.name,
      target: job.name,
      status: 'success'
    });
  }, [currentUser]);

  const handleRenderProgress = useCallback((jobId: string, progress: number) => {
    setRenderJobs(prev => prev.map(job =>
      job.id === jobId ? { ...job, progress } : job
    ));
  }, []);

  // Layout management
  const setLayout = useCallback((layout: keyof typeof layouts) => {
    setEditorState(prev => ({ ...prev, layout }));
  }, []);

  // Main toolbar
  const renderMainToolbar = () => (
    <div className="flex items-center justify-between p-3 bg-gray-800 border-b border-gray-700">
      {/* Left section - File operations */}
      <div className="flex items-center space-x-2">
        <Button variant="outline" size="sm" onClick={handleImport}>
          <FolderOpen className="w-4 h-4 mr-1" />
          Import
        </Button>
        <Button variant="outline" size="sm" onClick={handleSave}>
          <Save className="w-4 h-4 mr-1" />
          Save
        </Button>
        <Button variant="outline" size="sm" onClick={handleExport}>
          <Download className="w-4 h-4 mr-1" />
          Export
        </Button>

        <div className="w-px h-6 bg-gray-600 mx-2" />

        <Button
          variant="outline"
          size="sm"
          onClick={handleUndo}
          disabled={!canUndo}
          title="Undo (Ctrl+Z)"
        >
          <Undo className="w-4 h-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRedo}
          disabled={!canRedo}
          title="Redo (Ctrl+Shift+Z)"
        >
          <Redo className="w-4 h-4" />
        </Button>
      </div>

      {/* Center section - Playback controls */}
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => updateCurrentTime(0)}
        >
          ⏮️
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => updateCurrentTime(Math.max(0, editorState.currentTime - 1))}
        >
          ⏪
        </Button>

        <Button
          onClick={handleTogglePlayback}
          size="lg"
          className="px-8"
        >
          {editorState.isPlaying ? (
            <Pause className="w-6 h-6" />
          ) : (
            <Play className="w-6 h-6" />
          )}
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => updateCurrentTime(editorState.currentTime + 1)}
        >
          ⏩
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => updateCurrentTime(editorState.projectSettings.duration)}
        >
          ⏭️
        </Button>
      </div>

      {/* Right section - View controls */}
      <div className="flex items-center space-x-2">
        <div className="flex items-center space-x-1 bg-gray-700 rounded p-1">
          <Button
            variant={editorState.layout === 'default' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setLayout('default')}
          >
            <Grid3X3 className="w-4 h-4" />
          </Button>
          <Button
            variant={editorState.layout === 'preview-focus' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setLayout('preview-focus')}
          >
            <Monitor className="w-4 h-4" />
          </Button>
          <Button
            variant={editorState.layout === 'timeline-focus' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setLayout('timeline-focus')}
          >
            <Film className="w-4 h-4" />
          </Button>
          <Button
            variant={editorState.layout === 'effects-focus' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setLayout('effects-focus')}
          >
            <Sparkles className="w-4 h-4" />
          </Button>
        </div>

        <Button variant="outline" size="sm">
          <Settings className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );

  // Status bar
  const renderStatusBar = () => (
    <div className="flex items-center justify-between p-2 bg-gray-800 border-t border-gray-700 text-sm text-gray-400">
      <div className="flex items-center space-x-4">
        <span>Tempo: {formatTime(editorState.currentTime)}</span>
        <span>Duração: {formatTime(editorState.projectSettings.duration)}</span>
        <span>FPS: {editorState.projectSettings.framerate}</span>
        <span>Resolução: {editorState.projectSettings.width}x{editorState.projectSettings.height}</span>
      </div>

      <div className="flex items-center space-x-4">
        <span>Selecionados: {editorState.selectedItems.length}</span>
        <span>Zoom: {Math.round(editorState.zoom * 100)}%</span>
        {renderJobs.filter((j: any) => j.status === 'processing').length > 0 && (
          <Badge variant="secondary">
            Renderizando: {renderJobs.filter((j: any) => j.status === 'processing').length}
          </Badge>
        )}
      </div>
    </div>
  );

  // Format time helper
  const formatTime = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const frames = Math.floor((seconds % 1) * editorState.projectSettings.framerate);

    if (hrs > 0) {
      return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${frames.toString().padStart(2, '0')}`;
    } else {
      return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${frames.toString().padStart(2, '0')}`;
    }
  };

  return (
    <div className="h-screen bg-gray-900 text-white flex flex-col overflow-hidden relative">
      {/* Collaboration Overlay - Always Active */}
      <div className="absolute inset-0 pointer-events-none z-50">
        <CollaborationSystem
          projectId={projectId}
          currentUser={currentUser}
          onUserJoin={(user) => console.log('Usuário entrou:', user)}
          onUserLeave={(userId) => console.log('Usuário saiu:', userId)}
          onCommentAdd={(comment) => console.log('Comentário adicionado:', comment)}
          onActivityUpdate={(activity) => console.log('Atividade:', activity)}
          overlayMode={true}
        />
      </div>

      {/* Main Toolbar */}
      {renderMainToolbar()}

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Preview */}
        <div className="flex-1 flex flex-col">
          {/* Preview Area */}
          <div className="flex-1 p-4">
            <AdvancedVideoPreview
              engine={engine}
              width={1920}
              height={1080}
              onTimeChange={updateCurrentTime}
              onPlayStateChange={(isPlaying) =>
                setEditorState(prev => ({ ...prev, isPlaying }))
              }
              markers={previewMarkers}
              onMarkerAdd={handleMarkerAdd}
              onMarkerRemove={handleMarkerRemove}
            />
          </div>

          {/* Timeline Area */}
          <div className="h-96 border-t border-gray-700">
            <ProfessionalTimeline
              engine={engine}
              onTimeChange={updateCurrentTime}
              onSelectionChange={(selectedItems) =>
                setEditorState(prev => ({ ...prev, selectedItems }))
              }
              height={384}
              showWaveforms={true}
              showThumbnails={true}
            />
          </div>
        </div>

        {/* Right Panel - Tools */}
        <div className="w-96 border-l border-gray-700 flex flex-col">
          <Tabs value={editorState.activePanel} onValueChange={(value) =>
            setEditorState(prev => ({ ...prev, activePanel: value as any }))
          }>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="effects" className="flex items-center space-x-1">
                <Sparkles className="w-4 h-4" />
                <span>Effects</span>
              </TabsTrigger>
              <TabsTrigger value="ai" className="flex items-center space-x-1">
                <Zap className="w-4 h-4" />
                <span>AI</span>
              </TabsTrigger>
              <TabsTrigger value="collaboration" className="flex items-center space-x-1">
                <Users className="w-4 h-4" />
                <span>Colab</span>
              </TabsTrigger>
              <TabsTrigger value="render" className="flex items-center space-x-1">
                <Download className="w-4 h-4" />
                <span>Render</span>
              </TabsTrigger>
              <TabsTrigger value="status" className="flex items-center space-x-1">
                <Monitor className="w-4 h-4" />
                <span>Status</span>
              </TabsTrigger>
            </TabsList>

            {/* Effects Panel */}
            <TabsContent value="effects" className="flex-1 overflow-hidden">
              <AdvancedEffectsSystem
                selectedItemId={editorState.selectedItems[0]}
                onEffectApply={handleEffectApply}
                onEffectRemove={handleEffectRemove}
                onParameterChange={handleParameterChange}
                effectStacks={effectStacks}
                currentTime={editorState.currentTime}
              />
            </TabsContent>

            {/* AI Auto-Editing Panel */}
            <TabsContent value="ai" className="flex-1 overflow-hidden">
              <AutoEditingSystem
                videoElement={videoElement}
                audioData={audioData}
                onApplyEdit={handleAIEditApply}
                className="h-full"
              />
            </TabsContent>

            {/* Collaboration Panel */}
            <TabsContent value="collaboration" className="flex-1 overflow-hidden">
              <CollaborationSystem
                projectId={projectId}
                currentUser={currentUser}
                onUserJoin={(user) => console.log('Usuário entrou:', user)}
                onUserLeave={(userId) => console.log('Usuário saiu:', userId)}
                onCommentAdd={(comment) => console.log('Comentário adicionado:', comment)}
                onActivityUpdate={(activity) => console.log('Atividade:', activity)}
              />
            </TabsContent>

            {/* Render Panel */}
            <TabsContent value="render" className="flex-1 overflow-hidden">
              <ProfessionalRenderSystem
                engine={engine}
                onRenderStart={handleRenderStart}
                onRenderComplete={handleRenderComplete}
                onRenderProgress={handleRenderProgress}
              />
            </TabsContent>

            {/* Status Dashboard Panel */}
            <TabsContent value="status" className="flex-1 overflow-hidden">
              <StatusDashboard />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Status Bar */}
      {renderStatusBar()}

      {/* Keyboard Shortcuts Help */}
      <div className="hidden">
        <div className="text-xs text-gray-500 p-2">
          <p>Shortcuts: Space=Play/Pause, Ctrl+S=Save, Ctrl+Z=Undo, Alt+1-5=Switch Panels</p>
        </div>
      </div>
    </div>
  );
};

export default VideoEditorIntegration;
