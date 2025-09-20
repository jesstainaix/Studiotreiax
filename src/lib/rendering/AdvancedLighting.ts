// Sistema Avançado de Iluminação com Ray Tracing
// Suporte para iluminação global, reflexões e sombras realistas

import * as THREE from 'three';

export interface LightConfig {
  type: 'directional' | 'point' | 'spot' | 'area' | 'environment';
  intensity: number;
  color: THREE.Color;
  position?: THREE.Vector3;
  target?: THREE.Vector3;
  distance?: number;
  decay?: number;
  angle?: number;
  penumbra?: number;
  width?: number;
  height?: number;
  castShadow: boolean;
  shadowMapSize: number;
  shadowBias: number;
  shadowRadius: number;
}

export interface RayTracingConfig {
  enabled: boolean;
  maxBounces: number;
  samples: number;
  resolution: 'low' | 'medium' | 'high' | 'ultra';
  denoise: boolean;
  indirectLighting: boolean;
  caustics: boolean;
}

export interface GlobalIlluminationConfig {
  enabled: boolean;
  bounces: number;
  intensity: number;
  radius: number;
  quality: 'low' | 'medium' | 'high';
}

export interface AmbientOcclusionConfig {
  enabled: boolean;
  radius: number;
  intensity: number;
  quality: 'low' | 'medium' | 'high';
  samples: number;
}

export class AdvancedLighting {
  private static instance: AdvancedLighting;
  private scene: THREE.Scene;
  private renderer: THREE.WebGLRenderer;
  private lights: Map<string, THREE.Light> = new Map();
  private rayTracingConfig: RayTracingConfig;
  private giConfig: GlobalIlluminationConfig;
  private aoConfig: AmbientOcclusionConfig;

  // Ray tracing simulation (software-based for compatibility)
  private rayTracer?: any;
  private giTextures: Map<string, THREE.Texture> = new Map();
  private aoTextures: Map<string, THREE.Texture> = new Map();

  constructor(scene: THREE.Scene, renderer: THREE.WebGLRenderer) {
    this.scene = scene;
    this.renderer = renderer;

    this.rayTracingConfig = {
      enabled: false,
      maxBounces: 3,
      samples: 16,
      resolution: 'medium',
      denoise: true,
      indirectLighting: true,
      caustics: false
    };

    this.giConfig = {
      enabled: false,
      bounces: 2,
      intensity: 0.5,
      radius: 10,
      quality: 'medium'
    };

    this.aoConfig = {
      enabled: true,
      radius: 0.5,
      intensity: 1.0,
      quality: 'medium',
      samples: 16
    };

    this.initializeRayTracing();
  }

  static getInstance(scene: THREE.Scene, renderer: THREE.WebGLRenderer): AdvancedLighting {
    if (!AdvancedLighting.instance) {
      AdvancedLighting.instance = new AdvancedLighting(scene, renderer);
    }
    return AdvancedLighting.instance;
  }

  private initializeRayTracing(): void {
    // Inicializar ray tracing (simulação software)
    // Em produção, seria usado um renderer dedicado como WebGL Path Tracing
  }

  // Sistema de iluminação principal
  createLight(name: string, config: LightConfig): THREE.Light {
    let light: THREE.Light;

    switch (config.type) {
      case 'directional':
        light = this.createDirectionalLight(config);
        break;
      case 'point':
        light = this.createPointLight(config);
        break;
      case 'spot':
        light = this.createSpotLight(config);
        break;
      case 'area':
        light = this.createAreaLight(config);
        break;
      case 'environment':
        light = this.createEnvironmentLight(config);
        break;
      default:
        throw new Error(`Tipo de luz não suportado: ${config.type}`);
    }

    // Configurar sombras
    if (config.castShadow && light instanceof THREE.DirectionalLight ||
        light instanceof THREE.PointLight || light instanceof THREE.SpotLight) {
      this.configureShadows(light as any, config);
    }

    this.lights.set(name, light);
    this.scene.add(light);

    return light;
  }

  private createDirectionalLight(config: LightConfig): THREE.DirectionalLight {
    const light = new THREE.DirectionalLight(config.color, config.intensity);

    if (config.position) {
      light.position.copy(config.position);
    }

    if (config.target) {
      light.target.position.copy(config.target);
      this.scene.add(light.target);
    }

    return light;
  }

  private createPointLight(config: LightConfig): THREE.PointLight {
    const light = new THREE.PointLight(
      config.color,
      config.intensity,
      config.distance || 0,
      config.decay || 1
    );

    if (config.position) {
      light.position.copy(config.position);
    }

    return light;
  }

  private createSpotLight(config: LightConfig): THREE.SpotLight {
    const light = new THREE.SpotLight(
      config.color,
      config.intensity,
      config.distance || 0,
      config.angle || Math.PI / 6,
      config.penumbra || 0,
      config.decay || 1
    );

    if (config.position) {
      light.position.copy(config.position);
    }

    if (config.target) {
      light.target.position.copy(config.target);
      this.scene.add(light.target);
    }

    return light;
  }

  private createAreaLight(config: LightConfig): THREE.Light {
    // Simular luz de área usando múltiplas point lights
    const group = new THREE.Group();
    const width = config.width || 2;
    const height = config.height || 2;
    const samples = 4; // Número de luzes para simular área

    for (let i = 0; i < samples; i++) {
      for (let j = 0; j < samples; j++) {
        const pointLight = new THREE.PointLight(
          config.color,
          config.intensity / (samples * samples),
          config.distance || 10,
          config.decay || 2
        );

        const x = (i / (samples - 1) - 0.5) * width;
        const y = (j / (samples - 1) - 0.5) * height;

        if (config.position) {
          pointLight.position.copy(config.position);
          pointLight.position.x += x;
          pointLight.position.y += y;
        }

        group.add(pointLight);
      }
    }

    return group as any;
  }

  private createEnvironmentLight(config: LightConfig): THREE.Light {
    // Luz ambiente com HDR
    const ambientLight = new THREE.AmbientLight(config.color, config.intensity);

    // Adicionar luz hemisférica para mais realismo
    const hemisphereLight = new THREE.HemisphereLight(
      config.color,
      new THREE.Color(0x000000),
      config.intensity * 0.3
    );

    const group = new THREE.Group();
    group.add(ambientLight);
    group.add(hemisphereLight);

    return group as any;
  }

  private configureShadows(light: THREE.DirectionalLight | THREE.PointLight | THREE.SpotLight, config: LightConfig): void {
    light.castShadow = true;
    light.shadow.mapSize.width = config.shadowMapSize;
    light.shadow.mapSize.height = config.shadowMapSize;
    light.shadow.bias = config.shadowBias;
    light.shadow.radius = config.shadowRadius;

    // Configurações específicas por tipo
    if (light instanceof THREE.DirectionalLight) {
      light.shadow.camera.near = 0.5;
      light.shadow.camera.far = 500;
      light.shadow.camera.left = -50;
      light.shadow.camera.right = 50;
      light.shadow.camera.top = 50;
      light.shadow.camera.bottom = -50;
    } else if (light instanceof THREE.PointLight) {
      light.shadow.camera.near = 0.5;
      light.shadow.camera.far = 500;
    } else if (light instanceof THREE.SpotLight) {
      light.shadow.camera.near = 0.5;
      light.shadow.camera.far = 500;
      light.shadow.camera.fov = (config.angle || Math.PI / 6) * 180 / Math.PI;
    }
  }

  // Sistema de Ray Tracing
  enableRayTracing(config?: Partial<RayTracingConfig>): void {
    this.rayTracingConfig = { ...this.rayTracingConfig, ...config, enabled: true };

    // Em produção, inicializar renderer de path tracing
    this.initializePathTracing();
  }

  disableRayTracing(): void {
    this.rayTracingConfig.enabled = false;
  }

  private initializePathTracing(): void {
    // Simulação de path tracing
    // Em produção, seria usado three.js-path-tracing ou similar
    if (this.rayTracingConfig.enabled) {
      // Configurar renderer para ray tracing
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      this.renderer.outputColorSpace = THREE.SRGBColorSpace;
      this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
      this.renderer.toneMappingExposure = 1.0;
    }
  }

  // Sistema de Global Illumination
  enableGlobalIllumination(config?: Partial<GlobalIlluminationConfig>): void {
    this.giConfig = { ...this.giConfig, ...config, enabled: true };

    // Inicializar texturas de GI
    this.initializeGITextures();
  }

  disableGlobalIllumination(): void {
    this.giConfig.enabled = false;
    this.clearGITextures();
  }

  private initializeGITextures(): void {
    // Criar texturas para simular GI
    // Em produção, seria usado light baking ou real-time GI
    const size = 512;

    this.scene.traverse((object) => {
      if (object instanceof THREE.Mesh && object.material) {
        const giTexture = this.generateGITexture(size);
        this.giTextures.set(object.uuid, giTexture);

        // Aplicar ao material
        const material = object.material as THREE.MeshStandardMaterial;
        if (material.lightMap) {
          material.lightMap = giTexture;
        }
      }
    });
  }

  private generateGITexture(size: number): THREE.Texture {
    // Gerar textura procedural para simular GI
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext('2d')!;

    // Criar padrão de iluminação indireta
    const imageData = context.createImageData(size, size);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      const x = (i / 4) % size;
      const y = Math.floor((i / 4) / size);

      // Simular iluminação indireta baseada na posição
      const illumination = Math.sin(x * 0.01) * Math.cos(y * 0.01) * 0.5 + 0.5;
      const intensity = illumination * this.giConfig.intensity;

      data[i] = intensity * 255;     // R
      data[i + 1] = intensity * 255; // G
      data[i + 2] = intensity * 255; // B
      data[i + 3] = 255;             // A
    }

    context.putImageData(imageData, 0, 0);

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;

    return texture;
  }

  private clearGITextures(): void {
    this.giTextures.forEach(texture => texture.dispose());
    this.giTextures.clear();
  }

  // Sistema de Ambient Occlusion
  enableAmbientOcclusion(config?: Partial<AmbientOcclusionConfig>): void {
    this.aoConfig = { ...this.aoConfig, ...config, enabled: true };

    this.initializeAOTextures();
  }

  disableAmbientOcclusion(): void {
    this.aoConfig.enabled = false;
    this.clearAOTextures();
  }

  private initializeAOTextures(): void {
    this.scene.traverse((object) => {
      if (object instanceof THREE.Mesh && object.material) {
        const aoTexture = this.generateAOTexture();
        this.aoTextures.set(object.uuid, aoTexture);

        // Aplicar ao material
        const material = object.material as THREE.MeshStandardMaterial;
        if (material.aoMap) {
          material.aoMap = aoTexture;
          material.aoMapIntensity = this.aoConfig.intensity;
        }
      }
    });
  }

  private generateAOTexture(): THREE.Texture {
    // Gerar textura procedural de AO
    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext('2d')!;

    const imageData = context.createImageData(size, size);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      // Simular oclusão ambiente baseada em algoritmos simples
      const occlusion = Math.random() * 0.3 + 0.7; // 0.7-1.0 range

      data[i] = occlusion * 255;     // R
      data[i + 1] = occlusion * 255; // G
      data[i + 2] = occlusion * 255; // B
      data[i + 3] = 255;             // A
    }

    context.putImageData(imageData, 0, 0);

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;

    return texture;
  }

  private clearAOTextures(): void {
    this.aoTextures.forEach(texture => texture.dispose());
    this.aoTextures.clear();
  }

  // Sistema de iluminação adaptativa
  updateAdaptiveLighting(camera: THREE.Camera): void {
    // Ajustar iluminação baseado na posição da câmera
    this.lights.forEach((light, name) => {
      this.adaptLightToCamera(light, camera);
    });

    // Atualizar GI se necessário
    if (this.giConfig.enabled) {
      this.updateGIForCamera(camera);
    }
  }

  private adaptLightToCamera(light: THREE.Light, camera: THREE.Camera): void {
    const distance = light.position.distanceTo(camera.position);

    // Ajustar intensidade baseado na distância
    if (distance > 50) {
      light.intensity *= 0.8;
    } else if (distance < 10) {
      light.intensity *= 1.2;
    }

    // Limitar intensidade
    light.intensity = Math.max(0.1, Math.min(2.0, light.intensity));
  }

  private updateGIForCamera(camera: THREE.Camera): void {
    // Atualizar texturas de GI baseado na posição da câmera
    // Em produção, seria um sistema mais sofisticado
  }

  // Métodos de controle de luzes
  getLight(name: string): THREE.Light | null {
    return this.lights.get(name) || null;
  }

  updateLight(name: string, config: Partial<LightConfig>): void {
    const light = this.lights.get(name);
    if (!light) return;

    if (config.intensity !== undefined) light.intensity = config.intensity;
    if (config.color) light.color = config.color;

    if (config.position && 'position' in light) {
      (light as any).position.copy(config.position);
    }

    if (config.target && 'target' in light) {
      (light as any).target.position.copy(config.target);
    }
  }

  removeLight(name: string): void {
    const light = this.lights.get(name);
    if (light) {
      this.scene.remove(light);
      this.lights.delete(name);
    }
  }

  // Configuração de presets de iluminação
  applyLightingPreset(preset: 'studio' | 'outdoor' | 'indoor' | 'dramatic' | 'neutral'): void {
    // Limpar luzes existentes
    this.clearAllLights();

    switch (preset) {
      case 'studio':
        this.applyStudioLighting();
        break;
      case 'outdoor':
        this.applyOutdoorLighting();
        break;
      case 'indoor':
        this.applyIndoorLighting();
        break;
      case 'dramatic':
        this.applyDramaticLighting();
        break;
      case 'neutral':
        this.applyNeutralLighting();
        break;
    }
  }

  private applyStudioLighting(): void {
    // Iluminação de estúdio profissional
    this.createLight('key', {
      type: 'directional',
      intensity: 1.2,
      color: new THREE.Color(0xffffff),
      position: new THREE.Vector3(5, 5, 5),
      target: new THREE.Vector3(0, 1.6, 0),
      castShadow: true,
      shadowMapSize: 2048,
      shadowBias: -0.0001,
      shadowRadius: 4
    });

    this.createLight('fill', {
      type: 'directional',
      intensity: 0.4,
      color: new THREE.Color(0x87CEEB),
      position: new THREE.Vector3(-3, 3, 3),
      target: new THREE.Vector3(0, 1.6, 0),
      castShadow: false,
      shadowMapSize: 1024,
      shadowBias: 0,
      shadowRadius: 2
    });

    this.createLight('rim', {
      type: 'directional',
      intensity: 0.6,
      color: new THREE.Color(0xffffff),
      position: new THREE.Vector3(0, 2, -5),
      target: new THREE.Vector3(0, 1.6, 0),
      castShadow: false,
      shadowMapSize: 1024,
      shadowBias: 0,
      shadowRadius: 2
    });
  }

  private applyOutdoorLighting(): void {
    // Iluminação externa natural
    this.createLight('sun', {
      type: 'directional',
      intensity: 1.5,
      color: new THREE.Color(0xFFF8DC),
      position: new THREE.Vector3(10, 10, 5),
      target: new THREE.Vector3(0, 0, 0),
      castShadow: true,
      shadowMapSize: 4096,
      shadowBias: -0.0002,
      shadowRadius: 8
    });

    this.createLight('sky', {
      type: 'environment',
      intensity: 0.3,
      color: new THREE.Color(0x87CEEB),
      castShadow: false,
      shadowMapSize: 512,
      shadowBias: 0,
      shadowRadius: 1
    });
  }

  private applyIndoorLighting(): void {
    // Iluminação interna
    this.createLight('ceiling', {
      type: 'point',
      intensity: 0.8,
      color: new THREE.Color(0xFFF8DC),
      position: new THREE.Vector3(0, 4, 0),
      distance: 8,
      decay: 2,
      castShadow: true,
      shadowMapSize: 1024,
      shadowBias: -0.0001,
      shadowRadius: 4
    });

    this.createLight('ambient', {
      type: 'environment',
      intensity: 0.2,
      color: new THREE.Color(0xFFE4B5),
      castShadow: false,
      shadowMapSize: 512,
      shadowBias: 0,
      shadowRadius: 1
    });
  }

  private applyDramaticLighting(): void {
    // Iluminação dramática
    this.createLight('main', {
      type: 'spot',
      intensity: 2.0,
      color: new THREE.Color(0xFFA500),
      position: new THREE.Vector3(3, 5, 3),
      target: new THREE.Vector3(0, 1.6, 0),
      distance: 10,
      angle: Math.PI / 4,
      penumbra: 0.1,
      decay: 2,
      castShadow: true,
      shadowMapSize: 2048,
      shadowBias: -0.0001,
      shadowRadius: 6
    });

    this.createLight('accent', {
      type: 'point',
      intensity: 0.3,
      color: new THREE.Color(0x4169E1),
      position: new THREE.Vector3(-2, 2, -2),
      distance: 6,
      decay: 2,
      castShadow: false,
      shadowMapSize: 512,
      shadowBias: 0,
      shadowRadius: 2
    });
  }

  private applyNeutralLighting(): void {
    // Iluminação neutra balanceada
    this.createLight('balanced', {
      type: 'directional',
      intensity: 1.0,
      color: new THREE.Color(0xffffff),
      position: new THREE.Vector3(1, 1, 1),
      target: new THREE.Vector3(0, 0, 0),
      castShadow: true,
      shadowMapSize: 2048,
      shadowBias: -0.0001,
      shadowRadius: 4
    });

    this.createLight('ambient', {
      type: 'environment',
      intensity: 0.4,
      color: new THREE.Color(0xF5F5F5),
      castShadow: false,
      shadowMapSize: 512,
      shadowBias: 0,
      shadowRadius: 1
    });
  }

  private clearAllLights(): void {
    this.lights.forEach((light, name) => {
      this.scene.remove(light);
    });
    this.lights.clear();
  }

  // Otimização de performance
  optimizeForPerformance(): void {
    // Reduzir qualidade de sombras
    this.lights.forEach(light => {
      if ('shadow' in light && light.shadow) {
        const shadow = (light as any).shadow;
        shadow.mapSize.width = Math.min(shadow.mapSize.width, 1024);
        shadow.mapSize.height = Math.min(shadow.mapSize.height, 1024);
        shadow.radius = Math.min(shadow.radius, 2);
      }
    });

    // Desabilitar ray tracing se estiver lento
    if (this.rayTracingConfig.enabled) {
      this.rayTracingConfig.samples = Math.min(this.rayTracingConfig.samples, 4);
    }
  }

  optimizeForQuality(): void {
    // Aumentar qualidade de sombras
    this.lights.forEach(light => {
      if ('shadow' in light && light.shadow) {
        const shadow = (light as any).shadow;
        shadow.mapSize.width = Math.max(shadow.mapSize.width, 2048);
        shadow.mapSize.height = Math.max(shadow.mapSize.height, 2048);
        shadow.radius = Math.max(shadow.radius, 4);
      }
    });

    // Melhorar ray tracing
    if (this.rayTracingConfig.enabled) {
      this.rayTracingConfig.samples = Math.max(this.rayTracingConfig.samples, 32);
    }
  }

  // Limpeza de recursos
  dispose(): void {
    this.clearAllLights();
    this.clearGITextures();
    this.clearAOTextures();
  }
}

// Configurações padrão para diferentes tipos de iluminação
export const LIGHT_PRESETS = {
  studio: {
    key: {
      type: 'directional' as const,
      intensity: 1.2,
      color: new THREE.Color(0xffffff),
      position: new THREE.Vector3(5, 5, 5),
      target: new THREE.Vector3(0, 1.6, 0),
      castShadow: true,
      shadowMapSize: 2048,
      shadowBias: -0.0001,
      shadowRadius: 4
    },
    fill: {
      type: 'directional' as const,
      intensity: 0.4,
      color: new THREE.Color(0x87CEEB),
      position: new THREE.Vector3(-3, 3, 3),
      target: new THREE.Vector3(0, 1.6, 0),
      castShadow: false,
      shadowMapSize: 1024,
      shadowBias: 0,
      shadowRadius: 2
    },
    rim: {
      type: 'directional' as const,
      intensity: 0.6,
      color: new THREE.Color(0xffffff),
      position: new THREE.Vector3(0, 2, -5),
      target: new THREE.Vector3(0, 1.6, 0),
      castShadow: false,
      shadowMapSize: 1024,
      shadowBias: 0,
      shadowRadius: 2
    }
  }
};
