// Sistema de Shaders - Gerenciamento de shaders para efeitos visuais
import { EventEmitter } from '../utils/EventEmitter';

export interface ShaderProgram {
  id: string;
  name: string;
  vertexShader: string;
  fragmentShader: string;
  uniforms: Record<string, any>;
  attributes: Record<string, any>;
  compiled: boolean;
}

export interface ShaderEffect {
  id: string;
  name: string;
  shader: string;
  parameters: Record<string, any>;
  enabled: boolean;
}

class ShaderSystem extends EventEmitter {
  private shaders: Map<string, ShaderProgram> = new Map();
  private effects: Map<string, ShaderEffect> = new Map();
  private gl: WebGLRenderingContext | null = null;
  private isInitialized = false;

  constructor() {
    super();
  }

  async initialize(canvas?: HTMLCanvasElement): Promise<void> {
    try {
      if (canvas) {
        const context = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        this.gl = context as WebGLRenderingContext;
      }
      
      this.loadDefaultShaders();
      this.isInitialized = true;
      this.emit('initialized');
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  private loadDefaultShaders(): void {
    // Shader básico de vértice
    const basicVertexShader = `
      attribute vec4 a_position;
      attribute vec2 a_texCoord;
      varying vec2 v_texCoord;
      
      void main() {
        gl_Position = a_position;
        v_texCoord = a_texCoord;
      }
    `;

    // Shader básico de fragmento
    const basicFragmentShader = `
      precision mediump float;
      uniform sampler2D u_texture;
      varying vec2 v_texCoord;
      
      void main() {
        gl_FragColor = texture2D(u_texture, v_texCoord);
      }
    `;

    // Shader de blur
    const blurFragmentShader = `
      precision mediump float;
      uniform sampler2D u_texture;
      uniform vec2 u_resolution;
      uniform float u_blurRadius;
      varying vec2 v_texCoord;
      
      void main() {
        vec2 texelSize = 1.0 / u_resolution;
        vec4 color = vec4(0.0);
        float total = 0.0;
        
        for (float x = -4.0; x <= 4.0; x++) {
          for (float y = -4.0; y <= 4.0; y++) {
            vec2 offset = vec2(x, y) * texelSize * u_blurRadius;
            color += texture2D(u_texture, v_texCoord + offset);
            total += 1.0;
          }
        }
        
        gl_FragColor = color / total;
      }
    `;

    // Registrar shaders padrão
    this.createShader({
      name: 'Basic',
      vertexShader: basicVertexShader,
      fragmentShader: basicFragmentShader,
      uniforms: {},
      attributes: { a_position: 0, a_texCoord: 1 }
    });

    this.createShader({
      name: 'Blur',
      vertexShader: basicVertexShader,
      fragmentShader: blurFragmentShader,
      uniforms: { u_blurRadius: 1.0 },
      attributes: { a_position: 0, a_texCoord: 1 }
    });
  }

  createShader(config: Partial<ShaderProgram>): string {
    const shaderId = `shader-${Date.now()}`;
    const shader: ShaderProgram = {
      id: shaderId,
      name: config.name || 'Novo Shader',
      vertexShader: config.vertexShader || '',
      fragmentShader: config.fragmentShader || '',
      uniforms: config.uniforms || {},
      attributes: config.attributes || {},
      compiled: false
    };

    if (this.gl) {
      shader.compiled = this.compileShader(shader);
    }

    this.shaders.set(shaderId, shader);
    this.emit('shaderCreated', shader);
    return shaderId;
  }

  private compileShader(shader: ShaderProgram): boolean {
    if (!this.gl) return false;

    try {
      const vertexShader = this.gl.createShader(this.gl.VERTEX_SHADER);
      const fragmentShader = this.gl.createShader(this.gl.FRAGMENT_SHADER);

      if (!vertexShader || !fragmentShader) return false;

      this.gl.shaderSource(vertexShader, shader.vertexShader);
      this.gl.compileShader(vertexShader);

      this.gl.shaderSource(fragmentShader, shader.fragmentShader);
      this.gl.compileShader(fragmentShader);

      const program = this.gl.createProgram();
      if (!program) return false;

      this.gl.attachShader(program, vertexShader);
      this.gl.attachShader(program, fragmentShader);
      this.gl.linkProgram(program);

      return this.gl.getProgramParameter(program, this.gl.LINK_STATUS);
    } catch (error) {
      console.error('Erro ao compilar shader:', error);
      return false;
    }
  }

  createEffect(shaderId: string, parameters: Record<string, any>): string {
    const effectId = `effect-${Date.now()}`;
    const effect: ShaderEffect = {
      id: effectId,
      name: `Efeito ${effectId}`,
      shader: shaderId,
      parameters,
      enabled: true
    };

    this.effects.set(effectId, effect);
    this.emit('effectCreated', effect);
    return effectId;
  }

  applyEffect(effectId: string, inputTexture: any): any {
    const effect = this.effects.get(effectId);
    if (!effect || !effect.enabled) return inputTexture;

    const shader = this.shaders.get(effect.shader);
    if (!shader || !shader.compiled) return inputTexture;

    // Simular aplicação do efeito
    this.emit('effectApplied', { effectId, shader: shader.name });
    return inputTexture; // Retornar textura processada
  }

  getShaders(): ShaderProgram[] {
    return Array.from(this.shaders.values());
  }

  getEffects(): ShaderEffect[] {
    return Array.from(this.effects.values());
  }

  dispose(): void {
    this.shaders.clear();
    this.effects.clear();
    this.gl = null;
    this.isInitialized = false;
    this.emit('disposed');
  }
}

export default ShaderSystem;