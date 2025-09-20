export interface ShaderUniform {
  name: string;
  type: 'float' | 'vec2' | 'vec3' | 'vec4' | 'mat3' | 'mat4' | 'sampler2D' | 'samplerCube' | 'int' | 'bool';
  value: any;
}

export interface ShaderAttribute {
  name: string;
  type: 'float' | 'vec2' | 'vec3' | 'vec4';
  buffer: WebGLBuffer;
  size: number;
  normalized: boolean;
}

export interface ShaderProgram {
  id: string;
  name: string;
  vertexShader: string;
  fragmentShader: string;
  program?: WebGLProgram;
  uniforms: Map<string, WebGLUniformLocation>;
  attributes: Map<string, number>;
  compiled: boolean;
}

export interface ShaderEffect {
  id: string;
  name: string;
  category: 'color' | 'distortion' | 'blur' | 'lighting' | 'composite' | 'transition' | 'particle';
  description: string;
  shaderProgram: ShaderProgram;
  uniforms: ShaderUniform[];
  presets: ShaderPreset[];
  enabled: boolean;
}

export interface ShaderPreset {
  id: string;
  name: string;
  description: string;
  uniforms: { [key: string]: any };
}

export interface RenderTarget {
  id: string;
  name: string;
  framebuffer: WebGLFramebuffer;
  texture: WebGLTexture;
  width: number;
  height: number;
  format: number;
  type: number;
}

export interface ShaderPass {
  id: string;
  name: string;
  effect: ShaderEffect;
  inputTextures: WebGLTexture[];
  outputTarget?: RenderTarget;
  uniforms: { [key: string]: any };
  enabled: boolean;
  blendMode: 'normal' | 'multiply' | 'screen' | 'overlay' | 'add' | 'subtract';
  opacity: number;
}

export class ShaderSystem {
  private gl: WebGLRenderingContext;
  private canvas: HTMLCanvasElement;
  private effects: Map<string, ShaderEffect> = new Map();
  private renderTargets: Map<string, RenderTarget> = new Map();
  private passes: ShaderPass[] = [];
  private quadBuffer: WebGLBuffer;
  private quadVertices: Float32Array;
  private currentProgram?: WebGLProgram;
  private extensions: { [key: string]: any } = {};
  private maxTextureUnits: number;
  private maxRenderBufferSize: number;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    
    if (!gl) {
      throw new Error('WebGL não suportado');
    }
    
    this.gl = gl as WebGLRenderingContext;
    this.initializeWebGL();
    this.createQuadBuffer();
    this.loadExtensions();
    this.initializeBuiltInEffects();
  }

  private initializeWebGL(): void {
    this.gl.enable(this.gl.BLEND);
    this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
    this.gl.disable(this.gl.DEPTH_TEST);
    this.gl.disable(this.gl.CULL_FACE);
    
    this.maxTextureUnits = this.gl.getParameter(this.gl.MAX_TEXTURE_IMAGE_UNITS);
    this.maxRenderBufferSize = this.gl.getParameter(this.gl.MAX_RENDERBUFFER_SIZE);
  }

  private loadExtensions(): void {
    const extensionNames = [
      'OES_texture_float',
      'OES_texture_half_float',
      'WEBGL_depth_texture',
      'EXT_texture_filter_anisotropic',
      'WEBGL_draw_buffers'
    ];

    extensionNames.forEach(name => {
      const ext = this.gl.getExtension(name);
      if (ext) {
        this.extensions[name] = ext;
      }
    });
  }

  private createQuadBuffer(): void {
    this.quadVertices = new Float32Array([
      -1, -1, 0, 0,
       1, -1, 1, 0,
      -1,  1, 0, 1,
       1,  1, 1, 1
    ]);

    this.quadBuffer = this.gl.createBuffer()!;
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.quadBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, this.quadVertices, this.gl.STATIC_DRAW);
  }

  private initializeBuiltInEffects(): void {
    // Efeito de Blur Gaussiano
    this.addEffect({
      id: 'gaussian-blur',
      name: 'Gaussian Blur',
      category: 'blur',
      description: 'Aplica desfoque gaussiano',
      shaderProgram: this.createGaussianBlurShader(),
      uniforms: [
        { name: 'u_resolution', type: 'vec2', value: [this.canvas.width, this.canvas.height] },
        { name: 'u_blurRadius', type: 'float', value: 5.0 },
        { name: 'u_direction', type: 'vec2', value: [1.0, 0.0] }
      ],
      presets: [
        { id: 'light', name: 'Light Blur', description: 'Desfoque leve', uniforms: { u_blurRadius: 2.0 } },
        { id: 'medium', name: 'Medium Blur', description: 'Desfoque médio', uniforms: { u_blurRadius: 5.0 } },
        { id: 'heavy', name: 'Heavy Blur', description: 'Desfoque pesado', uniforms: { u_blurRadius: 10.0 } }
      ],
      enabled: false
    });

    // Efeito de Correção de Cor
    this.addEffect({
      id: 'color-correction',
      name: 'Color Correction',
      category: 'color',
      description: 'Ajusta brilho, contraste, saturação e matiz',
      shaderProgram: this.createColorCorrectionShader(),
      uniforms: [
        { name: 'u_brightness', type: 'float', value: 0.0 },
        { name: 'u_contrast', type: 'float', value: 1.0 },
        { name: 'u_saturation', type: 'float', value: 1.0 },
        { name: 'u_hue', type: 'float', value: 0.0 },
        { name: 'u_gamma', type: 'float', value: 1.0 }
      ],
      presets: [
        { id: 'warm', name: 'Warm', description: 'Tom quente', uniforms: { u_hue: 0.1, u_saturation: 1.2 } },
        { id: 'cool', name: 'Cool', description: 'Tom frio', uniforms: { u_hue: -0.1, u_saturation: 1.1 } },
        { id: 'vintage', name: 'Vintage', description: 'Efeito vintage', uniforms: { u_contrast: 1.2, u_saturation: 0.8, u_gamma: 1.1 } }
      ],
      enabled: false
    });

    // Efeito de Distorção
    this.addEffect({
      id: 'distortion',
      name: 'Distortion',
      category: 'distortion',
      description: 'Aplica distorções geométricas',
      shaderProgram: this.createDistortionShader(),
      uniforms: [
        { name: 'u_time', type: 'float', value: 0.0 },
        { name: 'u_amplitude', type: 'float', value: 0.1 },
        { name: 'u_frequency', type: 'float', value: 10.0 },
        { name: 'u_speed', type: 'float', value: 1.0 },
        { name: 'u_center', type: 'vec2', value: [0.5, 0.5] }
      ],
      presets: [
        { id: 'wave', name: 'Wave', description: 'Ondas', uniforms: { u_amplitude: 0.05, u_frequency: 8.0 } },
        { id: 'ripple', name: 'Ripple', description: 'Ondulação', uniforms: { u_amplitude: 0.1, u_frequency: 15.0 } },
        { id: 'twist', name: 'Twist', description: 'Torção', uniforms: { u_amplitude: 0.2, u_frequency: 5.0 } }
      ],
      enabled: false
    });

    // Efeito de Chromatic Aberration
    this.addEffect({
      id: 'chromatic-aberration',
      name: 'Chromatic Aberration',
      category: 'distortion',
      description: 'Simula aberração cromática',
      shaderProgram: this.createChromaticAberrationShader(),
      uniforms: [
        { name: 'u_offset', type: 'float', value: 0.005 },
        { name: 'u_center', type: 'vec2', value: [0.5, 0.5] }
      ],
      presets: [
        { id: 'subtle', name: 'Subtle', description: 'Sutil', uniforms: { u_offset: 0.002 } },
        { id: 'moderate', name: 'Moderate', description: 'Moderado', uniforms: { u_offset: 0.005 } },
        { id: 'extreme', name: 'Extreme', description: 'Extremo', uniforms: { u_offset: 0.01 } }
      ],
      enabled: false
    });

    // Efeito de Bloom
    this.addEffect({
      id: 'bloom',
      name: 'Bloom',
      category: 'lighting',
      description: 'Efeito de brilho e luminosidade',
      shaderProgram: this.createBloomShader(),
      uniforms: [
        { name: 'u_threshold', type: 'float', value: 0.8 },
        { name: 'u_intensity', type: 'float', value: 1.0 },
        { name: 'u_radius', type: 'float', value: 1.0 }
      ],
      presets: [
        { id: 'soft', name: 'Soft Bloom', description: 'Bloom suave', uniforms: { u_threshold: 0.9, u_intensity: 0.8 } },
        { id: 'dramatic', name: 'Dramatic Bloom', description: 'Bloom dramático', uniforms: { u_threshold: 0.6, u_intensity: 1.5 } }
      ],
      enabled: false
    });

    // Efeito de Vinheta
    this.addEffect({
      id: 'vignette',
      name: 'Vignette',
      category: 'color',
      description: 'Escurece as bordas da imagem',
      shaderProgram: this.createVignetteShader(),
      uniforms: [
        { name: 'u_intensity', type: 'float', value: 0.5 },
        { name: 'u_radius', type: 'float', value: 0.8 },
        { name: 'u_softness', type: 'float', value: 0.3 }
      ],
      presets: [
        { id: 'light', name: 'Light Vignette', description: 'Vinheta leve', uniforms: { u_intensity: 0.3 } },
        { id: 'heavy', name: 'Heavy Vignette', description: 'Vinheta pesada', uniforms: { u_intensity: 0.8 } }
      ],
      enabled: false
    });
  }

  private createGaussianBlurShader(): ShaderProgram {
    const vertexShader = `
      attribute vec2 a_position;
      attribute vec2 a_texCoord;
      varying vec2 v_texCoord;
      
      void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
        v_texCoord = a_texCoord;
      }
    `;

    const fragmentShader = `
      precision mediump float;
      
      uniform sampler2D u_texture;
      uniform vec2 u_resolution;
      uniform float u_blurRadius;
      uniform vec2 u_direction;
      
      varying vec2 v_texCoord;
      
      void main() {
        vec2 texelSize = 1.0 / u_resolution;
        vec4 color = vec4(0.0);
        float totalWeight = 0.0;
        
        for (float i = -u_blurRadius; i <= u_blurRadius; i++) {
          float weight = exp(-0.5 * (i * i) / (u_blurRadius * u_blurRadius));
          vec2 offset = i * texelSize * u_direction;
          color += texture2D(u_texture, v_texCoord + offset) * weight;
          totalWeight += weight;
        }
        
        gl_FragColor = color / totalWeight;
      }
    `;

    return this.createShaderProgram('gaussian-blur', 'Gaussian Blur', vertexShader, fragmentShader);
  }

  private createColorCorrectionShader(): ShaderProgram {
    const vertexShader = `
      attribute vec2 a_position;
      attribute vec2 a_texCoord;
      varying vec2 v_texCoord;
      
      void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
        v_texCoord = a_texCoord;
      }
    `;

    const fragmentShader = `
      precision mediump float;
      
      uniform sampler2D u_texture;
      uniform float u_brightness;
      uniform float u_contrast;
      uniform float u_saturation;
      uniform float u_hue;
      uniform float u_gamma;
      
      varying vec2 v_texCoord;
      
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
        vec4 color = texture2D(u_texture, v_texCoord);
        
        // Brilho
        color.rgb += u_brightness;
        
        // Contraste
        color.rgb = (color.rgb - 0.5) * u_contrast + 0.5;
        
        // Saturação e Matiz
        vec3 hsv = rgb2hsv(color.rgb);
        hsv.x += u_hue;
        hsv.y *= u_saturation;
        color.rgb = hsv2rgb(hsv);
        
        // Gamma
        color.rgb = pow(color.rgb, vec3(1.0 / u_gamma));
        
        gl_FragColor = color;
      }
    `;

    return this.createShaderProgram('color-correction', 'Color Correction', vertexShader, fragmentShader);
  }

  private createDistortionShader(): ShaderProgram {
    const vertexShader = `
      attribute vec2 a_position;
      attribute vec2 a_texCoord;
      varying vec2 v_texCoord;
      
      void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
        v_texCoord = a_texCoord;
      }
    `;

    const fragmentShader = `
      precision mediump float;
      
      uniform sampler2D u_texture;
      uniform float u_time;
      uniform float u_amplitude;
      uniform float u_frequency;
      uniform float u_speed;
      uniform vec2 u_center;
      
      varying vec2 v_texCoord;
      
      void main() {
        vec2 coord = v_texCoord;
        vec2 toCenter = coord - u_center;
        float distance = length(toCenter);
        
        // Distorção ondular
        float wave = sin(distance * u_frequency + u_time * u_speed) * u_amplitude;
        coord += normalize(toCenter) * wave;
        
        gl_FragColor = texture2D(u_texture, coord);
      }
    `;

    return this.createShaderProgram('distortion', 'Distortion', vertexShader, fragmentShader);
  }

  private createChromaticAberrationShader(): ShaderProgram {
    const vertexShader = `
      attribute vec2 a_position;
      attribute vec2 a_texCoord;
      varying vec2 v_texCoord;
      
      void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
        v_texCoord = a_texCoord;
      }
    `;

    const fragmentShader = `
      precision mediump float;
      
      uniform sampler2D u_texture;
      uniform float u_offset;
      uniform vec2 u_center;
      
      varying vec2 v_texCoord;
      
      void main() {
        vec2 toCenter = v_texCoord - u_center;
        float distance = length(toCenter);
        vec2 direction = normalize(toCenter);
        
        vec2 redOffset = direction * u_offset * distance;
        vec2 greenOffset = vec2(0.0);
        vec2 blueOffset = -direction * u_offset * distance;
        
        float r = texture2D(u_texture, v_texCoord + redOffset).r;
        float g = texture2D(u_texture, v_texCoord + greenOffset).g;
        float b = texture2D(u_texture, v_texCoord + blueOffset).b;
        float a = texture2D(u_texture, v_texCoord).a;
        
        gl_FragColor = vec4(r, g, b, a);
      }
    `;

    return this.createShaderProgram('chromatic-aberration', 'Chromatic Aberration', vertexShader, fragmentShader);
  }

  private createBloomShader(): ShaderProgram {
    const vertexShader = `
      attribute vec2 a_position;
      attribute vec2 a_texCoord;
      varying vec2 v_texCoord;
      
      void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
        v_texCoord = a_texCoord;
      }
    `;

    const fragmentShader = `
      precision mediump float;
      
      uniform sampler2D u_texture;
      uniform float u_threshold;
      uniform float u_intensity;
      uniform float u_radius;
      
      varying vec2 v_texCoord;
      
      void main() {
        vec4 color = texture2D(u_texture, v_texCoord);
        
        // Extrair pixels brilhantes
        float brightness = dot(color.rgb, vec3(0.299, 0.587, 0.114));
        
        if (brightness > u_threshold) {
          vec4 bloom = color * u_intensity;
          gl_FragColor = mix(color, bloom, 0.5);
        } else {
          gl_FragColor = color;
        }
      }
    `;

    return this.createShaderProgram('bloom', 'Bloom', vertexShader, fragmentShader);
  }

  private createVignetteShader(): ShaderProgram {
    const vertexShader = `
      attribute vec2 a_position;
      attribute vec2 a_texCoord;
      varying vec2 v_texCoord;
      
      void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
        v_texCoord = a_texCoord;
      }
    `;

    const fragmentShader = `
      precision mediump float;
      
      uniform sampler2D u_texture;
      uniform float u_intensity;
      uniform float u_radius;
      uniform float u_softness;
      
      varying vec2 v_texCoord;
      
      void main() {
        vec4 color = texture2D(u_texture, v_texCoord);
        
        vec2 center = vec2(0.5, 0.5);
        float distance = length(v_texCoord - center);
        
        float vignette = smoothstep(u_radius, u_radius - u_softness, distance);
        vignette = mix(1.0 - u_intensity, 1.0, vignette);
        
        gl_FragColor = vec4(color.rgb * vignette, color.a);
      }
    `;

    return this.createShaderProgram('vignette', 'Vignette', vertexShader, fragmentShader);
  }

  private createShaderProgram(id: string, name: string, vertexSource: string, fragmentSource: string): ShaderProgram {
    const program: ShaderProgram = {
      id,
      name,
      vertexShader: vertexSource,
      fragmentShader: fragmentSource,
      uniforms: new Map(),
      attributes: new Map(),
      compiled: false
    };

    this.compileShaderProgram(program);
    return program;
  }

  private compileShaderProgram(program: ShaderProgram): boolean {
    const vertexShader = this.createShader(this.gl.VERTEX_SHADER, program.vertexShader);
    const fragmentShader = this.createShader(this.gl.FRAGMENT_SHADER, program.fragmentShader);

    if (!vertexShader || !fragmentShader) {
      console.error(`Erro ao compilar shaders para ${program.name}`);
      return false;
    }

    const glProgram = this.gl.createProgram()!;
    this.gl.attachShader(glProgram, vertexShader);
    this.gl.attachShader(glProgram, fragmentShader);
    this.gl.linkProgram(glProgram);

    if (!this.gl.getProgramParameter(glProgram, this.gl.LINK_STATUS)) {
      console.error(`Erro ao linkar programa ${program.name}:`, this.gl.getProgramInfoLog(glProgram));
      this.gl.deleteProgram(glProgram);
      return false;
    }

    program.program = glProgram;
    program.compiled = true;

    // Obter localizações de uniforms e atributos
    this.cacheUniformsAndAttributes(program);

    // Limpar shaders
    this.gl.deleteShader(vertexShader);
    this.gl.deleteShader(fragmentShader);

    return true;
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

  private cacheUniformsAndAttributes(program: ShaderProgram): void {
    if (!program.program) return;

    // Cache uniforms
    const uniformCount = this.gl.getProgramParameter(program.program, this.gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < uniformCount; i++) {
      const uniform = this.gl.getActiveUniform(program.program, i);
      if (uniform) {
        const location = this.gl.getUniformLocation(program.program, uniform.name);
        if (location) {
          program.uniforms.set(uniform.name, location);
        }
      }
    }

    // Cache attributes
    const attributeCount = this.gl.getProgramParameter(program.program, this.gl.ACTIVE_ATTRIBUTES);
    for (let i = 0; i < attributeCount; i++) {
      const attribute = this.gl.getActiveAttrib(program.program, i);
      if (attribute) {
        const location = this.gl.getAttribLocation(program.program, attribute.name);
        program.attributes.set(attribute.name, location);
      }
    }
  }

  public addEffect(effect: ShaderEffect): void {
    this.effects.set(effect.id, effect);
  }

  public removeEffect(effectId: string): void {
    const effect = this.effects.get(effectId);
    if (effect && effect.shaderProgram.program) {
      this.gl.deleteProgram(effect.shaderProgram.program);
    }
    this.effects.delete(effectId);
  }

  public getEffect(effectId: string): ShaderEffect | undefined {
    return this.effects.get(effectId);
  }

  public getAllEffects(): ShaderEffect[] {
    return Array.from(this.effects.values());
  }

  public getEffectsByCategory(category: string): ShaderEffect[] {
    return Array.from(this.effects.values()).filter(effect => effect.category === category);
  }

  public createRenderTarget(id: string, name: string, width: number, height: number): RenderTarget {
    const framebuffer = this.gl.createFramebuffer()!;
    const texture = this.gl.createTexture()!;

    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, framebuffer);
    
    this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
    this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, width, height, 0, this.gl.RGBA, this.gl.UNSIGNED_BYTE, null);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);

    this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, this.gl.COLOR_ATTACHMENT0, this.gl.TEXTURE_2D, texture, 0);

    if (this.gl.checkFramebufferStatus(this.gl.FRAMEBUFFER) !== this.gl.FRAMEBUFFER_COMPLETE) {
      console.error('Framebuffer não está completo');
    }

    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);

    const renderTarget: RenderTarget = {
      id,
      name,
      framebuffer,
      texture,
      width,
      height,
      format: this.gl.RGBA,
      type: this.gl.UNSIGNED_BYTE
    };

    this.renderTargets.set(id, renderTarget);
    return renderTarget;
  }

  public addPass(pass: ShaderPass): void {
    this.passes.push(pass);
  }

  public removePass(passId: string): void {
    this.passes = this.passes.filter(pass => pass.id !== passId);
  }

  public clearPasses(): void {
    this.passes = [];
  }

  public render(inputTexture: WebGLTexture, outputTarget?: RenderTarget): void {
    let currentTexture = inputTexture;
    let tempTarget: RenderTarget | undefined;

    // Criar render target temporário se necessário
    if (this.passes.length > 1) {
      tempTarget = this.createRenderTarget(
        'temp-' + Date.now(),
        'Temporary',
        this.canvas.width,
        this.canvas.height
      );
    }

    this.passes.forEach((pass, index) => {
      if (!pass.enabled) return;

      const isLastPass = index === this.passes.length - 1;
      const target = isLastPass ? outputTarget : tempTarget;

      this.renderPass(pass, currentTexture, target);

      if (!isLastPass && tempTarget) {
        currentTexture = tempTarget.texture;
      }
    });

    // Limpar render target temporário
    if (tempTarget) {
      this.gl.deleteFramebuffer(tempTarget.framebuffer);
      this.gl.deleteTexture(tempTarget.texture);
      this.renderTargets.delete(tempTarget.id);
    }
  }

  private renderPass(pass: ShaderPass, inputTexture: WebGLTexture, outputTarget?: RenderTarget): void {
    const effect = pass.effect;
    const program = effect.shaderProgram.program;

    if (!program || !effect.shaderProgram.compiled) {
      console.warn(`Shader program não compilado para efeito ${effect.name}`);
      return;
    }

    // Configurar render target
    if (outputTarget) {
      this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, outputTarget.framebuffer);
      this.gl.viewport(0, 0, outputTarget.width, outputTarget.height);
    } else {
      this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
      this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    }

    // Usar programa shader
    this.gl.useProgram(program);
    this.currentProgram = program;

    // Configurar blend mode
    this.setBlendMode(pass.blendMode);

    // Bind texture de entrada
    this.gl.activeTexture(this.gl.TEXTURE0);
    this.gl.bindTexture(this.gl.TEXTURE_2D, inputTexture);
    
    const textureLocation = effect.shaderProgram.uniforms.get('u_texture');
    if (textureLocation) {
      this.gl.uniform1i(textureLocation, 0);
    }

    // Configurar uniforms
    this.setUniforms(effect, pass.uniforms);

    // Configurar atributos do quad
    this.setupQuadAttributes(effect.shaderProgram);

    // Desenhar quad
    this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
  }

  private setBlendMode(blendMode: string): void {
    switch (blendMode) {
      case 'normal':
        this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
        break;
      case 'multiply':
        this.gl.blendFunc(this.gl.DST_COLOR, this.gl.ZERO);
        break;
      case 'screen':
        this.gl.blendFunc(this.gl.ONE, this.gl.ONE_MINUS_SRC_COLOR);
        break;
      case 'add':
        this.gl.blendFunc(this.gl.ONE, this.gl.ONE);
        break;
      case 'subtract':
        this.gl.blendFunc(this.gl.ZERO, this.gl.ONE_MINUS_SRC_COLOR);
        break;
      default:
        this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
    }
  }

  private setUniforms(effect: ShaderEffect, passUniforms: { [key: string]: any }): void {
    const program = effect.shaderProgram;

    effect.uniforms.forEach(uniform => {
      const location = program.uniforms.get(uniform.name);
      if (!location) return;

      // Usar valor do pass se disponível, senão usar valor padrão
      const value = passUniforms[uniform.name] !== undefined ? passUniforms[uniform.name] : uniform.value;

      switch (uniform.type) {
        case 'float':
          this.gl.uniform1f(location, value);
          break;
        case 'vec2':
          this.gl.uniform2fv(location, value);
          break;
        case 'vec3':
          this.gl.uniform3fv(location, value);
          break;
        case 'vec4':
          this.gl.uniform4fv(location, value);
          break;
        case 'mat3':
          this.gl.uniformMatrix3fv(location, false, value);
          break;
        case 'mat4':
          this.gl.uniformMatrix4fv(location, false, value);
          break;
        case 'int':
        case 'sampler2D':
          this.gl.uniform1i(location, value);
          break;
        case 'bool':
          this.gl.uniform1i(location, value ? 1 : 0);
          break;
      }
    });
  }

  private setupQuadAttributes(program: ShaderProgram): void {
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.quadBuffer);

    const positionLocation = program.attributes.get('a_position');
    const texCoordLocation = program.attributes.get('a_texCoord');

    if (positionLocation !== undefined) {
      this.gl.enableVertexAttribArray(positionLocation);
      this.gl.vertexAttribPointer(positionLocation, 2, this.gl.FLOAT, false, 16, 0);
    }

    if (texCoordLocation !== undefined) {
      this.gl.enableVertexAttribArray(texCoordLocation);
      this.gl.vertexAttribPointer(texCoordLocation, 2, this.gl.FLOAT, false, 16, 8);
    }
  }

  public createTextureFromImage(image: HTMLImageElement): WebGLTexture {
    const texture = this.gl.createTexture()!;
    
    this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
    this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, image);
    
    // Configurar filtros
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
    
    return texture;
  }

  public createTextureFromCanvas(canvas: HTMLCanvasElement): WebGLTexture {
    const texture = this.gl.createTexture()!;
    
    this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
    this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, canvas);
    
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
    
    return texture;
  }

  public updateUniform(effectId: string, uniformName: string, value: any): void {
    const effect = this.effects.get(effectId);
    if (!effect) return;

    const uniform = effect.uniforms.find(u => u.name === uniformName);
    if (uniform) {
      uniform.value = value;
    }
  }

  public applyPreset(effectId: string, presetId: string): void {
    const effect = this.effects.get(effectId);
    if (!effect) return;

    const preset = effect.presets.find(p => p.id === presetId);
    if (!preset) return;

    Object.entries(preset.uniforms).forEach(([uniformName, value]) => {
      this.updateUniform(effectId, uniformName, value);
    });
  }

  public resize(width: number, height: number): void {
    this.canvas.width = width;
    this.canvas.height = height;
    this.gl.viewport(0, 0, width, height);

    // Atualizar render targets
    this.renderTargets.forEach(target => {
      if (target.width !== width || target.height !== height) {
        // Recriar texture com novo tamanho
        this.gl.bindTexture(this.gl.TEXTURE_2D, target.texture);
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, target.format, width, height, 0, target.format, target.type, null);
        
        target.width = width;
        target.height = height;
      }
    });
  }

  public dispose(): void {
    // Limpar efeitos
    this.effects.forEach(effect => {
      if (effect.shaderProgram.program) {
        this.gl.deleteProgram(effect.shaderProgram.program);
      }
    });
    this.effects.clear();

    // Limpar render targets
    this.renderTargets.forEach(target => {
      this.gl.deleteFramebuffer(target.framebuffer);
      this.gl.deleteTexture(target.texture);
    });
    this.renderTargets.clear();

    // Limpar buffers
    this.gl.deleteBuffer(this.quadBuffer);

    this.passes = [];
  }

  public getWebGLContext(): WebGLRenderingContext {
    return this.gl;
  }

  public getMaxTextureUnits(): number {
    return this.maxTextureUnits;
  }

  public getMaxRenderBufferSize(): number {
    return this.maxRenderBufferSize;
  }

  public getExtensions(): { [key: string]: any } {
    return { ...this.extensions };
  }
}

// Factory para criar passes de shader comuns
export class ShaderPassFactory {
  static createBlurPass(effectId: string, radius: number = 5): ShaderPass {
    return {
      id: `blur-pass-${Date.now()}`,
      name: 'Blur Pass',
      effect: { id: effectId } as ShaderEffect,
      inputTextures: [],
      uniforms: { u_blurRadius: radius },
      enabled: true,
      blendMode: 'normal',
      opacity: 1.0
    };
  }

  static createColorCorrectionPass(effectId: string, settings: any): ShaderPass {
    return {
      id: `color-correction-pass-${Date.now()}`,
      name: 'Color Correction Pass',
      effect: { id: effectId } as ShaderEffect,
      inputTextures: [],
      uniforms: settings,
      enabled: true,
      blendMode: 'normal',
      opacity: 1.0
    };
  }

  static createCompositePass(effectId: string, blendMode: string = 'normal', opacity: number = 1.0): ShaderPass {
    return {
      id: `composite-pass-${Date.now()}`,
      name: 'Composite Pass',
      effect: { id: effectId } as ShaderEffect,
      inputTextures: [],
      uniforms: {},
      enabled: true,
      blendMode: blendMode as any,
      opacity
    };
  }
}