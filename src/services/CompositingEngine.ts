import { ShaderSystem, ShaderPass, RenderTarget } from './ShaderSystem';

export interface CompositeLayer {
  id: string;
  name: string;
  type: 'video' | 'image' | 'text' | 'shape' | 'effect' | 'adjustment';
  source?: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement;
  texture?: WebGLTexture;
  transform: {
    position: { x: number; y: number; z: number };
    rotation: { x: number; y: number; z: number };
    scale: { x: number; y: number; z: number };
    anchor: { x: number; y: number };
  };
  opacity: number;
  blendMode: BlendMode;
  maskLayer?: CompositeLayer;
  effects: LayerEffect[];
  visible: boolean;
  locked: boolean;
  startTime: number;
  endTime: number;
  duration: number;
  keyframes: Keyframe[];
  parentId?: string;
  children: string[];
}

export interface LayerEffect {
  id: string;
  name: string;
  type: string;
  enabled: boolean;
  parameters: { [key: string]: any };
  keyframes: EffectKeyframe[];
}

export interface EffectKeyframe {
  time: number;
  parameters: { [key: string]: any };
  easing: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'cubic-bezier';
  easingParams?: number[];
}

export interface Keyframe {
  id: string;
  time: number;
  property: string;
  value: any;
  easing: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'cubic-bezier';
  easingParams?: number[];
  interpolation: 'linear' | 'bezier' | 'step';
}

export type BlendMode = 
  | 'normal' | 'multiply' | 'screen' | 'overlay' | 'soft-light' | 'hard-light'
  | 'color-dodge' | 'color-burn' | 'darken' | 'lighten' | 'difference'
  | 'exclusion' | 'hue' | 'saturation' | 'color' | 'luminosity' | 'add' | 'subtract';

export interface CompositeSettings {
  width: number;
  height: number;
  frameRate: number;
  backgroundColor: { r: number; g: number; b: number; a: number };
  colorSpace: 'sRGB' | 'Rec709' | 'Rec2020' | 'DCI-P3';
  bitDepth: 8 | 10 | 12 | 16;
  quality: 'draft' | 'preview' | 'full';
  antialiasing: boolean;
  motionBlur: boolean;
  depthOfField: boolean;
}

export interface RenderPass {
  id: string;
  name: string;
  type: 'layer' | 'effect' | 'composite' | 'output';
  layers: string[];
  effects: string[];
  renderTarget?: RenderTarget;
  enabled: boolean;
  order: number;
}

export class CompositingEngine {
  private gl: WebGLRenderingContext;
  private shaderSystem: ShaderSystem;
  private layers: Map<string, CompositeLayer> = new Map();
  private renderPasses: RenderPass[] = [];
  private renderTargets: Map<string, RenderTarget> = new Map();
  private settings: CompositeSettings;
  private currentTime = 0;
  private isRendering = false;
  private frameBuffer: WebGLFramebuffer;
  private depthBuffer: WebGLRenderbuffer;
  private outputTexture: WebGLTexture;
  private quadBuffer: WebGLBuffer;
  private matrixStack: Float32Array[] = [];
  private currentMatrix: Float32Array;
  private blendShaders: Map<BlendMode, WebGLProgram> = new Map();

  constructor(canvas: HTMLCanvasElement, settings: Partial<CompositeSettings> = {}) {
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) {
      throw new Error('WebGL não suportado');
    }
    
    this.gl = gl as WebGLRenderingContext;
    this.shaderSystem = new ShaderSystem(canvas);
    
    this.settings = {
      width: canvas.width,
      height: canvas.height,
      frameRate: 30,
      backgroundColor: { r: 0, g: 0, b: 0, a: 1 },
      colorSpace: 'sRGB',
      bitDepth: 8,
      quality: 'full',
      antialiasing: true,
      motionBlur: false,
      depthOfField: false,
      ...settings
    };

    this.initializeWebGL();
    this.createFrameBuffer();
    this.createQuadBuffer();
    this.initializeBlendShaders();
    this.currentMatrix = this.createIdentityMatrix();
  }

  private initializeWebGL(): void {
    this.gl.enable(this.gl.BLEND);
    this.gl.enable(this.gl.DEPTH_TEST);
    this.gl.depthFunc(this.gl.LEQUAL);
    this.gl.clearColor(
      this.settings.backgroundColor.r / 255,
      this.settings.backgroundColor.g / 255,
      this.settings.backgroundColor.b / 255,
      this.settings.backgroundColor.a
    );
  }

  private createFrameBuffer(): void {
    this.frameBuffer = this.gl.createFramebuffer()!;
    this.depthBuffer = this.gl.createRenderbuffer()!;
    this.outputTexture = this.gl.createTexture()!;

    // Configurar texture de saída
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.outputTexture);
    this.gl.texImage2D(
      this.gl.TEXTURE_2D, 0, this.gl.RGBA,
      this.settings.width, this.settings.height, 0,
      this.gl.RGBA, this.gl.UNSIGNED_BYTE, null
    );
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);

    // Configurar depth buffer
    this.gl.bindRenderbuffer(this.gl.RENDERBUFFER, this.depthBuffer);
    this.gl.renderbufferStorage(
      this.gl.RENDERBUFFER, this.gl.DEPTH_COMPONENT16,
      this.settings.width, this.settings.height
    );

    // Anexar ao framebuffer
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.frameBuffer);
    this.gl.framebufferTexture2D(
      this.gl.FRAMEBUFFER, this.gl.COLOR_ATTACHMENT0,
      this.gl.TEXTURE_2D, this.outputTexture, 0
    );
    this.gl.framebufferRenderbuffer(
      this.gl.FRAMEBUFFER, this.gl.DEPTH_ATTACHMENT,
      this.gl.RENDERBUFFER, this.depthBuffer
    );

    if (this.gl.checkFramebufferStatus(this.gl.FRAMEBUFFER) !== this.gl.FRAMEBUFFER_COMPLETE) {
      throw new Error('Framebuffer não está completo');
    }

    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
  }

  private createQuadBuffer(): void {
    const vertices = new Float32Array([
      -1, -1, 0, 0, 1,
       1, -1, 1, 0, 1,
      -1,  1, 0, 1, 1,
       1,  1, 1, 1, 1
    ]);

    this.quadBuffer = this.gl.createBuffer()!;
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.quadBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, vertices, this.gl.STATIC_DRAW);
  }

  private initializeBlendShaders(): void {
    const blendModes: BlendMode[] = [
      'normal', 'multiply', 'screen', 'overlay', 'soft-light', 'hard-light',
      'color-dodge', 'color-burn', 'darken', 'lighten', 'difference',
      'exclusion', 'add', 'subtract'
    ];

    blendModes.forEach(mode => {
      const program = this.createBlendShader(mode);
      if (program) {
        this.blendShaders.set(mode, program);
      }
    });
  }

  private createBlendShader(blendMode: BlendMode): WebGLProgram | null {
    const vertexShader = `
      attribute vec3 a_position;
      attribute vec2 a_texCoord;
      varying vec2 v_texCoord;
      uniform mat4 u_matrix;
      
      void main() {
        gl_Position = u_matrix * vec4(a_position, 1.0);
        v_texCoord = a_texCoord;
      }
    `;

    const fragmentShader = `
      precision mediump float;
      
      uniform sampler2D u_baseTexture;
      uniform sampler2D u_blendTexture;
      uniform float u_opacity;
      varying vec2 v_texCoord;
      
      ${this.getBlendFunction(blendMode)}
      
      void main() {
        vec4 base = texture2D(u_baseTexture, v_texCoord);
        vec4 blend = texture2D(u_blendTexture, v_texCoord);
        
        vec4 result = blendFunction(base, blend);
        gl_FragColor = mix(base, result, u_opacity * blend.a);
      }
    `;

    return this.compileShaderProgram(vertexShader, fragmentShader);
  }

  private getBlendFunction(blendMode: BlendMode): string {
    switch (blendMode) {
      case 'normal':
        return 'vec4 blendFunction(vec4 base, vec4 blend) { return blend; }';
        
      case 'multiply':
        return 'vec4 blendFunction(vec4 base, vec4 blend) { return vec4(base.rgb * blend.rgb, blend.a); }';
        
      case 'screen':
        return 'vec4 blendFunction(vec4 base, vec4 blend) { return vec4(1.0 - (1.0 - base.rgb) * (1.0 - blend.rgb), blend.a); }';
        
      case 'overlay':
        return `
          vec4 blendFunction(vec4 base, vec4 blend) {
            vec3 result;
            result.r = base.r < 0.5 ? 2.0 * base.r * blend.r : 1.0 - 2.0 * (1.0 - base.r) * (1.0 - blend.r);
            result.g = base.g < 0.5 ? 2.0 * base.g * blend.g : 1.0 - 2.0 * (1.0 - base.g) * (1.0 - blend.g);
            result.b = base.b < 0.5 ? 2.0 * base.b * blend.b : 1.0 - 2.0 * (1.0 - base.b) * (1.0 - blend.b);
            return vec4(result, blend.a);
          }
        `;
        
      case 'soft-light':
        return `
          vec4 blendFunction(vec4 base, vec4 blend) {
            vec3 result;
            result.r = blend.r < 0.5 ? base.r - (1.0 - 2.0 * blend.r) * base.r * (1.0 - base.r) : base.r + (2.0 * blend.r - 1.0) * (sqrt(base.r) - base.r);
            result.g = blend.g < 0.5 ? base.g - (1.0 - 2.0 * blend.g) * base.g * (1.0 - base.g) : base.g + (2.0 * blend.g - 1.0) * (sqrt(base.g) - base.g);
            result.b = blend.b < 0.5 ? base.b - (1.0 - 2.0 * blend.b) * base.b * (1.0 - base.b) : base.b + (2.0 * blend.b - 1.0) * (sqrt(base.b) - base.b);
            return vec4(result, blend.a);
          }
        `;
        
      case 'hard-light':
        return `
          vec4 blendFunction(vec4 base, vec4 blend) {
            vec3 result;
            result.r = blend.r < 0.5 ? 2.0 * base.r * blend.r : 1.0 - 2.0 * (1.0 - base.r) * (1.0 - blend.r);
            result.g = blend.g < 0.5 ? 2.0 * base.g * blend.g : 1.0 - 2.0 * (1.0 - base.g) * (1.0 - blend.g);
            result.b = blend.b < 0.5 ? 2.0 * base.b * blend.b : 1.0 - 2.0 * (1.0 - base.b) * (1.0 - blend.b);
            return vec4(result, blend.a);
          }
        `;
        
      case 'color-dodge':
        return `
          vec4 blendFunction(vec4 base, vec4 blend) {
            vec3 result;
            result.r = blend.r == 1.0 ? 1.0 : min(1.0, base.r / (1.0 - blend.r));
            result.g = blend.g == 1.0 ? 1.0 : min(1.0, base.g / (1.0 - blend.g));
            result.b = blend.b == 1.0 ? 1.0 : min(1.0, base.b / (1.0 - blend.b));
            return vec4(result, blend.a);
          }
        `;
        
      case 'color-burn':
        return `
          vec4 blendFunction(vec4 base, vec4 blend) {
            vec3 result;
            result.r = blend.r == 0.0 ? 0.0 : max(0.0, 1.0 - (1.0 - base.r) / blend.r);
            result.g = blend.g == 0.0 ? 0.0 : max(0.0, 1.0 - (1.0 - base.g) / blend.g);
            result.b = blend.b == 0.0 ? 0.0 : max(0.0, 1.0 - (1.0 - base.b) / blend.b);
            return vec4(result, blend.a);
          }
        `;
        
      case 'darken':
        return 'vec4 blendFunction(vec4 base, vec4 blend) { return vec4(min(base.rgb, blend.rgb), blend.a); }';
        
      case 'lighten':
        return 'vec4 blendFunction(vec4 base, vec4 blend) { return vec4(max(base.rgb, blend.rgb), blend.a); }';
        
      case 'difference':
        return 'vec4 blendFunction(vec4 base, vec4 blend) { return vec4(abs(base.rgb - blend.rgb), blend.a); }';
        
      case 'exclusion':
        return 'vec4 blendFunction(vec4 base, vec4 blend) { return vec4(base.rgb + blend.rgb - 2.0 * base.rgb * blend.rgb, blend.a); }';
        
      case 'add':
        return 'vec4 blendFunction(vec4 base, vec4 blend) { return vec4(min(base.rgb + blend.rgb, 1.0), blend.a); }';
        
      case 'subtract':
        return 'vec4 blendFunction(vec4 base, vec4 blend) { return vec4(max(base.rgb - blend.rgb, 0.0), blend.a); }';
        
      default:
        return 'vec4 blendFunction(vec4 base, vec4 blend) { return blend; }';
    }
  }

  private compileShaderProgram(vertexSource: string, fragmentSource: string): WebGLProgram | null {
    const vertexShader = this.createShader(this.gl.VERTEX_SHADER, vertexSource);
    const fragmentShader = this.createShader(this.gl.FRAGMENT_SHADER, fragmentSource);

    if (!vertexShader || !fragmentShader) return null;

    const program = this.gl.createProgram()!;
    this.gl.attachShader(program, vertexShader);
    this.gl.attachShader(program, fragmentShader);
    this.gl.linkProgram(program);

    if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
      console.error('Erro ao linkar programa:', this.gl.getProgramInfoLog(program));
      this.gl.deleteProgram(program);
      return null;
    }

    this.gl.deleteShader(vertexShader);
    this.gl.deleteShader(fragmentShader);

    return program;
  }

  private createShader(type: number, source: string): WebGLShader | null {
    const shader = this.gl.createShader(type)!;
    this.gl.shaderSource(shader, source);
    this.gl.compileShader(shader);

    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      console.error('Erro ao compilar shader:', this.gl.getShaderInfoLog(shader));
      this.gl.deleteShader(shader);
      return null;
    }

    return shader;
  }

  public addLayer(layer: CompositeLayer): void {
    this.layers.set(layer.id, layer);
    
    // Criar texture se necessário
    if (layer.source && !layer.texture) {
      layer.texture = this.createTextureFromSource(layer.source);
    }
  }

  public removeLayer(layerId: string): void {
    const layer = this.layers.get(layerId);
    if (layer && layer.texture) {
      this.gl.deleteTexture(layer.texture);
    }
    this.layers.delete(layerId);
  }

  public updateLayer(layerId: string, updates: Partial<CompositeLayer>): void {
    const layer = this.layers.get(layerId);
    if (layer) {
      Object.assign(layer, updates);
      
      // Atualizar texture se source mudou
      if (updates.source && updates.source !== layer.source) {
        if (layer.texture) {
          this.gl.deleteTexture(layer.texture);
        }
        layer.texture = this.createTextureFromSource(updates.source);
      }
    }
  }

  public getLayer(layerId: string): CompositeLayer | undefined {
    return this.layers.get(layerId);
  }

  public getAllLayers(): CompositeLayer[] {
    return Array.from(this.layers.values());
  }

  public getLayersByType(type: CompositeLayer['type']): CompositeLayer[] {
    return Array.from(this.layers.values()).filter(layer => layer.type === type);
  }

  private createTextureFromSource(source: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement): WebGLTexture {
    const texture = this.gl.createTexture()!;
    
    this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
    this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, source);
    
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
    
    return texture;
  }

  public setCurrentTime(time: number): void {
    this.currentTime = time;
  }

  public getCurrentTime(): number {
    return this.currentTime;
  }

  public render(outputCanvas?: HTMLCanvasElement): void {
    if (this.isRendering) return;
    
    this.isRendering = true;
    
    try {
      // Configurar framebuffer
      this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.frameBuffer);
      this.gl.viewport(0, 0, this.settings.width, this.settings.height);
      
      // Limpar
      this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
      
      // Obter camadas visíveis ordenadas por z-index
      const visibleLayers = this.getVisibleLayersAtTime(this.currentTime)
        .sort((a, b) => a.transform.position.z - b.transform.position.z);
      
      // Renderizar camadas
      visibleLayers.forEach(layer => {
        this.renderLayer(layer);
      });
      
      // Copiar para canvas de saída se especificado
      if (outputCanvas) {
        this.copyToCanvas(outputCanvas);
      }
      
    } finally {
      this.isRendering = false;
      this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
    }
  }

  private getVisibleLayersAtTime(time: number): CompositeLayer[] {
    return Array.from(this.layers.values()).filter(layer => {
      return layer.visible && 
             time >= layer.startTime && 
             time <= layer.endTime;
    });
  }

  private renderLayer(layer: CompositeLayer): void {
    if (!layer.texture) return;
    
    // Calcular propriedades interpoladas
    const interpolatedProps = this.interpolateLayerProperties(layer, this.currentTime);
    
    // Configurar matriz de transformação
    this.pushMatrix();
    this.applyTransform(interpolatedProps.transform);
    
    // Aplicar efeitos da camada
    let currentTexture = layer.texture;
    
    if (layer.effects.length > 0) {
      currentTexture = this.applyLayerEffects(layer, currentTexture);
    }
    
    // Renderizar com blend mode
    this.renderWithBlendMode(currentTexture, layer.blendMode, interpolatedProps.opacity);
    
    this.popMatrix();
  }

  private interpolateLayerProperties(layer: CompositeLayer, time: number): any {
    const result = {
      transform: { ...layer.transform },
      opacity: layer.opacity
    };
    
    // Interpolar keyframes
    layer.keyframes.forEach(keyframe => {
      if (time >= keyframe.time) {
        const nextKeyframe = layer.keyframes.find(kf => kf.time > keyframe.time && kf.property === keyframe.property);
        
        if (nextKeyframe) {
          const t = (time - keyframe.time) / (nextKeyframe.time - keyframe.time);
          const easedT = this.applyEasing(t, keyframe.easing, keyframe.easingParams);
          
          const interpolatedValue = this.interpolateValue(
            keyframe.value,
            nextKeyframe.value,
            easedT,
            keyframe.interpolation
          );
          
          this.setPropertyValue(result, keyframe.property, interpolatedValue);
        } else {
          this.setPropertyValue(result, keyframe.property, keyframe.value);
        }
      }
    });
    
    return result;
  }

  private applyEasing(t: number, easing: string, params?: number[]): number {
    switch (easing) {
      case 'linear':
        return t;
      case 'ease-in':
        return t * t;
      case 'ease-out':
        return 1 - (1 - t) * (1 - t);
      case 'ease-in-out':
        return t < 0.5 ? 2 * t * t : 1 - 2 * (1 - t) * (1 - t);
      case 'cubic-bezier':
        if (params && params.length === 4) {
          return this.cubicBezier(t, params[0], params[1], params[2], params[3]);
        }
        return t;
      default:
        return t;
    }
  }

  private cubicBezier(t: number, x1: number, y1: number, x2: number, y2: number): number {
    // Implementação simplificada de cubic-bezier
    const cx = 3 * x1;
    const bx = 3 * (x2 - x1) - cx;
    const ax = 1 - cx - bx;
    
    const cy = 3 * y1;
    const by = 3 * (y2 - y1) - cy;
    const ay = 1 - cy - by;
    
    const sampleCurveX = (t: number) => ((ax * t + bx) * t + cx) * t;
    const sampleCurveY = (t: number) => ((ay * t + by) * t + cy) * t;
    
    // Encontrar t para x usando Newton-Raphson
    let t2 = t;
    for (let i = 0; i < 8; i++) {
      const x2 = sampleCurveX(t2) - t;
      if (Math.abs(x2) < 0.000001) break;
      const d2 = (3 * ax * t2 + 2 * bx) * t2 + cx;
      if (Math.abs(d2) < 0.000001) break;
      t2 = t2 - x2 / d2;
    }
    
    return sampleCurveY(t2);
  }

  private interpolateValue(start: any, end: any, t: number, interpolation: string): any {
    if (typeof start === 'number' && typeof end === 'number') {
      return start + (end - start) * t;
    }
    
    if (typeof start === 'object' && typeof end === 'object') {
      const result: any = {};
      for (const key in start) {
        if (key in end) {
          result[key] = this.interpolateValue(start[key], end[key], t, interpolation);
        } else {
          result[key] = start[key];
        }
      }
      return result;
    }
    
    return t < 0.5 ? start : end;
  }

  private setPropertyValue(obj: any, property: string, value: any): void {
    const parts = property.split('.');
    let current = obj;
    
    for (let i = 0; i < parts.length - 1; i++) {
      if (!(parts[i] in current)) {
        current[parts[i]] = {};
      }
      current = current[parts[i]];
    }
    
    current[parts[parts.length - 1]] = value;
  }

  private applyLayerEffects(layer: CompositeLayer, inputTexture: WebGLTexture): WebGLTexture {
    let currentTexture = inputTexture;
    
    layer.effects.forEach(effect => {
      if (!effect.enabled) return;
      
      // Interpolar parâmetros do efeito
      const interpolatedParams = this.interpolateEffectParameters(effect, this.currentTime);
      
      // Aplicar efeito usando shader system
      const shaderEffect = this.shaderSystem.getEffect(effect.type);
      if (shaderEffect) {
        // Criar render target temporário
        const tempTarget = this.shaderSystem.createRenderTarget(
          `temp-${effect.id}`,
          'Temporary Effect',
          this.settings.width,
          this.settings.height
        );
        
        // Criar pass do shader
        const pass: ShaderPass = {
          id: `pass-${effect.id}`,
          name: effect.name,
          effect: shaderEffect,
          inputTextures: [currentTexture],
          outputTarget: tempTarget,
          uniforms: interpolatedParams,
          enabled: true,
          blendMode: 'normal',
          opacity: 1.0
        };
        
        // Renderizar efeito
        this.shaderSystem.render(currentTexture, tempTarget);
        
        currentTexture = tempTarget.texture;
      }
    });
    
    return currentTexture;
  }

  private interpolateEffectParameters(effect: LayerEffect, time: number): { [key: string]: any } {
    const result = { ...effect.parameters };
    
    effect.keyframes.forEach(keyframe => {
      if (time >= keyframe.time) {
        const nextKeyframe = effect.keyframes.find(kf => kf.time > keyframe.time);
        
        if (nextKeyframe) {
          const t = (time - keyframe.time) / (nextKeyframe.time - keyframe.time);
          const easedT = this.applyEasing(t, keyframe.easing, keyframe.easingParams);
          
          Object.keys(keyframe.parameters).forEach(param => {
            if (param in nextKeyframe.parameters) {
              result[param] = this.interpolateValue(
                keyframe.parameters[param],
                nextKeyframe.parameters[param],
                easedT,
                'linear'
              );
            }
          });
        } else {
          Object.assign(result, keyframe.parameters);
        }
      }
    });
    
    return result;
  }

  private renderWithBlendMode(texture: WebGLTexture, blendMode: BlendMode, opacity: number): void {
    const program = this.blendShaders.get(blendMode);
    if (!program) return;
    
    this.gl.useProgram(program);
    
    // Configurar uniforms
    const matrixLocation = this.gl.getUniformLocation(program, 'u_matrix');
    const opacityLocation = this.gl.getUniformLocation(program, 'u_opacity');
    const textureLocation = this.gl.getUniformLocation(program, 'u_blendTexture');
    
    if (matrixLocation) {
      this.gl.uniformMatrix4fv(matrixLocation, false, this.currentMatrix);
    }
    
    if (opacityLocation) {
      this.gl.uniform1f(opacityLocation, opacity);
    }
    
    if (textureLocation) {
      this.gl.activeTexture(this.gl.TEXTURE0);
      this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
      this.gl.uniform1i(textureLocation, 0);
    }
    
    // Configurar atributos
    this.setupQuadAttributes(program);
    
    // Desenhar
    this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
  }

  private setupQuadAttributes(program: WebGLProgram): void {
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.quadBuffer);
    
    const positionLocation = this.gl.getAttribLocation(program, 'a_position');
    const texCoordLocation = this.gl.getAttribLocation(program, 'a_texCoord');
    
    if (positionLocation !== -1) {
      this.gl.enableVertexAttribArray(positionLocation);
      this.gl.vertexAttribPointer(positionLocation, 3, this.gl.FLOAT, false, 20, 0);
    }
    
    if (texCoordLocation !== -1) {
      this.gl.enableVertexAttribArray(texCoordLocation);
      this.gl.vertexAttribPointer(texCoordLocation, 2, this.gl.FLOAT, false, 20, 12);
    }
  }

  private copyToCanvas(canvas: HTMLCanvasElement): void {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Ler pixels do framebuffer
    const pixels = new Uint8Array(this.settings.width * this.settings.height * 4);
    this.gl.readPixels(0, 0, this.settings.width, this.settings.height, this.gl.RGBA, this.gl.UNSIGNED_BYTE, pixels);
    
    // Criar ImageData e desenhar no canvas
    const imageData = new ImageData(new Uint8ClampedArray(pixels), this.settings.width, this.settings.height);
    
    // Flipar verticalmente (WebGL usa coordenadas invertidas)
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = this.settings.width;
    tempCanvas.height = this.settings.height;
    const tempCtx = tempCanvas.getContext('2d')!;
    
    tempCtx.putImageData(imageData, 0, 0);
    
    ctx.save();
    ctx.scale(1, -1);
    ctx.drawImage(tempCanvas, 0, -this.settings.height);
    ctx.restore();
  }

  private createIdentityMatrix(): Float32Array {
    return new Float32Array([
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, 0,
      0, 0, 0, 1
    ]);
  }

  private pushMatrix(): void {
    this.matrixStack.push(new Float32Array(this.currentMatrix));
  }

  private popMatrix(): void {
    const matrix = this.matrixStack.pop();
    if (matrix) {
      this.currentMatrix = matrix;
    }
  }

  private applyTransform(transform: CompositeLayer['transform']): void {
    // Aplicar transformações à matriz atual
    this.translate(transform.position.x, transform.position.y, transform.position.z);
    this.rotateX(transform.rotation.x);
    this.rotateY(transform.rotation.y);
    this.rotateZ(transform.rotation.z);
    this.scale(transform.scale.x, transform.scale.y, transform.scale.z);
  }

  private translate(x: number, y: number, z: number): void {
    const translation = new Float32Array([
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, 0,
      x, y, z, 1
    ]);
    this.multiplyMatrix(translation);
  }

  private rotateX(angle: number): void {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const rotation = new Float32Array([
      1, 0, 0, 0,
      0, cos, sin, 0,
      0, -sin, cos, 0,
      0, 0, 0, 1
    ]);
    this.multiplyMatrix(rotation);
  }

  private rotateY(angle: number): void {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const rotation = new Float32Array([
      cos, 0, -sin, 0,
      0, 1, 0, 0,
      sin, 0, cos, 0,
      0, 0, 0, 1
    ]);
    this.multiplyMatrix(rotation);
  }

  private rotateZ(angle: number): void {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const rotation = new Float32Array([
      cos, sin, 0, 0,
      -sin, cos, 0, 0,
      0, 0, 1, 0,
      0, 0, 0, 1
    ]);
    this.multiplyMatrix(rotation);
  }

  private scale(x: number, y: number, z: number): void {
    const scaling = new Float32Array([
      x, 0, 0, 0,
      0, y, 0, 0,
      0, 0, z, 0,
      0, 0, 0, 1
    ]);
    this.multiplyMatrix(scaling);
  }

  private multiplyMatrix(matrix: Float32Array): void {
    const result = new Float32Array(16);
    
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        result[i * 4 + j] = 0;
        for (let k = 0; k < 4; k++) {
          result[i * 4 + j] += this.currentMatrix[i * 4 + k] * matrix[k * 4 + j];
        }
      }
    }
    
    this.currentMatrix = result;
  }

  public addKeyframe(layerId: string, keyframe: Keyframe): void {
    const layer = this.layers.get(layerId);
    if (layer) {
      layer.keyframes.push(keyframe);
      layer.keyframes.sort((a, b) => a.time - b.time);
    }
  }

  public removeKeyframe(layerId: string, keyframeId: string): void {
    const layer = this.layers.get(layerId);
    if (layer) {
      layer.keyframes = layer.keyframes.filter(kf => kf.id !== keyframeId);
    }
  }

  public updateKeyframe(layerId: string, keyframeId: string, updates: Partial<Keyframe>): void {
    const layer = this.layers.get(layerId);
    if (layer) {
      const keyframe = layer.keyframes.find(kf => kf.id === keyframeId);
      if (keyframe) {
        Object.assign(keyframe, updates);
        layer.keyframes.sort((a, b) => a.time - b.time);
      }
    }
  }

  public exportFrame(time: number): ImageData {
    this.setCurrentTime(time);
    this.render();
    
    const pixels = new Uint8Array(this.settings.width * this.settings.height * 4);
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.frameBuffer);
    this.gl.readPixels(0, 0, this.settings.width, this.settings.height, this.gl.RGBA, this.gl.UNSIGNED_BYTE, pixels);
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
    
    return new ImageData(new Uint8ClampedArray(pixels), this.settings.width, this.settings.height);
  }

  public updateSettings(settings: Partial<CompositeSettings>): void {
    Object.assign(this.settings, settings);
    
    if (settings.width || settings.height) {
      this.resize(this.settings.width, this.settings.height);
    }
    
    if (settings.backgroundColor) {
      this.gl.clearColor(
        settings.backgroundColor.r / 255,
        settings.backgroundColor.g / 255,
        settings.backgroundColor.b / 255,
        settings.backgroundColor.a
      );
    }
  }

  private resize(width: number, height: number): void {
    // Recriar framebuffer com novo tamanho
    this.gl.deleteFramebuffer(this.frameBuffer);
    this.gl.deleteRenderbuffer(this.depthBuffer);
    this.gl.deleteTexture(this.outputTexture);
    
    this.settings.width = width;
    this.settings.height = height;
    
    this.createFrameBuffer();
    this.shaderSystem.resize(width, height);
  }

  public dispose(): void {
    // Limpar camadas
    this.layers.forEach(layer => {
      if (layer.texture) {
        this.gl.deleteTexture(layer.texture);
      }
    });
    this.layers.clear();
    
    // Limpar shaders
    this.blendShaders.forEach(program => {
      this.gl.deleteProgram(program);
    });
    this.blendShaders.clear();
    
    // Limpar buffers
    this.gl.deleteFramebuffer(this.frameBuffer);
    this.gl.deleteRenderbuffer(this.depthBuffer);
    this.gl.deleteTexture(this.outputTexture);
    this.gl.deleteBuffer(this.quadBuffer);
    
    // Limpar render targets
    this.renderTargets.forEach(target => {
      this.gl.deleteFramebuffer(target.framebuffer);
      this.gl.deleteTexture(target.texture);
    });
    this.renderTargets.clear();
    
    this.shaderSystem.dispose();
  }

  public getSettings(): CompositeSettings {
    return { ...this.settings };
  }

  public getWebGLContext(): WebGLRenderingContext {
    return this.gl;
  }

  public getShaderSystem(): ShaderSystem {
    return this.shaderSystem;
  }
}

// Factory para criar camadas comuns
export class LayerFactory {
  static createVideoLayer(id: string, name: string, video: HTMLVideoElement): CompositeLayer {
    return {
      id,
      name,
      type: 'video',
      source: video,
      transform: {
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
        anchor: { x: 0.5, y: 0.5 }
      },
      opacity: 1,
      blendMode: 'normal',
      effects: [],
      visible: true,
      locked: false,
      startTime: 0,
      endTime: video.duration || 10,
      duration: video.duration || 10,
      keyframes: [],
      children: []
    };
  }

  static createImageLayer(id: string, name: string, image: HTMLImageElement): CompositeLayer {
    return {
      id,
      name,
      type: 'image',
      source: image,
      transform: {
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
        anchor: { x: 0.5, y: 0.5 }
      },
      opacity: 1,
      blendMode: 'normal',
      effects: [],
      visible: true,
      locked: false,
      startTime: 0,
      endTime: 10,
      duration: 10,
      keyframes: [],
      children: []
    };
  }

  static createTextLayer(id: string, name: string, canvas: HTMLCanvasElement): CompositeLayer {
    return {
      id,
      name,
      type: 'text',
      source: canvas,
      transform: {
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
        anchor: { x: 0.5, y: 0.5 }
      },
      opacity: 1,
      blendMode: 'normal',
      effects: [],
      visible: true,
      locked: false,
      startTime: 0,
      endTime: 10,
      duration: 10,
      keyframes: [],
      children: []
    };
  }

  static createAdjustmentLayer(id: string, name: string): CompositeLayer {
    return {
      id,
      name,
      type: 'adjustment',
      transform: {
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
        anchor: { x: 0.5, y: 0.5 }
      },
      opacity: 1,
      blendMode: 'normal',
      effects: [],
      visible: true,
      locked: false,
      startTime: 0,
      endTime: 10,
      duration: 10,
      keyframes: [],
      children: []
    };
  }
}