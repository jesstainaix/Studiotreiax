import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { Button } from '../ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Slider } from '../ui/slider'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { Badge } from '../ui/badge'
import { Progress } from '../ui/progress'
import { Switch } from '../ui/switch'
import { Separator } from '../ui/separator'
import { toast } from 'sonner'
import {
  Play, Pause, Square, SkipBack, SkipForward, Volume2, VolumeX, Download, Save,
  Type, Image, Music, Video, Mic, Scissors, Copy, ClipboardPaste, Trash2, RotateCcw,
  Settings, Layers, Eye, EyeOff, Lock, Unlock, Undo, Redo, ZoomIn, ZoomOut,
  Grid, Maximize, Minimize, Split, Merge, Filter, Palette, Wand2, Target,
  Clock, Calendar, BarChart3, Activity, Zap, Star, Heart, Bookmark,
  ChevronLeft, ChevronRight, ChevronUp, ChevronDown, MoreHorizontal,
  Plus, Minus, X, Check, AlertTriangle, Info, Upload, FolderOpen,
  Crop, Move, RotateCw, FlipHorizontal, FlipVertical, Contrast,
  Sun, Droplet, Crosshair, Circle
} from 'lucide-react'

// Interfaces avançadas
interface AdvancedVideoEditorProps {
  projectId?: string
  initialData?: ProjectData
  onSave?: (data: ProjectData) => void
  onExport?: (settings: ExportSettings) => void
  className?: string
}

interface ProjectData {
  id: string
  name: string
  description?: string
  duration: number
  fps: number
  resolution: Resolution
  tracks: Track[]
  assets: Asset[]
  settings: ProjectSettings
  metadata: ProjectMetadata
}

interface Track {
  id: string
  name: string
  type: 'video' | 'audio' | 'text' | 'effects' | 'overlay'
  height: number
  visible: boolean
  locked: boolean
  muted?: boolean
  solo?: boolean
  color: string
  clips: Clip[]
  effects: Effect[]
}

interface Clip {
  id: string
  name: string
  type: 'video' | 'audio' | 'image' | 'text' | 'shape' | 'avatar'
  startTime: number
  duration: number
  trimStart: number
  trimEnd: number
  speed: number
  volume: number
  opacity: number
  visible: boolean
  locked: boolean
  selected: boolean
  properties: ClipProperties
  transitions: Transition[]
  keyframes: Keyframe[]
}

interface ClipProperties {
  x: number
  y: number
  width: number
  height: number
  rotation: number
  scaleX: number
  scaleY: number
  skewX: number
  skewY: number
  anchorX: number
  anchorY: number
  blendMode: string
  filters: FilterEffect[]
  [key: string]: any
}

interface FilterEffect {
  id: string
  type: string
  enabled: boolean
  parameters: { [key: string]: any }
}

interface Transition {
  id: string
  type: string
  duration: number
  easing: string
  parameters: { [key: string]: any }
}

interface Keyframe {
  id: string
  time: number
  property: string
  value: any
  easing: string
}

interface Effect {
  id: string
  name: string
  type: string
  enabled: boolean
  parameters: { [key: string]: any }
}

interface Asset {
  id: string
  name: string
  type: 'video' | 'audio' | 'image' | 'font' | 'template'
  url: string
  duration?: number
  size: number
  metadata: { [key: string]: any }
}

interface Resolution {
  width: number
  height: number
  label: string
}

interface ProjectSettings {
  autoSave: boolean
  snapToGrid: boolean
  magneticTimeline: boolean
  showWaveforms: boolean
  showThumbnails: boolean
  previewQuality: 'low' | 'medium' | 'high' | 'ultra'
  renderQuality: 'draft' | 'preview' | 'final'
}

interface ProjectMetadata {
  createdAt: Date
  updatedAt: Date
  version: string
  author: string
  tags: string[]
}

interface ExportSettings {
  format: 'mp4' | 'mov' | 'avi' | 'webm'
  quality: 'low' | 'medium' | 'high' | 'ultra'
  resolution: Resolution
  fps: number
  bitrate: number
  audioQuality: number
}

interface EditorState {
  isPlaying: boolean
  currentTime: number
  playbackSpeed: number
  volume: number
  isMuted: boolean
  zoom: number
  scrollX: number
  scrollY: number
  selectedClips: string[]
  selectedTracks: string[]
  clipboard: Clip[]
  isLooping: boolean
  loopStart: number
  loopEnd: number
  snapEnabled: boolean
  gridEnabled: boolean
  previewMode: 'timeline' | 'fullscreen' | 'picture-in-picture'
}

interface TimelineState {
  pixelsPerSecond: number
  trackHeight: number
  headerWidth: number
  rulerHeight: number
  scrollLeft: number
  scrollTop: number
  isDragging: boolean
  dragType: 'clip' | 'trim' | 'select' | 'scrub'
  dragData: any
}

// Dados mock avançados
const mockProject: ProjectData = {
  id: 'project-1',
  name: 'Projeto Avançado',
  description: 'Projeto de demonstração com recursos avançados',
  duration: 120,
  fps: 30,
  resolution: { width: 1920, height: 1080, label: 'Full HD' },
  tracks: [
    {
      id: 'track-video-1',
      name: 'Vídeo Principal',
      type: 'video',
      height: 80,
      visible: true,
      locked: false,
      color: '#3b82f6',
      clips: [
        {
          id: 'clip-1',
          name: 'Intro.mp4',
          type: 'video',
          startTime: 0,
          duration: 30,
          trimStart: 0,
          trimEnd: 30,
          speed: 1,
          volume: 1,
          opacity: 1,
          visible: true,
          locked: false,
          selected: false,
          properties: {
            x: 0, y: 0, width: 1920, height: 1080,
            rotation: 0, scaleX: 1, scaleY: 1,
            skewX: 0, skewY: 0, anchorX: 0.5, anchorY: 0.5,
            blendMode: 'normal', filters: []
          },
          transitions: [],
          keyframes: []
        }
      ],
      effects: []
    },
    {
      id: 'track-audio-1',
      name: 'Áudio Principal',
      type: 'audio',
      height: 60,
      visible: true,
      locked: false,
      muted: false,
      solo: false,
      color: '#10b981',
      clips: [
        {
          id: 'clip-audio-1',
          name: 'Narração.mp3',
          type: 'audio',
          startTime: 5,
          duration: 25,
          trimStart: 0,
          trimEnd: 25,
          speed: 1,
          volume: 0.8,
          opacity: 1,
          visible: true,
          locked: false,
          selected: false,
          properties: {
            x: 0, y: 0, width: 0, height: 0,
            rotation: 0, scaleX: 1, scaleY: 1,
            skewX: 0, skewY: 0, anchorX: 0.5, anchorY: 0.5,
            blendMode: 'normal', filters: []
          },
          transitions: [],
          keyframes: []
        }
      ],
      effects: []
    },
    {
      id: 'track-text-1',
      name: 'Títulos',
      type: 'text',
      height: 50,
      visible: true,
      locked: false,
      color: '#f59e0b',
      clips: [
        {
          id: 'clip-text-1',
          name: 'Título Principal',
          type: 'text',
          startTime: 2,
          duration: 8,
          trimStart: 0,
          trimEnd: 8,
          speed: 1,
          volume: 1,
          opacity: 1,
          visible: true,
          locked: false,
          selected: false,
          properties: {
            x: 960, y: 200, width: 800, height: 100,
            rotation: 0, scaleX: 1, scaleY: 1,
            skewX: 0, skewY: 0, anchorX: 0.5, anchorY: 0.5,
            blendMode: 'normal', filters: [],
            text: 'Bem-vindos ao Studio IA',
            fontSize: 48,
            fontFamily: 'Arial',
            color: '#ffffff',
            textAlign: 'center'
          },
          transitions: [
            {
              id: 'transition-1',
              type: 'fadeIn',
              duration: 1,
              easing: 'ease-in-out',
              parameters: {}
            }
          ],
          keyframes: []
        }
      ],
      effects: []
    }
  ],
  assets: [],
  settings: {
    autoSave: true,
    snapToGrid: true,
    magneticTimeline: true,
    showWaveforms: true,
    showThumbnails: true,
    previewQuality: 'high',
    renderQuality: 'preview'
  },
  metadata: {
    createdAt: new Date(),
    updatedAt: new Date(),
    version: '1.0.0',
    author: 'Studio IA',
    tags: ['demo', 'advanced']
  }
}

const AdvancedVideoEditor: React.FC<AdvancedVideoEditorProps> = ({
  projectId,
  initialData,
  onSave,
  onExport,
  className = ''
}) => {
  // Estados principais
  const [project, setProject] = useState<ProjectData>(initialData || mockProject)
  const [editorState, setEditorState] = useState<EditorState>({
    isPlaying: false,
    currentTime: 0,
    playbackSpeed: 1,
    volume: 100,
    isMuted: false,
    zoom: 1,
    scrollX: 0,
    scrollY: 0,
    selectedClips: [],
    selectedTracks: [],
    clipboard: [],
    isLooping: false,
    loopStart: 0,
    loopEnd: project.duration,
    snapEnabled: true,
    gridEnabled: true,
    previewMode: 'timeline'
  })

  const [timelineState, setTimelineState] = useState<TimelineState>({
    pixelsPerSecond: 20,
    trackHeight: 80,
    headerWidth: 200,
    rulerHeight: 40,
    scrollLeft: 0,
    scrollTop: 0,
    isDragging: false,
    dragType: 'select',
    dragData: null
  })

  // Estados de interface
  const [activePanel, setActivePanel] = useState<'assets' | 'effects' | 'properties' | 'keyframes' | 'audio'>('assets')
  const [showRuler, setShowRuler] = useState(true)
  const [showGrid, setShowGrid] = useState(true)
  const [showWaveforms, setShowWaveforms] = useState(true)
  const [showThumbnails, setShowThumbnails] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [exportDialogOpen, setExportDialogOpen] = useState(false)
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false)

  // Estados de histórico
  const [history, setHistory] = useState<ProjectData[]>([project])
  const [historyIndex, setHistoryIndex] = useState(0)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  // Refs
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const timelineRef = useRef<HTMLDivElement>(null)
  const previewRef = useRef<HTMLVideoElement>(null)
  const audioContextRef = useRef<AudioContext | null>(null)

  // Computed values
  const timelineWidth = useMemo(() => {
    return project.duration * timelineState.pixelsPerSecond
  }, [project.duration, timelineState.pixelsPerSecond])

  const selectedClips = useMemo(() => {
    return project.tracks.flatMap(track => 
      track.clips.filter(clip => editorState.selectedClips.includes(clip.id))
    )
  }, [project.tracks, editorState.selectedClips])

  const currentFrame = useMemo(() => {
    return Math.floor(editorState.currentTime * project.fps)
  }, [editorState.currentTime, project.fps])

  // Funções de controle de reprodução
  const togglePlayPause = useCallback(() => {
    setEditorState(prev => ({ ...prev, isPlaying: !prev.isPlaying }))
  }, [])

  const stopPlayback = useCallback(() => {
    setEditorState(prev => ({ 
      ...prev, 
      isPlaying: false, 
      currentTime: editorState.isLooping ? editorState.loopStart : 0 
    }))
  }, [editorState.isLooping, editorState.loopStart])

  const seekTo = useCallback((time: number) => {
    const clampedTime = Math.max(0, Math.min(time, project.duration))
    setEditorState(prev => ({ ...prev, currentTime: clampedTime }))
  }, [project.duration])

  const setPlaybackSpeed = useCallback((speed: number) => {
    setEditorState(prev => ({ ...prev, playbackSpeed: speed }))
  }, [])

  const toggleMute = useCallback(() => {
    setEditorState(prev => ({ ...prev, isMuted: !prev.isMuted }))
  }, [])

  const setVolume = useCallback((volume: number) => {
    setEditorState(prev => ({ ...prev, volume, isMuted: volume === 0 }))
  }, [])

  // Funções de timeline
  const zoomTimeline = useCallback((factor: number) => {
    setTimelineState(prev => ({
      ...prev,
      pixelsPerSecond: Math.max(5, Math.min(200, prev.pixelsPerSecond * factor))
    }))
  }, [])

  const scrollTimeline = useCallback((deltaX: number, deltaY: number) => {
    setTimelineState(prev => ({
      ...prev,
      scrollLeft: Math.max(0, prev.scrollLeft + deltaX),
      scrollTop: Math.max(0, prev.scrollTop + deltaY)
    }))
  }, [])

  // Funções de seleção
  const selectClip = useCallback((clipId: string, addToSelection = false) => {
    setEditorState(prev => {
      if (addToSelection) {
        const newSelection = prev.selectedClips.includes(clipId)
          ? prev.selectedClips.filter(id => id !== clipId)
          : [...prev.selectedClips, clipId]
        return { ...prev, selectedClips: newSelection }
      } else {
        return { ...prev, selectedClips: [clipId] }
      }
    })
  }, [])

  const selectTrack = useCallback((trackId: string, addToSelection = false) => {
    setEditorState(prev => {
      if (addToSelection) {
        const newSelection = prev.selectedTracks.includes(trackId)
          ? prev.selectedTracks.filter(id => id !== trackId)
          : [...prev.selectedTracks, trackId]
        return { ...prev, selectedTracks: newSelection }
      } else {
        return { ...prev, selectedTracks: [trackId] }
      }
    })
  }, [])

  const clearSelection = useCallback(() => {
    setEditorState(prev => ({ 
      ...prev, 
      selectedClips: [], 
      selectedTracks: [] 
    }))
  }, [])

  // Funções de edição
  const copyClips = useCallback(() => {
    setEditorState(prev => ({ 
      ...prev, 
      clipboard: [...selectedClips] 
    }))
    toast.success(`${selectedClips.length} clip(s) copiado(s)`)
  }, [selectedClips])

  const pasteClips = useCallback(() => {
    if (editorState.clipboard.length === 0) {
      toast.error('Nenhum clip na área de transferência')
      return
    }

    const newClips = editorState.clipboard.map(clip => ({
      ...clip,
      id: `${clip.id}-copy-${Date.now()}`,
      startTime: editorState.currentTime,
      selected: true
    }))

    // Adicionar clips à primeira track selecionada ou primeira track disponível
    const targetTrackId = editorState.selectedTracks[0] || project.tracks[0]?.id
    if (!targetTrackId) return

    setProject(prev => ({
      ...prev,
      tracks: prev.tracks.map(track => 
        track.id === targetTrackId
          ? { ...track, clips: [...track.clips, ...newClips] }
          : track
      )
    }))

    setEditorState(prev => ({
      ...prev,
      selectedClips: newClips.map(clip => clip.id)
    }))

    toast.success(`${newClips.length} clip(s) colado(s)`)
  }, [editorState.clipboard, editorState.currentTime, editorState.selectedTracks, project.tracks])

  const deleteSelectedClips = useCallback(() => {
    if (editorState.selectedClips.length === 0) {
      toast.error('Nenhum clip selecionado')
      return
    }

    setProject(prev => ({
      ...prev,
      tracks: prev.tracks.map(track => ({
        ...track,
        clips: track.clips.filter(clip => !editorState.selectedClips.includes(clip.id))
      }))
    }))

    setEditorState(prev => ({ ...prev, selectedClips: [] }))
    toast.success(`${editorState.selectedClips.length} clip(s) removido(s)`)
  }, [editorState.selectedClips])

  const splitClipAtCurrentTime = useCallback((clipId: string) => {
    const track = project.tracks.find(t => t.clips.some(c => c.id === clipId))
    const clip = track?.clips.find(c => c.id === clipId)
    
    if (!track || !clip) return
    if (editorState.currentTime <= clip.startTime || editorState.currentTime >= clip.startTime + clip.duration) {
      toast.error('Posição inválida para divisão')
      return
    }

    const splitTime = editorState.currentTime - clip.startTime
    const newClip: Clip = {
      ...clip,
      id: `${clip.id}-split-${Date.now()}`,
      startTime: editorState.currentTime,
      duration: clip.duration - splitTime,
      trimStart: clip.trimStart + splitTime
    }

    const updatedClip: Clip = {
      ...clip,
      duration: splitTime,
      trimEnd: clip.trimStart + splitTime
    }

    setProject(prev => ({
      ...prev,
      tracks: prev.tracks.map(t => 
        t.id === track.id
          ? {
              ...t,
              clips: t.clips.map(c => c.id === clipId ? updatedClip : c).concat(newClip)
            }
          : t
      )
    }))

    toast.success('Clip dividido com sucesso')
  }, [project.tracks, editorState.currentTime])

  // Funções de histórico
  const saveToHistory = useCallback((newProject: ProjectData) => {
    const newHistory = history.slice(0, historyIndex + 1)
    newHistory.push(newProject)
    setHistory(newHistory)
    setHistoryIndex(newHistory.length - 1)
    setProject(newProject)
    setHasUnsavedChanges(true)
  }, [history, historyIndex])

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1
      setHistoryIndex(newIndex)
      setProject(history[newIndex])
      setHasUnsavedChanges(true)
    }
  }, [history, historyIndex])

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1
      setHistoryIndex(newIndex)
      setProject(history[newIndex])
      setHasUnsavedChanges(true)
    }
  }, [history, historyIndex])

  // Funções de projeto
  const saveProject = useCallback(async () => {
    try {
      if (onSave) {
        await onSave(project)
      }
      setHasUnsavedChanges(false)
      toast.success('Projeto salvo com sucesso!')
    } catch (error) {
      console.error('Erro ao salvar projeto:', error)
      toast.error('Erro ao salvar projeto')
    }
  }, [project, onSave])

  const exportProject = useCallback(async (settings: ExportSettings) => {
    try {
      if (onExport) {
        await onExport(settings)
      }
      toast.success('Exportação iniciada!')
    } catch (error) {
      console.error('Erro na exportação:', error)
      toast.error('Erro na exportação')
    }
  }, [onExport])

  // Efeitos
  useEffect(() => {
    let interval: NodeJS.Timeout
    
    if (editorState.isPlaying) {
      interval = setInterval(() => {
        setEditorState(prev => {
          let newTime = prev.currentTime + (0.1 * prev.playbackSpeed)
          
          if (prev.isLooping) {
            if (newTime >= prev.loopEnd) {
              newTime = prev.loopStart
            }
          } else if (newTime >= project.duration) {
            newTime = project.duration
            return { ...prev, currentTime: newTime, isPlaying: false }
          }
          
          return { ...prev, currentTime: newTime }
        })
      }, 100)
    }
    
    return () => clearInterval(interval)
  }, [editorState.isPlaying, editorState.playbackSpeed, editorState.isLooping, editorState.loopStart, editorState.loopEnd, project.duration])

  // Auto-save
  useEffect(() => {
    if (project.settings.autoSave && hasUnsavedChanges) {
      const autoSaveTimer = setTimeout(() => {
        saveProject()
      }, 30000) // Auto-save a cada 30 segundos
      
      return () => clearTimeout(autoSaveTimer)
    }
  }, [project.settings.autoSave, hasUnsavedChanges, saveProject])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 's':
            e.preventDefault()
            saveProject()
            break
          case 'z':
            e.preventDefault()
            if (e.shiftKey) {
              redo()
            } else {
              undo()
            }
            break
          case 'c':
            e.preventDefault()
            copyClips()
            break
          case 'v':
            e.preventDefault()
            pasteClips()
            break
          case 'a':
            e.preventDefault()
            // Select all clips
            const allClipIds = project.tracks.flatMap(track => track.clips.map(clip => clip.id))
            setEditorState(prev => ({ ...prev, selectedClips: allClipIds }))
            break
        }
      } else {
        switch (e.key) {
          case ' ':
            e.preventDefault()
            togglePlayPause()
            break
          case 'Delete':
          case 'Backspace':
            e.preventDefault()
            deleteSelectedClips()
            break
          case 'Escape':
            clearSelection()
            break
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [saveProject, undo, redo, copyClips, pasteClips, togglePlayPause, deleteSelectedClips, clearSelection, project.tracks])

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    const frames = Math.floor((seconds % 1) * project.fps)
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}:${frames.toString().padStart(2, '0')}`
  }

  const getTrackColor = (type: string): string => {
    switch (type) {
      case 'video': return '#3b82f6'
      case 'audio': return '#10b981'
      case 'text': return '#f59e0b'
      case 'effects': return '#8b5cf6'
      case 'overlay': return '#ef4444'
      default: return '#6b7280'
    }
  }

  return (
    <div className={`h-screen flex flex-col bg-gray-900 text-white ${className}`}>
      {/* Header Toolbar */}
      <div className="bg-gray-800 border-b border-gray-700 p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Video className="w-6 h-6 text-blue-400" />
              <h1 className="text-lg font-bold">Editor Avançado</h1>
            </div>
            <Separator orientation="vertical" className="h-6" />
            <div className="flex items-center space-x-2">
              <Badge variant={hasUnsavedChanges ? 'destructive' : 'secondary'}>
                {project.name}
              </Badge>
              {hasUnsavedChanges && (
                <Badge variant="outline" className="text-yellow-400 border-yellow-400">
                  Não salvo
                </Badge>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={saveProject}>
              <Save className="w-4 h-4 mr-2" />
              Salvar
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={undo}
              disabled={historyIndex <= 0}
            >
              <Undo className="w-4 h-4" />
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={redo}
              disabled={historyIndex >= history.length - 1}
            >
              <Redo className="w-4 h-4" />
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setExportDialogOpen(true)}
            >
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setSettingsDialogOpen(true)}
            >
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Tools */}
        <div className="w-16 bg-gray-800 border-r border-gray-700 flex flex-col items-center py-4 space-y-2">
          <Button 
            variant={activePanel === 'assets' ? 'default' : 'ghost'} 
            size="sm" 
            className="w-12 h-12"
            onClick={() => setActivePanel('assets')}
          >
            <FolderOpen className="w-5 h-5" />
          </Button>
          <Button 
            variant={activePanel === 'effects' ? 'default' : 'ghost'} 
            size="sm" 
            className="w-12 h-12"
            onClick={() => setActivePanel('effects')}
          >
            <Wand2 className="w-5 h-5" />
          </Button>
          <Button 
            variant={activePanel === 'properties' ? 'default' : 'ghost'} 
            size="sm" 
            className="w-12 h-12"
            onClick={() => setActivePanel('properties')}
          >
            <Settings className="w-5 h-5" />
          </Button>
          <Button 
            variant={activePanel === 'keyframes' ? 'default' : 'ghost'} 
            size="sm" 
            className="w-12 h-12"
            onClick={() => setActivePanel('keyframes')}
          >
            <Target className="w-5 h-5" />
          </Button>
          <Button 
            variant={activePanel === 'audio' ? 'default' : 'ghost'} 
            size="sm" 
            className="w-12 h-12"
            onClick={() => setActivePanel('audio')}
          >
            <Volume2 className="w-5 h-5" />
          </Button>
        </div>

        {/* Center - Preview and Timeline */}
        <div className="flex-1 flex flex-col">
          {/* Preview Area */}
          <div className="flex-1 bg-black relative">
            <canvas
              ref={canvasRef}
              className="w-full h-full object-contain"
              width={project.resolution.width}
              height={project.resolution.height}
            />
            
            {/* Preview Controls Overlay */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
              <div className="bg-black bg-opacity-75 rounded-lg p-3 flex items-center space-x-3">
                <Button variant="ghost" size="sm" onClick={() => seekTo(editorState.currentTime - 5)}>
                  <SkipBack className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={togglePlayPause}>
                  {editorState.isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                </Button>
                <Button variant="ghost" size="sm" onClick={stopPlayback}>
                  <Square className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => seekTo(editorState.currentTime + 5)}>
                  <SkipForward className="w-4 h-4" />
                </Button>
                
                <Separator orientation="vertical" className="h-6" />
                
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="sm" onClick={toggleMute}>
                    {editorState.isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </Button>
                  <Slider
                    value={[editorState.isMuted ? 0 : editorState.volume]}
                    onValueChange={([value]) => setVolume(value)}
                    max={100}
                    step={1}
                    className="w-20"
                  />
                </div>
                
                <Separator orientation="vertical" className="h-6" />
                
                <div className="text-sm font-mono">
                  {formatTime(editorState.currentTime)} / {formatTime(project.duration)}
                </div>
                
                <Select value={editorState.playbackSpeed.toString()} onValueChange={(value) => setPlaybackSpeed(parseFloat(value))}>
                  <SelectTrigger className="w-20 h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0.25">0.25x</SelectItem>
                    <SelectItem value="0.5">0.5x</SelectItem>
                    <SelectItem value="1">1x</SelectItem>
                    <SelectItem value="1.5">1.5x</SelectItem>
                    <SelectItem value="2">2x</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* Preview Mode Toggle */}
            <div className="absolute top-4 right-4">
              <div className="bg-black bg-opacity-75 rounded-lg p-2 flex items-center space-x-2">
                <Button 
                  variant={editorState.previewMode === 'timeline' ? 'default' : 'ghost'} 
                  size="sm"
                  onClick={() => setEditorState(prev => ({ ...prev, previewMode: 'timeline' }))}
                >
                  <Grid className="w-4 h-4" />
                </Button>
                <Button 
                  variant={editorState.previewMode === 'fullscreen' ? 'default' : 'ghost'} 
                  size="sm"
                  onClick={() => setEditorState(prev => ({ ...prev, previewMode: 'fullscreen' }))}
                >
                  <Maximize className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
          
          {/* Timeline Controls */}
          <div className="bg-gray-800 border-t border-gray-700 p-3">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm" onClick={() => zoomTimeline(0.8)}>
                    <ZoomOut className="w-4 h-4" />
                  </Button>
                  <span className="text-sm font-mono w-16 text-center">
                    {Math.round(timelineState.pixelsPerSecond)}px/s
                  </span>
                  <Button variant="outline" size="sm" onClick={() => zoomTimeline(1.2)}>
                    <ZoomIn className="w-4 h-4" />
                  </Button>
                </div>
                
                <Separator orientation="vertical" className="h-6" />
                
                <div className="flex items-center space-x-2">
                  <Switch 
                    checked={editorState.snapEnabled} 
                    onCheckedChange={(checked) => setEditorState(prev => ({ ...prev, snapEnabled: checked }))}
                    id="snap"
                  />
                  <label htmlFor="snap" className="text-sm">Snap</label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch 
                    checked={showGrid} 
                    onCheckedChange={setShowGrid}
                    id="grid"
                  />
                  <label htmlFor="grid" className="text-sm">Grade</label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch 
                    checked={showWaveforms} 
                    onCheckedChange={setShowWaveforms}
                    id="waveforms"
                  />
                  <label htmlFor="waveforms" className="text-sm">Ondas</label>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" onClick={copyClips} disabled={selectedClips.length === 0}>
                  <Copy className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={pasteClips} disabled={editorState.clipboard.length === 0}>
                  <ClipboardPaste className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={deleteSelectedClips} disabled={selectedClips.length === 0}>
                  <Trash2 className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => selectedClips.forEach(clip => splitClipAtCurrentTime(clip.id))} disabled={selectedClips.length === 0}>
                  <Scissors className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
          
          {/* Timeline */}
          <div className="bg-gray-900 border-t border-gray-700 flex-1 min-h-0">
            <div className="h-full flex">
              {/* Track Headers */}
              <div className="w-48 bg-gray-800 border-r border-gray-700 flex flex-col">
                {/* Ruler Header */}
                {showRuler && (
                  <div className="h-10 bg-gray-700 border-b border-gray-600 flex items-center justify-center">
                    <Clock className="w-4 h-4 text-gray-400" />
                  </div>
                )}
                
                {/* Track Headers */}
                <div className="flex-1 overflow-y-auto">
                  {project.tracks.map((track) => (
                    <div 
                      key={track.id}
                      className={`h-20 border-b border-gray-700 p-2 flex items-center justify-between cursor-pointer hover:bg-gray-750 ${
                        editorState.selectedTracks.includes(track.id) ? 'bg-blue-900' : ''
                      }`}
                      onClick={() => selectTrack(track.id)}
                    >
                      <div className="flex items-center space-x-2 flex-1">
                        <div 
                          className="w-3 h-3 rounded"
                          style={{ backgroundColor: track.color }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">{track.name}</div>
                          <div className="text-xs text-gray-400 capitalize">{track.type}</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-1">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="w-6 h-6 p-0"
                          onClick={(e) => {
                            e.stopPropagation()
                            // Toggle track visibility
                          }}
                        >
                          {track.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="w-6 h-6 p-0"
                          onClick={(e) => {
                            e.stopPropagation()
                            // Toggle track lock
                          }}
                        >
                          {track.locked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                        </Button>
                        {track.type === 'audio' && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="w-6 h-6 p-0"
                            onClick={(e) => {
                              e.stopPropagation()
                              // Toggle track mute
                            }}
                          >
                            {track.muted ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Timeline Content */}
              <div className="flex-1 relative overflow-auto" ref={timelineRef}>
                {/* Ruler */}
                {showRuler && (
                  <div className="h-10 bg-gray-700 border-b border-gray-600 relative">
                    <svg className="w-full h-full">
                      {Array.from({ length: Math.ceil(project.duration) + 1 }, (_, i) => (
                        <g key={i}>
                          <line
                            x1={i * timelineState.pixelsPerSecond}
                            y1={0}
                            x2={i * timelineState.pixelsPerSecond}
                            y2={40}
                            stroke="#4b5563"
                            strokeWidth={1}
                          />
                          <text
                            x={i * timelineState.pixelsPerSecond + 4}
                            y={25}
                            fill="#9ca3af"
                            fontSize={12}
                            fontFamily="monospace"
                          >
                            {formatTime(i)}
                          </text>
                        </g>
                      ))}
                    </svg>
                    
                    {/* Playhead */}
                    <div 
                      className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10"
                      style={{ left: editorState.currentTime * timelineState.pixelsPerSecond }}
                    />
                  </div>
                )}
                
                {/* Tracks */}
                <div className="relative">
                  {project.tracks.map((track, trackIndex) => (
                    <div 
                      key={track.id}
                      className="h-20 border-b border-gray-700 relative"
                      style={{ backgroundColor: showGrid ? 'rgba(75, 85, 99, 0.1)' : 'transparent' }}
                    >
                      {/* Grid lines */}
                      {showGrid && (
                        <svg className="absolute inset-0 w-full h-full pointer-events-none">
                          {Array.from({ length: Math.ceil(project.duration) + 1 }, (_, i) => (
                            <line
                              key={i}
                              x1={i * timelineState.pixelsPerSecond}
                              y1={0}
                              x2={i * timelineState.pixelsPerSecond}
                              y2={80}
                              stroke="#374151"
                              strokeWidth={0.5}
                              opacity={0.3}
                            />
                          ))}
                        </svg>
                      )}
                      
                      {/* Clips */}
                      {track.clips.map((clip) => (
                        <div
                          key={clip.id}
                          className={`absolute top-1 bottom-1 rounded border-2 cursor-pointer transition-all hover:brightness-110 ${
                            editorState.selectedClips.includes(clip.id)
                              ? 'border-blue-400 shadow-lg shadow-blue-400/50'
                              : 'border-transparent'
                          }`}
                          style={{
                            left: clip.startTime * timelineState.pixelsPerSecond,
                            width: clip.duration * timelineState.pixelsPerSecond,
                            backgroundColor: track.color,
                            opacity: clip.visible ? (clip.opacity || 1) : 0.5
                          }}
                          onClick={() => selectClip(clip.id)}
                        >
                          <div className="h-full p-2 flex flex-col justify-between text-xs text-white">
                            <div className="font-medium truncate">{clip.name}</div>
                            <div className="text-xs opacity-75">
                              {formatTime(clip.duration)}
                            </div>
                          </div>
                          
                          {/* Waveform for audio clips */}
                          {clip.type === 'audio' && showWaveforms && (
                            <div className="absolute inset-x-1 bottom-1 h-4 bg-black bg-opacity-30 rounded">
                              {/* Simplified waveform visualization */}
                              <svg className="w-full h-full">
                                {Array.from({ length: Math.floor(clip.duration * 10) }, (_, i) => (
                                  <rect
                                    key={i}
                                    x={i * 2}
                                    y={Math.random() * 8 + 4}
                                    width={1}
                                    height={Math.random() * 8 + 2}
                                    fill="#10b981"
                                    opacity={0.7}
                                  />
                                ))}
                              </svg>
                            </div>
                          )}
                          
                          {/* Trim handles */}
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-white opacity-0 hover:opacity-100 cursor-ew-resize" />
                          <div className="absolute right-0 top-0 bottom-0 w-1 bg-white opacity-0 hover:opacity-100 cursor-ew-resize" />
                        </div>
                      ))}
                    </div>
                  ))}
                  
                  {/* Playhead */}
                  <div 
                    className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-20 pointer-events-none"
                    style={{ left: editorState.currentTime * timelineState.pixelsPerSecond }}
                  >
                    <div className="absolute -top-2 -left-2 w-4 h-4 bg-red-500 rounded-full" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar - Panels */}
        <div className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col">
          <div className="flex border-b border-gray-700">
            <Button 
              variant={activePanel === 'assets' ? 'default' : 'ghost'}
              size="sm"
              className="flex-1 rounded-none"
              onClick={() => setActivePanel('assets')}
            >
              <FolderOpen className="w-4 h-4 mr-2" />
              Assets
            </Button>
            <Button 
              variant={activePanel === 'effects' ? 'default' : 'ghost'}
              size="sm"
              className="flex-1 rounded-none"
              onClick={() => setActivePanel('effects')}
            >
              <Wand2 className="w-4 h-4 mr-2" />
              Efeitos
            </Button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4">
            {activePanel === 'assets' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Biblioteca de Assets</h3>
                  <Button size="sm">
                    <Upload className="w-4 h-4 mr-2" />
                    Upload
                  </Button>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  {/* Asset thumbnails */}
                  <div className="aspect-video bg-gray-700 rounded border-2 border-dashed border-gray-600 flex items-center justify-center cursor-pointer hover:border-gray-500">
                    <Plus className="w-6 h-6 text-gray-400" />
                  </div>
                </div>
              </div>
            )}
            
            {activePanel === 'effects' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Efeitos Visuais</h3>
                
                <div className="space-y-2">
                  {[
                    { name: 'Blur', icon: Droplet },
                    { name: 'Sharpen', icon: Crosshair },
                    { name: 'Brightness', icon: Sun },
                    { name: 'Contrast', icon: Contrast },
                    { name: 'Saturation', icon: Droplet },
                    { name: 'Vignette', icon: Circle }
                  ].map((effect) => (
                    <div 
                      key={effect.name}
                      className="p-3 bg-gray-700 rounded cursor-pointer hover:bg-gray-600 flex items-center space-x-3"
                    >
                      <effect.icon className="w-5 h-5" />
                      <span>{effect.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {activePanel === 'properties' && selectedClips.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Propriedades</h3>
                
                <div className="space-y-4">
                  <div>
                    <Label>Opacidade</Label>
                    <Slider
                      value={[selectedClips[0]?.opacity * 100 || 100]}
                      onValueChange={([value]) => {
                        // Update clip opacity
                      }}
                      max={100}
                      step={1}
                      className="mt-2"
                    />
                  </div>
                  
                  <div>
                    <Label>Volume</Label>
                    <Slider
                      value={[selectedClips[0]?.volume * 100 || 100]}
                      onValueChange={([value]) => {
                        // Update clip volume
                      }}
                      max={100}
                      step={1}
                      className="mt-2"
                    />
                  </div>
                  
                  <div>
                    <Label>Velocidade</Label>
                    <Slider
                      value={[selectedClips[0]?.speed * 100 || 100]}
                      onValueChange={([value]) => {
                        // Update clip speed
                      }}
                      min={25}
                      max={400}
                      step={5}
                      className="mt-2"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Status Bar */}
      <div className="bg-gray-800 border-t border-gray-700 px-4 py-2">
        <div className="flex items-center justify-between text-sm text-gray-400">
          <div className="flex items-center space-x-4">
            <span>Frame: {currentFrame}</span>
            <span>FPS: {project.fps}</span>
            <span>Resolução: {project.resolution.label}</span>
          </div>
          
          <div className="flex items-center space-x-4">
            <span>Clips selecionados: {selectedClips.length}</span>
            <span>Duração: {formatTime(project.duration)}</span>
            {project.settings.autoSave && (
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span>Auto-save</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdvancedVideoEditor