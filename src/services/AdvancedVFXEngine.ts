import { gsap } from 'gsap';
import * as THREE from 'three';
import { CinematicParticleSystem, CinematicParticleConfig, ParticleForce, ParticlePresets } from './CinematicParticleSystem';
import { VolumetricEffectsManager, VolumetricEffect, VolumetricEffectConfig, VolumetricPresets } from './VolumetricEffects';
import { NodeBasedCompositor, CompositorNode, NodeConnection, NodeFactory, ProcessingResult } from './NodeBasedCompositor';
import { RealTimeRenderer, RenderConfig, PerformanceConfig, LODConfig, RenderPresets } from './RealTimeRenderer';

// Interfaces para o sistema VFX avançado
export interface VFXEffect {
  id: string;
  name: string;
  type: 'transition' | 'particle' | 'shader' | 'composite' | 'distortion' | 'color' | 'lighting';
  category: string;
  enabled: boolean;
  intensity: number;
  duration: number;
  startTime: number;
  endTime: number;
  parameters: Record<string, any>;
  keyframes: VFXKeyframe[];
  blendMode: BlendMode;
  maskPath?: string;
}

export interface VFXKeyframe {
  time: number;
  properties: Record<string, any>;
  easing: string;
}

export interface VFXLayer {
  id: string;
  name: string;
  type: 'video' | 'image' | 'text' | 'shape' | 'particle' | 'effect';
  source?: string;
  effects: VFXEffect[];
  transform: VFXTransform;
  opacity: number;
  blendMode: BlendMode;
  visible: boolean;
  locked: boolean;
  startTime: number;
  duration: number;
  zIndex: number;
}

export interface VFXTransform {
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  scale: { x: number; y: number; z: number };
  anchor: { x: number; y: number };
  skew: { x: number; y: number };
}

export interface VFXComposition {
  id: string;
  name: string;
  width: number;
  height: number;
  frameRate: number;
  duration: number;
  backgroundColor: string;
  layers: VFXLayer[];
  globalEffects: VFXEffect[];
  audioTracks: VFXAudioTrack[];
  metadata: {
    createdAt: Date;
    updatedAt: Date;
    version: string;
    author: string;
  };
}

export interface VFXAudioTrack {
  id: string;
  name: string;
  source: string;
  volume: number;
  startTime: number;
  duration: number;
  effects: AudioEffect[];
}

export interface AudioEffect {
  id: string;
  type: 'reverb' | 'delay' | 'distortion' | 'filter' | 'compressor';
  parameters: Record<string, any>;
  enabled: boolean;
}

export type BlendMode = 
  | 'normal' | 'multiply' | 'screen' | 'overlay' | 'soft-light' | 'hard-light'
  | 'color-dodge' | 'color-burn' | 'darken' | 'lighten' | 'difference'
  | 'exclusion' | 'hue' | 'saturation' | 'color' | 'luminosity';

export interface RenderSettings {
  quality: 'draft' | 'preview' | 'high' | 'ultra';
  format: 'mp4' | 'webm' | 'mov' | 'avi';
  codec: 'h264' | 'h265' | 'vp9' | 'av1';
  bitrate: number;
  resolution: { width: number; height: number };
  frameRate: number;
  audioQuality: number;
  enableGPUAcceleration: boolean;
  multiThreading: boolean;
}

// Sistema VFX Avançado
export class AdvancedVFXEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private webglCanvas: HTMLCanvasElement;
  private gl: WebGLRenderingContext;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private composition: VFXComposition | null = null;
  private isPlaying = false;
  private currentTime = 0;
  private animationFrame: number | null = null;
  private shaderPrograms: Map<string, WebGLProgram> = new Map();
  private textures: Map<string, WebGLTexture> = new Map();
  private frameBuffers: Map<string, WebGLFramebuffer> = new Map();
  private audioContext: AudioContext | null = null;
  private audioNodes: Map<string, AudioNode> = new Map();
  private particleSystems: Map<string, CinematicParticleSystem> = new Map();
  private globalForces: ParticleForce[] = [];
  private volumetricManager?: VolumetricEffectsManager;
  private volumetricEffects: Map<string, VolumetricEffect> = new Map();
  private nodeCompositor?: NodeBasedCompositor;
  private compositorNodes: Map<string, CompositorNode> = new Map();
  private compositorConnections: Map<string, NodeConnection> = new Map();
  private realTimeRenderer?: RealTimeRenderer;
  private renderConfig: RenderConfig;
  private performanceConfig: PerformanceConfig;
  private lodConfig: LODConfig;

  constructor(canvas?: HTMLCanvasElement, webglCanvas?: HTMLCanvasElement) {
    if (canvas && webglCanvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d')!;
      this.webglCanvas = webglCanvas;
      this.gl = webglCanvas.getContext('webgl2') || webglCanvas.getContext('webgl')!;
      
      // Configurar Three.js
      this.scene = new THREE.Scene();
      this.camera = new THREE.PerspectiveCamera(75, canvas.width / canvas.height, 0.1, 1000);
      this.renderer = new THREE.WebGLRenderer({ canvas: webglCanvas, alpha: true });
      this.renderer.setSize(canvas.width, canvas.height);
      
      // Initialize volumetric effects manager
    this.volumetricManager = new VolumetricEffectsManager(this.scene);
    
    // Initialize node-based compositor
    this.nodeCompositor = new NodeBasedCompositor(this.canvas);
    
    // Initialize real-time renderer with optimized settings
    this.renderConfig = RenderPresets.getHighQualityConfig();
    this.performanceConfig = {
      targetFPS: 60,
      adaptiveQuality: true,
      frustumCulling: true,
      occlusionCulling: false,
      instancedRendering: true,
      batchRendering: true,
      textureCompression: true,
      mipmapGeneration: true,
      geometryMerging: true
    };
    this.lodConfig = {
      enabled: true,
      distances: [100, 500, 1000],
      qualityLevels: ['high', 'medium', 'low'],
      particleCountMultipliers: [1.0, 0.5, 0.25],
      effectIntensityMultipliers: [1.0, 0.7, 0.4]
    };
    this.realTimeRenderer = new RealTimeRenderer(
      webglCanvas,
      this.renderConfig,
      this.performanceConfig,
      this.lodConfig
    );
      
      this.initializeShaders();
      this.initializeAudioContext();
    } else {
      // Initialize with dummy values for headless mode
      this.scene = new THREE.Scene();
      this.camera = new THREE.PerspectiveCamera(75, 1920 / 1080, 0.1, 1000);
      this.initializeAudioContext();
    }
  }

  // Inicialização de shaders
  private initializeShaders(): void {
    if (!this.gl) {
      console.warn('WebGL context not available, skipping shader initialization');
      return;
    }
    const shaderSources = {
      // Shader de blur gaussiano
      gaussianBlur: {
        vertex: `
          attribute vec2 a_position;
          attribute vec2 a_texCoord;
          varying vec2 v_texCoord;
          void main() {
            gl_Position = vec4(a_position, 0.0, 1.0);
            v_texCoord = a_texCoord;
          }
        `,
        fragment: `
          precision mediump float;
          uniform sampler2D u_texture;
          uniform vec2 u_resolution;
          uniform float u_radius;
          varying vec2 v_texCoord;
          
          void main() {
            vec2 onePixel = vec2(1.0) / u_resolution;
            vec4 color = vec4(0.0);
            float total = 0.0;
            
            for (float x = -4.0; x <= 4.0; x++) {
              for (float y = -4.0; y <= 4.0; y++) {
                vec2 offset = vec2(x, y) * onePixel * u_radius;
                float weight = exp(-(x*x + y*y) / (2.0 * u_radius * u_radius));
                color += texture2D(u_texture, v_texCoord + offset) * weight;
                total += weight;
              }
            }
            
            gl_FragColor = color / total;
          }
        `
      },
      
      // Shader de distorção
      distortion: {
        vertex: `
          attribute vec2 a_position;
          attribute vec2 a_texCoord;
          varying vec2 v_texCoord;
          void main() {
            gl_Position = vec4(a_position, 0.0, 1.0);
            v_texCoord = a_texCoord;
          }
        `,
        fragment: `
          precision mediump float;
          uniform sampler2D u_texture;
          uniform float u_time;
          uniform float u_intensity;
          uniform vec2 u_center;
          varying vec2 v_texCoord;
          
          void main() {
            vec2 coord = v_texCoord;
            vec2 toCenter = coord - u_center;
            float distance = length(toCenter);
            
            float wave = sin(distance * 20.0 - u_time * 5.0) * u_intensity;
            coord += normalize(toCenter) * wave * 0.1;
            
            gl_FragColor = texture2D(u_texture, coord);
          }
        `
      },
      
      // Shader de chroma key
      chromaKey: {
        vertex: `
          attribute vec2 a_position;
          attribute vec2 a_texCoord;
          varying vec2 v_texCoord;
          void main() {
            gl_Position = vec4(a_position, 0.0, 1.0);
            v_texCoord = a_texCoord;
          }
        `,
        fragment: `
          precision mediump float;
          uniform sampler2D u_texture;
          uniform vec3 u_keyColor;
          uniform float u_threshold;
          uniform float u_smoothness;
          varying vec2 v_texCoord;
          
          void main() {
            vec4 color = texture2D(u_texture, v_texCoord);
            float distance = length(color.rgb - u_keyColor);
            float alpha = smoothstep(u_threshold - u_smoothness, u_threshold + u_smoothness, distance);
            gl_FragColor = vec4(color.rgb, color.a * alpha);
          }
        `
      }
    };

    for (const [name, source] of Object.entries(shaderSources)) {
      const program = this.createShaderProgram(source.vertex, source.fragment);
      if (program) {
        this.shaderPrograms.set(name, program);
      }
    }
  }

  private createShaderProgram(vertexSource: string, fragmentSource: string): WebGLProgram | null {
    if (!this.gl) return null;
    
    const vertexShader = this.createShader(this.gl.VERTEX_SHADER, vertexSource);
    const fragmentShader = this.createShader(this.gl.FRAGMENT_SHADER, fragmentSource);
    
    if (!vertexShader || !fragmentShader) return null;
    
    const program = this.gl.createProgram()!;
    this.gl.attachShader(program, vertexShader);
    this.gl.attachShader(program, fragmentShader);
    this.gl.linkProgram(program);
    
    if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
      console.error('Erro ao linkar shader program:', this.gl.getProgramInfoLog(program));
      return null;
    }
    
    return program;
  }

  private createShader(type: number, source: string): WebGLShader | null {
    if (!this.gl) return null;
    
    const shader = this.gl.createShader(type)!;
    this.gl.shaderSource(shader, source);
    this.gl.compileShader(shader);
    
    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      console.error('Erro ao compilar shader:', this.gl.getShaderInfoLog(shader));
      return null;
    }
    
    return shader;
  }

  // Inicialização do contexto de áudio
  private initializeAudioContext(): void {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (error) {
      console.warn('Contexto de áudio não disponível:', error);
    }
  }

  // Carregar composição
  public loadComposition(composition: VFXComposition): void {
    this.composition = composition;
    
    if (this.canvas && this.webglCanvas && this.renderer) {
      this.canvas.width = composition.width;
      this.canvas.height = composition.height;
      this.webglCanvas.width = composition.width;
      this.webglCanvas.height = composition.height;
      this.renderer.setSize(composition.width, composition.height);
    }
    
    if (this.camera) {
      this.camera.aspect = composition.width / composition.height;
      this.camera.updateProjectionMatrix();
    }
  }

  // Reprodução
  public play(): void {
    if (!this.composition || this.isPlaying) return;
    
    this.isPlaying = true;
    this.startRenderLoop();
  }

  public pause(): void {
    this.isPlaying = false;
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
  }

  public stop(): void {
    this.pause();
    this.currentTime = 0;
  }

  public seekTo(time: number): void {
    this.currentTime = Math.max(0, Math.min(time, this.composition?.duration || 0));
    if (!this.isPlaying) {
      this.renderFrame();
    }
  }

  // Loop de renderização
  private startRenderLoop(): void {
    const render = async (timestamp: number) => {
      if (!this.isPlaying || !this.composition) return;
      
      this.currentTime += 1 / this.composition.frameRate;
      
      if (this.currentTime >= this.composition.duration) {
        this.stop();
        return;
      }
      
      await this.renderFrame();
      this.animationFrame = requestAnimationFrame(render);
    };
    
    this.animationFrame = requestAnimationFrame(render);
  }

  // Renderização de frame
  private async renderFrame(): Promise<void> {
    if (!this.composition) return;
    
    // Limpar canvas
    if (this.ctx) {
      this.ctx.fillStyle = this.composition.backgroundColor;
      this.ctx.fillRect(0, 0, this.composition.width, this.composition.height);
    }
    
    // Limpar cena 3D
    if (this.scene) {
      this.scene.clear();
    }
    
    // Renderizar layers em ordem de z-index
    const sortedLayers = [...this.composition.layers].sort((a, b) => a.zIndex - b.zIndex);
    
    for (const layer of sortedLayers) {
      if (!layer.visible || this.currentTime < layer.startTime || this.currentTime > layer.startTime + layer.duration) {
        continue;
      }
      
      this.renderLayer(layer);
    }
    
    // Aplicar efeitos globais
    for (const effect of this.composition.globalEffects) {
      if (effect.enabled && this.currentTime >= effect.startTime && this.currentTime <= effect.endTime) {
        this.applyEffect(effect);
      }
    }
    
    // Update particle systems
    const deltaTime = 1 / (this.composition?.frameRate || 30);
    this.updateAllParticleSystems(deltaTime);
    
    // Update volumetric effects
    if (this.volumetricManager) {
      this.volumetricManager.updateAll(deltaTime);
    }
    
    // Processar compositor baseado em nós se houver nós conectados
    if (this.nodeCompositor && this.compositorNodes.size > 0) {
      try {
        await this.processComposition();
      } catch (error) {
        console.warn('Erro no processamento do compositor:', error);
      }
    }
    
    // Renderizar cena 3D com RealTimeRenderer otimizado
    if (this.realTimeRenderer && this.composition) {
      this.realTimeRenderer.render(this, this.composition);
    } else if (this.renderer && this.scene && this.camera) {
      // Fallback para renderização padrão
      this.renderer.render(this.scene, this.camera);
    }
  }

  // Renderização de layer
  private renderLayer(layer: VFXLayer): void {
    if (!this.ctx) return;
    
    this.ctx.save();
    
    // Aplicar transformações
    const transform = layer.transform;
    this.ctx.globalAlpha = layer.opacity;
    this.ctx.globalCompositeOperation = this.getCanvasBlendMode(layer.blendMode);
    
    this.ctx.translate(transform.position.x, transform.position.y);
    this.ctx.rotate(transform.rotation.z);
    this.ctx.scale(transform.scale.x, transform.scale.y);
    
    // Renderizar conteúdo do layer
    switch (layer.type) {
      case 'video':
      case 'image':
        this.renderMediaLayer(layer);
        break;
      case 'text':
        this.renderTextLayer(layer);
        break;
      case 'shape':
        this.renderShapeLayer(layer);
        break;
      case 'particle':
        this.renderParticleLayer(layer);
        break;
      case 'effect':
        this.renderEffectLayer(layer);
        break;
    }
    
    // Aplicar efeitos do layer
    for (const effect of layer.effects) {
      if (effect.enabled && this.currentTime >= effect.startTime && this.currentTime <= effect.endTime) {
        this.applyLayerEffect(layer, effect);
      }
    }
    
    this.ctx.restore();
  }

  // Aplicar efeito
  private applyEffect(effect: VFXEffect): void {
    const progress = (this.currentTime - effect.startTime) / effect.duration;
    const intensity = this.interpolateKeyframes(effect.keyframes, progress, 'intensity') || effect.intensity;
    
    switch (effect.type) {
      case 'transition':
        this.applyTransitionEffect(effect, intensity);
        break;
      case 'particle':
        this.applyParticleEffect(effect, intensity);
        break;
      case 'shader':
        this.applyShaderEffect(effect, intensity);
        break;
      case 'composite':
        this.applyCompositeEffect(effect, intensity);
        break;
      case 'distortion':
        this.applyDistortionEffect(effect, intensity);
        break;
      case 'color':
        this.applyColorEffect(effect, intensity);
        break;
      case 'lighting':
        this.applyLightingEffect(effect, intensity);
        break;
    }
  }

  // Interpolação de keyframes
  private interpolateKeyframes(keyframes: VFXKeyframe[], progress: number, property: string): any {
    if (keyframes.length === 0) return null;
    if (keyframes.length === 1) return keyframes[0].properties[property];
    
    // Encontrar keyframes adjacentes
    let prevKeyframe = keyframes[0];
    let nextKeyframe = keyframes[keyframes.length - 1];
    
    for (let i = 0; i < keyframes.length - 1; i++) {
      if (progress >= keyframes[i].time && progress <= keyframes[i + 1].time) {
        prevKeyframe = keyframes[i];
        nextKeyframe = keyframes[i + 1];
        break;
      }
    }
    
    // Interpolação linear
    const t = (progress - prevKeyframe.time) / (nextKeyframe.time - prevKeyframe.time);
    const prevValue = prevKeyframe.properties[property];
    const nextValue = nextKeyframe.properties[property];
    
    if (typeof prevValue === 'number' && typeof nextValue === 'number') {
      return prevValue + (nextValue - prevValue) * t;
    }
    
    return prevValue;
  }

  // Conversão de blend mode para canvas
  private getCanvasBlendMode(blendMode: BlendMode): GlobalCompositeOperation {
    const blendModeMap: Record<BlendMode, GlobalCompositeOperation> = {
      'normal': 'source-over',
      'multiply': 'multiply',
      'screen': 'screen',
      'overlay': 'overlay',
      'soft-light': 'soft-light',
      'hard-light': 'hard-light',
      'color-dodge': 'color-dodge',
      'color-burn': 'color-burn',
      'darken': 'darken',
      'lighten': 'lighten',
      'difference': 'difference',
      'exclusion': 'exclusion',
      'hue': 'hue',
      'saturation': 'saturation',
      'color': 'color',
      'luminosity': 'luminosity'
    };
    
    return blendModeMap[blendMode] || 'source-over';
  }

  // Métodos de renderização específicos (implementação básica)
  private renderMediaLayer(layer: VFXLayer): void {
    if (!layer.source || !layer.visible) return;
    
    const img = new Image();
    img.onload = () => {
      this.ctx.save();
      
      // Aplicar transformações
      this.applyLayerTransform(layer);
      
      // Aplicar opacidade e blend mode
      this.ctx.globalAlpha = layer.opacity;
      this.ctx.globalCompositeOperation = this.getCanvasBlendMode(layer.blendMode);
      
      // Renderizar imagem/vídeo
      const { width, height } = this.composition || { width: 1920, height: 1080 };
      this.ctx.drawImage(img, 0, 0, width, height);
      
      this.ctx.restore();
    };
    img.src = layer.source;
  }

  private renderTextLayer(layer: VFXLayer): void {
    if (!layer.visible) return;
    
    this.ctx.save();
    
    // Aplicar transformações
    this.applyLayerTransform(layer);
    
    // Aplicar opacidade e blend mode
    this.ctx.globalAlpha = layer.opacity;
    this.ctx.globalCompositeOperation = this.getCanvasBlendMode(layer.blendMode);
    
    // Configurar texto
    const textParams = layer.effects.find(e => e.type === 'text')?.parameters || {};
    this.ctx.font = `${textParams.fontSize || 48}px ${textParams.fontFamily || 'Arial'}`;
    this.ctx.fillStyle = textParams.color || '#ffffff';
    this.ctx.textAlign = textParams.align || 'center';
    this.ctx.textBaseline = textParams.baseline || 'middle';
    
    // Renderizar texto
    const text = textParams.text || 'Sample Text';
    if (textParams.stroke) {
      this.ctx.strokeStyle = textParams.strokeColor || '#000000';
      this.ctx.lineWidth = textParams.strokeWidth || 2;
      this.ctx.strokeText(text, 0, 0);
    }
    this.ctx.fillText(text, 0, 0);
    
    this.ctx.restore();
  }

  private renderShapeLayer(layer: VFXLayer): void {
    if (!layer.visible) return;
    
    this.ctx.save();
    
    // Aplicar transformações
    this.applyLayerTransform(layer);
    
    // Aplicar opacidade e blend mode
    this.ctx.globalAlpha = layer.opacity;
    this.ctx.globalCompositeOperation = this.getCanvasBlendMode(layer.blendMode);
    
    // Configurar forma
    const shapeParams = layer.effects.find(e => e.type === 'shape')?.parameters || {};
    const shapeType = shapeParams.type || 'rectangle';
    const width = shapeParams.width || 100;
    const height = shapeParams.height || 100;
    const radius = shapeParams.radius || 0;
    
    this.ctx.fillStyle = shapeParams.fillColor || '#ffffff';
    this.ctx.strokeStyle = shapeParams.strokeColor || '#000000';
    this.ctx.lineWidth = shapeParams.strokeWidth || 1;
    
    // Renderizar forma baseada no tipo
    this.ctx.beginPath();
    switch (shapeType) {
      case 'rectangle':
        if (radius > 0) {
          this.drawRoundedRect(-width/2, -height/2, width, height, radius);
        } else {
          this.ctx.rect(-width/2, -height/2, width, height);
        }
        break;
      case 'circle':
        this.ctx.arc(0, 0, width/2, 0, Math.PI * 2);
        break;
      case 'triangle':
        this.ctx.moveTo(0, -height/2);
        this.ctx.lineTo(-width/2, height/2);
        this.ctx.lineTo(width/2, height/2);
        this.ctx.closePath();
        break;
    }
    
    if (shapeParams.fill !== false) this.ctx.fill();
    if (shapeParams.stroke !== false) this.ctx.stroke();
    
    this.ctx.restore();
  }

  private renderParticleLayer(layer: VFXLayer): void {
    if (!layer.visible) return;

    // Se temos WebGL disponível, usar sistema cinematográfico
    if (this.renderer && this.scene) {
      this.renderCinematicParticles(layer);
      return;
    }
    
    this.ctx.save();
    
    // Aplicar transformações
    this.applyLayerTransform(layer);
    
    // Aplicar opacidade e blend mode
    this.ctx.globalAlpha = layer.opacity;
    this.ctx.globalCompositeOperation = this.getCanvasBlendMode(layer.blendMode);
    
    // Configurar partículas
    const particleParams = layer.effects.find(e => e.type === 'particle')?.parameters || {};
    const particleCount = particleParams.particleCount || 50;
    const particleSize = particleParams.size || 3;
    const particleColor = particleParams.color || '#ffffff';
    const speed = particleParams.speed || 2;
    const gravity = particleParams.gravity || 0;
    
    // Simular partículas baseado no tempo atual
    const time = this.currentTime;
    const particles = this.generateParticles(particleCount, time, speed, gravity);
    
    this.ctx.fillStyle = particleColor;
    
    particles.forEach(particle => {
      this.ctx.save();
      this.ctx.translate(particle.x, particle.y);
      this.ctx.globalAlpha = particle.alpha * layer.opacity;
      
      this.ctx.beginPath();
      this.ctx.arc(0, 0, particleSize * particle.scale, 0, Math.PI * 2);
      this.ctx.fill();
      
      this.ctx.restore();
    });
    
    this.ctx.restore();
  }

  // Renderizar partículas cinematográficas usando Three.js
  private renderCinematicParticles(layer: VFXLayer): void {
    const layerId = layer.id;
    let particleSystem = this.particleSystems.get(layerId);
    
    if (!particleSystem) {
      // Criar novo sistema de partículas
      const particleParams = layer.effects.find(e => e.type === 'particle')?.parameters || {};
      const config: CinematicParticleConfig = {
        count: particleParams.particleCount || 1000,
        size: particleParams.size || 0.1,
        sizeVariation: particleParams.sizeVariation || 0.5,
        color: new THREE.Color(particleParams.color || '#ffffff'),
        colorVariation: particleParams.colorVariation || 0.2,
        lifetime: particleParams.lifetime || 3.0,
        lifetimeVariation: particleParams.lifetimeVariation || 1.0,
        velocity: new THREE.Vector3(
          particleParams.velocityX || 0,
          particleParams.velocityY || 1,
          particleParams.velocityZ || 0
        ),
        velocityVariation: particleParams.velocityVariation || 0.5,
        acceleration: new THREE.Vector3(
          particleParams.accelerationX || 0,
          particleParams.accelerationY || -0.98,
          particleParams.accelerationZ || 0
        ),
        emissionRate: particleParams.emissionRate || 100,
        emissionShape: particleParams.emissionShape || 'sphere',
        emissionRadius: particleParams.emissionRadius || 1.0,
        texture: particleParams.texture,
        blendMode: particleParams.blendMode || 'additive',
        opacity: particleParams.opacity || 1.0,
        opacityVariation: particleParams.opacityVariation || 0.3
      };
      
      particleSystem = new CinematicParticleSystem(config);
      this.particleSystems.set(layerId, particleSystem);
      
      // Adicionar à cena
      this.scene.add(particleSystem.getParticleSystem());
    }
    
    // Aplicar transformações da layer
    const transform = layer.transform;
    const particleObject = particleSystem.getParticleSystem();
    
    particleObject.position.set(
      transform.position.x,
      transform.position.y,
      transform.position.z
    );
    
    particleObject.rotation.set(
      transform.rotation.x * Math.PI / 180,
      transform.rotation.y * Math.PI / 180,
      transform.rotation.z * Math.PI / 180
    );
    
    particleObject.scale.set(
      transform.scale.x,
      transform.scale.y,
      transform.scale.z
    );
    
    // Aplicar forças globais
    this.globalForces.forEach(force => {
      particleSystem.addForce(force);
    });
    
    // Atualizar sistema de partículas
    const deltaTime = 1 / (this.composition?.frameRate || 30);
    particleSystem.update(deltaTime);
  }

  private renderEffectLayer(layer: VFXLayer): void {
    if (!layer.visible) return;
    
    // Aplicar todos os efeitos da layer
    layer.effects.forEach(effect => {
      if (effect.enabled && this.isEffectActive(effect)) {
        const intensity = this.calculateEffectIntensity(effect);
        this.applyLayerEffect(layer, effect);
      }
    });
  }

  private applyLayerEffect(layer: VFXLayer, effect: VFXEffect): void {
    const intensity = this.calculateEffectIntensity(effect);
    
    switch (effect.type) {
      case 'transition':
        this.applyTransitionEffect(effect, intensity);
        break;
      case 'particle':
        this.applyParticleEffect(effect, intensity);
        break;
      case 'shader':
        this.applyShaderEffect(effect, intensity);
        break;
      case 'composite':
        this.applyCompositeEffect(effect, intensity);
        break;
      case 'distortion':
        this.applyDistortionEffect(effect, intensity);
        break;
      case 'color':
        this.applyColorEffect(effect, intensity);
        break;
      case 'lighting':
        this.applyLightingEffect(effect, intensity);
        break;
    }
  }

  private applyTransitionEffect(effect: VFXEffect, intensity: number): void {
    const params = effect.parameters;
    
    switch (params.transitionType || 'fade') {
      case 'fade':
        this.ctx.globalAlpha *= intensity;
        break;
      case 'slide':
        const direction = params.direction || 'left';
        const distance = params.distance || 100;
        const offset = distance * (1 - intensity);
        
        switch (direction) {
          case 'left':
            this.ctx.translate(-offset, 0);
            break;
          case 'right':
            this.ctx.translate(offset, 0);
            break;
          case 'up':
            this.ctx.translate(0, -offset);
            break;
          case 'down':
            this.ctx.translate(0, offset);
            break;
        }
        break;
      case 'scale':
        const scale = params.startScale || 0;
        const currentScale = scale + (1 - scale) * intensity;
        this.ctx.scale(currentScale, currentScale);
        break;
    }
  }

  private applyParticleEffect(effect: VFXEffect, intensity: number): void {
    const params = effect.parameters;
    const particleCount = Math.floor((params.particleCount || 50) * intensity);
    const particleSize = (params.size || 3) * intensity;
    const speed = (params.speed || 2) * intensity;
    const gravity = params.gravity || 0;
    
    // Gerar e renderizar partículas
    const particles = this.generateParticles(particleCount, this.currentTime, speed, gravity);
    
    this.ctx.save();
    this.ctx.fillStyle = params.color || '#ffffff';
    this.ctx.globalCompositeOperation = this.getCanvasBlendMode(effect.blendMode);
    
    particles.forEach(particle => {
      this.ctx.save();
      this.ctx.translate(particle.x, particle.y);
      this.ctx.globalAlpha = particle.alpha * intensity;
      
      this.ctx.beginPath();
      this.ctx.arc(0, 0, particleSize * particle.scale, 0, Math.PI * 2);
      this.ctx.fill();
      
      this.ctx.restore();
    });
    
    this.ctx.restore();
  }

  private applyShaderEffect(effect: VFXEffect, intensity: number): void {
    if (!this.gl) return;
    
    const params = effect.parameters;
    const shaderType = params.shaderType || 'blur';
    
    // Obter programa de shader
    const program = this.shaderPrograms.get(shaderType);
    if (!program) return;
    
    this.gl.useProgram(program);
    
    // Configurar uniforms baseado no tipo de shader
    switch (shaderType) {
      case 'blur':
        const radiusLocation = this.gl.getUniformLocation(program, 'u_radius');
        this.gl.uniform1f(radiusLocation, (params.radius || 5) * intensity);
        break;
      case 'distortion':
        const strengthLocation = this.gl.getUniformLocation(program, 'u_strength');
        this.gl.uniform1f(strengthLocation, (params.strength || 0.1) * intensity);
        break;
    }
    
    // Renderizar com shader (implementação simplificada)
    this.renderWithShader(program);
  }

  private applyCompositeEffect(effect: VFXEffect, intensity: number): void {
    const params = effect.parameters;
    const compositeMode = params.mode || 'multiply';
    
    // Aplicar modo de composição
    this.ctx.globalCompositeOperation = this.getCanvasBlendMode(compositeMode as BlendMode);
    
    // Aplicar intensidade através da opacidade
    this.ctx.globalAlpha *= intensity;
    
    // Aplicar cor de composição se especificada
    if (params.color) {
      this.ctx.save();
      this.ctx.fillStyle = params.color;
      this.ctx.globalAlpha = intensity * (params.opacity || 0.5);
      const { width, height } = this.composition || { width: 1920, height: 1080 };
      this.ctx.fillRect(0, 0, width, height);
      this.ctx.restore();
    }
  }

  private applyDistortionEffect(effect: VFXEffect, intensity: number): void {
    const params = effect.parameters;
    const distortionType = params.type || 'wave';
    const strength = (params.strength || 10) * intensity;
    const frequency = params.frequency || 0.1;
    const time = this.currentTime;
    
    switch (distortionType) {
      case 'wave':
        // Aplicar distorção de onda usando transformação
        const waveOffset = Math.sin(time * frequency) * strength;
        this.ctx.transform(1, 0, Math.sin(time * frequency) * 0.1 * intensity, 1, waveOffset, 0);
        break;
      case 'ripple':
        // Efeito ripple (implementação simplificada)
        const rippleStrength = strength * Math.sin(time * 2);
        this.ctx.transform(1 + rippleStrength * 0.01, 0, 0, 1 + rippleStrength * 0.01, 0, 0);
        break;
      case 'twist':
        // Efeito de torção
        const angle = (params.angle || 0.1) * intensity * Math.sin(time);
        this.ctx.rotate(angle);
        break;
    }
  }

  private applyColorEffect(effect: VFXEffect, intensity: number): void {
    const params = effect.parameters;
    const colorType = params.type || 'tint';
    
    switch (colorType) {
      case 'tint':
        // Aplicar matiz de cor
        const tintColor = params.color || '#ffffff';
        this.ctx.save();
        this.ctx.globalCompositeOperation = 'multiply';
        this.ctx.fillStyle = tintColor;
        this.ctx.globalAlpha = intensity * (params.strength || 0.5);
        const { width, height } = this.composition || { width: 1920, height: 1080 };
        this.ctx.fillRect(0, 0, width, height);
        this.ctx.restore();
        break;
      case 'brightness':
        // Ajustar brilho
        const brightness = 1 + (params.brightness || 0) * intensity;
        this.ctx.filter = `brightness(${brightness})`;
        break;
      case 'contrast':
        // Ajustar contraste
        const contrast = 1 + (params.contrast || 0) * intensity;
        this.ctx.filter = `contrast(${contrast})`;
        break;
      case 'saturation':
        // Ajustar saturação
        const saturation = 1 + (params.saturation || 0) * intensity;
        this.ctx.filter = `saturate(${saturation})`;
        break;
      case 'hue':
        // Rotação de matiz
        const hueRotate = (params.hue || 0) * intensity;
        this.ctx.filter = `hue-rotate(${hueRotate}deg)`;
        break;
    }
  }

  private applyLightingEffect(effect: VFXEffect, intensity: number): void {
    const params = effect.parameters;
    const lightingType = params.type || 'glow';
    
    switch (lightingType) {
      case 'glow':
        // Efeito de brilho
        const glowColor = params.color || '#ffffff';
        const glowRadius = (params.radius || 20) * intensity;
        const glowIntensity = (params.intensity || 0.5) * intensity;
        
        this.ctx.save();
        this.ctx.shadowColor = glowColor;
        this.ctx.shadowBlur = glowRadius;
        this.ctx.globalAlpha = glowIntensity;
        this.ctx.globalCompositeOperation = 'screen';
        
        // Renderizar glow (implementação simplificada)
        const { width, height } = this.composition || { width: 1920, height: 1080 };
        this.ctx.fillStyle = glowColor;
        this.ctx.fillRect(0, 0, width, height);
        
        this.ctx.restore();
        break;
      case 'spotlight':
        // Efeito de holofote
        const spotX = params.x || 0;
        const spotY = params.y || 0;
        const spotRadius = (params.radius || 100) * intensity;
        const spotIntensity = (params.intensity || 1) * intensity;
        
        const gradient = this.ctx.createRadialGradient(spotX, spotY, 0, spotX, spotY, spotRadius);
        gradient.addColorStop(0, `rgba(255, 255, 255, ${spotIntensity})`);
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        
        this.ctx.save();
        this.ctx.globalCompositeOperation = 'multiply';
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.composition?.width || 1920, this.composition?.height || 1080);
        this.ctx.restore();
        break;
    }
  }

  // Exportação de vídeo
  public async exportVideo(settings: RenderSettings): Promise<Blob> {
    if (!this.composition) {
      throw new Error('Nenhuma composição carregada');
    }

    // Implementar exportação de vídeo
    // Esta é uma implementação simplificada
    const frames: ImageData[] = [];
    const totalFrames = Math.ceil(this.composition.duration * this.composition.frameRate);
    
    for (let frame = 0; frame < totalFrames; frame++) {
      this.currentTime = frame / this.composition.frameRate;
      this.renderFrame();
      
      const imageData = this.ctx.getImageData(0, 0, this.composition.width, this.composition.height);
      frames.push(imageData);
    }
    
    // Converter frames para blob de vídeo (implementação simplificada)
    return new Blob([], { type: 'video/mp4' });
  }

  // Inicializar com canvas (para uso posterior)
  public initializeWithCanvas(canvas: HTMLCanvasElement, webglCanvas: HTMLCanvasElement): void {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.webglCanvas = webglCanvas;
    this.gl = webglCanvas.getContext('webgl2') || webglCanvas.getContext('webgl')!;
    
    // Configurar Three.js
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, canvas.width / canvas.height, 0.1, 1000);
    this.renderer = new THREE.WebGLRenderer({ canvas: webglCanvas, alpha: true });
    this.renderer.setSize(canvas.width, canvas.height);
    
    this.initializeShaders();
  }

  // Verificar se está inicializado com canvas
  public isCanvasInitialized(): boolean {
    return !!(this.canvas && this.webglCanvas && this.ctx && this.gl && this.renderer);
  }

  // Métodos auxiliares
  private applyLayerTransform(layer: VFXLayer): void {
    const transform = layer.transform;
    
    // Aplicar posição
    this.ctx.translate(transform.position.x, transform.position.y);
    
    // Aplicar rotação
    if (transform.rotation.z !== 0) {
      this.ctx.rotate(transform.rotation.z * Math.PI / 180);
    }
    
    // Aplicar escala
    this.ctx.scale(transform.scale.x, transform.scale.y);
    
    // Aplicar skew (implementação simplificada)
    if (transform.skew.x !== 0 || transform.skew.y !== 0) {
      this.ctx.transform(1, transform.skew.y, transform.skew.x, 1, 0, 0);
    }
  }
  
  private generateParticles(count: number, time: number, speed: number, gravity: number): Array<{x: number, y: number, alpha: number, scale: number}> {
    const particles = [];
    const centerX = (this.composition?.width || 1920) / 2;
    const centerY = (this.composition?.height || 1080) / 2;
    
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const distance = time * speed * 50;
      const life = Math.max(0, 1 - (time * 0.5));
      
      particles.push({
        x: centerX + Math.cos(angle) * distance,
        y: centerY + Math.sin(angle) * distance + (gravity * time * time * 100),
        alpha: life,
        scale: life
      });
    }
    
    return particles;
  }
  
  private drawRoundedRect(x: number, y: number, width: number, height: number, radius: number): void {
    this.ctx.beginPath();
    this.ctx.moveTo(x + radius, y);
    this.ctx.lineTo(x + width - radius, y);
    this.ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    this.ctx.lineTo(x + width, y + height - radius);
    this.ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    this.ctx.lineTo(x + radius, y + height);
    this.ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    this.ctx.lineTo(x, y + radius);
    this.ctx.quadraticCurveTo(x, y, x + radius, y);
    this.ctx.closePath();
  }
  
  private isEffectActive(effect: VFXEffect): boolean {
    return this.currentTime >= effect.startTime && this.currentTime <= effect.endTime;
  }
  
  private calculateEffectIntensity(effect: VFXEffect): number {
    if (!this.isEffectActive(effect)) return 0;
    
    const progress = (this.currentTime - effect.startTime) / (effect.endTime - effect.startTime);
    return Math.min(1, Math.max(0, progress)) * effect.intensity;
  }
  
  private renderWithShader(program: WebGLProgram): void {
    if (!this.gl) return;
    
    // Implementação simplificada de renderização com shader
    // Em uma implementação completa, isso envolveria configurar buffers,
    // texturas e executar o pipeline de renderização WebGL
    console.log('Rendering with shader program:', program);
  }

  public disposeParticleSystem(layerId: string): void {
    const system = this.particleSystems.get(layerId);
    if (system) {
      system.dispose();
      this.particleSystems.delete(layerId);
    }
  }

  // Métodos públicos para controle de partículas cinematográficas
  public addGlobalForce(force: ParticleForce): void {
    this.globalForces.push(force);
  }

  public removeGlobalForce(index: number): void {
    this.globalForces.splice(index, 1);
  }

  public clearGlobalForces(): void {
    this.globalForces = [];
  }

  public createParticlePreset(type: 'fire' | 'smoke' | 'explosion' | 'sparkles', layerId: string): void {
    if (!this.scene) return;

    let config: CinematicParticleConfig;
    switch (type) {
      case 'fire':
        config = ParticlePresets.createFireEffect();
        break;
      case 'smoke':
        config = ParticlePresets.createSmokeEffect();
        break;
      case 'explosion':
        config = ParticlePresets.createExplosionEffect();
        break;
      case 'sparkles':
        config = ParticlePresets.createMagicSparkles();
        break;
    }

    const particleSystem = new CinematicParticleSystem(config);
    this.particleSystems.set(layerId, particleSystem);
  }

  public getParticleSystem(layerId: string): CinematicParticleSystem | undefined {
    return this.particleSystems.get(layerId);
  }

  public getAllParticleSystems(): Map<string, CinematicParticleSystem> {
    return this.particleSystems;
  }

  public updateAllParticleSystems(deltaTime: number): void {
    this.particleSystems.forEach(system => {
      system.update(deltaTime);
    });
  }

  public resetAllParticleSystems(): void {
    this.particleSystems.forEach(system => {
      system.reset();
    });
  }

  public startAllParticleSystems(): void {
    this.particleSystems.forEach(system => {
      system.start();
    });
  }

  public stopAllParticleSystems(): void {
    this.particleSystems.forEach(system => {
      system.stop();
    });
  }

  public disposeAllParticleSystems(): void {
    this.particleSystems.forEach(system => {
      system.dispose();
    });
    this.particleSystems.clear();
  }

  // Métodos para efeitos volumétricos
  public createVolumetricEffect(id: string, config: VolumetricEffectConfig, position?: THREE.Vector3): VolumetricEffect | null {
    if (!this.volumetricManager) {
      console.warn('Volumetric effects manager not initialized');
      return null;
    }
    
    const effect = this.volumetricManager.createEffect(id, config, position);
    this.volumetricEffects.set(id, effect);
    return effect;
  }
  
  public createFireEffect(id: string, position?: THREE.Vector3, customConfig?: Partial<VolumetricEffectConfig>): VolumetricEffect | null {
    const config = { ...VolumetricPresets.createFireEffect(), ...customConfig };
    return this.createVolumetricEffect(id, config, position);
  }
  
  public createSmokeEffect(id: string, position?: THREE.Vector3, customConfig?: Partial<VolumetricEffectConfig>): VolumetricEffect | null {
    const config = { ...VolumetricPresets.createSmokeEffect(), ...customConfig };
    return this.createVolumetricEffect(id, config, position);
  }
  
  public createExplosionEffect(id: string, position?: THREE.Vector3, customConfig?: Partial<VolumetricEffectConfig>): VolumetricEffect | null {
    const config = { ...VolumetricPresets.createExplosionEffect(), ...customConfig };
    return this.createVolumetricEffect(id, config, position);
  }
  
  public createSteamEffect(id: string, position?: THREE.Vector3, customConfig?: Partial<VolumetricEffectConfig>): VolumetricEffect | null {
    const config = { ...VolumetricPresets.createSteamEffect(), ...customConfig };
    return this.createVolumetricEffect(id, config, position);
  }
  
  public createCloudEffect(id: string, position?: THREE.Vector3, customConfig?: Partial<VolumetricEffectConfig>): VolumetricEffect | null {
    const config = { ...VolumetricPresets.createCloudEffect(), ...customConfig };
    return this.createVolumetricEffect(id, config, position);
  }
  
  public removeVolumetricEffect(id: string): void {
    if (this.volumetricManager) {
      this.volumetricManager.removeEffect(id);
      this.volumetricEffects.delete(id);
    }
  }
  
  public getVolumetricEffect(id: string): VolumetricEffect | undefined {
    return this.volumetricEffects.get(id);
  }
  
  public updateVolumetricEffect(id: string, properties: Partial<VolumetricEffectConfig>): void {
    const effect = this.volumetricEffects.get(id);
    if (effect) {
      if (properties.intensity !== undefined) effect.setIntensity(properties.intensity);
      if (properties.color !== undefined) effect.setColor(properties.color);
      if (properties.density !== undefined) effect.setDensity(properties.density);
      if (properties.speed !== undefined) effect.setSpeed(properties.speed);
      if (properties.direction !== undefined) effect.setDirection(properties.direction);
    }
  }
  
  public getAllVolumetricEffects(): Map<string, VolumetricEffect> {
    return this.volumetricEffects;
  }
  
  // Métodos para compositor baseado em nós
  public addCompositorNode(node: CompositorNode): void {
    if (this.nodeCompositor) {
      this.nodeCompositor.addNode(node);
      this.compositorNodes.set(node.id, node);
    }
  }
  
  public removeCompositorNode(nodeId: string): void {
    if (this.nodeCompositor) {
      this.nodeCompositor.removeNode(nodeId);
      this.compositorNodes.delete(nodeId);
    }
  }
  
  public addNodeConnection(connection: NodeConnection): boolean {
    if (this.nodeCompositor) {
      const success = this.nodeCompositor.addConnection(connection);
      if (success) {
        this.compositorConnections.set(connection.id, connection);
      }
      return success;
    }
    return false;
  }
  
  public removeNodeConnection(connectionId: string): void {
    if (this.nodeCompositor) {
      this.nodeCompositor.removeConnection(connectionId);
      this.compositorConnections.delete(connectionId);
    }
  }
  
  public processComposition(): Promise<ProcessingResult> {
    if (this.nodeCompositor) {
      return this.nodeCompositor.process();
    }
    return Promise.resolve({
      success: false,
      error: 'Node compositor not initialized',
      processingTime: 0
    });
  }
  
  public createInputNode(id: string, name?: string): CompositorNode {
    const node = NodeFactory.createInputNode(id, name);
    this.addCompositorNode(node);
    return node;
  }
  
  public createOutputNode(id: string, name?: string): CompositorNode {
    const node = NodeFactory.createOutputNode(id, name);
    this.addCompositorNode(node);
    return node;
  }
  
  public createBlendNode(id: string, name?: string): CompositorNode {
    const node = NodeFactory.createBlendNode(id, name);
    this.addCompositorNode(node);
    return node;
  }
  
  public createFilterNode(id: string, name?: string): CompositorNode {
    const node = NodeFactory.createFilterNode(id, name);
    this.addCompositorNode(node);
    return node;
  }
  
  public createColorNode(id: string, name?: string): CompositorNode {
    const node = NodeFactory.createColorNode(id, name);
    this.addCompositorNode(node);
    return node;
  }
  
  public getCompositorNode(nodeId: string): CompositorNode | undefined {
    return this.compositorNodes.get(nodeId);
  }
  
  public getAllCompositorNodes(): Map<string, CompositorNode> {
    return this.compositorNodes;
  }
  
  public getAllNodeConnections(): Map<string, NodeConnection> {
    return this.compositorConnections;
  }
  
  public getCompositorProcessingOrder(): string[] {
    return this.nodeCompositor?.getProcessingOrder() || [];
  }
  
  public isCompositorProcessing(): boolean {
    return this.nodeCompositor?.isCurrentlyProcessing() || false;
  }
  
  public clearCompositor(): void {
    if (this.nodeCompositor) {
      this.nodeCompositor.clear();
      this.compositorNodes.clear();
      this.compositorConnections.clear();
    }
  }
  
  // Método para criar composição complexa pré-configurada
  public createComplexComposition(type: 'cinematic' | 'artistic' | 'technical'): void {
    this.clearCompositor();
    
    switch (type) {
      case 'cinematic':
        this.createCinematicComposition();
        break;
      case 'artistic':
        this.createArtisticComposition();
        break;
      case 'technical':
        this.createTechnicalComposition();
        break;
    }
  }
  
  private createCinematicComposition(): void {
    // Criar nós para composição cinematográfica
    const inputNode = this.createInputNode('input1', 'Main Input');
    const colorNode = this.createColorNode('color1', 'Color Grading');
    const filterNode = this.createFilterNode('filter1', 'Cinematic Blur');
    const blendNode = this.createBlendNode('blend1', 'Atmosphere Blend');
    const outputNode = this.createOutputNode('output1', 'Final Output');
    
    // Configurar parâmetros
    colorNode.parameters = {
      operation: 'contrast',
      value: 20
    };
    
    filterNode.parameters = {
      filterType: 'blur',
      intensity: 2
    };
    
    blendNode.parameters = {
      blendMode: 'overlay',
      opacity: 0.7
    };
    
    // Criar conexões
    this.addNodeConnection({
      id: 'conn1',
      sourceNodeId: 'input1',
      sourceSocket: 'output',
      targetNodeId: 'color1',
      targetSocket: 'image',
      dataType: 'image'
    });
    
    this.addNodeConnection({
      id: 'conn2',
      sourceNodeId: 'color1',
      sourceSocket: 'output',
      targetNodeId: 'filter1',
      targetSocket: 'image',
      dataType: 'image'
    });
    
    this.addNodeConnection({
      id: 'conn3',
      sourceNodeId: 'filter1',
      sourceSocket: 'output',
      targetNodeId: 'blend1',
      targetSocket: 'imageA',
      dataType: 'image'
    });
    
    this.addNodeConnection({
      id: 'conn4',
      sourceNodeId: 'color1',
      sourceSocket: 'output',
      targetNodeId: 'blend1',
      targetSocket: 'imageB',
      dataType: 'image'
    });
    
    this.addNodeConnection({
      id: 'conn5',
      sourceNodeId: 'blend1',
      sourceSocket: 'output',
      targetNodeId: 'output1',
      targetSocket: 'input',
      dataType: 'image'
    });
  }
  
  private createArtisticComposition(): void {
    // Criar nós para composição artística
    const inputNode = this.createInputNode('input1', 'Original');
    const filter1 = this.createFilterNode('filter1', 'Edge Detection');
    const filter2 = this.createFilterNode('filter2', 'Blur');
    const color1 = this.createColorNode('color1', 'Saturation Boost');
    const blend1 = this.createBlendNode('blend1', 'Artistic Blend');
    const outputNode = this.createOutputNode('output1', 'Artistic Result');
    
    // Configurar parâmetros artísticos
    filter1.parameters = { filterType: 'edge', intensity: 1.5 };
    filter2.parameters = { filterType: 'blur', intensity: 3 };
    color1.parameters = { operation: 'saturation', value: 1.5 };
    blend1.parameters = { blendMode: 'multiply', opacity: 0.8 };
    
    // Conexões para efeito artístico
    this.addNodeConnection({
      id: 'art1', sourceNodeId: 'input1', sourceSocket: 'output',
      targetNodeId: 'filter1', targetSocket: 'image', dataType: 'image'
    });
    
    this.addNodeConnection({
      id: 'art2', sourceNodeId: 'input1', sourceSocket: 'output',
      targetNodeId: 'filter2', targetSocket: 'image', dataType: 'image'
    });
    
    this.addNodeConnection({
      id: 'art3', sourceNodeId: 'filter2', sourceSocket: 'output',
      targetNodeId: 'color1', targetSocket: 'image', dataType: 'image'
    });
    
    this.addNodeConnection({
      id: 'art4', sourceNodeId: 'filter1', sourceSocket: 'output',
      targetNodeId: 'blend1', targetSocket: 'imageA', dataType: 'image'
    });
    
    this.addNodeConnection({
      id: 'art5', sourceNodeId: 'color1', sourceSocket: 'output',
      targetNodeId: 'blend1', targetSocket: 'imageB', dataType: 'image'
    });
    
    this.addNodeConnection({
      id: 'art6', sourceNodeId: 'blend1', sourceSocket: 'output',
      targetNodeId: 'output1', targetSocket: 'input', dataType: 'image'
    });
  }
  
  private createTechnicalComposition(): void {
    // Criar nós para composição técnica
    const inputNode = this.createInputNode('input1', 'Raw Input');
    const filter1 = this.createFilterNode('filter1', 'Sharpen');
    const color1 = this.createColorNode('color1', 'Brightness');
    const color2 = this.createColorNode('color2', 'Contrast');
    const outputNode = this.createOutputNode('output1', 'Enhanced Output');
    
    // Configurar parâmetros técnicos
    filter1.parameters = { filterType: 'sharpen', intensity: 1.2 };
    color1.parameters = { operation: 'brightness', value: 10 };
    color2.parameters = { operation: 'contrast', value: 15 };
    
    // Conexões em série para processamento técnico
    this.addNodeConnection({
      id: 'tech1', sourceNodeId: 'input1', sourceSocket: 'output',
      targetNodeId: 'filter1', targetSocket: 'image', dataType: 'image'
    });
    
    this.addNodeConnection({
      id: 'tech2', sourceNodeId: 'filter1', sourceSocket: 'output',
      targetNodeId: 'color1', targetSocket: 'image', dataType: 'image'
    });
    
    this.addNodeConnection({
      id: 'tech3', sourceNodeId: 'color1', sourceSocket: 'output',
      targetNodeId: 'color2', targetSocket: 'image', dataType: 'image'
    });
    
    this.addNodeConnection({
      id: 'tech4', sourceNodeId: 'color2', sourceSocket: 'output',
      targetNodeId: 'output1', targetSocket: 'input', dataType: 'image'
    });
  }

  // Métodos para gerenciar o Real-Time Renderer
  public setRenderQuality(quality: 'draft' | 'preview' | 'high' | 'ultra'): void {
    if (!this.realTimeRenderer) return;
    
    switch (quality) {
      case 'draft':
        this.renderConfig = RenderPresets.getMobileConfig();
        break;
      case 'preview':
        this.renderConfig = RenderPresets.getPerformanceConfig();
        break;
      case 'high':
      case 'ultra':
        this.renderConfig = RenderPresets.getHighQualityConfig();
        break;
    }
    
    // Recriar renderer com nova configuração
    this.realTimeRenderer.dispose();
    this.realTimeRenderer = new RealTimeRenderer(
      this.webglCanvas,
      this.renderConfig,
      this.performanceConfig,
      this.lodConfig
    );
  }
  
  public setPerformanceTarget(targetFPS: number): void {
    this.performanceConfig.targetFPS = targetFPS;
    if (this.realTimeRenderer) {
      this.realTimeRenderer.dispose();
      this.realTimeRenderer = new RealTimeRenderer(
        this.webglCanvas,
        this.renderConfig,
        this.performanceConfig,
        this.lodConfig
      );
    }
  }
  
  public enableAdaptiveQuality(enabled: boolean): void {
    this.performanceConfig.adaptiveQuality = enabled;
  }
  
  public setLODDistances(distances: number[]): void {
    this.lodConfig.distances = distances;
  }
  
  public getRenderMetrics() {
    return this.realTimeRenderer?.getMetrics() || null;
  }
  
  public getRealTimeRenderer(): RealTimeRenderer | undefined {
    return this.realTimeRenderer;
  }
  
  public optimizeForMobile(): void {
    this.renderConfig = RenderPresets.getMobileConfig();
    this.performanceConfig = {
      ...this.performanceConfig,
      targetFPS: 30,
      adaptiveQuality: true,
      frustumCulling: true,
      occlusionCulling: false,
      instancedRendering: false,
      batchRendering: true,
      textureCompression: true,
      mipmapGeneration: false,
      geometryMerging: true
    };
    
    this.lodConfig = {
      enabled: true,
      distances: [50, 200, 500],
      qualityLevels: ['high', 'medium', 'low'],
      particleCountMultipliers: [0.5, 0.25, 0.1],
      effectIntensityMultipliers: [0.7, 0.4, 0.2]
    };
    
    if (this.realTimeRenderer) {
      this.realTimeRenderer.dispose();
      this.realTimeRenderer = new RealTimeRenderer(
        this.webglCanvas,
        this.renderConfig,
        this.performanceConfig,
        this.lodConfig
      );
    }
  }
  
  public optimizeForDesktop(): void {
    this.renderConfig = RenderPresets.getHighQualityConfig();
    this.performanceConfig = {
      ...this.performanceConfig,
      targetFPS: 60,
      adaptiveQuality: false,
      frustumCulling: true,
      occlusionCulling: true,
      instancedRendering: true,
      batchRendering: true,
      textureCompression: false,
      mipmapGeneration: true,
      geometryMerging: true
    };
    
    this.lodConfig = {
      enabled: true,
      distances: [200, 800, 1500],
      qualityLevels: ['high', 'medium', 'low'],
      particleCountMultipliers: [1.0, 0.7, 0.4],
      effectIntensityMultipliers: [1.0, 0.8, 0.5]
    };
    
    if (this.realTimeRenderer) {
      this.realTimeRenderer.dispose();
      this.realTimeRenderer = new RealTimeRenderer(
        this.webglCanvas,
        this.renderConfig,
        this.performanceConfig,
        this.lodConfig
      );
    }
  }

  // Método para criar efeitos volumétricos pré-configurados
  public createVolumetricParticleEffect(type: 'fire' | 'smoke' | 'explosion' | 'magic', position: THREE.Vector3, layerId: string): void {
    if (!this.scene) return;

    let config: CinematicParticleConfig;
    let forces: ParticleForce[] = [];

    switch (type) {
      case 'fire':
        config = ParticlePresets.createFireEffect();
        forces = [
          {
            type: 'wind',
            strength: 0.5,
            direction: new THREE.Vector3(Math.random() - 0.5, 0, Math.random() - 0.5)
          }
        ];
        break;
      case 'smoke':
        config = ParticlePresets.createSmokeEffect();
        forces = [
          {
            type: 'wind',
            strength: 1.0,
            direction: new THREE.Vector3(0.2, 0.8, 0.1)
          }
        ];
        break;
      case 'explosion':
        config = ParticlePresets.createExplosionEffect();
        forces = [
          {
            type: 'repulsor',
            strength: 10.0,
            position: position.clone(),
            radius: 5.0
          }
        ];
        break;
      case 'magic':
        config = ParticlePresets.createMagicSparkles();
        forces = [
          {
            type: 'vortex',
            strength: 2.0,
            position: position.clone()
          }
        ];
        break;
    }

    const particleSystem = new CinematicParticleSystem(config);
    
    // Aplicar forças específicas
    forces.forEach(force => particleSystem.addForce(force));
    
    // Posicionar sistema
    const particleObject = particleSystem.getParticleSystem();
    if (particleObject) {
      particleObject.position.copy(position);
    }
    
    this.particleSystems.set(layerId, particleSystem);
  }

  // Limpeza
  public dispose(): void {
    this.pause();
    
    // Limpar shaders
    if (this.gl) {
      for (const program of Array.from(this.shaderPrograms.values())) {
        this.gl.deleteProgram(program);
      }
      
      // Limpar texturas
      for (const texture of Array.from(this.textures.values())) {
        this.gl.deleteTexture(texture);
      }
      
      // Limpar framebuffers
      for (const framebuffer of Array.from(this.frameBuffers.values())) {
        this.gl.deleteFramebuffer(framebuffer);
      }
    }
    
    // Dispose particle systems
    this.particleSystems.forEach(system => system.dispose());
    this.particleSystems.clear();
    
    // Dispose volumetric effects
    if (this.volumetricManager) {
      this.volumetricManager.disposeAll();
    }
    this.volumetricEffects.clear();
    
    // Limpar compositor baseado em nós
    if (this.nodeCompositor) {
      this.nodeCompositor.dispose();
    }
    this.compositorNodes.clear();
    this.compositorConnections.clear();
    
    // Limpar contexto de áudio
    if (this.audioContext) {
      this.audioContext.close();
    }
    
    // Limpar RealTimeRenderer
    if (this.realTimeRenderer) {
      this.realTimeRenderer.dispose();
    }
    
    // Limpar Three.js
    if (this.renderer) {
      this.renderer.dispose();
    }
  }
}

// Factory para criar efeitos pré-definidos
export class VFXEffectFactory {
  static createFadeTransition(duration: number = 1): VFXEffect {
    return {
      id: `fade-${Date.now()}`,
      name: 'Fade In/Out',
      type: 'transition',
      category: 'Transições',
      enabled: true,
      intensity: 1,
      duration,
      startTime: 0,
      endTime: duration,
      parameters: {
        fadeType: 'in',
        curve: 'ease-in-out'
      },
      keyframes: [
        { time: 0, properties: { opacity: 0 }, easing: 'ease-in-out' },
        { time: 1, properties: { opacity: 1 }, easing: 'ease-in-out' }
      ],
      blendMode: 'normal'
    };
  }

  static createParticleExplosion(intensity: number = 1): VFXEffect {
    return {
      id: `explosion-${Date.now()}`,
      name: 'Explosão de Partículas',
      type: 'particle',
      category: 'Partículas',
      enabled: true,
      intensity,
      duration: 2,
      startTime: 0,
      endTime: 2,
      parameters: {
        particleCount: 100 * intensity,
        speed: 5 * intensity,
        size: 3,
        color: '#ff6b35',
        gravity: 0.5
      },
      keyframes: [],
      blendMode: 'screen'
    };
  }

  static createGlowEffect(color: string = '#ffffff', intensity: number = 1): VFXEffect {
    return {
      id: `glow-${Date.now()}`,
      name: 'Efeito Glow',
      type: 'lighting',
      category: 'Iluminação',
      enabled: true,
      intensity,
      duration: 1,
      startTime: 0,
      endTime: 1,
      parameters: {
        color,
        radius: 20 * intensity,
        softness: 0.5
      },
      keyframes: [],
      blendMode: 'screen'
    };
  }

  static createDistortionWave(intensity: number = 1): VFXEffect {
    return {
      id: `wave-${Date.now()}`,
      name: 'Onda de Distorção',
      type: 'distortion',
      category: 'Distorção',
      enabled: true,
      intensity,
      duration: 3,
      startTime: 0,
      endTime: 3,
      parameters: {
        frequency: 10,
        amplitude: 0.1 * intensity,
        speed: 2
      },
      keyframes: [],
      blendMode: 'normal'
    };
  }

  static createColorGrading(temperature: number = 0, tint: number = 0, saturation: number = 1): VFXEffect {
    return {
      id: `color-grading-${Date.now()}`,
      name: 'Correção de Cor',
      type: 'color',
      category: 'Cor',
      enabled: true,
      intensity: 1,
      duration: 1,
      startTime: 0,
      endTime: 1,
      parameters: {
        temperature,
        tint,
        saturation,
        contrast: 1,
        brightness: 0,
        gamma: 1
      },
      keyframes: [],
      blendMode: 'normal'
    };
  }
}

// Utilitários para VFX
export class VFXUtils {
  static createDefaultTransform(): VFXTransform {
    return {
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
      anchor: { x: 0.5, y: 0.5 },
      skew: { x: 0, y: 0 }
    };
  }

  static createDefaultLayer(type: VFXLayer['type'], name: string): VFXLayer {
    return {
      id: `layer-${Date.now()}`,
      name,
      type,
      effects: [],
      transform: this.createDefaultTransform(),
      opacity: 1,
      blendMode: 'normal',
      visible: true,
      locked: false,
      startTime: 0,
      duration: 10,
      zIndex: 0
    };
  }

  static createDefaultComposition(): VFXComposition {
    return {
      id: `comp-${Date.now()}`,
      name: 'Nova Composição',
      width: 1920,
      height: 1080,
      frameRate: 30,
      duration: 10,
      backgroundColor: '#000000',
      layers: [],
      globalEffects: [],
      audioTracks: [],
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date(),
        version: '1.0.0',
        author: 'Studio Treiax'
      }
    };
  }

  static interpolateColor(color1: string, color2: string, t: number): string {
    // Implementar interpolação de cores
    return color1; // Simplificado
  }

  static easeInOut(t: number): number {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
  }

  static easeIn(t: number): number {
    return t * t;
  }

  static easeOut(t: number): number {
    return 1 - (1 - t) * (1 - t);
  }

  static linear(t: number): number {
    return t;
  }
}