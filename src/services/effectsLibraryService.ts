import { create } from 'zustand';
import * as THREE from 'three';

export interface EffectParameter {
  name: string;
  type: 'number' | 'boolean' | 'color' | 'select' | 'range' | 'vector2' | 'vector3';
  value: any;
  min?: number;
  max?: number;
  step?: number;
  options?: string[];
  description: string;
}

export interface Effect {
  id: string;
  name: string;
  category: 'color' | 'blur' | 'distortion' | 'artistic' | 'noise' | 'lighting' | 'geometry';
  description: string;
  parameters: EffectParameter[];
  preview?: string;
  fragmentShader: string;
  vertexShader?: string;
  uniforms: Record<string, any>;
  isPremium: boolean;
  tags: string[];
}

export interface Transition {
  id: string;
  name: string;
  category: 'fade' | 'slide' | 'zoom' | 'rotate' | 'wipe' | 'dissolve' | 'morph';
  description: string;
  duration: number;
  parameters: EffectParameter[];
  preview?: string;
  fragmentShader: string;
  uniforms: Record<string, any>;
  isPremium: boolean;
  tags: string[];
}

export interface EffectPreset {
  id: string;
  name: string;
  effectId: string;
  parameters: Record<string, any>;
  description: string;
  thumbnail?: string;
}

export interface EffectInstance {
  id: string;
  effectId: string;
  clipId: string;
  startTime: number;
  duration: number;
  parameters: Record<string, any>;
  enabled: boolean;
  opacity: number;
  blendMode: 'normal' | 'multiply' | 'screen' | 'overlay' | 'soft-light' | 'hard-light';
}

export interface TransitionInstance {
  id: string;
  transitionId: string;
  fromClipId: string;
  toClipId: string;
  startTime: number;
  duration: number;
  parameters: Record<string, any>;
  enabled: boolean;
}

export interface EffectsLibraryState {
  effects: Effect[];
  transitions: Transition[];
  presets: EffectPreset[];
  appliedEffects: EffectInstance[];
  appliedTransitions: TransitionInstance[];
  selectedEffect: Effect | null;
  selectedTransition: Transition | null;
  isProcessing: boolean;
  searchQuery: string;
  selectedCategory: string;
  
  // Actions
  loadEffects: () => Promise<void>;
  loadTransitions: () => Promise<void>;
  searchEffects: (query: string) => Effect[];
  filterByCategory: (category: string) => Effect[];
  applyEffect: (effectId: string, clipId: string, startTime: number, duration: number) => Promise<EffectInstance>;
  applyTransition: (transitionId: string, fromClipId: string, toClipId: string, duration: number) => Promise<TransitionInstance>;
  updateEffectParameters: (instanceId: string, parameters: Record<string, any>) => void;
  removeEffect: (instanceId: string) => void;
  removeTransition: (instanceId: string) => void;
  createPreset: (name: string, effectId: string, parameters: Record<string, any>) => EffectPreset;
  renderEffect: (effect: Effect, inputTexture: THREE.Texture, parameters: Record<string, any>) => Promise<THREE.Texture>;
  renderTransition: (transition: Transition, fromTexture: THREE.Texture, toTexture: THREE.Texture, progress: number) => Promise<THREE.Texture>;
}

class EffectsLibraryService {
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.OrthographicCamera;
  private renderTarget: THREE.WebGLRenderTarget;
  private quad: THREE.Mesh;
  private effectMaterials: Map<string, THREE.ShaderMaterial> = new Map();
  private transitionMaterials: Map<string, THREE.ShaderMaterial> = new Map();
  private builtInEffects: Effect[] = [];
  private builtInTransitions: Transition[] = [];

  constructor() {
    this.initializeRenderer();
    this.initializeBuiltInEffects();
    this.initializeBuiltInTransitions();
  }

  getBuiltInEffects(): Effect[] {
    return this.builtInEffects;
  }

  getBuiltInTransitions(): Transition[] {
    return this.builtInTransitions;
  }

  private initializeRenderer() {
    // Create off-screen renderer for effect processing
    this.renderer = new THREE.WebGLRenderer({ 
      antialias: false,
      preserveDrawingBuffer: true
    });
    this.renderer.setSize(1920, 1080);
    
    // Create scene and camera
    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    
    // Create render target
    this.renderTarget = new THREE.WebGLRenderTarget(1920, 1080, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBAFormat
    });
    
    // Create fullscreen quad
    const geometry = new THREE.PlaneGeometry(2, 2);
    this.quad = new THREE.Mesh(geometry);
    this.scene.add(this.quad);
  }

  private initializeBuiltInEffects() {
    const effects: Effect[] = [
      {
        id: 'blur',
        name: 'Gaussian Blur',
        category: 'blur',
        description: 'Apply gaussian blur to the video',
        parameters: [
          {
            name: 'intensity',
            type: 'range',
            value: 1.0,
            min: 0,
            max: 10,
            step: 0.1,
            description: 'Blur intensity'
          }
        ],
        fragmentShader: `
          uniform sampler2D tDiffuse;
          uniform float intensity;
          uniform vec2 resolution;
          varying vec2 vUv;
          
          void main() {
            vec2 texelSize = 1.0 / resolution;
            vec4 color = vec4(0.0);
            
            float kernel[9];
            kernel[0] = 1.0/16.0; kernel[1] = 2.0/16.0; kernel[2] = 1.0/16.0;
            kernel[3] = 2.0/16.0; kernel[4] = 4.0/16.0; kernel[5] = 2.0/16.0;
            kernel[6] = 1.0/16.0; kernel[7] = 2.0/16.0; kernel[8] = 1.0/16.0;
            
            for(int i = -1; i <= 1; i++) {
              for(int j = -1; j <= 1; j++) {
                vec2 offset = vec2(float(i), float(j)) * texelSize * intensity;
                color += texture2D(tDiffuse, vUv + offset) * kernel[(i+1)*3 + (j+1)];
              }
            }
            
            gl_FragColor = color;
          }
        `,
        uniforms: {
          tDiffuse: { value: null },
          intensity: { value: 1.0 },
          resolution: { value: new THREE.Vector2(1920, 1080) }
        },
        isPremium: false,
        tags: ['blur', 'basic']
      },
      {
        id: 'vintage',
        name: 'Vintage Film',
        category: 'color',
        description: 'Apply vintage film look with grain and color grading',
        parameters: [
          {
            name: 'sepia',
            type: 'range',
            value: 0.5,
            min: 0,
            max: 1,
            step: 0.01,
            description: 'Sepia tone intensity'
          },
          {
            name: 'grain',
            type: 'range',
            value: 0.3,
            min: 0,
            max: 1,
            step: 0.01,
            description: 'Film grain amount'
          },
          {
            name: 'vignette',
            type: 'range',
            value: 0.4,
            min: 0,
            max: 1,
            step: 0.01,
            description: 'Vignette strength'
          }
        ],
        fragmentShader: `
          uniform sampler2D tDiffuse;
          uniform float sepia;
          uniform float grain;
          uniform float vignette;
          uniform float time;
          varying vec2 vUv;
          
          float random(vec2 st) {
            return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
          }
          
          void main() {
            vec4 color = texture2D(tDiffuse, vUv);
            
            // Sepia tone
            vec3 sepia_color = vec3(
              dot(color.rgb, vec3(0.393, 0.769, 0.189)),
              dot(color.rgb, vec3(0.349, 0.686, 0.168)),
              dot(color.rgb, vec3(0.272, 0.534, 0.131))
            );
            color.rgb = mix(color.rgb, sepia_color, sepia);
            
            // Film grain
            float noise = random(vUv + time) * 2.0 - 1.0;
            color.rgb += noise * grain * 0.1;
            
            // Vignette
            vec2 center = vUv - 0.5;
            float dist = length(center);
            float vignetteAmount = 1.0 - smoothstep(0.3, 0.8, dist * vignette);
            color.rgb *= vignetteAmount;
            
            gl_FragColor = color;
          }
        `,
        uniforms: {
          tDiffuse: { value: null },
          sepia: { value: 0.5 },
          grain: { value: 0.3 },
          vignette: { value: 0.4 },
          time: { value: 0 }
        },
        isPremium: false,
        tags: ['vintage', 'film', 'color']
      },
      {
        id: 'chromatic_aberration',
        name: 'Chromatic Aberration',
        category: 'distortion',
        description: 'Simulate lens chromatic aberration effect',
        parameters: [
          {
            name: 'strength',
            type: 'range',
            value: 0.01,
            min: 0,
            max: 0.1,
            step: 0.001,
            description: 'Aberration strength'
          }
        ],
        fragmentShader: `
          uniform sampler2D tDiffuse;
          uniform float strength;
          varying vec2 vUv;
          
          void main() {
            vec2 center = vec2(0.5);
            vec2 offset = (vUv - center) * strength;
            
            float r = texture2D(tDiffuse, vUv + offset).r;
            float g = texture2D(tDiffuse, vUv).g;
            float b = texture2D(tDiffuse, vUv - offset).b;
            float a = texture2D(tDiffuse, vUv).a;
            
            gl_FragColor = vec4(r, g, b, a);
          }
        `,
        uniforms: {
          tDiffuse: { value: null },
          strength: { value: 0.01 }
        },
        isPremium: true,
        tags: ['aberration', 'lens', 'distortion']
      },
      {
        id: 'glitch',
        name: 'Digital Glitch',
        category: 'distortion',
        description: 'Digital glitch effect with RGB shift and noise',
        parameters: [
          {
            name: 'intensity',
            type: 'range',
            value: 0.5,
            min: 0,
            max: 1,
            step: 0.01,
            description: 'Glitch intensity'
          },
          {
            name: 'speed',
            type: 'range',
            value: 1.0,
            min: 0.1,
            max: 5.0,
            step: 0.1,
            description: 'Animation speed'
          }
        ],
        fragmentShader: `
          uniform sampler2D tDiffuse;
          uniform float intensity;
          uniform float speed;
          uniform float time;
          varying vec2 vUv;
          
          float random(float x) {
            return fract(sin(x) * 43758.5453);
          }
          
          void main() {
            vec2 uv = vUv;
            float t = time * speed;
            
            // Horizontal glitch lines
            float glitch = step(0.9, random(floor(uv.y * 100.0) + t));
            uv.x += (random(floor(uv.y * 100.0) + t) - 0.5) * intensity * glitch * 0.1;
            
            // RGB shift
            float shift = intensity * 0.01;
            float r = texture2D(tDiffuse, uv + vec2(shift, 0.0)).r;
            float g = texture2D(tDiffuse, uv).g;
            float b = texture2D(tDiffuse, uv - vec2(shift, 0.0)).b;
            
            // Digital noise
            float noise = random(uv + t) * intensity * 0.1;
            
            gl_FragColor = vec4(r + noise, g + noise, b + noise, 1.0);
          }
        `,
        uniforms: {
          tDiffuse: { value: null },
          intensity: { value: 0.5 },
          speed: { value: 1.0 },
          time: { value: 0 }
        },
        isPremium: true,
        tags: ['glitch', 'digital', 'distortion']
      }
    ];

    this.builtInEffects = effects;
  }

  private initializeBuiltInTransitions() {
    const transitions: Transition[] = [
      {
        id: 'crossfade',
        name: 'Crossfade',
        category: 'fade',
        description: 'Simple crossfade between two clips',
        duration: 1.0,
        parameters: [
          {
            name: 'curve',
            type: 'select',
            value: 'linear',
            options: ['linear', 'ease-in', 'ease-out', 'ease-in-out'],
            description: 'Transition curve'
          }
        ],
        fragmentShader: `
          uniform sampler2D tDiffuse1;
          uniform sampler2D tDiffuse2;
          uniform float progress;
          uniform int curve;
          varying vec2 vUv;
          
          float easeInOut(float t) {
            return t < 0.5 ? 2.0 * t * t : -1.0 + (4.0 - 2.0 * t) * t;
          }
          
          void main() {
            float p = progress;
            
            if (curve == 1) p = p * p; // ease-in
            else if (curve == 2) p = 1.0 - (1.0 - p) * (1.0 - p); // ease-out
            else if (curve == 3) p = easeInOut(p); // ease-in-out
            
            vec4 color1 = texture2D(tDiffuse1, vUv);
            vec4 color2 = texture2D(tDiffuse2, vUv);
            
            gl_FragColor = mix(color1, color2, p);
          }
        `,
        uniforms: {
          tDiffuse1: { value: null },
          tDiffuse2: { value: null },
          progress: { value: 0 },
          curve: { value: 0 }
        },
        isPremium: false,
        tags: ['fade', 'basic']
      },
      {
        id: 'slide_left',
        name: 'Slide Left',
        category: 'slide',
        description: 'Slide transition from right to left',
        duration: 0.8,
        parameters: [
          {
            name: 'smoothness',
            type: 'range',
            value: 0.1,
            min: 0,
            max: 0.5,
            step: 0.01,
            description: 'Edge smoothness'
          }
        ],
        fragmentShader: `
          uniform sampler2D tDiffuse1;
          uniform sampler2D tDiffuse2;
          uniform float progress;
          uniform float smoothness;
          varying vec2 vUv;
          
          void main() {
            vec2 uv = vUv;
            float edge = progress - smoothness;
            float alpha = smoothstep(edge, edge + smoothness * 2.0, uv.x);
            
            vec4 color1 = texture2D(tDiffuse1, uv);
            vec4 color2 = texture2D(tDiffuse2, uv + vec2(1.0 - progress, 0.0));
            
            gl_FragColor = mix(color1, color2, alpha);
          }
        `,
        uniforms: {
          tDiffuse1: { value: null },
          tDiffuse2: { value: null },
          progress: { value: 0 },
          smoothness: { value: 0.1 }
        },
        isPremium: false,
        tags: ['slide', 'directional']
      },
      {
        id: 'zoom_in',
        name: 'Zoom In',
        category: 'zoom',
        description: 'Zoom in transition effect',
        duration: 1.2,
        parameters: [
          {
            name: 'scale',
            type: 'range',
            value: 2.0,
            min: 1.1,
            max: 5.0,
            step: 0.1,
            description: 'Maximum zoom scale'
          }
        ],
        fragmentShader: `
          uniform sampler2D tDiffuse1;
          uniform sampler2D tDiffuse2;
          uniform float progress;
          uniform float scale;
          varying vec2 vUv;
          
          void main() {
            vec2 center = vec2(0.5);
            float zoom = 1.0 + (scale - 1.0) * progress;
            
            vec2 uv1 = center + (vUv - center) / zoom;
            vec2 uv2 = vUv;
            
            vec4 color1 = texture2D(tDiffuse1, uv1);
            vec4 color2 = texture2D(tDiffuse2, uv2);
            
            float alpha = smoothstep(0.3, 0.7, progress);
            gl_FragColor = mix(color1, color2, alpha);
          }
        `,
        uniforms: {
          tDiffuse1: { value: null },
          tDiffuse2: { value: null },
          progress: { value: 0 },
          scale: { value: 2.0 }
        },
        isPremium: true,
        tags: ['zoom', 'scale']
      }
    ];

    this.builtInTransitions = transitions;
  }

  async renderEffect(
    effect: Effect,
    inputTexture: THREE.Texture,
    parameters: Record<string, any>
  ): Promise<THREE.Texture> {
    // Get or create material for this effect
    let material = this.effectMaterials.get(effect.id);
    if (!material) {
      material = new THREE.ShaderMaterial({
        uniforms: { ...effect.uniforms },
        vertexShader: effect.vertexShader || this.getDefaultVertexShader(),
        fragmentShader: effect.fragmentShader
      });
      this.effectMaterials.set(effect.id, material);
    }

    // Update uniforms with input texture and parameters
    material.uniforms.tDiffuse.value = inputTexture;
    Object.keys(parameters).forEach(key => {
      if (material!.uniforms[key]) {
        material!.uniforms[key].value = parameters[key];
      }
    });

    // Update time uniform if it exists
    if (material.uniforms.time) {
      material.uniforms.time.value = performance.now() * 0.001;
    }

    // Render effect
    this.quad.material = material;
    this.renderer.setRenderTarget(this.renderTarget);
    this.renderer.render(this.scene, this.camera);
    this.renderer.setRenderTarget(null);

    return this.renderTarget.texture;
  }

  async renderTransition(
    transition: Transition,
    fromTexture: THREE.Texture,
    toTexture: THREE.Texture,
    progress: number,
    parameters: Record<string, any> = {}
  ): Promise<THREE.Texture> {
    // Get or create material for this transition
    let material = this.transitionMaterials.get(transition.id);
    if (!material) {
      material = new THREE.ShaderMaterial({
        uniforms: { ...transition.uniforms },
        vertexShader: this.getDefaultVertexShader(),
        fragmentShader: transition.fragmentShader
      });
      this.transitionMaterials.set(transition.id, material);
    }

    // Update uniforms
    material.uniforms.tDiffuse1.value = fromTexture;
    material.uniforms.tDiffuse2.value = toTexture;
    material.uniforms.progress.value = progress;
    
    Object.keys(parameters).forEach(key => {
      if (material!.uniforms[key]) {
        material!.uniforms[key].value = parameters[key];
      }
    });

    // Render transition
    this.quad.material = material;
    this.renderer.setRenderTarget(this.renderTarget);
    this.renderer.render(this.scene, this.camera);
    this.renderer.setRenderTarget(null);

    return this.renderTarget.texture;
  }

  private getDefaultVertexShader(): string {
    return `
      varying vec2 vUv;
      
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;
  }

  searchEffects(query: string, effects: Effect[]): Effect[] {
    const lowercaseQuery = query.toLowerCase();
    
    return effects.filter(effect => 
      effect.name.toLowerCase().includes(lowercaseQuery) ||
      effect.description.toLowerCase().includes(lowercaseQuery) ||
      effect.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))
    );
  }

  filterByCategory(category: string, effects: Effect[]): Effect[] {
    return effects.filter(effect => effect.category === category);
  }

  createPreset(
    name: string,
    effectId: string,
    parameters: Record<string, any>
  ): EffectPreset {
    const preset: EffectPreset = {
      id: Date.now().toString(),
      name,
      effectId,
      parameters,
      description: `Custom preset for ${effectId}`
    };

    return preset;
  }

  dispose() {
    this.renderer.dispose();
    this.renderTarget.dispose();
    this.effectMaterials.forEach(material => material.dispose());
    this.transitionMaterials.forEach(material => material.dispose());
  }
}

// Create singleton instance
const effectsLibraryService = new EffectsLibraryService();

// Zustand store for effects library state
export const useEffectsLibrary = create<EffectsLibraryState>((set, get) => ({
  effects: effectsLibraryService.getBuiltInEffects(),
  transitions: effectsLibraryService.getBuiltInTransitions(),
  presets: [],
  appliedEffects: [],
  appliedTransitions: [],
  selectedEffect: null,
  selectedTransition: null,
  isProcessing: false,
  searchQuery: '',
  selectedCategory: 'all',

  loadEffects: async () => {
    set({ effects: effectsLibraryService.getBuiltInEffects() });
  },

  loadTransitions: async () => {
    set({ transitions: effectsLibraryService.getBuiltInTransitions() });
  },

  searchEffects: (query) => {
    set({ searchQuery: query });
    const { effects } = get();
    return effectsLibraryService.searchEffects(query, effects);
  },

  filterByCategory: (category) => {
    set({ selectedCategory: category });
    const { effects } = get();
    return effectsLibraryService.filterByCategory(category, effects);
  },

  applyEffect: async (effectId, clipId, startTime, duration) => {
    const { effects } = get();
    const effect = effects.find(e => e.id === effectId);
    
    if (!effect) {
      throw new Error(`Effect ${effectId} not found`);
    }

    const instance: EffectInstance = {
      id: Date.now().toString(),
      effectId,
      clipId,
      startTime,
      duration,
      parameters: effect.parameters.reduce((acc, param) => {
        acc[param.name] = param.value;
        return acc;
      }, {} as Record<string, any>),
      enabled: true,
      opacity: 1.0,
      blendMode: 'normal'
    };

    set(state => ({
      appliedEffects: [...state.appliedEffects, instance]
    }));

    return instance;
  },

  applyTransition: async (transitionId, fromClipId, toClipId, duration) => {
    const { transitions } = get();
    const transition = transitions.find(t => t.id === transitionId);
    
    if (!transition) {
      throw new Error(`Transition ${transitionId} not found`);
    }

    const instance: TransitionInstance = {
      id: Date.now().toString(),
      transitionId,
      fromClipId,
      toClipId,
      startTime: 0, // This would be calculated based on clip positions
      duration,
      parameters: transition.parameters.reduce((acc, param) => {
        acc[param.name] = param.value;
        return acc;
      }, {} as Record<string, any>),
      enabled: true
    };

    set(state => ({
      appliedTransitions: [...state.appliedTransitions, instance]
    }));

    return instance;
  },

  updateEffectParameters: (instanceId, parameters) => {
    set(state => ({
      appliedEffects: state.appliedEffects.map(effect => 
        effect.id === instanceId 
          ? { ...effect, parameters: { ...effect.parameters, ...parameters } }
          : effect
      )
    }));
  },

  removeEffect: (instanceId) => {
    set(state => ({
      appliedEffects: state.appliedEffects.filter(effect => effect.id !== instanceId)
    }));
  },

  removeTransition: (instanceId) => {
    set(state => ({
      appliedTransitions: state.appliedTransitions.filter(transition => transition.id !== instanceId)
    }));
  },

  createPreset: (name, effectId, parameters) => {
    const preset = effectsLibraryService.createPreset(name, effectId, parameters);
    set(state => ({
      presets: [...state.presets, preset]
    }));
    return preset;
  },

  renderEffect: async (effect, inputTexture, parameters) => {
    set({ isProcessing: true });
    try {
      return await effectsLibraryService.renderEffect(effect, inputTexture, parameters);
    } finally {
      set({ isProcessing: false });
    }
  },

  renderTransition: async (transition, fromTexture, toTexture, progress) => {
    set({ isProcessing: true });
    try {
      return await effectsLibraryService.renderTransition(transition, fromTexture, toTexture, progress);
    } finally {
      set({ isProcessing: false });
    }
  }
}));

export default effectsLibraryService;