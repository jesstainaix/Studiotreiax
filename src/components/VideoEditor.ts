import { EventEmitter } from '../utils/EventEmitter';

// Interfaces
export interface VideoClip {
  id: string;
  name: string;
  type: 'video' | 'audio' | 'image' | 'text';
  source: string;
  duration: number;
  startTime: number;
  endTime: number;
  trackIndex: number;
  position: number;
  trimStart: number;
  trimEnd: number;
  volume: number;
  opacity: number;
  speed: number;
  effects: VideoEffect[];
  transitions: VideoTransition[];
  metadata: ClipMetadata;
}

export interface VideoEffect {
  id: string;
  type: EffectType;
  name: string;
  parameters: Record<string, any>;
  enabled: boolean;
  startTime: number;
  endTime: number;
  intensity: number;
}

export interface VideoTransition {
  id: string;
  type: TransitionType;
  duration: number;
  easing: EasingType;
  parameters: Record<string, any>;
}

export interface Timeline {
  id: string;
  name: string;
  duration: number;
  fps: number;
  resolution: Resolution;
  tracks: Track[];
  currentTime: number;
  zoomLevel: number;
  snapToGrid: boolean;
  gridSize: number;
}

export interface Track {
  id: string;
  name: string;
  type: TrackType;
  height: number;
  locked: boolean;
  muted: boolean;
  solo: boolean;
  visible: boolean;
  clips: VideoClip[];
  volume: number;
  color: string;
}

export interface ClipMetadata {
  originalDuration: number;
  fileSize: number;
  format: string;
  codec: string;
  bitrate: number;
  resolution?: Resolution;
  frameRate?: number;
  channels?: number;
  sampleRate?: number;
  thumbnails: string[];
}

export interface Resolution {
  width: number;
  height: number;
}

export interface ExportSettings {
  format: VideoFormat;
  quality: QualityPreset;
  resolution: Resolution;
  fps: number;
  bitrate: number;
  codec: string;
  audioCodec: string;
  audioBitrate: number;
  outputPath: string;
}

export interface RenderProgress {
  percentage: number;
  currentFrame: number;
  totalFrames: number;
  estimatedTime: number;
  speed: number;
  status: RenderStatus;
}

export interface KeyFrame {
  time: number;
  property: string;
  value: any;
  easing: EasingType;
}

export interface EditHistory {
  id: string;
  action: string;
  timestamp: number;
  data: any;
  description: string;
}

// Enums
export enum EffectType {
  COLOR_CORRECTION = 'color_correction',
  BLUR = 'blur',
  SHARPEN = 'sharpen',
  NOISE_REDUCTION = 'noise_reduction',
  STABILIZATION = 'stabilization',
  CHROMAKEY = 'chromakey',
  DISTORTION = 'distortion',
  GLOW = 'glow',
  SHADOW = 'shadow',
  OUTLINE = 'outline'
}

export enum TransitionType {
  CUT = 'cut',
  FADE = 'fade',
  DISSOLVE = 'dissolve',
  WIPE = 'wipe',
  SLIDE = 'slide',
  ZOOM = 'zoom',
  ROTATE = 'rotate',
  FLIP = 'flip'
}

export enum TrackType {
  VIDEO = 'video',
  AUDIO = 'audio',
  TEXT = 'text',
  OVERLAY = 'overlay'
}

export enum EasingType {
  LINEAR = 'linear',
  EASE_IN = 'ease-in',
  EASE_OUT = 'ease-out',
  EASE_IN_OUT = 'ease-in-out',
  BOUNCE = 'bounce',
  ELASTIC = 'elastic'
}

export enum VideoFormat {
  MP4 = 'mp4',
  MOV = 'mov',
  AVI = 'avi',
  WEBM = 'webm',
  MKV = 'mkv'
}

export enum QualityPreset {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  ULTRA = 'ultra',
  CUSTOM = 'custom'
}

export enum RenderStatus {
  IDLE = 'idle',
  PREPARING = 'preparing',
  RENDERING = 'rendering',
  COMPLETED = 'completed',
  ERROR = 'error',
  CANCELLED = 'cancelled'
}

// Main Video Editor Class
export class VideoEditor extends EventEmitter {
  private timeline: Timeline;
  private history: EditHistory[];
  private historyIndex: number;
  private isPlaying: boolean;
  private playbackSpeed: number;
  private previewCanvas: HTMLCanvasElement | null;
  private audioContext: AudioContext | null;
  private renderWorkers: Worker[];
  private maxHistorySize: number;

  constructor() {
    super();
    this.timeline = this.createDefaultTimeline();
    this.history = [];
    this.historyIndex = -1;
    this.isPlaying = false;
    this.playbackSpeed = 1.0;
    this.previewCanvas = null;
    this.audioContext = null;
    this.renderWorkers = [];
    this.maxHistorySize = 100;
  }

  // Timeline Management
  createDefaultTimeline(): Timeline {
    return {
      id: this.generateId(),
      name: 'Novo Projeto',
      duration: 0,
      fps: 30,
      resolution: { width: 1920, height: 1080 },
      tracks: [
        this.createTrack('Video 1', TrackType.VIDEO),
        this.createTrack('Audio 1', TrackType.AUDIO)
      ],
      currentTime: 0,
      zoomLevel: 1.0,
      snapToGrid: true,
      gridSize: 1000 // 1 second in milliseconds
    };
  }

  createTrack(name: string, type: TrackType): Track {
    return {
      id: this.generateId(),
      name,
      type,
      height: type === TrackType.VIDEO ? 80 : 60,
      locked: false,
      muted: false,
      solo: false,
      visible: true,
      clips: [],
      volume: 1.0,
      color: this.getTrackColor(type)
    };
  }

  getTrackColor(type: TrackType): string {
    const colors = {
      [TrackType.VIDEO]: '#3b82f6',
      [TrackType.AUDIO]: '#10b981',
      [TrackType.TEXT]: '#f59e0b',
      [TrackType.OVERLAY]: '#8b5cf6'
    };
    return colors[type];
  }

  // Clip Management
  async addClip(file: File, trackIndex: number, position: number): Promise<VideoClip> {
    const metadata = await this.analyzeFile(file);
    const clip: VideoClip = {
      id: this.generateId(),
      name: file.name,
      type: this.getClipType(file.type),
      source: URL.createObjectURL(file),
      duration: metadata.originalDuration,
      startTime: position,
      endTime: position + metadata.originalDuration,
      trackIndex,
      position,
      trimStart: 0,
      trimEnd: metadata.originalDuration,
      volume: 1.0,
      opacity: 1.0,
      speed: 1.0,
      effects: [],
      transitions: [],
      metadata
    };

    this.timeline.tracks[trackIndex].clips.push(clip);
    this.updateTimelineDuration();
    this.addToHistory('add_clip', clip, `Adicionado clipe: ${clip.name}`);
    this.emit('clipAdded', clip);
    
    return clip;
  }

  removeClip(clipId: string): void {
    for (const track of this.timeline.tracks) {
      const clipIndex = track.clips.findIndex(c => c.id === clipId);
      if (clipIndex !== -1) {
        const clip = track.clips[clipIndex];
        track.clips.splice(clipIndex, 1);
        this.updateTimelineDuration();
        this.addToHistory('remove_clip', clip, `Removido clipe: ${clip.name}`);
        this.emit('clipRemoved', clip);
        break;
      }
    }
  }

  moveClip(clipId: string, newPosition: number, newTrackIndex?: number): void {
    const clip = this.findClip(clipId);
    if (!clip) return;

    const oldPosition = clip.position;
    const oldTrackIndex = clip.trackIndex;

    if (newTrackIndex !== undefined && newTrackIndex !== oldTrackIndex) {
      // Move to different track
      const oldTrack = this.timeline.tracks[oldTrackIndex];
      const newTrack = this.timeline.tracks[newTrackIndex];
      
      const clipIndex = oldTrack.clips.findIndex(c => c.id === clipId);
      if (clipIndex !== -1) {
        oldTrack.clips.splice(clipIndex, 1);
        clip.trackIndex = newTrackIndex;
        newTrack.clips.push(clip);
      }
    }

    clip.position = newPosition;
    clip.startTime = newPosition;
    clip.endTime = newPosition + (clip.trimEnd - clip.trimStart);

    this.addToHistory('move_clip', {
      clipId,
      oldPosition,
      newPosition,
      oldTrackIndex,
      newTrackIndex
    }, `Movido clipe: ${clip.name}`);
    
    this.emit('clipMoved', clip);
  }

  trimClip(clipId: string, trimStart: number, trimEnd: number): void {
    const clip = this.findClip(clipId);
    if (!clip) return;

    const oldTrimStart = clip.trimStart;
    const oldTrimEnd = clip.trimEnd;

    clip.trimStart = Math.max(0, trimStart);
    clip.trimEnd = Math.min(clip.metadata.originalDuration, trimEnd);
    clip.duration = clip.trimEnd - clip.trimStart;
    clip.endTime = clip.startTime + clip.duration;

    this.updateTimelineDuration();
    this.addToHistory('trim_clip', {
      clipId,
      oldTrimStart,
      oldTrimEnd,
      newTrimStart: clip.trimStart,
      newTrimEnd: clip.trimEnd
    }, `Cortado clipe: ${clip.name}`);
    
    this.emit('clipTrimmed', clip);
  }

  splitClip(clipId: string, splitTime: number): VideoClip[] {
    const clip = this.findClip(clipId);
    if (!clip) return [];

    const relativeTime = splitTime - clip.startTime;
    if (relativeTime <= 0 || relativeTime >= clip.duration) return [clip];

    // Create second part
    const secondClip: VideoClip = {
      ...clip,
      id: this.generateId(),
      name: `${clip.name} (2)`,
      startTime: splitTime,
      position: splitTime,
      trimStart: clip.trimStart + relativeTime,
      duration: clip.duration - relativeTime
    };
    secondClip.endTime = secondClip.startTime + secondClip.duration;

    // Update first part
    clip.duration = relativeTime;
    clip.trimEnd = clip.trimStart + relativeTime;
    clip.endTime = clip.startTime + clip.duration;

    // Add second clip to track
    const track = this.timeline.tracks[clip.trackIndex];
    track.clips.push(secondClip);

    this.addToHistory('split_clip', {
      originalClipId: clipId,
      newClipId: secondClip.id,
      splitTime
    }, `Dividido clipe: ${clip.name}`);
    
    this.emit('clipSplit', [clip, secondClip]);
    return [clip, secondClip];
  }

  // Effects Management
  addEffect(clipId: string, effectType: EffectType, parameters: Record<string, any> = {}): VideoEffect {
    const clip = this.findClip(clipId);
    if (!clip) throw new Error('Clipe não encontrado');

    const effect: VideoEffect = {
      id: this.generateId(),
      type: effectType,
      name: this.getEffectName(effectType),
      parameters,
      enabled: true,
      startTime: 0,
      endTime: clip.duration,
      intensity: 1.0
    };

    clip.effects.push(effect);
    this.addToHistory('add_effect', { clipId, effect }, `Adicionado efeito: ${effect.name}`);
    this.emit('effectAdded', effect);
    
    return effect;
  }

  removeEffect(clipId: string, effectId: string): void {
    const clip = this.findClip(clipId);
    if (!clip) return;

    const effectIndex = clip.effects.findIndex(e => e.id === effectId);
    if (effectIndex !== -1) {
      const effect = clip.effects[effectIndex];
      clip.effects.splice(effectIndex, 1);
      this.addToHistory('remove_effect', { clipId, effect }, `Removido efeito: ${effect.name}`);
      this.emit('effectRemoved', effect);
    }
  }

  updateEffect(clipId: string, effectId: string, parameters: Record<string, any>): void {
    const clip = this.findClip(clipId);
    if (!clip) return;

    const effect = clip.effects.find(e => e.id === effectId);
    if (effect) {
      const oldParameters = { ...effect.parameters };
      effect.parameters = { ...effect.parameters, ...parameters };
      this.addToHistory('update_effect', {
        clipId,
        effectId,
        oldParameters,
        newParameters: effect.parameters
      }, `Atualizado efeito: ${effect.name}`);
      this.emit('effectUpdated', effect);
    }
  }

  // Playback Control
  play(): void {
    if (!this.isPlaying) {
      this.isPlaying = true;
      this.startPlayback();
      this.emit('playbackStarted');
    }
  }

  pause(): void {
    if (this.isPlaying) {
      this.isPlaying = false;
      this.stopPlayback();
      this.emit('playbackPaused');
    }
  }

  stop(): void {
    this.isPlaying = false;
    this.timeline.currentTime = 0;
    this.stopPlayback();
    this.emit('playbackStopped');
  }

  seek(time: number): void {
    this.timeline.currentTime = Math.max(0, Math.min(time, this.timeline.duration));
    this.updatePreview();
    this.emit('timeChanged', this.timeline.currentTime);
  }

  setPlaybackSpeed(speed: number): void {
    this.playbackSpeed = Math.max(0.1, Math.min(4.0, speed));
    this.emit('speedChanged', this.playbackSpeed);
  }

  // Export and Rendering
  async exportVideo(settings: ExportSettings): Promise<void> {
    this.emit('renderStarted');
    
    try {
      const totalFrames = Math.ceil(this.timeline.duration * settings.fps / 1000);
      let currentFrame = 0;

      for (let frame = 0; frame < totalFrames; frame++) {
        const time = (frame / settings.fps) * 1000;
        await this.renderFrame(time, settings);
        
        currentFrame++;
        const progress: RenderProgress = {
          percentage: (currentFrame / totalFrames) * 100,
          currentFrame,
          totalFrames,
          estimatedTime: this.calculateEstimatedTime(currentFrame, totalFrames),
          speed: this.calculateRenderSpeed(),
          status: RenderStatus.RENDERING
        };
        
        this.emit('renderProgress', progress);
      }

      this.emit('renderCompleted', settings.outputPath);
    } catch (error) {
      this.emit('renderError', error);
    }
  }

  // History Management
  undo(): void {
    if (this.historyIndex >= 0) {
      const action = this.history[this.historyIndex];
      this.revertAction(action);
      this.historyIndex--;
      this.emit('undoPerformed', action);
    }
  }

  redo(): void {
    if (this.historyIndex < this.history.length - 1) {
      this.historyIndex++;
      const action = this.history[this.historyIndex];
      this.applyAction(action);
      this.emit('redoPerformed', action);
    }
  }

  // Utility Methods
  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  private getClipType(mimeType: string): 'video' | 'audio' | 'image' | 'text' {
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    if (mimeType.startsWith('image/')) return 'image';
    return 'text';
  }

  private async analyzeFile(file: File): Promise<ClipMetadata> {
    // Mock implementation - in real app, would use FFmpeg or similar
    return {
      originalDuration: 10000, // 10 seconds
      fileSize: file.size,
      format: file.type,
      codec: 'h264',
      bitrate: 5000000,
      resolution: { width: 1920, height: 1080 },
      frameRate: 30,
      thumbnails: []
    };
  }

  private findClip(clipId: string): VideoClip | null {
    for (const track of this.timeline.tracks) {
      const clip = track.clips.find(c => c.id === clipId);
      if (clip) return clip;
    }
    return null;
  }

  private updateTimelineDuration(): void {
    let maxDuration = 0;
    for (const track of this.timeline.tracks) {
      for (const clip of track.clips) {
        maxDuration = Math.max(maxDuration, clip.endTime);
      }
    }
    this.timeline.duration = maxDuration;
    this.emit('durationChanged', maxDuration);
  }

  private addToHistory(action: string, data: any, description: string): void {
    // Remove any actions after current index
    this.history = this.history.slice(0, this.historyIndex + 1);
    
    const historyItem: EditHistory = {
      id: this.generateId(),
      action,
      timestamp: Date.now(),
      data,
      description
    };
    
    this.history.push(historyItem);
    this.historyIndex++;
    
    // Limit history size
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
      this.historyIndex--;
    }
  }

  private revertAction(action: EditHistory): void {
    // Implementation for reverting specific actions
    // This would contain the logic to undo each type of action
  }

  private applyAction(action: EditHistory): void {
    // Implementation for applying specific actions
    // This would contain the logic to redo each type of action
  }

  private getEffectName(type: EffectType): string {
    const names = {
      [EffectType.COLOR_CORRECTION]: 'Correção de Cor',
      [EffectType.BLUR]: 'Desfoque',
      [EffectType.SHARPEN]: 'Nitidez',
      [EffectType.NOISE_REDUCTION]: 'Redução de Ruído',
      [EffectType.STABILIZATION]: 'Estabilização',
      [EffectType.CHROMAKEY]: 'Chroma Key',
      [EffectType.DISTORTION]: 'Distorção',
      [EffectType.GLOW]: 'Brilho',
      [EffectType.SHADOW]: 'Sombra',
      [EffectType.OUTLINE]: 'Contorno'
    };
    return names[type];
  }

  private startPlayback(): void {
    // Implementation for starting video playback
  }

  private stopPlayback(): void {
    // Implementation for stopping video playback
  }

  private updatePreview(): void {
    // Implementation for updating preview canvas
  }

  private async renderFrame(time: number, settings: ExportSettings): Promise<void> {
    // Implementation for rendering individual frames
  }

  private calculateEstimatedTime(currentFrame: number, totalFrames: number): number {
    // Calculate estimated remaining time based on current progress
    return 0;
  }

  private calculateRenderSpeed(): number {
    // Calculate current rendering speed (frames per second)
    return 0;
  }

  // Getters
  getTimeline(): Timeline {
    return this.timeline;
  }

  getCurrentTime(): number {
    return this.timeline.currentTime;
  }

  getDuration(): number {
    return this.timeline.duration;
  }

  isPlayingVideo(): boolean {
    return this.isPlaying;
  }

  getPlaybackSpeed(): number {
    return this.playbackSpeed;
  }

  getHistory(): EditHistory[] {
    return this.history;
  }

  canUndo(): boolean {
    return this.historyIndex >= 0;
  }

  canRedo(): boolean {
    return this.historyIndex < this.history.length - 1;
  }
}

// Export singleton instance
export const videoEditor = new VideoEditor();