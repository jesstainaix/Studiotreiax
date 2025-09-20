/**
 * Engine de Renderização WebGL/WebAssembly para Processamento de Vídeo
 * Sistema otimizado com aceleração GPU e operações intensivas em WASM
 */

interface RenderingConfig {
  // Configurações de canvas
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
  fps: number;
  
  // Configurações de qualidade
  quality: 'low' | 'medium' | 'high' | 'ultra';
  antialiasing: boolean;
  enablePostProcessing: boolean;
  
  // Configurações de performance
  useWebGL2: boolean;
  enableWebAssembly: boolean;
  maxMemoryUsage: number; // MB
  
  // Configurações de debug
  enableProfiling: boolean;
  showStats: boolean;
}

interface RenderTarget {
  id: string;
  texture: WebGLTexture | null;
  framebuffer: WebGLFramebuffer | null;
  width: number;
  height: number;
  format: number;
}

interface Shader {
  program: WebGLProgram | null;
  uniforms: { [key: string]: WebGLUniformLocation | null };
  attributes: { [key: string]: number };
}

interface Effect {
  id: string;
  name: string;
  shader: Shader;
  uniforms: { [key: string]: any };
  enabled: boolean;
  priority: number;
}

interface RenderStats {
  fps: number;
  frameTime: number;
  gpuTime: number;
  memoryUsed: number;
  drawCalls: number;
  triangles: number;
  textureSwaps: number;
}

interface VideoFrame {
  timestamp: number;
  data: ImageData | ImageBitmap | HTMLVideoElement | HTMLCanvasElement;
  effects: string[];
  metadata: { [key: string]: any };
}

export class WebGLRenderingEngine {
  private gl: WebGL2RenderingContext | WebGLRenderingContext;
  private config: RenderingConfig;
  private shaders: Map<string, Shader> = new Map();
  private textures: Map<string, WebGLTexture> = new Map();
  private framebuffers: Map<string, RenderTarget> = new Map();
  private effects: Map<string, Effect> = new Map();
  private renderQueue: VideoFrame[] = [];
  private currentFrame: number = 0;
  private isRendering: boolean = false;
  private stats: RenderStats;
  private wasmModule: any = null;
  
  // Performance tracking
  private frameStartTime: number = 0;
  private lastFrameTime: number = 0;
  private fpsCounter: number = 0;
  private fpsAccumulator: number = 0;

  constructor(config: RenderingConfig) {
    this.config = config;
    this.stats = {
      fps: 0,
      frameTime: 0,
      gpuTime: 0,
      memoryUsed: 0,
      drawCalls: 0,
      triangles: 0,
      textureSwaps: 0
    };

    this.initializeWebGL();
    this.setupDefaultShaders();
    this.initializeWebAssembly();
  }

  private initializeWebGL(): void {
    const canvas = this.config.canvas;
    
    // Tentar WebGL2 primeiro, depois WebGL1
    if (this.config.useWebGL2) {
      this.gl = canvas.getContext('webgl2', {
        alpha: false,
        antialias: this.config.antialiasing,
        depth: true,
        stencil: false,
        powerPreference: 'high-performance',
        preserveDrawingBuffer: false
      }) as WebGL2RenderingContext;
    }

    if (!this.gl) {
      this.gl = canvas.getContext('webgl', {
        alpha: false,
        antialias: this.config.antialiasing,
        depth: true,
        stencil: false,
        powerPreference: 'high-performance',
        preserveDrawingBuffer: false
      }) as WebGLRenderingContext;
    }

    if (!this.gl) {
      throw new Error('WebGL não é suportado neste navegador');
    }

    // Configurar estado inicial
    this.gl.viewport(0, 0, this.config.width, this.config.height);
    this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
    this.gl.enable(this.gl.DEPTH_TEST);
    this.gl.enable(this.gl.BLEND);
    this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);

    console.log('WebGL inicializado:', {
      version: this.gl instanceof WebGL2RenderingContext ? 'WebGL2' : 'WebGL1',
      renderer: this.gl.getParameter(this.gl.RENDERER),
      vendor: this.gl.getParameter(this.gl.VENDOR),
      version: this.gl.getParameter(this.gl.VERSION)
    });
  }

  private async initializeWebAssembly(): Promise<void> {
    if (!this.config.enableWebAssembly) return;

    try {
      // Simula carregamento de módulo WASM
      // Em implementação real, você carregaria um arquivo .wasm
      this.wasmModule = {
        colorCorrection: (data: Uint8Array, brightness: number, contrast: number, saturation: number) => {
          // Implementação nativa seria em C/C++ compilado para WASM
          return this.simulateColorCorrection(data, brightness, contrast, saturation);
        },
        
        morphologicalOperations: (data: Uint8Array, operation: string, kernelSize: number) => {
          return this.simulateMorphologicalOps(data, operation, kernelSize);
        },
        
        convolution: (data: Uint8Array, kernel: Float32Array) => {
          return this.simulateConvolution(data, kernel);
        },
        
        fftTransform: (data: Float32Array) => {
          return this.simulateFFT(data);
        }
      };

      console.log('WebAssembly module carregado com sucesso');
    } catch (error) {
      console.warn('Falha ao carregar WebAssembly, usando fallback JavaScript:', error);
      this.config.enableWebAssembly = false;
    }
  }

  private setupDefaultShaders(): void {
    // Vertex shader básico
    const vertexShaderSource = `
      attribute vec2 a_position;
      attribute vec2 a_texcoord;
      
      varying vec2 v_texcoord;
      
      void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
        v_texcoord = a_texcoord;
      }
    `;

    // Fragment shader para passthrough
    const passthroughFragmentSource = `
      precision mediump float;
      
      uniform sampler2D u_texture;
      varying vec2 v_texcoord;
      
      void main() {
        gl_FragColor = texture2D(u_texture, v_texcoord);
      }
    `;

    // Fragment shader para blur
    const blurFragmentSource = `
      precision mediump float;
      
      uniform sampler2D u_texture;
      uniform vec2 u_texelSize;
      uniform float u_blurRadius;
      
      varying vec2 v_texcoord;
      
      void main() {
        vec4 color = vec4(0.0);
        float total = 0.0;
        
        for (float x = -4.0; x <= 4.0; x += 1.0) {
          for (float y = -4.0; y <= 4.0; y += 1.0) {
            vec2 offset = vec2(x, y) * u_texelSize * u_blurRadius;
            float weight = exp(-(x*x + y*y) / 8.0);
            color += texture2D(u_texture, v_texcoord + offset) * weight;
            total += weight;
          }
        }
        
        gl_FragColor = color / total;
      }
    `;

    // Fragment shader para correção de cor
    const colorCorrectionFragmentSource = `
      precision mediump float;
      
      uniform sampler2D u_texture;
      uniform float u_brightness;
      uniform float u_contrast;
      uniform float u_saturation;
      uniform float u_gamma;
      
      varying vec2 v_texcoord;
      
      vec3 rgb2hsv(vec3 c) {
        vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
        vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
        vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));
        
        float d = q.x - min(q.w, q.y);
        float e = 1.0e-10;
        return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
      }
      
      vec3 hsv2rgb(vec3 c) {
        vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
        vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
        return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
      }
      
      void main() {
        vec4 color = texture2D(u_texture, v_texcoord);
        
        // Brilho
        color.rgb += u_brightness;
        
        // Contraste
        color.rgb = (color.rgb - 0.5) * u_contrast + 0.5;
        
        // Saturação
        vec3 hsv = rgb2hsv(color.rgb);
        hsv.y *= u_saturation;
        color.rgb = hsv2rgb(hsv);
        
        // Gamma
        color.rgb = pow(color.rgb, vec3(1.0 / u_gamma));
        
        gl_FragColor = clamp(color, 0.0, 1.0);
      }
    `;

    // Criar shaders
    this.createShader('passthrough', vertexShaderSource, passthroughFragmentSource);
    this.createShader('blur', vertexShaderSource, blurFragmentSource);
    this.createShader('colorCorrection', vertexShaderSource, colorCorrectionFragmentSource);

    // Criar efeitos padrão
    this.createEffect('blur', 'Blur Gaussiano', 'blur', {
      u_blurRadius: 2.0,
      u_texelSize: [1.0 / this.config.width, 1.0 / this.config.height]
    });

    this.createEffect('colorCorrection', 'Correção de Cor', 'colorCorrection', {
      u_brightness: 0.0,
      u_contrast: 1.0,
      u_saturation: 1.0,
      u_gamma: 1.0
    });
  }

  private createShader(id: string, vertexSource: string, fragmentSource: string): void {
    const vertexShader = this.compileShader(vertexSource, this.gl.VERTEX_SHADER);
    const fragmentShader = this.compileShader(fragmentSource, this.gl.FRAGMENT_SHADER);
    
    if (!vertexShader || !fragmentShader) {
      throw new Error(`Falha ao compilar shaders para ${id}`);
    }

    const program = this.gl.createProgram();
    if (!program) {
      throw new Error(`Falha ao criar programa para ${id}`);
    }

    this.gl.attachShader(program, vertexShader);
    this.gl.attachShader(program, fragmentShader);
    this.gl.linkProgram(program);

    if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
      const error = this.gl.getProgramInfoLog(program);
      this.gl.deleteProgram(program);
      throw new Error(`Falha ao linkar programa ${id}: ${error}`);
    }

    // Obter localizações de uniforms e atributos
    const uniforms: { [key: string]: WebGLUniformLocation | null } = {};
    const attributes: { [key: string]: number } = {};

    const numUniforms = this.gl.getProgramParameter(program, this.gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < numUniforms; i++) {
      const uniform = this.gl.getActiveUniform(program, i);
      if (uniform) {
        uniforms[uniform.name] = this.gl.getUniformLocation(program, uniform.name);
      }
    }

    const numAttributes = this.gl.getProgramParameter(program, this.gl.ACTIVE_ATTRIBUTES);
    for (let i = 0; i < numAttributes; i++) {
      const attribute = this.gl.getActiveAttrib(program, i);
      if (attribute) {
        attributes[attribute.name] = this.gl.getAttribLocation(program, attribute.name);
      }
    }

    this.shaders.set(id, {
      program,
      uniforms,
      attributes
    });

    // Limpar shaders intermediários
    this.gl.deleteShader(vertexShader);
    this.gl.deleteShader(fragmentShader);
  }

  private compileShader(source: string, type: number): WebGLShader | null {
    const shader = this.gl.createShader(type);
    if (!shader) return null;

    this.gl.shaderSource(shader, source);
    this.gl.compileShader(shader);

    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      const error = this.gl.getShaderInfoLog(shader);
      console.error('Erro de compilação do shader:', error);
      this.gl.deleteShader(shader);
      return null;
    }

    return shader;
  }

  private createEffect(id: string, name: string, shaderId: string, uniforms: { [key: string]: any }): void {
    const shader = this.shaders.get(shaderId);
    if (!shader) {
      throw new Error(`Shader ${shaderId} não encontrado`);
    }

    this.effects.set(id, {
      id,
      name,
      shader,
      uniforms,
      enabled: true,
      priority: 0
    });
  }

  public addFrame(frame: VideoFrame): void {
    this.renderQueue.push(frame);
  }

  public async renderFrame(frame: VideoFrame): Promise<HTMLCanvasElement> {
    this.frameStartTime = performance.now();
    this.stats.drawCalls = 0;
    this.stats.triangles = 0;
    this.stats.textureSwaps = 0;

    // Criar texture do frame
    const frameTexture = this.createTextureFromFrame(frame);
    
    // Aplicar efeitos
    let currentTexture = frameTexture;
    const enabledEffects = Array.from(this.effects.values())
      .filter(effect => effect.enabled && frame.effects.includes(effect.id))
      .sort((a, b) => a.priority - b.priority);

    for (const effect of enabledEffects) {
      currentTexture = await this.applyEffect(effect, currentTexture);
    }

    // Renderizar resultado final
    this.renderToCanvas(currentTexture);

    // Cleanup
    if (frameTexture !== currentTexture) {
      this.gl.deleteTexture(frameTexture);
    }

    // Atualizar estatísticas
    this.updateStats();

    return this.config.canvas;
  }

  private createTextureFromFrame(frame: VideoFrame): WebGLTexture {
    const texture = this.gl.createTexture();
    if (!texture) {
      throw new Error('Falha ao criar texture');
    }

    this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
    
    // Upload data baseado no tipo
    if (frame.data instanceof ImageData) {
      this.gl.texImage2D(
        this.gl.TEXTURE_2D, 0, this.gl.RGBA,
        frame.data.width, frame.data.height, 0,
        this.gl.RGBA, this.gl.UNSIGNED_BYTE, frame.data.data
      );
    } else if (frame.data instanceof HTMLVideoElement || 
               frame.data instanceof HTMLCanvasElement ||
               frame.data instanceof ImageBitmap) {
      this.gl.texImage2D(
        this.gl.TEXTURE_2D, 0, this.gl.RGBA,
        this.gl.RGBA, this.gl.UNSIGNED_BYTE, frame.data
      );
    }

    // Configurar parâmetros de texture
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);

    this.stats.textureSwaps++;
    return texture;
  }

  private async applyEffect(effect: Effect, inputTexture: WebGLTexture): Promise<WebGLTexture> {
    // Usar WebAssembly para operações intensivas se disponível
    if (this.config.enableWebAssembly && this.wasmModule) {
      return this.applyEffectWithWASM(effect, inputTexture);
    }

    // Fallback para WebGL
    return this.applyEffectWithWebGL(effect, inputTexture);
  }

  private async applyEffectWithWASM(effect: Effect, inputTexture: WebGLTexture): Promise<WebGLTexture> {
    // Ler dados da texture
    const framebuffer = this.gl.createFramebuffer();
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, framebuffer);
    this.gl.framebufferTexture2D(
      this.gl.FRAMEBUFFER, this.gl.COLOR_ATTACHMENT0,
      this.gl.TEXTURE_2D, inputTexture, 0
    );

    const pixels = new Uint8Array(this.config.width * this.config.height * 4);
    this.gl.readPixels(0, 0, this.config.width, this.config.height, this.gl.RGBA, this.gl.UNSIGNED_BYTE, pixels);

    // Processar com WASM
    let processedPixels: Uint8Array;
    
    switch (effect.id) {
      case 'colorCorrection':
        processedPixels = this.wasmModule.colorCorrection(
          pixels,
          effect.uniforms.u_brightness,
          effect.uniforms.u_contrast,
          effect.uniforms.u_saturation
        );
        break;
      
      default:
        processedPixels = pixels; // Sem processamento
    }

    // Criar nova texture com dados processados
    const outputTexture = this.gl.createTexture();
    if (!outputTexture) {
      throw new Error('Falha ao criar texture de saída');
    }

    this.gl.bindTexture(this.gl.TEXTURE_2D, outputTexture);
    this.gl.texImage2D(
      this.gl.TEXTURE_2D, 0, this.gl.RGBA,
      this.config.width, this.config.height, 0,
      this.gl.RGBA, this.gl.UNSIGNED_BYTE, processedPixels
    );

    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);

    // Cleanup
    this.gl.deleteFramebuffer(framebuffer);

    return outputTexture;
  }

  private applyEffectWithWebGL(effect: Effect, inputTexture: WebGLTexture): WebGLTexture {
    // Criar framebuffer de destino
    const outputTexture = this.gl.createTexture();
    if (!outputTexture) {
      throw new Error('Falha ao criar texture de saída');
    }

    this.gl.bindTexture(this.gl.TEXTURE_2D, outputTexture);
    this.gl.texImage2D(
      this.gl.TEXTURE_2D, 0, this.gl.RGBA,
      this.config.width, this.config.height, 0,
      this.gl.RGBA, this.gl.UNSIGNED_BYTE, null
    );

    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);

    const framebuffer = this.gl.createFramebuffer();
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, framebuffer);
    this.gl.framebufferTexture2D(
      this.gl.FRAMEBUFFER, this.gl.COLOR_ATTACHMENT0,
      this.gl.TEXTURE_2D, outputTexture, 0
    );

    // Configurar viewport
    this.gl.viewport(0, 0, this.config.width, this.config.height);

    // Usar shader do efeito
    this.gl.useProgram(effect.shader.program);

    // Bind texture de entrada
    this.gl.activeTexture(this.gl.TEXTURE0);
    this.gl.bindTexture(this.gl.TEXTURE_2D, inputTexture);
    this.gl.uniform1i(effect.shader.uniforms.u_texture, 0);

    // Definir uniforms do efeito
    for (const [name, value] of Object.entries(effect.uniforms)) {
      const location = effect.shader.uniforms[name];
      if (location !== null && location !== undefined) {
        if (typeof value === 'number') {
          this.gl.uniform1f(location, value);
        } else if (Array.isArray(value)) {
          if (value.length === 2) {
            this.gl.uniform2fv(location, value);
          } else if (value.length === 3) {
            this.gl.uniform3fv(location, value);
          } else if (value.length === 4) {
            this.gl.uniform4fv(location, value);
          }
        }
      }
    }

    // Renderizar quad
    this.renderQuad(effect.shader);

    // Cleanup
    this.gl.deleteFramebuffer(framebuffer);
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);

    this.stats.drawCalls++;
    this.stats.triangles += 2;

    return outputTexture;
  }

  private renderQuad(shader: Shader): void {
    // Coordenadas do quad
    const vertices = new Float32Array([
      -1, -1,  0, 0,
       1, -1,  1, 0,
      -1,  1,  0, 1,
       1,  1,  1, 1
    ]);

    const buffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, vertices, this.gl.STATIC_DRAW);

    // Posição
    if (shader.attributes.a_position !== undefined) {
      this.gl.enableVertexAttribArray(shader.attributes.a_position);
      this.gl.vertexAttribPointer(shader.attributes.a_position, 2, this.gl.FLOAT, false, 16, 0);
    }

    // Coordenadas de textura
    if (shader.attributes.a_texcoord !== undefined) {
      this.gl.enableVertexAttribArray(shader.attributes.a_texcoord);
      this.gl.vertexAttribPointer(shader.attributes.a_texcoord, 2, this.gl.FLOAT, false, 16, 8);
    }

    this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);

    this.gl.deleteBuffer(buffer);
  }

  private renderToCanvas(texture: WebGLTexture): void {
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
    this.gl.viewport(0, 0, this.config.width, this.config.height);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);

    const passthroughShader = this.shaders.get('passthrough');
    if (!passthroughShader) return;

    this.gl.useProgram(passthroughShader.program);

    this.gl.activeTexture(this.gl.TEXTURE0);
    this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
    this.gl.uniform1i(passthroughShader.uniforms.u_texture, 0);

    this.renderQuad(passthroughShader);
  }

  private updateStats(): void {
    const currentTime = performance.now();
    this.stats.frameTime = currentTime - this.frameStartTime;
    
    this.fpsAccumulator += currentTime - this.lastFrameTime;
    this.fpsCounter++;
    
    if (this.fpsAccumulator >= 1000) {
      this.stats.fps = Math.round((this.fpsCounter * 1000) / this.fpsAccumulator);
      this.fpsAccumulator = 0;
      this.fpsCounter = 0;
    }
    
    this.lastFrameTime = currentTime;

    // Estimar uso de memória GPU
    this.stats.memoryUsed = this.estimateGPUMemoryUsage();
  }

  private estimateGPUMemoryUsage(): number {
    // Estimativa baseada em texturas ativas
    const textureCount = this.textures.size + this.framebuffers.size;
    const bytesPerPixel = 4; // RGBA
    const pixelsPerTexture = this.config.width * this.config.height;
    
    return (textureCount * pixelsPerTexture * bytesPerPixel) / (1024 * 1024); // MB
  }

  // Simulações de operações WASM (substituir por implementação real)
  private simulateColorCorrection(data: Uint8Array, brightness: number, contrast: number, saturation: number): Uint8Array {
    const result = new Uint8Array(data.length);
    
    for (let i = 0; i < data.length; i += 4) {
      let r = data[i] / 255;
      let g = data[i + 1] / 255;
      let b = data[i + 2] / 255;
      
      // Brilho
      r += brightness;
      g += brightness;
      b += brightness;
      
      // Contraste
      r = (r - 0.5) * contrast + 0.5;
      g = (g - 0.5) * contrast + 0.5;
      b = (b - 0.5) * contrast + 0.5;
      
      // Saturação (conversão simplificada)
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;
      r = gray + saturation * (r - gray);
      g = gray + saturation * (g - gray);
      b = gray + saturation * (b - gray);
      
      result[i] = Math.max(0, Math.min(255, r * 255));
      result[i + 1] = Math.max(0, Math.min(255, g * 255));
      result[i + 2] = Math.max(0, Math.min(255, b * 255));
      result[i + 3] = data[i + 3];
    }
    
    return result;
  }

  private simulateMorphologicalOps(data: Uint8Array, operation: string, kernelSize: number): Uint8Array {
    // Implementação simplificada de operações morfológicas
    return new Uint8Array(data);
  }

  private simulateConvolution(data: Uint8Array, kernel: Float32Array): Uint8Array {
    // Implementação simplificada de convolução
    return new Uint8Array(data);
  }

  private simulateFFT(data: Float32Array): Float32Array {
    // Implementação simplificada de FFT
    return new Float32Array(data);
  }

  // Métodos públicos para controle
  public getStats(): RenderStats {
    return { ...this.stats };
  }

  public setEffectParameter(effectId: string, parameter: string, value: any): void {
    const effect = this.effects.get(effectId);
    if (effect) {
      effect.uniforms[parameter] = value;
    }
  }

  public enableEffect(effectId: string, enabled: boolean = true): void {
    const effect = this.effects.get(effectId);
    if (effect) {
      effect.enabled = enabled;
    }
  }

  public getAvailableEffects(): Effect[] {
    return Array.from(this.effects.values());
  }

  public dispose(): void {
    // Limpar recursos WebGL
    this.shaders.forEach(shader => {
      if (shader.program) {
        this.gl.deleteProgram(shader.program);
      }
    });

    this.textures.forEach(texture => {
      this.gl.deleteTexture(texture);
    });

    this.framebuffers.forEach(target => {
      if (target.framebuffer) {
        this.gl.deleteFramebuffer(target.framebuffer);
      }
      if (target.texture) {
        this.gl.deleteTexture(target.texture);
      }
    });

    this.shaders.clear();
    this.textures.clear();
    this.framebuffers.clear();
    this.effects.clear();
  }
}

export default WebGLRenderingEngine;