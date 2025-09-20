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
  Layout,
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
  Users,
  BarChart3
} from 'lucide-react';

// Import dos sistemas avançados
import AdvancedVideoPreview from './Preview/AdvancedVideoPreview';
import ProfessionalTimeline from './Timeline/ProfessionalTimeline';
import AdvancedEffectsSystem from './Effects/AdvancedEffectsSystem';
import ProfessionalRenderSystem from './Render/ProfessionalRenderSystem';
import { AutoEditingSystem } from './AI/AutoEditingSystem';
import PreciseTrimming from './Timeline/PreciseTrimming';
import { TemplateSystem } from './Templates/TemplateSystem';
import { ContentAnalyzer } from '../ai-analysis/ContentAnalyzer';
import { AutoOptimizer } from '../ai-analysis/AutoOptimizer';
import { SmartSuggestions } from '../ai-analysis/SmartSuggestions';
import { QualityAssurance } from '../ai-analysis/QualityAssurance';

// Import dos novos componentes de colaboração
import CollaborationHub from '../collaboration/CollaborationHub';
import RealtimeSync from '../collaboration/RealtimeSync';
import CommentSystem from '../collaboration/CommentSystem';
import VersionControl from '../collaboration/VersionControl';
import LivePreview from '../collaboration/LivePreview';
import PermissionManager from '../collaboration/PermissionManager';

// Import dos componentes de virtualização
import { VirtualizationProvider } from '../../providers/VirtualizationProvider';
import VirtualizedTimeline from '../editor/VirtualizedTimeline';
import VirtualizedEffectsList from '../VirtualizedEffectsList';
import VirtualizedMediaLibrary from '../VirtualizedMediaLibrary';
import { useVirtualization } from '../../providers/VirtualizationProvider';

// Import do sistema de performance
import PerformanceMonitor from './Performance/PerformanceMonitor';
import OptimizationPanel from './Performance/OptimizationPanel';
import PerformanceCharts from './Performance/PerformanceCharts';
import { usePerformance } from '../../hooks/usePerformance';

// Import do TimelineEngine e History
import { TimelineEngine } from '../../modules/video-editor/core/TimelineEngine';
import { useHistory } from '../../hooks/useHistory';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';

// Types
interface CompleteVideoEditorState {
  currentTime: number;
  isPlaying: boolean;
  zoom: number;
  selectedItems: string[];
  activePanel: 'preview' | 'timeline' | 'effects' | 'templates' | 'render' | 'ai' | 'collaboration' | 'performance';
  layout: 'default' | 'preview-focus' | 'timeline-focus' | 'effects-focus';
  projectSettings: {
    width: number;
    height: number;
    framerate: number;
    sampleRate: number;
    duration: number;
  };
}

interface CompleteVideoEditorProps {
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

const CompleteVideoEditorContent: React.FC<CompleteVideoEditorProps> = ({
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
  // Hook de virtualização
  const virtualization = useVirtualization();
  // Engine instance
  const engineRef = useRef<TimelineEngine>(new TimelineEngine());
  const engine = engineRef.current;

  // Estados principais
  const [editorState, setEditorState] = useState<CompleteVideoEditorState>({
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

  const [previewMarkers, setPreviewMarkers] = useState([]);
  const [effectStacks, setEffectStacks] = useState([]);
  const [renderJobs, setRenderJobs] = useState([]);
  const [showStatusDashboard, setShowStatusDashboard] = useState(false);
  const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(null);
  const [audioData, setAudioData] = useState<AudioBuffer | null>(null);

  // Performance monitoring
  const {
    metrics,
    isMonitoring,
    alerts,
    bottlenecks,
    recommendations,
    startMonitoring,
    stopMonitoring,
    optimizeSettings,
    exportReport
  } = usePerformance({
    enableAutoOptimization: true,
    alertThresholds: {
      cpu: 80,
      memory: 85,
      fps: 24
    }
  });

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
      action: () => onSave?.(),
      description: 'Save Project'
    },
    {
      key: 'o',
      ctrlKey: true,
      action: () => onImport?.(),
      description: 'Import Media'
    },
    {
      key: 'e',
      ctrlKey: true,
      action: () => onExport?.(),
      description: 'Export Project'
    },
    // History operations
    {
      key: 'z',
      ctrlKey: true,
      action: undo,
      description: 'Undo'
    },
    {
      key: 'z',
      ctrlKey: true,
      shiftKey: true,
      action: redo,
      description: 'Redo'
    },
    {
      key: 'y',
      ctrlKey: true,
      action: redo,
      description: 'Redo (Alternative)'
    },
    // Playback controls
    {
      key: ' ',
      action: togglePlayback,
      description: 'Play/Pause'
    },
    {
      key: 'k',
      action: togglePlayback,
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
    }
  ];

  // Initialize keyboard shortcuts
  useKeyboardShortcuts({
    shortcuts,
    enabled: true,
    ignoreInputs: true
  });

  // Initialize performance monitoring
  useEffect(() => {
    startMonitoring();
    return () => {
      stopMonitoring();
    };
  }, [startMonitoring, stopMonitoring]);

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

  // Playback controls
  const togglePlayback = useCallback(() => {
    setEditorState(prev => ({ ...prev, isPlaying: !prev.isPlaying }));
  }, []);

  const updateCurrentTime = useCallback((time: number) => {
    setEditorState(prev => ({ ...prev, currentTime: time }));
  }, []);

  // History management
  const undo = useCallback(() => {
    const success = undoHistory();
    if (success) {
      console.log('Undo action executed');
      // Update editor state from history
      setEditorState(projectState);
    }
  }, [undoHistory, projectState]);

  const redo = useCallback(() => {
    const success = redoHistory();
    if (success) {
      console.log('Redo action executed');
      // Update editor state from history
      setEditorState(projectState);
    }
  }, [redoHistory, projectState]);

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
  }, [executeAction]);

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
  }, [executeAction]);

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
  }, [executeAction]);

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
}, [executeAction]);

  // AI Auto-Editing handlers
  const handleAIEditApply = useCallback((editData: any) => {
    const editId = `ai_edit_${Date.now()}`;
    
    executeAction({
      type: 'APPLY_AI_EDIT',
      execute: () => {
        switch (editData.type) {
          case 'cut':
            console.log('Applied AI smart cut:', editData.data);
            // Apply cut to timeline
            break;
          case 'transition':
            console.log('Applied AI transition:', editData.data);
            // Apply transition effect
            break;
          case 'colorGrading':
            console.log('Applied AI color grading:', editData.data);
            // Apply color grading effect
            break;
          case 'audioLeveling':
            console.log('Applied AI audio leveling:', editData.data);
            // Apply audio leveling
            break;
          case 'suggestion':
            console.log('Applied AI suggestion:', editData.data);
            // Apply general AI suggestion
            break;
          default:
            console.log('Applied AI edit:', editData);
        }
      },
      undo: () => {
        console.log('Undid AI edit:', editId);
        // Implement undo logic for AI edits
      },
      redo: () => {
        console.log('Redid AI edit:', editId);
        // Implement redo logic for AI edits
      }
    });
  }, [executeAction]);

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
  }, []);

  const handleRenderComplete = useCallback((job: any) => {
    console.log('Render completed:', job);
    // Notificação de conclusão
  }, []);

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
        <Button variant="outline" size="sm" onClick={onImport}>
          <FolderOpen className="w-4 h-4 mr-1" />
          Import
        </Button>
        <Button variant="outline" size="sm" onClick={onSave}>
          <Save className="w-4 h-4 mr-1" />
          Save
        </Button>
        <Button variant="outline" size="sm" onClick={onExport}>
          <Download className="w-4 h-4 mr-1" />
          Export
        </Button>
        
        <div className="w-px h-6 bg-gray-600 mx-2" />
        
        <Button 
          variant="outline" 
          size="sm" 
          onClick={undo}
          disabled={!canUndo}
          title="Undo (Ctrl+Z)"
        >
          <Undo className="w-4 h-4" />
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={redo}
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
          onClick={togglePlayback}
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
            <Timeline className="w-4 h-4" />
          </Button>
          <Button
            variant={editorState.layout === 'effects-focus' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setLayout('effects-focus')}
          >
            <Sparkles className="w-4 h-4" />
          </Button>
        </div>
        
        <Button 
          variant={editorState.activePanel === 'performance' ? 'default' : 'outline'} 
          size="sm"
          onClick={() => setEditorState(prev => ({ ...prev, activePanel: 'performance' }))}
          title="Performance Monitor"
        >
          <Target className="w-4 h-4" />
        </Button>
        
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
        {isMonitoring && (
          <>
            <span className="text-green-400">CPU: {metrics.cpu.toFixed(1)}%</span>
            <span className="text-blue-400">RAM: {metrics.memory.toFixed(1)}%</span>
            <span className="text-yellow-400">FPS: {metrics.fps.toFixed(0)}</span>
          </>
        )}
        {alerts.length > 0 && (
          <Badge variant="destructive">
            Alertas: {alerts.length}
          </Badge>
        )}
        {renderJobs.filter(j => j.status === 'processing').length > 0 && (
          <Badge variant="secondary">
            Renderizando: {renderJobs.filter(j => j.status === 'processing').length}
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
    <div className="h-screen bg-gray-900 text-white flex flex-col overflow-hidden">
      {/* Collaboration Overlay */}
      {editorState.isCollaborationEnabled && (
        <CollaborationSystem
          projectId={projectId}
          currentUser={currentUser}
          onUserJoin={(user) => console.log('User joined:', user)}
          onUserLeave={(userId) => console.log('User left:', userId)}
          onCursorMove={(userId, position) => console.log('Cursor moved:', userId, position)}
          onSelectionChange={(userId, selection) => console.log('Selection changed:', userId, selection)}
          onCommentAdd={(comment) => console.log('Comment added:', comment)}
          onCommentResolve={(commentId) => console.log('Comment resolved:', commentId)}
        />
      )}

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

          {/* Timeline Area - Virtualizada */}
          <div className="h-96 border-t border-gray-700">
            <VirtualizedTimeline
              engine={engine}
              onTimeChange={updateCurrentTime}
              onSelectionChange={(selectedItems) =>
                setEditorState(prev => ({ ...prev, selectedItems }))
              }
              height={384}
              showWaveforms={true}
              showThumbnails={true}
              tracks={engine.getTracks()}
              clips={engine.getClips()}
              currentTime={editorState.currentTime}
              zoom={editorState.zoom}
              onZoomChange={(zoom) => setEditorState(prev => ({ ...prev, zoom }))}
              virtualizationConfig={{
                overscan: 5,
                itemHeight: 60,
                enableCache: true,
                enableMetrics: virtualization.state.config.enableMetrics
              }}
            />
          </div>
        </div>

        {/* Right Panel - Tools */}
        <div className="w-96 border-l border-gray-700 flex flex-col">
          <Tabs value={editorState.activePanel} onValueChange={(value) => 
            setEditorState(prev => ({ ...prev, activePanel: value as any }))
          }>
            <TabsList className="grid w-full grid-cols-7">
              <TabsTrigger value="effects" className="flex items-center space-x-1">
                <Sparkles className="w-4 h-4" />
                <span>Effects</span>
              </TabsTrigger>
              <TabsTrigger value="templates" className="flex items-center space-x-1">
                <Layout className="w-4 h-4" />
                <span>Templates</span>
              </TabsTrigger>
              <TabsTrigger value="ai" className="flex items-center space-x-1">
                <Zap className="w-4 h-4" />
                <span>AI</span>
              </TabsTrigger>
              <TabsTrigger value="analysis" className="flex items-center space-x-1">
                <BarChart3 className="w-4 h-4" />
                <span>Análise</span>
              </TabsTrigger>
              <TabsTrigger value="performance" className="flex items-center space-x-1">
                <Target className="w-4 h-4" />
                <span>Performance</span>
              </TabsTrigger>
              <TabsTrigger value="collaboration" className="flex items-center space-x-1">
                <Users className="w-4 h-4" />
                <span>Colaboração</span>
              </TabsTrigger>
              <TabsTrigger value="render" className="flex items-center space-x-1">
                <Download className="w-4 h-4" />
                <span>Render</span>
              </TabsTrigger>
            </TabsList>

            {/* Effects Panel - Virtualizado */}
            <TabsContent value="effects" className="flex-1 overflow-hidden">
              <div className="h-full flex flex-col">
                <div className="p-4 border-b border-gray-700">
                  <h3 className="text-lg font-semibold mb-2">Efeitos Disponíveis</h3>
                </div>
                <div className="flex-1">
                  <VirtualizedEffectsList
                    effects={[
                      { id: 'blur', name: 'Blur', category: 'filter', thumbnail: '', description: 'Aplica desfoque' },
                      { id: 'brightness', name: 'Brightness', category: 'color', thumbnail: '', description: 'Ajusta brilho' },
                      { id: 'contrast', name: 'Contrast', category: 'color', thumbnail: '', description: 'Ajusta contraste' },
                      { id: 'saturation', name: 'Saturation', category: 'color', thumbnail: '', description: 'Ajusta saturação' },
                      { id: 'fade', name: 'Fade In/Out', category: 'transition', thumbnail: '', description: 'Transição de fade' },
                      { id: 'zoom', name: 'Zoom', category: 'transform', thumbnail: '', description: 'Efeito de zoom' },
                      { id: 'rotate', name: 'Rotate', category: 'transform', thumbnail: '', description: 'Rotação' },
                      { id: 'scale', name: 'Scale', category: 'transform', thumbnail: '', description: 'Escala' },
                      { id: 'sepia', name: 'Sepia', category: 'filter', thumbnail: '', description: 'Filtro sépia' },
                      { id: 'grayscale', name: 'Grayscale', category: 'filter', thumbnail: '', description: 'Preto e branco' }
                    ]}
                    onEffectSelect={(effect) => {
                      if (editorState.selectedItems[0]) {
                        handleEffectApply(effect, editorState.selectedItems[0]);
                      }
                    }}
                    onEffectPreview={(effect) => {
                      console.log('Preview effect:', effect);
                    }}
                    searchQuery=""
                    selectedCategory="all"
                    virtualizationConfig={{
                      overscan: 3,
                      itemHeight: 120,
                      enableCache: true,
                      enableMetrics: virtualization.state.config.enableMetrics
                    }}
                  />
                </div>
                <div className="p-4 border-t border-gray-700">
                  <h4 className="text-md font-medium mb-2">Efeitos Aplicados</h4>
                  <AdvancedEffectsSystem
                    selectedItemId={editorState.selectedItems[0]}
                    onEffectApply={handleEffectApply}
                    onEffectRemove={handleEffectRemove}
                    onParameterChange={handleParameterChange}
                    effectStacks={effectStacks}
                    currentTime={editorState.currentTime}
                  />
                </div>
              </div>
            </TabsContent>

            {/* Templates Panel - Com Biblioteca Virtualizada */}
            <TabsContent value="templates" className="flex-1 overflow-hidden">
              <div className="h-full flex flex-col">
                <div className="p-4 border-b border-gray-700">
                  <h3 className="text-lg font-semibold mb-2">Biblioteca de Mídia</h3>
                </div>
                <div className="flex-1">
                  <VirtualizedMediaLibrary
                    mediaItems={[
                      { id: '1', name: 'Video1.mp4', type: 'video', size: 1024000, duration: 120, thumbnail: '', path: '/media/video1.mp4', createdAt: new Date(), tags: ['intro'] },
                      { id: '2', name: 'Audio1.mp3', type: 'audio', size: 512000, duration: 180, thumbnail: '', path: '/media/audio1.mp3', createdAt: new Date(), tags: ['music'] },
                      { id: '3', name: 'Image1.jpg', type: 'image', size: 256000, duration: 0, thumbnail: '', path: '/media/image1.jpg', createdAt: new Date(), tags: ['background'] },
                      { id: '4', name: 'Video2.mp4', type: 'video', size: 2048000, duration: 240, thumbnail: '', path: '/media/video2.mp4', createdAt: new Date(), tags: ['main'] },
                      { id: '5', name: 'Audio2.wav', type: 'audio', size: 1024000, duration: 90, thumbnail: '', path: '/media/audio2.wav', createdAt: new Date(), tags: ['sfx'] }
                    ]}
                    onMediaSelect={(media) => {
                      console.log('Mídia selecionada:', media);
                      // Adicionar mídia à timeline
                    }}
                    onMediaPreview={(media) => {
                      console.log('Preview da mídia:', media);
                    }}
                    onMediaImport={(files) => {
                      console.log('Importar arquivos:', files);
                    }}
                    searchQuery=""
                    selectedType="all"
                    sortBy="name"
                    sortOrder="asc"
                    virtualizationConfig={{
                      overscan: 4,
                      itemHeight: 150,
                      enableCache: true,
                      enableMetrics: virtualization.state.config.enableMetrics
                    }}
                  />
                </div>
                <div className="p-4 border-t border-gray-700">
                  <h4 className="text-md font-medium mb-2">Templates</h4>
                  <TemplateSystem
                    engine={engine}
                    onTemplateApply={(template) => {
                      console.log('Template aplicado:', template);
                      // Aqui você pode implementar a lógica para aplicar o template
                    }}
                    onAutomationTrigger={(workflow) => {
                      console.log('Automação executada:', workflow);
                      // Aqui você pode implementar a lógica para executar automações
                    }}
                    currentProject={{
                      id: projectId,
                      name: 'Projeto Atual',
                      duration: editorState.projectSettings.duration,
                      elements: editorState.selectedItems
                    }}
                  />
                </div>
              </div>
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

            {/* Analysis Panel */}
            <TabsContent value="analysis" className="flex-1 overflow-hidden">
              <div className="h-full flex flex-col">
                <Tabs defaultValue="content" className="flex-1 flex flex-col">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="content">Conteúdo</TabsTrigger>
                    <TabsTrigger value="optimizer">Otimizador</TabsTrigger>
                    <TabsTrigger value="suggestions">Sugestões</TabsTrigger>
                    <TabsTrigger value="quality">Qualidade</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="content" className="flex-1 overflow-hidden">
                    <ContentAnalyzer
                      videoElement={videoElement}
                      audioData={audioData}
                      onAnalysisComplete={(results) => console.log('Análise completa:', results)}
                    />
                  </TabsContent>
                  
                  <TabsContent value="optimizer" className="flex-1 overflow-hidden">
                    <AutoOptimizer
                      engine={engine}
                      onOptimizationApply={(optimization) => console.log('Otimização aplicada:', optimization)}
                      currentSettings={editorState.projectSettings}
                    />
                  </TabsContent>
                  
                  <TabsContent value="suggestions" className="flex-1 overflow-hidden">
                    <SmartSuggestions
                      engine={engine}
                      onSuggestionApply={(suggestion) => console.log('Sugestão aplicada:', suggestion)}
                      currentProject={{
                        id: projectId,
                        elements: editorState.selectedItems,
                        duration: editorState.projectSettings.duration
                      }}
                    />
                  </TabsContent>
                  
                  <TabsContent value="quality" className="flex-1 overflow-hidden">
                    <QualityAssurance
                      engine={engine}
                      onIssueDetected={(issue) => console.log('Problema detectado:', issue)}
                      onFixApply={(fix) => console.log('Correção aplicada:', fix)}
                      autoFix={true}
                    />
                  </TabsContent>
                </Tabs>
              </div>
            </TabsContent>

            {/* Performance Panel */}
            <TabsContent value="performance" className="flex-1 overflow-hidden">
              <div className="h-full flex flex-col">
                <Tabs defaultValue="monitor" className="flex-1 flex flex-col">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="monitor">Monitor</TabsTrigger>
                    <TabsTrigger value="optimize">Otimizar</TabsTrigger>
                    <TabsTrigger value="charts">Gráficos</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="monitor" className="flex-1 overflow-hidden">
                    <PerformanceMonitor
                      metrics={metrics}
                      alerts={alerts}
                      bottlenecks={bottlenecks}
                      recommendations={recommendations}
                      isMonitoring={isMonitoring}
                      onStartMonitoring={startMonitoring}
                      onStopMonitoring={stopMonitoring}
                      onExportReport={exportReport}
                    />
                  </TabsContent>
                  
                  <TabsContent value="optimize" className="flex-1 overflow-hidden">
                    <OptimizationPanel
                      metrics={metrics}
                      recommendations={recommendations}
                      onOptimize={optimizeSettings}
                      isMonitoring={isMonitoring}
                    />
                  </TabsContent>
                  
                  <TabsContent value="charts" className="flex-1 overflow-hidden">
                    <PerformanceCharts
                      metrics={metrics}
                      timeRange="1h"
                      onExport={exportReport}
                    />
                  </TabsContent>
                </Tabs>
              </div>
            </TabsContent>

            {/* Collaboration Panel */}
            <TabsContent value="collaboration" className="flex-1 overflow-hidden">
              <div className="h-full flex flex-col">
                <Tabs defaultValue="hub" className="flex-1 flex flex-col">
                  <TabsList className="grid w-full grid-cols-6">
                    <TabsTrigger value="hub">Hub</TabsTrigger>
                    <TabsTrigger value="sync">Sync</TabsTrigger>
                    <TabsTrigger value="comments">Comentários</TabsTrigger>
                    <TabsTrigger value="versions">Versões</TabsTrigger>
                    <TabsTrigger value="preview">Preview</TabsTrigger>
                    <TabsTrigger value="permissions">Permissões</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="hub" className="flex-1 overflow-hidden">
                    <CollaborationHub
                      projectId={projectId}
                      currentUser={currentUser}
                      onUserJoin={(user) => console.log('Usuário entrou:', user)}
                      onUserLeave={(userId) => console.log('Usuário saiu:', userId)}
                      onActivityUpdate={(activity) => console.log('Atividade:', activity)}
                    />
                  </TabsContent>
                  
                  <TabsContent value="sync" className="flex-1 overflow-hidden">
                    <RealtimeSync
                      projectId={projectId}
                      currentUser={currentUser}
                      timelineData={{
                        items: editorState.selectedItems,
                        currentTime: editorState.currentTime,
                        duration: editorState.projectSettings.duration
                      }}
                      onTimelineUpdate={(data) => {
                        setEditorState(prev => ({
                          ...prev,
                          currentTime: data.currentTime,
                          selectedItems: data.items
                        }));
                      }}
                      onConflictDetected={(conflict) => console.log('Conflito detectado:', conflict)}
                    />
                  </TabsContent>
                  
                  <TabsContent value="comments" className="flex-1 overflow-hidden">
                    <CommentSystem
                      projectId={projectId}
                      currentUser={currentUser}
                      timelinePosition={editorState.currentTime}
                      onCommentAdd={(comment) => console.log('Comentário adicionado:', comment)}
                      onCommentResolve={(commentId) => console.log('Comentário resolvido:', commentId)}
                    />
                  </TabsContent>
                  
                  <TabsContent value="versions" className="flex-1 overflow-hidden">
                    <VersionControl
                      projectId={projectId}
                      currentUser={currentUser}
                      currentVersion={{
                        id: 'v1.0',
                        name: 'Versão Atual',
                        timestamp: new Date(),
                        author: currentUser,
                        changes: []
                      }}
                      onVersionCreate={(version) => console.log('Versão criada:', version)}
                      onVersionRestore={(versionId) => console.log('Versão restaurada:', versionId)}
                      onBranchCreate={(branch) => console.log('Branch criado:', branch)}
                    />
                  </TabsContent>
                  
                  <TabsContent value="preview" className="flex-1 overflow-hidden">
                    <LivePreview
                      projectId={projectId}
                      currentUser={currentUser}
                      videoElement={videoElement}
                      isPlaying={editorState.isPlaying}
                      currentTime={editorState.currentTime}
                      onPlaybackSync={(time, playing) => {
                        setEditorState(prev => ({
                          ...prev,
                          currentTime: time,
                          isPlaying: playing
                        }));
                      }}
                      onAnnotationAdd={(annotation) => console.log('Anotação adicionada:', annotation)}
                    />
                  </TabsContent>
                  
                  <TabsContent value="permissions" className="flex-1 overflow-hidden">
                    <PermissionManager
                      projectId={projectId}
                      currentUser={currentUser}
                      onPermissionChange={(userId, permission) => console.log('Permissão alterada:', userId, permission)}
                      onUserInvite={(email, role) => console.log('Usuário convidado:', email, role)}
                      onAccessRevoke={(userId) => console.log('Acesso revogado:', userId)}
                    />
                  </TabsContent>
                </Tabs>
              </div>
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
          </Tabs>
        </div>
      </div>

      {/* Status Bar */}
      {renderStatusBar()}

      {/* Keyboard Shortcuts Help */}
      <div className="hidden">
        <div className="text-xs text-gray-500 p-2">
          <p>Shortcuts: Space=Play/Pause, Ctrl+S=Save, Ctrl+Z=Undo, Alt+1-4=Switch Panels</p>
        </div>
      </div>
    </div>
  );
};

// Componente principal com VirtualizationProvider
export const CompleteVideoEditor: React.FC<CompleteVideoEditorProps> = (props) => {
  return (
    <VirtualizationProvider
      config={{
        enableMetrics: true,
        enableDebug: false,
        cacheSize: 1000,
        overscanCount: 5,
        scrollDebounceMs: 16,
        resizeDebounceMs: 100,
        itemSizeEstimate: 60,
        enableVirtualization: true,
        enableSmoothing: true,
        smoothingFactor: 0.1,
        preloadDistance: 200,
        recycleThreshold: 50
      }}
    >
      <CompleteVideoEditorContent {...props} />
    </VirtualizationProvider>
  );
};

export default CompleteVideoEditor;