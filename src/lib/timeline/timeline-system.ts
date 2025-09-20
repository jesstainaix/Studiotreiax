import { EventEmitter } from '../../utils/EventEmitter'

export interface TimelineKeyframe {
  id: string
  elementId: string
  timestamp: number // in milliseconds
  properties: Record<string, any>
  easing: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'cubic-bezier' | 'bounce' | 'elastic' | 'back'
  duration: number
  delay: number
  // Advanced keyframe properties
  interpolationType: 'linear' | 'bezier' | 'step' | 'hold'
  bezierHandles?: {
    inTangent: { x: number; y: number }
    outTangent: { x: number; y: number }
  }
  selected: boolean
  locked: boolean
}

export interface TimelineMarker {
  id: string
  timestamp: number
  name: string
  color: string
  type: 'chapter' | 'cue' | 'beat' | 'section' | 'custom'
  description?: string
  metadata?: Record<string, any>
}

export interface AutomationCurve {
  id: string
  property: string // e.g., 'volume', 'opacity', 'position.x'
  keyframes: AutomationKeyframe[]
  enabled: boolean
  color: string
}

export interface AutomationKeyframe {
  id: string
  timestamp: number
  value: number
  easing: TimelineKeyframe['easing']
  selected: boolean
}

export interface TimelineTrack {
  id: string
  elementId: string
  type: 'animation' | 'audio' | 'video' | 'effect' | 'text' | 'image' | 'shape' | 'avatar' | 'transition' | 'filter' | 'composite'
  name: string
  keyframes: TimelineKeyframe[]
  locked: boolean
  visible: boolean
  muted: boolean
  startTime: number
  endTime: number
  zIndex: number
  // Cinematic editing properties
  height: number
  color: string
  solo: boolean
  volume: number
  pan: number // -1 to 1 for audio tracks
  blendMode: 'normal' | 'multiply' | 'screen' | 'overlay' | 'soft-light' | 'hard-light' | 'color-dodge' | 'color-burn'
  opacity: number
  collapsed: boolean
  armed: boolean // for recording
  parentTrackId?: string // for nested tracks
  childTrackIds: string[] // for track groups
  effects: string[]
  transitions: {
    in?: string
    out?: string
  }
  markers: TimelineMarker[]
  automation: AutomationCurve[]
}

export interface TimelineState {
  tracks: TimelineTrack[]
  currentTime: number
  duration: number
  isPlaying: boolean
  playbackRate: number
  loop: boolean
  selectedTracks: string[]
  selectedKeyframes: string[]
  selectedMarkers: string[]
  zoom: number
  viewportStart: number
  viewportEnd: number
  // Cinematic editing state
  trackGroups: TrackGroup[]
  globalMarkers: TimelineMarker[]
  snapToGrid: boolean
  gridSize: number // in milliseconds
  magneticSnap: boolean
  rippleEdit: boolean
  multiTrackSelection: boolean
  soloMode: boolean
  muteMode: boolean
  recordingTrackId?: string
  previewMode: 'full' | 'audio-only' | 'video-only'
  renderQuality: 'draft' | 'preview' | 'full'
  colorSpace: 'sRGB' | 'Rec709' | 'Rec2020' | 'DCI-P3'
  frameRate: number
  resolution: { width: number; height: number }
}

export interface TrackGroup {
  id: string
  name: string
  trackIds: string[]
  collapsed: boolean
  color: string
  locked: boolean
  visible: boolean
  muted: boolean
}

export interface TimelineOptions {
  maxTracks: number
  maxDuration: number // in milliseconds
  frameRate: number
  enableSnapping: boolean
  snapThreshold: number // in milliseconds
  enableRealTimePreview: boolean
  performanceMode: 'high' | 'balanced' | 'low'
  // Cinematic editing options
  maxTrackGroups: number
  enableAutomation: boolean
  enableRippleEdit: boolean
  enableMagneticSnap: boolean
  snapTolerance: number
  previewResolution: 'low' | 'medium' | 'high'
  enableGPUAcceleration: boolean
  maxMarkersPerTrack: number
  maxGlobalMarkers: number
  defaultTrackHeight: number
  minTrackHeight: number
  maxTrackHeight: number
  enableTrackNesting: boolean
  maxNestingDepth: number
  enableColorGrading: boolean
  enableAudioMixing: boolean
  enableVideoCompositing: boolean
  cacheSize: number // in MB
  previewResolution: { width: number; height: number }
  renderThreads: number
}

export interface AnimationFrame {
  timestamp: number
  properties: Record<string, any>
  interpolated: boolean
}

export class TimelineSystem extends EventEmitter {
  private state: TimelineState
  private options: TimelineOptions
  private animationFrameId: number | null = null
  private lastFrameTime = 0
  private interpolationCache = new Map<string, AnimationFrame[]>()
  private performanceMetrics = {
    frameRate: 0,
    renderTime: 0,
    interpolationTime: 0,
    lastUpdate: Date.now()
  }
  private isInitialized = false

  constructor(options: Partial<TimelineOptions> = {}) {
    super()
    
    this.options = {
      maxTracks: 20,
      maxDuration: 300000, // 5 minutes
      frameRate: 60,
      enableSnapping: true,
      snapThreshold: 100, // 100ms
      enableRealTimePreview: true,
      performanceMode: 'balanced',
      // Cinematic editing defaults
      maxTrackGroups: 10,
      enableAutomation: true,
      enableRippleEdit: true,
      enableMagneticSnap: true,
      snapTolerance: 5,
      previewResolution: 'medium',
      enableGPUAcceleration: true,
      maxMarkersPerTrack: 50,
      maxGlobalMarkers: 100,
      defaultTrackHeight: 80,
      minTrackHeight: 40,
      maxTrackHeight: 200,
      enableTrackNesting: true,
      maxNestingDepth: 3,
      enableColorGrading: true,
      enableAudioMixing: true,
      enableVideoCompositing: true,
      cacheSize: 512, // 512MB
      previewResolution: { width: 1920, height: 1080 },
      renderThreads: navigator.hardwareConcurrency || 4,
      ...options
    }

    this.state = {
      tracks: [],
      currentTime: 0,
      duration: 30000, // 30 seconds default
      isPlaying: false,
      playbackRate: 1.0,
      loop: false,
      selectedTracks: [],
      selectedKeyframes: [],
      selectedMarkers: [],
      zoom: 1.0,
      viewportStart: 0,
      viewportEnd: 30000,
      // Cinematic editing state
      trackGroups: [],
      globalMarkers: [],
      snapToGrid: true,
      gridSize: 1000, // 1 second
      magneticSnap: true,
      rippleEdit: false,
      multiTrackSelection: true,
      soloMode: false,
      muteMode: false,
      previewMode: 'full',
      renderQuality: 'preview',
      colorSpace: 'sRGB',
      frameRate: 30,
      resolution: { width: 1920, height: 1080 }
    }
  }

  initialize(): void {
    if (this.isInitialized) {
      console.warn('TimelineSystem já foi inicializado')
      return
    }
    
    try {
      // Initialize performance monitoring
      this.performanceMetrics.lastUpdate = Date.now()
      
      // Setup animation loop
      this.setupAnimationLoop()
      
      // Initialize interpolation cache
      this.interpolationCache.clear()
      
      // Setup default tracks if needed
      this.setupDefaultTracks()
      
      this.isInitialized = true
      this.emit('initialized', { state: this.getState() })
      
    } catch (error) {
      console.error('Erro ao inicializar TimelineSystem:', error)
      throw new Error(`Falha na inicialização do TimelineSystem: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    }
  }
  
  private setupAnimationLoop(): void {
    const animate = (currentTime: number) => {
      if (this.state.isPlaying) {
        const deltaTime = currentTime - this.lastFrameTime
        this.lastFrameTime = currentTime
        
        // Update timeline position
        this.updateTimelinePosition(deltaTime)
        
        // Process keyframe interpolation
        this.processInterpolation()
        
        // Update performance metrics
        this.updatePerformanceMetrics()
        
        // Emit frame update
        this.emit('frameUpdate', {
          currentTime: this.state.currentTime,
          deltaTime,
          fps: this.performanceMetrics.frameRate
        })
      }
      
      this.animationFrameId = requestAnimationFrame(animate)
    }
    
    this.animationFrameId = requestAnimationFrame(animate)
  }
  
  private setupDefaultTracks(): void {
    // Create default video track
    const videoTrack: TimelineTrack = {
      id: 'default_video',
      elementId: 'main_video',
      type: 'video',
      name: 'Video Principal',
      keyframes: [],
      locked: false,
      visible: true,
      muted: false,
      startTime: 0,
      endTime: this.state.duration,
      zIndex: 1,
      height: this.options.defaultTrackHeight,
      color: '#4A90E2',
      solo: false,
      volume: 1.0,
      pan: 0,
      blendMode: 'normal',
      opacity: 1.0,
      collapsed: false,
      armed: false,
      childTrackIds: [],
      effects: [],
      transitions: {},
      markers: [],
      automation: []
    }
    
    // Create default audio track
    const audioTrack: TimelineTrack = {
      id: 'default_audio',
      elementId: 'main_audio',
      type: 'audio',
      name: 'Áudio Principal',
      keyframes: [],
      locked: false,
      visible: true,
      muted: false,
      startTime: 0,
      endTime: this.state.duration,
      zIndex: 2,
      height: this.options.defaultTrackHeight,
      color: '#7ED321',
      solo: false,
      volume: 1.0,
      pan: 0,
      blendMode: 'normal',
      opacity: 1.0,
      collapsed: false,
      armed: false,
      childTrackIds: [],
      effects: [],
      transitions: {},
      markers: [],
      automation: []
    }
    
    this.state.tracks = [videoTrack, audioTrack]
  }
  
  private updateTimelinePosition(deltaTime: number): void {
    const newTime = this.state.currentTime + (deltaTime * this.state.playbackRate)
    
    if (newTime >= this.state.duration) {
      if (this.state.loop) {
        this.state.currentTime = 0
      } else {
        this.state.currentTime = this.state.duration
        this.pause()
      }
    } else {
      this.state.currentTime = Math.max(0, newTime)
    }
  }
  
  private processInterpolation(): void {
    const startTime = performance.now()
    
    this.state.tracks.forEach(track => {
      if (!track.visible || track.keyframes.length === 0) return
      
      // Find relevant keyframes for current time
      const relevantKeyframes = track.keyframes.filter(kf => 
        kf.timestamp <= this.state.currentTime + 100 && // 100ms lookahead
        kf.timestamp >= this.state.currentTime - 100   // 100ms lookback
      )
      
      if (relevantKeyframes.length > 0) {
        this.emit('trackUpdate', {
          trackId: track.id,
          currentTime: this.state.currentTime,
          keyframes: relevantKeyframes
        })
      }
    })
    
    this.performanceMetrics.interpolationTime = performance.now() - startTime
  }
  
  private updatePerformanceMetrics(): void {
    const now = Date.now()
    const deltaTime = now - this.performanceMetrics.lastUpdate
    
    if (deltaTime >= 1000) { // Update every second
      this.performanceMetrics.frameRate = Math.round(1000 / deltaTime)
      this.performanceMetrics.lastUpdate = now
      
      this.emit('performanceUpdate', {
        fps: this.performanceMetrics.frameRate,
        renderTime: this.performanceMetrics.renderTime,
        interpolationTime: this.performanceMetrics.interpolationTime
      })
    }
  }
  
  play(): void {
    if (!this.state.isPlaying) {
      this.state.isPlaying = true
      this.lastFrameTime = performance.now()
      this.emit('playbackStateChanged', { isPlaying: true })
    }
  }
  
  pause(): void {
    if (this.state.isPlaying) {
      this.state.isPlaying = false
      this.emit('playbackStateChanged', { isPlaying: false })
    }
  }
  
  stop(): void {
    this.state.isPlaying = false
    this.state.currentTime = 0
    this.emit('playbackStateChanged', { isPlaying: false, currentTime: 0 })
  }
  
  getState(): TimelineState {
    return JSON.parse(JSON.stringify(this.state))
  }
  
  destroy(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId)
      this.animationFrameId = null
    }
    
    this.interpolationCache.clear()
    this.removeAllListeners()
    this.state.tracks = []
    this.state.trackGroups = []
    this.isInitialized = false
    
    this.emit('destroyed')
  }