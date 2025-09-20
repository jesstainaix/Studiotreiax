import { EventEmitter } from '../utils/EventEmitter';

// Interfaces para o sistema VFX
export interface VFXEffect {
  id: string;
  name: string;
  type: VFXEffectType;
  category: VFXCategory;
  parameters: VFXParameter[];
  previewUrl?: string;
  thumbnailUrl?: string;
  duration?: number;
  intensity: number;
  blendMode: BlendMode;
  keyframes: Keyframe[];
  metadata: EffectMetadata;
}

export interface VFXParameter {
  id: string;
  name: string;
  type: 'number' | 'color' | 'boolean' | 'select' | 'range' | 'vector2' | 'vector3';
  value: any;
  min?: number;
  max?: number;
  step?: number;
  options?: string[];
  description?: string;
}

export interface Keyframe {
  time: number;
  value: any;
  easing: EasingType;
  interpolation: InterpolationType;
}

export interface VFXTransition {
  id: string;
  name: string;
  type: TransitionType;
  duration: number;
  easing: EasingType;
  parameters: VFXParameter[];
  previewUrl?: string;
}

export interface VFXComposition {
  id: string;
  name: string;
  layers: VFXLayer[];
  duration: number;
  resolution: Resolution;
  frameRate: number;
  backgroundColor: string;
  effects: VFXEffect[];
}

export interface VFXLayer {
  id: string;
  name: string;
  type: LayerType;
  source?: string;
  effects: VFXEffect[];
  transform: Transform;
  opacity: number;
  blendMode: BlendMode;
  visible: boolean;
  locked: boolean;
  startTime: number;
  duration: number;
}

export interface Transform {
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  scale: { x: number; y: number; z: number };
  anchor: { x: number; y: number };
}

export interface Resolution {
  width: number;
  height: number;
}

export interface EffectMetadata {
  author: string;
  version: string;
  description: string;
  tags: string[];
  complexity: 'low' | 'medium' | 'high';
  gpuAccelerated: boolean;
  supportedFormats: string[];
}

export interface RenderSettings {
  quality: 'draft' | 'preview' | 'high' | 'ultra';
  format: 'mp4' | 'mov' | 'avi' | 'webm';
  codec: string;
  bitrate: number;
  frameRate: number;
  resolution: Resolution;
  enableGPU: boolean;
  multiThreading: boolean;
  outputPath: string;
}

export interface VFXPreset {
  id: string;
  name: string;
  category: string;
  effects: VFXEffect[];
  transitions: VFXTransition[];
  description: string;
  thumbnailUrl?: string;
}

// Enums
export enum VFXEffectType {
  PARTICLE = 'particle',
  LIGHTING = 'lighting',
  COLOR_CORRECTION = 'color_correction',
  DISTORTION = 'distortion',
  BLUR = 'blur',
  GLOW = 'glow',
  CHROMATIC_ABERRATION = 'chromatic_aberration',
  FILM_GRAIN = 'film_grain',
  VIGNETTE = 'vignette',
  LENS_FLARE = 'lens_flare',
  MOTION_BLUR = 'motion_blur',
  DEPTH_OF_FIELD = 'depth_of_field',
  FIRE = 'fire',
  SMOKE = 'smoke',
  WATER = 'water',
  EXPLOSION = 'explosion',
  MAGIC = 'magic',
  HOLOGRAM = 'hologram',
  GLITCH = 'glitch',
  NEON = 'neon'
}

export enum VFXCategory {
  BASIC = 'basic',
  ADVANCED = 'advanced',
  CINEMATIC = 'cinematic',
  STYLIZED = 'stylized',
  REALISTIC = 'realistic',
  ABSTRACT = 'abstract',
  RETRO = 'retro',
  FUTURISTIC = 'futuristic'
}

export enum TransitionType {
  FADE = 'fade',
  DISSOLVE = 'dissolve',
  WIPE = 'wipe',
  SLIDE = 'slide',
  ZOOM = 'zoom',
  ROTATE = 'rotate',
  MORPH = 'morph',
  PARTICLE_TRANSITION = 'particle_transition',
  LIQUID = 'liquid',
  SHATTER = 'shatter'
}

export enum BlendMode {
  NORMAL = 'normal',
  MULTIPLY = 'multiply',
  SCREEN = 'screen',
  OVERLAY = 'overlay',
  SOFT_LIGHT = 'soft_light',
  HARD_LIGHT = 'hard_light',
  COLOR_DODGE = 'color_dodge',
  COLOR_BURN = 'color_burn',
  DARKEN = 'darken',
  LIGHTEN = 'lighten',
  DIFFERENCE = 'difference',
  EXCLUSION = 'exclusion'
}

export enum EasingType {
  LINEAR = 'linear',
  EASE_IN = 'ease-in',
  EASE_OUT = 'ease-out',
  EASE_IN_OUT = 'ease-in-out',
  BOUNCE = 'bounce',
  ELASTIC = 'elastic',
  BACK = 'back'
}

export enum InterpolationType {
  LINEAR = 'linear',
  BEZIER = 'bezier',
  STEP = 'step'
}

export enum LayerType {
  VIDEO = 'video',
  IMAGE = 'image',
  TEXT = 'text',
  SHAPE = 'shape',
  SOLID = 'solid',
  ADJUSTMENT = 'adjustment',
  PARTICLE = 'particle'
}

// Sistema VFX principal
export class VFXSystem extends EventEmitter {
  private effects: Map<string, VFXEffect> = new Map();
  private transitions: Map<string, VFXTransition> = new Map();
  private compositions: Map<string, VFXComposition> = new Map();
  private presets: Map<string, VFXPreset> = new Map();
  private renderQueue: VFXComposition[] = [];
  private isRendering = false;
  private gpuContext: WebGLRenderingContext | null = null;

  constructor() {
    super();
    this.initializeBuiltInEffects();
    this.initializeBuiltInTransitions();
    this.initializePresets();
  }

  // Inicialização
  async initialize(): Promise<void> {
    try {
      // Inicializar contexto WebGL para aceleração GPU
      const canvas = document.createElement('canvas');
      this.gpuContext = canvas.getContext('webgl2') || canvas.getContext('webgl');
      
      if (this.gpuContext) {
      } else {
        console.warn('VFX System: GPU acceleration not available, using CPU fallback');
      }

      this.emit('initialized');
    } catch (error) {
      console.error('Failed to initialize VFX System:', error);
      throw error;
    }
  }

  // Gerenciamento de efeitos
  getEffect(id: string): VFXEffect | undefined {
    return this.effects.get(id);
  }

  getAllEffects(): VFXEffect[] {
    return Array.from(this.effects.values());
  }

  getEffectsByCategory(category: VFXCategory): VFXEffect[] {
    return this.getAllEffects().filter(effect => effect.category === category);
  }

  getEffectsByType(type: VFXEffectType): VFXEffect[] {
    return this.getAllEffects().filter(effect => effect.type === type);
  }

  addCustomEffect(effect: VFXEffect): void {
    this.effects.set(effect.id, effect);
    this.emit('effectAdded', effect);
  }

  removeEffect(id: string): boolean {
    const removed = this.effects.delete(id);
    if (removed) {
      this.emit('effectRemoved', id);
    }
    return removed;
  }

  // Gerenciamento de transições
  getTransition(id: string): VFXTransition | undefined {
    return this.transitions.get(id);
  }

  getAllTransitions(): VFXTransition[] {
    return Array.from(this.transitions.values());
  }

  getTransitionsByType(type: TransitionType): VFXTransition[] {
    return this.getAllTransitions().filter(transition => transition.type === type);
  }

  addCustomTransition(transition: VFXTransition): void {
    this.transitions.set(transition.id, transition);
    this.emit('transitionAdded', transition);
  }

  // Gerenciamento de composições
  createComposition(name: string, settings: Partial<VFXComposition>): VFXComposition {
    const composition: VFXComposition = {
      id: `comp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      layers: [],
      duration: 10,
      resolution: { width: 1920, height: 1080 },
      frameRate: 30,
      backgroundColor: '#000000',
      effects: [],
      ...settings
    };

    this.compositions.set(composition.id, composition);
    this.emit('compositionCreated', composition);
    return composition;
  }

  getComposition(id: string): VFXComposition | undefined {
    return this.compositions.get(id);
  }

  updateComposition(id: string, updates: Partial<VFXComposition>): void {
    const composition = this.compositions.get(id);
    if (composition) {
      Object.assign(composition, updates);
      this.emit('compositionUpdated', composition);
    }
  }

  deleteComposition(id: string): boolean {
    const removed = this.compositions.delete(id);
    if (removed) {
      this.emit('compositionDeleted', id);
    }
    return removed;
  }

  // Gerenciamento de layers
  addLayer(compositionId: string, layer: Omit<VFXLayer, 'id'>): VFXLayer | null {
    const composition = this.compositions.get(compositionId);
    if (!composition) return null;

    const newLayer: VFXLayer = {
      id: `layer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...layer
    };

    composition.layers.push(newLayer);
    this.emit('layerAdded', { compositionId, layer: newLayer });
    return newLayer;
  }

  removeLayer(compositionId: string, layerId: string): boolean {
    const composition = this.compositions.get(compositionId);
    if (!composition) return false;

    const index = composition.layers.findIndex(layer => layer.id === layerId);
    if (index === -1) return false;

    composition.layers.splice(index, 1);
    this.emit('layerRemoved', { compositionId, layerId });
    return true;
  }

  updateLayer(compositionId: string, layerId: string, updates: Partial<VFXLayer>): boolean {
    const composition = this.compositions.get(compositionId);
    if (!composition) return false;

    const layer = composition.layers.find(l => l.id === layerId);
    if (!layer) return false;

    Object.assign(layer, updates);
    this.emit('layerUpdated', { compositionId, layer });
    return true;
  }

  // Aplicação de efeitos
  applyEffectToLayer(compositionId: string, layerId: string, effectId: string, parameters?: Partial<VFXParameter>[]): boolean {
    const composition = this.compositions.get(compositionId);
    const effect = this.effects.get(effectId);
    
    if (!composition || !effect) return false;

    const layer = composition.layers.find(l => l.id === layerId);
    if (!layer) return false;

    const appliedEffect: VFXEffect = {
      ...effect,
      id: `applied_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      parameters: parameters ? this.mergeParameters(effect.parameters, parameters) : [...effect.parameters]
    };

    layer.effects.push(appliedEffect);
    this.emit('effectApplied', { compositionId, layerId, effect: appliedEffect });
    return true;
  }

  removeEffectFromLayer(compositionId: string, layerId: string, effectId: string): boolean {
    const composition = this.compositions.get(compositionId);
    if (!composition) return false;

    const layer = composition.layers.find(l => l.id === layerId);
    if (!layer) return false;

    const index = layer.effects.findIndex(e => e.id === effectId);
    if (index === -1) return false;

    layer.effects.splice(index, 1);
    this.emit('effectRemoved', { compositionId, layerId, effectId });
    return true;
  }

  // Renderização
  async renderComposition(compositionId: string, settings: RenderSettings): Promise<string> {
    const composition = this.compositions.get(compositionId);
    if (!composition) {
      throw new Error('Composition not found');
    }

    if (this.isRendering) {
      this.renderQueue.push(composition);
      return 'queued';
    }

    this.isRendering = true;
    this.emit('renderStarted', { compositionId, settings });

    try {
      // Simular processo de renderização
      const totalFrames = Math.ceil(composition.duration * settings.frameRate);
      
      for (let frame = 0; frame < totalFrames; frame++) {
        // Simular renderização de frame
        await this.renderFrame(composition, frame, settings);
        
        const progress = (frame + 1) / totalFrames;
        this.emit('renderProgress', { compositionId, progress, frame, totalFrames });
        
        // Pequena pausa para não bloquear a UI
        await new Promise(resolve => setTimeout(resolve, 10));
      }

      const outputPath = `${settings.outputPath}/${composition.name}_${Date.now()}.${settings.format}`;
      
      this.emit('renderCompleted', { compositionId, outputPath });
      return outputPath;
    } catch (error) {
      this.emit('renderError', { compositionId, error });
      throw error;
    } finally {
      this.isRendering = false;
      
      // Processar próximo item da fila
      if (this.renderQueue.length > 0) {
        const nextComposition = this.renderQueue.shift()!;
        setTimeout(() => this.renderComposition(nextComposition.id, settings), 100);
      }
    }
  }

  private async renderFrame(composition: VFXComposition, frameNumber: number, settings: RenderSettings): Promise<void> {
    // Implementação simplificada da renderização de frame
    const currentTime = frameNumber / settings.frameRate;
    
    // Processar cada layer
    for (const layer of composition.layers) {
      if (!layer.visible || currentTime < layer.startTime || currentTime > layer.startTime + layer.duration) {
        continue;
      }
      
      // Aplicar transformações
      await this.applyTransform(layer.transform, currentTime);
      
      // Aplicar efeitos
      for (const effect of layer.effects) {
        await this.applyEffect(effect, currentTime);
      }
    }
  }

  private async applyTransform(transform: Transform, time: number): Promise<void> {
    // Implementação da aplicação de transformações
    // Esta seria a lógica real de transformação 3D
  }

  private async applyEffect(effect: VFXEffect, time: number): Promise<void> {
    // Implementação da aplicação de efeitos
    // Esta seria a lógica real de processamento de efeitos
  }

  // Presets
  getPreset(id: string): VFXPreset | undefined {
    return this.presets.get(id);
  }

  getAllPresets(): VFXPreset[] {
    return Array.from(this.presets.values());
  }

  applyPreset(compositionId: string, presetId: string): boolean {
    const composition = this.compositions.get(compositionId);
    const preset = this.presets.get(presetId);
    
    if (!composition || !preset) return false;

    // Aplicar efeitos do preset
    composition.effects = [...preset.effects];
    
    this.emit('presetApplied', { compositionId, presetId });
    return true;
  }

  // Utilitários
  private mergeParameters(original: VFXParameter[], updates: Partial<VFXParameter>[]): VFXParameter[] {
    const merged = [...original];
    
    updates.forEach(update => {
      const index = merged.findIndex(p => p.id === update.id);
      if (index !== -1) {
        merged[index] = { ...merged[index], ...update };
      }
    });
    
    return merged;
  }

  private initializeBuiltInEffects(): void {
    // Efeitos básicos
    this.effects.set('blur_gaussian', {
      id: 'blur_gaussian',
      name: 'Gaussian Blur',
      type: VFXEffectType.BLUR,
      category: VFXCategory.BASIC,
      intensity: 1.0,
      blendMode: BlendMode.NORMAL,
      keyframes: [],
      parameters: [
        { id: 'radius', name: 'Radius', type: 'range', value: 5, min: 0, max: 50, step: 0.1 },
        { id: 'quality', name: 'Quality', type: 'select', value: 'high', options: ['low', 'medium', 'high'] }
      ],
      metadata: {
        author: 'Studio IA',
        version: '1.0.0',
        description: 'Gaussian blur effect',
        tags: ['blur', 'basic'],
        complexity: 'low',
        gpuAccelerated: true,
        supportedFormats: ['mp4', 'mov', 'webm']
      }
    });

    this.effects.set('glow_soft', {
      id: 'glow_soft',
      name: 'Soft Glow',
      type: VFXEffectType.GLOW,
      category: VFXCategory.CINEMATIC,
      intensity: 1.0,
      blendMode: BlendMode.SCREEN,
      keyframes: [],
      parameters: [
        { id: 'intensity', name: 'Intensity', type: 'range', value: 0.5, min: 0, max: 2, step: 0.01 },
        { id: 'color', name: 'Glow Color', type: 'color', value: '#ffffff' },
        { id: 'radius', name: 'Radius', type: 'range', value: 10, min: 1, max: 100, step: 1 }
      ],
      metadata: {
        author: 'Studio IA',
        version: '1.0.0',
        description: 'Soft glow effect for cinematic look',
        tags: ['glow', 'cinematic', 'light'],
        complexity: 'medium',
        gpuAccelerated: true,
        supportedFormats: ['mp4', 'mov', 'webm']
      }
    });

    // Adicionar mais efeitos...
  }

  private initializeBuiltInTransitions(): void {
    this.transitions.set('fade_in_out', {
      id: 'fade_in_out',
      name: 'Fade In/Out',
      type: TransitionType.FADE,
      duration: 1.0,
      easing: EasingType.EASE_IN_OUT,
      parameters: [
        { id: 'duration', name: 'Duration', type: 'range', value: 1.0, min: 0.1, max: 5.0, step: 0.1 }
      ]
    });

    this.transitions.set('slide_left', {
      id: 'slide_left',
      name: 'Slide Left',
      type: TransitionType.SLIDE,
      duration: 0.8,
      easing: EasingType.EASE_OUT,
      parameters: [
        { id: 'direction', name: 'Direction', type: 'select', value: 'left', options: ['left', 'right', 'up', 'down'] },
        { id: 'duration', name: 'Duration', type: 'range', value: 0.8, min: 0.1, max: 3.0, step: 0.1 }
      ]
    });
  }

  private initializePresets(): void {
    this.presets.set('cinematic_look', {
      id: 'cinematic_look',
      name: 'Cinematic Look',
      category: 'Cinematic',
      description: 'Professional cinematic color grading and effects',
      effects: [
        this.effects.get('glow_soft')!,
        // Adicionar mais efeitos do preset
      ],
      transitions: []
    });
  }

  // Cleanup
  dispose(): void {
    this.effects.clear();
    this.transitions.clear();
    this.compositions.clear();
    this.presets.clear();
    this.renderQueue = [];
    this.removeAllListeners();
  }
}

// Instância singleton
export const vfxSystem = new VFXSystem();