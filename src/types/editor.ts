// Comprehensive Video Editor Module Types

// ============================================================================
// CANVAS SYSTEM TYPES
// ============================================================================

export interface CanvasConfig {
  width: number;
  height: number;
  fps: number;
  backgroundColor: string;
  enableGrid: boolean;
  gridSize: number;
  snapToGrid: boolean;
  zoomLevel: number;
  maxZoomLevel: number;
  minZoomLevel: number;
  enableAntiAliasing: boolean;
  renderQuality: 'low' | 'medium' | 'high' | 'ultra';
}

export interface CanvasElement {
  id: string;
  type: CanvasElementType;
  name: string;
  position: Vector3D;
  rotation: Vector3D;
  scale: Vector3D;
  opacity: number;
  visible: boolean;
  locked: boolean;
  zIndex: number;
  parentId?: string;
  children: string[];
  properties: ElementProperties;
  animations: ElementAnimation[];
  effects: ElementEffect[];
  createdAt: number;
  updatedAt: number;
}

export type CanvasElementType = 
  | 'text' | 'image' | 'video' | 'audio' 
  | 'shape' | 'avatar' | 'particle' | 'light'
  | 'camera' | 'group' | 'mask' | 'filter';

export interface Vector3D {
  x: number;
  y: number;
  z: number;
}

export interface Vector2D {
  x: number;
  y: number;
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

// ============================================================================
// EDITOR CORE TYPES
// ============================================================================

export interface EditorConfig {
  canvas: CanvasConfig;
  timeline: TimelineConfig;
  performance: PerformanceConfig;
  collaboration: CollaborationConfig;
}

export interface CanvasConfig {
  width: number;                    // 1920px default
  height: number;                   // 1080px default
  fps: number;                      // 30-60fps
  maxElements: number;              // 50 elements maximum
  enableWebGL: boolean;             // true for performance
  enableVirtualization: boolean;    // true for many elements
  snapTolerance: number;            // 5px default
  gridSize: number;                 // 10px default
}

export interface CanvasElement {
  id: string;
  type: ElementType;
  name: string;
  position: Vector3D;
  transform: Transform3D;
  properties: ElementProperties;
  animation?: Animation;
  locked: boolean;
  visible: boolean;
  zIndex: number;
  parentId?: string;                // For grouping
  metadata: ElementMetadata;
}

export type ElementType = 
  | 'text' 
  | 'image' 
  | 'video' 
  | 'avatar' 
  | 'shape' 
  | 'effect' 
  | 'particle';

export interface Vector3D {
  x: number;
  y: number;
  z: number;
}

export interface Transform3D {
  scale: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  skew: { x: number; y: number };
  opacity: number;                  // 0-1
}

export interface ElementProperties {
  text?: {
    content: string;
    fontSize: number;
    fontFamily: string;
    fontWeight: 'normal' | 'bold' | 'lighter';
    color: string;
    align: 'left' | 'center' | 'right';
    lineHeight: number;
    letterSpacing: number;
  };
  
  media?: {
    src: string;
    alt?: string;
    fit: 'cover' | 'contain' | 'fill' | 'scale-down';
    filter?: string;              // CSS filters
    brightness: number;           // 0-200
    contrast: number;            // 0-200
    saturation: number;          // 0-200
  };
  
  avatar?: {
    modelId: string;
    expression: string;
    gesture: string;
    clothing: ClothingConfig;
    lipSync: LipSyncConfig;
  };
  
  effect?: {
    type: string;
    intensity: number;            // 0-100
    parameters: Record<string, any>;
  };
}

// ============================================================================
// TIMELINE SYSTEM TYPES
// ============================================================================

export interface TimelineConfig {
  duration: number;                 // total duration in seconds
  fps: number;                      // frames per second
  zoom: number;                     // 0.1 to 5.0
  snapToGrid: boolean;
  showWaveforms: boolean;
  trackHeight: number;              // 60px default
  maxTracks: number;                // 20 tracks maximum
}

export interface TimelineTrack {
  id: string;
  name: string;
  type: TrackType;
  color: string;
  height: number;
  locked: boolean;
  visible: boolean;
  muted?: boolean;                  // audio only
  volume?: number;                  // 0-100, audio only
  clips: TimelineClip[];
  order: number;
}

export type TrackType = 
  | 'video' 
  | 'audio' 
  | 'text' 
  | 'avatar' 
  | 'effect' 
  | 'marker';

export interface TimelineClip {
  id: string;
  name: string;
  startTime: number;                // in seconds
  duration: number;                 // in seconds
  trimStart?: number;               // start trim
  trimEnd?: number;                 // end trim
  elementId?: string;               // reference to canvas element
  mediaId?: string;                 // reference to media
  properties: ClipProperties;
  transitions: {
    in?: Transition;
    out?: Transition;
  };
}

export interface ClipProperties {
  volume?: number;                  // 0-100
  opacity?: number;                 // 0-100
  speed?: number;                   // 0.1-10.0
  reverse?: boolean;
  filters?: string[];               // CSS filters
  transform?: Partial<Transform3D>;
}

export interface Transition {
  type: TransitionType;
  duration: number;                 // in seconds
  easing: EasingFunction;
  parameters?: Record<string, any>;
}

export type TransitionType = 
  | 'fade' 
  | 'dissolve' 
  | 'wipe' 
  | 'slide' 
  | 'zoom' 
  | 'blur';

export type EasingFunction = 
  | 'linear' 
  | 'ease-in' 
  | 'ease-out' 
  | 'ease-in-out' 
  | 'cubic-bezier';

export interface Keyframe {
  time: number;                     // 0-1 (percentage of duration)
  properties: Partial<Transform3D>;
  easing?: EasingFunction;
}

// ============================================================================
// AVATAR SYSTEM TYPES
// ============================================================================

export interface Avatar3D {
  id: string;
  name: string;
  type: AvatarType;
  gender: 'male' | 'female';
  thumbnail: string;
  modelUrl: string;
  textureUrl: string;
  animationsUrl: string;
  expressions: Expression[];
  gestures: Gesture[];
  clothing: ClothingOption[];
  compliance: string[];             // Supported NRs
}

export type AvatarType = 
  | 'instructor' 
  | 'worker' 
  | 'supervisor' 
  | 'engineer' 
  | 'operator';

export interface Expression {
  id: string;
  name: string;
  description: string;
  intensity: number;                // 0-100
  duration: number;                 // in seconds
  blendShapes: Record<string, number>;
}

export interface Gesture {
  id: string;
  name: string;
  description: string;
  duration: number;
  loop: boolean;
  keyframes: GestureKeyframe[];
}

export interface GestureKeyframe {
  time: number;                     // 0-1
  joints: Record<string, Vector3D>; // joint positions
}

export interface ClothingConfig {
  uniform: string;                  // Uniform ID
  helmet: boolean;
  gloves: boolean;
  boots: boolean;
  vest: boolean;
  customColors?: {
    primary: string;
    secondary: string;
    logo?: string;
  };
}

export interface ClothingOption {
  id: string;
  name: string;
  category: 'uniform' | 'epi' | 'accessory';
  thumbnail: string;
  modelUrl: string;
  compliance: string[];             // Related NRs
}

export interface LipSyncConfig {
  enabled: boolean;
  precision: 'low' | 'medium' | 'high';
  audioUrl?: string;
  phonemes?: Phoneme[];
}

export interface Phoneme {
  time: number;                     // timestamp in seconds
  phoneme: string;                  // phoneme
  intensity: number;                // 0-1
}

// ============================================================================
// PERFORMANCE CONFIGURATION TYPES
// ============================================================================

export interface PerformanceConfig {
  quality: QualityLevel;
  targetFPS: number;               // Default: 60
  resolution: Resolution;
  textureQuality: QualityLevel;
  shadowQuality: QualityLevel;
  antialiasing: boolean;
  postProcessing: PostProcessingConfig;
  autoOptimize: boolean;
}

export type QualityLevel = 
  | 'low'
  | 'medium' 
  | 'high' 
  | 'ultra';

export interface Resolution {
  width: number;
  height: number;
  scale: number;                   // 0.5-2.0
}

export interface PostProcessingConfig {
  enabled: boolean;
  bloom: boolean;
  ssao: boolean;
  dof: boolean;
  motionBlur: boolean;
}

// ============================================================================
// VFX ENGINE TYPES
// ============================================================================

export interface VFXEffect {
  id: string;
  name: string;
  type: VFXType;
  category: VFXCategory;
  parameters: VFXParameter[];
  shaderCode?: string;
  presetValues: Record<string, any>;
  thumbnailUrl: string;
  isPremium: boolean;
  gpuIntensive: boolean;
  supportedFormats: string[];
}

export type VFXType = 
  | 'filter' | 'distortion' | 'blur' | 'sharpen'
  | 'color' | 'lighting' | 'particle' | 'geometry'
  | 'composite' | 'transition' | 'generator' | 'custom';

export type VFXCategory = 
  | 'basic' | 'artistic' | 'cinematic' | 'retro'
  | 'futuristic' | 'nature' | 'abstract' | 'professional';

export interface VFXParameter {
  name: string;
  type: VFXParameterType;
  defaultValue: any;
  minValue?: number;
  maxValue?: number;
  step?: number;
  options?: string[];
  description: string;
  animatable: boolean;
}

export type VFXParameterType = 
  | 'number' | 'boolean' | 'string' | 'color'
  | 'vector2' | 'vector3' | 'texture' | 'enum';

export interface ParticleSystem {
  id: string;
  name: string;
  emitterType: 'point' | 'line' | 'circle' | 'rectangle' | 'mesh';
  particleCount: number;
  emissionRate: number;
  lifetime: number;
  startSize: number;
  endSize: number;
  startColor: string;
  endColor: string;
  velocity: Vector3D;
  acceleration: Vector3D;
  gravity: Vector3D;
  texture?: string;
  blendMode: BlendMode;
  physics: ParticlePhysics;
}

export type BlendMode = 
  | 'normal' | 'multiply' | 'screen' | 'overlay'
  | 'soft-light' | 'hard-light' | 'color-dodge' | 'color-burn'
  | 'darken' | 'lighten' | 'difference' | 'exclusion';

export interface ParticlePhysics {
  enabled: boolean;
  collision: boolean;
  friction: number;
  bounce: number;
  airResistance: number;
}

// ============================================================================
// AUDIO SYSTEM TYPES
// ============================================================================

export interface AudioConfig {
  sampleRate: number;
  bitDepth: number;
  channels: number;
  bufferSize: number;
  enableSpatialAudio: boolean;
  masterVolume: number;
  enableNormalization: boolean;
  enableCompression: boolean;
}

export interface AudioTrack {
  id: string;
  name: string;
  url: string;
  duration: number;
  volume: number;
  pan: number;
  muted: boolean;
  solo: boolean;
  effects: AudioEffect[];
  waveformData: number[];
  markers: AudioMarker[];
  spatialProperties?: SpatialAudioProperties;
}

export interface AudioEffect {
  id: string;
  type: AudioEffectType;
  enabled: boolean;
  parameters: Record<string, number>;
  wetness: number;
}

export type AudioEffectType = 
  | 'reverb' | 'delay' | 'chorus' | 'flanger'
  | 'distortion' | 'compressor' | 'equalizer' | 'filter'
  | 'pitch-shift' | 'time-stretch' | 'noise-gate' | 'limiter';

export interface AudioMarker {
  id: string;
  time: number;
  type: 'beat' | 'phrase' | 'section' | 'cue';
  label: string;
  confidence: number;
}

export interface SpatialAudioProperties {
  position: Vector3D;
  orientation: Vector3D;
  distance: number;
  rolloffFactor: number;
  dopplerFactor: number;
}

// ============================================================================
// EXPORT SYSTEM TYPES
// ============================================================================

export interface ExportConfig {
  format: ExportFormat;
  quality: ExportQuality;
  resolution: Resolution;
  fps: number;
  bitrate: number;
  codec: VideoCodec;
  audioCodec: AudioCodec;
  container: ContainerFormat;
  optimization: ExportOptimization;
  watermark?: WatermarkConfig;
  metadata: ExportMetadata;
}

export type ExportFormat = 'mp4' | 'mov' | 'avi' | 'webm' | 'mkv' | 'gif';

export type ExportQuality = 'draft' | 'preview' | 'standard' | 'high' | 'ultra';

export type Resolution = 
  | '480p' | '720p' | '1080p' | '1440p' | '4k' | '8k'
  | 'custom';

export type VideoCodec = 
  | 'h264' | 'h265' | 'vp8' | 'vp9' | 'av1'
  | 'prores' | 'dnxhd' | 'cineform';

export type AudioCodec = 
  | 'aac' | 'mp3' | 'opus' | 'vorbis'
  | 'flac' | 'pcm' | 'ac3';

export type ContainerFormat = 
  | 'mp4' | 'mov' | 'avi' | 'mkv' | 'webm'
  | 'mxf' | 'gxf' | 'mts';

export interface ExportOptimization {
  multipass: boolean;
  hardwareAcceleration: boolean;
  parallelProcessing: boolean;
  memoryOptimization: boolean;
  diskCaching: boolean;
  previewGeneration: boolean;
}

export interface WatermarkConfig {
  enabled: boolean;
  type: 'text' | 'image' | 'logo';
  content: string;
  position: WatermarkPosition;
  opacity: number;
  size: number;
  color?: string;
  font?: string;
}

export type WatermarkPosition = 
  | 'top-left' | 'top-center' | 'top-right'
  | 'middle-left' | 'middle-center' | 'middle-right'
  | 'bottom-left' | 'bottom-center' | 'bottom-right'
  | 'custom';

export interface ExportMetadata {
  title: string;
  description: string;
  author: string;
  copyright: string;
  keywords: string[];
  creationDate: string;
  customFields: Record<string, string>;
}

// ============================================================================
// PERFORMANCE MONITORING TYPES
// ============================================================================

export interface EditorPerformanceMetrics {
  timestamp: number;
  fps: number;
  frameTime: number;
  renderTime: number;
  canvasElements: number;
  activeEffects: number;
  memoryUsage: MemoryUsage;
  gpuUsage: GPUUsage;
  diskIO: DiskIOMetrics;
  networkLatency: number;
}

export interface MemoryUsage {
  heap: number;
  external: number;
  buffers: number;
  total: number;
  percentage: number;
}

export interface GPUUsage {
  utilization: number;
  memory: number;
  temperature: number;
  powerDraw: number;
}

export interface DiskIOMetrics {
  readSpeed: number;
  writeSpeed: number;
  queueDepth: number;
  latency: number;
}

// ============================================================================
// EVENT SYSTEM TYPES
// ============================================================================

export interface EditorEvent {
  type: EditorEventType;
  timestamp: number;
  source: string;
  data: any;
  propagate: boolean;
  preventDefault: boolean;
}

export type EditorEventType = 
  | 'canvas.element.added' | 'canvas.element.removed' | 'canvas.element.modified'
  | 'timeline.clip.added' | 'timeline.clip.removed' | 'timeline.clip.moved'
  | 'timeline.playhead.moved' | 'timeline.zoom.changed'
  | 'avatar.animation.started' | 'avatar.animation.ended'
  | 'vfx.effect.applied' | 'vfx.effect.removed'
  | 'audio.track.added' | 'audio.track.removed'
  | 'export.started' | 'export.progress' | 'export.completed' | 'export.failed'
  | 'performance.warning' | 'performance.critical'
  | 'collaboration.user.joined' | 'collaboration.user.left'
  | 'project.saved' | 'project.loaded' | 'project.error';

export interface EventListener {
  id: string;
  eventType: EditorEventType;
  callback: (event: EditorEvent) => void;
  priority: number;
  once: boolean;
}

// ============================================================================
// COMMAND SYSTEM TYPES
// ============================================================================

export interface Command {
  id: string;
  type: CommandType;
  name: string;
  description: string;
  execute: () => Promise<void> | void;
  undo: () => Promise<void> | void;
  canUndo: boolean;
  canRedo: boolean;
  timestamp: number;
  userId?: string;
  data: any;
}

export type CommandType = 
  | 'canvas.add' | 'canvas.remove' | 'canvas.modify'
  | 'timeline.add' | 'timeline.remove' | 'timeline.move'
  | 'avatar.animate' | 'avatar.modify'
  | 'vfx.apply' | 'vfx.remove'
  | 'audio.add' | 'audio.remove' | 'audio.modify'
  | 'project.save' | 'project.load'
  | 'batch' | 'macro';

export interface CommandHistory {
  commands: Command[];
  currentIndex: number;
  maxSize: number;
  canUndo: boolean;
  canRedo: boolean;
}

// ============================================================================
// PROJECT STATE TYPES
// ============================================================================

export interface EditorState {
  project: EditorProject;
  canvas: CanvasState;
  timeline: TimelineState;
  avatars: AvatarState;
  vfx: VFXState;
  audio: AudioState;
  export: ExportState;
  performance: PerformanceState;
  collaboration: CollaborationState;
  ui: UIState;
  history: CommandHistory;
  settings: EditorSettings;
}

export interface EditorProject {
  id: string;
  name: string;
  description: string;
  version: string;
  createdAt: number;
  updatedAt: number;
  lastSavedAt: number;
  autoSaveEnabled: boolean;
  collaborators: string[];
  settings: ProjectSettings;
  metadata: ProjectMetadata;
}

export interface ProjectMetadata {
  duration: number;
  fps: number;
  resolution: Resolution;
  aspectRatio: string;
  colorSpace: string;
  tags: string[];
  category: string;
  language: string;
}

export interface CanvasState {
  config: CanvasConfig;
  elements: CanvasElement[];
  selectedElements: string[];
  clipboard: CanvasElement[];
  camera: CameraState;
  grid: GridState;
  guides: Guide[];
}

export interface CameraState {
  position: Vector3D;
  rotation: Vector3D;
  zoom: number;
  fov: number;
  near: number;
  far: number;
}

export interface GridState {
  visible: boolean;
  size: number;
  subdivisions: number;
  color: string;
  opacity: number;
}

export interface Guide {
  id: string;
  type: 'horizontal' | 'vertical';
  position: number;
  color: string;
  locked: boolean;
}

export interface TimelineState {
  config: TimelineConfig;
  tracks: TimelineTrack[];
  playheadPosition: number;
  selectedClips: string[];
  zoomLevel: number;
  scrollPosition: number;
  loopEnabled: boolean;
  loopStart: number;
  loopEnd: number;
}

export interface AvatarState {
  avatars: Avatar3D[];
  activeAvatar?: string;
  animations: AvatarAnimation[];
  expressions: AvatarExpression[];
  gestures: AvatarGesture[];
  lipSyncData: LipSyncData[];
}

export interface AvatarAnimation {
  id: string;
  avatarId: string;
  name: string;
  startTime: number;
  duration: number;
  loop: boolean;
  speed: number;
  blendMode: string;
  keyframes: AnimationKeyframe[];
}

export interface AnimationKeyframe {
  time: number;
  boneName: string;
  position?: Vector3D;
  rotation?: Vector3D;
  scale?: Vector3D;
  easing: EasingType;
}

export interface VFXState {
  effects: VFXEffect[];
  activeEffects: string[];
  presets: VFXPreset[];
  particleSystems: ParticleSystem[];
  shaders: CustomShader[];
}

export interface VFXPreset {
  id: string;
  name: string;
  description: string;
  effects: string[];
  parameters: Record<string, any>;
  thumbnailUrl: string;
}

export interface CustomShader {
  id: string;
  name: string;
  vertexShader: string;
  fragmentShader: string;
  uniforms: ShaderUniform[];
  attributes: ShaderAttribute[];
}

export interface ShaderUniform {
  name: string;
  type: 'float' | 'vec2' | 'vec3' | 'vec4' | 'mat3' | 'mat4' | 'sampler2D';
  value: any;
}

export interface ShaderAttribute {
  name: string;
  type: 'float' | 'vec2' | 'vec3' | 'vec4';
  location: number;
}

export interface AudioState {
  config: AudioConfig;
  tracks: AudioTrack[];
  masterTrack: AudioTrack;
  selectedTracks: string[];
  playbackState: AudioPlaybackState;
  spatialAudio: SpatialAudioState;
}

export interface AudioPlaybackState {
  isPlaying: boolean;
  currentTime: number;
  volume: number;
  muted: boolean;
  looping: boolean;
}

export interface SpatialAudioState {
  enabled: boolean;
  listenerPosition: Vector3D;
  listenerOrientation: Vector3D;
  environmentPreset: string;
}

export interface ExportState {
  isExporting: boolean;
  progress: number;
  currentConfig: ExportConfig;
  queue: ExportJob[];
  history: ExportJob[];
  presets: ExportPreset[];
}

export interface ExportJob {
  id: string;
  projectId: string;
  config: ExportConfig;
  status: ExportJobStatus;
  progress: number;
  startTime: number;
  endTime?: number;
  outputPath?: string;
  errorMessage?: string;
}

export type ExportJobStatus = 
  | 'queued' | 'preparing' | 'rendering' | 'encoding'
  | 'finalizing' | 'completed' | 'failed' | 'cancelled';

export interface ExportPreset {
  id: string;
  name: string;
  description: string;
  config: ExportConfig;
  isDefault: boolean;
  category: string;
}

export interface UIState {
  theme: 'light' | 'dark' | 'auto';
  layout: LayoutConfig;
  panels: PanelState[];
  modals: ModalState[];
  notifications: Notification[];
  shortcuts: KeyboardShortcut[];
}

export interface LayoutConfig {
  leftPanelWidth: number;
  rightPanelWidth: number;
  bottomPanelHeight: number;
  timelineHeight: number;
  canvasHeight: number;
}

export interface PanelState {
  id: string;
  visible: boolean;
  collapsed: boolean;
  position: 'left' | 'right' | 'bottom' | 'floating';
  size: { width: number; height: number };
  order: number;
}

export interface ModalState {
  id: string;
  type: string;
  visible: boolean;
  data: any;
  closable: boolean;
}

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: number;
  duration?: number;
  actions?: NotificationAction[];
}

export interface NotificationAction {
  label: string;
  action: () => void;
  style: 'primary' | 'secondary' | 'danger';
}

export interface KeyboardShortcut {
  id: string;
  keys: string[];
  action: string;
  description: string;
  context: 'global' | 'canvas' | 'timeline' | 'modal';
  enabled: boolean;
}

export interface EditorSettings {
  general: GeneralSettings;
  canvas: CanvasSettings;
  timeline: TimelineSettings;
  audio: AudioSettings;
  performance: PerformanceSettings;
  collaboration: CollaborationSettings;
  export: ExportSettings;
}

export interface GeneralSettings {
  language: string;
  theme: 'light' | 'dark' | 'auto';
  autoSave: boolean;
  autoSaveInterval: number;
  undoLevels: number;
  showTooltips: boolean;
  enableAnimations: boolean;
}

export interface CanvasSettings {
  defaultZoom: number;
  snapToGrid: boolean;
  showGrid: boolean;
  gridSize: number;
  showGuides: boolean;
  magneticSnap: boolean;
  selectionColor: string;
}

export interface TimelineSettings {
  defaultTrackHeight: number;
  showWaveforms: boolean;
  showThumbnails: boolean;
  snapToFrames: boolean;
  magneticSnap: boolean;
  playheadFollowsPlayback: boolean;
}

export interface AudioSettings {
  sampleRate: number;
  bufferSize: number;
  enableSpatialAudio: boolean;
  masterVolume: number;
  enableMetronome: boolean;
  metronomeVolume: number;
}

export interface PerformanceSettings {
  renderQuality: 'low' | 'medium' | 'high' | 'ultra';
  enableGPUAcceleration: boolean;
  maxMemoryUsage: number;
  enableCaching: boolean;
  cacheSize: number;
  enableMultithreading: boolean;
}

export interface CollaborationSettings {
  enableRealTimeSync: boolean;
  showCursors: boolean;
  showUserNames: boolean;
  enableChat: boolean;
  enableVoiceChat: boolean;
  autoResolveConflicts: boolean;
}

export interface ExportSettings {
  defaultFormat: ExportFormat;
  defaultQuality: ExportQuality;
  defaultResolution: Resolution;
  enableHardwareAcceleration: boolean;
  outputDirectory: string;
  filenameTemplate: string;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

export type OptionalFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: number;
}

export interface PaginatedResponse<T> extends APIResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ============================================================================
// HOOK TYPES
// ============================================================================

export interface UseCanvasReturn {
  canvas: CanvasState;
  addElement: (element: Omit<CanvasElement, 'id' | 'createdAt' | 'updatedAt'>) => void;
  removeElement: (elementId: string) => void;
  updateElement: (elementId: string, updates: Partial<CanvasElement>) => void;
  selectElements: (elementIds: string[]) => void;
  clearSelection: () => void;
  duplicateElements: (elementIds: string[]) => void;
  groupElements: (elementIds: string[]) => void;
  ungroupElements: (groupId: string) => void;
}

export interface UseTimelineReturn {
  timeline: TimelineState;
  addTrack: (track: Omit<TimelineTrack, 'id'>) => void;
  removeTrack: (trackId: string) => void;
  addClip: (clip: Omit<TimelineClip, 'id'>) => void;
  removeClip: (clipId: string) => void;
  moveClip: (clipId: string, newStartTime: number, newTrackId?: string) => void;
  setPlayheadPosition: (position: number) => void;
  play: () => void;
  pause: () => void;
  stop: () => void;
}

export interface UsePerformanceReturn {
  metrics: EditorPerformanceMetrics;
  isMonitoring: boolean;
  startMonitoring: () => void;
  stopMonitoring: () => void;
  getAverageMetrics: (timeRange: number) => EditorPerformanceMetrics;
  getPerformanceReport: () => PerformanceReport;
}

export interface PerformanceReport {
  overall: 'excellent' | 'good' | 'fair' | 'poor';
  fps: { average: number; min: number; max: number };
  memory: { average: number; peak: number };
  recommendations: string[];
  bottlenecks: string[];
}