/**
 * Testes unitários para a Engine de Renderização WebGL/WebAssembly
 */

import WebGLRenderingEngine from '../../../lib/rendering/WebGLRenderingEngine';

// Mock do WebGL
class MockWebGLRenderingContext {
  VERTEX_SHADER = 35633;
  FRAGMENT_SHADER = 35632;
  COMPILE_STATUS = 35713;
  LINK_STATUS = 35714;
  TEXTURE_2D = 3553;
  RGBA = 6408;
  UNSIGNED_BYTE = 5121;
  LINEAR = 9729;
  CLAMP_TO_EDGE = 33071;
  TEXTURE_WRAP_S = 10242;
  TEXTURE_WRAP_T = 10243;
  TEXTURE_MIN_FILTER = 10241;
  TEXTURE_MAG_FILTER = 10240;
  FRAMEBUFFER = 36160;
  COLOR_ATTACHMENT0 = 36064;
  FRAMEBUFFER_COMPLETE = 36053;
  DEPTH_TEST = 2929;
  BLEND = 3042;
  SRC_ALPHA = 770;
  ONE_MINUS_SRC_ALPHA = 771;
  COLOR_BUFFER_BIT = 16384;
  TRIANGLE_STRIP = 5;
  FLOAT = 5126;
  ARRAY_BUFFER = 34962;
  STATIC_DRAW = 35044;
  ACTIVE_UNIFORMS = 35718;
  ACTIVE_ATTRIBUTES = 35721;
  TEXTURE0 = 33984;
  RENDERER = 7937;
  VENDOR = 7936;
  VERSION = 7938;
  MAX_TEXTURE_SIZE = 3379;

  private programs: Map<any, any> = new Map();
  private shaders: Map<any, any> = new Map();
  private textures: Map<any, any> = new Map();
  private buffers: Map<any, any> = new Map();
  private framebuffers: Map<any, any> = new Map();

  createProgram() {
    const program = Symbol('program');
    this.programs.set(program, { linked: false, uniforms: [], attributes: [] });
    return program;
  }

  createShader(type: number) {
    const shader = Symbol('shader');
    this.shaders.set(shader, { type, compiled: false });
    return shader;
  }

  createTexture() {
    const texture = Symbol('texture');
    this.textures.set(texture, {});
    return texture;
  }

  createBuffer() {
    const buffer = Symbol('buffer');
    this.buffers.set(buffer, {});
    return buffer;
  }

  createFramebuffer() {
    const framebuffer = Symbol('framebuffer');
    this.framebuffers.set(framebuffer, {});
    return framebuffer;
  }

  shaderSource(shader: any, source: string) {
    const shaderObj = this.shaders.get(shader);
    if (shaderObj) {
      shaderObj.source = source;
    }
  }

  compileShader(shader: any) {
    const shaderObj = this.shaders.get(shader);
    if (shaderObj) {
      shaderObj.compiled = true;
    }
  }

  attachShader(program: any, shader: any) {
    const programObj = this.programs.get(program);
    if (programObj) {
      programObj.shaders = programObj.shaders || [];
      programObj.shaders.push(shader);
    }
  }

  linkProgram(program: any) {
    const programObj = this.programs.get(program);
    if (programObj) {
      programObj.linked = true;
    }
  }

  getShaderParameter(shader: any, pname: number) {
    if (pname === this.COMPILE_STATUS) {
      return this.shaders.get(shader)?.compiled || false;
    }
    return null;
  }

  getProgramParameter(program: any, pname: number) {
    const programObj = this.programs.get(program);
    if (pname === this.LINK_STATUS) {
      return programObj?.linked || false;
    }
    if (pname === this.ACTIVE_UNIFORMS) {
      return 2; // u_texture, u_blurRadius
    }
    if (pname === this.ACTIVE_ATTRIBUTES) {
      return 2; // a_position, a_texcoord
    }
    return null;
  }

  getActiveUniform(program: any, index: number) {
    const uniforms = ['u_texture', 'u_blurRadius', 'u_brightness', 'u_contrast'];
    return index < uniforms.length ? { name: uniforms[index] } : null;
  }

  getActiveAttrib(program: any, index: number) {
    const attributes = ['a_position', 'a_texcoord'];
    return index < attributes.length ? { name: attributes[index] } : null;
  }

  getUniformLocation(program: any, name: string) {
    return Symbol(`uniform_${name}`);
  }

  getAttribLocation(program: any, name: string) {
    const locations: { [key: string]: number } = {
      'a_position': 0,
      'a_texcoord': 1
    };
    return locations[name] ?? -1;
  }

  getParameter(pname: number) {
    switch (pname) {
      case this.RENDERER:
        return 'Mock WebGL Renderer';
      case this.VENDOR:
        return 'Mock WebGL Vendor';
      case this.VERSION:
        return 'WebGL 1.0 (Mock)';
      case this.MAX_TEXTURE_SIZE:
        return 4096;
      default:
        return null;
    }
  }

  getSupportedExtensions() {
    return ['WEBGL_debug_renderer_info', 'OES_texture_float', 'OES_standard_derivatives'];
  }

  // Métodos que não fazem nada nos testes
  viewport() {}
  clearColor() {}
  enable() {}
  blendFunc() {}
  clear() {}
  useProgram() {}
  bindTexture() {}
  texImage2D() {}
  texParameteri() {}
  activeTexture() {}
  uniform1i() {}
  uniform1f() {}
  uniform2fv() {}
  uniform3fv() {}
  uniform4fv() {}
  bindBuffer() {}
  bufferData() {}
  enableVertexAttribArray() {}
  vertexAttribPointer() {}
  drawArrays() {}
  bindFramebuffer() {}
  framebufferTexture2D() {}
  checkFramebufferStatus() { return this.FRAMEBUFFER_COMPLETE; }
  readPixels() {}
  deleteProgram() {}
  deleteShader() {}
  deleteTexture() {}
  deleteBuffer() {}
  deleteFramebuffer() {}
  getShaderInfoLog() { return null; }
  getProgramInfoLog() { return null; }
}

// Mock do HTMLCanvasElement
class MockHTMLCanvasElement {
  width = 1920;
  height = 1080;

  getContext(contextId: string, options?: any) {
    if (contextId === 'webgl2' || contextId === 'webgl') {
      return new MockWebGLRenderingContext();
    }
    return null;
  }
}

describe('WebGLRenderingEngine', () => {
  let mockCanvas: MockHTMLCanvasElement;
  let engine: WebGLRenderingEngine;

  beforeEach(() => {
    mockCanvas = new MockHTMLCanvasElement();
    
    // Mock global HTMLCanvasElement constructor
    global.HTMLCanvasElement = MockHTMLCanvasElement as any;
    
    // Mock performance.now
    global.performance = {
      now: jest.fn(() => Date.now())
    } as any;

    // Mock requestAnimationFrame
    global.requestAnimationFrame = jest.fn((callback) => {
      setTimeout(callback, 16);
      return 1;
    });

    // Mock cancelAnimationFrame
    global.cancelAnimationFrame = jest.fn();
  });

  afterEach(() => {
    if (engine) {
      engine.dispose();
    }
  });

  describe('Initialization', () => {
    it('should initialize WebGL engine successfully', () => {
      expect(() => {
        engine = new WebGLRenderingEngine({
          canvas: mockCanvas as any,
          width: 1920,
          height: 1080,
          fps: 60,
          quality: 'high',
          antialiasing: true,
          enablePostProcessing: true,
          useWebGL2: true,
          enableWebAssembly: true,
          maxMemoryUsage: 512,
          enableProfiling: true,
          showStats: true
        });
      }).not.toThrow();
    });

    it('should initialize with WebGL1 fallback when WebGL2 is not available', () => {
      const mockCanvasWebGL1 = {
        ...mockCanvas,
        getContext: jest.fn().mockImplementation((contextId: string) => {
          if (contextId === 'webgl2') return null;
          if (contextId === 'webgl') return new MockWebGLRenderingContext();
          return null;
        })
      };

      expect(() => {
        engine = new WebGLRenderingEngine({
          canvas: mockCanvasWebGL1 as any,
          width: 1920,
          height: 1080,
          fps: 60,
          quality: 'high',
          antialiasing: true,
          enablePostProcessing: true,
          useWebGL2: true,
          enableWebAssembly: true,
          maxMemoryUsage: 512,
          enableProfiling: true,
          showStats: true
        });
      }).not.toThrow();
    });

    it('should throw error when WebGL is not supported', () => {
      const mockCanvasNoWebGL = {
        ...mockCanvas,
        getContext: jest.fn().mockReturnValue(null)
      };

      expect(() => {
        engine = new WebGLRenderingEngine({
          canvas: mockCanvasNoWebGL as any,
          width: 1920,
          height: 1080,
          fps: 60,
          quality: 'high',
          antialiasing: true,
          enablePostProcessing: true,
          useWebGL2: true,
          enableWebAssembly: true,
          maxMemoryUsage: 512,
          enableProfiling: true,
          showStats: true
        });
      }).toThrow('WebGL não é suportado neste navegador');
    });

    it('should initialize default shaders and effects', () => {
      engine = new WebGLRenderingEngine({
        canvas: mockCanvas as any,
        width: 1920,
        height: 1080,
        fps: 60,
        quality: 'high',
        antialiasing: true,
        enablePostProcessing: true,
        useWebGL2: true,
        enableWebAssembly: false,
        maxMemoryUsage: 512,
        enableProfiling: true,
        showStats: true
      });

      const effects = engine.getAvailableEffects();
      expect(effects.length).toBeGreaterThan(0);
      
      const effectIds = effects.map(e => e.id);
      expect(effectIds).toContain('blur');
      expect(effectIds).toContain('colorCorrection');
    });
  });

  describe('Frame Rendering', () => {
    beforeEach(() => {
      engine = new WebGLRenderingEngine({
        canvas: mockCanvas as any,
        width: 1920,
        height: 1080,
        fps: 60,
        quality: 'high',
        antialiasing: true,
        enablePostProcessing: true,
        useWebGL2: true,
        enableWebAssembly: false,
        maxMemoryUsage: 512,
        enableProfiling: true,
        showStats: true
      });
    });

    it('should render frame with ImageData successfully', async () => {
      const imageData = new ImageData(1920, 1080);
      
      const frame = {
        timestamp: Date.now(),
        data: imageData,
        effects: [],
        metadata: {}
      };

      const result = await engine.renderFrame(frame);
      expect(result).toBe(mockCanvas);
    });

    it('should render frame with canvas element successfully', async () => {
      const sourceCanvas = new MockHTMLCanvasElement();
      
      const frame = {
        timestamp: Date.now(),
        data: sourceCanvas as any,
        effects: [],
        metadata: {}
      };

      const result = await engine.renderFrame(frame);
      expect(result).toBe(mockCanvas);
    });

    it('should apply blur effect to frame', async () => {
      const imageData = new ImageData(1920, 1080);
      
      const frame = {
        timestamp: Date.now(),
        data: imageData,
        effects: ['blur'],
        metadata: {}
      };

      engine.enableEffect('blur', true);
      engine.setEffectParameter('blur', 'u_blurRadius', 3.0);

      const result = await engine.renderFrame(frame);
      expect(result).toBe(mockCanvas);
    });

    it('should apply color correction effect to frame', async () => {
      const imageData = new ImageData(1920, 1080);
      
      const frame = {
        timestamp: Date.now(),
        data: imageData,
        effects: ['colorCorrection'],
        metadata: {}
      };

      engine.enableEffect('colorCorrection', true);
      engine.setEffectParameter('colorCorrection', 'u_brightness', 0.2);
      engine.setEffectParameter('colorCorrection', 'u_contrast', 1.2);

      const result = await engine.renderFrame(frame);
      expect(result).toBe(mockCanvas);
    });

    it('should apply multiple effects in correct order', async () => {
      const imageData = new ImageData(1920, 1080);
      
      const frame = {
        timestamp: Date.now(),
        data: imageData,
        effects: ['colorCorrection', 'blur'],
        metadata: {}
      };

      engine.enableEffect('colorCorrection', true);
      engine.enableEffect('blur', true);

      const result = await engine.renderFrame(frame);
      expect(result).toBe(mockCanvas);
    });
  });

  describe('Effect Management', () => {
    beforeEach(() => {
      engine = new WebGLRenderingEngine({
        canvas: mockCanvas as any,
        width: 1920,
        height: 1080,
        fps: 60,
        quality: 'high',
        antialiasing: true,
        enablePostProcessing: true,
        useWebGL2: true,
        enableWebAssembly: false,
        maxMemoryUsage: 512,
        enableProfiling: true,
        showStats: true
      });
    });

    it('should get available effects', () => {
      const effects = engine.getAvailableEffects();
      expect(Array.isArray(effects)).toBe(true);
      expect(effects.length).toBeGreaterThan(0);
      
      effects.forEach(effect => {
        expect(effect).toHaveProperty('id');
        expect(effect).toHaveProperty('name');
        expect(effect).toHaveProperty('enabled');
        expect(effect).toHaveProperty('priority');
        expect(effect).toHaveProperty('uniforms');
      });
    });

    it('should enable and disable effects', () => {
      engine.enableEffect('blur', false);
      let effects = engine.getAvailableEffects();
      let blurEffect = effects.find(e => e.id === 'blur');
      expect(blurEffect?.enabled).toBe(false);

      engine.enableEffect('blur', true);
      effects = engine.getAvailableEffects();
      blurEffect = effects.find(e => e.id === 'blur');
      expect(blurEffect?.enabled).toBe(true);
    });

    it('should set effect parameters', () => {
      engine.setEffectParameter('blur', 'u_blurRadius', 5.0);
      
      const effects = engine.getAvailableEffects();
      const blurEffect = effects.find(e => e.id === 'blur');
      expect(blurEffect?.uniforms['u_blurRadius']).toBe(5.0);
    });

    it('should handle invalid effect IDs gracefully', () => {
      expect(() => {
        engine.enableEffect('nonexistent', true);
      }).not.toThrow();

      expect(() => {
        engine.setEffectParameter('nonexistent', 'param', 1.0);
      }).not.toThrow();
    });
  });

  describe('Statistics and Performance', () => {
    beforeEach(() => {
      engine = new WebGLRenderingEngine({
        canvas: mockCanvas as any,
        width: 1920,
        height: 1080,
        fps: 60,
        quality: 'high',
        antialiasing: true,
        enablePostProcessing: true,
        useWebGL2: true,
        enableWebAssembly: false,
        maxMemoryUsage: 512,
        enableProfiling: true,
        showStats: true
      });
    });

    it('should provide render statistics', () => {
      const stats = engine.getStats();
      
      expect(stats).toHaveProperty('fps');
      expect(stats).toHaveProperty('frameTime');
      expect(stats).toHaveProperty('gpuTime');
      expect(stats).toHaveProperty('memoryUsed');
      expect(stats).toHaveProperty('drawCalls');
      expect(stats).toHaveProperty('triangles');
      expect(stats).toHaveProperty('textureSwaps');

      expect(typeof stats.fps).toBe('number');
      expect(typeof stats.frameTime).toBe('number');
      expect(typeof stats.memoryUsed).toBe('number');
      expect(typeof stats.drawCalls).toBe('number');
    });

    it('should update statistics after rendering', async () => {
      const initialStats = engine.getStats();
      
      const imageData = new ImageData(1920, 1080);
      const frame = {
        timestamp: Date.now(),
        data: imageData,
        effects: ['blur'],
        metadata: {}
      };

      await engine.renderFrame(frame);
      
      const updatedStats = engine.getStats();
      expect(updatedStats.frameTime).toBeGreaterThan(0);
    });

    it('should track memory usage', async () => {
      const stats = engine.getStats();
      expect(stats.memoryUsed).toBeGreaterThanOrEqual(0);
      
      // Renderizar múltiplos frames para aumentar uso de memória
      for (let i = 0; i < 3; i++) {
        const imageData = new ImageData(1920, 1080);
        const frame = {
          timestamp: Date.now(),
          data: imageData,
          effects: [],
          metadata: {}
        };
        await engine.renderFrame(frame);
      }
      
      const updatedStats = engine.getStats();
      expect(updatedStats.memoryUsed).toBeGreaterThanOrEqual(0);
    });
  });

  describe('WebAssembly Integration', () => {
    it('should initialize with WebAssembly enabled', () => {
      engine = new WebGLRenderingEngine({
        canvas: mockCanvas as any,
        width: 1920,
        height: 1080,
        fps: 60,
        quality: 'high',
        antialiasing: true,
        enablePostProcessing: true,
        useWebGL2: true,
        enableWebAssembly: true,
        maxMemoryUsage: 512,
        enableProfiling: true,
        showStats: true
      });

      // A engine deve inicializar sem erros
      expect(engine).toBeDefined();
    });

    it('should fallback to JavaScript when WebAssembly fails', () => {
      // Mock WebAssembly failure
      const originalWasm = global.WebAssembly;
      delete (global as any).WebAssembly;

      engine = new WebGLRenderingEngine({
        canvas: mockCanvas as any,
        width: 1920,
        height: 1080,
        fps: 60,
        quality: 'high',
        antialiasing: true,
        enablePostProcessing: true,
        useWebGL2: true,
        enableWebAssembly: true,
        maxMemoryUsage: 512,
        enableProfiling: true,
        showStats: true
      });

      // Deve funcionar mesmo sem WebAssembly
      expect(engine).toBeDefined();

      // Restaurar WebAssembly
      (global as any).WebAssembly = originalWasm;
    });
  });

  describe('Resource Management', () => {
    beforeEach(() => {
      engine = new WebGLRenderingEngine({
        canvas: mockCanvas as any,
        width: 1920,
        height: 1080,
        fps: 60,
        quality: 'high',
        antialiasing: true,
        enablePostProcessing: true,
        useWebGL2: true,
        enableWebAssembly: false,
        maxMemoryUsage: 512,
        enableProfiling: true,
        showStats: true
      });
    });

    it('should dispose resources properly', () => {
      expect(() => {
        engine.dispose();
      }).not.toThrow();
    });

    it('should handle multiple dispose calls', () => {
      engine.dispose();
      
      expect(() => {
        engine.dispose();
      }).not.toThrow();
    });

    it('should clean up after frame rendering', async () => {
      const imageData = new ImageData(1920, 1080);
      const frame = {
        timestamp: Date.now(),
        data: imageData,
        effects: ['blur'],
        metadata: {}
      };

      // Renderizar frame
      await engine.renderFrame(frame);
      
      // Não deve haver vazamentos de recursos
      expect(() => {
        engine.dispose();
      }).not.toThrow();
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      engine = new WebGLRenderingEngine({
        canvas: mockCanvas as any,
        width: 1920,
        height: 1080,
        fps: 60,
        quality: 'high',
        antialiasing: true,
        enablePostProcessing: true,
        useWebGL2: true,
        enableWebAssembly: false,
        maxMemoryUsage: 512,
        enableProfiling: true,
        showStats: true
      });
    });

    it('should handle invalid frame data gracefully', async () => {
      const frame = {
        timestamp: Date.now(),
        data: null as any,
        effects: [],
        metadata: {}
      };

      await expect(engine.renderFrame(frame)).rejects.toThrow();
    });

    it('should handle missing effects gracefully', async () => {
      const imageData = new ImageData(1920, 1080);
      const frame = {
        timestamp: Date.now(),
        data: imageData,
        effects: ['nonexistentEffect'],
        metadata: {}
      };

      // Não deve falhar por efeito inexistente
      const result = await engine.renderFrame(frame);
      expect(result).toBe(mockCanvas);
    });

    it('should handle zero-size textures', async () => {
      const imageData = new ImageData(0, 0);
      const frame = {
        timestamp: Date.now(),
        data: imageData,
        effects: [],
        metadata: {}
      };

      await expect(engine.renderFrame(frame)).rejects.toThrow();
    });
  });

  describe('Configuration Validation', () => {
    it('should validate canvas parameter', () => {
      expect(() => {
        new WebGLRenderingEngine({
          canvas: null as any,
          width: 1920,
          height: 1080,
          fps: 60,
          quality: 'high',
          antialiasing: true,
          enablePostProcessing: true,
          useWebGL2: true,
          enableWebAssembly: false,
          maxMemoryUsage: 512,
          enableProfiling: true,
          showStats: true
        });
      }).toThrow();
    });

    it('should handle different quality settings', () => {
      const qualities: Array<'low' | 'medium' | 'high' | 'ultra'> = ['low', 'medium', 'high', 'ultra'];
      
      qualities.forEach(quality => {
        expect(() => {
          const testEngine = new WebGLRenderingEngine({
            canvas: new MockHTMLCanvasElement() as any,
            width: 1920,
            height: 1080,
            fps: 60,
            quality,
            antialiasing: true,
            enablePostProcessing: true,
            useWebGL2: true,
            enableWebAssembly: false,
            maxMemoryUsage: 512,
            enableProfiling: true,
            showStats: true
          });
          testEngine.dispose();
        }).not.toThrow();
      });
    });

    it('should handle different resolution settings', () => {
      const resolutions = [
        { width: 1280, height: 720 },
        { width: 1920, height: 1080 },
        { width: 3840, height: 2160 }
      ];

      resolutions.forEach(({ width, height }) => {
        expect(() => {
          const testEngine = new WebGLRenderingEngine({
            canvas: new MockHTMLCanvasElement() as any,
            width,
            height,
            fps: 60,
            quality: 'high',
            antialiasing: true,
            enablePostProcessing: true,
            useWebGL2: true,
            enableWebAssembly: false,
            maxMemoryUsage: 512,
            enableProfiling: true,
            showStats: true
          });
          testEngine.dispose();
        }).not.toThrow();
      });
    });
  });
});